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
    
    // Build a per-request Supabase client with the user's JWT so RLS runs as that user
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

    // Check if user is an admin using the database function
    const { data: isAdminResult, error: adminError } = await serverSupabase
      .rpc('is_admin', { user_uuid: user.id })

    if (adminError) {
      console.error('Error checking admin status:', adminError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to check admin status' 
      }, { status: 500 })
    }

    const isAdmin = isAdminResult === true

    return NextResponse.json({
      success: true,
      isAdmin,
      userId: user.id
    })

  } catch (error) {
    console.error('Admin access check error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// Alternative method using direct table query (backup)
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const { userId } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'User ID is required' 
      }, { status: 400 })
    }

    // Build a per-request Supabase client with the user's JWT so RLS runs as that user
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
    const serverSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: token ? { Authorization: `Bearer ${token}` } : {} },
    })

    // Check if user is an admin by querying the admins table directly
    const { data: adminRecord, error } = await serverSupabase
      .from('admins')
      .select('id, is_active, permissions')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error checking admin status:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to check admin status' 
      }, { status: 500 })
    }

    const isAdmin = !!adminRecord

    return NextResponse.json({
      success: true,
      isAdmin,
      userId,
      adminRecord: isAdmin ? adminRecord : null
    })

  } catch (error) {
    console.error('Admin access check error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
