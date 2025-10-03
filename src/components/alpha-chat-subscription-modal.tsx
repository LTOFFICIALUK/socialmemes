'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Crown } from 'lucide-react'

interface AlphaChatSubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  ownerUsername: string
  ownerId: string
  onSubscriptionSuccess: () => void
}

// Alpha chat subscription pricing in SOL (same as pro pricing)
const ALPHA_CHAT_PRICING = {
  1: { price: 0.1, label: '1 Month' },
  3: { price: 0.25, label: '3 Months' },
  6: { price: 0.45, label: '6 Months' },
  12: { price: 0.8, label: '12 Months' },
}

export const AlphaChatSubscriptionModal = ({ 
  isOpen, 
  onClose, 
  ownerUsername, 
  ownerId,
  onSubscriptionSuccess 
}: AlphaChatSubscriptionModalProps) => {
  const [selectedPlan, setSelectedPlan] = useState<keyof typeof ALPHA_CHAT_PRICING>(1)
  const [isSubscribing, setIsSubscribing] = useState(false)

  if (!isOpen) return null

  const handleSubscribe = async () => {
    try {
      setIsSubscribing(true)
      
      // Here you would integrate with Solana wallet for payment
      // For now, we'll simulate the subscription process
      const response = await fetch('/api/alpha-chat/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ownerId,
          duration: selectedPlan,
          price: ALPHA_CHAT_PRICING[selectedPlan].price,
          userId: 'current-user-id', // This would come from auth context
          signature: 'mock-signature', // This would come from wallet
          fromAddress: 'mock-address', // This would come from wallet
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to subscribe')
      }

      onSubscriptionSuccess()
      onClose()
      alert('Alpha chat subscription activated successfully!')
    } catch (error) {
      console.error('Error subscribing to alpha chat:', error)
      alert('Failed to subscribe. Please try again.')
    } finally {
      setIsSubscribing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Crown className="h-6 w-6 text-yellow-500" />
            <h2 className="text-xl font-bold text-white">Subscribe to Alpha Chat</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-300 mb-4">
            Get exclusive access to <span className="font-semibold text-white">{ownerUsername}</span>&apos;s alpha chat for premium insights and discussions.
          </p>
          
          <div className="space-y-3">
            {Object.entries(ALPHA_CHAT_PRICING).map(([duration, plan]) => (
              <button
                key={duration}
                onClick={() => setSelectedPlan(Number(duration) as keyof typeof ALPHA_CHAT_PRICING)}
                className={`w-full p-3 rounded-lg border-2 transition-colors text-left ${
                  selectedPlan === Number(duration)
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-white">{plan.label}</div>
                    <div className="text-sm text-gray-400">Access to alpha content</div>
                  </div>
                  <div className="text-green-400 font-bold">
                    {plan.price} SOL
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex space-x-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubscribe}
            disabled={isSubscribing}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            {isSubscribing ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Subscribing...</span>
              </div>
            ) : (
              `Subscribe for ${ALPHA_CHAT_PRICING[selectedPlan].price} SOL`
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
