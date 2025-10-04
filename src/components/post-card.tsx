'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, MessageCircle, Share, Check, MoreHorizontal, Trash2, Coins, TrendingUp, BarChart3, Flame, Gem, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { Post, AlphaChatMessage } from '@/lib/database'
import { formatDate, formatNumber } from '@/lib/utils'
import { useImpressionTracking } from '@/hooks/useImpressionTracking'

interface PostCardProps {
  post: Post
  currentUserId?: string
  onLike?: (postId: string) => void
  onUnlike?: (postId: string) => void
  onDelete?: (postId: string) => void
  onPromote?: (postId: string) => void
}

export const PostCard = ({ post, currentUserId, onLike, onUnlike, onDelete, onPromote }: PostCardProps) => {
  const router = useRouter()
  const [isLiked, setIsLiked] = useState(post.is_liked)
  const [likesCount, setLikesCount] = useState(post.likes_count)
  const [showDeleteMenu, setShowDeleteMenu] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isShared, setIsShared] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  
  // Reaction states for alpha chat messages
  const [fireCount, setFireCount] = useState((post as AlphaChatMessage).fire_count || 0)
  const [isFireReacted, setIsFireReacted] = useState((post as AlphaChatMessage).is_fire_reacted || false)
  const [diamondCount, setDiamondCount] = useState((post as AlphaChatMessage).diamond_count || 0)
  const [isDiamondReacted, setIsDiamondReacted] = useState((post as AlphaChatMessage).is_diamond_reacted || false)
  const [moneyCount, setMoneyCount] = useState((post as AlphaChatMessage).money_count || 0)
  const [isMoneyReacted, setIsMoneyReacted] = useState((post as AlphaChatMessage).is_money_reacted || false)
  
  // Check if promotion is currently active
  const isPromotionActive = post.is_promoted && post.promotion_end && new Date(post.promotion_end) > new Date()
  
  const impressionRef = useImpressionTracking({
    postId: post.id,
    userId: currentUserId,
    enabled: true,
    threshold: 0.5,
    delay: 1000
  })

  const handleLike = () => {
    if (isLiked) {
      setIsLiked(false)
      setLikesCount(prev => prev - 1)
      onUnlike?.(post.id)
    } else {
      setIsLiked(true)
      setLikesCount(prev => prev + 1)
      onLike?.(post.id)
    }
  }

  // Reaction handlers for alpha chat messages - using database functions like the like function
  const handleFireReaction = async () => {
    if (!currentUserId) return

    try {
      const { reactFireAlphaChatMessage } = await import('@/lib/database')
      const result = await reactFireAlphaChatMessage(currentUserId, post.id)
      setFireCount(result.fire_count)
      setIsFireReacted(prev => !prev)
    } catch (error) {
      console.error('Error reacting with fire:', error)
    }
  }


  const handleDiamondReaction = async () => {
    if (!currentUserId) return

    try {
      const { reactDiamondAlphaChatMessage } = await import('@/lib/database')
      const result = await reactDiamondAlphaChatMessage(currentUserId, post.id)
      setDiamondCount(result.diamond_count)
      setIsDiamondReacted(prev => !prev)
    } catch (error) {
      console.error('Error reacting with diamond:', error)
    }
  }

  const handleMoneyReaction = async () => {
    if (!currentUserId) return

    try {
      const { reactMoneyAlphaChatMessage } = await import('@/lib/database')
      const result = await reactMoneyAlphaChatMessage(currentUserId, post.id)
      setMoneyCount(result.money_count)
      setIsMoneyReacted(prev => !prev)
    } catch (error) {
      console.error('Error reacting with money:', error)
    }
  }


  const handleProfileClick = () => {
    if (post.profiles?.username) {
      router.push(`/profile/${post.profiles.username}`)
    }
  }

  const handlePostClick = () => {
    router.push(`/posts/${post.id}`)
  }

  const handlePostCardClick = (e: React.MouseEvent) => {
    // Don't navigate for alpha chat messages
    if (post.is_alpha_chat_message) {
      return
    }
    
    // Only navigate if the click wasn't on an interactive element
    const target = e.target as HTMLElement
    const isInteractiveElement = target.closest('button, a, [role="button"]') || 
                                target.closest('[data-prevent-navigation]')
    
    if (!isInteractiveElement) {
      handlePostClick()
    }
  }

  const handleDeleteClick = () => {
    setShowDeleteDialog(true)
    setShowDeleteMenu(false)
  }

  const handlePromoteClick = () => {
    onPromote?.(post.id)
    setShowDeleteMenu(false)
  }

  const handleDeleteConfirm = async () => {
    if (!onDelete) return
    
    try {
      setIsDeleting(true)
      await onDelete(post.id)
    } catch (error) {
      console.error('Error deleting post:', error)
      // Error handling is done in the parent component with toast notifications
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const handleShare = async () => {
    try {
      const postUrl = `${window.location.origin}/posts/${post.id}`
      await navigator.clipboard.writeText(postUrl)
      setIsShared(true)
      
      // Reset the icon after 2 seconds
      setTimeout(() => {
        setIsShared(false)
      }, 2000)
    } catch (error) {
      console.error('Error copying to clipboard:', error)
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
    <article 
      ref={impressionRef as React.RefObject<HTMLElement>}
      className="border-b border-gray-800 hover:bg-gray-900/50 transition-colors cursor-pointer overflow-hidden"
      onClick={handlePostCardClick}
    >
      <div className="flex space-x-3 p-3 sm:p-4 min-w-0">
        <Avatar 
          className="h-10 w-10 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={handleProfileClick}
          data-prevent-navigation
        >
          <AvatarImage src={post.profiles?.avatar_url || undefined} alt={post.profiles?.username || 'User'} />
          <AvatarFallback className="bg-green-500 text-white font-semibold">
            {post.profiles?.username?.charAt(0).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1 min-w-0">
            <div className="flex items-center space-x-2 min-w-0 flex-1 overflow-hidden">
              <span 
                className={`font-semibold cursor-pointer hover:underline flex-shrink-0 ${
                  isPromotionActive ? 'text-yellow-400' : 
                  post.profiles?.pro ? 'pro-username-gold' : 'text-white'
                }`}
                onClick={handleProfileClick}
                data-prevent-navigation
                style={{ 
                  maxWidth: post.token_symbol ? '120px' : '200px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
                title={post.profiles?.full_name || post.profiles?.username || 'Unknown User'}
              >
                {post.profiles?.full_name || post.profiles?.username || 'Unknown User'}
              </span>
              <span className="text-gray-400 text-sm flex-shrink-0">·</span>
              <time className="text-gray-400 text-sm flex-shrink-0">
                {formatDate(post.created_at)}
              </time>
              {/* Promoted badge - only show for active promotions */}
              {isPromotionActive && (
                <>
                  <span className="text-gray-400 text-sm flex-shrink-0">·</span>
                  <Badge variant="secondary" className="bg-green-600 text-white text-xs px-2 py-0.5 flex-shrink-0">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Promoted
                  </Badge>
                </>
              )}
              {/* Token tag - gets priority space */}
              {post.token_symbol && (
                <>
                  <span className="text-gray-400 text-sm flex-shrink-0">·</span>
                  <div 
                    className="flex items-center space-x-1 cursor-pointer hover:text-green-300 transition-colors flex-shrink-0"
                    onClick={() => {
                      if (post.dex_screener_url) {
                        window.open(post.dex_screener_url, '_blank', 'noopener,noreferrer')
                      }
                    }}
                    data-prevent-navigation
                    title={post.dex_screener_url ? "View on DexScreener" : "Token linked"}
                  >
                    <Coins className="h-3 w-3 text-green-400" />
                    <span className="text-green-400 text-sm font-medium">
                      ${post.token_symbol}
                    </span>
                  </div>
                </>
              )}
            </div>
            
            {/* Delete menu - only show for post author */}
            {currentUserId && post.user_id === currentUserId && (
              <div className="relative" ref={menuRef}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white bg-transparent hover:bg-gray-800 rounded-full p-1"
                  onClick={() => setShowDeleteMenu(!showDeleteMenu)}
                  disabled={isDeleting}
                  data-prevent-navigation
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
                
                {showDeleteMenu && (
                  <div className="absolute right-1 top-9 bg-black border border-gray-700 rounded-lg shadow-lg z-10 min-w-[160px] py-1">
                    <button
                      className="w-full flex items-center px-4 py-2 text-sm text-white hover:text-gray-200 hover:bg-gray-500/10 transition-colors"
                      onClick={handlePromoteClick}
                      data-prevent-navigation
                    >
                      <TrendingUp className="h-4 w-4 mr-3" />
                      Promote
                    </button>
                    <button
                      className="w-full flex items-center px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                      onClick={handleDeleteClick}
                      disabled={isDeleting}
                      data-prevent-navigation
                    >
                      <Trash2 className="h-4 w-4 mr-3" />
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {post.content && (
            <p className="text-gray-100 mb-3 whitespace-pre-wrap break-words">
              {post.content}
            </p>
          )}


          {post.image_url && (
            <div className="relative mb-3">
              <img
                src={post.image_url}
                alt="Meme"
                className="w-full rounded-lg object-contain border border-gray-700 hover:opacity-90 transition-opacity"
                loading="lazy"
              />
            </div>
          )}

          <div className="flex items-center space-x-4 sm:space-x-6 text-gray-400 -ml-3">
            <Button
              variant="ghost"
              size="sm"
              className={`flex items-center space-x-2 ${
                isLiked ? 'text-red-500 hover:text-red-600' : 'hover:text-red-500'
              }`}
              onClick={handleLike}
              disabled={!currentUserId}
              data-prevent-navigation
            >
              <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
              <span>{formatNumber(likesCount)}</span>
            </Button>

            {/* Additional reaction buttons for alpha chat messages */}
            {post.is_alpha_chat_message && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`flex items-center space-x-1 ${
                    isFireReacted ? 'text-orange-500' : 'hover:text-orange-500'
                  }`}
                  disabled={!currentUserId}
                  data-prevent-navigation
                  onClick={handleFireReaction}
                >
                  <Flame className={`h-4 w-4 ${isFireReacted ? 'fill-current' : ''}`} />
                  <span>{formatNumber(fireCount)}</span>
                </Button>


                <Button
                  variant="ghost"
                  size="sm"
                  className={`flex items-center space-x-1 ${
                    isDiamondReacted ? 'text-purple-500' : 'hover:text-purple-500'
                  }`}
                  disabled={!currentUserId}
                  data-prevent-navigation
                  onClick={handleDiamondReaction}
                >
                  <Gem className={`h-4 w-4 ${isDiamondReacted ? 'stroke-current' : ''}`} />
                  <span>{formatNumber(diamondCount)}</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className={`flex items-center space-x-1 ${
                    isMoneyReacted ? 'text-green-600' : 'hover:text-green-600'
                  }`}
                  disabled={!currentUserId}
                  data-prevent-navigation
                  onClick={handleMoneyReaction}
                >
                  <DollarSign className={`h-4 w-4 ${isMoneyReacted ? 'stroke-current' : ''}`} />
                  <span>{formatNumber(moneyCount)}</span>
                </Button>
              </>
            )}

            {/* Hide comment button for alpha chat messages */}
            {!post.is_alpha_chat_message && (
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2 hover:text-blue-500"
                onClick={handlePostClick}
                data-prevent-navigation
              >
                <MessageCircle className="h-5 w-5" />
                <span>{formatNumber(post.replies_count || 0)}</span>
              </Button>
            )}

            {/* Hide impressions and share buttons for alpha chat messages */}
            {!post.is_alpha_chat_message && (
              <>
                <div className="flex items-center space-x-2 text-gray-400">
                  <BarChart3 className="h-5 w-5" />
                  <span>{formatNumber(post.impression_count || 0)}</span>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className={`flex items-center space-x-2 ${
                    isShared ? 'text-green-500' : 'hover:text-green-500'
                  }`}
                  onClick={handleShare}
                  data-prevent-navigation
                >
                  {isShared ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <Share className="h-5 w-5" />
                  )}
                  <span>{isShared ? 'Copied!' : 'Share'}</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        isLoading={isDeleting}
      />
    </article>
  )
}
