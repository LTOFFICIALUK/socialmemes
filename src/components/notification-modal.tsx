'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Heart, MessageCircle, UserPlus, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/database'
import { Notification } from '@/lib/database'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { PayoutNotification } from './payout-notification'
import { PhantomPayoutClaim } from './phantom-payout-claim'

interface NotificationModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  onNotificationRead: () => void
}

export const NotificationModal = ({ isOpen, onClose, userId, onNotificationRead }: NotificationModalProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false)
  const [showPayoutClaim, setShowPayoutClaim] = useState(false)
  const [selectedPayoutData, setSelectedPayoutData] = useState<{ amount: number; period: string } | null>(null)

  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await getNotifications(userId, 50)
      setNotifications(data)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (isOpen && userId) {
      fetchNotifications()
    }
  }, [isOpen, userId, fetchNotifications])

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(userId, notificationId)
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true }
            : notification
        )
      )
      onNotificationRead()
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }


  const handleMarkAllAsRead = async () => {
    try {
      setIsMarkingAllRead(true)
      await markAllNotificationsAsRead(userId)
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, is_read: true }))
      )
      onNotificationRead()
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    } finally {
      setIsMarkingAllRead(false)
    }
  }

  const handlePayoutClaim = async (notificationId: string, payoutData: { amount: number; period: string }) => {
    try {
      setSelectedPayoutData(payoutData)
      setShowPayoutClaim(true)
      // Mark notification as read when user starts claiming
      await handleMarkAsRead(notificationId)
    } catch (error) {
      console.error('Error handling payout claim:', error)
    }
  }

  const handlePayoutSuccess = (transactionHash: string) => {
    console.log('Payout successful:', transactionHash)
    setShowPayoutClaim(false)
    setSelectedPayoutData(null)
    // Refresh notifications to show updated status
    fetchNotifications()
  }

  const handlePayoutError = (error: string) => {
    console.error('Payout error:', error)
    // You could show a toast notification here
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'follow':
        return <UserPlus className="h-4 w-4 text-blue-500" />
      case 'like':
        return <Heart className="h-4 w-4 text-red-500" />
      case 'comment':
        return <MessageCircle className="h-4 w-4 text-green-500" />
      case 'alpha_chat_subscription':
        return <MessageCircle className="h-4 w-4 text-purple-500" />
      default:
        return null
    }
  }

  const getNotificationText = (notification: Notification) => {
    const actorName = notification.actor.username
    switch (notification.type) {
      case 'follow':
        return `${actorName} started following you`
      case 'like':
        return `${actorName} liked your post`
      case 'comment':
        return `${actorName} commented on your post`
      case 'alpha_chat_subscription':
        // Check if this is a payment received notification
        if (notification.metadata?.payment_received) {
          const amount = notification.metadata.amount_sol || 0
          const duration = notification.metadata.duration || '1 month'
          return `${actorName} subscribed to your alpha chat (${amount} SOL for ${duration})`
        } else {
          // Payment sent notification
          const recipientUsername = notification.metadata?.recipient_username || 'alpha chat'
          const duration = notification.metadata?.duration || '1 month'
          return `You subscribed to @${recipientUsername}'s alpha chat for ${duration}`
        }
      default:
        return 'New notification'
    }
  }

  const getNotificationLink = (notification: Notification) => {
    if (notification.type === 'follow') {
      return `/profile/${notification.actor.username}`
    }
    if (notification.type === 'alpha_chat_subscription') {
      // Link to the alpha chat owner's profile
      if (notification.metadata?.payment_received) {
        // If you received a subscription, link to the subscriber's profile
        return `/profile/${notification.actor.username}`
      } else {
        // If you subscribed, link to the recipient's profile
        return `/profile/${notification.metadata?.recipient_username || notification.actor.username}`
      }
    }
    if (notification.post_id) {
      return `/posts/${notification.post_id}`
    }
    return '#'
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-end p-4 pb-20 lg:pb-4 z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-xl w-full max-w-md max-h-[calc(100vh-8rem)] lg:max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Notifications</h2>
          <div className="flex items-center gap-2">
            {notifications.some(n => !n.is_read) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                disabled={isMarkingAllRead}
                className="text-sm text-gray-400 hover:text-white"
              >
                <Check className="h-4 w-4 mr-1" />
                Mark all read
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-white">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-400">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-400">
              No notifications yet
            </div>
          ) : (
            <div>
              {notifications.map((notification) => {
                // Handle payout notifications specially
                if (notification.type === 'payout_available') {
                  return (
                    <div key={notification.id} className="border-b border-gray-700">
                      <PayoutNotification
                        notification={notification as any}
                        onClaim={(notificationId, payoutData) => handlePayoutClaim(notificationId, payoutData)}
                      />
                    </div>
                  )
                }

                // Regular notifications
                return (
                  <Link key={notification.id} href={getNotificationLink(notification)}>
                    <div
                      className={`p-4 border-b border-gray-700 hover:bg-gray-800/50 transition-colors cursor-pointer ${
                        !notification.is_read ? 'bg-gray-800/30' : ''
                      }`}
                      onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage 
                            src={notification.actor.avatar_url || undefined} 
                            alt={notification.actor.username} 
                          />
                          <AvatarFallback className="bg-green-500 text-white font-semibold">
                            {notification.actor.username ? notification.actor.username.charAt(0).toUpperCase() : 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {getNotificationIcon(notification.type)}
                            <span className="text-sm font-medium text-white">
                              {getNotificationText(notification)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mb-2">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </p>
                          {notification.post && (
                            <div className="text-sm text-gray-300 truncate">
                              &quot;{notification.post.content?.substring(0, 100)}
                              {notification.post.content && notification.post.content.length > 100 ? '...' : ''}&quot;
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Phantom Payout Claim Modal */}
      {showPayoutClaim && selectedPayoutData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60">
          <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Claim Your Payout</h3>
              <PhantomPayoutClaim
                payoutData={selectedPayoutData}
                onSuccess={handlePayoutSuccess}
                onError={handlePayoutError}
              />
              <div className="mt-4 flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPayoutClaim(false)
                    setSelectedPayoutData(null)
                  }}
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
