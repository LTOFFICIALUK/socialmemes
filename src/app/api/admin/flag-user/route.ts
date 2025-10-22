import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    // Get the current user from the request
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        success: false, 
        error: 'No authorization header found' 
      }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseServiceKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not set in environment variables')
      return NextResponse.json({ 
        success: false, 
        error: 'Server configuration error. Contact administrator.' 
      }, { status: 500 })
    }
    
    // First verify the user with anon key
    const authSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })

    // Verify the JWT token and get user
    const { data: { user }, error: authError } = await authSupabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid or expired token' 
      }, { status: 401 })
    }

    // Check if user is an admin using service role to bypass RLS
    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { data: adminCheck, error: adminError } = await adminSupabase
      .from('admins')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle()

    if (adminError || !adminCheck) {
      return NextResponse.json({ 
        success: false, 
        error: 'Access denied. Admin privileges required.' 
      }, { status: 403 })
    }

    // Get user ID and reason from request body
    const { userId, reason } = await request.json()

    if (!userId || !reason) {
      return NextResponse.json({ 
        success: false, 
        error: 'User ID and reason are required' 
      }, { status: 400 })
    }

    // Validate user ID format (should be UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(userId)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid user ID format' 
      }, { status: 400 })
    }

    // Check if user exists and get their details
    const { data: targetUser, error: userError } = await adminSupabase
      .from('profiles')
      .select('id, username, moderation_status')
      .eq('id', userId)
      .maybeSingle()
    
    if (userError) {
      console.error('Error fetching user:', userError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch user details' 
      }, { status: 500 })
    }

    if (!targetUser) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 })
    }

    // Check if user is already flagged or banned
    if (targetUser.moderation_status === 'flagged') {
      return NextResponse.json({ 
        success: false, 
        error: 'User is already flagged' 
      }, { status: 400 })
    }

    if (targetUser.moderation_status === 'banned') {
      return NextResponse.json({ 
        success: false, 
        error: 'User is already banned' 
      }, { status: 400 })
    }

    // Log the admin action for audit purposes
    console.log(`Admin ${user.id} flagging user ${userId} (${targetUser.username}) - Reason: ${reason}`)

    // Start transaction: flag user and update profile
    const { error: flagError } = await adminSupabase
      .from('user_flags')
      .insert({
        user_id: userId,
        flagged_by: user.id,
        reason: reason
      })

    if (flagError) {
      console.error('Error creating user flag:', flagError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to flag user' 
      }, { status: 500 })
    }

    // Update user's moderation status
    const { error: updateError } = await adminSupabase
      .from('profiles')
      .update({
        moderation_status: 'flagged',
        moderation_reason: reason,
        moderated_by: user.id,
        moderated_at: new Date().toISOString()
      })
      .eq('id', userId)
    
    if (updateError) {
      console.error('Error updating user moderation status:', updateError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to update user status' 
      }, { status: 500 })
    }

    // Create notification for the flagged user
    const { error: notificationError } = await adminSupabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'moderation_flag',
        actor_id: user.id, // Admin who flagged them
        metadata: {
          reason: reason,
          duration: '24 hours',
          flagged_at: new Date().toISOString()
        }
      })

    if (notificationError) {
      console.error('Error creating flag notification:', notificationError)
      // Don't fail the entire operation if notification fails
      // The flag was still successful
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'User flagged successfully',
      flaggedUser: {
        id: targetUser.id,
        username: targetUser.username,
        reason: reason,
        flaggedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Admin flag user error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
