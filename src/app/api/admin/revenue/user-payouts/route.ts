import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
})

export async function POST(request: NextRequest) {
  try {
    const { periodStart, periodEnd } = await request.json()

    // Validate input
    if (!periodStart || !periodEnd) {
      return NextResponse.json(
        { error: 'Missing required fields: periodStart, periodEnd' },
        { status: 400 }
      )
    }

    // Validate dates
    const startDate = new Date(periodStart)
    const endDate = new Date(periodEnd)
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      )
    }

    if (startDate >= endDate) {
      return NextResponse.json(
        { error: 'Period start must be before period end' },
        { status: 400 }
      )
    }

    // Get total pool revenue for the period
    const { data: periodData, error: periodError } = await supabase
      .from('biweekly_periods')
      .select('total_pool_sol, pumpfun_fees_sol, platform_revenue_sol, pumpfun_pool_sol, platform_pool_sol, referral_bonus_pool_sol')
      .eq('period_start', periodStart)
      .eq('period_end', periodEnd)
      .single()

    if (periodError || !periodData) {
      return NextResponse.json(
        { error: 'No revenue data found for this period. Please calculate total pool revenue first.' },
        { status: 404 }
      )
    }

    const totalPool = periodData.total_pool_sol || 0
    const pumpfunPool = periodData.pumpfun_pool_sol || 0
    const platformPool = periodData.platform_pool_sol || 0
    const referralBonusPool = periodData.referral_bonus_pool_sol || 0

    if (totalPool <= 0) {
      return NextResponse.json(
        { error: 'No revenue pool available for this period' },
        { status: 400 }
      )
    }

    // Get all user interaction scores for the period
    const { data: interactionScores, error: scoresError } = await supabase
      .from('user_interaction_scores')
      .select('user_id, total_score, posts_created, comments_replies_created, likes_received, follows_received')
      .eq('period_start', periodStart)
      .eq('period_end', periodEnd)
      .eq('is_pro_eligible', true)

    if (scoresError) {
      console.error('Error fetching interaction scores:', scoresError)
      return NextResponse.json(
        { error: 'Failed to fetch user interaction scores' },
        { status: 500 }
      )
    }

    if (!interactionScores || interactionScores.length === 0) {
      return NextResponse.json(
        { error: 'No interaction scores found for this period. Please calculate interaction scores first.' },
        { status: 404 }
      )
    }

    // Calculate total score for all users
    const totalScore = interactionScores.reduce((sum, score) => sum + (score.total_score || 0), 0)

    // If total score is 0, all users get 0 payouts but we still process them
    if (totalScore <= 0) {
      console.log('Total interaction score is 0 - all users will receive 0 payouts')
    }

    // Calculate payouts for each user
    const userPayouts = []
    const errors = []

    for (const userScore of interactionScores) {
      try {
        // Handle case where total score is 0 - all users get 0 payouts
        const userShare = totalScore > 0 ? userScore.total_score / totalScore : 0
        
        // Calculate shares from each pool
        const pumpfunShare = userShare * pumpfunPool
        const platformShare = userShare * platformPool
        const referralBonus = userShare * referralBonusPool
        
        // Calculate total payout
        const totalPayout = pumpfunShare + platformShare + referralBonus
        const finalPayout = totalPayout // Could add additional calculations here

        // Save payout to database using proper upsert logic
        const { error: upsertError } = await supabase
          .from('user_payouts')
          .upsert({
            user_id: userScore.user_id,
            period_start: periodStart,
            period_end: periodEnd,
            pumpfun_share_sol: pumpfunShare,
            platform_share_sol: platformShare,
            total_payout_sol: totalPayout,
            referral_bonus_sol: referralBonus,
            final_payout_sol: finalPayout,
            payout_status: 'pending'
          }, {
            onConflict: 'user_id,period_start,period_end',
            ignoreDuplicates: false
          })

        if (upsertError) {
          console.error(`Error saving payout for user ${userScore.user_id}:`, upsertError)
          errors.push(`Failed to save payout for user ${userScore.user_id}: ${upsertError.message}`)
          continue
        }

        userPayouts.push({
          userId: userScore.user_id,
          interactionScore: userScore.total_score,
          share: userShare,
          pumpfunShare,
          platformShare,
          referralBonus,
          totalPayout,
          finalPayout,
          breakdown: {
            postsCreated: userScore.posts_created,
            commentsRepliesCreated: userScore.comments_replies_created,
            likesReceived: userScore.likes_received,
            followsReceived: userScore.follows_received
          }
        })

      } catch (error) {
        console.error(`Error processing payout for user ${userScore.user_id}:`, error)
        errors.push(`Error processing payout for user ${userScore.user_id}: ${error}`)
      }
    }

    // Sort payouts by final payout amount (highest first)
    userPayouts.sort((a, b) => b.finalPayout - a.finalPayout)

    // Calculate total payout verification
    const totalCalculatedPayout = userPayouts.reduce((sum, payout) => sum + payout.finalPayout, 0)

    return NextResponse.json({
      success: true,
      period: { start: periodStart, end: periodEnd },
      revenueData: {
        totalPool,
        pumpfunPool,
        platformPool,
        referralBonusPool,
        breakdown: {
          pumpfunFees: periodData.pumpfun_fees_sol,
          platformRevenue: periodData.platform_revenue_sol
        }
      },
      payoutSummary: {
        totalUsers: userPayouts.length,
        totalScore,
        totalCalculatedPayout,
        verification: {
          totalPool,
          totalCalculatedPayout,
          difference: Math.abs(totalPool - totalCalculatedPayout),
          isBalanced: Math.abs(totalPool - totalCalculatedPayout) < 0.0001
        }
      },
      userPayouts,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully calculated payouts for ${userPayouts.length} users. Total pool: ${totalPool.toFixed(4)} SOL, Total calculated: ${totalCalculatedPayout.toFixed(4)} SOL`
    })

  } catch (error) {
    console.error('Error calculating user payouts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
