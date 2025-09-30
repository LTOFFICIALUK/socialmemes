'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Grid3X3, User, LogOut, Settings, Bell, Search, BookOpen, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CreatePost } from '@/components/create-post'
import { getUnreadNotificationCount, createPost as createPostDB } from '@/lib/database'
import { supabase } from '@/lib/supabase'
import { cn, getBestDexScreenerUrl } from '@/lib/utils'

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
  { name: 'Search', href: '/search', icon: Search },
  { name: 'Notifications', href: '/notifications', icon: Bell },
]

export const Navigation = ({ currentUser, onSignOut, onNotificationRead }: NavigationProps) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
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

  const handleCreatePost = async (data: {
    content?: string
    image?: File
    tokenSymbol?: string
    tokenAddress?: string
    tokenName?: string
  }) => {
    if (!currentUser?.id) return

    setIsSubmitting(true)
    try {
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
        dexScreenerUrl = await getBestDexScreenerUrl(data.tokenAddress)
      }

      // Create post
      await createPostDB({
        user_id: currentUser.id,
        content: data.content,
        image_url: publicUrl,
        token_symbol: data.tokenSymbol,
        token_address: data.tokenAddress,
        token_name: data.tokenName,
        dex_screener_url: dexScreenerUrl,
      })
      
      // Close modal after successful post creation
      setIsCreatePostModalOpen(false)
      
      // Optionally refresh the page or trigger a callback to update the feed
      window.location.reload()
    } catch (error) {
      console.error('Error creating post:', error)
      alert('Failed to create post. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <nav className="h-full w-full bg-black flex flex-col">
      {/* Logo */}
      <div className="pt-0 pr-6 pl-7">
        <Link href="/" className="flex items-center">
          <img 
            src="/logo.png" 
            alt="Social Memes" 
            className="h-32 w-auto object-contain"
            style={{ aspectRatio: '1/1' }}
          />
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-4 -mt-4">
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
          {/* Docs Menu Item */}
          <div className="mb-4">
            <Link
              href="/docs"
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                pathname === '/docs'
                  ? "text-white font-bold"
                  : "text-gray-300 hover:bg-white/5 hover:text-white"
              )}
            >
              <BookOpen className="h-5 w-5" />
              <span>Docs</span>
            </Link>
          </div>

          {/* Create Post Button */}
          <div className="mb-4">
            <button
              onClick={() => setIsCreatePostModalOpen(true)}
              className="flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-gray-300 hover:bg-white/5 hover:text-white w-full text-left"
            >
              <Plus className="h-5 w-5" />
              <span>Create Post</span>
            </button>
          </div>
          
          <div className="flex items-center space-x-3">
            <Link href={`/profile/${currentUser.username || 'user'}`}>
              <Avatar className="h-10 w-10 cursor-pointer hover:opacity-80 transition-opacity">
                <AvatarImage src={currentUser.avatar_url || undefined} alt={currentUser.username} />
                <AvatarFallback className="bg-green-500 text-white font-semibold">
                  {currentUser.username ? currentUser.username.charAt(0).toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
            </Link>
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

      {/* Create Post Modal */}
      {isCreatePostModalOpen && currentUser && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setIsCreatePostModalOpen(false)}
        >
          <div 
            className="bg-black border border-gray-800 rounded-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Create Post Component */}
            <div className="p-0">
              <CreatePost
                currentUser={currentUser}
                onSubmit={handleCreatePost}
                isSubmitting={isSubmitting}
                isModal={true}
              />
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
