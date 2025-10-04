'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Lock, Crown } from 'lucide-react'
import { AlphaChatSubscriptionModal } from './alpha-chat-subscription-modal'

interface AlphaChatLockedProps {
  ownerUsername: string
  ownerId: string
  onSubscriptionSuccess: () => void
}

export const AlphaChatLocked = ({ 
  ownerUsername, 
  ownerId, 
  onSubscriptionSuccess 
}: AlphaChatLockedProps) => {
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false)

  const handleSubscribeClick = () => {
    setIsSubscriptionModalOpen(true)
  }

  const handleSubscriptionSuccess = () => {
    setIsSubscriptionModalOpen(false)
    onSubscriptionSuccess()
  }

  return (
    <>
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="mb-6">
          <div className="relative">
            <div className="p-4 bg-gray-800 rounded-full border-2 border-gray-700">
              <Lock className="h-12 w-12 text-gray-400" />
            </div>
            <div className="absolute -top-1 -right-1 p-1 bg-yellow-500 rounded-full">
              <Crown className="h-4 w-4 text-black" />
            </div>
          </div>
        </div>

        <div className="max-w-md">
          <h3 className="text-xl font-semibold text-white mb-2">
            Subscribe to {ownerUsername}&apos;s Alpha Chat
          </h3>
          <p className="text-gray-400 mb-6">
            Get exclusive access to premium insights, market analysis, and alpha content from {ownerUsername}.
          </p>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Crown className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <h4 className="font-medium text-white">Alpha Access</h4>
                  <p className="text-sm text-gray-400">Monthly subscription</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-400">0.1 SOL</div>
                <div className="text-sm text-gray-400">per month</div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleSubscribeClick}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg font-semibold"
            >
              <Lock className="h-5 w-5 mr-2" />
              Subscribe to Alpha Chat
            </Button>
            
            <p className="text-xs text-gray-500">
              Payment goes directly to {ownerUsername}&apos;s wallet
            </p>
          </div>
        </div>
      </div>

      <AlphaChatSubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        ownerUsername={ownerUsername}
        ownerId={ownerId}
        onSubscriptionSuccess={handleSubscriptionSuccess}
      />
    </>
  )
}
