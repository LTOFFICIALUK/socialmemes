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

// Interaction weights
const INTERACTION_WEIGHTS = {
  POST_CREATED: 3.0,
  COMMENT_REPLY_CREATED: 1.0,
  FOLLOW_RECEIVED: 0.5,
  LIKE_RECEIVED: 0.25
} as const

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get current bi-weekly period (assuming it starts on 1st and 15th of each month)
    const now = new Date()
    const currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), 
      now.getDate() <= 14 ? 1 : 15)
    const currentPeriodEnd = new Date(now.getFullYear(), now.getMonth(), 
      now.getDate() <= 14 ? 14 : new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate())

    // Check if user has active Pro subscription
    const { data: proSubscription, error: proError } = await supabase
      .from('pro_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .gte('activated_at', currentPeriodStart.toISOString())
      .lte('expires_at', currentPeriodEnd.toISOString())
      .single()

    if (proError && proError.code !== 'PGRST116') {
      console.error('Error checking Pro subscription:', proError)
      return NextResponse.json(
        { error: 'Failed to check Pro subscription' },
        { status: 500 }
      )
    }

    const isProEligible = !!proSubscription

    if (!isProEligible) {
      return NextResponse.json({
        success: true,
        isProEligible: false,
        message: 'Pro subscription required for payouts',
        period: {
          start: currentPeriodStart.toISOString().split('T')[0],
          end: currentPeriodEnd.toISOString().split('T')[0]
        }
      })
    }

    // Get current period interactions
    const periodStartStr = currentPeriodStart.toISOString()
    const periodEndStr = currentPeriodEnd.toISOString()

    // Get posts created in current period
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('id, created_at')
      .eq('user_id', userId)
      .gte('created_at', periodStartStr)
      .lte('created_at', periodEndStr)

    if (postsError) {
      console.error('Error fetching posts:', postsError)
      return NextResponse.json(
        { error: 'Failed to fetch posts' },
        { status: 500 }
      )
    }

    // Get comments/replies created in current period
    const { data: replies, error: repliesError } = await supabase
      .from('replies')
      .select('id, created_at')
      .eq('user_id', userId)
      .gte('created_at', periodStartStr)
      .lte('created_at', periodEndStr)

    if (repliesError) {
      console.error('Error fetching replies:', repliesError)
      return NextResponse.json(
        { error: 'Failed to fetch replies' },
        { status: 500 }
      )
    }

    // Get likes received in current period
    const { data: likesReceived, error: likesError } = await supabase
      .from('likes')
      .select(`
        id,
        created_at,
        posts!inner(user_id),
        replies!inner(user_id)
      `)
      .or(`posts.user_id.eq.${userId},replies.user_id.eq.${userId}`)
      .gte('created_at', periodStartStr)
      .lte('created_at', periodEndStr)

    if (likesError) {
      console.error('Error fetching likes:', likesError)
      return NextResponse.json(
        { error: 'Failed to fetch likes' },
        { status: 500 }
      )
    }

    // Get follows received in current period
    const { data: followsReceived, error: followsError } = await supabase
      .from('follows')
      .select('id, created_at')
      .eq('following_id', userId)
      .gte('created_at', periodStartStr)
      .lte('created_at', periodEndStr)

    if (followsError) {
      console.error('Error fetching follows:', followsError)
      return NextResponse.json(
        { error: 'Failed to fetch follows' },
        { status: 500 }
      )
    }

    // Calculate current score
    const postsCreated = posts?.length || 0
    const commentsRepliesCreated = replies?.length || 0
    const likesReceivedCount = likesReceived?.length || 0
    const followsReceivedCount = followsReceived?.length || 0

    const currentScore = (
      postsCreated * INTERACTION_WEIGHTS.POST_CREATED +
      commentsRepliesCreated * INTERACTION_WEIGHTS.COMMENT_REPLY_CREATED +
      likesReceivedCount * INTERACTION_WEIGHTS.LIKE_RECEIVED +
      followsReceivedCount * INTERACTION_WEIGHTS.FOLLOW_RECEIVED
    )

    // Get estimated payout (this would need total platform score for accuracy)
    // For now, just return the user's score
    const estimatedPayout = currentScore // This would be calculated against total pool

    return NextResponse.json({
      success: true,
      isProEligible: true,
      period: {
        start: currentPeriodStart.toISOString().split('T')[0],
        end: currentPeriodEnd.toISOString().split('T')[0]
      },
      interactions: {
        postsCreated,
        commentsRepliesCreated,
        likesReceived: likesReceivedCount,
        followsReceived: followsReceivedCount
      },
      score: {
        current: currentScore,
        breakdown: {
          posts: postsCreated * INTERACTION_WEIGHTS.POST_CREATED,
          comments: commentsRepliesCreated * INTERACTION_WEIGHTS.COMMENT_REPLY_CREATED,
          likes: likesReceivedCount * INTERACTION_WEIGHTS.LIKE_RECEIVED,
          follows: followsReceivedCount * INTERACTION_WEIGHTS.FOLLOW_RECEIVED
        }
      },
      estimatedPayout,
      weights: INTERACTION_WEIGHTS
    })

  } catch (error) {
    console.error('Error fetching current score:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
