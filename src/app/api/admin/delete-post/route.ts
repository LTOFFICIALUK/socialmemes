import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function DELETE(request: NextRequest) {
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

    // Get post ID from request body
    const { postId } = await request.json()

    if (!postId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Post ID is required' 
      }, { status: 400 })
    }

    // Validate post ID format (should be UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(postId)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid post ID format' 
      }, { status: 400 })
    }

    // First check if the post exists and get some details for logging
    const { data: post, error: fetchError } = await adminSupabase
      .from('posts')
      .select(`
        id,
        user_id,
        content,
        created_at,
        profiles!posts_user_id_fkey(username)
      `)
      .eq('id', postId)
      .maybeSingle()
    
    if (fetchError) {
      console.error('Error fetching post:', fetchError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch post details' 
      }, { status: 500 })
    }

    if (!post) {
      return NextResponse.json({ 
        success: false, 
        error: 'Post not found' 
      }, { status: 404 })
    }

    // Log the admin action for audit purposes
    console.log(`Admin ${user.id} deleting post ${postId} by user ${post.user_id} (${post.profiles?.username || 'unknown'})`)

    // Delete the post using service role (bypasses RLS)
    // The RLS policy we created will also allow this, but using service role is more explicit
    const { error: deleteError } = await adminSupabase
      .from('posts')
      .delete()
      .eq('id', postId)
    
    if (deleteError) {
      console.error('Error deleting post:', deleteError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to delete post' 
      }, { status: 500 })
    }

    // Return success response with post details for confirmation
    return NextResponse.json({
      success: true,
      message: 'Post deleted successfully',
      deletedPost: {
        id: post.id,
        author: post.profiles?.username || 'unknown',
        content: post.content?.substring(0, 100) + (post.content && post.content.length > 100 ? '...' : ''),
        createdAt: post.created_at
      }
    })

  } catch (error) {
    console.error('Admin post deletion error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
