'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Grid3X3, User, LogOut, Settings, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getUnreadNotificationCount } from '@/lib/database'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

interface NavigationProps {
  currentUser?: {
    id: string
    username: string
    avatar_url?: string
  }
  onSignOut?: () => void
  onNotificationRead?: () => void
}

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Explore', href: '/explore', icon: Grid3X3 },
  { name: 'Notifications', href: '/notifications', icon: Bell },
]

export const Navigation = ({ currentUser, onSignOut, onNotificationRead }: NavigationProps) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
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
  }, [])

  const refreshUnreadCount = async () => {
    if (!currentUser?.id) return
    
    try {
      const count = await getUnreadNotificationCount(currentUser.id)
      setUnreadCount(count)
    } catch (error) {
      console.error('Error fetching unread notification count:', error)
    }
  }

  return (
    <nav className="h-full w-full bg-black flex flex-col">
      {/* Logo */}
      <div className="p-6">
        <Link href="/" className="text-2xl font-bold text-green-500">
          $MEMES
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-4 pt-2">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            const isNotifications = item.name === 'Notifications'
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors relative",
                    isActive
                      ? "text-white font-bold"
                      : "text-gray-300 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="relative">
                    {item.name}
                    {isNotifications && unreadCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center leading-none font-medium text-center">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>

      {/* User Profile Section */}
      {currentUser ? (
        <div className="p-4 relative">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={currentUser.avatar_url || undefined} alt={currentUser.username} />
              <AvatarFallback className="bg-green-500 text-white font-semibold">
                {currentUser.username ? currentUser.username.charAt(0).toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {currentUser.username || 'User'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="h-8 w-8"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>

          {/* Profile Dropdown */}
          {isProfileOpen && (
            <div className="absolute bottom-full left-4 right-4 mb-2 bg-black border border-gray-800 rounded-lg shadow-lg py-2">
              <Link
                href={`/profile/${currentUser.username || 'user'}`}
                className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white"
                onClick={() => setIsProfileOpen(false)}
              >
                <User className="h-4 w-4" />
                <span>Profile</span>
              </Link>
              <button
                onClick={() => {
                  onSignOut?.()
                  setIsProfileOpen(false)
                }}
                className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white w-full text-left"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 border-t border-gray-800 space-y-2">
          <Link href="/auth/signin">
            <Button className="w-full">Sign In</Button>
          </Link>
          <Link href="/auth/signup">
            <Button variant="outline" className="w-full">Sign Up</Button>
          </Link>
        </div>
      )}
    </nav>
  )
}
