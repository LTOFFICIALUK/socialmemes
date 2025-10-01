'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { MobileNavigation } from '@/components/mobile-navigation'
import { MobileMenuButton } from '@/components/mobile-menu-button'
import { TrendingTokensSectionWithData } from '@/components/trending-tokens-section-with-data'
import { FeaturedTokens } from '@/components/featured-tokens'
import { SearchBar } from '@/components/search-bar'
import { ReplyDetail } from '@/components/reply-detail'
import { PromotionModal } from '@/components/promotion-modal'
import { MobileTrendingModal } from '@/components/mobile-trending-modal'
import { ToastContainer, useToast } from '@/components/ui/toast'
import { supabase } from '@/lib/supabase'
import { TrendingToken } from '@/lib/database'

interface ReplyClientProps {
  trendingTokens: TrendingToken[]
  tokenImages: Record<string, string>
}

export function ReplyClient({ trendingTokens, tokenImages }: ReplyClientProps) {
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string; avatar_url?: string } | undefined>(undefined)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [showPromotionModal, setShowPromotionModal] = useState(false)
  const [showTrendingModal, setShowTrendingModal] = useState(false)
  const router = useRouter()
  const params = useParams()
  const postId = params.id as string
  const replyId = params.replyId as string
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

  const handlePromotePost = (postId: string) => {
    setShowPromotionModal(true)
  }

  const handlePromoteConfirm = async (postId: string, duration: number, price: number) => {
    // TODO: Implement actual promotion logic with Phantom wallet
    console.log('Promoting post:', { postId, duration, price })
    success(`Post promoted for ${duration} hours at ${price} SOL!`)
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
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <div className="flex h-screen max-w-7xl mx-auto min-w-0">
        {/* Left Column - Navigation */}
        <div className="w-64 px-4 lg:px-8 h-screen overflow-y-auto hidden lg:block">
          <Navigation 
            currentUser={currentUser} 
            onSignOut={handleSignOut}
            onPromoteClick={() => {}}
          />
        </div>
        
        {/* Center Column - Reply Detail */}
        <div className="flex-1 w-full lg:max-w-2xl lg:border-l lg:border-r border-gray-800 h-screen flex flex-col pb-16 lg:pb-0 min-w-0">
          {/* Header */}
          <div className="bg-black/80 backdrop-blur-sm border-b border-gray-800 px-4 py-3 flex-shrink-0 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.back()}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-xl font-bold text-white">Reply</h1>
            </div>
            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <MobileMenuButton 
                currentUser={currentUser} 
                onSignOut={handleSignOut}
                onPromoteClick={() => {}}
                onTrendingClick={() => setShowTrendingModal(true)}
              />
            </div>
          </div>
          
          {/* Reply Detail - Scrollable content */}
          <div className="flex-1 overflow-y-auto min-w-0">
            <ReplyDetail
              postId={postId}
              replyId={replyId}
              currentUser={currentUser}
              onPromote={handlePromotePost}
            />
          </div>
        </div>
        
        {/* Right Column - Search & Trending Tokens */}
        <div className="w-96 px-8 h-screen overflow-y-auto hidden xl:block">
          {/* Search Bar */}
          <div className="mt-4 mb-4">
            <SearchBar placeholder="Search posts, users, tokens..." />
          </div>
          
          <TrendingTokensSectionWithData 
            trendingTokens={trendingTokens}
            tokenImages={tokenImages}
          />
          
          <FeaturedTokens limit={6} />
        </div>
      </div>
      
      {/* Promotion Modal */}
      <PromotionModal
        isOpen={showPromotionModal}
        onClose={() => setShowPromotionModal(false)}
        postId={postId}
        onPromote={handlePromoteConfirm}
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
        onPromoteClick={() => {}}
      />
    </div>
  )
}
