import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * API endpoint to automatically unflag users after 24 hours
 * This can be called by:
 * 1. Vercel Cron Jobs
 * 2. External cron services
 * 3. Manual triggers
 * 
 * Recommended: Set up Vercel Cron to call this endpoint every hour
 * Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/unflag-users",
 *     "schedule": "0 * * * *"
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Verify the request is authorized (from Vercel Cron or has the correct secret)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    // If CRON_SECRET is set, verify it
    if (cronSecret) {
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ 
          success: false, 
          error: 'Unauthorized' 
        }, { status: 401 })
      }
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseServiceKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not set')
      return NextResponse.json({ 
        success: false, 
        error: 'Server configuration error' 
      }, { status: 500 })
    }

    // Use service role key to bypass RLS
    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get all flagged users whose flag has expired (older than 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    
    const { data: expiredFlags, error: fetchError } = await adminSupabase
      .from('profiles')
      .select('id, username, moderation_status, moderated_at')
      .eq('moderation_status', 'flagged')
      .lt('moderated_at', twentyFourHoursAgo)

    if (fetchError) {
      console.error('Error fetching expired flags:', fetchError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch expired flags' 
      }, { status: 500 })
    }

    if (!expiredFlags || expiredFlags.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No expired flags found',
        unflaggedCount: 0
      })
    }

    // Unflag all expired users
    const userIds = expiredFlags.map(u => u.id)
    
    const { error: updateError } = await adminSupabase
      .from('profiles')
      .update({
        moderation_status: 'active',
        moderation_reason: null,
        moderated_by: null,
        moderated_at: null
      })
      .in('id', userIds)

    if (updateError) {
      console.error('Error unflagging users:', updateError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to unflag users' 
      }, { status: 500 })
    }

    // Log the results
    console.log(`Successfully unflagged ${expiredFlags.length} users:`, 
      expiredFlags.map(u => u.username).join(', '))

    return NextResponse.json({
      success: true,
      message: `Successfully unflagged ${expiredFlags.length} user(s)`,
      unflaggedCount: expiredFlags.length,
      unflaggedUsers: expiredFlags.map(u => ({
        id: u.id,
        username: u.username,
        flaggedAt: u.moderated_at
      }))
    })

  } catch (error) {
    console.error('Cron unflag users error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// Also support POST requests for manual triggers
export async function POST(request: NextRequest) {
  return GET(request)
}

