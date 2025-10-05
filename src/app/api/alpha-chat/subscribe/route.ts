import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyUserToUserPayment } from '@/lib/solana'

export async function GET() {
  console.log('=== ALPHA CHAT SUBSCRIBE API GET CALLED ===')
  return NextResponse.json({ message: 'Alpha chat subscribe API is working' })
}

export async function POST(request: NextRequest) {
  console.log('=== ALPHA CHAT SUBSCRIBE API CALLED ===')
  console.log('Request URL:', request.url)
  console.log('Request method:', request.method)
  console.log('Request headers:', Object.fromEntries(request.headers.entries()))
  
  try {
    const { ownerId, duration, price, userId, signature, fromAddress } = await request.json()
    
    console.log('Alpha chat subscription request:', {
      ownerId,
      duration,
      price,
      userId,
      signature: signature ? 'present' : 'missing',
      fromAddress: fromAddress ? 'present' : 'missing'
    })

    // Validate required fields
    if (!ownerId || !duration || !price || !userId || !signature || !fromAddress) {
      console.log('Missing required fields:', {
        ownerId: !!ownerId,
        duration: !!duration,
        price: !!price,
        userId: !!userId,
        signature: !!signature,
        fromAddress: !!fromAddress
      })
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get current user from Authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user || user.id !== userId) {
      console.log('Authorization failed:', { authError, userId, requestUserId: userId })
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Create a Supabase client with the user's JWT token for RLS
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseWithAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    )

    // Get the alpha chat owner's payout wallet address
    const { data: ownerProfile, error: ownerError } = await supabaseWithAuth
      .from('profiles')
      .select('payout_wallet_address, alpha_chat_enabled')
      .eq('id', ownerId)
      .single()

    if (ownerError || !ownerProfile) {
      return NextResponse.json(
        { error: 'Alpha chat owner not found' },
        { status: 404 }
      )
    }

    if (!ownerProfile.alpha_chat_enabled) {
      return NextResponse.json(
        { error: 'Alpha chat is not enabled for this user' },
        { status: 400 }
      )
    }

    if (!ownerProfile.payout_wallet_address) {
      return NextResponse.json(
        { error: 'Alpha chat owner has not set up their payout wallet address' },
        { status: 400 }
      )
    }

    // Validate pricing based on duration with discount structure
    const expectedPrices = {
      1: 0.1,
      3: 0.25,
      6: 0.45,
      12: 0.8
    }
    
    const expectedPrice = expectedPrices[duration as keyof typeof expectedPrices]
    if (!expectedPrice || Math.abs(price - expectedPrice) > 0.001) {
      return NextResponse.json(
        { error: 'Invalid subscription price' },
        { status: 400 }
      )
    }

    // Check if user already has an active subscription
    const { data: existingSubscription } = await supabaseWithAuth
      .from('alpha_chat_members')
      .select('id, status, expires_at')
      .eq('alpha_chat_owner_id', ownerId)
      .eq('subscriber_id', userId)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .maybeSingle() // Use maybeSingle() to handle no existing subscription gracefully

    if (existingSubscription) {
      return NextResponse.json(
        { error: 'You already have an active subscription to this alpha chat' },
        { status: 400 }
      )
    }

    // Verify user-to-user payment went to correct recipient
    console.log('Verifying user-to-user payment:', {
      signature,
      price,
      fromAddress,
      toAddress: ownerProfile.payout_wallet_address
    })

    const paymentVerification = await verifyUserToUserPayment(
      signature,
      price,
      fromAddress,
      ownerProfile.payout_wallet_address
    )

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

    // Calculate subscription dates
    const now = new Date()
    const expiresAt = new Date(now.getTime() + (duration * 30 * 24 * 60 * 60 * 1000)) // Approximate months

    // Create subscription record
    const { data: subscription, error: subscriptionError} = await supabaseWithAuth
      .from('alpha_chat_members')
      .insert({
        alpha_chat_owner_id: ownerId,
        subscriber_id: userId,
        subscription_price_sol: price,
        subscription_duration_months: duration,
        payment_tx_hash: signature,
        status: 'active',
        activated_at: now.toISOString(),
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single()

    if (subscriptionError) {
      console.error('Error creating subscription:', subscriptionError)
      console.error('Subscription error details:', {
        message: subscriptionError.message,
        details: subscriptionError.details,
        hint: subscriptionError.hint,
        code: subscriptionError.code
      })
      return NextResponse.json(
        { 
          error: 'Failed to create subscription',
          details: subscriptionError.message,
          hint: subscriptionError.hint
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        expires_at: subscription.expires_at,
        duration: subscription.subscription_duration_months,
        price: subscription.subscription_price_sol
      }
    })

  } catch (error) {
    console.error('Alpha chat subscription error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    })
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}