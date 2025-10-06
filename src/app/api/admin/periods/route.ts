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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year')
    const category = searchParams.get('category') // 'past', 'current', 'future', or 'all'

    let query = supabase
      .from('biweekly_periods')
      .select('*')
      .order('period_start', { ascending: false })

    if (year) {
      query = query.eq('year', parseInt(year))
    }

    const { data: periods, error } = await query

    if (error) {
      console.error('Error fetching periods:', error)
      return NextResponse.json(
        { error: 'Failed to fetch periods' },
        { status: 500 }
      )
    }

    // Process the data - revenue data is now in the same table
    const processedPeriods = periods?.map(period => ({
      ...period,
      has_revenue_data: period.revenue_status && period.revenue_status !== 'pending' && period.total_pool_sol > 0,
      revenue_status: period.revenue_status || 'no_data',
      revenue_data: (period.total_pool_sol > 0 || period.pumpfun_creator_wallet) ? {
        pumpfun_fees_sol: period.pumpfun_fees_sol,
        platform_revenue_sol: period.platform_revenue_sol,
        total_pool_sol: period.total_pool_sol,
        pumpfun_creator_wallet: period.pumpfun_creator_wallet,
        status: period.revenue_status
      } : null
    })) || []

    // Filter by category if specified
    let filteredPeriods = processedPeriods
    if (category && category !== 'all') {
      const now = new Date().toISOString().split('T')[0]
      filteredPeriods = processedPeriods.filter(period => {
        switch (category) {
          case 'past':
            return period.period_end < now
          case 'current':
            return period.period_start <= now && period.period_end >= now
          case 'future':
            return period.period_start > now
          default:
            return true
        }
      })
    }

    return NextResponse.json({
      success: true,
      periods: filteredPeriods,
      summary: {
        total: processedPeriods.length,
        past: processedPeriods.filter(p => p.period_end < new Date().toISOString().split('T')[0]).length,
        current: processedPeriods.filter(p => p.period_start <= new Date().toISOString().split('T')[0] && p.period_end >= new Date().toISOString().split('T')[0]).length,
        future: processedPeriods.filter(p => p.period_start > new Date().toISOString().split('T')[0]).length,
        with_revenue_data: processedPeriods.filter(p => p.has_revenue_data).length
      }
    })

  } catch (error) {
    console.error('Error in periods API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, year } = await request.json()

    if (action === 'generate_year') {
      if (!year) {
        return NextResponse.json(
          { error: 'Year is required for generating periods' },
          { status: 400 }
        )
      }

      // Call the database function to generate periods for the year
      const { error: generateError } = await supabase.rpc('generate_biweekly_periods_for_year', {
        year_val: parseInt(year)
      })

      if (generateError) {
        console.error('Error generating periods:', generateError)
        return NextResponse.json(
          { error: 'Failed to generate periods' },
          { status: 500 }
        )
      }

      // Update status flags
      const { error: updateError } = await supabase.rpc('update_period_status_flags')

      if (updateError) {
        console.error('Error updating status flags:', updateError)
        // Don't fail the request since periods were generated
      }

      return NextResponse.json({
        success: true,
        message: `Generated bi-weekly periods for ${year}`,
        year: parseInt(year)
      })
    }

    if (action === 'update_status_flags') {
      const { error } = await supabase.rpc('update_period_status_flags')

      if (error) {
        console.error('Error updating status flags:', error)
        return NextResponse.json(
          { error: 'Failed to update status flags' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Updated period status flags'
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error in periods POST API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
