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

interface PumpFunFeeData {
  bucket: string
  creatorFee: string
  creatorFeeSOL: string
  numTrades: number
  cumulativeCreatorFee: string
  cumulativeCreatorFeeSOL: string
}

async function fetchPumpFunFeesForPeriod(creatorWallet: string, periodStart: string, periodEnd: string): Promise<number | null> {
  try {
    const response = await fetch(
      `https://swap-api.pump.fun/v1/creators/${creatorWallet}/fees?interval=24h&limit=30`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    )

    if (!response.ok) {
      console.error(`PumpFun API error: ${response.status} ${response.statusText}`)
      return null
    }

    const data: PumpFunFeeData[] = await response.json()
    
    // Convert period dates to Date objects for comparison
    const startDate = new Date(periodStart)
    const endDate = new Date(periodEnd)
    
    // Filter fees within the bi-weekly period
    let totalFees = 0
    
    for (const feeData of data) {
      const feeDate = new Date(feeData.bucket)
      
      // Check if this fee date falls within our bi-weekly period
      if (feeDate >= startDate && feeDate <= endDate) {
        const dailyFee = parseFloat(feeData.creatorFeeSOL)
        totalFees += dailyFee
      }
    }
    
    return totalFees
  } catch (error) {
    console.error('Error fetching PumpFun fees:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const { pumpfunCreatorWallet, periodStart, periodEnd } = await request.json()

    // Validate input
    if (!pumpfunCreatorWallet || !periodStart || !periodEnd) {
      return NextResponse.json(
        { error: 'Missing required fields: pumpfunCreatorWallet, periodStart, periodEnd' },
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

    // Validate wallet address format (basic validation for Solana addresses)
    if (pumpfunCreatorWallet.length < 32 || pumpfunCreatorWallet.length > 44 || !/^[A-Za-z0-9]+$/.test(pumpfunCreatorWallet)) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      )
    }

    // Fetch PumpFun fees for the period
    const pumpfunFees = await fetchPumpFunFeesForPeriod(pumpfunCreatorWallet, periodStart, periodEnd)
    
    if (pumpfunFees === null) {
      return NextResponse.json(
        { error: 'Failed to fetch PumpFun fees from API' },
        { status: 500 }
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

    // Calculate pools
    const pumpfunPool = pumpfunFees * 0.4 // 40% of PumpFun fees
    const platformPool = totalPlatformRevenue * 0.5 // 50% of platform revenue
    const totalPool = pumpfunPool + platformPool

    // Update the biweekly_periods table with all revenue data
    const { error: updateError } = await supabase
      .from('biweekly_periods')
      .update({
        pumpfun_fees_sol: pumpfunFees,
        pumpfun_pool_sol: pumpfunPool,
        platform_revenue_sol: totalPlatformRevenue,
        platform_pool_sol: platformPool,
        total_pool_sol: totalPool,
        revenue_status: 'calculated'
      })
      .eq('period_start', periodStart)
      .eq('period_end', periodEnd)

    if (updateError) {
      console.error('Error updating total pool revenue:', updateError)
      return NextResponse.json(
        { error: 'Failed to update total pool revenue in database' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      totalPoolRevenue: {
        period: { start: periodStart, end: periodEnd },
        pumpfun: {
          fees: pumpfunFees,
          pool: pumpfunPool
        },
        platform: {
          featuredTokens: {
            revenue: featuredTokensRevenue,
            count: featuredTokensData?.length || 0
          },
          proSubscriptions: {
            revenue: proSubscriptionsRevenue,
            count: proSubscriptionsData?.length || 0
          },
          total: totalPlatformRevenue,
          pool: platformPool
        },
        totalPool: totalPool
      },
      message: `Successfully calculated total pool revenue for period: ${totalPool.toFixed(4)} SOL (PumpFun Pool: ${pumpfunPool.toFixed(4)}, Platform Pool: ${platformPool.toFixed(4)})`
    })

  } catch (error) {
    console.error('Error calculating total pool revenue:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
