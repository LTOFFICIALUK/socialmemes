'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Profile, followUser, unfollowUser } from '@/lib/database'
import { UserPlus, UserMinus, X } from 'lucide-react'

interface FollowersModalProps {
  isOpen: boolean
  onClose: () => void
  followers: Profile[]
  currentUserId?: string
  profileUsername: string
}

export const FollowersModal = ({ 
  isOpen, 
  onClose, 
  followers, 
  currentUserId,
  profileUsername 
}: FollowersModalProps) => {
  const [followingStates, setFollowingStates] = useState<Record<string, boolean>>({})
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})

  const handleFollow = async (followerId: string) => {
    if (!currentUserId || currentUserId === followerId) return
    
    try {
      setLoadingStates(prev => ({ ...prev, [followerId]: true }))
      
      const isCurrentlyFollowing = followingStates[followerId]
      
      if (isCurrentlyFollowing) {
        await unfollowUser(currentUserId, followerId)
        setFollowingStates(prev => ({ ...prev, [followerId]: false }))
      } else {
        await followUser(currentUserId, followerId)
        setFollowingStates(prev => ({ ...prev, [followerId]: true }))
      }
    } catch (error) {
      console.error('Error updating follow status:', error)
    } finally {
      setLoadingStates(prev => ({ ...prev, [followerId]: false }))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 pb-20 lg:pb-4">
      <div className="bg-black border border-gray-800 rounded-lg w-full max-w-md max-h-[calc(100vh-8rem)] lg:max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white">
            {profileUsername}&apos;s {followers.length === 1 ? 'Follower' : 'Followers'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {followers.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-400">@{profileUsername} has no followers yet.</p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {followers.map((follower) => (
                <div key={follower.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={follower.avatar_url || undefined} alt={follower.username} />
                      <AvatarFallback className="bg-purple-400 text-white font-semibold">
                        {follower.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-white">
                        {follower.full_name || follower.username}
                      </p>
                      <p className="text-sm text-gray-400">@{follower.username}</p>
                    </div>
                  </div>
                  
                  {currentUserId && currentUserId !== follower.id && (
                    <Button
                      onClick={() => handleFollow(follower.id)}
                      disabled={loadingStates[follower.id]}
                      variant={followingStates[follower.id] ? "outline" : "default"}
                      size="sm"
                      className="flex items-center space-x-1"
                    >
                      {loadingStates[follower.id] ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : followingStates[follower.id] ? (
                        <>
                          <UserMinus className="h-4 w-4" />
                          <span>Unfollow</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4" />
                          <span>Follow</span>
                        </>
                      )}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
