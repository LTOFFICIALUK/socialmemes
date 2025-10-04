import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ownerId: string }> }
) {
  try {
    const { ownerId } = await params

    // Get current user from Authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = user.id

    // Create a new Supabase client with the user's JWT token for RLS
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseWithAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    )

    // Check if user has access to this alpha chat
    // Owner always has access, otherwise check subscription
    const hasAccess = userId === ownerId || await checkAlphaChatAccess(ownerId, userId, supabaseWithAuth)
    console.log('Access check result:', { userId, ownerId, isOwner: userId === ownerId, hasAccess })
    
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied. You need to subscribe to this alpha chat.' },
        { status: 403 }
      )
    }

    // Get alpha chat messages using the authenticated client
    console.log('Fetching alpha chat messages for owner:', ownerId, 'user:', userId)
    const { data: messages, error } = await supabaseWithAuth
      .from('alpha_chat_messages')
      .select(`
        *,
        author:profiles!alpha_chat_messages_author_id_fkey (*)
      `)
      .eq('alpha_chat_owner_id', ownerId)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching alpha chat messages:', error)
      return NextResponse.json(
        { error: 'Failed to fetch messages', details: error.message },
        { status: 500 }
      )
    }

    // Process messages with likes and reaction data
    const processedMessages = (messages || []).map((message: { 
      id: string; 
      likes_count: number; 
      liked_by: string[]; 
      fire_count: number;
      fire_reacted_by: string[];
      diamond_count: number;
      diamond_reacted_by: string[];
      money_count: number;
      money_reacted_by: string[];
      author: Record<string, unknown>; 
      [key: string]: unknown 
    }) => ({
      ...message,
      profiles: message.author, // Map author to profiles for consistency
      likes_count: message.likes_count || 0,
      is_liked: userId ? message.liked_by?.includes(userId) || false : false,
      fire_count: message.fire_count || 0,
      is_fire_reacted: userId ? message.fire_reacted_by?.includes(userId) || false : false,
      diamond_count: message.diamond_count || 0,
      is_diamond_reacted: userId ? message.diamond_reacted_by?.includes(userId) || false : false,
      money_count: message.money_count || 0,
      is_money_reacted: userId ? message.money_reacted_by?.includes(userId) || false : false
    }))

    return NextResponse.json({
      messages: processedMessages
    })

  } catch (error) {
    console.error('Alpha chat messages error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ ownerId: string }> }
) {
  try {
    const { ownerId } = await params
    const { content, image_url, token_symbol, token_address, token_name, dex_screener_url } = await request.json()

    // Get current user from Authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = user.id

    // Create a new Supabase client with the user's JWT token for RLS
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseWithAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    )

    // Check if user has access to this alpha chat
    const hasAccess = userId === ownerId || await checkAlphaChatAccess(ownerId, userId, supabaseWithAuth)
    console.log('Alpha chat access check:', { userId, ownerId, hasAccess })
    
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied. You need to subscribe to this alpha chat.' },
        { status: 403 }
      )
    }

    // Validate content
    if (!content && !image_url) {
      return NextResponse.json(
        { error: 'Content or image is required' },
        { status: 400 }
      )
    }

    // Create alpha chat message
    const { data: message, error } = await supabaseWithAuth
      .from('alpha_chat_messages')
      .insert({
        alpha_chat_owner_id: ownerId,
        author_id: userId,
        content,
        image_url,
        token_symbol,
        token_address,
        token_name,
        dex_screener_url
      })
      .select(`
        *,
        author:profiles!alpha_chat_messages_author_id_fkey (*)
      `)
      .single()

    if (error) {
      console.error('Error creating alpha chat message:', error)
      return NextResponse.json(
        { error: 'Failed to create message', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: {
        ...message,
        profiles: message.author, // Map author to profiles for consistency
        likes_count: 0,
        is_liked: false
      }
    })

  } catch (error) {
    console.error('Alpha chat message creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to check alpha chat access
async function checkAlphaChatAccess(ownerId: string, userId: string, supabaseClient?: typeof supabase): Promise<boolean> {
  console.log('Checking alpha chat access for:', { ownerId, userId })
  
  const client = supabaseClient || supabase
  const { data, error } = await client
    .from('alpha_chat_members')
    .select('id')
    .eq('alpha_chat_owner_id', ownerId)
    .eq('subscriber_id', userId)
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .maybeSingle() // Use maybeSingle() instead of single() to handle no results gracefully
  
  console.log('Alpha chat access query result:', { data, error })
  
  // Return true if we have data and no error, false otherwise
  // maybeSingle() returns null for data when no record is found, which is not an error
  return !error && !!data
}
