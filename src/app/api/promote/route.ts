import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
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

    // Get the current user session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
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
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id, user_id')
      .eq('id', postId)
      .eq('user_id', session.user.id)
      .single()

    if (postError || !post) {
      return NextResponse.json(
        { error: 'Post not found or unauthorized' },
        { status: 404 }
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
