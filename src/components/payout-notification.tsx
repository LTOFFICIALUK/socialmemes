'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  DollarSign, 
  TrendingUp, 
  MessageSquare, 
  Heart, 
  UserPlus, 
  ExternalLink,
  Clock
} from 'lucide-react'

interface PayoutNotificationProps {
  notification: {
    id: string
    type: string
    metadata?: {
      period_start?: string
      period_end?: string
      payout_amount_sol?: number
      interaction_breakdown?: {
        posts: number
        comments: number
        likes: number
        follows: number
      }
      notification_type?: 'payout_earned' | 'referral_bonus'
      claim_action?: string
      title?: string
      message?: string
      action_text?: string
    } | null
    created_at: string
  }
  onClaim: (notificationId: string, payoutData: { amount: number; period: string }) => void
}

export function PayoutNotification({ notification, onClaim }: PayoutNotificationProps) {
  const [isClaiming, setIsClaiming] = useState(false)
  const { metadata } = notification

  // Early return if no metadata
  if (!metadata) {
    return null
  }

  const formatSOL = (amount: number) => {
    return amount.toFixed(4) + ' SOL'
  }

  const formatPeriodName = (start: string, end: string) => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    const month = startDate.toLocaleString('default', { month: 'long' })
    const year = startDate.getFullYear()
    const startDay = startDate.getDate()
    const endDay = endDate.getDate()
    
    return `${month} ${year} - Period ${startDay <= 14 ? '1' : '2'}`
  }

  const handleClaim = async () => {
    setIsClaiming(true)
    try {
      const payoutData = {
        amount: metadata.payout_amount_sol || 0,
        period: `${metadata.period_start || ''} to ${metadata.period_end || ''}`
      }
      
      await onClaim(notification.id, payoutData)
    } catch (error) {
      console.error('Error claiming payout:', error)
    } finally {
      setIsClaiming(false)
    }
  }

  const isReferralBonus = metadata.notification_type === 'referral_bonus'

  return (
    <div className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-500/30 rounded-lg p-6 mb-4">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {isReferralBonus ? (
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <TrendingUp className="w-6 h-6 text-yellow-400" />
            </div>
          ) : (
            <div className="p-2 bg-green-500/20 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-400" />
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold text-white">
              {metadata.title}
            </h3>
            <p className="text-sm text-gray-300">
              {formatPeriodName(metadata.period_start || '', metadata.period_end || '')}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-green-400 border-green-400">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>
      </div>

      <div className="mb-4">
        <p className="text-gray-300 mb-3">{metadata.message}</p>
        
        {!isReferralBonus && (
          <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
            <h4 className="text-sm font-medium text-gray-300 mb-3">Your Engagement Breakdown:</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <MessageSquare className="w-4 h-4 text-blue-400 mr-1" />
                  <span className="text-sm text-gray-400">Posts</span>
                </div>
                <p className="text-lg font-semibold text-white">{metadata.interaction_breakdown?.posts || 0}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <MessageSquare className="w-4 h-4 text-purple-400 mr-1" />
                  <span className="text-sm text-gray-400">Comments</span>
                </div>
                <p className="text-lg font-semibold text-white">{metadata.interaction_breakdown?.comments || 0}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Heart className="w-4 h-4 text-red-400 mr-1" />
                  <span className="text-sm text-gray-400">Likes</span>
                </div>
                <p className="text-lg font-semibold text-white">{metadata.interaction_breakdown?.likes || 0}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <UserPlus className="w-4 h-4 text-green-400 mr-1" />
                  <span className="text-sm text-gray-400">Follows</span>
                </div>
                <p className="text-lg font-semibold text-white">{metadata.interaction_breakdown?.follows || 0}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300">Total Earnings</p>
              <p className="text-2xl font-bold text-green-400">
                {formatSOL(metadata.payout_amount_sol || 0)}
              </p>
            </div>
            <Button
              onClick={handleClaim}
              disabled={isClaiming}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
            >
              {isClaiming ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  {metadata.action_text}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-400">
        <p>💡 Click &quot;Claim&quot; to open Phantom wallet and receive your SOL payout</p>
      </div>
    </div>
  )
}
