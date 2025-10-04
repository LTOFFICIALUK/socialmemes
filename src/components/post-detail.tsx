'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, MessageCircle, Share, Check, MoreHorizontal, Trash2, Coins, TrendingUp, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { CreateReply } from '@/components/create-reply'
import { ThreadedReply } from '@/components/threaded-reply'
import { Post, Reply } from '@/lib/database'
import { formatDate, formatNumber, getBestDexScreenerUrl } from '@/lib/utils'
import { getPostById, likePost, unlikePost, deletePost, createReply, getRepliesByPostId } from '@/lib/database'
import { supabase } from '@/lib/supabase'
import { useImpressionTrackingImmediate } from '@/hooks/useImpressionTrackingImmediate'

interface PostDetailProps {
  postId: string
  currentUser: { id: string; username: string; avatar_url?: string }
  onPromote?: (postId: string) => void
}

export const PostDetail = ({ postId, currentUser, onPromote }: PostDetailProps) => {
  const router = useRouter()
  const [post, setPost] = useState<Post | null>(null)
  const [replies, setReplies] = useState<Reply[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [showDeleteMenu, setShowDeleteMenu] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isSubmittingReply, setIsSubmittingReply] = useState(false)
  const [isLoadingReplies, setIsLoadingReplies] = useState(false)
  const [isShared, setIsShared] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  
  useImpressionTrackingImmediate({
    postId,
    userId: currentUser.id,
    enabled: !isLoading && !!post
  })

  const loadPost = useCallback(async () => {
    try {
      setIsLoading(true)
      const postData = await getPostById(postId, currentUser.id)
      setPost(postData)
      setIsLiked(postData.is_liked)
      setLikesCount(postData.likes_count)
    } catch (error) {
      console.error('Error loading post:', error)
      // Post not found or error - could redirect to 404
    } finally {
      setIsLoading(false)
    }
  }, [postId, currentUser.id])

  const loadReplies = useCallback(async () => {
    try {
      setIsLoadingReplies(true)
      const repliesData = await getRepliesByPostId(postId, currentUser.id)
      setReplies(repliesData)
    } catch (error) {
      console.error('Error loading replies:', error)
    } finally {
      setIsLoadingReplies(false)
    }
  }, [postId, currentUser.id])

  useEffect(() => {
    if (postId && currentUser.id) {
      loadPost()
      loadReplies()
    }
  }, [postId, currentUser.id, loadPost, loadReplies])

  // Handle scrolling to specific reply when page loads with hash
  useEffect(() => {
    const hash = window.location.hash
    if (hash && hash.startsWith('#reply-')) {
      const replyId = hash.replace('#reply-', '')
      // Wait a bit for replies to load, then scroll to the reply
      setTimeout(() => {
        const replyElement = document.getElementById(`reply-${replyId}`)
        if (replyElement) {
          replyElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
          // Add a temporary highlight effect
          replyElement.style.backgroundColor = 'rgba(34, 197, 94, 0.1)'
          setTimeout(() => {
            replyElement.style.backgroundColor = ''
          }, 2000)
        }
      }, 500)
    }
  }, [replies]) // Run when replies are loaded

  const handleLike = async () => {
    if (!post) return

    try {
      if (isLiked) {
        await unlikePost(currentUser.id, post.id)
        setIsLiked(false)
        setLikesCount(prev => prev - 1)
      } else {
        await likePost(currentUser.id, post.id)
        setIsLiked(true)
        setLikesCount(prev => prev + 1)
      }
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }

  const handleTokenClick = () => {
    if (post?.dex_screener_url) {
      window.open(post.dex_screener_url, '_blank', 'noopener,noreferrer')
    }
  }

  const handleProfileClick = (username: string) => {
    router.push(`/profile/${username}`)
  }

  const handleDeleteClick = () => {
    setShowDeleteDialog(true)
    setShowDeleteMenu(false)
  }

  const handlePromoteClick = () => {
    onPromote?.(postId)
    setShowDeleteMenu(false)
  }

  const handleDeleteConfirm = async () => {
    if (!post) return
    
    try {
      setIsDeleting(true)
      await deletePost(currentUser.id, post.id)
      // Redirect back to home after successful deletion
      router.push('/')
    } catch (error) {
      console.error('Error deleting post:', error)
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const handleShare = async () => {
    try {
      const postUrl = `${window.location.origin}/posts/${postId}`
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

  const handleReplySubmit = async (data: {
    content?: string
    image?: File
    tokenSymbol?: string
    tokenAddress?: string
    tokenName?: string
  }) => {
    if (!post) return

    try {
      setIsSubmittingReply(true)
      
      let publicUrl: string | undefined
      
      // Upload image to Supabase storage if provided
      if (data.image) {
        const fileExt = data.image.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('memes')
          .upload(fileName, data.image)

        if (uploadError) throw uploadError

        const { data: { publicUrl: uploadedUrl } } = supabase.storage
          .from('memes')
          .getPublicUrl(fileName)
        
        publicUrl = uploadedUrl
      }

      // Generate DexScreener URL if token address is provided
      let dexScreenerUrl = undefined
      if (data.tokenAddress) {
        dexScreenerUrl = await getBestDexScreenerUrl(data.tokenAddress)
      }

      const newReply = await createReply({
        user_id: currentUser.id,
        post_id: post.id,
        content: data.content,
        image_url: publicUrl,
        token_symbol: data.tokenSymbol,
        token_address: data.tokenAddress,
        token_name: data.tokenName,
        dex_screener_url: dexScreenerUrl,
      })
      
      // Add the new reply to the list
      setReplies(prev => [newReply, ...prev])
    } catch (error) {
      console.error('Error creating reply:', error)
    } finally {
      setIsSubmittingReply(false)
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-300 mb-2">Post not found</h2>
          <p className="text-gray-500">This post may have been deleted or doesn&apos;t exist.</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Main Post */}
      <article className="border-b border-gray-800">
        <div className="flex space-x-3 p-4">
          <Avatar 
            className="h-10 w-10 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => handleProfileClick(post.profiles?.username || '')}
          >
            <AvatarImage src={post.profiles?.avatar_url || undefined} alt={post.profiles?.username || 'User'} />
            <AvatarFallback className="bg-green-500 text-white font-semibold">
              {post.profiles?.username?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-2">
                <span 
                  className={`font-semibold cursor-pointer hover:underline ${
                    post.profiles?.pro ? 'pro-username-gold' : 'text-white'
                  }`}
                  onClick={() => handleProfileClick(post.profiles?.username || '')}
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
                <span className="text-gray-400 text-sm">·</span>
                <time className="text-gray-400 text-sm">
                  {formatDate(post.created_at)}
                </time>
                {/* Token tag */}
                {post.token_symbol && (
                  <>
                    <span className="text-gray-400 text-sm">·</span>
                    <div 
                      className="flex items-center space-x-1 cursor-pointer hover:text-green-300 transition-colors"
                      onClick={handleTokenClick}
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
              {currentUser.id === post.user_id && (
                <div className="relative" ref={menuRef}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white bg-transparent hover:bg-gray-800 rounded-full p-1"
                    onClick={() => setShowDeleteMenu(!showDeleteMenu)}
                    disabled={isDeleting}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                  
                  {showDeleteMenu && (
                    <div className="absolute right-1 top-9 bg-black border border-gray-700 rounded-lg shadow-lg z-10 min-w-[160px] py-1">
                      <button
                        className="w-full flex items-center px-4 py-2 text-sm text-white hover:text-gray-200 hover:bg-gray-500/10 transition-colors"
                        onClick={handlePromoteClick}
                      >
                        <TrendingUp className="h-4 w-4 mr-3" />
                        Promote
                      </button>
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
                onClick={handleLike}
              >
                <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
                <span>{formatNumber(likesCount)}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2 hover:text-blue-500"
                disabled
              >
                <MessageCircle className="h-5 w-5" />
                <span>{formatNumber(post.replies_count || 0)}</span>
              </Button>

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
              >
                {isShared ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <Share className="h-5 w-5" />
                )}
                <span>{isShared ? 'Copied!' : 'Share'}</span>
              </Button>
            </div>
          </div>
        </div>
      </article>

      {/* Reply Box */}
      <CreateReply
        currentUser={currentUser}
        onSubmit={handleReplySubmit}
        isSubmitting={isSubmittingReply}
      />

      {/* Replies */}
      <div>
        {isLoadingReplies ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
          </div>
        ) : replies.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No replies yet. Be the first to reply!</p>
          </div>
        ) : (
          replies.map((reply) => (
            <ThreadedReply
              key={reply.id}
              reply={reply}
              currentUser={currentUser}
              onPromote={onPromote}
              depth={0}
              maxDepth={10}
            />
          ))
        )}
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
    </div>
  )
}
