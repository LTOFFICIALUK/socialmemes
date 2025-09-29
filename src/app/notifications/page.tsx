'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Navigation } from '@/components/navigation'
import { SearchBar } from '@/components/search-bar'
import { TrendingTokens } from '@/components/trending-tokens'
import { NotificationItem } from '@/components/notification-item'
import { getNotifications, markNotificationAsRead, deleteNotification, markAllNotificationsAsRead } from '@/lib/database'
import { Notification } from '@/lib/database'
import { supabase } from '@/lib/supabase'

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string; avatar_url?: string } | undefined>(undefined)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
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
          setCurrentUser({
            id: user.id,
            username: user.user_metadata?.username || `user_${user.id.slice(0, 8)}`,
            avatar_url: user.user_metadata?.avatar_url
          })
        } else {
          setCurrentUser({
            id: profile.id,
            username: profile.username,
            avatar_url: profile.avatar_url
          })
        }
      } catch (err) {
        console.error('Error fetching profile:', err)
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

  const fetchNotifications = async () => {
    if (!currentUser) return
    
    try {
      setIsLoading(true)
      const data = await getNotifications(currentUser.id, 100)
      setNotifications(data)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (currentUser) {
      fetchNotifications()
    }
  }, [currentUser])

  // Listen for real-time notifications
  useEffect(() => {
    if (!currentUser) return

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUser.id}`,
        },
        () => {
          fetchNotifications()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUser])

  const handleMarkAsRead = async (notificationId: string) => {
    if (!currentUser) return
    
    try {
      await markNotificationAsRead(currentUser.id, notificationId)
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true }
            : notification
        )
      )
      // Refresh unread count in navigation
      window.dispatchEvent(new CustomEvent('notificationRead'))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const handleDeleteNotification = async (notificationId: string) => {
    if (!currentUser) return
    
    try {
      await deleteNotification(currentUser.id, notificationId)
      setNotifications(prev => prev.filter(n => n.id !== notificationId))
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    if (!currentUser) return
    
    try {
      setIsMarkingAllRead(true)
      await markAllNotificationsAsRead(currentUser.id)
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, is_read: true }))
      )
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    } finally {
      setIsMarkingAllRead(false)
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

  // Don't render the main content if user is not authenticated
  if (!currentUser) {
    return null
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="flex h-screen max-w-7xl mx-auto">
        {/* Left Column - Navigation */}
        <div className="w-64 px-8 h-screen overflow-y-auto">
          <Navigation currentUser={currentUser} onSignOut={handleSignOut} />
        </div>
        
        {/* Center Column - Notifications */}
        <div className="flex-1 max-w-2xl border-l border-r border-gray-800 h-screen flex flex-col">
          {/* Header */}
          <div className="bg-black/80 backdrop-blur-sm border-b border-gray-800 px-4 py-3 flex-shrink-0">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-white">Notifications</h1>
              {notifications.some(n => !n.is_read) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  disabled={isMarkingAllRead}
                  className="flex items-center gap-2 text-gray-400 hover:text-white"
                >
                  <Check className="h-4 w-4" />
                  Mark all read
                </Button>
              )}
            </div>
          </div>
          
          {/* Notifications Content - Scrollable */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-6 text-center text-gray-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <div className="flex justify-center mb-4">
                  <Bell className="h-16 w-16 text-gray-500" />
                </div>
                <h3 className="text-xl font-medium mb-2 text-white">No notifications yet</h3>
                <p className="text-sm">When people interact with your posts, you&apos;ll see notifications here.</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onDelete={handleDeleteNotification}
                />
              ))
            )}
          </div>
        </div>
        
        {/* Right Column - Search & Trending Tokens */}
        <div className="w-96 px-8 h-screen overflow-y-auto">
          {/* Search Bar */}
          <div className="mt-4 mb-4">
            <SearchBar placeholder="Search posts, users, tokens..." />
          </div>
          
          <div className="bg-black rounded-xl border border-gray-800">
            <div className="bg-black backdrop-blur-sm px-4 py-3 rounded-t-xl">
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
