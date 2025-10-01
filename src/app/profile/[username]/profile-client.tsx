'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { MobileNavigation } from '@/components/mobile-navigation'
import { MobileMenuButton } from '@/components/mobile-menu-button'
import { Feed } from '@/components/feed'
import { TrendingTokensSectionWithData } from '@/components/trending-tokens-section-with-data'
import { FeaturedTokens } from '@/components/featured-tokens'
import { SearchBar } from '@/components/search-bar'
import { FeaturedTokenModal } from '@/components/featured-token-modal'
import { MobileTrendingModal } from '@/components/mobile-trending-modal'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ToastContainer, useToast } from '@/components/ui/toast'
import { Post, Profile, TrendingToken, getProfileByUsername, getPostsByUser, isFollowing, followUser, unfollowUser, getTopFollowers, getFollowing, getFollowerCount, getFollowingCount } from '@/lib/database'
import { supabase } from '@/lib/supabase'
import { Users, UserPlus, UserMinus, Settings } from 'lucide-react'
import { FollowersModal } from '@/components/followers-modal'
import { FollowingModal } from '@/components/following-modal'
import { EditProfileModal } from '@/components/edit-profile-modal'

interface ProfileClientProps {
  trendingTokens: TrendingToken[]
  tokenImages: Record<string, string>
}

export function ProfileClient({ trendingTokens, tokenImages }: ProfileClientProps) {
  const params = useParams()
  const username = params.username as string
  
  const [profile, setProfile] = useState<Profile | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string; avatar_url?: string } | undefined>(undefined)
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
  const [featuredTokensKey, setFeaturedTokensKey] = useState(0)
  const { toasts, removeToast, success } = useToast()

  const loadProfile = async () => {
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
          avatar_url: currentUserProfile.avatar_url
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

    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (username) {
      loadProfile()
    }
  }, [username])

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
              />
            </div>
          </div>
          
          {/* Profile Content - Scrollable */}
          <div className="flex-1 overflow-y-auto min-w-0">
            {/* Profile Header */}
            <div className="bg-black border-b border-gray-800 p-6">
              <div className="flex items-start space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile.avatar_url || ''} alt={profile.username} />
                  <AvatarFallback className="bg-gray-800 text-white text-xl">
                    {profile.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-2">
                    <h2 className="text-2xl font-bold text-white truncate">{profile.username}</h2>
                    {isOwnProfile && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowEditProfileModal(true)}
                        className="border-gray-600 text-gray-300 hover:bg-gray-800"
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    )}
                  </div>
                  
                  {profile.bio && (
                    <p className="text-gray-300 mb-4">{profile.bio}</p>
                  )}
                  
                  <div className="flex items-center space-x-6 mb-4">
                    <button
                      onClick={() => setShowFollowersModal(true)}
                      className="flex items-center space-x-1 text-gray-300 hover:text-white transition-colors"
                    >
                      <Users className="h-4 w-4" />
                      <span className="font-semibold">{followerCount}</span>
                      <span>followers</span>
                    </button>
                    
                    <button
                      onClick={() => setShowFollowingModal(true)}
                      className="flex items-center space-x-1 text-gray-300 hover:text-white transition-colors"
                    >
                      <span className="font-semibold">{followingCount}</span>
                      <span>following</span>
                    </button>
                  </div>
                  
                  {!isOwnProfile && currentUser && (
                    <Button
                      onClick={handleFollow}
                      disabled={isFollowingLoading}
                      className={`${
                        isFollowingUser 
                          ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
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
              </div>
            </div>
            
            {/* Posts */}
            <Feed
              posts={posts}
              currentUserId={currentUser?.id}
              isLoading={false}
            />
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
      
      <ToastContainer toasts={toasts} onClose={removeToast} />
      
      <MobileNavigation 
        currentUser={currentUser} 
        onSignOut={handleSignOut}
        onPromoteClick={() => setShowFeaturedTokenModal(true)}
      />
    </div>
  )
}
