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

    // Get all admin users with service role to bypass RLS
    const { data: admins, error: fetchError } = await adminSupabase
      .from('admins')
      .select(`
        id,
        user_id,
        created_at,
        created_by,
        is_active,
        permissions
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

    // Fetch profiles for all admin users
    if (admins && admins.length > 0) {
      const userIds = admins.map(admin => admin.user_id)
      const { data: profiles } = await adminSupabase
        .from('profiles')
        .select('id, username')
        .in('id', userIds)
      
      // Merge profiles into admins
      const adminsWithProfiles = admins.map(admin => ({
        ...admin,
        profiles: profiles?.find(p => p.id === admin.user_id) || null
      }))

      return NextResponse.json({
        success: true,
        admins: adminsWithProfiles
      })
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

    const { action, userId, username, permissions } = await request.json()

    if (!action) {
      return NextResponse.json({ 
        success: false, 
        error: 'Action is required' 
      }, { status: 400 })
    }

    if (action === 'add') {
      // Look up user by username if provided
      let targetUserId = userId
      
      if (username && !userId) {
        const { data: profile, error: profileError } = await adminSupabase
          .from('profiles')
          .select('id, username')
          .eq('username', username)
          .maybeSingle()

        if (profileError || !profile) {
          return NextResponse.json({ 
            success: false, 
            error: 'User not found with that username' 
          }, { status: 404 })
        }
        
        targetUserId = profile.id
      }

      if (!targetUserId) {
        return NextResponse.json({ 
          success: false, 
          error: 'Username or userId is required' 
        }, { status: 400 })
      }

      // Add new admin using service role to bypass RLS
      const { error: insertError } = await adminSupabase
        .from('admins')
        .insert({
          user_id: targetUserId,
          created_by: user.id,
          permissions: permissions || {},
          is_active: true
        })

      if (insertError) {
        console.error('Error adding admin user:', insertError)
        // Check for duplicate key error
        if (insertError.code === '23505') {
          return NextResponse.json({ 
            success: false, 
            error: 'This user is already an admin' 
          }, { status: 400 })
        }
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
      if (!userId) {
        return NextResponse.json({ 
          success: false, 
          error: 'userId is required for remove action' 
        }, { status: 400 })
      }

      // Remove admin access using service role to bypass RLS
      const { error: updateError } = await adminSupabase
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
