import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyPayment } from '@/lib/solana'

// Pro subscription pricing in SOL
const PRO_PRICING = {
  1: 0.1,   // 1 month
  3: 0.25,  // 3 months
  6: 0.45,  // 6 months
  12: 0.8,  // 12 months
}

export async function POST(request: NextRequest) {
  try {
    const { duration, price, userId, signature, fromAddress } = await request.json()

    // Validate input
    if (!duration || !price || !userId) {
      return NextResponse.json(
        { error: 'Duration, price, and userId are required' },
        { status: 400 }
      )
    }

    // Validate payment signature
    if (!signature || !fromAddress) {
      return NextResponse.json(
        { error: 'Payment signature and fromAddress are required' },
        { status: 400 }
      )
    }

    if (!PRO_PRICING[duration as keyof typeof PRO_PRICING]) {
      return NextResponse.json(
        { error: 'Invalid duration' },
        { status: 400 }
      )
    }

    if (PRO_PRICING[duration as keyof typeof PRO_PRICING] !== price) {
      return NextResponse.json(
        { error: 'Invalid price for duration' },
        { status: 400 }
      )
    }

    // Verify the payment transaction
    console.log('Verifying payment:', { signature, price, fromAddress })
    const paymentVerification = await verifyPayment(signature, price, fromAddress)
    
    if (!paymentVerification.isValid) {
      console.error('Payment verification failed:', paymentVerification.error)
      return NextResponse.json(
        { 
          error: 'Payment verification failed',
          details: paymentVerification.error 
        },
        { status: 400 }
      )
    }

    console.log('Payment verified successfully:', paymentVerification)

    // Create a service role client for server-side operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    console.log('Processing Pro subscription for user:', userId)

    // Check if user is already Pro and get payout wallet address
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('pro, payout_wallet_address')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      )
    }

    if (profile?.pro) {
      return NextResponse.json(
        { error: 'User is already a Pro member' },
        { status: 400 }
      )
    }

    // Calculate subscription end date
    const now = new Date()
    const expiresAt = new Date(now.getTime() + (duration * 30 * 24 * 60 * 60 * 1000)) // Approximate months to milliseconds

    // Update user to Pro status
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ pro: true })
      .eq('id', userId)

    if (updateError) {
      console.error('Error updating user to Pro:', updateError)
      return NextResponse.json(
        { error: 'Failed to activate Pro subscription', details: updateError.message },
        { status: 500 }
      )
    }

    console.log('Successfully updated user to Pro:', userId)

    // Store the subscription in the database with transaction hash
    const { error: insertError } = await supabase
      .from('pro_subscriptions')
      .insert({
        user_id: userId,
        duration_months: duration,
        price_sol: price,
        status: 'active',
        payment_tx_hash: signature,
        payment_from_address: fromAddress,
        created_at: now.toISOString(),
        activated_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      })

    if (insertError) {
      console.error('Error storing subscription:', insertError)
      // Don't fail the request since user is already updated to Pro
    }

    return NextResponse.json({
      success: true,
      message: 'Pro subscription activated successfully',
      duration: duration,
      expiresAt: expiresAt.toISOString(),
      transactionHash: signature,
      requiresWalletSetup: !profile?.payout_wallet_address,
    })

  } catch (error) {
    console.error('Error processing Pro subscription:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

