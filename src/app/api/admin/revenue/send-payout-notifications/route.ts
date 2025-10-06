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

    // Helper function to format period name
    const formatPeriodName = (start: string, end: string): string => {
      const startDate = new Date(start)
      const endDate = new Date(end)
      const month = startDate.toLocaleString('default', { month: 'long' })
      const year = startDate.getFullYear()
      const startDay = startDate.getDate()
      
      return `${month} ${year} - Period ${startDay <= 14 ? '1' : '2'}`
    }

    const periodName = formatPeriodName(periodStart, periodEnd)
    let userPayoutNotifications = 0
    let referralPayoutNotifications = 0
    const errors: string[] = []

    // Step 1: Send notifications for user payouts
    console.log('Step 1: Fetching user payouts...')
    const { data: userPayouts, error: userPayoutsError } = await supabase
      .from('user_payouts')
      .select('user_id, final_payout_sol')
      .eq('period_start', periodStart)
      .eq('period_end', periodEnd)
      .eq('payout_status', 'pending')
      .gt('final_payout_sol', 0)

    if (userPayoutsError) {
      console.error('Error fetching user payouts:', userPayoutsError)
      errors.push(`Failed to fetch user payouts: ${userPayoutsError.message}`)
    } else if (userPayouts && userPayouts.length > 0) {
      console.log(`Found ${userPayouts.length} user payouts to notify`)

      // Fetch all interaction scores for this period
      const { data: allInteractionScores } = await supabase
        .from('user_interaction_scores')
        .select('user_id, posts_created, comments_replies_created, likes_received, follows_received')
        .eq('period_start', periodStart)
        .eq('period_end', periodEnd)

      // Create a map for quick lookup
      const interactionScoresMap = new Map()
      if (allInteractionScores) {
        allInteractionScores.forEach(score => {
          interactionScoresMap.set(score.user_id, score)
        })
      }

      // Create notifications for each user payout
      for (const payout of userPayouts) {
        try {
          // Get interaction breakdown from the map
          const interactions = interactionScoresMap.get(payout.user_id) || {
            posts_created: 0,
            comments_replies_created: 0,
            likes_received: 0,
            follows_received: 0
          }

          const { error: notificationError } = await supabase
            .from('notifications')
            .insert({
              user_id: payout.user_id,
              type: 'payout_available',
              actor_id: payout.user_id,
              metadata: {
                period_start: periodStart,
                period_end: periodEnd,
                payout_amount_sol: payout.final_payout_sol,
                interaction_breakdown: {
                  posts: interactions.posts_created || 0,
                  comments: interactions.comments_replies_created || 0,
                  likes: interactions.likes_received || 0,
                  follows: interactions.follows_received || 0
                },
                notification_type: 'payout_earned',
                claim_action: 'claim_payout',
                title: `Revenue Share Payout Available!`,
                message: `You earned ${(payout.final_payout_sol || 0).toFixed(4)} SOL for ${periodName}. Your engagement: ${interactions.posts_created || 0} posts, ${interactions.comments_replies_created || 0} comments, ${interactions.likes_received || 0} likes, ${interactions.follows_received || 0} follows.`,
                action_text: 'Claim Payout'
              }
            })

          if (notificationError) {
            console.error(`Error creating notification for user ${payout.user_id}:`, notificationError)
            errors.push(`Failed to notify user ${payout.user_id}: ${notificationError.message}`)
          } else {
            userPayoutNotifications++
          }
        } catch (error) {
          console.error(`Error processing notification for user ${payout.user_id}:`, error)
          errors.push(`Error processing notification for user ${payout.user_id}: ${error}`)
        }
      }
    } else {
      console.log('No user payouts found for this period')
    }

    // Step 2: Send notifications for referral bonuses
    console.log('Step 2: Fetching referral payouts...')
    const { data: referralPayouts, error: referralPayoutsError } = await supabase
      .from('referral_payouts')
      .select(`
        referrer_id,
        referred_user_id,
        referral_bonus_sol,
        profiles!referral_payouts_referred_user_id_fkey(username)
      `)
      .eq('period_start', periodStart)
      .eq('period_end', periodEnd)
      .eq('payout_status', 'pending')
      .gt('referral_bonus_sol', 0)

    if (referralPayoutsError) {
      console.error('Error fetching referral payouts:', referralPayoutsError)
      errors.push(`Failed to fetch referral payouts: ${referralPayoutsError.message}`)
    } else if (referralPayouts && referralPayouts.length > 0) {
      console.log(`Found ${referralPayouts.length} referral payouts to notify`)

      // Group referral bonuses by referrer to send one notification per referrer
      const referrerBonuses = new Map<string, { totalBonus: number; referredUsers: string[] }>()
      
      for (const refPayout of referralPayouts) {
        const existing = referrerBonuses.get(refPayout.referrer_id) || { totalBonus: 0, referredUsers: [] }
        existing.totalBonus += refPayout.referral_bonus_sol || 0
        
        const referredUsername = Array.isArray(refPayout.profiles) && refPayout.profiles.length > 0
          ? refPayout.profiles[0].username
          : 'a user'
        existing.referredUsers.push(referredUsername)
        
        referrerBonuses.set(refPayout.referrer_id, existing)
      }

      // Create one notification per referrer
      for (const [referrerId, bonusData] of referrerBonuses.entries()) {
        try {
          const referredUsersText = bonusData.referredUsers.length === 1
            ? bonusData.referredUsers[0]
            : `${bonusData.referredUsers.length} users`

          const { error: notificationError } = await supabase
            .from('notifications')
            .insert({
              user_id: referrerId,
              type: 'payout_available',
              actor_id: referrerId,
              metadata: {
                period_start: periodStart,
                period_end: periodEnd,
                payout_amount_sol: bonusData.totalBonus,
                interaction_breakdown: null,
                notification_type: 'referral_bonus',
                claim_action: 'claim_payout',
                title: `Referral Bonus Earned!`,
                message: `You earned ${bonusData.totalBonus.toFixed(4)} SOL referral bonus for ${periodName} from ${referredUsersText} you referred.`,
                action_text: 'Claim Bonus'
              }
            })

          if (notificationError) {
            console.error(`Error creating referral notification for user ${referrerId}:`, notificationError)
            errors.push(`Failed to notify referrer ${referrerId}: ${notificationError.message}`)
          } else {
            referralPayoutNotifications++
          }
        } catch (error) {
          console.error(`Error processing referral notification for user ${referrerId}:`, error)
          errors.push(`Error processing referral notification for user ${referrerId}: ${error}`)
        }
      }
    } else {
      console.log('No referral payouts found for this period')
    }

    return NextResponse.json({
      success: true,
      period: { start: periodStart, end: periodEnd },
      summary: {
        userPayoutNotifications,
        referralPayoutNotifications,
        totalNotifications: userPayoutNotifications + referralPayoutNotifications,
        errors: errors.length
      },
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully sent ${userPayoutNotifications + referralPayoutNotifications} notifications for period ${periodStart} to ${periodEnd}. ${userPayoutNotifications} user payouts, ${referralPayoutNotifications} referral bonuses.`
    })

  } catch (error) {
    console.error('Error sending payout notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

