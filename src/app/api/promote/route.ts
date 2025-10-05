import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyPayment } from '@/lib/solana'

export async function POST(request: NextRequest) {
  try {
    const { postId, duration, price, signature, fromAddress } = await request.json()

    // Validate required fields
    if (!postId || !duration || !price || !signature) {
      return NextResponse.json(
        { error: 'Missing required fields: postId, duration, price, signature' },
        { status: 400 }
      )
    }

    // Get the current user from authorization header
    const authHeader = request.headers.get('authorization')
    console.log('Promote API - Auth header:', { hasAuthHeader: !!authHeader, authHeader: authHeader?.substring(0, 20) + '...' })
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized - No auth header' },
        { status: 401 }
      )
    }

    // Create a service role client for server-side operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Validate the user token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    console.log('Promote API - User auth:', { hasUser: !!user, authError: authError?.message })
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token', details: authError?.message },
        { status: 401 }
      )
    }

    // Verify the payment transaction
    const paymentVerification = await verifyPayment(signature, price, fromAddress)
    
    if (!paymentVerification.isValid) {
      return NextResponse.json(
        { 
          error: 'Payment verification failed',
          details: paymentVerification.error 
        },
        { status: 400 }
      )
    }

    // Check if the post exists and belongs to the user
    console.log('Promote API - Looking for post:', { postId, userId: user.id })
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id, user_id')
      .eq('id', postId)
      .eq('user_id', user.id)
      .single()

    console.log('Promote API - Post lookup result:', { hasPost: !!post, postError: postError?.message, post })
    if (postError || !post) {
      return NextResponse.json(
        { error: 'Post not found or unauthorized', details: postError?.message },
        { status: 404 }
      )
    }

    // Check if user is Pro and calculate discount
    const { data: profile } = await supabase
      .from('profiles')
      .select('pro')
      .eq('id', user.id)
      .single()

    const isProUser = profile?.pro || false
    const discount = isProUser ? 0.2 : 0
    
    // Calculate the base price (what the price would be without discount)
    const basePrice = price / (1 - discount)
    
    // Verify the price is reasonable (should be the discounted amount)
    const expectedDiscountedPrice = basePrice * (1 - discount)
    if (Math.abs(price - expectedDiscountedPrice) > 0.001) {
      return NextResponse.json(
        { error: 'Price mismatch - discount may not be applied correctly' },
        { status: 400 }
      )
    }

    // Calculate promotion end time
    const promotionStart = new Date()
    const promotionEnd = new Date(promotionStart.getTime() + duration * 60 * 60 * 1000) // duration in hours

    // Update the post with promotion details
    const { data: updatedPost, error: updateError } = await supabase
      .from('posts')
      .update({
        is_promoted: true,
        promotion_start: promotionStart.toISOString(),
        promotion_end: promotionEnd.toISOString(),
        promotion_price: price,
        payment_tx_hash: signature
      })
      .eq('id', postId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating post:', updateError)
      return NextResponse.json(
        { error: 'Failed to update post' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      post: updatedPost,
      promotion: {
        start: promotionStart.toISOString(),
        end: promotionEnd.toISOString(),
        price,
        signature
      }
    })

  } catch (error) {
    console.error('Error in promote API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
