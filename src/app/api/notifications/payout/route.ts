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

// Create payout notification for a user
export async function POST(request: NextRequest) {
  try {
    const { 
      userId, 
      periodStart, 
      periodEnd, 
      payoutAmount, 
      interactionBreakdown,
      notificationType = 'payout_earned' // 'payout_earned' or 'referral_bonus'
    } = await request.json()

    if (!userId || !periodStart || !periodEnd || payoutAmount === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Format the notification message
    const periodName = formatPeriodName(periodStart, periodEnd)
    const solAmount = formatSOL(payoutAmount)
    
    let title = ''
    let message = ''
    let actionText = ''

    if (notificationType === 'payout_earned') {
      title = `💰 Revenue Share Payout Available!`
      message = `You earned ${solAmount} SOL for ${periodName}. Your engagement: ${interactionBreakdown.posts} posts, ${interactionBreakdown.comments} comments, ${interactionBreakdown.likes} likes received, ${interactionBreakdown.follows} follows received.`
      actionText = 'Claim Payout'
    } else if (notificationType === 'referral_bonus') {
      title = `🎉 Referral Bonus Earned!`
      message = `You earned ${solAmount} SOL referral bonus for ${periodName} from users you referred.`
      actionText = 'Claim Bonus'
    }

    // Create the notification
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'payout_available',
        actor_id: userId, // Self-notification
        metadata: {
          period_start: periodStart,
          period_end: periodEnd,
          payout_amount_sol: payoutAmount,
          interaction_breakdown: interactionBreakdown,
          notification_type: notificationType,
          claim_action: 'claim_payout',
          title,
          message,
          action_text: actionText
        }
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating payout notification:', error)
      return NextResponse.json(
        { error: 'Failed to create notification' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      notification,
      message: 'Payout notification created successfully'
    })

  } catch (error) {
    console.error('Error in payout notification API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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

// Helper function to format SOL amounts
function formatSOL(amount: number): string {
  return amount.toFixed(4) + ' SOL'
}
