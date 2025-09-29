'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { ImageGrid } from '@/components/image-grid'
import { TrendingTokens } from '@/components/trending-tokens'
import { SearchBar } from '@/components/search-bar'
import { supabase } from '@/lib/supabase'

export default function Explore() {
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string; avatar_url?: string } | undefined>(undefined)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const router = useRouter()

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
    <div className="min-h-screen bg-black text-white">
      <div className="flex min-h-screen max-w-7xl mx-auto">
        {/* Left Column - Navigation */}
        <div className="w-64 px-8 h-screen">
          <Navigation currentUser={currentUser} onSignOut={handleSignOut} />
        </div>
        
        {/* Center Column - Image Grid */}
        <div className="flex-1 max-w-4xl border-l border-r border-gray-800">
          {/* Header */}
          <div className="sticky top-0 bg-black border-b border-gray-800 px-4 py-3 z-50">
            <h1 className="text-xl font-bold text-white">Explore</h1>
            <p className="text-sm text-gray-400">Discover memes from the community</p>
          </div>
          
          {/* Image Grid */}
          <ImageGrid currentUserId={currentUser.id} />
        </div>
        
        {/* Right Column - Search & Trending Tokens */}
        <div className="w-96 px-8">
          {/* Search Bar */}
          <div className="mt-4 mb-4">
            <SearchBar placeholder="Search posts, users, tokens..." />
          </div>
          
          <div className="bg-black rounded-xl border border-gray-800">
            <div className="sticky top-0 bg-black backdrop-blur-sm px-4 py-3 rounded-t-xl">
              <h2 className="text-lg font-bold text-white">Trending Tokens</h2>
            </div>
            
            <div className="px-4 pb-4 pt-1">
              <TrendingTokens limit={8} timePeriod="24 hours" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
