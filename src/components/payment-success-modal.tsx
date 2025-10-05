'use client'

import { Check, X, ExternalLink } from 'lucide-react'

interface PaymentSuccessModalProps {
  isOpen: boolean
  onClose: () => void
  paymentDetails: {
    type: 'pro' | 'promotion' | 'featured-token' | 'alpha-chat-subscription'
    amount: number
    duration?: string
    signature?: string
  }
}

const getPaymentTypeConfig = (type: string, amount: number, duration?: string) => {
  switch (type) {
    case 'pro':
      return {
        emoji: '⭐',
        title: 'Pro Subscription Activated!',
        message: `Welcome to Pro! You now have access to all premium features.`,
        subtitle: `Payment of ${amount} SOL processed successfully.`
      }
    
    case 'promotion':
      return {
        emoji: '🚀',
        title: 'Post Promoted Successfully!',
        message: `Your post is now being promoted and will reach more users.`,
        subtitle: `Promotion fee of ${amount} SOL processed successfully.`
      }
    
    case 'featured-token':
      return {
        emoji: '💎',
        title: 'Token Featured Successfully!',
        message: `Your token is now featured and will get increased visibility.`,
        subtitle: `Featured token fee of ${amount} SOL processed successfully.`
      }
    
    case 'alpha-chat-subscription':
      return {
        emoji: '🔓',
        title: 'Alpha Chat Access Granted!',
        message: `You now have exclusive access to alpha chat features.`,
        subtitle: duration 
          ? `${duration} subscription for ${amount} SOL activated successfully.`
          : `Alpha chat subscription for ${amount} SOL activated successfully.`
      }
    
    default:
      return {
        emoji: '✅',
        title: 'Payment Successful!',
        message: `Your payment has been processed successfully.`,
        subtitle: `Amount: ${amount} SOL`
      }
  }
}

export const PaymentSuccessModal = ({ isOpen, onClose, paymentDetails }: PaymentSuccessModalProps) => {
  const { type, amount, duration, signature } = paymentDetails
  const config = getPaymentTypeConfig(type, amount, duration)
  
  const solscanUrl = signature ? `https://solscan.io/tx/${signature}` : null

  const handleClose = () => {
    onClose()
  }

  const handleViewTransaction = () => {
    if (solscanUrl) {
      window.open(solscanUrl, '_blank', 'noopener,noreferrer')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 pb-20 lg:pb-4">
      <div className="bg-black border border-gray-700 rounded-xl max-w-md w-full max-h-[calc(100vh-8rem)] lg:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-semibold text-white">{config.title}</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white hover:bg-gray-800 rounded-full p-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Success Icon */}
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30">
              <Check className="w-8 h-8 text-green-400" />
            </div>
          </div>

          {/* Content */}
          <div className="text-center mb-6">
            <p className="text-gray-300 mb-2">
              {config.message}
            </p>
            <p className="text-sm text-gray-400">
              {config.subtitle}
            </p>
          </div>

          {/* View Transaction Button */}
          {signature && (
            <div>
              <button
                onClick={handleViewTransaction}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                View Transaction on Solscan
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}