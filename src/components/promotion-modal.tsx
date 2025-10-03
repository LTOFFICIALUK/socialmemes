'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getRevenueWalletAddress, solToLamports } from '@/lib/solana'
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js'
import { supabase } from '@/lib/supabase'

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
  const [errorMessage, setErrorMessage] = useState('')
  const [isProUser, setIsProUser] = useState(false)

  const basePrice = calculatePrice(selectedDuration)
  const discount = isProUser ? 0.2 : 0 // 20% discount for Pro users
  const totalCost = basePrice * (1 - discount)
  const savings = basePrice - totalCost

  useEffect(() => {
    if (isOpen) {
      setErrorMessage('')
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
    setIsLoading(true)
    setErrorMessage('')

    try {
      // 1. Connect wallet
      const provider = window.phantom?.solana
      if (!provider?.isPhantom) {
        throw new Error('Phantom wallet not found. Please install Phantom wallet.')
      }

      // Connect if not already connected
      if (!provider.isConnected) {
        await provider.connect()
      }

      const publicKey = provider.publicKey?.toString()
      if (!publicKey) {
        throw new Error('Failed to get wallet address')
      }

      // 2. Create and send transaction
      const connection = new Connection('https://api.devnet.solana.com')
      const transaction = new Transaction()
      
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: new PublicKey(publicKey),
          toPubkey: new PublicKey(getRevenueWalletAddress()),
          lamports: solToLamports(totalCost),
        })
      )

      const { blockhash } = await connection.getLatestBlockhash()
      transaction.recentBlockhash = blockhash
      transaction.feePayer = new PublicKey(publicKey)

      // Sign and send
      const signedTransaction = await provider.signTransaction(transaction)
      const signature = await connection.sendRawTransaction(signedTransaction.serialize())

      // 3. Call promotion API
      const response = await fetch('/api/promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          duration: selectedDuration,
          price: totalCost,
          signature,
          fromAddress: publicKey,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to promote post')
      }

      // Success - close modal
      onPromote(postId, selectedDuration, totalCost)
      onClose()

    } catch (error) {
      console.error('Error promoting post:', error)
      
      // Handle user rejection specifically
      if (error instanceof Error && error.message.includes('User rejected')) {
        setErrorMessage('Transaction was cancelled. Please try again if you would like to proceed with the promotion.')
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
                    <span>Processing...</span>
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
      </div>
    </div>
  )
}
