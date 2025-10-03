import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ownerId: string }> }
) {
  try {
    const { ownerId } = await params

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
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = user.id

    // Check if owner is pro user
    const { data: ownerProfile, error: ownerError } = await supabase
      .from('profiles')
      .select('pro, username')
      .eq('id', ownerId)
      .single()

    if (ownerError || !ownerProfile) {
      return NextResponse.json(
        { error: 'Owner not found' },
        { status: 404 }
      )
    }

    if (!ownerProfile.pro) {
      return NextResponse.json({
        hasAlphaChat: false,
        isOwner: userId === ownerId,
        isSubscribed: false,
        subscriptionStatus: 'none',
        ownerUsername: ownerProfile.username
      })
    }

    // Check subscription status
    const { data: subscription, error: subscriptionError } = await supabase
      .from('alpha_chat_members')
      .select('status, expires_at, subscription_price_sol, subscription_duration_months')
      .eq('alpha_chat_owner_id', ownerId)
      .eq('subscriber_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    let subscriptionStatus = 'none'
    let isSubscribed = false

    if (!subscriptionError && subscription) {
      subscriptionStatus = subscription.status
      isSubscribed = subscription.status === 'active' && new Date(subscription.expires_at) > new Date()
    }

    // Get subscriber count
    const { count: subscriberCount } = await supabase
      .from('alpha_chat_members')
      .select('*', { count: 'exact', head: true })
      .eq('alpha_chat_owner_id', ownerId)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())

    return NextResponse.json({
      hasAlphaChat: true,
      isOwner: userId === ownerId,
      isSubscribed,
      subscriptionStatus,
      ownerUsername: ownerProfile.username,
      subscriberCount: subscriberCount || 0,
      currentSubscription: subscription || null
    })

  } catch (error) {
    console.error('Alpha chat status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
