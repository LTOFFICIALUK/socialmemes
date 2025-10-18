import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const type = searchParams.get('type') // 'users' or 'posts'
    const excludeUser = searchParams.get('exclude_user') // User ID to exclude from results
    const currentUserId = searchParams.get('current_user_id') // Current user ID for like status

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ results: [] })
    }

    const searchTerm = `%${query.trim()}%`

    if (type === 'users') {
      // Search for users only (for instant dropdown)
      let queryBuilder = supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, pro')
        .or(`username.ilike.${searchTerm},full_name.ilike.${searchTerm}`)
        .limit(5)

      // Exclude the current user if exclude_user parameter is provided
      if (excludeUser) {
        queryBuilder = queryBuilder.neq('id', excludeUser)
      }

      const { data: users, error: usersError } = await queryBuilder

      if (usersError) {
        console.error('Error searching users:', usersError)
        return NextResponse.json({ results: [] })
      }

      const results = users?.map(user => ({
        id: user.id,
        type: 'user',
        title: user.full_name || user.username,
        subtitle: `@${user.username}`,
        avatar: user.avatar_url,
        username: user.username,
        pro: user.pro
      })) || []

      return NextResponse.json({ results })

    } else {
      // Search for posts (for search page)
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          profiles (id, username, full_name, avatar_url, pro),
          likes_count:likes(count)
        `)
        .or(`content.ilike.${searchTerm},token_symbol.ilike.${searchTerm}`)
        .order('created_at', { ascending: false })
        .limit(20)

      if (postsError) {
        console.error('Error searching posts:', postsError)
        return NextResponse.json({ results: [] })
      }

      console.log('Search API: Posts found:', posts?.length || 0)
      if (posts && posts.length > 0) {
        console.log('Search API: First post profile data:', posts[0].profiles)
      }

      // Get user likes if currentUserId is provided
      let userLikes: string[] = []
      if (currentUserId && posts && posts.length > 0) {
        const postIds = posts.map((post: { id: string }) => post.id)
        console.log('Search API: Getting likes for user:', currentUserId, 'posts:', postIds)
        
        const { data: likesData, error: likesError } = await supabase
          .from('likes')
          .select('post_id')
          .eq('user_id', currentUserId)
          .in('post_id', postIds)
        
        if (likesError) {
          console.error('Search API: Error fetching user likes:', likesError)
        } else {
          userLikes = likesData?.map(like => like.post_id) || []
          console.log('Search API: User likes found:', userLikes)
        }
      }

      const results = posts?.map((post: { 
        id: string; 
        user_id: string; 
        content: string; 
        token_symbol: string | null; 
        created_at: string; 
        profiles: { username: string; full_name: string | null; avatar_url: string | null; pro?: boolean }; 
        likes_count: { count: number }[] | null 
      }) => {
        const profile = post.profiles
        console.log('Search API: Processing post:', {
          postId: post.id,
          userId: post.user_id,
          profiles: post.profiles,
          profile: profile
        })
        return {
          id: post.id,
          user_id: post.user_id,
          content: post.content,
          token_symbol: post.token_symbol,
          created_at: post.created_at,
          profiles: profile, // Keep the nested structure that PostCard expects
          likes_count: post.likes_count?.[0]?.count || 0,
          replies_count: 0, // Add default value for consistency
          is_liked: currentUserId ? userLikes.includes(post.id) : false,
          impression_count: 0 // Add default value for consistency
        }
      }) || []

      return NextResponse.json({ results })
    }

  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
