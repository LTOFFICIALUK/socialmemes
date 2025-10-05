'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { MobileNavigation } from '@/components/mobile-navigation'
import { MobileMenuButton } from '@/components/mobile-menu-button'
import { SearchBar } from '@/components/search-bar'
import { PostCard } from '@/components/post-card'
import { TrendingTokensSectionWithData } from '@/components/trending-tokens-section-with-data'
import { FeaturedTokens } from '@/components/featured-tokens'
import { FeaturedTokenModal } from '@/components/featured-token-modal'
import { MobileTrendingModal } from '@/components/mobile-trending-modal'
import { ProModal } from '@/components/pro-modal'
import { PromotionModal } from '@/components/promotion-modal'
import { ToastContainer, useToast } from '@/components/ui/toast'
import { Post, TrendingToken, followUser, unfollowUser, isFollowing } from '@/lib/database'
import { supabase } from '@/lib/supabase'
import { Crown } from 'lucide-react'

interface SearchClientProps {
  trendingTokens: TrendingToken[]
  tokenImages: Record<string, string>
}

export function SearchClient({ trendingTokens, tokenImages }: SearchClientProps) {
  const [posts, setPosts] = useState<Post[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string; avatar_url?: string } | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [showFeaturedTokenModal, setShowFeaturedTokenModal] = useState(false)
  const [showTrendingModal, setShowTrendingModal] = useState(false)
  const [showProModal, setShowProModal] = useState(false)
  const [showPromotionModal, setShowPromotionModal] = useState(false)
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const [featuredTokensKey, setFeaturedTokensKey] = useState(0)
  const [activeTab, setActiveTab] = useState<'popular' | 'latest' | 'users'>('popular')
  const [searchQuery, setSearchQuery] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  const [followingStates, setFollowingStates] = useState<Record<string, boolean>>({})
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})
  const router = useRouter()
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''
  const { toasts, removeToast, success } = useToast()

  const searchPosts = async (searchQuery: string, sortType: 'popular' | 'latest' = 'latest') => {
    if (!searchQuery.trim()) {
      setPosts([])
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&type=posts`)
      
      if (!response.ok) {
        throw new Error('Search failed')
      }
      
      const data = await response.json()
      let results = data.results || []
      
      // Sort based on tab selection
      if (sortType === 'popular') {
        results = results.sort((a: any, b: any) => (b.likes_count || 0) - (a.likes_count || 0))
      } else {
        results = results.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      }
      
      setPosts(results)
    } catch (error) {
      console.error('Error searching posts:', error)
      setPosts([])
    } finally {
      setIsLoading(false)
    }
  }

  const searchUsers = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setUsers([])
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&type=users`)
      
      if (!response.ok) {
        throw new Error('Search failed')
      }
      
      const data = await response.json()
      const userResults = data.results || []
      
      // Check follow status for each user if current user is logged in
      if (currentUser && userResults.length > 0) {
        const followStatusPromises = userResults.map(async (user: any) => {
          const isFollowingUser = await isFollowing(currentUser.id, user.id)
          return { ...user, isFollowing: isFollowingUser }
        })
        
        const usersWithFollowStatus = await Promise.all(followStatusPromises)
        setUsers(usersWithFollowStatus)
        
        // Initialize follow states
        const initialFollowStates: Record<string, boolean> = {}
        usersWithFollowStatus.forEach((user: any) => {
          initialFollowStates[user.id] = user.isFollowing
        })
        setFollowingStates(initialFollowStates)
      } else {
        setUsers(userResults)
      }
    } catch (error) {
      console.error('Error searching users:', error)
      setUsers([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearchInput = (searchTerm: string) => {
    setSearchQuery(searchTerm)
  }

  const handleSearch = (searchTerm: string) => {
    setHasSearched(true)
    if (activeTab === 'users') {
      searchUsers(searchTerm)
    } else {
      searchPosts(searchTerm, activeTab)
    }
  }

  const handleTabChange = (tab: 'popular' | 'latest' | 'users') => {
    setActiveTab(tab)
    if (searchQuery && tab !== 'users') {
      searchPosts(searchQuery, tab)
    } else if (searchQuery && tab === 'users') {
      searchUsers(searchQuery)
    }
  }

  const handleFollow = async (userId: string) => {
    if (!currentUser || currentUser.id === userId) return
    
    try {
      setLoadingStates(prev => ({ ...prev, [userId]: true }))
      
      const isCurrentlyFollowing = followingStates[userId]
      
      if (isCurrentlyFollowing) {
        await unfollowUser(currentUser.id, userId)
        setFollowingStates(prev => ({ ...prev, [userId]: false }))
        success('Unfollowed successfully')
      } else {
        await followUser(currentUser.id, userId)
        setFollowingStates(prev => ({ ...prev, [userId]: true }))
        success('Followed successfully')
      }
    } catch (error) {
      console.error('Error updating follow status:', error)
    } finally {
      setLoadingStates(prev => ({ ...prev, [userId]: false }))
    }
  }

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
        }
      } catch (err) {
        console.error('Error fetching profile:', err)
        // Fallback to auth user data
        setCurrentUser({
          id: user.id,
          username: user.user_metadata?.username || `user_${user.id.slice(0, 8)}`,
          avatar_url: user.user_metadata?.avatar_url
        })
      }
      
      setIsCheckingAuth(false)
    }
    getUser()
  }, [router])

  // Search when query changes
  useEffect(() => {
    if (query) {
      setSearchQuery(query)
      setHasSearched(true)
      if (activeTab === 'users') {
        searchUsers(query)
      } else {
        searchPosts(query, activeTab)
      }
    } else {
      setPosts([])
      setUsers([])
      setSearchQuery('')
      setHasSearched(false)
    }
  }, [query])

  const handlePromotePost = (postId: string) => {
    setSelectedPostId(postId)
    setShowPromotionModal(true)
  }

  const handlePromoteConfirm = async (postId: string, duration: number, price: number) => {
    console.log('Promoting post:', { postId, duration, price })
    success(`Post promoted for ${duration} hours at ${price} SOL!`)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setCurrentUser(undefined)
    router.push('/auth/signup')
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
          <Navigation 
            currentUser={currentUser} 
            onSignOut={handleSignOut}
            onPromoteClick={() => setShowFeaturedTokenModal(true)}
            onProClick={() => setShowProModal(true)}
          />
        </div>
        
        {/* Center Column - Search Results */}
        <div className="flex-1 w-full lg:max-w-2xl lg:border-l lg:border-r border-gray-800 h-screen flex flex-col pb-16 lg:pb-0 min-w-0">
          {/* Mobile Menu Button - Fixed position for mobile */}
          <div className="lg:hidden fixed top-4 right-4 z-50">
            <MobileMenuButton 
              currentUser={currentUser} 
              onSignOut={handleSignOut}
              onPromoteClick={() => setShowFeaturedTokenModal(true)}
              onTrendingClick={() => setShowTrendingModal(true)}
              onProClick={() => setShowProModal(true)}
            />
          </div>
          
          {/* Header */}
          <div className="bg-black/80 backdrop-blur-sm border-b border-gray-800 px-4 pt-4 pb-0 flex-shrink-0">
            {/* Search Bar */}
            <div className="mb-4">
              <SearchBar 
                placeholder="Search posts, users, tokens..." 
                value={searchQuery}
                onChange={handleSearchInput}
                onSearch={handleSearch}
              />
            </div>
            
            {/* Tab Navigation */}
            <div className="border-t border-gray-800 -mx-4 px-4">
              <div className="flex justify-between">
                <button
                  onClick={() => handleTabChange('popular')}
                  className={`flex-1 py-4 text-sm font-medium transition-colors ${
                    activeTab === 'popular'
                      ? 'text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Popular
                </button>
                <button
                  onClick={() => handleTabChange('latest')}
                  className={`flex-1 py-4 text-sm font-medium transition-colors ${
                    activeTab === 'latest'
                      ? 'text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Latest
                </button>
                <button
                  onClick={() => handleTabChange('users')}
                  className={`flex-1 py-4 text-sm font-medium transition-colors ${
                    activeTab === 'users'
                      ? 'text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Users
                </button>
              </div>
            </div>
          </div>
          
          {/* Search Results - Scrollable content */}
          <div className="flex-1 overflow-y-auto min-w-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
              </div>
            ) : searchQuery ? (
              <div>
                {activeTab === 'users' ? (
                  !hasSearched ? (
                    <div className="text-center py-8">
                      <p className="text-gray-400">Enter a search term to find posts and users</p>
                    </div>
                  ) : users.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-400">No users found for &quot;{searchQuery}&quot;</p>
                    </div>
                  ) : (
                    <>
                      {users.map((user) => (
                        <div 
                          key={user.id} 
                          className="hover:bg-gray-900/50 transition-colors cursor-pointer"
                          onClick={() => router.push(`/profile/${user.username}`)}
                        >
                          <div className="flex items-center space-x-3 p-3 sm:p-4">
                            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                              {user.avatar ? (
                                <img src={user.avatar} alt={user.title} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-white font-semibold">
                                  {user.title?.charAt(0)?.toUpperCase() || '?'}
                                </span>
                              )}
                            </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                 <h3 className={`font-semibold truncate ${
                                   user.pro ? 'pro-username-gold' : 'text-white'
                                 }`}>
                                   {user.title}
                                 </h3>
                                </div>
                                <p className="text-gray-400 text-sm truncate">{user.subtitle}</p>
                            </div>
                            {currentUser && currentUser.id !== user.id && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleFollow(user.id)
                                }}
                                disabled={loadingStates[user.id]}
                                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                                  followingStates[user.id] 
                                    ? 'border border-white text-white hover:bg-gray-800' 
                                    : 'bg-white text-black hover:bg-gray-200'
                                }`}
                              >
                                {loadingStates[user.id] ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mx-auto"></div>
                                ) : followingStates[user.id] ? (
                                  'Unfollow'
                                ) : (
                                  'Follow'
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </>
                  )
                ) : !hasSearched ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400">Enter a search term to find posts and users</p>
                  </div>
                ) : posts.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No posts found for &quot;{searchQuery}&quot;</p>
                  </div>
                ) : (
                  <>
                    {posts.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        currentUserId={currentUser.id}
                        onDelete={async () => {
                          // Handle delete if needed
                        }}
                        onPromote={handlePromotePost}
                      />
                    ))}
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32">
                <p className="text-gray-400">Enter a search term to find posts and users</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Right Column - Search & Trending Tokens */}
        <div className="w-96 px-8 h-screen overflow-y-auto hidden xl:block">
          {/* Search Bar */}
          <div className="mt-4 mb-4">
            <SearchBar placeholder="Search posts, users, tokens..." />
          </div>
          
          <TrendingTokensSectionWithData 
            trendingTokens={trendingTokens}
            tokenImages={tokenImages}
          />
          
          <FeaturedTokens key={featuredTokensKey} limit={6} />
        </div>
      </div>
      
      {/* Featured Token Modal */}
      <FeaturedTokenModal
        isOpen={showFeaturedTokenModal}
        onClose={() => setShowFeaturedTokenModal(false)}
        onSuccess={() => {
          setFeaturedTokensKey(prev => prev + 1)
          success('Featured token promoted successfully!')
        }}
      />
      
      {/* Mobile Trending Modal */}
      <MobileTrendingModal
        isOpen={showTrendingModal}
        onClose={() => setShowTrendingModal(false)}
      />
      
      {/* Pro Modal */}
      <ProModal
        isOpen={showProModal}
        onClose={() => setShowProModal(false)}
      />
      
      {/* Promotion Modal */}
      <PromotionModal
        isOpen={showPromotionModal}
        onClose={() => setShowPromotionModal(false)}
        postId={selectedPostId || ''}
        onPromote={handlePromoteConfirm}
      />
      
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
      
      {/* Mobile Navigation */}
      <MobileNavigation 
        currentUser={currentUser} 
        onSignOut={handleSignOut}
        onPromoteClick={() => setShowFeaturedTokenModal(true)}
      />
    </div>
  )
}
