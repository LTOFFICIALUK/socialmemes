'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { processUserToPlatformPayment, isPhantomInstalled } from '@/lib/solana'
import { PaymentSuccessModal } from '@/components/payment-success-modal'
import { createPaymentNotification } from '@/lib/database'

interface PromotionModalProps {
  isOpen: boolean
  onClose: () => void
  postId: string
  onPromote: (postId: string, duration: number, price: number) => void
}

// Calculate price based on hours (0.0417 SOL per hour, minimum 0.05 SOL)
// 1 week (168 hours) = 7 SOL
const calculatePrice = (hours: number) => {
  return Math.max(0.05, Math.round(hours * 0.0417 * 100) / 100)
}

export const PromotionModal = ({ isOpen, onClose, postId, onPromote }: PromotionModalProps) => {
  const [selectedDuration, setSelectedDuration] = useState(6) // Default to 6 hours
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isProUser, setIsProUser] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showMainModal, setShowMainModal] = useState(true)
  const [successPaymentDetails, setSuccessPaymentDetails] = useState<{
    type: 'pro' | 'promotion' | 'featured-token' | 'alpha-chat-subscription'
    amount: number
    duration?: string
    signature?: string
  } | null>(null)

  const basePrice = calculatePrice(selectedDuration)
  const discount = isProUser ? 0.2 : 0 // 20% discount for Pro users
  const totalCost = basePrice * (1 - discount)
  const savings = basePrice - totalCost

  useEffect(() => {
    if (isOpen) {
      setErrorMessage('')
      setShowMainModal(true)
      setShowSuccessModal(false)
      setSuccessPaymentDetails(null)
      checkProStatus()
    }
  }, [isOpen])

  const checkProStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('pro')
          .eq('id', user.id)
          .single()
        
        console.log('Post Promotion Modal - Pro status check:', { user: user.id, profile, isPro: profile?.pro })
        setIsProUser(profile?.pro || false)
      }
    } catch (error) {
      console.error('Error checking Pro status:', error)
    }
  }

  const handlePromote = async () => {
    // Check if Phantom is installed
    if (!isPhantomInstalled()) {
      setErrorMessage('Phantom wallet not found. Please install Phantom wallet.')
      return
    }

    setIsLoading(true)
    setErrorMessage('')

    try {
      // Process payment with Solana (this will refresh wallet connection)
      const paymentResult = await processUserToPlatformPayment({
        amount: totalCost,
        memo: `Post promotion - ${selectedDuration} hours`
      })

      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Payment failed')
      }

      // Get current session for authorization
      const { data: { session } } = await supabase.auth.getSession()
      console.log('Promotion Modal - Session check:', { session: !!session, hasAccessToken: !!session?.access_token })
      if (!session) {
        throw new Error('No active session')
      }

      // Call promotion API with payment details
      const response = await fetch('/api/promote', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          postId,
          duration: selectedDuration,
          price: totalCost,
          signature: paymentResult.signature,
          fromAddress: paymentResult.fromAddress,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to promote post')
      }

      // Success - show success modal and close main modal
      const durationText = selectedDuration < 24 
        ? `${selectedDuration} hours`
        : selectedDuration === 24
        ? '1 day'
        : `${Math.floor(selectedDuration / 24)} days`

      // Create payment notification
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await createPaymentNotification(
            user.id,
            'promotion',
            totalCost,
            {
              duration: durationText,
              postId: postId,
              signature: paymentResult.signature
            }
          )
        }
      } catch (notifError) {
        console.error('Error creating notification:', notifError)
        // Don't fail the promotion if notification fails
      }

      setSuccessPaymentDetails({
        type: 'promotion',
        amount: totalCost,
        duration: durationText,
        signature: paymentResult.signature
      })
      setShowMainModal(false) // Hide the main modal content
      setShowSuccessModal(true) // Show the success modal
      onPromote(postId, selectedDuration, totalCost)

    } catch (error) {
      console.error('Error promoting post:', error)
      
      // Handle user rejection specifically
      if (error instanceof Error && error.message.includes('User rejected')) {
        setErrorMessage('Transaction was cancelled. Please try again if you would like to proceed with the promotion.')
      } else if (error instanceof Error && error.message.includes('Wallet error occurred')) {
        setErrorMessage('Wallet error occurred. Please refresh the page and reconnect your wallet, then try again.')
      } else if (error instanceof Error && error.message.includes('Insufficient balance')) {
        setErrorMessage('Insufficient balance for transaction. Please ensure you have enough SOL in your wallet.')
      } else {
        setErrorMessage(error instanceof Error ? error.message : 'Payment failed')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-gray-700 rounded-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white hover:bg-gray-800 rounded-full p-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-semibold text-white">Promote this post</h2>
          </div>
        </div>

        {showMainModal && (
        <>
        {/* Duration Selection */}
        <div className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">Duration</label>
            <div className="relative">
              <input
                type="range"
                min="1"
                max="168"
                step="1"
                value={selectedDuration}
                onChange={(e) => setSelectedDuration(Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #10b981 0%, #10b981 ${((selectedDuration - 1) / (168 - 1)) * 100}%, #374151 ${((selectedDuration - 1) / (168 - 1)) * 100}%, #374151 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>1h</span>
                <span>1w</span>
              </div>
            </div>
            <div className="text-center mt-3">
              <span className="text-2xl font-bold text-white">
                {selectedDuration < 24 
                  ? `${selectedDuration} hours`
                  : selectedDuration === 24
                  ? '1 day'
                  : `${Math.floor(selectedDuration / 24)} days`
                }
              </span>
            </div>
          </div>


          {/* Payment Method */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">Payment method</label>
            <div className="text-white text-lg">
              Phantom Wallet Payment
            </div>
          </div>

          {/* Total Cost */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <div className="text-sm text-gray-400">
                Total over {selectedDuration < 24 
                  ? `${selectedDuration} hours`
                  : selectedDuration === 24
                  ? '1 day'
                  : `${Math.floor(selectedDuration / 24)} days`
                }
              </div>
              {isProUser ? (
                <div>
                  <div className="text-sm text-gray-400 line-through">
                    {basePrice.toFixed(2)} SOL
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {totalCost.toFixed(2)} SOL
                  </div>
                  <div className="flex items-center space-x-1 text-sm text-green-400">
                    <Crown className="h-3 w-3" />
                    <span>Pro discount applied - Save {savings.toFixed(2)} SOL (20% off)</span>
                  </div>
                </div>
              ) : (
                <div className="text-2xl font-bold text-white">
                  {totalCost.toFixed(2)} SOL
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700">
              <Button
                onClick={handlePromote}
                disabled={isLoading}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg font-medium"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Connecting wallet...</span>
                  </div>
                ) : (
                  'Pay with Phantom'
                )}
              </Button>

              {errorMessage && (
                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-400 text-sm text-center">{errorMessage}</p>
                </div>
              )}

              <p className="text-xs text-gray-400 text-center mt-3">
                By clicking Promote Post, you&apos;re indicating that you have read and agree to the{' '}
                <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Terms and Advertising Guidelines</a>.
              </p>
            </div>
        </>
        )}
      </div>

      {/* Payment Success Modal */}
      {successPaymentDetails && (
        <PaymentSuccessModal
          isOpen={showSuccessModal}
          onClose={() => {
            setShowSuccessModal(false)
            setSuccessPaymentDetails(null)
            onClose() // Close the entire modal when success modal closes
          }}
          paymentDetails={successPaymentDetails}
        />
      )}
    </div>
  )
}
