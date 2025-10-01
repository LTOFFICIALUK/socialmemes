'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { MobileNavigation } from '@/components/mobile-navigation'
import { MobileMenuButton } from '@/components/mobile-menu-button'
import { ImageGrid } from '@/components/image-grid'
import { TrendingTokens } from '@/components/trending-tokens'
import { FeaturedTokens } from '@/components/featured-tokens'
import { SearchBar } from '@/components/search-bar'
import { FeaturedTokenModal } from '@/components/featured-token-modal'
import { ToastContainer, useToast } from '@/components/ui/toast'
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
      <div className="sticky top-0 bg-black backdrop-blur-sm px-4 py-3 rounded-t-xl">
        <h2 className="text-lg font-bold text-white">Trending Tokens</h2>
      </div>
      
      <div className="px-4 pb-4 pt-1">
        <TrendingTokens limit={5} timePeriod="24 hours" />
      </div>
    </div>
  )
}

export default function Explore() {
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string; avatar_url?: string } | undefined>(undefined)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [showFeaturedTokenModal, setShowFeaturedTokenModal] = useState(false)
  const [featuredTokensKey, setFeaturedTokensKey] = useState(0)
  const router = useRouter()
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
      <div className="flex min-h-screen max-w-7xl mx-auto min-w-0">
        {/* Left Column - Navigation */}
        <div className="w-64 px-4 lg:px-8 h-screen hidden lg:block">
          <Navigation 
            currentUser={currentUser} 
            onSignOut={handleSignOut}
            onPromoteClick={() => setShowFeaturedTokenModal(true)}
          />
        </div>
        
        {/* Center Column - Image Grid */}
        <div className="flex-1 w-full lg:max-w-4xl lg:border-l lg:border-r border-gray-800 pb-16 lg:pb-0 min-w-0">
          {/* Header */}
          <div className="sticky top-0 bg-black border-b border-gray-800 px-4 py-3 z-50">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-white">Explore</h1>
                <p className="text-sm text-gray-400">Discover memes from the community</p>
              </div>
              {/* Mobile Menu Button */}
              <div className="lg:hidden">
                <MobileMenuButton currentUser={currentUser} onSignOut={handleSignOut} />
              </div>
            </div>
          </div>
          
          {/* Image Grid */}
          <ImageGrid currentUserId={currentUser.id} />
        </div>
        
        {/* Right Column - Search & Trending Tokens */}
        <div className="w-96 px-8 hidden xl:block">
          {/* Search Bar */}
          <div className="mt-4 mb-4">
            <SearchBar placeholder="Search posts, users, tokens..." />
          </div>
          
          <TrendingTokensSection />
          
          <FeaturedTokens key={featuredTokensKey} limit={6} />
        </div>
      </div>
      
      {/* Featured Token Modal */}
      <FeaturedTokenModal
        isOpen={showFeaturedTokenModal}
        onClose={() => setShowFeaturedTokenModal(false)}
        onSuccess={() => {
          setFeaturedTokensKey(prev => prev + 1)
          success('Featured token promoted successfully!')
        }}
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
