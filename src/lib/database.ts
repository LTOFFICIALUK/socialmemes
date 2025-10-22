import { supabase } from './supabase'
import { Database } from './supabase'

export type Profile = Database['public']['Tables']['profiles']['Row'] & {
  payout_wallet_address?: string | null
}
export type Post = Database['public']['Tables']['posts']['Row'] & {
  profiles: Profile
  likes_count: number
  replies_count: number
  is_liked: boolean
  impression_count: number
  is_alpha_chat_message?: boolean // Optional flag to identify alpha chat messages
}
export type Reply = {
  id: string
  user_id: string
  post_id: string
  parent_reply_id: string | null
  content: string | null
  image_url: string | null
  token_symbol: string | null
  token_address: string | null
  token_name: string | null
  dex_screener_url: string | null
  created_at: string
  updated_at: string
  profiles: Profile
  likes_count: number
  is_liked: boolean
}
export type Follow = Database['public']['Tables']['follows']['Row']

export type AlphaChatMember = Database['public']['Tables']['alpha_chat_members']['Row']

export type AlphaChatMessage = Database['public']['Tables']['alpha_chat_messages']['Row'] & {
  profiles: Profile
  likes_count: number
  is_liked: boolean
  fire_count: number
  is_fire_reacted: boolean
  diamond_count: number
  is_diamond_reacted: boolean
  money_count: number
  is_money_reacted: boolean
}

export type Notification = Database['public']['Tables']['notifications']['Row'] & {
  actor: Profile
  post?: Post
  reply?: Reply
}

export type TrendingToken = {
  token_symbol: string
  token_name: string
  token_address: string
  dex_screener_url: string
  post_count: number
  total_likes: number
  trending_score: number
}

export type FeaturedToken = {
  id: string
  user_id: string
  title: string | null
  image_url: string
  destination_url: string
  display_order: number
  promotion_end: string
}

// Profile functions
export const getProfile = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) return null
  return data
}

export const getProfileByUsername = async (username: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()
  
  if (error) return null
  return data
}

export const updateProfile = async (userId: string, updates: Partial<Profile>) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
  
  if (error) throw error
  return data
}

// Post functions
export const createPost = async (post: {
  user_id: string
  content?: string
  image_url?: string
  token_symbol?: string
  token_address?: string
  token_name?: string
  dex_screener_url?: string
}) => {
  const { data, error } = await supabase
    .from('posts')
    .insert(post)
    .select(`
      *,
      profiles (*),
      likes_count:likes(count),
      replies_count:replies(count)
    `)
    .single()
  
  if (error) throw error
  
  // Process the post data to match the expected format
  const processedPost = {
    ...data,
    likes_count: data.likes_count?.[0]?.count || 0,
    replies_count: data.replies_count?.[0]?.count || 0,
    is_liked: false, // New posts are not liked by default
    impression_count: 0 // New posts have no impressions
  }
  
  return processedPost
}

export const deletePost = async (userId: string, postId: string) => {
  // First check if the user owns the post
  const { data: post, error: fetchError } = await supabase
    .from('posts')
    .select('user_id')
    .eq('id', postId)
    .single()
  
  if (fetchError) throw new Error('Post not found')
  if (post.user_id !== userId) throw new Error('Unauthorized: You can only delete your own posts')
  
  // Delete the post
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId)
    .eq('user_id', userId) // Double check ownership
  
  if (error) throw error
}

export const deletePostAsAdmin = async (postId: string) => {
  // Call the admin deletion API endpoint
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.access_token) {
    throw new Error('No authentication token found')
  }

  const response = await fetch('/api/admin/delete-post', {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ postId })
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error || 'Failed to delete post')
  }

  return result
}

// Type for raw database result with count arrays
type RawPost = Omit<Database['public']['Tables']['posts']['Row'], 'impression_count'> & {
  profiles: Profile
  likes_count: { count: number }[]
  replies_count: { count: number }[]
  impression_count: number
}

export const getPosts = async (userId?: string, limit = 20, offset = 0): Promise<Post[]> => {
  try {
    // Build the select query with proper PostgREST syntax
    const selectQuery = `
      *,
      profiles (*),
      likes_count:likes(count),
      replies_count:replies(count)
    `
    
    // Get regular posts (include expired promoted posts, exclude active promoted posts to avoid duplicates)
    const now = new Date().toISOString()
    
    // Query for regular posts: never promoted OR promoted but expired
    const { data: regularPosts, error: regularError } = await supabase
      .from('posts')
      .select(selectQuery)
      .or(`is_promoted.is.null,is_promoted.eq.false,promotion_end.lt.${now}`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (regularError) {
      console.error('Error fetching regular posts:', regularError.message)
      throw new Error(`Failed to fetch posts: ${regularError.message}`)
    }

    // Get active promoted posts (only currently active promotions)
    // Must have is_promoted=true AND promotion_end is in the future
    const { data: promotedPosts, error: promotedError } = await supabase
      .from('posts')
      .select(selectQuery)
      .eq('is_promoted', true)
      .not('promotion_end', 'is', null)
      .gte('promotion_end', now)
      .order('promotion_start', { ascending: false })

    if (promotedError) {
      console.warn('Error fetching promoted posts:', promotedError.message)
    }
    
    // Debug logging
    console.log('Current time:', now)
    console.log('Regular posts count:', regularPosts?.length || 0)
    console.log('Active promoted posts count:', promotedPosts?.length || 0)
    if (promotedPosts && promotedPosts.length > 0) {
      console.log('Active promoted posts:', promotedPosts.map((p: { id: string; promotion_end: string | null }) => ({
        id: p.id,
        promotion_end: p.promotion_end
      })))
    }

    // Get all user likes in a single query if userId is provided
    let userLikes: string[] = []
    const allPosts = [...(regularPosts || []), ...(promotedPosts || [])]
    
    if (userId && allPosts.length > 0) {
      const postIds = allPosts.map((post: { id: string }) => post.id)
      const { data: likesData, error: likesError } = await supabase
        .from('likes')
        .select('post_id')
        .eq('user_id', userId)
        .in('post_id', postIds)
      
      if (likesError) {
        console.warn('Error fetching user likes:', likesError.message)
        // Continue without likes data rather than failing completely
      } else {
        userLikes = likesData?.map(like => like.post_id) || []
      }
    }
    
    // Process posts
    const processedRegularPosts = (regularPosts || []).map((post: RawPost) => ({
      ...post,
      likes_count: post.likes_count?.[0]?.count || 0,
      replies_count: post.replies_count?.[0]?.count || 0,
      is_liked: userId ? userLikes.includes(post.id) : false,
      impression_count: post.impression_count || 0
    }))

    const processedPromotedPosts = (promotedPosts || []).map((post: RawPost) => ({
      ...post,
      likes_count: post.likes_count?.[0]?.count || 0,
      replies_count: post.replies_count?.[0]?.count || 0,
      is_liked: userId ? userLikes.includes(post.id) : false,
      impression_count: post.impression_count || 0
    }))
    
    // Mix promoted posts every 10 posts, but ensure promoted posts always show
    const mixedPosts: Post[] = []
    const promotedPostsCopy = [...processedPromotedPosts]
    
    // If there are no regular posts, just return promoted posts
    if (processedRegularPosts.length === 0) {
      return processedPromotedPosts as Post[]
    }
    
    for (let i = 0; i < processedRegularPosts.length; i++) {
      // Add regular post
      mixedPosts.push(processedRegularPosts[i])
      
      // Every 10 posts, add a promoted post if available
      if ((i + 1) % 10 === 0 && promotedPostsCopy.length > 0) {
        const promotedPost = promotedPostsCopy.shift() // Remove and get first promoted post
        if (promotedPost) {
          mixedPosts.push(promotedPost)
        }
      }
    }
    
    // If we have remaining promoted posts and no regular posts to mix them with,
    // add them at the end
    if (promotedPostsCopy.length > 0) {
      mixedPosts.push(...promotedPostsCopy)
    }
    
    return mixedPosts as Post[]
  } catch (error) {
    console.error('Error in getPosts function:', error)
    throw error
  }
}

export const getPostsByUser = async (userId: string, limit = 20, offset = 0): Promise<Post[]> => {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      profiles (*),
      likes_count:likes(count),
      replies_count:replies(count)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
  
  if (error) throw error
  
  // Get all user likes in a single query
  let userLikes: string[] = []
  if (data && data.length > 0) {
    const postIds = data.map((post: { id: string }) => post.id)
    const { data: likesData } = await supabase
      .from('likes')
      .select('post_id')
      .eq('user_id', userId)
      .in('post_id', postIds)
    
    userLikes = likesData?.map(like => like.post_id) || []
  }
  
  // Process posts
  const processedPosts = (data || []).map((post: { id: string; likes_count: { count: number }[] | null; replies_count: { count: number }[] | null; impression_count?: number; [key: string]: unknown }) => ({
    ...post,
    likes_count: post.likes_count?.[0]?.count || 0,
    replies_count: post.replies_count?.[0]?.count || 0,
    is_liked: userLikes.includes(post.id),
    impression_count: post.impression_count || 0
  }))
  
  return processedPosts as Post[]
}

export const getFollowingPosts = async (userId: string, limit = 20, offset = 0): Promise<Post[]> => {
  // First get the list of users being followed
  const { data: follows, error: followsError } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId)
  
  if (followsError) throw followsError
  
  if (!follows || follows.length === 0) {
    return []
  }
  
  const followingIds = follows.map(f => f.following_id)
  
  // Then get posts from those users
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      profiles (*),
      likes_count:likes(count),
      replies_count:replies(count)
    `)
    .in('user_id', followingIds)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
  
  if (error) throw error
  
  // Get all user likes in a single query
  let userLikes: string[] = []
  if (data && data.length > 0) {
    const postIds = data.map((post: { id: string }) => post.id)
    const { data: likesData } = await supabase
      .from('likes')
      .select('post_id')
      .eq('user_id', userId)
      .in('post_id', postIds)
    
    userLikes = likesData?.map(like => like.post_id) || []
  }
  
  // Process posts
  const processedPosts = (data || []).map((post: { id: string; likes_count: { count: number }[] | null; replies_count: { count: number }[] | null; impression_count?: number; [key: string]: unknown }) => ({
    ...post,
    likes_count: post.likes_count?.[0]?.count || 0,
    replies_count: post.replies_count?.[0]?.count || 0,
    is_liked: userLikes.includes(post.id),
    impression_count: post.impression_count || 0
  }))
  
  return processedPosts as Post[]
}

// Follow functions
export const followUser = async (followerId: string, followingId: string) => {
  const { data, error } = await supabase
    .from('follows')
    .insert({ follower_id: followerId, following_id: followingId })
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const unfollowUser = async (followerId: string, followingId: string) => {
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
  
  if (error) throw error
}

export const getFollowers = async (userId: string): Promise<Profile[]> => {
  const { data, error } = await supabase
    .from('follows')
    .select('profiles!follows_follower_id_fkey(*)')
    .eq('following_id', userId)
  
  if (error) throw error
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data?.map((item: any) => item.profiles).filter(Boolean) || []
}

export const getFollowerCount = async (userId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', userId)
  
  if (error) throw error
  return count || 0
}

export const getFollowingCount = async (userId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', userId)
  
  if (error) throw error
  return count || 0
}

export const getTopFollowers = async (userId: string, limit = 10): Promise<Profile[]> => {
  // First get all followers
  const { data: followersData, error: followersError } = await supabase
    .from('follows')
    .select('profiles!follows_follower_id_fkey(*)')
    .eq('following_id', userId)
  
  if (followersError) throw followersError
  
  const followers = followersData?.map((item: { profiles: Profile[] }) => item.profiles[0]).filter(Boolean) || []
  
  // Get follower counts for each follower
  const followersWithCounts = await Promise.all(
    followers.map(async (follower: Profile) => {
      const { count } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', follower.id)
      
      return {
        ...follower,
        followerCount: count || 0
      }
    })
  )
  
  // Sort by follower count and limit
  return followersWithCounts
    .sort((a, b) => b.followerCount - a.followerCount)
    .slice(0, limit)
    .map(({ followerCount: _followerCount, ...profile }) => profile)
}

export const getFollowing = async (userId: string): Promise<Profile[]> => {
  const { data, error } = await supabase
    .from('follows')
    .select('profiles!follows_following_id_fkey(*)')
    .eq('follower_id', userId)
  
  if (error) throw error
  return data?.map((item: { profiles: Profile[] }) => item.profiles[0]).filter(Boolean) || []
}

export const isFollowing = async (followerId: string, followingId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .single()
  
  return !error && !!data
}

// Like functions
export const likePost = async (userId: string, postId: string) => {
  const { data, error } = await supabase
    .from('likes')
    .insert({ user_id: userId, post_id: postId })
    .select()
    .single()
  
  if (error) {
    // If it's a unique constraint violation, the user already liked this post
    if (error.code === '23505') {
      // Return the existing like instead of throwing an error
      const { data: existingLike } = await supabase
        .from('likes')
        .select('*')
        .eq('user_id', userId)
        .eq('post_id', postId)
        .single()
      return existingLike
    }
    throw error
  }
  return data
}

export const unlikePost = async (userId: string, postId: string) => {
  const { error } = await supabase
    .from('likes')
    .delete()
    .eq('user_id', userId)
    .eq('post_id', postId)
  
  if (error) throw error
}

// Reply like functions
export const likeReply = async (userId: string, replyId: string) => {
  const { data, error } = await supabase
    .from('likes')
    .insert({ user_id: userId, reply_id: replyId })
    .select()
    .single()
  
  if (error) {
    // If it's a unique constraint violation, the user already liked this reply
    if (error.code === '23505') {
      // Return the existing like instead of throwing an error
      const { data: existingLike } = await supabase
        .from('likes')
        .select('*')
        .eq('user_id', userId)
        .eq('reply_id', replyId)
        .single()
      return existingLike
    }
    throw error
  }
  return data
}

export const unlikeReply = async (userId: string, replyId: string) => {
  const { error } = await supabase
    .from('likes')
    .delete()
    .eq('user_id', userId)
    .eq('reply_id', replyId)
  
  if (error) throw error
}

// Search functions
export const searchUsers = async (query: string, limit = 10): Promise<Profile[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
    .limit(limit)
  
  if (error) throw error
  return data || []
}

// Trending functions
export const getTrendingTokens = async (limit = 5, timePeriod = '24 hours'): Promise<TrendingToken[]> => {
  try {
    // First try the RPC function
    const { data, error } = await supabase
      .rpc('get_trending_tokens', {
        limit_count: limit,
        time_period: timePeriod
      })
    
    if (error) {
      console.warn('RPC function failed, falling back to manual query:', error.message)
      
      // Fallback to manual query if RPC function doesn't exist
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('posts')
        .select(`
          token_symbol,
          token_name,
          token_address,
          dex_screener_url,
          id,
          likes(id)
        `)
        .not('token_symbol', 'is', null)
        .neq('token_symbol', '')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .limit(100)
      
      if (fallbackError) {
        console.error('Fallback query also failed:', fallbackError.message)
        throw new Error(`Failed to fetch trending tokens: ${fallbackError.message}`)
      }
      
      // Process the fallback data
      const tokenMap = new Map<string, TrendingToken>()
      
      fallbackData?.forEach((post: { token_symbol: string | null; token_name: string | null; token_address: string | null; dex_screener_url: string | null; likes: { id: string }[] | null }) => {
        if (!post.token_symbol) return
        
        const key = post.token_symbol
        if (!tokenMap.has(key)) {
          tokenMap.set(key, {
            token_symbol: post.token_symbol,
            token_name: post.token_name || '',
            token_address: post.token_address || '',
            dex_screener_url: post.dex_screener_url || '',
            post_count: 0,
            total_likes: 0,
            trending_score: 0
          })
        }
        
        const token = tokenMap.get(key)!
        token.post_count += 1
        token.total_likes += post.likes?.length || 0
      })
      
      // Calculate trending scores and sort
      const tokens = Array.from(tokenMap.values())
        .map(token => ({
          ...token,
          trending_score: token.post_count * 1.0 + token.total_likes * 0.5
        }))
        .sort((a, b) => b.trending_score - a.trending_score)
        .slice(0, limit)
      
      return tokens
    }
    
    return data || []
  } catch (error) {
    console.error('Error fetching trending tokens:', error)
    throw error
  }
}

// Server-side function to check if trending tokens exist
export const hasTrendingTokens = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('id')
      .not('token_symbol', 'is', null)
      .neq('token_symbol', '')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .limit(1)
    
    if (error) {
      console.error('Error checking for trending tokens:', error)
      return false
    }
    
    return data && data.length > 0
  } catch (error) {
    console.error('Error checking for trending tokens:', error)
    return false
  }
}

// Server-side function to get trending tokens data with images
export const getTrendingTokensWithImages = async (limit = 5, timePeriod = '24 hours'): Promise<{
  tokens: TrendingToken[]
  tokenImages: Record<string, string>
}> => {
  try {
    const tokens = await getTrendingTokens(limit, timePeriod)
    
    // Fetch token images for tokens with addresses in parallel
    const imagePromises = tokens
      .filter(token => token.token_address)
      .map(async (token) => {
        try {
          const response = await fetch(`https://datapi.jup.ag/v1/assets/search?query=${token.token_address}`)
          if (!response.ok) return null
          
          const data = await response.json()
          if (data && data.length > 0 && data[0].icon) {
            return { address: token.token_address!, imageUrl: data[0].icon }
          }
          return null
        } catch (error) {
          console.error('Error fetching token image:', error)
          return null
        }
      })
    
    const imageResults = await Promise.all(imagePromises)
    const tokenImages: Record<string, string> = {}
    
    imageResults.forEach(result => {
      if (result) {
        tokenImages[result.address] = result.imageUrl
      }
    })
    
    return { tokens, tokenImages }
  } catch (error) {
    console.error('Error fetching trending tokens with images:', error)
    return { tokens: [], tokenImages: {} }
  }
}

// Post functions - get single post by ID
export const getPostById = async (postId: string, userId?: string): Promise<Post> => {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      profiles (*),
      likes_count:likes(count),
      replies_count:replies(count)
    `)
    .eq('id', postId)
    .single()
  
  if (error) throw error
  
  // Get user like status if userId is provided
  let isLiked = false
  if (userId) {
    const { data: likeData } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', userId)
      .eq('post_id', postId)
      .single()
    
    isLiked = !!likeData
  }
  
  return {
    ...data,
    likes_count: data.likes_count?.[0]?.count || 0,
    replies_count: data.replies_count?.[0]?.count || 0,
    is_liked: isLiked,
    impression_count: data.impression_count || 0
  }
}

// Reply functions
export const createReply = async (reply: {
  user_id: string
  post_id: string
  parent_reply_id?: string
  content?: string
  image_url?: string
  token_symbol?: string
  token_address?: string
  token_name?: string
  dex_screener_url?: string
}): Promise<Reply> => {
  const { data, error } = await supabase
    .from('replies')
    .insert(reply)
    .select(`
      *,
      profiles (*),
      likes_count:likes(count)
    `)
    .single()
  
  if (error) {
    console.error('Error creating reply:', error)
    throw error
  }
  
  return {
    ...data,
    likes_count: data.likes_count?.[0]?.count || 0,
    is_liked: false // New replies are not liked by default
  }
}

export const getRepliesByPostId = async (postId: string, userId?: string): Promise<Reply[]> => {
  const { data, error } = await supabase
    .from('replies')
    .select(`
      *,
      profiles (*),
      likes_count:likes(count)
    `)
    .eq('post_id', postId)
    .is('parent_reply_id', null) // Only get top-level replies
    .order('created_at', { ascending: true })
  
  if (error) throw error
  
  // Get all user likes in a single query if userId is provided
  let userLikes: string[] = []
  if (userId && data && data.length > 0) {
    const replyIds = data.map((reply: { id: string }) => reply.id)
    const { data: likesData } = await supabase
      .from('likes')
      .select('reply_id')
      .eq('user_id', userId)
      .in('reply_id', replyIds)
    
    userLikes = likesData?.map(like => like.reply_id) || []
  }
  
  // Process replies
  return (data || []).map((reply: { id: string; likes_count: { count: number }[] | null; [key: string]: unknown }) => ({
    ...reply,
    likes_count: reply.likes_count?.[0]?.count || 0,
    is_liked: userId ? userLikes.includes(reply.id) : false
  })) as Reply[]
}

// Get replies to a specific reply (for threading)
export const getRepliesToReply = async (replyId: string, userId?: string): Promise<Reply[]> => {
  const { data, error } = await supabase
    .from('replies')
    .select(`
      *,
      profiles (*),
      likes_count:likes(count)
    `)
    .eq('parent_reply_id', replyId)
    .order('created_at', { ascending: true })
  
  if (error) throw error
  
  // Get all user likes in a single query if userId is provided
  let userLikes: string[] = []
  if (userId && data && data.length > 0) {
    const replyIds = data.map((reply: { id: string }) => reply.id)
    const { data: likesData } = await supabase
      .from('likes')
      .select('reply_id')
      .eq('user_id', userId)
      .in('reply_id', replyIds)
    
    userLikes = likesData?.map(like => like.reply_id) || []
  }
  
  // Process replies
  return (data || []).map((reply: { id: string; likes_count: { count: number }[] | null; [key: string]: unknown }) => ({
    ...reply,
    likes_count: reply.likes_count?.[0]?.count || 0,
    is_liked: userId ? userLikes.includes(reply.id) : false
  })) as Reply[]
}

// Get a specific reply by ID (works at any nesting level)
export const getReplyById = async (replyId: string, userId?: string): Promise<Reply | null> => {
  const { data, error } = await supabase
    .from('replies')
    .select(`
      *,
      profiles (*),
      likes_count:likes(count)
    `)
    .eq('id', replyId)
    .single()
  
  if (error) return null
  
  // Get user like status if userId is provided
  let isLiked = false
  if (userId) {
    const { data: likeData } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', userId)
      .eq('reply_id', replyId)
      .single()
    
    isLiked = !!likeData
  }
  
  return {
    ...data,
    likes_count: data.likes_count?.[0]?.count || 0,
    is_liked: isLiked
  }
}

// Get all replies for a post (at any nesting level) - useful for building conversation threads
export const getAllRepliesForPost = async (postId: string, userId?: string): Promise<Reply[]> => {
  const { data, error } = await supabase
    .from('replies')
    .select(`
      *,
      profiles (*),
      likes_count:likes(count)
    `)
    .eq('post_id', postId)
    .order('created_at', { ascending: true })
  
  if (error) throw error
  
  // Get all user likes in a single query if userId is provided
  let userLikes: string[] = []
  if (userId && data && data.length > 0) {
    const replyIds = data.map((reply: { id: string }) => reply.id)
    const { data: likesData } = await supabase
      .from('likes')
      .select('reply_id')
      .eq('user_id', userId)
      .in('reply_id', replyIds)
    
    userLikes = likesData?.map(like => like.reply_id) || []
  }
  
  // Process replies
  return (data || []).map((reply: { id: string; likes_count: { count: number }[] | null; [key: string]: unknown }) => ({
    ...reply,
    likes_count: reply.likes_count?.[0]?.count || 0,
    is_liked: userId ? userLikes.includes(reply.id) : false
  })) as Reply[]
}

// Get threaded replies (replies to replies) - DEPRECATED, use getRepliesToReply instead
export const getThreadedReplies = async (postId: string, userId?: string): Promise<Reply[]> => {
  // First get all direct replies to the post
  const directReplies = await getRepliesByPostId(postId, userId)
  
  // Then get all replies to those replies (threaded replies)
  const allReplies = [...directReplies]
  
  for (const reply of directReplies) {
    const threadedReplies = await getRepliesToReply(reply.id, userId)
    allReplies.push(...threadedReplies)
  }
  
  return allReplies.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
}

export const deleteReply = async (userId: string, replyId: string) => {
  // First check if the user owns the reply
  const { data: reply, error: fetchError } = await supabase
    .from('replies')
    .select('user_id')
    .eq('id', replyId)
    .single()
  
  if (fetchError) throw new Error('Reply not found')
  if (reply.user_id !== userId) throw new Error('Unauthorized: You can only delete your own replies')
  
  // Delete the reply
  const { error } = await supabase
    .from('replies')
    .delete()
    .eq('id', replyId)
    .eq('user_id', userId) // Double check ownership
  
  if (error) throw error
}

// Notification functions
export const getNotifications = async (userId: string, limit = 50): Promise<Notification[]> => {
  const { data, error } = await supabase
    .from('notifications')
    .select(`
      *,
      actor:profiles!notifications_actor_id_fkey(*),
      post:posts!notifications_post_id_fkey(
        *,
        profiles(*),
        likes_count:likes(count),
        replies_count:replies(count)
      ),
      reply:replies!notifications_reply_id_fkey(
        *,
        profiles(*),
        likes_count:likes(count)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (error) throw error
  
  return (data || []).map((notification: { post?: { likes_count: { count: number }[] | null; replies_count: { count: number }[] | null; [key: string]: unknown }; reply?: { likes_count: { count: number }[] | null; [key: string]: unknown }; [key: string]: unknown }) => ({
    ...notification,
    post: notification.post ? {
      ...notification.post,
      likes_count: notification.post.likes_count?.[0]?.count || 0,
      replies_count: notification.post.replies_count?.[0]?.count || 0,
      is_liked: false // We don't need to check if user liked the post in notifications
    } : undefined,
    reply: notification.reply ? {
      ...notification.reply,
      likes_count: notification.reply.likes_count?.[0]?.count || 0,
      is_liked: false // We don't need to check if user liked the reply in notifications
    } : undefined
  })) as Notification[]
}

export const getUnreadNotificationCount = async (userId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false)
  
  if (error) throw error
  return count || 0
}

export const markNotificationAsRead = async (userId: string, notificationId: string) => {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', userId)
  
  if (error) throw error
}

export const markAllNotificationsAsRead = async (userId: string) => {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)
  
  if (error) throw error
}

export const deleteNotification = async (userId: string, notificationId: string) => {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)
    .eq('user_id', userId)
  
  if (error) throw error
}

// Impression functions
export const createImpression = async (impression: {
  post_id: string
  user_id?: string | null
}) => {
  const { data, error } = await supabase
    .from('impressions')
    .insert(impression)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const getImpressionCount = async (postId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('impressions')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId)
  
  if (error) throw error
  return count || 0
}

export const getUniqueImpressionCount = async (postId: string): Promise<number> => {
  const { data, error } = await supabase
    .from('impressions')
    .select('user_id')
    .eq('post_id', postId)
    .not('user_id', 'is', null)
  
  if (error) throw error
  
  // Count unique user_ids
  const uniqueUserIds = new Set(data?.map(imp => imp.user_id))
  return uniqueUserIds.size
}

// Featured Token functions
export const getFeaturedTokens = async (limit = 6): Promise<FeaturedToken[]> => {
  const { data, error } = await supabase
    .rpc('get_active_featured_tokens', { limit_count: limit })
  
  if (error) {
    console.error('Error fetching featured tokens:', error)
    return []
  }
  
  return data || []
}

export const createFeaturedToken = async (featuredToken: {
  title?: string | null
  image_url: string
  destination_url: string
  duration: number
  price: number
  signature: string
  from_address: string
}) => {
  const response = await fetch('/api/featured-tokens', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: featuredToken.title,
      imageUrl: featuredToken.image_url,
      destinationUrl: featuredToken.destination_url,
      duration: featuredToken.duration,
      price: featuredToken.price,
      signature: featuredToken.signature,
      fromAddress: featuredToken.from_address,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to create featured token')
  }

  return await response.json()
}

// Alpha Chat Functions

// Check if user has active alpha subscription to a specific owner
export const hasActiveAlphaSubscription = async (ownerId: string, subscriberId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('alpha_chat_members')
    .select('id')
    .eq('alpha_chat_owner_id', ownerId)
    .eq('subscriber_id', subscriberId)
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .maybeSingle() // Use maybeSingle() to handle no subscription gracefully
  
  return !error && !!data
}

// Get alpha subscription status for a user
export const getAlphaSubscriptionStatus = async (ownerId: string, subscriberId: string): Promise<string> => {
  const { data, error } = await supabase
    .from('alpha_chat_members')
    .select('status')
    .eq('alpha_chat_owner_id', ownerId)
    .eq('subscriber_id', subscriberId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle() // Use maybeSingle() to handle no subscription gracefully
  
  if (error || !data) return 'none'
  return data.status
}

// Get alpha chat messages for a specific owner
export const getAlphaChatMessages = async (ownerId: string, userId?: string): Promise<AlphaChatMessage[]> => {
  const { data, error } = await supabase
    .from('alpha_chat_messages')
    .select(`
      *,
      author:profiles!alpha_chat_messages_author_id_fkey (*)
    `)
    .eq('alpha_chat_owner_id', ownerId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  
  return (data || []).map((message: { 
    id: string; 
    likes_count: number; 
    liked_by: string[]; 
    author: Record<string, unknown>; 
    [key: string]: unknown 
  }) => ({
    ...message,
    profiles: message.author, // Map author to profiles for consistency
    likes_count: message.likes_count || 0,
    is_liked: userId ? message.liked_by?.includes(userId) || false : false
  })) as unknown as AlphaChatMessage[]
}

// Create alpha chat message
export const createAlphaChatMessage = async (message: {
  alpha_chat_owner_id: string
  author_id: string
  content?: string
  image_url?: string
  token_symbol?: string
  token_address?: string
  token_name?: string
  dex_screener_url?: string
}): Promise<AlphaChatMessage> => {
  const { data, error } = await supabase
    .from('alpha_chat_messages')
    .insert(message)
    .select(`
      *,
      author:profiles!alpha_chat_messages_author_id_fkey (*)
    `)
    .single()
  
  if (error) throw error
  
  return {
    ...data,
    profiles: data.author, // Map author to profiles for consistency
    likes_count: 0,
    is_liked: false
  } as AlphaChatMessage
}

// Get alpha chat subscriber count
export const getAlphaChatSubscriberCount = async (ownerId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('alpha_chat_members')
    .select('*', { count: 'exact', head: true })
    .eq('alpha_chat_owner_id', ownerId)
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
  
  if (error) throw error
  return count || 0
}

// Check if user is pro (can create alpha chat)
export const isProUser = async (userId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('pro')
    .eq('id', userId)
    .single()
  
  if (error) return false
  return data?.pro || false
}

// Get alpha chat owner's payout wallet address
export const getAlphaChatPayoutWallet = async (ownerId: string): Promise<string | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('payout_wallet_address')
    .eq('id', ownerId)
    .single()
  
  if (error) return null
  return data?.payout_wallet_address || null
}

// Check if alpha chat owner has payout wallet configured
export const hasAlphaChatPayoutWallet = async (ownerId: string): Promise<boolean> => {
  const walletAddress = await getAlphaChatPayoutWallet(ownerId)
  return walletAddress !== null && walletAddress.length > 0
}

// Alpha chat message likes functions
export const likeAlphaChatMessage = async (userId: string, messageId: string) => {
  const { data, error } = await supabase
    .rpc('like_alpha_chat_message', {
      p_user_id: userId,
      p_message_id: messageId
    })
  
  if (error) throw error
  return { likes_count: data }
}

export const unlikeAlphaChatMessage = async (userId: string, messageId: string) => {
  const { data, error } = await supabase
    .rpc('unlike_alpha_chat_message', {
      p_user_id: userId,
      p_message_id: messageId
    })
  
  if (error) throw error
  return { likes_count: data }
}

// Alpha chat reaction functions
export const reactFireAlphaChatMessage = async (userId: string, messageId: string) => {
  const { data, error } = await supabase
    .rpc('react_fire_alpha_chat_message', {
      p_user_id: userId,
      p_message_id: messageId
    })
  
  if (error) throw error
  return { fire_count: data }
}

export const reactThumbsDownAlphaChatMessage = async (userId: string, messageId: string) => {
  const { data, error } = await supabase
    .rpc('react_thumbs_down_alpha_chat_message', {
      p_user_id: userId,
      p_message_id: messageId
    })
  
  if (error) throw error
  return { thumbs_down_count: data }
}

export const reactDiamondAlphaChatMessage = async (userId: string, messageId: string) => {
  const { data, error } = await supabase
    .rpc('react_diamond_alpha_chat_message', {
      p_user_id: userId,
      p_message_id: messageId
    })
  
  if (error) throw error
  return { diamond_count: data }
}

export const reactMoneyAlphaChatMessage = async (userId: string, messageId: string) => {
  const { data, error } = await supabase
    .rpc('react_money_alpha_chat_message', {
      p_user_id: userId,
      p_message_id: messageId
    })
  
  if (error) throw error
  return { money_count: data }
}

// ============================================
// PAYMENT NOTIFICATION FUNCTIONS
// ============================================

/**
 * Create a payment notification for the user who made the payment
 * This notifies them of their successful payment transaction
 */
export const createPaymentNotification = async (
  userId: string,
  paymentType: 'pro' | 'promotion' | 'featured-token' | 'alpha-chat-subscription',
  amount: number,
  details?: {
    duration?: string
    postId?: string
    tokenTitle?: string
    recipientUsername?: string
    signature?: string
  }
) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        actor_id: userId,
        type: 'alpha_chat_subscription', // Using existing notification type
        post_id: null,
        reply_id: null,
        is_read: false,
        metadata: {
          payment_type: paymentType,
          amount_sol: amount,
          duration: details?.duration,
          post_id: details?.postId,
          token_title: details?.tokenTitle,
          recipient_username: details?.recipientUsername,
          transaction_hash: details?.signature
        }
      })
    
    if (error) {
      console.error('Error creating payment notification:', error)
      throw error
    }
    
    return { success: true }
  } catch (error) {
    console.error('Error in createPaymentNotification:', error)
    throw error
  }
}

/**
 * Create a payment received notification for the recipient
 * This notifies them when they receive a payment from another user
 */
export const createPaymentReceivedNotification = async (
  recipientUserId: string,
  senderUserId: string,
  senderUsername: string,
  amount: number,
  paymentType: string,
  details?: {
    duration?: string
    signature?: string
  }
) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: recipientUserId,
        actor_id: senderUserId,
        type: 'alpha_chat_subscription', // Using existing notification type
        post_id: null,
        reply_id: null,
        is_read: false,
        metadata: {
          payment_type: paymentType,
          payment_received: true,
          amount_sol: amount,
          sender_username: senderUsername,
          duration: details?.duration,
          transaction_hash: details?.signature
        }
      })
    
    if (error) {
      console.error('Error creating payment received notification:', error)
      throw error
    }
    
    return { success: true }
  } catch (error) {
    console.error('Error in createPaymentReceivedNotification:', error)
    throw error
  }
}
