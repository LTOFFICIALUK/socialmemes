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

export async function POST() {
  try {
    console.log('Starting cleanup of duplicate user payouts...')

    // Step 1: Get all payouts to identify duplicates
    const { data: allPayouts, error: fetchError } = await supabase
      .from('user_payouts')
      .select('*')
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('Error fetching payouts:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch payouts', details: fetchError.message },
        { status: 500 }
      )
    }

    // Group by user_id, period_start, period_end to find duplicates
    const userPeriodMap = new Map<string, typeof allPayouts>()
    allPayouts?.forEach(payout => {
      const key = `${payout.user_id}-${payout.period_start}-${payout.period_end}`
      if (!userPeriodMap.has(key)) {
        userPeriodMap.set(key, [])
      }
      userPeriodMap.get(key)!.push(payout)
    })

    // Delete duplicates (keep the most recent one)
    let deletedCount = 0
    for (const [, payouts] of userPeriodMap.entries()) {
      if (payouts.length > 1) {
        // Sort by created_at descending to keep the most recent
        payouts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        
        // Delete all except the first (most recent)
        const toDelete = payouts.slice(1)
        for (const payout of toDelete) {
          const { error: deleteError } = await supabase
            .from('user_payouts')
            .delete()
            .eq('id', payout.id)
          
          if (deleteError) {
            console.error(`Error deleting payout ${payout.id}:`, deleteError)
          } else {
            deletedCount++
          }
        }
      }
    }

    console.log(`Deleted ${deletedCount} duplicate payout entries`)

    // Step 2: Verify the fix worked by checking for remaining duplicates
    const { data: remainingPayouts, error: verifyError } = await supabase
      .from('user_payouts')
      .select('user_id, period_start, period_end')
      .order('created_at', { ascending: false })

    if (verifyError) {
      console.error('Error verifying fix:', verifyError)
      return NextResponse.json(
        { error: 'Failed to verify fix', details: verifyError.message },
        { status: 500 }
      )
    }

    // Count remaining duplicates
    const remainingUserPeriodMap = new Map<string, number>()
    remainingPayouts?.forEach(payout => {
      const key = `${payout.user_id}-${payout.period_start}-${payout.period_end}`
      remainingUserPeriodMap.set(key, (remainingUserPeriodMap.get(key) || 0) + 1)
    })

    const duplicatesRemaining = Array.from(remainingUserPeriodMap.values()).filter(count => count > 1).length

    return NextResponse.json({
      success: true,
      message: 'Successfully fixed duplicate payouts',
      deletedCount,
      duplicatesRemaining,
      totalPayouts: remainingPayouts?.length || 0,
      details: {
        cleanupCompleted: true,
        verificationCompleted: !verifyError
      }
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Unexpected error occurred', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
