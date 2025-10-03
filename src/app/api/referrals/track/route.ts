import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Use service role client for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: Request) {
  try {
    const { userId, referralCode } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // If no referral code, nothing to track
    if (!referralCode) {
      return NextResponse.json({ success: true, message: 'No referral code provided' })
    }

    // Find the referrer by their referral code
    const { data: referrerProfile, error: referrerError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('referral_code', referralCode.toUpperCase().trim())
      .single()

    if (referrerError || !referrerProfile) {
      console.error('Referrer not found:', referrerError)
      return NextResponse.json(
        { error: 'Invalid referral code' },
        { status: 404 }
      )
    }

    const referrerId = referrerProfile.id

    // Don't allow self-referrals
    if (referrerId === userId) {
      return NextResponse.json(
        { error: 'Cannot refer yourself' },
        { status: 400 }
      )
    }

    // Check if referral already exists
    const { data: existingReferral } = await supabaseAdmin
      .from('referrals')
      .select('id')
      .eq('referred_user_id', userId)
      .single()

    if (existingReferral) {
      return NextResponse.json(
        { success: true, message: 'Referral already tracked' }
      )
    }

    // Start a transaction-like operation
    // Step 1: Insert into referrals table
    const { error: referralInsertError } = await supabaseAdmin
      .from('referrals')
      .insert({
        referrer_id: referrerId,
        referred_user_id: userId
      })

    if (referralInsertError) {
      console.error('Error inserting referral:', referralInsertError)
      return NextResponse.json(
        { error: 'Failed to track referral' },
        { status: 500 }
      )
    }

    // Step 2: Check if referrer has referral_data
    const { data: existingReferralData } = await supabaseAdmin
      .from('referral_data')
      .select('*')
      .eq('user_id', referrerId)
      .single()

    if (existingReferralData) {
      // Update existing referral data
      const { error: updateError } = await supabaseAdmin
        .from('referral_data')
        .update({
          total_referrals: existingReferralData.total_referrals + 1,
          last_updated: new Date().toISOString()
        })
        .eq('user_id', referrerId)

      if (updateError) {
        console.error('Error updating referral data:', updateError)
      }
    } else {
      // Create new referral data entry
      const { error: insertError } = await supabaseAdmin
        .from('referral_data')
        .insert({
          user_id: referrerId,
          total_referrals: 1,
          total_earned: 0.00,
          pending_payout: 0.00,
          last_updated: new Date().toISOString()
        })

      if (insertError) {
        console.error('Error creating referral data:', insertError)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Referral tracked successfully',
      referrerId
    })

  } catch (error) {
    console.error('Error tracking referral:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

