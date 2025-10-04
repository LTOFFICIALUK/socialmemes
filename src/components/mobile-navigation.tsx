'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Grid3X3, Bell, Search } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getUnreadNotificationCount } from '@/lib/database'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

interface MobileNavigationProps {
  currentUser?: {
    id: string
    username: string
    avatar_url?: string
  }
  onSignOut?: () => void
  onPromoteClick?: () => void
}

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Explore', href: '/explore', icon: Grid3X3 },
  { name: 'Search', href: '/search', icon: Search },
  { name: 'Notifications', href: '/notifications', icon: Bell },
]

export const MobileNavigation = ({ currentUser }: MobileNavigationProps) => {
  const [unreadCount, setUnreadCount] = useState(0)
  const pathname = usePathname()

  // Fetch unread notification count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!currentUser?.id) return
      
      try {
        const count = await getUnreadNotificationCount(currentUser.id)
        setUnreadCount(count)
      } catch (error) {
        console.error('Error fetching unread notification count:', error)
      }
    }

    fetchUnreadCount()
  }, [currentUser?.id])

  // Listen for real-time notifications
  useEffect(() => {
    if (!currentUser?.id) return

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
          // Refresh unread count when new notification arrives
          const fetchUnreadCount = async () => {
            try {
              const count = await getUnreadNotificationCount(currentUser.id)
              setUnreadCount(count)
            } catch (error) {
              console.error('Error fetching unread notification count:', error)
            }
          }
          fetchUnreadCount()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUser?.id])

  // Listen for notification read events
  useEffect(() => {
    const handleNotificationRead = () => {
      refreshUnreadCount()
    }

    window.addEventListener('notificationRead', handleNotificationRead)
    return () => window.removeEventListener('notificationRead', handleNotificationRead)
  }, [refreshUnreadCount])

  const refreshUnreadCount = useCallback(async () => {
    if (!currentUser?.id) return
    
    try {
      const count = await getUnreadNotificationCount(currentUser.id)
      setUnreadCount(count)
    } catch (error) {
      console.error('Error fetching unread notification count:', error)
    }
  }, [currentUser?.id])

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 z-50">
      <div className="flex items-center justify-around py-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          const isNotifications = item.name === 'Notifications'
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center p-2 rounded-lg transition-colors relative min-w-0 flex-1",
                isActive
                  ? "text-white"
                  : "text-gray-400 hover:text-white"
              )}
            >
              <div className="relative">
                <item.icon className="h-6 w-6" />
                {isNotifications && unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center leading-none font-medium text-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span className="text-xs mt-1 truncate">{item.name}</span>
            </Link>
          )
        })}
        
        {/* Profile Link */}
        {currentUser && (
          <Link
            href={`/profile/${currentUser.username || 'user'}`}
            className={cn(
              "flex flex-col items-center justify-center p-2 rounded-lg transition-colors min-w-0 flex-1",
              pathname.startsWith('/profile/')
                ? "text-white"
                : "text-gray-400 hover:text-white"
            )}
          >
            <Avatar className="h-6 w-6">
              <AvatarImage src={currentUser.avatar_url || undefined} alt={currentUser.username} />
              <AvatarFallback className="bg-green-500 text-white font-semibold text-xs">
                {currentUser.username ? currentUser.username.charAt(0).toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs mt-1 truncate">Profile</span>
          </Link>
        )}
      </div>
    </nav>
  )
}
