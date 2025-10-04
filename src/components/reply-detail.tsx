'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, MessageCircle, Share, Coins } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { CreateReply } from '@/components/create-reply'
import { ThreadedReply } from '@/components/threaded-reply'
import { Post, Reply } from '@/lib/database'
import { formatDate, formatNumber, getBestDexScreenerUrl } from '@/lib/utils'
import { getPostById, likePost, unlikePost, likeReply, unlikeReply, deletePost, createReply, getAllRepliesForPost, getRepliesToReply } from '@/lib/database'
import { supabase } from '@/lib/supabase'

interface ReplyDetailProps {
  postId: string
  replyId: string
  currentUser: { id: string; username: string; avatar_url?: string }
  onPromote?: (postId: string) => void
}

export const ReplyDetail = ({ postId, replyId, currentUser, onPromote }: ReplyDetailProps) => {
  const router = useRouter()
  const [post, setPost] = useState<Post | null>(null)
  const [reply, setReply] = useState<Reply | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLiked, setIsLiked] = useState(false)
  const [_likesCount, setLikesCount] = useState(0)
  const [showDeleteMenu, setShowDeleteMenu] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isSubmittingReply, setIsSubmittingReply] = useState(false)
  const [threadedReplies, setThreadedReplies] = useState<Reply[]>([])
  const [isLoadingThreadedReplies, setIsLoadingThreadedReplies] = useState(false)
  const [conversationThread, setConversationThread] = useState<Reply[]>([])
  const [isLoadingThread, setIsLoadingThread] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      
      // Load the original post and all replies in parallel
      const [postData, allReplies] = await Promise.all([
        getPostById(postId, currentUser.id),
        getAllRepliesForPost(postId, currentUser.id)
      ])
      
      setPost(postData)
      
      // Find the target reply from the allReplies array
      const targetReply = allReplies.find(reply => reply.id === replyId)
      
      if (targetReply) {
        setReply(targetReply)
        setIsLiked(targetReply.is_liked)
        setLikesCount(targetReply.likes_count)
        // Build the conversation thread using the already loaded replies
        await buildConversationThreadFromReplies(targetReply, allReplies)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [postId, replyId, currentUser.id])

  const loadThreadedReplies = useCallback(async (replyId: string) => {
    try {
      setIsLoadingThreadedReplies(true)
      const replies = await getRepliesToReply(replyId, currentUser.id)
      setThreadedReplies(replies)
    } catch (error) {
      console.error('Error loading threaded replies:', error)
    } finally {
      setIsLoadingThreadedReplies(false)
    }
  }, [currentUser.id])

  const buildConversationThreadFromReplies = (targetReply: Reply, allReplies: Reply[]) => {
    try {
      setIsLoadingThread(true)
      
      // Create a map for O(1) lookup by reply ID
      const repliesMap = new Map<string, Reply>()
      allReplies.forEach(reply => repliesMap.set(reply.id, reply))
      
      const thread: Reply[] = []
      let currentReply: Reply | null = targetReply

      // Build the thread by traversing up the parent chain using the in-memory map
      while (currentReply) {
        thread.unshift(currentReply) // Add to beginning to maintain chronological order
        
        if (currentReply.parent_reply_id) {
          // Find parent reply in the map (O(1) lookup)
          currentReply = repliesMap.get(currentReply.parent_reply_id) || null
        } else {
          // No parent, we've reached the top-level reply
          break
        }
      }
      
      setConversationThread(thread)
    } catch (error) {
      console.error('Error building conversation thread:', error)
    } finally {
      setIsLoadingThread(false)
    }
  }


  useEffect(() => {
    if (postId && replyId && currentUser.id) {
      // Load main data and reply count in parallel
      loadData()
      loadThreadedReplies(replyId)
    }
  }, [postId, replyId, currentUser.id, loadData, loadThreadedReplies])

  const handleLike = async () => {
    if (!reply) return

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


  const handleDeleteConfirm = async () => {
    if (!reply) return
    
    try {
      setIsDeleting(true)
      await deletePost(currentUser.id, reply.id)
      // Redirect back to the original post after successful deletion
      router.push(`/posts/${postId}`)
    } catch (error) {
      console.error('Error deleting reply:', error)
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
    if (!reply) return

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

      await createReply({
        user_id: currentUser.id,
        post_id: postId, // Always reference the original post
        parent_reply_id: reply.id, // Reply to the specific reply
        content: data.content,
        image_url: publicUrl,
        token_symbol: data.tokenSymbol,
        token_address: data.tokenAddress,
        token_name: data.tokenName,
        dex_screener_url: dexScreenerUrl,
      })
      
      // Reload the data to show the new reply
      await loadData()
      // Also reload threaded replies count
      if (reply) {
        await loadThreadedReplies(reply.id)
      }
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

  if (!post || !reply) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-300 mb-2">Reply not found</h2>
          <p className="text-gray-500">This reply may have been deleted or doesn&apos;t exist.</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Original Post */}
      <article>
        <div 
          className="flex space-x-3 p-4 cursor-pointer hover:bg-gray-900/50 transition-colors"
          onClick={(e) => {
            // Don't navigate if clicking on interactive elements
            const target = e.target as HTMLElement
            const isInteractiveElement = target.closest('button') || 
                                        target.closest('a') || 
                                        target.closest('[role="button"]') ||
                                        target.closest('.avatar') ||
                                        target.closest('.token-link')
            
            if (!isInteractiveElement) {
              router.push(`/posts/${postId}`)
            }
          }}
        >
          <Avatar 
            className="h-10 w-10 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={(e) => {
              e.stopPropagation()
              handleProfileClick(post.profiles?.username || '')
            }}
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
                  onClick={(e) => {
                    e.stopPropagation()
                    handleProfileClick(post.profiles?.username || '')
                  }}
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
                      className="token-link flex items-center space-x-1 cursor-pointer hover:text-green-300 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (post.dex_screener_url) {
                          window.open(post.dex_screener_url, '_blank', 'noopener,noreferrer')
                        }
                      }}
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
                  post.is_liked ? 'text-red-500 hover:text-red-600' : 'hover:text-red-500'
                }`}
                onClick={async (e) => {
                  e.stopPropagation()
                  try {
                    if (post.is_liked) {
                      await unlikePost(currentUser.id, post.id)
                    } else {
                      await likePost(currentUser.id, post.id)
                    }
                    // Reload the post data to update like status
                    loadData()
                  } catch (error) {
                    console.error('Error toggling post like:', error)
                  }
                }}
              >
                <Heart className={`h-5 w-5 ${post.is_liked ? 'fill-current' : ''}`} />
                <span>{formatNumber(post.likes_count || 0)}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2 hover:text-blue-500"
                onClick={(e) => {
                  e.stopPropagation()
                  router.push(`/posts/${postId}`)
                }}
              >
                <MessageCircle className="h-5 w-5" />
                <span>{formatNumber(post.replies_count || 0)}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2 hover:text-green-500"
                onClick={async (e) => {
                  e.stopPropagation()
                  try {
                    const shareUrl = `${window.location.origin}/posts/${post.id}`
                    await navigator.clipboard.writeText(shareUrl)
                    // You could add a toast notification here
                  } catch (error) {
                    console.error('Error sharing post:', error)
                  }
                }}
              >
                <Share className="h-5 w-5" />
                <span>Share</span>
              </Button>
            </div>
          </div>
        </div>
      </article>

      {/* Conversation Thread */}
      {isLoadingThread ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        </div>
      ) : (
        <div className="border-b border-gray-800">
          {conversationThread.map((threadReply) => (
            <ThreadedReply
              key={threadReply.id}
              reply={threadReply}
              currentUser={currentUser}
              onPromote={onPromote}
              isInConversationThread={true}
            />
          ))}
        </div>
      )}

      {/* Reply to this comment */}
      <CreateReply
        currentUser={currentUser}
        onSubmit={handleReplySubmit}
        isSubmitting={isSubmittingReply}
        parentReplyId={reply.id}
      />

      {/* Replies to this reply */}
      {isLoadingThreadedReplies ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        </div>
      ) : (
        <div>
          {threadedReplies.map((threadedReply) => (
            <ThreadedReply
              key={threadedReply.id}
              reply={threadedReply}
              currentUser={currentUser}
              onPromote={onPromote}
              isInConversationThread={false}
            />
          ))}
        </div>
      )}

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
