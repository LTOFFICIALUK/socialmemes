'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { MobileNavigation } from '@/components/mobile-navigation'
import { MobileMenuButton } from '@/components/mobile-menu-button'
import { TrendingTokens } from '@/components/trending-tokens'
import { SearchBar } from '@/components/search-bar'
import { ReplyDetail } from '@/components/reply-detail'
import { PromotionModal } from '@/components/promotion-modal'
import { ToastContainer, useToast } from '@/components/ui/toast'
import { supabase } from '@/lib/supabase'

export default function ReplyPage() {
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string; avatar_url?: string } | undefined>(undefined)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [showPromotionModal, setShowPromotionModal] = useState(false)
  const router = useRouter()
  const params = useParams()
  const postId = params.id as string
  const replyId = params.replyId as string
  const { toasts, removeToast } = useToast()

  useEffect(() => {
    // Get current user and their profile
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()
          
          if (profile) {
            setCurrentUser({
              id: profile.id,
              username: profile.username,
              avatar_url: profile.avatar_url
            })
          }
        }
      } catch (error) {
        console.error('Error getting user:', error)
      } finally {
        setIsCheckingAuth(false)
      }
    }

    getUser()
  }, [])

  const handleBackClick = () => {
    router.back()
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/auth/signin')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    )
  }

  if (!currentUser) {
    router.push('/auth/signin')
    return null
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <ToastContainer toasts={toasts} onClose={removeToast} />
      
      {/* Promotion Modal */}
      {showPromotionModal && (
        <PromotionModal
          isOpen={showPromotionModal}
          postId={postId}
          onClose={() => setShowPromotionModal(false)}
          onPromote={() => {
            setShowPromotionModal(false)
          }}
        />
      )}

      <div className="flex">
        {/* Left Column - Navigation */}
        <div className="hidden lg:block w-64 h-screen sticky top-0">
          <Navigation currentUser={currentUser} onSignOut={handleSignOut} />
        </div>
        
        {/* Mobile Navigation */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
          <MobileNavigation currentUser={currentUser} onSignOut={handleSignOut} />
        </div>

        {/* Center Column - Reply Detail */}
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
                <h1 className="text-xl font-bold">Reply</h1>
              </div>
              {/* Mobile Menu Button */}
              <div className="lg:hidden">
                <MobileMenuButton currentUser={currentUser} onSignOut={handleSignOut} />
              </div>
            </div>
          </div>
          
          {/* Reply Detail Component - Scrollable */}
          <div className="flex-1 overflow-y-auto">
            <ReplyDetail
              postId={postId}
              replyId={replyId}
              currentUser={currentUser}
              onPromote={() => setShowPromotionModal(true)}
            />
          </div>
        </div>
        
        {/* Right Column - Search & Trending Tokens */}
        <div className="w-96 px-8 h-screen overflow-y-auto hidden xl:block">
          <div className="sticky top-4 space-y-6">
            <SearchBar />
            <TrendingTokens />
          </div>
        </div>
      </div>
    </div>
  )
}
