'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { MobileNavigation } from '@/components/mobile-navigation'
import { MobileMenuButton } from '@/components/mobile-menu-button'
import { SearchBar } from '@/components/search-bar'
import { TrendingTokensSectionWithData } from '@/components/trending-tokens-section-with-data'
import { FeaturedTokens } from '@/components/featured-tokens'
import { NotificationItem } from '@/components/notification-item'
import { MobileTrendingModal } from '@/components/mobile-trending-modal'
import { Button } from '@/components/ui/button'
import { ToastContainer, useToast } from '@/components/ui/toast'
import { getNotifications, markNotificationAsRead, deleteNotification, markAllNotificationsAsRead } from '@/lib/database'
import { Notification, TrendingToken } from '@/lib/database'
import { supabase } from '@/lib/supabase'

interface NotificationsClientProps {
  trendingTokens: TrendingToken[]
  tokenImages: Record<string, string>
}

export function NotificationsClient({ trendingTokens, tokenImages }: NotificationsClientProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string; avatar_url?: string } | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [showTrendingModal, setShowTrendingModal] = useState(false)
  const router = useRouter()
  const { toasts, removeToast, success, error: showError } = useToast()

  const loadNotifications = async () => {
    if (!currentUser?.id) return
    
    try {
      setIsLoading(true)
      const data = await getNotifications(currentUser.id)
      setNotifications(data)
    } catch (error) {
      console.error('Error loading notifications:', error instanceof Error ? error.message : 'Unknown error')
      setNotifications([])
    } finally {
      setIsLoading(false)
    }
  }

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

  // Load notifications when currentUser is set
  useEffect(() => {
    if (currentUser?.id) {
      loadNotifications()
    }
  }, [currentUser?.id])

  const handleMarkAsRead = async (notificationId: string) => {
    if (!currentUser?.id) return
    
    try {
      await markNotificationAsRead(currentUser.id, notificationId)
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true }
            : notification
        )
      )
    } catch (error) {
      console.error('Error marking notification as read:', error)
      showError('Failed to mark notification as read', 'Please try again later')
    }
  }

  const handleDeleteNotification = async (notificationId: string) => {
    if (!currentUser?.id) return
    
    try {
      await deleteNotification(currentUser.id, notificationId)
      setNotifications(prev => prev.filter(notification => notification.id !== notificationId))
      success('Notification deleted')
    } catch (error) {
      console.error('Error deleting notification:', error)
      showError('Failed to delete notification', 'Please try again later')
    }
  }

  const handleMarkAllAsRead = async () => {
    if (!currentUser?.id) return
    
    try {
      await markAllNotificationsAsRead(currentUser.id)
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, is_read: true }))
      )
      success('All notifications marked as read')
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      showError('Failed to mark all notifications as read', 'Please try again later')
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

  const unreadCount = notifications.filter(n => !n.is_read).length

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
        
        {/* Center Column - Notifications */}
        <div className="flex-1 w-full lg:max-w-2xl lg:border-l lg:border-r border-gray-800 h-screen flex flex-col pb-16 lg:pb-0 min-w-0">
          {/* Header */}
          <div className="bg-black/80 backdrop-blur-sm border-b border-gray-800 px-4 py-3 flex-shrink-0 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-bold text-white">Notifications</h1>
              {unreadCount > 0 && (
                <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <Button
                  onClick={handleMarkAllAsRead}
                  variant="outline"
                  size="sm"
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  Mark all as read
                </Button>
              )}
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
          </div>
          
          {/* Notifications - Scrollable content */}
          <div className="flex-1 overflow-y-auto min-w-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <p className="text-gray-400">No notifications yet</p>
              </div>
            ) : (
              <div className="space-y-1">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                    onDelete={handleDeleteNotification}
                  />
                ))}
              </div>
            )}
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
