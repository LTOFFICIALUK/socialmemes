import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: 'Query must be at least 2 characters long' },
        { status: 400 }
      )
    }

    // Create a service role client for server-side operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const searchTerm = query.trim()

    // Search by username (case insensitive)
    const { data: usernameResults, error: usernameError } = await supabase
      .from('profiles')
      .select('id, username, pro, avatar_url')
      .ilike('username', `%${searchTerm}%`)
      .limit(5)

    if (usernameError) {
      console.error('Username search error:', usernameError)
      return NextResponse.json(
        { error: 'Failed to search users by username' },
        { status: 500 }
      )
    }

    // Search by exact user ID match (only if it looks like a UUID)
    let idResults: Array<{ id: string; username: string; pro: boolean; avatar_url: string | null }> = []
    let idError = null
    
    // Check if the search term looks like a UUID (36 characters with hyphens)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (uuidRegex.test(searchTerm)) {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, pro, avatar_url')
        .eq('id', searchTerm)
        .limit(5)
      
      idResults = data || []
      idError = error
    }

    if (idError) {
      console.error('ID search error:', idError)
      return NextResponse.json(
        { error: 'Failed to search users by ID' },
        { status: 500 }
      )
    }

    // Combine results and remove duplicates
    const allResults = [...(usernameResults || []), ...(idResults || [])]
    const uniqueUsers = allResults.filter((user, index, self) => 
      index === self.findIndex(u => u.id === user.id)
    ).slice(0, 10)

    return NextResponse.json({
      success: true,
      users: uniqueUsers
    })

  } catch (error) {
    console.error('User search error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
