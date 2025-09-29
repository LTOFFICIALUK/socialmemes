'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { MobileNavigation } from '@/components/mobile-navigation'
import { CreatePost } from '@/components/create-post'
import { Feed } from '@/components/feed'
import { TrendingTokens } from '@/components/trending-tokens'
import { SearchBar } from '@/components/search-bar'
import { ToastContainer, useToast } from '@/components/ui/toast'
import { Post } from '@/lib/database'
import { getPosts, createPost as createPostDB } from '@/lib/database'
import { supabase } from '@/lib/supabase'

const TrendingTokensSection = () => {
  const [hasTokens, setHasTokens] = useState<boolean | null>(null)

  useEffect(() => {
    const checkForTokens = async () => {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('id')
          .not('token_symbol', 'is', null)
          .neq('token_symbol', '')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .limit(1)
        
        if (!error) {
          setHasTokens(data && data.length > 0)
        }
      } catch (error) {
        console.error('Error checking for tokens:', error)
        setHasTokens(false)
      }
    }

    checkForTokens()
  }, [])

  if (hasTokens === null) {
    return null // Don't show anything while checking
  }

  if (!hasTokens) {
    return null // Don't show the section if no tokens
  }

  return (
    <div className="bg-black rounded-xl border border-gray-800">
      <div className="bg-black backdrop-blur-sm px-4 py-3 rounded-t-xl">
        <h2 className="text-lg font-bold text-white">Trending Tokens</h2>
      </div>
      
      <div className="px-4 pb-4 pt-1">
        <TrendingTokens limit={8} timePeriod="24 hours" />
      </div>
    </div>
  )
}

export default function Home() {
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string; avatar_url?: string } | undefined>(undefined)
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const router = useRouter()
  const { toasts, removeToast, success, error: showError } = useToast()

  const loadPosts = useCallback(async () => {
    if (!currentUser?.id) return
    
    try {
      setIsLoading(true)
      const data = await getPosts(currentUser.id)
      setPosts(data)
    } catch (error) {
      console.error('Error loading posts:', error instanceof Error ? error.message : 'Unknown error')
      // Set empty array on error to prevent UI issues
      setPosts([])
    } finally {
      setIsLoading(false)
    }
  }, [currentUser?.id])

  useEffect(() => {
    // Get current user and their profile
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      // If no user, redirect to signup
      if (!user) {
        setIsCheckingAuth(false)
        router.push('/auth/signup')
        return
      }

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
      
      setIsCheckingAuth(false)
    }
    getUser()
  }, [router])

  // Load posts when currentUser is set
  useEffect(() => {
    if (currentUser?.id) {
      loadPosts()
    }
  }, [currentUser?.id, loadPosts])

  const handleCreatePost = async (data: {
    content?: string
    image?: File
    tokenSymbol?: string
    tokenAddress?: string
    tokenName?: string
  }) => {
    if (!currentUser) return

    try {
      setIsSubmitting(true)
      
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

      // Create post
      const newPost = await createPostDB({
        user_id: currentUser.id,
        content: data.content,
        image_url: publicUrl,
        token_symbol: data.tokenSymbol,
        token_address: data.tokenAddress,
        token_name: data.tokenName,
        dex_screener_url: dexScreenerUrl,
      })

      // Add to posts array
      setPosts(prev => [newPost, ...prev])
    } catch (error) {
      console.error('Error creating post:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`Failed to create post: ${errorMessage}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!currentUser) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No active session')

      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete post')
      }

      // Remove the post from the local state
      setPosts(prev => prev.filter(post => post.id !== postId))
      
      // Show success toast
      success('Post deleted successfully', 'Your post has been removed')
    } catch (error) {
      console.error('Error deleting post:', error)
      showError('Failed to delete post', 'Please try again later')
      throw error // Re-throw so PostCard can handle the error
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setCurrentUser(undefined)
    router.push('/auth/signup')
  }

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render the main content if user is not authenticated (they'll be redirected)
  if (!currentUser) {
    return null
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="flex h-screen max-w-7xl mx-auto">
        {/* Left Column - Navigation */}
        <div className="w-64 px-4 lg:px-8 h-screen overflow-y-auto hidden lg:block">
          <Navigation currentUser={currentUser} onSignOut={handleSignOut} />
        </div>
        
        {/* Center Column - Feed */}
        <div className="flex-1 w-full lg:max-w-2xl lg:border-l lg:border-r border-gray-800 h-screen flex flex-col pb-16 lg:pb-0">
          {/* Header */}
          <div className="bg-black/80 backdrop-blur-sm border-b border-gray-800 px-4 py-3 flex-shrink-0">
            <h1 className="text-xl font-bold text-white">Home</h1>
          </div>
          
          {/* Feed - Scrollable content including CreatePost */}
          <div className="flex-1 overflow-y-auto">
            {/* Create Post - Now scrolls with feed */}
            <div className="bg-black border-b border-gray-800">
              <CreatePost
                currentUser={currentUser}
                onSubmit={handleCreatePost}
                isSubmitting={isSubmitting}
              />
            </div>
            
            <Feed
              posts={posts}
              currentUserId={currentUser?.id}
              isLoading={isLoading}
              onDeletePost={handleDeletePost}
            />
          </div>
        </div>
        
        {/* Right Column - Search & Trending Tokens */}
        <div className="w-96 px-8 h-screen overflow-y-auto hidden xl:block">
          {/* Search Bar */}
          <div className="mt-4 mb-4">
            <SearchBar placeholder="Search posts, users, tokens..." />
          </div>
          
          <TrendingTokensSection />
        </div>
      </div>
      
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
      
      {/* Mobile Navigation */}
      <MobileNavigation currentUser={currentUser} onSignOut={handleSignOut} />
    </div>
  )
}