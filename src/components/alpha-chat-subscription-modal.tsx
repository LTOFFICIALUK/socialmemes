'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Crown } from 'lucide-react'
import { useToast, ToastContainer } from '@/components/ui/toast'
import { supabase } from '@/lib/supabase'

interface AlphaChatSubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  ownerUsername: string
  ownerId: string
  onSubscriptionSuccess: () => void
}

// Alpha chat subscription pricing with discounts for longer periods
const ALPHA_CHAT_PRICING = {
  1: { price: 0.1, originalPrice: 0.1, label: '1 Month', discount: 0 },
  3: { price: 0.25, originalPrice: 0.3, label: '3 Months', discount: 17 },
  6: { price: 0.45, originalPrice: 0.6, label: '6 Months', discount: 25 },
  12: { price: 0.8, originalPrice: 1.2, label: '12 Months', discount: 33 },
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
  const { toasts, success, error, removeToast } = useToast()

  if (!isOpen) return null

  const handleSubscribe = async () => {
    try {
      setIsSubscribing(true)
      
      // 1. Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      // 2. Get alpha chat owner's payout wallet address
      const { data: ownerProfile, error: ownerError } = await supabase
        .from('profiles')
        .select('payout_wallet_address, alpha_chat_enabled')
        .eq('id', ownerId)
        .single()

      if (ownerError || !ownerProfile) {
        throw new Error('Alpha chat owner not found')
      }

      if (!ownerProfile.alpha_chat_enabled) {
        throw new Error('Alpha chat is not enabled for this user')
      }

      if (!ownerProfile.payout_wallet_address) {
        throw new Error('Alpha chat owner has not set up their payout wallet address')
      }

      // 3. Skip payment processing for testing
      const selectedPlanData = ALPHA_CHAT_PRICING[selectedPlan]
      
      // Mock payment data for testing (no actual payment)
      const mockSignature = `mock_signature_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const mockFromAddress = 'mock_wallet_address_for_testing'

      // 5. Call subscription API
      const requestBody = {
        ownerId,
        duration: selectedPlan,
        price: selectedPlanData.price,
        userId: user.id,
        signature: mockSignature,
        fromAddress: mockFromAddress,
      }
      
      console.log('Making subscription API call with data:', requestBody)
      
      const response = await fetch('/api/alpha-chat/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify(requestBody),
      })
      
      console.log('API response status:', response.status)
      console.log('API response headers:', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Subscription API error:', errorData)
        throw new Error(errorData.details || errorData.error || 'Failed to create subscription')
      }

      // Success - refresh and close modal
      onSubscriptionSuccess()
      onClose()
      success('Alpha chat subscription activated successfully!')
    } catch (err) {
      console.error('Error subscribing to alpha chat:', err)
      error('Failed to subscribe', err instanceof Error ? err.message : 'Please try again.')
    } finally {
      setIsSubscribing(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-black border border-gray-800 rounded-lg p-6 w-full max-w-md">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Crown className="h-6 w-6 text-yellow-500" />
              <h2 className="text-xl font-bold text-white">Subscribe to Alpha Chat</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors text-xl"
            >
              ×
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
                  className={`w-full p-4 rounded-lg transition-all text-left ${
                    selectedPlan === Number(duration)
                      ? 'bg-green-500/10'
                      : 'border border-gray-800 hover:border-gray-700 bg-black'
                  }`}
                >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-white">{plan.label}</span>
                      {plan.discount > 0 && (
                        <span className="bg-green-500 text-black px-2 py-1 rounded-full text-xs font-medium">
                          {plan.discount}% OFF
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-400">
                      {duration === '1' ? '0.1 SOL per month' : `${(plan.price / Number(duration)).toFixed(2)} SOL per month`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-green-400 font-bold text-lg">
                      {plan.price} SOL
                    </div>
                    {plan.originalPrice > plan.price && (
                      <div className="text-gray-500 line-through text-sm">
                        {plan.originalPrice} SOL
                      </div>
                    )}
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
          
          <p className="text-xs text-gray-400 text-center mt-3">
            Payment processing disabled for testing • No actual charges
          </p>
        </div>
      </div>
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  )
}
