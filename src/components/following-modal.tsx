'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Profile, followUser, unfollowUser } from '@/lib/database'
import { UserPlus, UserMinus, X } from 'lucide-react'

interface FollowingModalProps {
  isOpen: boolean
  onClose: () => void
  following: Profile[]
  currentUserId?: string
  profileUsername: string
}

export const FollowingModal = ({ 
  isOpen, 
  onClose, 
  following, 
  currentUserId,
  profileUsername 
}: FollowingModalProps) => {
  const [followingStates, setFollowingStates] = useState<Record<string, boolean>>({})
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})

  const handleFollow = async (followingId: string) => {
    if (!currentUserId || currentUserId === followingId) return
    
    try {
      setLoadingStates(prev => ({ ...prev, [followingId]: true }))
      
      const isCurrentlyFollowing = followingStates[followingId]
      
      if (isCurrentlyFollowing) {
        await unfollowUser(currentUserId, followingId)
        setFollowingStates(prev => ({ ...prev, [followingId]: false }))
      } else {
        await followUser(currentUserId, followingId)
        setFollowingStates(prev => ({ ...prev, [followingId]: true }))
      }
    } catch (error) {
      console.error('Error updating follow status:', error)
    } finally {
      setLoadingStates(prev => ({ ...prev, [followingId]: false }))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 pb-20 lg:pb-4">
      <div className="bg-black border border-gray-800 rounded-lg w-full max-w-md max-h-[calc(100vh-8rem)] lg:max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white">
            {profileUsername}&apos;s Following
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
          {following.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-400">@{profileUsername} is not following anyone yet.</p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {following.map((user) => (
                <div key={user.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar_url || undefined} alt={user.username} />
                      <AvatarFallback className="bg-green-500 text-white font-semibold">
                        {user.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-white">
                        {user.full_name || user.username}
                      </p>
                      <p className="text-sm text-gray-400">@{user.username}</p>
                    </div>
                  </div>
                  
                  {currentUserId && currentUserId !== user.id && (
                    <Button
                      onClick={() => handleFollow(user.id)}
                      disabled={loadingStates[user.id]}
                      variant={followingStates[user.id] ? "outline" : "default"}
                      size="sm"
                      className="flex items-center space-x-1"
                    >
                      {loadingStates[user.id] ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : followingStates[user.id] ? (
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
