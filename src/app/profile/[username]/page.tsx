'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { MobileNavigation } from '@/components/mobile-navigation'
import { MobileMenuButton } from '@/components/mobile-menu-button'
import { Feed } from '@/components/feed'
import { TrendingTokens } from '@/components/trending-tokens'
import { SearchBar } from '@/components/search-bar'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Post, Profile, getProfileByUsername, getPostsByUser, isFollowing, followUser, unfollowUser, getTopFollowers, getFollowing } from '@/lib/database'
import { supabase } from '@/lib/supabase'
import { Users, UserPlus, UserMinus, Settings } from 'lucide-react'
import { FollowersModal } from '@/components/followers-modal'
import { FollowingModal } from '@/components/following-modal'
import { EditProfileModal } from '@/components/edit-profile-modal'

export default function ProfilePage() {
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
  const [showFollowersModal, setShowFollowersModal] = useState(false)
  const [showFollowingModal, setShowFollowingModal] = useState(false)
  const [showEditProfileModal, setShowEditProfileModal] = useState(false)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true)
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
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
        } else {
          setCurrentUser(undefined)
        }
        
        // Get profile
        const profileData = await getProfileByUsername(username)
        if (!profileData) {
          // Profile not found
          return
        }
        setProfile(profileData)
        
        // Get posts
        const postsData = await getPostsByUser(profileData.id)
        setPosts(postsData)
        
        // Get followers and following
        const [followersData, followingData] = await Promise.all([
          getTopFollowers(profileData.id, 10),
          getFollowing(profileData.id)
        ])
        setFollowers(followersData)
        setFollowing(followingData)
        
        // Check if current user is following this profile
        if (user && user.id !== profileData.id) {
          const followingStatus = await isFollowing(user.id, profileData.id)
          setIsFollowingUser(followingStatus)
        }
      } catch (error) {
        console.error('Error loading profile:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadProfile()
  }, [username])

  const handleFollow = async () => {
    if (!currentUser || !profile || currentUser.id === profile.id) return
    
    try {
      setIsFollowingLoading(true)
      
      if (isFollowingUser) {
        await unfollowUser(currentUser.id, profile.id)
        setIsFollowingUser(false)
      } else {
        await followUser(currentUser.id, profile.id)
        setIsFollowingUser(true)
      }
    } catch (error) {
      console.error('Error updating follow status:', error)
    } finally {
      setIsFollowingLoading(false)
    }
  }

  const handleProfileUpdate = (updatedProfile: Profile) => {
    setProfile(updatedProfile)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setCurrentUser(undefined)
    // Redirect to signup page
    window.location.href = '/auth/signup'
  }

  // Don't render anything until profile is loaded
  if (isLoading) {
    return null
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-black">
        <div className="flex min-h-screen">
          {/* Left Column - Navigation */}
          <div className="w-80 border-l border-gray-800">
            <Navigation currentUser={currentUser} />
          </div>
          
          {/* Center Column - Error */}
          <div className="flex-1 max-w-2xl mx-auto border-l border-r border-gray-800 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white mb-2">Profile not found</h1>
              <p className="text-gray-400">The user you&apos;re looking for doesn&apos;t exist.</p>
            </div>
          </div>
          
          {/* Right Column - Search & Trending Tokens */}
          <div className="w-80 border-l border-r border-gray-800">
            {/* Search Bar */}
            <div className="mt-4 mb-4 px-4 pt-4">
              <SearchBar placeholder="Search posts, users, tokens..." />
            </div>
            
            <div className="bg-black rounded-xl border border-gray-800">
              <div className="sticky top-0 bg-black backdrop-blur-sm px-4 py-3 rounded-t-xl">
                <h2 className="text-lg font-bold text-white">Trending Tokens</h2>
              </div>
              
              <div className="px-4 pb-4 pt-1">
                <TrendingTokens limit={8} timePeriod="24 hours" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const isOwnProfile = currentUser?.id === profile.id

  return (
    <div className="min-h-screen bg-black overflow-x-hidden">
      <div className="flex h-screen max-w-7xl mx-auto min-w-0">
        {/* Left Column - Navigation */}
        <div className="w-64 px-4 lg:px-8 h-screen overflow-y-auto hidden lg:block">
          <Navigation currentUser={currentUser} />
        </div>
        
        {/* Center Column - Profile Content */}
        <div className="flex-1 w-full lg:max-w-2xl lg:border-l lg:border-r border-gray-800 h-screen flex flex-col pb-16 lg:pb-0 min-w-0">
          {/* Header */}
          <div className="bg-black/80 backdrop-blur-sm border-b border-gray-800 px-4 py-3 flex-shrink-0 flex items-center justify-between">
            <h1 className="text-xl font-bold text-white">
              {profile.full_name || profile.username}
            </h1>
            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <MobileMenuButton currentUser={currentUser} onSignOut={handleSignOut} />
            </div>
          </div>
          
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Banner */}
            {profile.banner_url && (
              <div className="w-full h-32 sm:h-48 bg-gray-800 relative">
                <img
                  src={profile.banner_url}
                  alt={`${profile.username}'s banner`}
                  className="w-full h-full object-cover"
                  style={{ objectPosition: 'center' }}
                />
              </div>
            )}
            
            {/* Profile Header */}
            <div className="border-b border-gray-800 p-4 sm:p-6">
              <div className="flex items-start space-x-3 sm:space-x-4">
                <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
                  <AvatarImage src={profile.avatar_url || undefined} alt={profile.username} />
                  <AvatarFallback className="bg-green-500 text-white font-semibold text-lg sm:text-2xl">
                    {profile.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg sm:text-2xl font-bold text-white truncate">
                        {profile.full_name || profile.username}
                      </h2>
                      <p className="text-sm sm:text-base text-gray-400 truncate">@{profile.username}</p>
                    </div>
                    
                    {isOwnProfile ? (
                      <Button
                        onClick={() => setShowEditProfileModal(true)}
                        variant="outline"
                        size="sm"
                        className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm ml-2 flex-shrink-0"
                      >
                        <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">Edit Profile</span>
                        <span className="sm:hidden">Edit</span>
                      </Button>
                    ) : currentUser ? (
                      <Button
                        onClick={handleFollow}
                        disabled={isFollowingLoading}
                        variant="outline"
                        size="sm"
                        className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm ml-2 flex-shrink-0"
                      >
                        {isFollowingUser ? (
                          <>
                            <UserMinus className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="hidden sm:inline">Unfollow</span>
                            <span className="sm:hidden">Unfollow</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="hidden sm:inline">Follow</span>
                            <span className="sm:hidden">Follow</span>
                          </>
                        )}
                      </Button>
                    ) : null}
                  </div>
                  
                  {profile.bio && (
                    <p className="mt-2 text-sm sm:text-base text-gray-100 break-words">{profile.bio}</p>
                  )}
                  
                  <div className="mt-3 sm:mt-4 flex items-center space-x-4 sm:space-x-6 text-xs sm:text-sm text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Users className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                      <span><span className="font-semibold text-white">{posts.length}</span> posts</span>
                    </div>
                    <button 
                      onClick={() => setShowFollowersModal(true)}
                      className="flex items-center space-x-1 hover:text-white transition-colors"
                    >
                      <span className="font-semibold text-white">{followers.length}</span>
                      <span>followers</span>
                    </button>
                    <button 
                      onClick={() => setShowFollowingModal(true)}
                      className="flex items-center space-x-1 hover:text-white transition-colors"
                    >
                      <span className="font-semibold text-white">{following.length}</span>
                      <span>following</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Posts */}
            <Feed
              posts={posts}
              currentUserId={currentUser?.id}
              isLoading={false}
              onPromotePost={() => {}}
            />
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
            
            <div className="px-4 py-4">
              <TrendingTokens limit={8} timePeriod="24 hours" />
            </div>
          </div>
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
        onProfileUpdate={handleProfileUpdate}
      />
      
      {/* Mobile Navigation */}
      <MobileNavigation currentUser={currentUser} />
    </div>
  )
}
