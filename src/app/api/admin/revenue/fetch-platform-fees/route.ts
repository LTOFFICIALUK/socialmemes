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

export async function POST() {
  try {
    // Fetch all-time platform revenue data
    const { data: featuredTokensData, error: featuredTokensError } = await supabase
      .from('featured_tokens')
      .select('promotion_price, created_at')
      .not('promotion_price', 'is', null)

    if (featuredTokensError) {
      console.error('Error fetching featured tokens:', featuredTokensError)
      return NextResponse.json(
        { error: 'Failed to fetch featured tokens data' },
        { status: 500 }
      )
    }

    // Calculate all-time Pro Subscriptions revenue
    const { data: proSubscriptionsData, error: proSubscriptionsError } = await supabase
      .from('pro_subscriptions')
      .select('price_sol, created_at')
      .eq('status', 'active')

    if (proSubscriptionsError) {
      console.error('Error fetching pro subscriptions:', proSubscriptionsError)
      return NextResponse.json(
        { error: 'Failed to fetch pro subscriptions data' },
        { status: 500 }
      )
    }

    // Calculate total all-time platform revenue
    const featuredTokensRevenue = featuredTokensData?.reduce((sum, token) => {
      return sum + (parseFloat(token.promotion_price?.toString() || '0'))
    }, 0) || 0

    const proSubscriptionsRevenue = proSubscriptionsData?.reduce((sum, subscription) => {
      return sum + (parseFloat(subscription.price_sol?.toString() || '0'))
    }, 0) || 0

    const totalAllTimePlatformRevenue = featuredTokensRevenue + proSubscriptionsRevenue

    return NextResponse.json({
      success: true,
      allTimeData: {
        featuredTokens: {
          revenue: featuredTokensRevenue,
          count: featuredTokensData?.length || 0,
          data: featuredTokensData
        },
        proSubscriptions: {
          revenue: proSubscriptionsRevenue,
          count: proSubscriptionsData?.length || 0,
          data: proSubscriptionsData
        },
        total: totalAllTimePlatformRevenue
      },
      message: `Successfully fetched all-time platform revenue: ${totalAllTimePlatformRevenue.toFixed(4)} SOL (Featured Tokens: ${featuredTokensRevenue.toFixed(4)}, Pro Subscriptions: ${proSubscriptionsRevenue.toFixed(4)})`
    })

  } catch (error) {
    console.error('Error fetching all-time platform revenue:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}