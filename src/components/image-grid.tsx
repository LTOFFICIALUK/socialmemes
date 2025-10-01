'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, ExternalLink } from 'lucide-react'
import { Post } from '@/lib/database'
import { getPosts } from '@/lib/database'
import { Loader2 } from 'lucide-react'

interface ImageGridProps {
  currentUserId?: string
}

export const ImageGrid = ({ currentUserId }: ImageGridProps) => {
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadingRef = useRef<HTMLDivElement | null>(null)

  const loadPosts = useCallback(async (reset = false) => {
    try {
      setIsLoading(true)
      const newOffset = reset ? 0 : offset
      console.log('Loading posts with userId:', currentUserId, 'offset:', newOffset)
      
      // Load fewer posts at a time for better performance
      const allPosts = await getPosts(currentUserId, 20, newOffset)
      console.log('Fetched posts:', allPosts.length, 'posts')
      
      // Filter for posts with images only
      const postsWithImages = allPosts.filter(post => 
        post.image_url && 
        post.image_url.trim() !== '' && 
        post.image_url !== null
      )
      console.log('Posts with images:', postsWithImages.length)
      
      if (reset) {
        setPosts(postsWithImages)
        setOffset(20)
      } else {
        setPosts(prev => [...prev, ...postsWithImages])
        setOffset(prev => prev + 20)
      }
      
      setHasMore(allPosts.length === 20)
    } catch (error) {
      console.error('Error loading posts:', error)
      // Set hasMore to false to stop infinite loading
      setHasMore(false)
    } finally {
      setIsLoading(false)
    }
  }, [currentUserId, offset])

  useEffect(() => {
    // Load posts even if currentUserId is undefined (for public posts)
    loadPosts(true)
  }, [currentUserId, loadPosts])

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [])

  // Intersection Observer for better performance
  const lastPostElementRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoading) return
    if (observerRef.current) observerRef.current.disconnect()
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadPosts()
      }
    })
    if (node) observerRef.current.observe(node)
  }, [isLoading, hasMore, loadPosts])

  const handleImageClick = (post: Post) => {
    router.push(`/posts/${post.id}`)
  }

  if (posts.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-gray-500 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-white mb-2">No images yet</h3>
        <p className="text-gray-400 mb-4">No posts with images have been shared yet.</p>
        <p className="text-gray-500 text-sm mb-4">Go to the Home page to create your first post with an image!</p>
        <div className="text-xs text-gray-600 bg-gray-800 p-3 rounded">
          <p>Debug: Check browser console for detailed logs</p>
          <p>Current user ID: {currentUserId ? 'Authenticated' : 'Not authenticated'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 p-4 min-w-0">
      {posts.map((post, index) => (
          <div
            key={post.id}
            ref={index === posts.length - 1 ? lastPostElementRef : null}
            className="relative group cursor-pointer aspect-square bg-black rounded-lg overflow-hidden border border-gray-600"
            onClick={() => handleImageClick(post)}
          >
            <img
              src={post.image_url || ''}
              alt={post.content || 'Post image'}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
            />
            
            {/* Overlay with likes count - only shows on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
              <div className="flex items-center space-x-2 bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full">
                <Heart className="h-5 w-5 text-white fill-white" />
                <span className="text-white font-medium">{post.likes_count}</span>
              </div>
            </div>
          </div>
      ))}
      
      {isLoading && (
        <div ref={loadingRef} className="col-span-4 flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-green-500" />
        </div>
      )}
      
      {!hasMore && posts.length > 0 && (
        <div className="col-span-4 text-center py-8 text-gray-400">
          <p>You&apos;ve reached the end!</p>
        </div>
      )}
    </div>
  )
}
