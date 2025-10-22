'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { Navigation } from '@/components/navigation'
import { MobileNavigation } from '@/components/mobile-navigation'
import { MobileMenuButton } from '@/components/mobile-menu-button'
import { Feed } from '@/components/feed'
import { TrendingTokensSectionWithData } from '@/components/trending-tokens-section-with-data'
import { FeaturedTokens } from '@/components/featured-tokens'
import { SearchBar } from '@/components/search-bar'
import { FeaturedTokenModal } from '@/components/featured-token-modal'
import { MobileTrendingModal } from '@/components/mobile-trending-modal'
import { PromotionModal } from '@/components/promotion-modal'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ToastContainer, useToast } from '@/components/ui/toast'
import { Post, Profile, TrendingToken, AlphaChatMessage, getProfileByUsername, getPostsByUser, isFollowing, followUser, unfollowUser, getTopFollowers, getFollowing, getFollowerCount, getFollowingCount, hasActiveAlphaSubscription } from '@/lib/database'
import { supabase } from '@/lib/supabase'
import { Users, UserPlus, UserMinus, Settings, Crown } from 'lucide-react'
import { FollowersModal } from '@/components/followers-modal'
import { FollowingModal } from '@/components/following-modal'
import { EditProfileModal } from '@/components/edit-profile-modal'
import { CreatePost } from '@/components/create-post'
import { AlphaChatSubscriptionModal } from '@/components/alpha-chat-subscription-modal'
import { ProModal } from '@/components/pro-modal'

interface ProfileClientProps {
  trendingTokens: TrendingToken[]
  tokenImages: Record<string, string>
}

export function ProfileClient({ trendingTokens, tokenImages }: ProfileClientProps) {
  const params = useParams()
  const username = params.username as string
  
  const [profile, setProfile] = useState<Profile | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [alphaMessages, setAlphaMessages] = useState<AlphaChatMessage[]>([])
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string; avatar_url?: string; pro?: boolean } | undefined>(undefined)
  const [isFollowingUser, setIsFollowingUser] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isFollowingLoading, setIsFollowingLoading] = useState(false)
  const [followers, setFollowers] = useState<Profile[]>([])
  const [following, setFollowing] = useState<Profile[]>([])
  const [followerCount, setFollowerCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [showFollowersModal, setShowFollowersModal] = useState(false)
  const [showFollowingModal, setShowFollowingModal] = useState(false)
  const [showEditProfileModal, setShowEditProfileModal] = useState(false)
  const [showFeaturedTokenModal, setShowFeaturedTokenModal] = useState(false)
  const [showTrendingModal, setShowTrendingModal] = useState(false)
  const [showProModal, setShowProModal] = useState(false)
  const [showPromotionModal, setShowPromotionModal] = useState(false)
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const [featuredTokensKey, setFeaturedTokensKey] = useState(0)
  const [activeTab, setActiveTab] = useState<'posts' | 'alpha'>('posts')
  const [hasAlphaAccess, setHasAlphaAccess] = useState(false)
  const [isLoadingAlpha, setIsLoadingAlpha] = useState(false)
  const [showAlphaSubscriptionModal, setShowAlphaSubscriptionModal] = useState(false)
  const { toasts, removeToast, success } = useToast()

  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true)
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        // Handle no user case
        setIsLoading(false)
        return
      }

      // Fetch current user profile
      const { data: currentUserProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (currentUserProfile) {
        setCurrentUser({
          id: currentUserProfile.id,
          username: currentUserProfile.username,
          avatar_url: currentUserProfile.avatar_url,
          pro: currentUserProfile.pro
        })
      }

      // Fetch profile by username
      const profileData = await getProfileByUsername(username)
      if (!profileData) {
        // Profile not found
        setIsLoading(false)
        return
      }
      setProfile(profileData)

      // Fetch posts by user
      const postsData = await getPostsByUser(profileData.id)
      setPosts(postsData)

      // Check if current user is following this profile
      if (currentUserProfile) {
        const followingStatus = await isFollowing(currentUserProfile.id, profileData.id)
        setIsFollowingUser(followingStatus)
      }

      // Fetch follower and following data
      const [followersData, followingData, followerCountData, followingCountData] = await Promise.all([
        getTopFollowers(profileData.id, 6),
        getFollowing(profileData.id),
        getFollowerCount(profileData.id),
        getFollowingCount(profileData.id)
      ])

      setFollowers(followersData)
      setFollowing(followingData)
      setFollowerCount(followerCountData)
      setFollowingCount(followingCountData)

      // Check alpha chat access if user is pro
      if (profileData.pro && currentUserProfile) {
        const alphaAccess = await hasActiveAlphaSubscription(profileData.id, currentUserProfile.id)
        setHasAlphaAccess(alphaAccess || currentUserProfile.id === profileData.id)
      }

    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setIsLoading(false)
    }
  }, [username])

  const loadAlphaMessages = useCallback(async () => {
    if (!profile || !currentUser) return
    
    try {
      setIsLoadingAlpha(true)
      
      // Get current session for authorization
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session')
      }

      const response = await fetch(`/api/alpha-chat/${profile.id}/messages`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch alpha messages')
      }

      const data = await response.json()
      setAlphaMessages(data.messages)
    } catch (error) {
      console.error('Error loading alpha messages:', error)
    } finally {
      setIsLoadingAlpha(false)
    }
  }, [profile, currentUser])

  const handleCreateAlphaPost = async (data: {
    content?: string
    image?: File
    tokenSymbol?: string
    tokenAddress?: string
    tokenName?: string
  }) => {
    if (!profile || !currentUser) return

    try {
      let imageUrl: string | undefined

      // Upload image if provided
      if (data.image) {
        const formData = new FormData()
        formData.append('file', data.image)
        formData.append('userId', currentUser.id)

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload image')
        }

        const uploadResult = await uploadResponse.json()
        imageUrl = uploadResult.url
      }

      // Get current session for authorization
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session')
      }

      // Create the alpha message
      const response = await fetch(`/api/alpha-chat/${profile.id}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: data.content,
          image_url: imageUrl,
          token_symbol: data.tokenSymbol,
          token_address: data.tokenAddress,
          token_name: data.tokenName,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create alpha message')
      }

      // Reload messages
      await loadAlphaMessages()
      success('Alpha message posted successfully!')
    } catch (error) {
      console.error('Error creating alpha message:', error)
      throw error
    }
  }

  useEffect(() => {
    if (username) {
      loadProfile()
    }
  }, [username, loadProfile])

  useEffect(() => {
    if (activeTab === 'alpha' && profile && currentUser && hasAlphaAccess) {
      loadAlphaMessages()
    }
  }, [activeTab, profile, currentUser, hasAlphaAccess, loadAlphaMessages])

  const handleFollow = async () => {
    if (!currentUser || !profile || isFollowingLoading) return

    try {
      setIsFollowingLoading(true)
      
      if (isFollowingUser) {
        await unfollowUser(currentUser.id, profile.id)
        setIsFollowingUser(false)
        setFollowerCount(prev => Math.max(0, prev - 1))
        success('Unfollowed successfully')
      } else {
        await followUser(currentUser.id, profile.id)
        setIsFollowingUser(true)
        setFollowerCount(prev => prev + 1)
        success('Following!')
      }
    } catch (error) {
      console.error('Error following/unfollowing:', error)
    } finally {
      setIsFollowingLoading(false)
    }
  }

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
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Profile Not Found</h1>
          <p className="text-gray-400">The user you&apos;re looking for doesn&apos;t exist.</p>
        </div>
      </div>
    )
  }

  const isOwnProfile = currentUser?.id === profile.id

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
        
        {/* Center Column - Profile & Posts */}
        <div className="flex-1 w-full lg:max-w-2xl lg:border-l lg:border-r border-gray-800 h-screen flex flex-col pb-16 lg:pb-0 min-w-0">
          {/* Header */}
          <div className="bg-black/80 backdrop-blur-sm border-b border-gray-800 px-4 py-3 flex-shrink-0 flex items-center justify-between">
            <h1 className="text-xl font-bold text-white">Profile</h1>
            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <MobileMenuButton 
                currentUser={currentUser} 
                onSignOut={handleSignOut}
                onPromoteClick={() => setShowFeaturedTokenModal(true)}
                onTrendingClick={() => setShowTrendingModal(true)}
                onProClick={() => setShowProModal(true)}
              />
            </div>
          </div>
          
          {/* Profile Content - Scrollable */}
          <div className="flex-1 overflow-y-auto min-w-0">
            {/* Profile Banner */}
            {profile.banner_url && (
              <div className="w-full">
                <Image
                  src={profile.banner_url}
                  alt={`${profile.username}'s banner`}
                  width={800}
                  height={200}
                  className="w-full h-auto object-contain"
                />
              </div>
            )}
            
            {/* Profile Header */}
            <div className="bg-black border-b border-gray-800 p-6">
              <div className="flex items-start space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile.avatar_url || ''} alt={profile.username} />
                  <AvatarFallback className="bg-purple-400 text-white text-xl">
                    {profile.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2 gap-2">
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <h2 className={`text-2xl font-bold truncate ${
                        profile.pro ? 'pro-username-gold' : 'text-white'
                      }`}>
                        {profile.username}
                      </h2>
                      {profile.pro && (
                        <Crown className="h-5 w-5 text-purple-400 flex-shrink-0" />
                      )}
                    </div>
                    {isOwnProfile ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowEditProfileModal(true)}
                        className="border-gray-600 text-gray-300 hover:bg-gray-800 touch-manipulation min-h-[44px] flex-shrink-0"
                        aria-label="Edit profile"
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    ) : currentUser && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleFollow}
                        disabled={isFollowingLoading}
                        className="border-white text-white hover:bg-gray-800"
                      >
                        {isFollowingLoading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : isFollowingUser ? (
                          <>
                            <UserMinus className="h-4 w-4 mr-1" />
                            Unfollow
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4 mr-1" />
                            Follow
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  
                  {profile.bio && (
                    <p className="text-gray-300 mb-4">{profile.bio}</p>
                  )}
                  
                  <div className="flex items-center space-x-6 mb-4">
                    <div className="flex items-center space-x-1 text-gray-300">
                      <Users className="h-4 w-4" />
                      <span className="font-semibold">{followerCount}</span>
                      <span>followers</span>
                    </div>
                    
                    <div className="flex items-center space-x-1 text-gray-300">
                      <span className="font-semibold">{followingCount}</span>
                      <span>following</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Tab Navigation - Only show if user is pro and has alpha chat enabled */}
            {profile.pro && profile.alpha_chat_enabled && (
              <div className="border-b border-gray-800">
                <div className="flex justify-between">
                  <button
                    onClick={() => setActiveTab('posts')}
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${
                      activeTab === 'posts'
                        ? 'text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Posts
                  </button>
                  <button
                    onClick={() => setActiveTab('alpha')}
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${
                      activeTab === 'alpha'
                        ? 'text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Alpha
                  </button>
                </div>
              </div>
            )}
            
            {/* Content based on active tab */}
            {activeTab === 'posts' ? (
              <Feed
                posts={posts}
                currentUserId={currentUser?.id}
                isLoading={false}
                onPromotePost={handlePromotePost}
              />
            ) : (
              <>
                {!hasAlphaAccess ? (
                  <div className="text-center py-12 px-4">
                    <h3 className="text-xl font-semibold text-white mb-2">Alpha Chat Access Required</h3>
                    <p className="text-gray-400 mb-6">
                      Subscribe to {profile.username}&apos;s alpha chat to access exclusive content and discussions.
                    </p>
                    <Button 
                      onClick={() => setShowAlphaSubscriptionModal(true)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      Subscribe to Alpha Chat
                    </Button>
                  </div>
                ) : isLoadingAlpha ? (
                  <div className="flex items-center justify-center py-12 px-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                    <span className="ml-3 text-gray-400">Loading alpha messages...</span>
                  </div>
                ) : alphaMessages.length === 0 ? (
                  <>
                    <div className="bg-black border-b border-gray-800">
                      {currentUser && (
                        <CreatePost
                          currentUser={currentUser}
                          onSubmit={handleCreateAlphaPost}
                        />
                      )}
                    </div>
                    <div className="text-center py-12 px-4">
                      <h3 className="text-xl font-semibold text-white mb-2">No Alpha Messages Yet</h3>
                      <p className="text-gray-400">
                        Be the first to post in {profile.username}&apos;s alpha chat!
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-black border-b border-gray-800">
                      {currentUser && (
                        <CreatePost
                          currentUser={currentUser}
                          onSubmit={handleCreateAlphaPost}
                        />
                      )}
                    </div>
                    <Feed
                      posts={alphaMessages.map((message) => ({
                        id: message.id,
                        user_id: message.author_id,
                        content: message.content,
                        image_url: message.image_url,
                        token_symbol: message.token_symbol,
                        token_address: message.token_address,
                        token_name: message.token_name,
                        dex_screener_url: message.dex_screener_url,
                        created_at: message.created_at,
                        updated_at: message.updated_at || message.created_at,
                        profiles: message.profiles,
                        likes_count: message.likes_count,
                        is_liked: message.is_liked,
                        replies_count: 0,
                        impression_count: 0,
                        is_promoted: false,
                        is_alpha_chat_message: true, // Flag to identify alpha chat messages
                        promotion_start: null,
                        promotion_end: null,
                        promotion_amount_sol: null,
                        promotion_price: null,
                        payment_tx_hash: null,
                        // Reaction data
                        fire_count: message.fire_count || 0,
                        is_fire_reacted: message.is_fire_reacted || false,
                        diamond_count: message.diamond_count || 0,
                        is_diamond_reacted: message.is_diamond_reacted || false,
                        money_count: message.money_count || 0,
                        is_money_reacted: message.is_money_reacted || false
                      }))}
                      currentUserId={currentUser?.id}
                      isLoading={false}
                      onPromotePost={handlePromotePost}
                    />
                  </>
                )}
              </>
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
      
      {/* Modals */}
      <FollowersModal
        isOpen={showFollowersModal}
        onClose={() => setShowFollowersModal(false)}
        followers={followers}
        currentUserId={currentUser?.id}
        profileUsername={profile.username}
      />
      
      <FollowingModal
        isOpen={showFollowingModal}
        onClose={() => setShowFollowingModal(false)}
        following={following}
        currentUserId={currentUser?.id}
        profileUsername={profile.username}
      />
      
      <EditProfileModal
        isOpen={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
        profile={profile}
        onProfileUpdate={setProfile}
      />
      
      <FeaturedTokenModal
        isOpen={showFeaturedTokenModal}
        onClose={() => setShowFeaturedTokenModal(false)}
        onSuccess={() => {
          setFeaturedTokensKey(prev => prev + 1)
          success('Featured token promoted successfully!')
        }}
      />
      
      <MobileTrendingModal
        isOpen={showTrendingModal}
        onClose={() => setShowTrendingModal(false)}
      />
      
      <AlphaChatSubscriptionModal
        isOpen={showAlphaSubscriptionModal}
        onClose={() => setShowAlphaSubscriptionModal(false)}
        ownerUsername={profile.username}
        ownerId={profile.id}
        onSubscriptionSuccess={() => {
          setHasAlphaAccess(true)
          loadAlphaMessages()
          success('Alpha chat subscription activated!')
        }}
      />
      
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
      
      <ToastContainer toasts={toasts} onClose={removeToast} />
      
      <MobileNavigation 
        currentUser={currentUser} 
        onSignOut={handleSignOut}
        onPromoteClick={() => setShowFeaturedTokenModal(true)}
      />
    </div>
  )
}
