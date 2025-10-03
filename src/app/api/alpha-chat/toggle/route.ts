import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { enabled, userId } = await request.json()

    // Validate input
    if (typeof enabled !== 'boolean' || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: enabled, userId' },
        { status: 400 }
      )
    }

    // Create a service role client for server-side operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    console.log('Processing Alpha chat toggle for user:', userId, 'enabled:', enabled)

    // Check if user is pro
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('pro')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    if (!profile.pro) {
      return NextResponse.json(
        { error: 'Only Pro users can enable alpha chat' },
        { status: 403 }
      )
    }

    // Update alpha_chat_enabled status
    const { data, error } = await supabase
      .from('profiles')
      .update({ alpha_chat_enabled: enabled })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating alpha chat status:', error)
      return NextResponse.json(
        { error: 'Failed to update alpha chat status' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      alpha_chat_enabled: data.alpha_chat_enabled
    })

  } catch (error) {
    console.error('Alpha chat toggle error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
