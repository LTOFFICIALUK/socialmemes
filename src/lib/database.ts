import { supabase } from './supabase'
import { Database } from './supabase'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Post = Database['public']['Tables']['posts']['Row'] & {
  profiles: Profile
  likes_count: number
  replies_count: number
  is_liked: boolean
}
export type Reply = {
  id: string
  user_id: string
  post_id: string
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
    is_liked: false // New posts are not liked by default
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

export const getPosts = async (userId?: string, limit = 20, offset = 0): Promise<Post[]> => {
  try {
    // Build the select query with proper PostgREST syntax
    const selectQuery = `
      *,
      profiles (*),
      likes_count:likes(count),
      replies_count:replies(count)
    `
    
    // Get regular posts
    const regularQuery = supabase
      .from('posts')
      .select(selectQuery)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: regularPosts, error: regularError } = await regularQuery
    
    if (regularError) {
      console.error('Error fetching regular posts:', regularError.message)
      throw new Error(`Failed to fetch posts: ${regularError.message}`)
    }

    // Get active promoted posts
    const now = new Date().toISOString()
    const { data: promotedPosts, error: promotedError } = await supabase
      .from('posts')
      .select(selectQuery)
      .eq('is_promoted', true)
      .gte('promotion_end', now)
      .order('promotion_start', { ascending: false })

    if (promotedError) {
      console.warn('Error fetching promoted posts:', promotedError.message)
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
    const processedRegularPosts = (regularPosts || []).map((post: any) => ({
      ...post,
      likes_count: post.likes_count?.[0]?.count || 0,
      replies_count: post.replies_count?.[0]?.count || 0,
      is_liked: userId ? userLikes.includes(post.id) : false
    }))

    const processedPromotedPosts = (promotedPosts || []).map((post: any) => ({
      ...post,
      likes_count: post.likes_count?.[0]?.count || 0,
      replies_count: post.replies_count?.[0]?.count || 0,
      is_liked: userId ? userLikes.includes(post.id) : false
    }))
    
    // Mix promoted posts every 10 posts
    const mixedPosts: Post[] = []
    const promotedPostsCopy = [...processedPromotedPosts]
    
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
  const processedPosts = (data || []).map((post: { id: string; likes_count: { count: number }[] | null; replies_count: { count: number }[] | null; [key: string]: unknown }) => ({
    ...post,
    likes_count: post.likes_count?.[0]?.count || 0,
    replies_count: post.replies_count?.[0]?.count || 0,
    is_liked: userLikes.includes(post.id)
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
  const processedPosts = (data || []).map((post: { id: string; likes_count: { count: number }[] | null; replies_count: { count: number }[] | null; [key: string]: unknown }) => ({
    ...post,
    likes_count: post.likes_count?.[0]?.count || 0,
    replies_count: post.replies_count?.[0]?.count || 0,
    is_liked: userLikes.includes(post.id)
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
    .map(({ followerCount, ...profile }) => profile)
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
  
  if (error) throw error
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
export const getTrendingTokens = async (limit = 10, timePeriod = '24 hours'): Promise<TrendingToken[]> => {
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
    is_liked: isLiked
  }
}

// Reply functions
export const createReply = async (reply: {
  user_id: string
  post_id: string
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
  
  if (error) throw error
  
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
    .order('created_at', { ascending: true })
  
  if (error) throw error
  
  // Get all user likes in a single query if userId is provided
  let userLikes: string[] = []
  if (userId && data && data.length > 0) {
    const replyIds = data.map((reply: { id: string }) => reply.id)
    const { data: likesData } = await supabase
      .from('likes')
      .select('post_id')
      .eq('user_id', userId)
      .in('post_id', replyIds)
    
    userLikes = likesData?.map(like => like.post_id) || []
  }
  
  // Process replies
  return (data || []).map((reply: { id: string; likes_count: { count: number }[] | null; [key: string]: unknown }) => ({
    ...reply,
    likes_count: reply.likes_count?.[0]?.count || 0,
    is_liked: userId ? userLikes.includes(reply.id) : false
  })) as Reply[]
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
