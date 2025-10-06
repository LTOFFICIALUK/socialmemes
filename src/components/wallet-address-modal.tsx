'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface WalletAddressModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (walletAddress: string) => void
  isProcessing?: boolean
}

export const WalletAddressModal = ({ isOpen, onClose, onSubmit, isProcessing }: WalletAddressModalProps) => {
  const [walletAddress, setWalletAddress] = useState('')
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic validation
    if (!walletAddress.trim()) {
      setError('Please enter a wallet address')
      return
    }

    // Validate Solana address format (basic check - 32-44 characters)
    if (walletAddress.length < 32 || walletAddress.length > 44) {
      setError('Invalid Solana wallet address format')
      return
    }

    setError('')
    onSubmit(walletAddress.trim())
  }

  const handleClose = () => {
    if (!isProcessing) {
      setWalletAddress('')
      setError('')
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-lg shadow-xl border border-gray-800 max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white">Enter Wallet Address</h2>
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <p className="text-gray-300 mb-4">
              Please enter your Solana wallet address to receive your payout.
            </p>
            <p className="text-sm text-gray-400 mb-4">
              This address will be saved to your profile for future payouts.
            </p>
            
            <label htmlFor="walletAddress" className="block text-sm font-medium text-gray-300 mb-2">
              Solana Wallet Address
            </label>
            <input
              type="text"
              id="walletAddress"
              value={walletAddress}
              onChange={(e) => {
                setWalletAddress(e.target.value)
                setError('')
              }}
              placeholder="Enter your Solana wallet address"
              disabled={isProcessing}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              autoComplete="off"
            />
            
            {error && (
              <p className="mt-2 text-sm text-red-400">
                {error}
              </p>
            )}

            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-xs text-yellow-400">
                ⚠️ <strong>Important:</strong> Double-check your wallet address. Sending to an incorrect address may result in permanent loss of funds.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              type="button"
              onClick={handleClose}
              disabled={isProcessing}
              variant="outline"
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isProcessing}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Processing...' : 'Continue'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

