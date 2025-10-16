import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
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
    const serverSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })

    // Verify the JWT token and get user
    const { data: { user }, error: authError } = await serverSupabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid or expired token' 
      }, { status: 401 })
    }

    // Check if user is an admin
    const { data: isAdminResult, error: adminError } = await serverSupabase
      .rpc('is_admin', { user_uuid: user.id })

    if (adminError || !isAdminResult) {
      return NextResponse.json({ 
        success: false, 
        error: 'Access denied. Admin privileges required.' 
      }, { status: 403 })
    }

    // Get all admin users
    const { data: admins, error: fetchError } = await serverSupabase
      .from('admins')
      .select(`
        id,
        user_id,
        created_at,
        created_by,
        is_active,
        permissions,
        profiles:user_id (
          username,
          email
        )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('Error fetching admin users:', fetchError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch admin users' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      admins: admins || []
    })

  } catch (error) {
    console.error('Admin management error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

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
    const serverSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })

    // Verify the JWT token and get user
    const { data: { user }, error: authError } = await serverSupabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid or expired token' 
      }, { status: 401 })
    }

    // Check if user is an admin
    const { data: isAdminResult, error: adminError } = await serverSupabase
      .rpc('is_admin', { user_uuid: user.id })

    if (adminError || !isAdminResult) {
      return NextResponse.json({ 
        success: false, 
        error: 'Access denied. Admin privileges required.' 
      }, { status: 403 })
    }

    const { action, userId, permissions } = await request.json()

    if (!action || !userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Action and userId are required' 
      }, { status: 400 })
    }

    if (action === 'add') {
      // Add new admin
      const { error: insertError } = await serverSupabase
        .from('admins')
        .insert({
          user_id: userId,
          created_by: user.id,
          permissions: permissions || {},
          is_active: true
        })

      if (insertError) {
        console.error('Error adding admin user:', insertError)
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to add admin user' 
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Admin user added successfully'
      })

    } else if (action === 'remove') {
      // Remove admin access
      const { error: updateError } = await serverSupabase
        .from('admins')
        .update({ is_active: false })
        .eq('user_id', userId)

      if (updateError) {
        console.error('Error removing admin user:', updateError)
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to remove admin user' 
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Admin user removed successfully'
      })

    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid action. Use "add" or "remove"' 
      }, { status: 400 })
    }

  } catch (error) {
    console.error('Admin management error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
