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
    const { action, periodStart, periodEnd } = await request.json()

    if (action !== 'send_mock_notifications') {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

    if (!periodStart || !periodEnd) {
      return NextResponse.json(
        { error: 'Missing period dates' },
        { status: 400 }
      )
    }

    // Get all users (limit to first 50 for testing)
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, username')
      .limit(50)

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      )
    }

    if (!users || users.length === 0) {
      return NextResponse.json({
        success: true,
        notificationsSent: 0,
        message: 'No users found to send notifications to'
      })
    }

    // Helper function to format period name
    const formatPeriodName = (start: string): string => {
      const startDate = new Date(start)
      const month = startDate.toLocaleString('default', { month: 'long' })
      const year = startDate.getFullYear()
      const startDay = startDate.getDate()
      
      return `${month} ${year} - Period ${startDay <= 14 ? '1' : '2'}`
    }

    // Generate mock interaction data
    const generateMockInteractions = () => {
      return {
        posts: Math.floor(Math.random() * 10) + 1, // 1-10 posts
        comments: Math.floor(Math.random() * 20) + 5, // 5-25 comments
        likes: Math.floor(Math.random() * 50) + 10, // 10-60 likes
        follows: Math.floor(Math.random() * 15) + 2 // 2-17 follows
      }
    }

    // Generate mock payout amount
    const generateMockPayout = (interactions: { posts: number; likes: number; follows: number; comments: number }): number => {
      const baseAmount = 0.1 // Base 0.1 SOL
      const postBonus = interactions.posts * 0.05 // 0.05 SOL per post
      const engagementBonus = (interactions.likes + interactions.follows) * 0.002 // 0.002 SOL per like/follow
      const commentBonus = interactions.comments * 0.01 // 0.01 SOL per comment
      
      return baseAmount + postBonus + engagementBonus + commentBonus
    }


    // Create notifications for all users
    const notificationPromises = []
    let notificationsSent = 0

    for (const user of users) {
      // Randomly decide if user gets a payout or referral bonus (80% payout, 20% referral)
      const isReferralBonus = Math.random() < 0.2
      
      if (isReferralBonus) {
        // Create referral bonus notification
        const mockBonusAmount = Math.random() * 0.5 + 0.1 // 0.1-0.6 SOL
        
        const notificationPromise = supabase
          .from('notifications')
          .insert({
            user_id: user.id,
            type: 'payout_available',
            actor_id: user.id,
            metadata: {
              period_start: periodStart,
              period_end: periodEnd,
              payout_amount_sol: mockBonusAmount,
              interaction_breakdown: null,
              notification_type: 'referral_bonus',
              claim_action: 'claim_payout',
              title: `Referral Bonus Earned!`,
              message: `You earned ${mockBonusAmount.toFixed(4)} SOL referral bonus for ${formatPeriodName(periodStart)} from users you referred.`,
              action_text: 'Claim Bonus'
            }
          })
        
        notificationPromises.push(notificationPromise)
        notificationsSent++
      } else {
        // Create regular payout notification
        const mockInteractions = generateMockInteractions()
        const mockPayoutAmount = generateMockPayout(mockInteractions)
        
        const notificationPromise = supabase
          .from('notifications')
          .insert({
            user_id: user.id,
            type: 'payout_available',
            actor_id: user.id,
            metadata: {
              period_start: periodStart,
              period_end: periodEnd,
              payout_amount_sol: mockPayoutAmount,
              interaction_breakdown: mockInteractions,
              notification_type: 'payout_earned',
              claim_action: 'claim_payout',
              title: `Revenue Share Payout Available!`,
              message: `You earned ${mockPayoutAmount.toFixed(4)} SOL for ${formatPeriodName(periodStart)}. Your engagement: ${mockInteractions.posts} posts, ${mockInteractions.comments} comments, ${mockInteractions.likes} likes received, ${mockInteractions.follows} follows received.`,
              action_text: 'Claim Payout'
            }
          })
        
        notificationPromises.push(notificationPromise)
      }
    }

    // Execute all notification creation promises
    const results = await Promise.allSettled(notificationPromises)
    
    // Count successful notifications
    const successful = results.filter(result => result.status === 'fulfilled').length
    const failed = results.filter(result => result.status === 'rejected').length

    if (failed > 0) {
      console.warn(`${failed} notifications failed to create`)
    }

    return NextResponse.json({
      success: true,
      notificationsSent: successful,
      totalUsers: users.length,
      failed: failed,
      message: `Successfully sent ${successful} test notifications to users`,
      period: formatPeriodName(periodStart)
    })

  } catch (error) {
    console.error('Error in test notifications API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
