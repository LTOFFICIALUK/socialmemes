'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { MobileNavigation } from '@/components/mobile-navigation'
import { MobileMenuButton } from '@/components/mobile-menu-button'
import { TrendingTokens } from '@/components/trending-tokens'
import { FeaturedTokens } from '@/components/featured-tokens'
import { SearchBar } from '@/components/search-bar'
import { PostDetail } from '@/components/post-detail'
import { PromotionModal } from '@/components/promotion-modal'
import { FeaturedTokenModal } from '@/components/featured-token-modal'
import { MobileTrendingModal } from '@/components/mobile-trending-modal'
import { ToastContainer, useToast } from '@/components/ui/toast'
import { supabase } from '@/lib/supabase'

export default function PostPage() {
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string; avatar_url?: string } | undefined>(undefined)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [showPromotionModal, setShowPromotionModal] = useState(false)
  const [showFeaturedTokenModal, setShowFeaturedTokenModal] = useState(false)
  const [showTrendingModal, setShowTrendingModal] = useState(false)
  const [featuredTokensKey, setFeaturedTokensKey] = useState(0)
  const router = useRouter()
  const params = useParams()
  const postId = params.id as string
  const { toasts, removeToast, success } = useToast()

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

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setCurrentUser(undefined)
    router.push('/auth/signup')
  }

  const handleBackClick = () => {
    router.back()
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
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <div className="flex h-screen max-w-7xl mx-auto min-w-0">
        {/* Left Column - Navigation */}
        <div className="w-64 px-4 lg:px-8 h-screen overflow-y-auto hidden lg:block">
          <Navigation 
            currentUser={currentUser} 
            onSignOut={handleSignOut}
            onPromoteClick={() => setShowFeaturedTokenModal(true)}
          />
        </div>
        
        {/* Center Column - Post Detail */}
        <div className="flex-1 w-full lg:max-w-2xl lg:border-l lg:border-r border-gray-800 h-screen flex flex-col pb-16 lg:pb-0 min-w-0">
          {/* Header */}
          <div className="bg-black/80 backdrop-blur-sm border-b border-gray-800 px-4 py-3 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleBackClick}
                  className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                  aria-label="Go back"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <h1 className="text-xl font-bold">Post</h1>
              </div>
              {/* Mobile Menu Button */}
              <div className="lg:hidden">
                <MobileMenuButton 
                  currentUser={currentUser} 
                  onSignOut={handleSignOut}
                  onPromoteClick={() => setShowFeaturedTokenModal(true)}
                  onTrendingClick={() => setShowTrendingModal(true)}
                />
              </div>
            </div>
          </div>
          
          {/* Post Detail Component - Scrollable */}
          <div className="flex-1 overflow-y-auto">
            <PostDetail
              postId={postId}
              currentUser={currentUser}
              onPromote={() => setShowPromotionModal(true)}
            />
          </div>
        </div>
        
        {/* Right Column - Search & Trending Tokens */}
        <div className="w-96 px-8 h-screen overflow-y-auto hidden xl:block">
          {/* Search Bar */}
          <div className="mt-4 mb-4">
            <SearchBar placeholder="Search posts, users, tokens..." />
          </div>
          
          <div className="bg-black rounded-xl border border-gray-800">
            <div className="bg-black backdrop-blur-sm px-4 py-3 rounded-t-xl">
              <h2 className="text-lg font-bold text-white">Trending Tokens</h2>
            </div>
            
            <div className="px-4 pb-4 pt-1">
              <TrendingTokens limit={5} timePeriod="24 hours" />
            </div>
          </div>
          
          <FeaturedTokens key={featuredTokensKey} limit={6} />
        </div>
      </div>
      
      {/* Promotion Modal */}
      <PromotionModal
        isOpen={showPromotionModal}
        onClose={() => setShowPromotionModal(false)}
        postId={postId}
        onPromote={(postId, duration, price) => {
          console.log('Promoting post:', { postId, duration, price })
          setShowPromotionModal(false)
        }}
      />
      
      {/* Featured Token Modal */}
      <FeaturedTokenModal
        isOpen={showFeaturedTokenModal}
        onClose={() => setShowFeaturedTokenModal(false)}
        onSuccess={() => {
          setFeaturedTokensKey(prev => prev + 1)
          success('Featured token promoted successfully!')
        }}
      />
      
      {/* Mobile Trending Modal */}
      <MobileTrendingModal
        isOpen={showTrendingModal}
        onClose={() => setShowTrendingModal(false)}
      />
      
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
      
      {/* Mobile Navigation */}
      <MobileNavigation 
        currentUser={currentUser} 
        onSignOut={handleSignOut}
        onPromoteClick={() => setShowFeaturedTokenModal(true)}
      />
    </div>
  )
}
