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

const INTERACTION_WEIGHTS = {
  POST_CREATED: 3.0,
  COMMENT_REPLY_CREATED: 1.0,
  FOLLOW_RECEIVED: 0.5,
  LIKE_RECEIVED: 0.25
}

async function calculateUserInteractionScore(userId: string, periodStart: string, periodEnd: string): Promise<number> {
  // 1. Count posts created by the user in the period
  const { data: postsCreated } = await supabase
    .from('posts')
    .select('id, created_at')
    .eq('user_id', userId)
    .gte('created_at', periodStart)
    .lte('created_at', periodEnd + 'T23:59:59.999Z')

  // 2. Count replies/comments created by the user in the period
  const { data: repliesCreated } = await supabase
    .from('replies')
    .select('id, created_at')
    .eq('user_id', userId)
    .gte('created_at', periodStart)
    .lte('created_at', periodEnd + 'T23:59:59.999Z')

  // 3. Count likes received on user's posts in the period
  const { data: likesOnPosts } = await supabase
    .from('likes')
    .select('id, created_at, post_id')
    .not('post_id', 'is', null)
    .gte('created_at', periodStart)
    .lte('created_at', periodEnd + 'T23:59:59.999Z')
    .in('post_id', postsCreated?.map(post => post.id) || [])

  // 4. Count likes received on user's replies in the period
  const { data: likesOnReplies } = await supabase
    .from('likes')
    .select('id, created_at, reply_id')
    .not('reply_id', 'is', null)
    .gte('created_at', periodStart)
    .lte('created_at', periodEnd + 'T23:59:59.999Z')
    .in('reply_id', repliesCreated?.map(reply => reply.id) || [])

  // 5. Count follows received by the user in the period
  const { data: followsReceived } = await supabase
    .from('follows')
    .select('id, created_at')
    .eq('following_id', userId)
    .gte('created_at', periodStart)
    .lte('created_at', periodEnd + 'T23:59:59.999Z')

  // Calculate interaction score
  const postsCreatedCount = postsCreated?.length || 0
  const repliesCreatedCount = repliesCreated?.length || 0
  const likesReceivedCount = (likesOnPosts?.length || 0) + (likesOnReplies?.length || 0)
  const followsReceivedCount = followsReceived?.length || 0

  const interactionScore = 
    (postsCreatedCount * INTERACTION_WEIGHTS.POST_CREATED) +
    (repliesCreatedCount * INTERACTION_WEIGHTS.COMMENT_REPLY_CREATED) +
    (followsReceivedCount * INTERACTION_WEIGHTS.FOLLOW_RECEIVED) +
    (likesReceivedCount * INTERACTION_WEIGHTS.LIKE_RECEIVED)

  return interactionScore
}

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
      .select('total_pool_sol, pumpfun_fees_sol, platform_revenue_sol, pumpfun_pool_sol, platform_pool_sol')
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

    if (totalPool <= 0) {
      return NextResponse.json(
        { error: 'No revenue pool available for this period' },
        { status: 400 }
      )
    }

    // Get all users who had activity during this period
    const { data: activeUsers, error: usersError } = await supabase
      .from('profiles')
      .select('id, username')
      .or(`id.in.(${
        // Get users who created posts
        supabase.from('posts')
          .select('user_id')
          .gte('created_at', periodStart)
          .lte('created_at', periodEnd + 'T23:59:59.999Z')
          .then(({ data }) => data?.map(p => p.user_id).join(',') || '')
      }),id.in.(${
        // Get users who created replies
        supabase.from('replies')
          .select('user_id')
          .gte('created_at', periodStart)
          .lte('created_at', periodEnd + 'T23:59:59.999Z')
          .then(({ data }) => data?.map(r => r.user_id).join(',') || '')
      }),id.in.(${
        // Get users who received likes
        supabase.from('likes')
          .select('post_id, reply_id')
          .gte('created_at', periodStart)
          .lte('created_at', periodEnd + 'T23:59:59.999Z')
          .then(async ({ data }) => {
            const postIds = data?.filter(l => l.post_id).map(l => l.post_id) || []
            const replyIds = data?.filter(l => l.reply_id).map(l => l.reply_id) || []
            
            const { data: posts } = await supabase.from('posts').select('user_id').in('id', postIds)
            const { data: replies } = await supabase.from('replies').select('user_id').in('id', replyIds)
            
            const userIds = [
              ...(posts?.map(p => p.user_id) || []),
              ...(replies?.map(r => r.user_id) || [])
            ]
            return [...new Set(userIds)].join(',')
          })
      }),id.in.(${
        // Get users who received follows
        supabase.from('follows')
          .select('following_id')
          .gte('created_at', periodStart)
          .lte('created_at', periodEnd + 'T23:59:59.999Z')
          .then(({ data }) => data?.map(f => f.following_id).join(',') || '')
      })`)

    if (usersError) {
      console.error('Error fetching active users:', usersError)
      return NextResponse.json(
        { error: 'Failed to fetch active users' },
        { status: 500 }
      )
    }

    // Calculate interaction scores for all active users
    const userEarnings = []
    let totalScore = 0

    for (const user of activeUsers || []) {
      const score = await calculateUserInteractionScore(user.id, periodStart, periodEnd)
      if (score > 0) {
        userEarnings.push({
          userId: user.id,
          username: user.username,
          interactionScore: score
        })
        totalScore += score
      }
    }

    // Calculate payouts
    const payouts = userEarnings.map(user => {
      const share = totalScore > 0 ? user.interactionScore / totalScore : 0
      const payout = share * totalPool
      
      return {
        ...user,
        share: share,
        payoutSOL: payout
      }
    })

    // Sort by payout amount (highest first)
    payouts.sort((a, b) => b.payoutSOL - a.payoutSOL)

    // Calculate total payout verification
    const totalPayout = payouts.reduce((sum, user) => sum + user.payoutSOL, 0)

    return NextResponse.json({
      success: true,
      period: { start: periodStart, end: periodEnd },
      revenueData: {
        pumpfunFees: periodData.pumpfun_fees_sol,
        platformRevenue: periodData.platform_revenue_sol,
        pumpfunPool: periodData.pumpfun_pool_sol,
        platformPool: periodData.platform_pool_sol,
        totalPool: totalPool
      },
      userEarnings: {
        totalUsers: payouts.length,
        totalScore: totalScore,
        totalPayout: totalPayout,
        payouts: payouts,
        verification: {
          totalPool: totalPool,
          totalPayout: totalPayout,
          difference: Math.abs(totalPool - totalPayout),
          isBalanced: Math.abs(totalPool - totalPayout) < 0.0001
        }
      },
      message: `Successfully calculated earnings for ${payouts.length} users. Total pool: ${totalPool.toFixed(4)} SOL, Total payout: ${totalPayout.toFixed(4)} SOL`
    })

  } catch (error) {
    console.error('Error calculating user earnings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
