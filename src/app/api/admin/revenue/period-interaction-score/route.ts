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

    // Get all users with active pro subscriptions
    const { data: proUsers, error: proUsersError } = await supabase
      .from('pro_subscriptions')
      .select('user_id, expires_at')
      .eq('status', 'active')

    if (proUsersError) {
      console.error('Error fetching pro users:', proUsersError)
      return NextResponse.json(
        { error: 'Failed to fetch pro users' },
        { status: 500 }
      )
    }

    // Filter to only users with non-expired subscriptions
    const currentDate = new Date()
    const activeProUserIds = proUsers
      ?.filter(subscription => {
        if (!subscription.expires_at) return true // No expiration date means it doesn't expire
        return new Date(subscription.expires_at) > currentDate
      })
      .map(subscription => subscription.user_id) || []

    if (activeProUserIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active pro users found for this period',
        processedUsers: 0
      })
    }

    // Process each pro user
    const processedUsers = []
    const errors = []

    for (const userId of activeProUserIds) {
      try {
        // 1. Count posts created by the user in the period
        const { data: postsCreated, error: postsError } = await supabase
          .from('posts')
          .select('id, created_at')
          .eq('user_id', userId)
          .gte('created_at', periodStart)
          .lte('created_at', periodEnd + 'T23:59:59.999Z')

        if (postsError) {
          console.error(`Error fetching posts for user ${userId}:`, postsError)
          errors.push(`Failed to fetch posts for user ${userId}`)
          continue
        }

        // 2. Count replies/comments created by the user in the period
        const { data: repliesCreated, error: repliesError } = await supabase
          .from('replies')
          .select('id, created_at')
          .eq('user_id', userId)
          .gte('created_at', periodStart)
          .lte('created_at', periodEnd + 'T23:59:59.999Z')

        if (repliesError) {
          console.error(`Error fetching replies for user ${userId}:`, repliesError)
          errors.push(`Failed to fetch replies for user ${userId}`)
          continue
        }

        // 3. Count likes received on user's posts in the period
        const { data: likesOnPosts, error: likesOnPostsError } = await supabase
          .from('likes')
          .select('id, created_at, post_id')
          .not('post_id', 'is', null)
          .gte('created_at', periodStart)
          .lte('created_at', periodEnd + 'T23:59:59.999Z')
          .in('post_id', postsCreated?.map(post => post.id) || [])

        if (likesOnPostsError) {
          console.error(`Error fetching likes on posts for user ${userId}:`, likesOnPostsError)
          errors.push(`Failed to fetch likes on posts for user ${userId}`)
          continue
        }

        // 4. Count likes received on user's replies in the period
        const { data: likesOnReplies, error: likesOnRepliesError } = await supabase
          .from('likes')
          .select('id, created_at, reply_id')
          .not('reply_id', 'is', null)
          .gte('created_at', periodStart)
          .lte('created_at', periodEnd + 'T23:59:59.999Z')
          .in('reply_id', repliesCreated?.map(reply => reply.id) || [])

        if (likesOnRepliesError) {
          console.error(`Error fetching likes on replies for user ${userId}:`, likesOnRepliesError)
          errors.push(`Failed to fetch likes on replies for user ${userId}`)
          continue
        }

        // 5. Count follows received by the user in the period
        const { data: followsReceived, error: followsError } = await supabase
          .from('follows')
          .select('id, created_at')
          .eq('following_id', userId)
          .gte('created_at', periodStart)
          .lte('created_at', periodEnd + 'T23:59:59.999Z')

        if (followsError) {
          console.error(`Error fetching follows for user ${userId}:`, followsError)
          errors.push(`Failed to fetch follows for user ${userId}`)
          continue
        }

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

        // Save or update the interaction score in the database
        const { error: upsertError } = await supabase
          .from('user_interaction_scores')
          .upsert({
            user_id: userId,
            period_start: periodStart,
            period_end: periodEnd,
            posts_created: postsCreatedCount,
            comments_replies_created: repliesCreatedCount,
            likes_received: likesReceivedCount,
            follows_received: followsReceivedCount,
            total_score: interactionScore,
            is_pro_eligible: true // All users processed here are pro eligible
          }, {
            onConflict: 'user_id,period_start,period_end'
          })

        if (upsertError) {
          console.error(`Error saving interaction score for user ${userId}:`, upsertError)
          errors.push(`Failed to save interaction score for user ${userId}`)
          continue
        }

        processedUsers.push({
          userId,
          interactionScore,
          breakdown: {
            postsCreated: postsCreatedCount,
            repliesCreated: repliesCreatedCount,
            likesReceived: likesReceivedCount,
            followsReceived: followsReceivedCount
          }
        })

      } catch (error) {
        console.error(`Error processing user ${userId}:`, error)
        errors.push(`Error processing user ${userId}: ${error}`)
      }
    }

    return NextResponse.json({
      success: true,
      period: { start: periodStart, end: periodEnd },
      summary: {
        totalProUsers: activeProUserIds.length,
        processedUsers: processedUsers.length,
        errors: errors.length
      },
      processedUsers: processedUsers,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully processed ${processedUsers.length} out of ${activeProUserIds.length} pro users for period ${periodStart} to ${periodEnd}`
    })

  } catch (error) {
    console.error('Error calculating interaction score:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
