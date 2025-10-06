import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
})

export interface PeriodData {
  id: string
  period_start: string
  period_end: string
  period_name: string
  year: number
  month: number
  period_number: number
  is_current: boolean
  is_future: boolean
  pumpfun_creator_wallet: string
  revenue_status: string
}

export interface PeriodValidationResult {
  isValid: boolean
  period?: PeriodData
  error?: string
}

/**
 * Validates that a period exists in the biweekly_periods table and is not in the future
 */
export async function validatePeriod(periodStart: string, periodEnd: string): Promise<PeriodValidationResult> {
  try {
    // Validate input format
    const startDate = new Date(periodStart)
    const endDate = new Date(periodEnd)
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return {
        isValid: false,
        error: 'Invalid date format. Use YYYY-MM-DD format.'
      }
    }

    if (startDate >= endDate) {
      return {
        isValid: false,
        error: 'Period start must be before period end'
      }
    }

    // Check if period exists in database
    const { data: period, error } = await supabase
      .from('biweekly_periods')
      .select('*')
      .eq('period_start', periodStart)
      .eq('period_end', periodEnd)
      .single()

    if (error || !period) {
      return {
        isValid: false,
        error: `Period ${periodStart} to ${periodEnd} not found in biweekly_periods table`
      }
    }

    // Check if period is in the future
    const currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0) // Normalize to start of day UTC
    
    const periodEndDate = new Date(periodEnd)
    periodEndDate.setHours(23, 59, 59, 999) // End of period day

    if (periodEndDate > currentDate) {
      return {
        isValid: false,
        error: `Period ${periodStart} to ${periodEnd} has not ended yet. Cannot process future periods.`
      }
    }

    return {
      isValid: true,
      period: period as PeriodData
    }

  } catch (error) {
    console.error('Error validating period:', error)
    return {
      isValid: false,
      error: 'Internal error validating period'
    }
  }
}

/**
 * Gets the current period that should be processed (the most recently ended period)
 */
export async function getCurrentProcessablePeriod(): Promise<PeriodValidationResult> {
  try {
    const currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0) // Normalize to start of day UTC

    // Find the most recent period that has ended
    const { data: period, error } = await supabase
      .from('biweekly_periods')
      .select('*')
      .lte('period_end', currentDate.toISOString().split('T')[0])
      .order('period_end', { ascending: false })
      .limit(1)
      .single()

    if (error || !period) {
      return {
        isValid: false,
        error: 'No processable period found. All periods may be in the future.'
      }
    }

    return {
      isValid: true,
      period: period as PeriodData
    }

  } catch (error) {
    console.error('Error getting current processable period:', error)
    return {
      isValid: false,
      error: 'Internal error getting current processable period'
    }
  }
}

/**
 * Gets all periods that should be processed (ended periods not yet processed)
 */
export async function getUnprocessedPeriods(): Promise<PeriodValidationResult> {
  try {
    const currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0) // Normalize to start of day UTC

    // Find periods that have ended but haven't been processed
    const { data: periods, error } = await supabase
      .from('biweekly_periods')
      .select('*')
      .lte('period_end', currentDate.toISOString().split('T')[0])
      .neq('revenue_status', 'calculated')
      .order('period_end', { ascending: true })

    if (error) {
      return {
        isValid: false,
        error: 'Error fetching unprocessed periods'
      }
    }

    if (!periods || periods.length === 0) {
      return {
        isValid: false,
        error: 'No unprocessed periods found'
      }
    }

    // Return the oldest unprocessed period
    return {
      isValid: true,
      period: periods[0] as PeriodData
    }

  } catch (error) {
    console.error('Error getting unprocessed periods:', error)
    return {
      isValid: false,
      error: 'Internal error getting unprocessed periods'
    }
  }
}

/**
 * Standard date comparison for period filtering
 */
export function isDateInPeriod(date: string | Date, periodStart: string, periodEnd: string): boolean {
  const checkDate = new Date(date)
  const startDate = new Date(periodStart)
  const endDate = new Date(periodEnd)
  
  // Set time to start/end of day for accurate comparison
  startDate.setHours(0, 0, 0, 0)
  endDate.setHours(23, 59, 59, 999)
  
  return checkDate >= startDate && checkDate <= endDate
}

/**
 * Formats period dates for consistent display
 */
export function formatPeriodDisplay(periodStart: string, periodEnd: string): string {
  const start = new Date(periodStart)
  const end = new Date(periodEnd)
  
  return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
}
