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
    const currentDate = new Date()
    
    // Find the current period (where is_current = true)
    const { data: currentPeriod, error: currentError } = await supabase
      .from('biweekly_periods')
      .select('*')
      .eq('is_current', true)
      .single()

    if (currentError && currentError.code !== 'PGRST116') {
      console.error('Error fetching current period:', currentError)
      return NextResponse.json(
        { error: 'Failed to fetch current period' },
        { status: 500 }
      )
    }

    // If no current period is marked, find the period that contains today's date
    let periodToReturn = currentPeriod

    if (!currentPeriod) {
      const { data: periodsContainingToday, error: todayError } = await supabase
        .from('biweekly_periods')
        .select('*')
        .lte('period_start', currentDate.toISOString().split('T')[0])
        .gte('period_end', currentDate.toISOString().split('T')[0])
        .order('period_start', { ascending: false })
        .limit(1)

      if (todayError) {
        console.error('Error fetching period containing today:', todayError)
        return NextResponse.json(
          { error: 'Failed to fetch period containing today' },
          { status: 500 }
        )
      }

      periodToReturn = periodsContainingToday?.[0]
    }

    // If still no period found, find the most recent period that has ended
    if (!periodToReturn) {
      const { data: recentPeriod, error: recentError } = await supabase
        .from('biweekly_periods')
        .select('*')
        .lt('period_end', currentDate.toISOString().split('T')[0])
        .order('period_end', { ascending: false })
        .limit(1)

      if (recentError) {
        console.error('Error fetching recent period:', recentError)
        return NextResponse.json(
          { error: 'Failed to fetch recent period' },
          { status: 500 }
        )
      }

      periodToReturn = recentPeriod?.[0]
    }

    if (!periodToReturn) {
      return NextResponse.json(
        { error: 'No bi-weekly periods found in the system' },
        { status: 404 }
      )
    }

    // Calculate time remaining until period ends
    const periodEndDate = new Date(periodToReturn.period_end)
    const timeUntilEnd = periodEndDate.getTime() - currentDate.getTime()
    const daysUntilEnd = Math.ceil(timeUntilEnd / (1000 * 60 * 60 * 24))
    const hoursUntilEnd = Math.ceil(timeUntilEnd / (1000 * 60 * 60))
    const minutesUntilEnd = Math.ceil(timeUntilEnd / (1000 * 60))

    // Determine if period is ending soon (within 24 hours)
    const isEndingSoon = timeUntilEnd <= 24 * 60 * 60 * 1000 // 24 hours in milliseconds
    const isEnded = timeUntilEnd <= 0

    // Get next period if it exists
    const { data: nextPeriod } = await supabase
      .from('biweekly_periods')
      .select('*')
      .eq('is_future', true)
      .order('period_start', { ascending: true })
      .limit(1)

    return NextResponse.json({
      success: true,
      currentPeriod: {
        id: periodToReturn.id,
        periodName: periodToReturn.period_name,
        periodStart: periodToReturn.period_start,
        periodEnd: periodToReturn.period_end,
        year: periodToReturn.year,
        month: periodToReturn.month,
        periodNumber: periodToReturn.period_number,
        isCurrent: periodToReturn.is_current,
        isFuture: periodToReturn.is_future,
        revenueStatus: periodToReturn.revenue_status,
        pumpfunCreatorWallet: periodToReturn.pumpfun_creator_wallet,
        revenueData: {
          pumpfunFeesSol: periodToReturn.pumpfun_fees_sol,
          platformRevenueSol: periodToReturn.platform_revenue_sol,
          pumpfunPoolSol: periodToReturn.pumpfun_pool_sol,
          platformPoolSol: periodToReturn.platform_pool_sol,
          totalPoolSol: periodToReturn.total_pool_sol,
          referralBonusPoolSol: periodToReturn.referral_bonus_pool_sol
        }
      },
      timing: {
        currentDate: currentDate.toISOString().split('T')[0],
        periodEndDate: periodToReturn.period_end,
        daysUntilEnd,
        hoursUntilEnd,
        minutesUntilEnd,
        isEndingSoon,
        isEnded,
        timeUntilEndMs: timeUntilEnd
      },
      nextPeriod: nextPeriod?.[0] ? {
        id: nextPeriod[0].id,
        periodName: nextPeriod[0].period_name,
        periodStart: nextPeriod[0].period_start,
        periodEnd: nextPeriod[0].period_end,
        year: nextPeriod[0].year,
        month: nextPeriod[0].month,
        periodNumber: nextPeriod[0].period_number
      } : null,
      message: isEnded 
        ? `Period ${periodToReturn.period_name} has ended and is ready for processing`
        : isEndingSoon 
          ? `Period ${periodToReturn.period_name} is ending soon (${hoursUntilEnd} hours remaining)`
          : `Current period: ${periodToReturn.period_name} (${daysUntilEnd} days remaining)`
    })

  } catch (error) {
    console.error('Error fetching current period:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
