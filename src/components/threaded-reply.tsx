'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, MessageCircle, Share, MoreHorizontal, Trash2, Coins } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { Reply } from '@/lib/database'
import { formatDate, formatNumber } from '@/lib/utils'
import { likeReply, unlikeReply, deletePost, getRepliesToReply } from '@/lib/database'

interface ThreadedReplyProps {
  reply: Reply
  currentUser: { id: string; username: string; avatar_url?: string }
  onPromote?: (postId: string) => void
  depth?: number
  maxDepth?: number
  isInConversationThread?: boolean // New prop to control styling
}

export const ThreadedReply = ({ reply, currentUser, onPromote: _onPromote, depth: _depth = 0, maxDepth: _maxDepth = 10, isInConversationThread = false }: ThreadedReplyProps) => {
  const router = useRouter()
  const [isLiked, setIsLiked] = useState(reply.is_liked)
  const [likesCount, setLikesCount] = useState(reply.likes_count)
  const [showDeleteMenu, setShowDeleteMenu] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [threadedReplies, setThreadedReplies] = useState<Reply[]>([])
  const [isLoadingReplies, setIsLoadingReplies] = useState(true) // Start as loading
  const menuRef = useRef<HTMLDivElement>(null)

  const loadThreadedReplies = async () => {
    try {
      setIsLoadingReplies(true)
      const replies = await getRepliesToReply(reply.id, currentUser.id)
      setThreadedReplies(replies)
      console.log(`Loaded ${replies.length} replies for reply ${reply.id}`)
    } catch (error) {
      console.error('Error loading threaded replies:', error)
      // Set empty array on error so count shows 0
      setThreadedReplies([])
    } finally {
      setIsLoadingReplies(false)
    }
  }

  // Load reply count on mount
  useEffect(() => {
    loadThreadedReplies()
  }, [reply.id, currentUser.id])

  const handleLike = async () => {
    try {
      if (isLiked) {
        await unlikeReply(currentUser.id, reply.id)
        setIsLiked(false)
        setLikesCount(prev => prev - 1)
      } else {
        await likeReply(currentUser.id, reply.id)
        setIsLiked(true)
        setLikesCount(prev => prev + 1)
      }
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }

  const handleProfileClick = (username: string) => {
    router.push(`/profile/${username}`)
  }

  const handleDeleteClick = () => {
    setShowDeleteDialog(true)
    setShowDeleteMenu(false)
  }

  const handleDeleteConfirm = async () => {
    try {
      setIsDeleting(true)
      await deletePost(currentUser.id, reply.id)
      // Remove from parent component's state
      window.location.reload() // Simple refresh for now
    } catch (error) {
      console.error('Error deleting reply:', error)
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }



  const handleReplyClick = () => {
    // Navigate to reply detail page instead of showing inline threads
    router.push(`/posts/${reply.post_id}/reply/${reply.id}`)
  }

  const handleReplyContainerClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
    const target = e.target as HTMLElement
    const isInteractiveElement = target.closest('button') || 
                                target.closest('a') || 
                                target.closest('[role="button"]') ||
                                target.closest('.avatar') ||
                                target.closest('.token-link')
    
    if (!isInteractiveElement) {
      router.push(`/posts/${reply.post_id}/reply/${reply.id}`)
    }
  }

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowDeleteMenu(false)
      }
    }

    if (showDeleteMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDeleteMenu])


  return (
    <div className={isInConversationThread ? '' : 'border-b border-gray-800'}>
      <div 
        className={`flex space-x-3 cursor-pointer hover:bg-gray-900/50 transition-colors ${
          isInConversationThread ? 'px-4 py-2' : 'p-4'
        }`}
        onClick={handleReplyContainerClick}
      >
        <Avatar 
          className="h-10 w-10 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={(e) => {
            e.stopPropagation()
            handleProfileClick(reply.profiles?.username || '')
          }}
        >
          <AvatarImage src={reply.profiles?.avatar_url || undefined} alt={reply.profiles?.username || 'User'} />
          <AvatarFallback className="bg-green-500 text-white font-semibold">
            {reply.profiles?.username?.charAt(0).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2">
              <span 
                className="font-semibold text-white cursor-pointer hover:underline"
                onClick={(e) => {
                  e.stopPropagation()
                  handleProfileClick(reply.profiles?.username || '')
                }}
                style={{ 
                  maxWidth: reply.token_symbol ? '120px' : '200px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
                title={reply.profiles?.full_name || reply.profiles?.username || 'Unknown User'}
              >
                {reply.profiles?.full_name || reply.profiles?.username || 'Unknown User'}
              </span>
              <span className="text-gray-400 text-sm">·</span>
              <time className="text-gray-400 text-sm">
                {formatDate(reply.created_at)}
              </time>
              {/* Token tag for replies */}
              {reply.token_symbol && (
                <>
                  <span className="text-gray-400 text-sm">·</span>
                  <div 
                    className="token-link flex items-center space-x-1 cursor-pointer hover:text-green-300 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (reply.dex_screener_url) {
                        window.open(reply.dex_screener_url, '_blank', 'noopener,noreferrer')
                      }
                    }}
                    title={reply.dex_screener_url ? "View on DexScreener" : "Token linked"}
                  >
                    <Coins className="h-3 w-3 text-green-400" />
                    <span className="text-green-400 text-sm font-medium">
                      ${reply.token_symbol}
                    </span>
                  </div>
                </>
              )}
            </div>
            
            {/* Delete menu - only show for reply author */}
            {currentUser.id === reply.user_id && (
              <div className="relative" ref={menuRef}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white bg-transparent hover:bg-gray-800 rounded-full p-1"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowDeleteMenu(!showDeleteMenu)
                  }}
                  disabled={isDeleting}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
                
                {showDeleteMenu && (
                  <div className="absolute right-1 top-9 bg-black border border-gray-700 rounded-lg shadow-lg z-10 min-w-[160px] py-1">
                    <button
                      className="w-full flex items-center px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                      onClick={handleDeleteClick}
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4 mr-3" />
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {reply.content && (
            <p className="text-gray-100 mb-3 whitespace-pre-wrap break-words">
              {reply.content}
            </p>
          )}

          {reply.image_url && (
            <div className="relative mb-3">
              <img
                src={reply.image_url}
                alt="Reply image"
                className="w-full rounded-lg object-contain border border-gray-700"
                loading="lazy"
              />
            </div>
          )}

          <div className="flex items-center space-x-6 text-gray-400 -ml-3">
            <Button
              variant="ghost"
              size="sm"
              className={`flex items-center space-x-2 ${
                isLiked ? 'text-red-500 hover:text-red-600' : 'hover:text-red-500'
              }`}
              onClick={(e) => {
                e.stopPropagation()
                handleLike()
              }}
            >
              <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
              <span>{formatNumber(likesCount)}</span>
            </Button>

            {/* Reply button - shows count and toggles reply form */}
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center space-x-2 hover:text-blue-500"
              onClick={(e) => {
                e.stopPropagation()
                handleReplyClick()
              }}
            >
              <MessageCircle className="h-5 w-5" />
              <span>{isLoadingReplies ? '...' : threadedReplies.length}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="flex items-center space-x-2 hover:text-green-500"
              onClick={(e) => e.stopPropagation()}
            >
              <Share className="h-5 w-5" />
              <span>Share</span>
            </Button>
          </div>
        </div>
      </div>


      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Reply"
        message="Are you sure you want to delete this reply? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        isLoading={isDeleting}
      />
    </div>
  )
}
