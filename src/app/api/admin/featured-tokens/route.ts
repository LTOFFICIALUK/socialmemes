import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const MAX_FEATURED_TOKENS = 8

// GET - Fetch all featured tokens (admin view)
export async function GET(request: NextRequest) {
  try {
    // Get the current user from authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized - No auth header' },
        { status: 401 }
      )
    }

    // Create a service role client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Validate the user token and check if they're an admin
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: adminRow, error: adminError } = await supabase
      .from('admins')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle()

    if (adminError || !adminRow) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    // Fetch all featured tokens with user info
    const { data: featuredTokens, error } = await supabase
      .from('featured_tokens')
      .select(`
        *,
        profiles:user_id (
          username,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching featured tokens:', error)
      return NextResponse.json(
        { error: 'Failed to fetch featured tokens' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      featuredTokens: featuredTokens || []
    })

  } catch (error) {
    console.error('Error in admin featured tokens GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create or manage featured tokens (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    // Get the current user from authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized - No auth header' },
        { status: 401 }
      )
    }

    // Create a service role client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Validate the user token and check if they're an admin
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: adminRow, error: adminError } = await supabase
      .from('admins')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle()

    if (adminError || !adminRow) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    // Handle different actions
    if (action === 'create') {
      const { 
        title, 
        imageUrl, 
        destinationUrl, 
        duration,
        targetUserId
      } = body

      // Validate required fields
      if (!imageUrl || !destinationUrl || !duration) {
        return NextResponse.json(
          { error: 'Missing required fields: imageUrl, destinationUrl, duration' },
          { status: 400 }
        )
      }

      // Validate URL format
      try {
        new URL(destinationUrl)
      } catch {
        return NextResponse.json(
          { error: 'Invalid destination URL format' },
          { status: 400 }
        )
      }

      // Check capacity
      const { data: activeTokens, error: countError } = await supabase
        .rpc('get_active_featured_tokens', { limit_count: 100 })

      if (countError) {
        console.error('Error checking capacity:', countError)
        return NextResponse.json(
          { error: 'Failed to check capacity' },
          { status: 500 }
        )
      }

      if (activeTokens && activeTokens.length >= MAX_FEATURED_TOKENS) {
        return NextResponse.json(
          { error: 'Featured tokens are at maximum capacity. Please deactivate some tokens first.' },
          { status: 400 }
        )
      }

      // Calculate promotion times
      const promotionStart = new Date()
      const promotionEnd = new Date(promotionStart.getTime() + duration * 60 * 60 * 1000) // duration in hours

      // Get the next available display order
      const { data: maxOrderData } = await supabase
        .from('featured_tokens')
        .select('display_order')
        .order('display_order', { ascending: false })
        .limit(1)
        .single()

      const nextDisplayOrder = maxOrderData?.display_order !== undefined 
        ? maxOrderData.display_order + 1 
        : 0

      // Insert the featured token (admin-created, no payment)
      const { data: featuredToken, error: insertError } = await supabase
        .from('featured_tokens')
        .insert({
          user_id: targetUserId || user.id,
          title: title || null,
          image_url: imageUrl,
          destination_url: destinationUrl,
          is_active: true,
          promotion_start: promotionStart.toISOString(),
          promotion_end: promotionEnd.toISOString(),
          promotion_price: 0, // Admin-created tokens are free
          payment_tx_hash: null,
          payment_from_address: null,
          display_order: nextDisplayOrder
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error inserting featured token:', insertError)
        return NextResponse.json(
          { error: 'Failed to create featured token', details: insertError.message },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        featuredToken,
        message: 'Featured token created successfully'
      })

    } else if (action === 'deactivate') {
      const { tokenId } = body

      if (!tokenId) {
        return NextResponse.json(
          { error: 'Missing tokenId' },
          { status: 400 }
        )
      }

      const { error: updateError } = await supabase
        .from('featured_tokens')
        .update({ is_active: false })
        .eq('id', tokenId)

      if (updateError) {
        console.error('Error deactivating token:', updateError)
        return NextResponse.json(
          { error: 'Failed to deactivate token' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Token deactivated successfully'
      })

    } else if (action === 'activate') {
      const { tokenId } = body

      if (!tokenId) {
        return NextResponse.json(
          { error: 'Missing tokenId' },
          { status: 400 }
        )
      }

      // Check capacity before activating
      const { data: activeTokens, error: countError } = await supabase
        .rpc('get_active_featured_tokens', { limit_count: 100 })

      if (countError) {
        console.error('Error checking capacity:', countError)
        return NextResponse.json(
          { error: 'Failed to check capacity' },
          { status: 500 }
        )
      }

      if (activeTokens && activeTokens.length >= MAX_FEATURED_TOKENS) {
        return NextResponse.json(
          { error: 'Featured tokens are at maximum capacity. Please deactivate some tokens first.' },
          { status: 400 }
        )
      }

      const { error: updateError } = await supabase
        .from('featured_tokens')
        .update({ is_active: true })
        .eq('id', tokenId)

      if (updateError) {
        console.error('Error activating token:', updateError)
        return NextResponse.json(
          { error: 'Failed to activate token' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Token activated successfully'
      })

    } else if (action === 'delete') {
      const { tokenId } = body

      if (!tokenId) {
        return NextResponse.json(
          { error: 'Missing tokenId' },
          { status: 400 }
        )
      }

      const { error: deleteError } = await supabase
        .from('featured_tokens')
        .delete()
        .eq('id', tokenId)

      if (deleteError) {
        console.error('Error deleting token:', deleteError)
        return NextResponse.json(
          { error: 'Failed to delete token' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Token deleted successfully'
      })

    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Error in admin featured tokens POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

