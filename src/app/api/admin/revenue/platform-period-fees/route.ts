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

    // Calculate Featured Tokens revenue for the period
    const { data: featuredTokensData, error: featuredTokensError } = await supabase
      .from('featured_tokens')
      .select('promotion_price, created_at')
      .gte('created_at', periodStart)
      .lte('created_at', periodEnd + 'T23:59:59.999Z')
      .not('promotion_price', 'is', null)

    if (featuredTokensError) {
      console.error('Error fetching featured tokens:', featuredTokensError)
      return NextResponse.json(
        { error: 'Failed to fetch featured tokens data' },
        { status: 500 }
      )
    }

    // Calculate Pro Subscriptions revenue for the period
    const { data: proSubscriptionsData, error: proSubscriptionsError } = await supabase
      .from('pro_subscriptions')
      .select('price_sol, created_at')
      .gte('created_at', periodStart)
      .lte('created_at', periodEnd + 'T23:59:59.999Z')
      .eq('status', 'active')

    if (proSubscriptionsError) {
      console.error('Error fetching pro subscriptions:', proSubscriptionsError)
      return NextResponse.json(
        { error: 'Failed to fetch pro subscriptions data' },
        { status: 500 }
      )
    }

    // Calculate total platform revenue for the period
    const featuredTokensRevenue = featuredTokensData?.reduce((sum, token) => {
      return sum + (parseFloat(token.promotion_price?.toString() || '0'))
    }, 0) || 0

    const proSubscriptionsRevenue = proSubscriptionsData?.reduce((sum, subscription) => {
      return sum + (parseFloat(subscription.price_sol?.toString() || '0'))
    }, 0) || 0

    const totalPlatformRevenue = featuredTokensRevenue + proSubscriptionsRevenue

    // Calculate platform pool (50% of platform revenue)
    const platformPool = totalPlatformRevenue * 0.5

    // Get current PumpFun data to recalculate total pool
    const { data: currentPeriod } = await supabase
      .from('biweekly_periods')
      .select('pumpfun_fees_sol, pumpfun_pool_sol')
      .eq('period_start', periodStart)
      .eq('period_end', periodEnd)
      .single()

    const pumpfunPool = currentPeriod?.pumpfun_pool_sol || 0
    const totalPool = pumpfunPool + platformPool

    // Update the biweekly_periods table with platform revenue data
    const { error: updateError } = await supabase
      .from('biweekly_periods')
      .update({
        platform_revenue_sol: totalPlatformRevenue,
        platform_pool_sol: platformPool,
        total_pool_sol: totalPool,
        revenue_status: 'calculated'
      })
      .eq('period_start', periodStart)
      .eq('period_end', periodEnd)

    if (updateError) {
      console.error('Error updating platform revenue:', updateError)
      return NextResponse.json(
        { error: 'Failed to update platform revenue in database' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      breakdown: {
        period: { start: periodStart, end: periodEnd },
        featuredTokens: {
          revenue: featuredTokensRevenue,
          count: featuredTokensData?.length || 0
        },
        proSubscriptions: {
          revenue: proSubscriptionsRevenue,
          count: proSubscriptionsData?.length || 0
        },
        total: totalPlatformRevenue,
        platformPool: platformPool,
        pumpfunPool: pumpfunPool,
        totalPool: totalPool
      },
      message: `Successfully calculated platform revenue for period: ${totalPlatformRevenue.toFixed(4)} SOL (Featured Tokens: ${featuredTokensRevenue.toFixed(4)}, Pro Subscriptions: ${proSubscriptionsRevenue.toFixed(4)})`
    })

  } catch (error) {
    console.error('Error calculating platform revenue:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
