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
    const { walletAddress, periodStart, periodEnd } = await request.json()

    // Validate input
    if (!walletAddress || !periodStart || !periodEnd) {
      return NextResponse.json(
        { error: 'Missing required fields: walletAddress, periodStart, periodEnd' },
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
    // Solana addresses can be 32-44 characters long
    if (walletAddress.length < 32 || walletAddress.length > 44 || !/^[A-Za-z0-9]+$/.test(walletAddress)) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      )
    }

    // Fetch PumpFun fees from their API for the specific period
    const pumpfunFees = await fetchPumpFunFeesForPeriod(walletAddress, periodStart, periodEnd)
    
    if (pumpfunFees === null) {
      return NextResponse.json(
        { error: 'Failed to fetch PumpFun fees from API' },
        { status: 500 }
      )
    }

    // Get current platform revenue to recalculate total pool
    const { data: currentPeriod } = await supabase
      .from('biweekly_periods')
      .select('platform_revenue_sol')
      .eq('period_start', periodStart)
      .eq('period_end', periodEnd)
      .single()

    const platformRevenue = currentPeriod?.platform_revenue_sol || 0
    const pumpfunPool = pumpfunFees * 0.4
    const platformPool = platformRevenue * 0.5
    const totalPool = pumpfunPool + platformPool

    // Update PumpFun fees and recalculate pools
    const { error: updateError } = await supabase
      .from('biweekly_periods')
      .update({
        pumpfun_fees_sol: pumpfunFees,
        pumpfun_pool_sol: pumpfunPool,
        platform_pool_sol: platformPool,
        total_pool_sol: totalPool
      })
      .eq('period_start', periodStart)
      .eq('period_end', periodEnd)

    if (updateError) {
      console.error('Error updating PumpFun fees:', updateError)
      return NextResponse.json(
        { error: 'Failed to update PumpFun fees in database' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      pumpfunFees,
      pumpfunPool,
      platformPool,
      totalPool,
      message: `Successfully fetched and updated PumpFun fees for period: ${pumpfunFees.toFixed(4)} SOL`
    })

  } catch (error) {
    console.error('Error fetching PumpFun fees:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
