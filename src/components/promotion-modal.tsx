'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { getRevenueWalletAddress, solToLamports } from '@/lib/solana'

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
  const [selectedDuration, setSelectedDuration] = useState(24) // Default to 1 day
  const [isLoading, setIsLoading] = useState(false)
  const [paymentStep, setPaymentStep] = useState<'select' | 'connecting' | 'confirming' | 'success' | 'error'>('select')
  const [errorMessage, setErrorMessage] = useState('')

  const { publicKey, sendTransaction, connected, connect } = useWallet()
  const totalCost = calculatePrice(selectedDuration)

  useEffect(() => {
    if (isOpen) {
      setPaymentStep('select')
      setErrorMessage('')
    }
  }, [isOpen])

  const handlePromote = async () => {
    if (!connected) {
      setPaymentStep('connecting')
      try {
        await connect()
        setPaymentStep('select')
      } catch (error) {
        console.error('Error connecting wallet:', error)
        setPaymentStep('error')
        setErrorMessage('Failed to connect wallet')
        return
      }
    }

    if (!publicKey || !sendTransaction) {
      setPaymentStep('error')
      setErrorMessage('Wallet not connected')
      return
    }

    setIsLoading(true)
    setPaymentStep('confirming')

    try {
      // Create the transaction
      const transaction = new Transaction()
      const revenueWallet = new PublicKey(getRevenueWalletAddress())
      const lamports = solToLamports(totalCost)

      // Add the transfer instruction
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: revenueWallet,
          lamports: lamports,
        })
      )

      // Send the transaction
      const signature = await sendTransaction(transaction, {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      })

      // Wait for confirmation
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Call the promotion API
      const response = await fetch('/api/promote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId,
          duration: selectedDuration,
          price: totalCost,
          signature,
          fromAddress: publicKey.toString(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to promote post')
      }

      setPaymentStep('success')
      await onPromote(postId, selectedDuration, totalCost)
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose()
      }, 2000)

    } catch (error) {
      console.error('Error promoting post:', error)
      setPaymentStep('error')
      setErrorMessage(error instanceof Error ? error.message : 'Payment failed')
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

        {/* Duration Selection */}
        <div className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">Duration</label>
            <div className="relative">
              <input
                type="range"
                min="6"
                max="168"
                step="6"
                value={selectedDuration}
                onChange={(e) => setSelectedDuration(Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #10b981 0%, #10b981 ${((selectedDuration - 6) / (168 - 6)) * 100}%, #374151 ${((selectedDuration - 6) / (168 - 6)) * 100}%, #374151 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>6h</span>
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
              <div className="text-2xl font-bold text-white">
                {totalCost} SOL
              </div>
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
            {paymentStep === 'connecting' ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Connecting...</span>
              </div>
            ) : paymentStep === 'confirming' ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Confirming payment...</span>
              </div>
            ) : paymentStep === 'success' ? (
              <div className="flex items-center justify-center space-x-2">
                <span>✅ Payment successful!</span>
              </div>
            ) : paymentStep === 'error' ? (
              <span>Try again</span>
            ) : (
              'Pay with Phantom'
            )}
          </Button>
          
          {paymentStep === 'error' && errorMessage && (
            <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm text-center">{errorMessage}</p>
            </div>
          )}
          
          <p className="text-xs text-gray-400 text-center mt-3">
            By clicking Promote Post, you're indicating that you have read and agree to the{' '}
            <a href="#" className="text-blue-400 hover:underline">Terms and Advertising Guidelines</a>.
          </p>
        </div>
      </div>
    </div>
  )
}
