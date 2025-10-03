import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Alpha chat subscription pricing in SOL (similar to pro pricing)
const ALPHA_CHAT_PRICING = {
  1: 0.1,   // 1 month
  3: 0.25,  // 3 months
  6: 0.45,  // 6 months
  12: 0.8,  // 12 months
}

export async function POST(request: NextRequest) {
  try {
    const { ownerId, duration, price, userId, signature, fromAddress } = await request.json()

    // Validate input
    if (!ownerId || !duration || !price || !userId || !signature || !fromAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: ownerId, duration, price, userId, signature, fromAddress' },
        { status: 400 }
      )
    }

    if (!ALPHA_CHAT_PRICING[duration as keyof typeof ALPHA_CHAT_PRICING]) {
      return NextResponse.json(
        { error: 'Invalid duration' },
        { status: 400 }
      )
    }

    if (ALPHA_CHAT_PRICING[duration as keyof typeof ALPHA_CHAT_PRICING] !== price) {
      return NextResponse.json(
        { error: 'Invalid price for duration' },
        { status: 400 }
      )
    }

    // Create a service role client for server-side operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    console.log('Processing Alpha chat subscription for user:', userId, 'to owner:', ownerId)

    // Check if owner is pro user
    const { data: ownerProfile, error: ownerError } = await supabase
      .from('profiles')
      .select('pro')
      .eq('id', ownerId)
      .single()

    if (ownerError) {
      console.error('Owner profile fetch error:', ownerError)
      return NextResponse.json(
        { error: 'Failed to fetch owner profile' },
        { status: 500 }
      )
    }

    if (!ownerProfile?.pro) {
      return NextResponse.json(
        { error: 'Owner is not a Pro user' },
        { status: 400 }
      )
    }

    // Check if user is already subscribed
    const { data: existingSubscription } = await supabase
      .from('alpha_chat_members')
      .select('id, status, expires_at')
      .eq('alpha_chat_owner_id', ownerId)
      .eq('subscriber_id', userId)
      .single()

    if (existingSubscription) {
      // Check if subscription is still active
      if (existingSubscription.status === 'active' && new Date(existingSubscription.expires_at) > new Date()) {
        return NextResponse.json(
          { error: 'User already has an active subscription to this alpha chat' },
          { status: 400 }
        )
      }
    }

    // Calculate subscription end date
    const now = new Date()
    const expiresAt = new Date(now.getTime() + (duration * 30 * 24 * 60 * 60 * 1000)) // Approximate months to milliseconds

    // Create or update subscription
    const subscriptionData = {
      alpha_chat_owner_id: ownerId,
      subscriber_id: userId,
      subscription_price_sol: price,
      subscription_duration_months: duration,
      payment_tx_hash: signature,
      status: 'active' as const,
      activated_at: now.toISOString(),
      expires_at: expiresAt.toISOString()
    }

    let result
    if (existingSubscription) {
      // Update existing subscription
      const { data, error } = await supabase
        .from('alpha_chat_members')
        .update(subscriptionData)
        .eq('id', existingSubscription.id)
        .select()
        .single()
      
      result = { data, error }
    } else {
      // Create new subscription
      const { data, error } = await supabase
        .from('alpha_chat_members')
        .insert(subscriptionData)
        .select()
        .single()
      
      result = { data, error }
    }

    if (result.error) {
      console.error('Subscription creation/update error:', result.error)
      return NextResponse.json(
        { error: 'Failed to create/update subscription' },
        { status: 500 }
      )
    }

    console.log('Alpha chat subscription successful:', result.data)

    return NextResponse.json({
      success: true,
      subscription: result.data
    })

  } catch (error) {
    console.error('Alpha chat subscription error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
