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

async function fetchPumpFunFees(creatorWallet: string, periodStart: string, periodEnd: string): Promise<number | null> {
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
    const { periodStart, periodEnd, pumpfunCreatorWallet, platformRevenue } = await request.json()

    // Validate input
    if (!periodStart || !periodEnd || !pumpfunCreatorWallet || platformRevenue === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: periodStart, periodEnd, pumpfunCreatorWallet, platformRevenue' },
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

    // Validate wallet address format (basic validation)
    if (!pumpfunCreatorWallet.startsWith('0x') || pumpfunCreatorWallet.length !== 42) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      )
    }

    // Validate revenue amounts
    if (platformRevenue < 0) {
      return NextResponse.json(
        { error: 'Platform revenue cannot be negative' },
        { status: 400 }
      )
    }

    // Fetch PumpFun fees from their API
    const pumpfunFees = await fetchPumpFunFees(pumpfunCreatorWallet, periodStart, periodEnd)
    
    if (pumpfunFees === null) {
      return NextResponse.json(
        { error: 'Failed to fetch PumpFun fees from API' },
        { status: 500 }
      )
    }

    // Calculate pools
    const pumpfunPool = pumpfunFees * 0.4 // 40% of PumpFun fees
    const platformPool = platformRevenue * 0.5 // 50% of platform revenue
    const totalPool = pumpfunPool + platformPool

    // Store or update revenue data in biweekly_periods
    const { error: revenueError } = await supabase
      .from('biweekly_periods')
      .update({
        pumpfun_fees_sol: pumpfunFees,
        platform_revenue_sol: platformRevenue,
        pumpfun_pool_sol: pumpfunPool,
        platform_pool_sol: platformPool,
        total_pool_sol: totalPool,
        pumpfun_creator_wallet: pumpfunCreatorWallet,
        revenue_status: 'pending'
      })
      .eq('period_start', periodStart)
      .eq('period_end', periodEnd)
      .select()
      .single()

    if (revenueError) {
      console.error('Error storing revenue data:', revenueError)
      return NextResponse.json(
        { error: 'Failed to store revenue data' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      revenue: {
        period: { start: periodStart, end: periodEnd },
        pumpfunCreatorWallet,
        pumpfunFees,
        platformRevenue,
        pools: {
          pumpfun: pumpfunPool,
          platform: platformPool,
          total: totalPool
        }
      },
      message: `Revenue data stored successfully. PumpFun fees: ${pumpfunFees.toFixed(4)} SOL from creator wallet.`
    })

  } catch (error) {
    console.error('Error setting bi-weekly revenue:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get recent revenue periods from biweekly_periods
    const { data: revenuePeriods, error } = await supabase
      .from('biweekly_periods')
      .select('*')
      .not('total_pool_sol', 'is', null)
      .gt('total_pool_sol', 0)
      .order('period_start', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching revenue periods:', error)
      return NextResponse.json(
        { error: 'Failed to fetch revenue periods' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      revenuePeriods,
      pagination: {
        limit,
        offset,
        hasMore: revenuePeriods && revenuePeriods.length === limit
      }
    })

  } catch (error) {
    console.error('Error fetching revenue periods:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
