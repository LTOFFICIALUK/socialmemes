import { NextRequest, NextResponse } from 'next/server'
import { createImpression } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { post_id, user_id } = body

    if (!post_id) {
      return NextResponse.json(
        { error: 'post_id is required' },
        { status: 400 }
      )
    }

    await createImpression({
      post_id,
      user_id: user_id || null
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error('Error tracking impression:', error)
    return NextResponse.json(
      { error: 'Failed to track impression' },
      { status: 500 }
    )
  }
}

