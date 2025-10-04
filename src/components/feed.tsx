'use client'

import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { PostCard } from './post-card'
import { Post } from '@/lib/database'
import { likePost, unlikePost, likeAlphaChatMessage, unlikeAlphaChatMessage } from '@/lib/database'

interface FeedProps {
  posts: Post[]
  currentUserId?: string
  onLoadMore?: () => void
  hasMore?: boolean
  isLoading?: boolean
  onDeletePost?: (postId: string) => void
  onPromotePost?: (postId: string) => void
  onAlphaChatMessageLiked?: () => void // Callback to refresh alpha chat messages
}

export const Feed = ({ posts, currentUserId, onLoadMore, hasMore, isLoading, onDeletePost, onPromotePost, onAlphaChatMessageLiked }: FeedProps) => {

  const handleLike = async (postId: string) => {
    if (!currentUserId) return

    try {
      // Find the post to check if it's an alpha chat message
      const post = posts.find(p => p.id === postId)
      
      if (post?.is_alpha_chat_message) {
        await likeAlphaChatMessage(currentUserId, postId)
        // Don't refresh the page - the UI is updated optimistically by PostCard
      } else {
        await likePost(currentUserId, postId)
      }
    } catch (error) {
      console.error('Error liking post:', error)
    }
  }

  const handleUnlike = async (postId: string) => {
    if (!currentUserId) return

    try {
      // Find the post to check if it's an alpha chat message
      const post = posts.find(p => p.id === postId)
      if (post?.is_alpha_chat_message) {
        await unlikeAlphaChatMessage(currentUserId, postId)
        // Don't refresh the page - the UI is updated optimistically by PostCard
      } else {
        await unlikePost(currentUserId, postId)
      }
    } catch (error) {
      console.error('Error unliking post:', error)
    }
  }

  const handleScroll = () => {
    if (
      window.innerHeight + document.documentElement.scrollTop >=
      document.documentElement.offsetHeight - 1000 &&
      hasMore &&
      !isLoading
    ) {
      onLoadMore?.()
    }
  }

  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [hasMore, isLoading])

  if (posts.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-gray-500 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-white mb-2">No memes yet</h3>
        <p className="text-gray-400">Be the first to share a meme!</p>
      </div>
    )
  }

  return (
    <div>
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          currentUserId={currentUserId}
          onLike={handleLike}
          onUnlike={handleUnlike}
          onDelete={onDeletePost}
          onPromote={onPromotePost}
        />
      ))}
      
      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-green-500" />
        </div>
      )}
      
      {!hasMore && posts.length > 0 && (
        <div className="text-center py-8 text-gray-400">
          <p>You&apos;ve reached the end!</p>
        </div>
      )}
    </div>
  )
}
