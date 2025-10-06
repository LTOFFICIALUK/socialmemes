'use client'

import { Heart, MessageCircle, UserPlus, DollarSign } from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Notification } from '@/lib/database'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead?: (notificationId: string) => void
  onDelete?: (notificationId: string) => void
  onClaimPayout?: (notificationId: string, payoutAmount: number) => void
  showActions?: boolean
}

export const NotificationItem = ({ 
  notification, 
  onMarkAsRead,
  onClaimPayout
}: NotificationItemProps) => {
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
      case 'payout_available':
        return <DollarSign className="h-4 w-4 text-green-500" />
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
      case 'payout_available':
        // Handle payout notifications with metadata
        if (notification.metadata) {
          const payoutAmount = notification.metadata.payout_amount_sol || 0
          const notificationType = notification.metadata.notification_type
          
          if (notificationType === 'referral_bonus') {
            return `Bonus earned! You earned ${payoutAmount.toFixed(4)} SOL referral bonus.`
          } else if (notificationType === 'payout_earned') {
            return `Payout available! You earned ${payoutAmount.toFixed(4)} SOL.`
          }
        }
        // Fallback for payout notifications without proper metadata
        return 'Payout available!'
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
    if (notification.type === 'payout_available') {
      // Payout notifications stay on the notifications page for now
      // In the future, this could link to a payout details page
      return '#'
    }
    if (notification.post_id) {
      return `/posts/${notification.post_id}`
    }
    return '#'
  }

  const handleClaimPayout = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (notification.metadata?.payout_amount_sol && onClaimPayout) {
      const payoutAmount = notification.metadata.payout_amount_sol
      onClaimPayout(notification.id, payoutAmount)
    }
  }

  const isPayoutNotification = notification.type === 'payout_available'
  const payoutAmount = notification.metadata?.payout_amount_sol || 0

  const notificationContent = (
    <div
      className={`p-4 border-b border-gray-800 hover:bg-gray-900/50 transition-colors ${
        isPayoutNotification ? '' : 'cursor-pointer'
      } ${!notification.is_read ? 'bg-gray-900/30' : ''}`}
      onClick={() => !isPayoutNotification && !notification.is_read && onMarkAsRead?.(notification.id)}
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
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              {getNotificationIcon(notification.type)}
              <span className="text-sm font-medium text-white">
                {getNotificationText(notification)}
              </span>
            </div>
            {isPayoutNotification && (
              <Button
                size="sm"
                variant="outline"
                className="border-green-500 text-green-400 hover:bg-green-500/10 text-xs px-3 py-1"
                onClick={handleClaimPayout}
              >
                Claim
              </Button>
            )}
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
  )

  if (isPayoutNotification) {
    return notificationContent
  }

  return (
    <Link href={getNotificationLink(notification)}>
      {notificationContent}
    </Link>
  )
}
