'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Crown } from 'lucide-react'
import { useToast, ToastContainer } from '@/components/ui/toast'
import { supabase } from '@/lib/supabase'
import { processUserToUserPayment, isPhantomInstalled } from '@/lib/solana'
import { PaymentSuccessModal } from '@/components/payment-success-modal'
import { createPaymentNotification, createPaymentReceivedNotification } from '@/lib/database'

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
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successPaymentDetails, setSuccessPaymentDetails] = useState<{
    type: 'pro' | 'promotion' | 'featured-token' | 'alpha-chat-subscription'
    amount: number
    duration?: string
    signature?: string
  } | null>(null)
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

      // Get current user's username for notifications
      const { data: currentUserProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single()

      const currentUsername = currentUserProfile?.username || 'Anonymous'

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

      // 3. Check if Phantom is installed
      if (!isPhantomInstalled()) {
        throw new Error('Phantom wallet not found. Please install Phantom wallet to continue.')
      }

      const selectedPlanData = ALPHA_CHAT_PRICING[selectedPlan]
      
      // 4. Process user-to-user payment to owner's wallet
      const paymentResult = await processUserToUserPayment({
        toAddress: ownerProfile.payout_wallet_address,
        amount: selectedPlanData.price,
        memo: `Alpha Chat subscription - ${selectedPlanData.label} to ${ownerUsername}`
      })

      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Payment failed')
      }

      // 5. Call subscription API with payment details
      const requestBody = {
        ownerId,
        duration: selectedPlan,
        price: selectedPlanData.price,
        userId: user.id,
        signature: paymentResult.signature,
        fromAddress: paymentResult.fromAddress,
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

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Subscription API error:', errorData)
        throw new Error(errorData.details || errorData.error || 'Failed to create subscription')
      }

      // 6. Create notifications for both users
      try {
        // Notification for subscriber (current user)
        await createPaymentNotification(
          user.id,
          'alpha-chat-subscription',
          selectedPlanData.price,
          {
            duration: selectedPlanData.label,
            recipientUsername: ownerUsername,
            signature: paymentResult.signature
          }
        )

        // Notification for alpha chat owner (payment received)
        await createPaymentReceivedNotification(
          ownerId,
          user.id,
          currentUsername,
          selectedPlanData.price,
          'alpha-chat-subscription',
          {
            duration: selectedPlanData.label,
            signature: paymentResult.signature
          }
        )
      } catch (notifError) {
        console.error('Error creating notifications:', notifError)
        // Don't fail the subscription if notifications fail
      }

      // 7. Show success modal and close subscription modal
      setSuccessPaymentDetails({
        type: 'alpha-chat-subscription',
        amount: selectedPlanData.price,
        duration: selectedPlanData.label,
        signature: paymentResult.signature
      })
      setShowSuccessModal(true)
      onSubscriptionSuccess()
      onClose()
    } catch (err) {
      console.error('Error subscribing to alpha chat:', err)
      error('Failed to subscribe', err instanceof Error ? err.message : 'Please try again.')
    } finally {
      setIsSubscribing(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 pb-20 lg:pb-4">
        <div className="bg-black border border-gray-800 rounded-lg p-6 w-full max-w-md max-h-[calc(100vh-8rem)] lg:max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Crown className="h-6 w-6 text-purple-400" />
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
        </div>
      </div>

      {/* Payment Success Modal */}
      {successPaymentDetails && (
        <PaymentSuccessModal
          isOpen={showSuccessModal}
          onClose={() => {
            setShowSuccessModal(false)
            setSuccessPaymentDetails(null)
          }}
          paymentDetails={successPaymentDetails}
        />
      )}

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  )
}
