import { NextRequest, NextResponse } from 'next/server'
import { getTrendingTokensWithImages } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '5')
    const timePeriod = searchParams.get('timePeriod') || '24 hours'

    const data = await getTrendingTokensWithImages(limit, timePeriod)

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching trending tokens:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trending tokens' },
      { status: 500 }
    )
  }
}
