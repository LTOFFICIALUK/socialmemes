'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Grid3X3, User, LogOut, Settings, Bell, Search, BookOpen, Plus, TrendingUp, Users, Crown, Shield, HelpCircle } from 'lucide-react'
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
    pro?: boolean
  }
  onSignOut?: () => void
  onNotificationRead?: () => void
  onPromoteClick?: () => void
  onProClick?: () => void
}

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Explore', href: '/explore', icon: Grid3X3 },
  { name: 'Search', href: '/search', icon: Search },
  { name: 'Notifications', href: '/notifications', icon: Bell },
  { name: 'Pro', href: '#', icon: Crown, isAction: true },
  { name: 'Referrals', href: '/referrals', icon: Users },
  { name: 'Promote', href: '#', icon: TrendingUp, isAction: true },
  { name: 'Create Post', href: '#', icon: Plus, isAction: true },
]

export const Navigation = ({ currentUser, onSignOut, onPromoteClick, onProClick }: NavigationProps) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false)
  const [isSupportOpen, setIsSupportOpen] = useState(false)
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

  const refreshUnreadCount = useCallback(async () => {
    if (!currentUser?.id) return
    
    try {
      const count = await getUnreadNotificationCount(currentUser.id)
      setUnreadCount(count)
    } catch (error) {
      console.error('Error fetching unread notification count:', error)
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
            const isPromote = item.name === 'Promote'
            const isPro = item.name === 'Pro'
            const isCreatePost = item.name === 'Create Post'
            
            if (isPromote) {
              return (
                <li key={item.name}>
                  <button
                    onClick={onPromoteClick}
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-gray-300 hover:bg-white/5 hover:text-white w-full text-left cursor-pointer"
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </button>
                </li>
              )
            }
            
            if (isCreatePost) {
              return (
                <li key={item.name}>
                  <button
                    onClick={() => setIsCreatePostModalOpen(true)}
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-gray-300 hover:bg-white/5 hover:text-white w-full text-left cursor-pointer"
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </button>
                </li>
              )
            }
            
            if (isPro) {
              return (
                <li key={item.name}>
                  <button
                    onClick={onProClick}
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-gray-300 hover:bg-white/5 hover:text-white w-full text-left cursor-pointer"
                  >
                    <Crown className="h-5 w-5 pro-icon-gold" />
                    <span className="pro-username-gold">{item.name}</span>
                  </button>
                </li>
              )
            }
            
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
          
          {/* Admin Dashboard Link for Pro Users */}
          {currentUser?.pro && (
            <li>
              <Link
                href="/admin"
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors relative",
                  pathname === '/admin'
                    ? "text-white font-bold"
                    : "text-gray-300 hover:bg-white/5 hover:text-white"
                )}
              >
                <Shield className="h-5 w-5" />
                <span>Admin</span>
              </Link>
            </li>
          )}
        </ul>
      </div>

      {/* User Profile Section */}
      {currentUser ? (
        <div className="p-4 relative">
          {/* Docs Menu Item */}
          <div className="mb-2">
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

          {/* Support Menu Item */}
          <div className="mb-2 relative">
            <button
              onClick={() => setIsSupportOpen(!isSupportOpen)}
              className="flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-gray-300 hover:bg-white/5 hover:text-white w-full text-left cursor-pointer"
            >
              <HelpCircle className="h-5 w-5" />
              <span>Support</span>
            </button>

            {/* Support Dropdown */}
            {isSupportOpen && (
              <>
                {/* Backdrop */}
                <div 
                  className="fixed inset-0 z-40"
                  onClick={() => setIsSupportOpen(false)}
                />
                
                {/* Menu */}
                <div className="absolute bottom-0 left-0 bg-black border border-gray-800 rounded-lg shadow-lg py-2 z-50 w-48">
                  {/* X (Twitter) Link */}
                  <a
                    href="https://x.com/socialmemesfun"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white"
                    onClick={() => setIsSupportOpen(false)}
                  >
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    <span>X (Twitter)</span>
                  </a>

                  {/* Telegram Link */}
                  <a
                    href="https://t.me/socialmemesfun"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white"
                    onClick={() => setIsSupportOpen(false)}
                  >
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                    </svg>
                    <span>Telegram</span>
                  </a>

                  {/* Docs Link */}
                  <Link
                    href="/docs"
                    className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white"
                    onClick={() => setIsSupportOpen(false)}
                  >
                    <BookOpen className="h-4 w-4" />
                    <span>Docs</span>
                  </Link>
                </div>
              </>
            )}
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
              <p className={`text-sm font-medium truncate ${
                currentUser.pro ? 'pro-username-gold' : 'text-white'
              }`}>
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
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 z-40"
                onClick={() => setIsProfileOpen(false)}
              />
              
              {/* Menu */}
              <div className="absolute top-4 right-0 bg-black border border-gray-800 rounded-lg shadow-lg py-2 z-50 w-48">
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
            </>
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
