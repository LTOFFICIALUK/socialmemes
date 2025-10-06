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

const REFERRAL_BONUS_PERCENTAGE = 0.05 // 5% of referred user's earnings

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

    // Get all user payouts for this period
    const { data: userPayouts, error: payoutsError } = await supabase
      .from('user_payouts')
      .select('user_id, final_payout_sol')
      .eq('period_start', periodStart)
      .eq('period_end', periodEnd)

    if (payoutsError) {
      console.error('Error fetching user payouts:', payoutsError)
      return NextResponse.json(
        { error: 'Failed to fetch user payouts' },
        { status: 500 }
      )
    }

    if (!userPayouts || userPayouts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No user payouts found for this period',
        processedReferrals: 0,
        totalReferralBonus: 0
      })
    }

    // Get all referral relationships
    const { data: referrals, error: referralsError } = await supabase
      .from('referrals')
      .select('referrer_id, referred_user_id')

    if (referralsError) {
      console.error('Error fetching referrals:', referralsError)
      return NextResponse.json(
        { error: 'Failed to fetch referrals' },
        { status: 500 }
      )
    }

    if (!referrals || referrals.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No referrals found in the system',
        processedReferrals: 0,
        totalReferralBonus: 0
      })
    }

    // Create a map of referred_user_id -> referrer_id for quick lookup
    const referralMap = new Map<string, string>()
    referrals.forEach(ref => {
      referralMap.set(ref.referred_user_id, ref.referrer_id)
    })

    // Calculate referral bonuses
    const referralPayouts = []
    const errors = []
    let totalReferralBonus = 0

    for (const payout of userPayouts) {
      // Check if this user was referred by someone
      const referrerId = referralMap.get(payout.user_id)
      
      if (!referrerId) {
        // User has no referrer, skip
        continue
      }

      // Calculate 5% of the referred user's earnings
      const referralBonus = (payout.final_payout_sol || 0) * REFERRAL_BONUS_PERCENTAGE

      if (referralBonus <= 0) {
        // No bonus to give (user earned 0), skip
        continue
      }

      try {
        // Save referral payout to database using upsert
        const { error: upsertError } = await supabase
          .from('referral_payouts')
          .upsert({
            referrer_id: referrerId,
            referred_user_id: payout.user_id,
            period_start: periodStart,
            period_end: periodEnd,
            referral_bonus_sol: referralBonus,
            payout_status: 'pending'
          }, {
            onConflict: 'referrer_id,referred_user_id,period_start,period_end',
            ignoreDuplicates: false
          })

        if (upsertError) {
          console.error(`Error saving referral payout for referrer ${referrerId}:`, upsertError)
          errors.push(`Failed to save referral payout for referrer ${referrerId}: ${upsertError.message}`)
          continue
        }

        referralPayouts.push({
          referrerId,
          referredUserId: payout.user_id,
          referredUserPayout: payout.final_payout_sol,
          referralBonus
        })

        totalReferralBonus += referralBonus

      } catch (error) {
        console.error(`Error processing referral payout for referrer ${referrerId}:`, error)
        errors.push(`Error processing referral payout for referrer ${referrerId}: ${error}`)
      }
    }

    // Sort referral payouts by bonus amount (highest first)
    referralPayouts.sort((a, b) => b.referralBonus - a.referralBonus)

    return NextResponse.json({
      success: true,
      period: { start: periodStart, end: periodEnd },
      summary: {
        totalUserPayouts: userPayouts.length,
        totalReferrals: referrals.length,
        processedReferrals: referralPayouts.length,
        totalReferralBonus,
        referralPercentage: REFERRAL_BONUS_PERCENTAGE * 100,
        errors: errors.length
      },
      referralPayouts,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully processed ${referralPayouts.length} referral payouts for period ${periodStart} to ${periodEnd}. Total referral bonus: ${totalReferralBonus.toFixed(9)} SOL`
    })

  } catch (error) {
    console.error('Error calculating referral payouts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

