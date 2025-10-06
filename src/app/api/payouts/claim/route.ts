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

// Claim payout - returns transaction details for Phantom wallet
export async function POST(request: NextRequest) {
  try {
    const { 
      userId, 
      periodStart, 
      periodEnd, 
      payoutType = 'user_payout' // 'user_payout' or 'referral_payout'
    } = await request.json()

    if (!userId || !periodStart || !periodEnd) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get user's payout data
    let payoutData
    if (payoutType === 'user_payout') {
      const { data: userPayout, error: userError } = await supabase
        .from('user_payouts')
        .select('*')
        .eq('user_id', userId)
        .eq('period_start', periodStart)
        .eq('period_end', periodEnd)
        .eq('payout_status', 'pending')
        .single()

      if (userError || !userPayout) {
        return NextResponse.json(
          { error: 'No pending payout found for this period' },
          { status: 404 }
        )
      }
      payoutData = userPayout
    } else {
      const { data: referralPayout, error: referralError } = await supabase
        .from('referral_payouts')
        .select('*')
        .eq('referrer_id', userId)
        .eq('period_start', periodStart)
        .eq('period_end', periodEnd)
        .eq('payout_status', 'pending')
        .single()

      if (referralError || !referralPayout) {
        return NextResponse.json(
          { error: 'No pending referral payout found for this period' },
          { status: 404 }
        )
      }
      payoutData = referralPayout
    }

    // Get user's wallet address
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('payout_wallet_address')
      .eq('id', userId)
      .single()

    if (profileError || !profile?.payout_wallet_address) {
      return NextResponse.json(
        { error: 'No payout wallet address found. Please set your wallet address in profile settings.' },
        { status: 400 }
      )
    }

    // Calculate payout amount
    const payoutAmount = payoutType === 'user_payout' 
      ? payoutData.final_payout_sol 
      : payoutData.referral_bonus_sol

    if (payoutAmount <= 0) {
      return NextResponse.json(
        { error: 'No payout amount available' },
        { status: 400 }
      )
    }

    // Create Phantom wallet transaction data
    const transactionData = {
      recipient: profile.payout_wallet_address,
      amount: payoutAmount,
      period: {
        start: periodStart,
        end: periodEnd
      },
      type: payoutType,
      payoutId: payoutData.id
    }

    // Return transaction data for Phantom wallet
    return NextResponse.json({
      success: true,
      transaction: transactionData,
      message: 'Transaction data ready for Phantom wallet'
    })

  } catch (error) {
    console.error('Error in claim payout API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Confirm payout after successful transaction
export async function PUT(request: NextRequest) {
  try {
    const { 
      payoutId, 
      transactionHash, 
      payoutType = 'user_payout' 
    } = await request.json()

    if (!payoutId || !transactionHash) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Update payout status
    const tableName = payoutType === 'user_payout' ? 'user_payouts' : 'referral_payouts'
    
    const { error } = await supabase
      .from(tableName)
      .update({
        payout_status: 'paid',
        payment_tx_hash: transactionHash,
        updated_at: new Date().toISOString()
      })
      .eq('id', payoutId)

    if (error) {
      console.error('Error updating payout status:', error)
      return NextResponse.json(
        { error: 'Failed to update payout status' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Payout confirmed successfully'
    })

  } catch (error) {
    console.error('Error confirming payout:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
