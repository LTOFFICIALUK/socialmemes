'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, MessageCircle, Share, MoreHorizontal, Trash2, Coins } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { CreateReply } from '@/components/create-reply'
import { Post, Reply } from '@/lib/database'
import { formatDate, formatNumber } from '@/lib/utils'
import { getPostById, likePost, unlikePost, deletePost, createReply, getRepliesByPostId } from '@/lib/database'
import { supabase } from '@/lib/supabase'

interface PostDetailProps {
  postId: string
  currentUser: { id: string; username: string; avatar_url?: string }
}

export const PostDetail = ({ postId, currentUser }: PostDetailProps) => {
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
  const menuRef = useRef<HTMLDivElement>(null)

  const loadPost = async () => {
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
  }

  const loadReplies = async () => {
    try {
      setIsLoadingReplies(true)
      const repliesData = await getRepliesByPostId(postId, currentUser.id)
      setReplies(repliesData)
    } catch (error) {
      console.error('Error loading replies:', error)
    } finally {
      setIsLoadingReplies(false)
    }
  }

  useEffect(() => {
    if (postId && currentUser.id) {
      loadPost()
      loadReplies()
    }
  }, [postId, currentUser.id])

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
        dexScreenerUrl = `https://dexscreener.com/solana/${data.tokenAddress}`
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
                  className="font-semibold text-white truncate cursor-pointer hover:underline"
                  onClick={() => handleProfileClick(post.profiles?.username || '')}
                >
                  {post.profiles?.full_name || post.profiles?.username || 'Unknown User'}
                </span>
                <span 
                  className="text-gray-400 text-sm cursor-pointer hover:underline"
                  onClick={() => handleProfileClick(post.profiles?.username || '')}
                >
                  @{post.profiles?.username || 'unknown'}
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

            <div className="flex items-center space-x-6 text-gray-400">
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

              <Button
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2 hover:text-green-500"
                onClick={() => navigator.clipboard.writeText(window.location.href)}
              >
                <Share className="h-5 w-5" />
                <span>Share</span>
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
            <ReplyCard
              key={reply.id}
              reply={reply}
              currentUserId={currentUser.id}
              onProfileClick={handleProfileClick}
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

// Reply Card Component
interface ReplyCardProps {
  reply: Reply
  currentUserId: string
  onProfileClick: (username: string) => void
}

const ReplyCard = ({ reply, currentUserId, onProfileClick }: ReplyCardProps) => {
  const [isLiked, setIsLiked] = useState(reply.is_liked)
  const [likesCount, setLikesCount] = useState(reply.likes_count)

  const handleLike = async () => {
    try {
      if (isLiked) {
        await unlikePost(currentUserId, reply.id)
        setIsLiked(false)
        setLikesCount(prev => prev - 1)
      } else {
        await likePost(currentUserId, reply.id)
        setIsLiked(true)
        setLikesCount(prev => prev + 1)
      }
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }

  return (
    <article className="border-b border-gray-800 hover:bg-gray-900/50 transition-colors">
      <div className="flex space-x-3 p-4">
        <Avatar 
          className="h-8 w-8 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => onProfileClick(reply.profiles?.username || '')}
        >
          <AvatarImage src={reply.profiles?.avatar_url || undefined} alt={reply.profiles?.username || 'User'} />
          <AvatarFallback className="bg-green-500 text-white font-semibold text-sm">
            {reply.profiles?.username?.charAt(0).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <span 
              className="font-semibold text-white text-sm truncate cursor-pointer hover:underline"
              onClick={() => onProfileClick(reply.profiles?.username || '')}
            >
              {reply.profiles?.full_name || reply.profiles?.username || 'Unknown User'}
            </span>
            <span 
              className="text-gray-400 text-xs cursor-pointer hover:underline"
              onClick={() => onProfileClick(reply.profiles?.username || '')}
            >
              @{reply.profiles?.username || 'unknown'}
            </span>
            <span className="text-gray-400 text-xs">·</span>
            <time className="text-gray-400 text-xs">
              {formatDate(reply.created_at)}
            </time>
          </div>

          {reply.content && (
            <p className="text-gray-100 text-sm mb-2 whitespace-pre-wrap break-words">
              {reply.content}
            </p>
          )}

          {reply.image_url && (
            <div className="relative mb-2">
              <img
                src={reply.image_url}
                alt="Reply image"
                className="w-full max-h-[20rem] rounded-lg object-contain border border-gray-700"
                loading="lazy"
              />
            </div>
          )}

          {/* Token tag for replies */}
          {reply.token_symbol && (
            <div className="mb-2">
              <div 
                className="inline-flex items-center space-x-1 cursor-pointer hover:text-green-300 transition-colors"
                onClick={() => {
                  if (reply.dex_screener_url) {
                    window.open(reply.dex_screener_url, '_blank', 'noopener,noreferrer')
                  }
                }}
                title={reply.dex_screener_url ? "View on DexScreener" : "Token linked"}
              >
                <Coins className="h-3 w-3 text-green-400" />
                <span className="text-green-400 text-xs font-medium">
                  ${reply.token_symbol}
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-4 text-gray-400">
            <Button
              variant="ghost"
              size="sm"
              className={`flex items-center space-x-1 text-xs ${
                isLiked ? 'text-red-500 hover:text-red-600' : 'hover:text-red-500'
              }`}
              onClick={handleLike}
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
              <span>{formatNumber(likesCount)}</span>
            </Button>
          </div>
        </div>
      </div>
    </article>
  )
}
