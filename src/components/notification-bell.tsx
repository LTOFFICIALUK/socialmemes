'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell, BellDot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NotificationModal } from './notification-modal'
import { getUnreadNotificationCount } from '@/lib/database'
import { supabase } from '@/lib/supabase'

interface NotificationBellProps {
  userId: string
  onNotificationRead?: () => void
}

export const NotificationBell = ({ userId, onNotificationRead }: NotificationBellProps) => {
  const [unreadCount, setUnreadCount] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const fetchUnreadCount = useCallback(async () => {
    try {
      setIsLoading(true)
      const count = await getUnreadNotificationCount(userId)
      setUnreadCount(count)
    } catch (error) {
      console.error('Error fetching unread notification count:', error)
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (userId) {
      fetchUnreadCount()
    }
  }, [userId, fetchUnreadCount])

  // Listen for real-time notifications
  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchUnreadCount()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, fetchUnreadCount])

  const handleBellClick = () => {
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    // Refresh unread count when modal closes
    fetchUnreadCount()
    // Also call the parent's refresh function
    onNotificationRead?.()
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleBellClick}
        className="relative p-2"
        disabled={isLoading}
      >
        {unreadCount > 0 ? (
          <BellDot className="h-5 w-5 text-blue-600" />
        ) : (
          <Bell className="h-5 w-5" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Button>

      <NotificationModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        userId={userId}
        onNotificationRead={() => {
          fetchUnreadCount()
          onNotificationRead?.()
        }}
      />
    </>
  )
}
