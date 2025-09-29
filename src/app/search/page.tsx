'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { MobileNavigation } from '@/components/mobile-navigation'
import { SearchBar } from '@/components/search-bar'
import { PostCard } from '@/components/post-card'
import { TrendingTokens } from '@/components/trending-tokens'
import { Post } from '@/lib/database'
import { supabase } from '@/lib/supabase'
import { likePost, unlikePost } from '@/lib/database'

interface SearchResult {
  id: string
  user_id: string
  type: 'post'
  title: string
  subtitle: string
  content: string | null
  token_symbol: string | null
  avatar: string | null
  created_at: string
  likes_count: number
  is_liked: boolean
}

interface UserResult {
  id: string
  type: 'user'
  title: string
  subtitle: string
  avatar: string | null
  username: string
}

type SearchTab = 'popular' | 'latest' | 'users'

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const query = searchParams.get('q') || ''
  const [popularResults, setPopularResults] = useState<SearchResult[]>([])
  const [latestResults, setLatestResults] = useState<SearchResult[]>([])
  const [userResults, setUserResults] = useState<UserResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string; avatar_url?: string } | undefined>(undefined)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [activeTab, setActiveTab] = useState<SearchTab>('popular')
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Get current user and their profile
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      // If no user, redirect to signup
      if (!user) {
        setIsCheckingAuth(false)
        router.push('/auth/signup')
        return
      }

      // Fetch user profile to get username
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error) {
          console.error('Error fetching profile:', error)
          // Fallback to auth user data
          setCurrentUser({
            id: user.id,
            username: user.user_metadata?.username || `user_${user.id.slice(0, 8)}`,
            avatar_url: user.user_metadata?.avatar_url
          })
        } else {
          // Use profile data
          setCurrentUser({
            id: profile.id,
            username: profile.username,
            avatar_url: profile.avatar_url
          })
          // Load following users
          loadFollowingUsers(profile.id)
        }
      } catch (err) {
        console.error('Error fetching profile:', err)
        // Fallback to auth user data
        setCurrentUser({
          id: user.id,
          username: user.user_metadata?.username || `user_${user.id.slice(0, 8)}`,
          avatar_url: user.user_metadata?.avatar_url
        })
        // Load following users
        loadFollowingUsers(user.id)
      }
      
      setIsCheckingAuth(false)
    }
    getUser()
  }, [router])

  useEffect(() => {
    if (query && currentUser) {
      // Search for all types in background
      searchAllTypes(query)
    } else if (query && !currentUser) {
      // Wait for user to be loaded
      setIsLoading(true)
    } else {
      setPopularResults([])
      setLatestResults([])
      setUserResults([])
      setIsLoading(false)
    }
  }, [query, currentUser])

  const searchAllTypes = async (searchQuery: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const userId = currentUser?.id ? `&exclude_user=${currentUser.id}` : ''
      const currentUserId = currentUser?.id ? `&current_user_id=${currentUser.id}` : ''
      
      // Search for all types in parallel
      const [popularResponse, latestResponse, usersResponse] = await Promise.all([
        fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&type=posts&sort=likes${currentUserId}`),
        fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&type=posts&sort=created_at${currentUserId}`),
        fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&type=users${userId}`)
      ])

      // Process results
      const [popularData, latestData, usersData] = await Promise.all([
        popularResponse.ok ? popularResponse.json() : { results: [] },
        latestResponse.ok ? latestResponse.json() : { results: [] },
        usersResponse.ok ? usersResponse.json() : { results: [] }
      ])

      console.log('Search results received:', {
        popular: popularData.results?.length || 0,
        latest: latestData.results?.length || 0,
        users: usersData.results?.length || 0,
        currentUserId: currentUser?.id
      })
      
      setPopularResults(popularData.results || [])
      setLatestResults(latestData.results || [])
      setUserResults(usersData.results || [])
      
    } catch (err) {
      console.error('Search error:', err)
      setError('Failed to search')
    } finally {
      setIsLoading(false)
    }
  }

  const loadFollowingUsers = async (userId: string) => {
    try {
      const { data: follows, error } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId)

      if (error) throw error

      const followingIds = new Set(follows?.map(follow => follow.following_id) || [])
      setFollowingUsers(followingIds)
    } catch (error) {
      console.error('Error loading following users:', error)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setCurrentUser(undefined)
    router.push('/auth/signup')
  }

  const handleFollow = async (userId: string, username: string) => {
    if (!currentUser) return

    try {
      const isFollowing = followingUsers.has(userId)
      
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', userId)

        if (error) throw error
        
        setFollowingUsers(prev => {
          const newSet = new Set(prev)
          newSet.delete(userId)
          return newSet
        })
      } else {
        // Follow
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: currentUser.id,
            following_id: userId
          })

        if (error) throw error
        
        setFollowingUsers(prev => new Set(prev).add(userId))
      }
    } catch (error) {
      console.error('Error following/unfollowing user:', error)
    }
  }

  const handleLike = async (postId: string) => {
    if (!currentUser) return

    try {
      console.log('Attempting to like post:', { userId: currentUser.id, postId })
      await likePost(currentUser.id, postId)
      console.log('Successfully liked post:', postId)
    } catch (error) {
      console.error('Error liking post:', {
        error,
        userId: currentUser.id,
        postId,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined
      })
    }
  }

  const handleUnlike = async (postId: string) => {
    if (!currentUser) return

    try {
      console.log('Attempting to unlike post:', { userId: currentUser.id, postId })
      await unlikePost(currentUser.id, postId)
      console.log('Successfully unliked post:', postId)
    } catch (error) {
      console.error('Error unliking post:', {
        error,
        userId: currentUser.id,
        postId,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined
      })
    }
  }

  const formatSearchResults = (results: SearchResult[]): Post[] => {
    return results.map(result => {
      const formattedPost = {
        id: result.id,
        user_id: result.user_id,
        content: result.content,
        image_url: '', // Posts in search might not have images
        token_symbol: result.token_symbol,
        token_address: null,
        token_name: null,
        dex_screener_url: null,
        created_at: result.created_at,
        updated_at: result.created_at,
        likes_count: result.likes_count,
        replies_count: 0, // Search results don't include reply counts
        is_liked: result.is_liked,
        profiles: {
          id: result.user_id,
          username: result.subtitle.replace('@', ''),
          full_name: result.title,
          bio: null,
          avatar_url: result.avatar,
          banner_url: null,
          created_at: '',
          updated_at: ''
        }
      }
      
      console.log('Formatted post for PostCard:', {
        id: formattedPost.id,
        likes_count: formattedPost.likes_count,
        is_liked: formattedPost.is_liked,
        currentUserId: currentUser?.id
      })
      
      return formattedPost
    })
  }

  const getCurrentResults = () => {
    switch (activeTab) {
      case 'popular':
        return popularResults
      case 'latest':
        return latestResults
      case 'users':
        return userResults
      default:
        return popularResults
    }
  }

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render the main content if user is not authenticated (they'll be redirected)
  if (!currentUser) {
    return null
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <div className="flex h-screen max-w-7xl mx-auto min-w-0">
        {/* Left Column - Navigation */}
        <div className="w-64 px-4 lg:px-8 h-screen overflow-y-auto hidden lg:block">
          <Navigation currentUser={currentUser} onSignOut={handleSignOut} />
        </div>
        
        {/* Center Column - Search Results */}
        <div className="flex-1 w-full lg:max-w-2xl lg:border-l lg:border-r border-gray-800 h-screen flex flex-col pb-16 lg:pb-0 min-w-0">
          {/* Search Bar at Top */}
          <div className="bg-black/80 backdrop-blur-sm border-b border-gray-800 px-4 py-3 flex-shrink-0">
            <SearchBar 
              placeholder="Search posts, users, tokens..." 
              value={query}
              onChange={(newQuery) => {
                if (newQuery !== query) {
                  router.push(`/search?q=${encodeURIComponent(newQuery)}`)
                }
              }}
            />
          </div>
          
          {/* Tabs */}
          <div className="bg-black/80 backdrop-blur-sm border-b border-gray-800 flex-shrink-0">
            <div className="flex">
              <button
                onClick={() => setActiveTab('popular')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'popular'
                    ? 'text-white border-b-2 border-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Popular
              </button>
              <button
                onClick={() => setActiveTab('latest')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'latest'
                    ? 'text-white border-b-2 border-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Latest
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'users'
                    ? 'text-white border-b-2 border-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Users
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto pb-4">

            {/* Results */}
            {isLoading ? (
              <div className="flex justify-center py-8 px-4">
                <div className="text-gray-400">Searching...</div>
              </div>
            ) : error ? (
              <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 mx-4">
                <p className="text-red-400">{error}</p>
              </div>
            ) : activeTab === 'users' ? (
              getCurrentResults().length > 0 ? (
                <div className="space-y-0">
                  {(getCurrentResults() as UserResult[]).map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center p-4 hover:bg-gray-900/50 transition-colors"
                    >
                      <div 
                        className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center mr-4 cursor-pointer"
                        onClick={() => router.push(`/profile/${user.username}`)}
                      >
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.username}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-semibold">
                            {user.username.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div 
                        className="flex-1 cursor-pointer"
                        onClick={() => router.push(`/profile/${user.username}`)}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-white text-base">
                            {user.title}
                          </h3>
                          {/* Blue checkmark for verified users - you can add verification logic here */}
                        </div>
                        <p className="text-gray-400 text-sm">
                          {user.subtitle}
                        </p>
                      </div>
                      <button
                        className="px-4 py-1.5 rounded-full font-semibold text-sm border border-gray-600 bg-black text-white hover:bg-gray-900 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleFollow(user.id, user.username)
                        }}
                      >
                        {followingUsers.has(user.id) ? 'Unfollow' : 'Follow'}
                      </button>
                    </div>
                  ))}
                </div>
              ) : query ? (
                <div className="text-center py-8 px-4">
                  <div className="text-gray-400 mb-2">No users found</div>
                  <p className="text-gray-500 text-sm">
                    Try searching for different usernames or names
                  </p>
                </div>
              ) : (
                <div className="text-center py-8 px-4">
                  <div className="text-gray-400 mb-2">Enter a search term</div>
                  <p className="text-gray-500 text-sm">
                    Search for users by username or name
                  </p>
                </div>
              )
            ) : (
              getCurrentResults().length > 0 ? (
                <div className="space-y-0">
                  {formatSearchResults(getCurrentResults() as SearchResult[]).map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      currentUserId={currentUser?.id}
                      onLike={handleLike}
                      onUnlike={handleUnlike}
                      onDelete={() => {}}
                    />
                  ))}
                </div>
              ) : query ? (
                <div className="text-center py-8 px-4">
                  <div className="text-gray-400 mb-2">No posts found</div>
                  <p className="text-gray-500 text-sm">
                    Try searching for different keywords or tokens
                  </p>
                </div>
              ) : (
                <div className="text-center py-8 px-4">
                  <div className="text-gray-400 mb-2">Enter a search term</div>
                  <p className="text-gray-500 text-sm">
                    Search for posts, users, or tokens
                  </p>
                </div>
              )
            )}
          </div>
        </div>
        
        {/* Right Column - Search & Trending Tokens */}
        <div className="w-96 px-8 h-screen overflow-y-auto hidden xl:block">
          {/* Search Bar */}
          <div className="mt-4 mb-4">
            <SearchBar placeholder="Search posts, users, tokens..." />
          </div>
          
          <div className="bg-black rounded-xl border border-gray-800">
            <div className="bg-black backdrop-blur-sm px-4 py-3 rounded-t-xl">
              <h2 className="text-lg font-bold text-white">Trending Tokens</h2>
            </div>
            
            <div className="px-4 pb-4 pt-1">
              <TrendingTokens limit={8} timePeriod="24 hours" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Navigation */}
      <MobileNavigation currentUser={currentUser} onSignOut={handleSignOut} />
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white">
        <Navigation />
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-400">Loading...</div>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}
