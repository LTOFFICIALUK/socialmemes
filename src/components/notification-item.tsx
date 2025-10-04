'use client'

import { Heart, MessageCircle, UserPlus } from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Notification } from '@/lib/database'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead?: (notificationId: string) => void
  onDelete?: (notificationId: string) => void
  showActions?: boolean
}

export const NotificationItem = ({ 
  notification, 
  onMarkAsRead, 
  showActions = true 
}: NotificationItemProps) => {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'follow':
        return <UserPlus className="h-4 w-4 text-blue-500" />
      case 'like':
        return <Heart className="h-4 w-4 text-red-500" />
      case 'comment':
        return <MessageCircle className="h-4 w-4 text-green-500" />
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
      default:
        return 'New notification'
    }
  }

  const getNotificationLink = (notification: Notification) => {
    if (notification.type === 'follow') {
      return `/profile/${notification.actor.username}`
    }
    if (notification.post_id) {
      return `/posts/${notification.post_id}`
    }
    return '#'
  }

  return (
    <Link href={getNotificationLink(notification)}>
      <div
        className={`p-4 border-b border-gray-800 hover:bg-gray-900/50 transition-colors cursor-pointer ${
          !notification.is_read ? 'bg-gray-900/30' : ''
        }`}
        onClick={() => !notification.is_read && onMarkAsRead?.(notification.id)}
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
}
