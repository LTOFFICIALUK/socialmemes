import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
})

export async function GET() {
  try {
    // Get current period using the database function
    const { data: currentPeriod, error } = await supabase.rpc('get_current_period')

    if (error) {
      console.error('Error fetching current period:', error)
      return NextResponse.json(
        { error: 'Failed to fetch current period' },
        { status: 500 }
      )
    }

    if (!currentPeriod || currentPeriod.length === 0) {
      return NextResponse.json({
        success: true,
        currentPeriod: null,
        message: 'No current period found'
      })
    }

    // Revenue data is now in the same table
    const period = currentPeriod[0]
    
    return NextResponse.json({
      success: true,
      currentPeriod: {
        ...period,
        has_revenue_data: period.revenue_status && period.revenue_status !== 'pending' && period.total_pool_sol > 0,
        revenue_data: (period.total_pool_sol > 0 || period.pumpfun_creator_wallet) ? {
          pumpfun_fees_sol: period.pumpfun_fees_sol,
          platform_revenue_sol: period.platform_revenue_sol,
          total_pool_sol: period.total_pool_sol,
          pumpfun_creator_wallet: period.pumpfun_creator_wallet,
          status: period.revenue_status
        } : null
      }
    })

  } catch (error) {
    console.error('Error in current period API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
