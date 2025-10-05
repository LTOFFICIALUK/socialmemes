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
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={handleClose} />
        
        <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
              <Check className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {config.title}
            </h3>
            <p className="text-gray-600 mb-2">
              {config.message}
            </p>
            <p className="text-sm text-gray-500">
              {config.subtitle}
            </p>
          </div>

          {signature && (
            <div className="mb-6">
              <button
                onClick={handleViewTransaction}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                View Transaction on Solscan
              </button>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
            {type === 'pro' && (
              <button
                onClick={() => {
                  handleClose()
                  window.location.reload()
                }}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Continue
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}