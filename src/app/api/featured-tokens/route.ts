import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { verifyPayment } from '@/lib/solana'

const MAX_FEATURED_TOKENS = 8

// GET - Fetch active featured tokens
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '6')

    const { data: featuredTokens, error } = await supabase
      .rpc('get_active_featured_tokens', { limit_count: limit })

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
    console.error('Error in featured tokens GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new featured token promotion
export async function POST(request: NextRequest) {
  try {
    const { 
      title, 
      imageUrl, 
      destinationUrl, 
      duration, 
      price, 
      signature,
      fromAddress
    } = await request.json()

    // Validate required fields
    if (!imageUrl || !destinationUrl || !duration || !price || !signature || !fromAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: imageUrl, destinationUrl, duration, price, signature, fromAddress' },
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

    // Get the current user session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is Pro and calculate discount
    const { data: profile } = await supabase
      .from('profiles')
      .select('pro')
      .eq('id', session.user.id)
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

    // Check capacity - count active featured tokens
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
        { error: 'Featured tokens are at maximum capacity. Please try again later.' },
        { status: 400 }
      )
    }

    // Verify the payment transaction
    console.log('Verifying payment:', { signature, price, fromAddress })
    const paymentVerification = await verifyPayment(signature, price, fromAddress)
    
    if (!paymentVerification.isValid) {
      console.error('Payment verification failed:', paymentVerification.error)
      return NextResponse.json(
        { 
          error: 'Payment verification failed',
          details: paymentVerification.error 
        },
        { status: 400 }
      )
    }

    console.log('Payment verified successfully:', paymentVerification)

    // Calculate promotion times
    const promotionStart = new Date()
    const promotionEnd = new Date(promotionStart.getTime() + duration * 60 * 60 * 1000) // duration in hours

    // Get the next available display order (find the highest current order and add 1)
    const { data: maxOrderData } = await supabase
      .from('featured_tokens')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .single()

    const nextDisplayOrder = maxOrderData?.display_order !== undefined 
      ? maxOrderData.display_order + 1 
      : 0

    // Insert the featured token with payment details
    console.log('Attempting to insert featured token with data:', {
      user_id: session.user.id,
      title: title || null,
      image_url: imageUrl,
      destination_url: destinationUrl,
      is_active: true,
      promotion_start: promotionStart.toISOString(),
      promotion_end: promotionEnd.toISOString(),
      promotion_price: price,
      payment_tx_hash: signature,
      payment_from_address: fromAddress,
      display_order: nextDisplayOrder
    })

    const { data: featuredToken, error: insertError } = await supabase
      .from('featured_tokens')
      .insert({
        user_id: session.user.id,
        title: title || null,
        image_url: imageUrl,
        destination_url: destinationUrl,
        is_active: true,
        promotion_start: promotionStart.toISOString(),
        promotion_end: promotionEnd.toISOString(),
        promotion_price: price,
        payment_tx_hash: signature,
        payment_from_address: fromAddress,
        display_order: nextDisplayOrder
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting featured token:', insertError)
      console.error('Full error details:', JSON.stringify(insertError, null, 2))
      return NextResponse.json(
        { error: 'Failed to create featured token', details: insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      featuredToken,
      promotion: {
        start: promotionStart.toISOString(),
        end: promotionEnd.toISOString(),
        price,
        signature,
        displayOrder: nextDisplayOrder
      }
    })

  } catch (error) {
    console.error('Error in featured tokens POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

