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

async function fetchAllTimePumpFunFees(creatorWallet: string): Promise<PumpFunFeeData[] | null> {
  try {
    const response = await fetch(
      `https://swap-api.pump.fun/v1/creators/${creatorWallet}/fees?interval=24h&limit=1000`,
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
    return data
  } catch (error) {
    console.error('Error fetching PumpFun fees:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const { pumpfunCreatorWallet } = await request.json()

    // Validate input
    if (!pumpfunCreatorWallet) {
      return NextResponse.json(
        { error: 'Missing required field: pumpfunCreatorWallet' },
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

    // Fetch all-time PumpFun fees
    const allTimePumpfunFees = await fetchAllTimePumpFunFees(pumpfunCreatorWallet)
    
    if (allTimePumpfunFees === null) {
      return NextResponse.json(
        { error: 'Failed to fetch PumpFun fees from API' },
        { status: 500 }
      )
    }

    // Calculate total all-time PumpFun fees
    const totalAllTimePumpfunFees = allTimePumpfunFees.reduce((total, feeData) => {
      return total + parseFloat(feeData.creatorFeeSOL)
    }, 0)

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

    // Calculate total all-time revenue
    const totalAllTimeRevenue = totalAllTimePumpfunFees + totalAllTimePlatformRevenue

    return NextResponse.json({
      success: true,
      allTimeRevenue: {
        pumpfun: {
          totalFees: totalAllTimePumpfunFees,
          data: allTimePumpfunFees
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
          total: totalAllTimePlatformRevenue
        },
        total: totalAllTimeRevenue
      },
      message: `Successfully calculated all-time revenue: ${totalAllTimeRevenue.toFixed(4)} SOL (PumpFun: ${totalAllTimePumpfunFees.toFixed(4)}, Platform: ${totalAllTimePlatformRevenue.toFixed(4)})`
    })

  } catch (error) {
    console.error('Error calculating all-time revenue:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
