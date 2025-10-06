import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get user's payout history
    const { data: payouts, error: payoutsError } = await supabase
      .from('user_payouts')
      .select(`
        *,
        referral_payouts!referral_payouts_referrer_id_fkey(*)
      `)
      .eq('user_id', userId)
      .order('period_start', { ascending: false })
      .range(offset, offset + limit - 1)

    if (payoutsError) {
      console.error('Error fetching payout history:', payoutsError)
      return NextResponse.json(
        { error: 'Failed to fetch payout history' },
        { status: 500 }
      )
    }

    // Get user's interaction scores for context
    const { data: interactionScores, error: scoresError } = await supabase
      .from('user_interaction_scores')
      .select('*')
      .eq('user_id', userId)
      .order('period_start', { ascending: false })
      .limit(limit)

    if (scoresError) {
      console.error('Error fetching interaction scores:', scoresError)
    }

    // Combine payout and interaction data
    const combinedData = payouts?.map(payout => {
      const interactionScore = interactionScores?.find(
        score => score.period_start === payout.period_start && 
                 score.period_end === payout.period_end
      )

      const referralBonuses = payout.referral_payouts || []
      const totalReferralBonus = referralBonuses.reduce(
        (sum: number, bonus: { referral_bonus_sol?: number }) => sum + (bonus.referral_bonus_sol || 0), 0
      )

      return {
        period: {
          start: payout.period_start,
          end: payout.period_end
        },
        payout: {
          total: payout.total_payout_sol,
          final: payout.final_payout_sol,
          status: payout.payout_status,
          txHash: payout.payment_tx_hash
        },
        referralBonus: {
          total: totalReferralBonus,
          count: referralBonuses.length
        },
        interactions: interactionScore ? {
          posts: interactionScore.posts_created,
          comments: interactionScore.comments_replies_created,
          likes: interactionScore.likes_received,
          follows: interactionScore.follows_received,
          totalScore: interactionScore.total_score
        } : null,
        createdAt: payout.created_at
      }
    }) || []

    return NextResponse.json({
      success: true,
      payouts: combinedData,
      pagination: {
        limit,
        offset,
        hasMore: payouts && payouts.length === limit
      }
    })

  } catch (error) {
    console.error('Error fetching payout history:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
