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

// Interaction weights
const INTERACTION_WEIGHTS = {
  POST_CREATED: 3.0,
  COMMENT_REPLY_CREATED: 1.0,
  FOLLOW_RECEIVED: 0.5,
  LIKE_RECEIVED: 0.25
} as const

// Helper function to format period name
function formatPeriodName(start: string, end: string): string {
  const startDate = new Date(start)
  const endDate = new Date(end)
  const month = startDate.toLocaleString('default', { month: 'long' })
  const year = startDate.getFullYear()
  const startDay = startDate.getDate()
  const endDay = endDate.getDate()
  
  return `${month} ${year} - Period ${startDay <= 14 ? '1' : '2'}`
}

export async function POST(request: NextRequest) {
  try {
    const { periodStart, periodEnd } = await request.json()

    if (!periodStart || !periodEnd) {
      return NextResponse.json(
        { error: 'Missing required fields: periodStart, periodEnd' },
        { status: 400 }
      )
    }

    // Get revenue data for this period from biweekly_periods
    const { data: revenueData, error: revenueError } = await supabase
      .from('biweekly_periods')
      .select('*')
      .eq('period_start', periodStart)
      .eq('period_end', periodEnd)
      .single()

    if (revenueError || !revenueData) {
      return NextResponse.json(
        { error: 'Revenue data not found for this period. Please set revenue data first.' },
        { status: 404 }
      )
    }

    const { pumpfun_fees_sol, platform_revenue_sol, total_pool_sol } = revenueData

    // Get all users with Pro subscriptions active during the period
    const { data: proUsers, error: proUsersError } = await supabase
      .from('pro_subscriptions')
      .select(`
        user_id,
        activated_at,
        expires_at
      `)
      .eq('status', 'active')
      .lte('activated_at', periodEnd)
      .gte('expires_at', periodStart)

    if (proUsersError) {
      console.error('Error fetching Pro users:', proUsersError)
      return NextResponse.json(
        { error: 'Failed to fetch Pro users' },
        { status: 500 }
      )
    }

    const proUserIds = [...new Set(proUsers?.map(p => p.user_id) || [])]

    if (proUserIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No Pro users found for this period',
        totalPool: total_pool_sol,
        eligibleUsers: 0
      })
    }

    // Calculate interaction scores for each Pro user
    const userScores = []
    let totalScore = 0

    for (const userId of proUserIds) {
      // Get posts created in period
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('id')
        .eq('user_id', userId)
        .gte('created_at', periodStart)
        .lte('created_at', periodEnd)

      if (postsError) {
        console.error(`Error fetching posts for user ${userId}:`, postsError)
        continue
      }

      // Get comments/replies created in period
      const { data: replies, error: repliesError } = await supabase
        .from('replies')
        .select('id')
        .eq('user_id', userId)
        .gte('created_at', periodStart)
        .lte('created_at', periodEnd)

      if (repliesError) {
        console.error(`Error fetching replies for user ${userId}:`, repliesError)
        continue
      }

      // Get likes received in period
      const { data: likesReceived, error: likesError } = await supabase
        .from('likes')
        .select(`
          id,
          posts!inner(user_id),
          replies!inner(user_id)
        `)
        .or(`posts.user_id.eq.${userId},replies.user_id.eq.${userId}`)
        .gte('created_at', periodStart)
        .lte('created_at', periodEnd)

      if (likesError) {
        console.error(`Error fetching likes for user ${userId}:`, likesError)
        continue
      }

      // Get follows received in period
      const { data: followsReceived, error: followsError } = await supabase
        .from('follows')
        .select('id')
        .eq('following_id', userId)
        .gte('created_at', periodStart)
        .lte('created_at', periodEnd)

      if (followsError) {
        console.error(`Error fetching follows for user ${userId}:`, followsError)
        continue
      }

      // Calculate user score
      const postsCreated = posts?.length || 0
      const commentsRepliesCreated = replies?.length || 0
      const likesReceivedCount = likesReceived?.length || 0
      const followsReceivedCount = followsReceived?.length || 0

      const userScore = (
        postsCreated * INTERACTION_WEIGHTS.POST_CREATED +
        commentsRepliesCreated * INTERACTION_WEIGHTS.COMMENT_REPLY_CREATED +
        likesReceivedCount * INTERACTION_WEIGHTS.LIKE_RECEIVED +
        followsReceivedCount * INTERACTION_WEIGHTS.FOLLOW_RECEIVED
      )

      if (userScore > 0) {
        userScores.push({
          userId,
          postsCreated,
          commentsRepliesCreated,
          likesReceived: likesReceivedCount,
          followsReceived: followsReceivedCount,
          userScore
        })
        totalScore += userScore

        // Store interaction scores
        await supabase
          .from('user_interaction_scores')
          .upsert({
            user_id: userId,
            period_start: periodStart,
            period_end: periodEnd,
            posts_created: postsCreated,
            comments_replies_created: commentsRepliesCreated,
            likes_received: likesReceivedCount,
            follows_received: followsReceivedCount,
            total_score: userScore,
            is_pro_eligible: true
          })
      }
    }

    // Calculate payouts
    const payouts = []
    for (const userScore of userScores) {
      const userPayout = (userScore.userScore / totalScore) * total_pool_sol
      
      payouts.push({
        userId: userScore.userId,
        payout: userPayout,
        score: userScore.userScore,
        interactions: {
          posts: userScore.postsCreated,
          comments: userScore.commentsRepliesCreated,
          likes: userScore.likesReceived,
          follows: userScore.followsReceived
        }
      })

      // Store user payout
      await supabase
        .from('user_payouts')
        .upsert({
          user_id: userScore.userId,
          period_start: periodStart,
          period_end: periodEnd,
          total_payout_sol: userPayout,
          final_payout_sol: userPayout,
          payout_status: 'pending'
        })
    }

    // Calculate referral bonuses
    const referralBonuses = []
    for (const payout of payouts) {
      // Get referrals for this user
      const { data: referrals } = await supabase
        .from('profiles')
        .select('referred_by')
        .eq('id', payout.userId)
        .not('referred_by', 'is', null)
        .single()

      if (referrals?.referred_by) {
        const referralBonus = payout.payout * 0.05 // 5% bonus
        
        referralBonuses.push({
          referrerId: referrals.referred_by,
          referredUserId: payout.userId,
          bonus: referralBonus,
          referredUserPayout: payout.payout
        })

        // Store referral payout
        await supabase
          .from('referral_payouts')
          .upsert({
            referrer_id: referrals.referred_by,
            referred_user_id: payout.userId,
            period_start: periodStart,
            period_end: periodEnd,
            referred_user_payout_sol: payout.payout,
            referral_bonus_sol: referralBonus,
            payout_status: 'pending'
          })
      }
    }

    // Update period status to 'calculated'
    await supabase
      .from('biweekly_periods')
      .update({ revenue_status: 'calculated' })
      .eq('period_start', periodStart)
      .eq('period_end', periodEnd)

    // Create notifications for all users with payouts
    const notificationPromises = []
    
    // Create notifications for user payouts
    for (const payout of payouts) {
      const notificationPromise = supabase
        .from('notifications')
        .insert({
          user_id: payout.userId,
          type: 'payout_available',
          actor_id: payout.userId,
          metadata: {
            period_start: periodStart,
            period_end: periodEnd,
            payout_amount_sol: payout.payout,
            interaction_breakdown: payout.interactions,
            notification_type: 'payout_earned',
            claim_action: 'claim_payout',
              title: `Revenue Share Payout Available!`,
              message: `You earned ${payout.payout.toFixed(4)} SOL for ${formatPeriodName(periodStart, periodEnd)}. Your engagement: ${payout.interactions.posts} posts, ${payout.interactions.comments} comments, ${payout.interactions.likes} likes received, ${payout.interactions.follows} follows received.`,
            action_text: 'Claim Payout'
          }
        })
      notificationPromises.push(notificationPromise)
    }

    // Create notifications for referral bonuses
    for (const bonus of referralBonuses) {
      const notificationPromise = supabase
        .from('notifications')
        .insert({
          user_id: bonus.referrerId,
          type: 'payout_available',
          actor_id: bonus.referrerId,
          metadata: {
            period_start: periodStart,
            period_end: periodEnd,
            payout_amount_sol: bonus.bonus,
            interaction_breakdown: null,
            notification_type: 'referral_bonus',
            claim_action: 'claim_payout',
              title: `Referral Bonus Earned!`,
              message: `You earned ${bonus.bonus.toFixed(4)} SOL referral bonus for ${formatPeriodName(periodStart, periodEnd)} from users you referred.`,
            action_text: 'Claim Bonus'
          }
        })
      notificationPromises.push(notificationPromise)
    }

    // Execute all notification creation promises
    await Promise.all(notificationPromises)

    return NextResponse.json({
      success: true,
      period: { start: periodStart, end: periodEnd },
      revenue: {
        pumpfunFees: pumpfun_fees_sol,
        platformRevenue: platform_revenue_sol,
        totalPool: total_pool_sol
      },
      eligibleUsers: userScores.length,
      totalScore,
      payouts,
      referralBonuses,
      summary: {
        totalPayoutAmount: payouts.reduce((sum, p) => sum + p.payout, 0),
        totalReferralBonuses: referralBonuses.reduce((sum, r) => sum + r.bonus, 0)
      }
    })

  } catch (error) {
    console.error('Error calculating bi-weekly revenue:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
