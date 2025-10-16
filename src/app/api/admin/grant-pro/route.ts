import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Pro subscription pricing in SOL (for reference)
const PRO_PRICING = {
  1: 0.1,   // 1 month
  3: 0.25,  // 3 months
  6: 0.45,  // 6 months
  12: 0.8,  // 12 months
}

export async function POST(request: NextRequest) {
  try {
    const { userId, duration, reason } = await request.json()

    // Validate input
    if (!userId || !duration) {
      return NextResponse.json(
        { error: 'User ID and duration are required' },
        { status: 400 }
      )
    }

    if (!PRO_PRICING[duration as keyof typeof PRO_PRICING]) {
      return NextResponse.json(
        { error: 'Invalid duration. Must be 1, 3, 6, or 12 months' },
        { status: 400 }
      )
    }

    // Create a service role client for server-side operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log('Admin granting Pro subscription for user:', userId)

    // Check if user exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, pro')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      console.error('Profile fetch error:', profileError)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user is already Pro
    if (profile.pro) {
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

    // Store the subscription in the database (admin granted)
    const { error: insertError } = await supabase
      .from('pro_subscriptions')
      .insert({
        user_id: userId,
        duration_months: duration,
        price_sol: PRO_PRICING[duration as keyof typeof PRO_PRICING],
        status: 'active',
        payment_tx_hash: `admin_granted_${Date.now()}`, // Admin granted identifier
        created_at: now.toISOString(),
        activated_at: now.toISOString(),
        expires_at: expiresAt.toISOString()
      })
      .select()

    if (insertError) {
      console.error('Error creating subscription record:', insertError)
      // Try to revert the profile update
      await supabase
        .from('profiles')
        .update({ pro: false })
        .eq('id', userId)
      
      return NextResponse.json(
        { error: 'Failed to create subscription record', details: insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Successfully granted ${duration}-month Pro subscription to ${profile.username}`,
      subscription: {
        userId,
        username: profile.username,
        duration,
        expiresAt: expiresAt.toISOString(),
        reason: reason || 'Admin granted pro subscription'
      }
    })

  } catch (error) {
    console.error('Admin grant pro error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
