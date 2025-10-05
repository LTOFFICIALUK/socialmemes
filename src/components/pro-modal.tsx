'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Crown, Check, Zap, Star, X, Settings, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { AlphaChatSettings } from '@/components/alpha-chat-settings'
import { useToast, ToastContainer } from '@/components/ui/toast'
import { processUserToPlatformPayment, isPhantomInstalled } from '@/lib/solana'
import { PaymentSuccessModal } from '@/components/payment-success-modal'
import { createPaymentNotification } from '@/lib/database'

interface ProModalProps {
  isOpen: boolean
  onClose: () => void
  forceWalletSetup?: boolean
}

const pricingPlans = [
  {
    name: '1 Month',
    duration: 1,
    price: 0.1, // 0.1 SOL
    originalPrice: 0.1,
    popular: false,
  },
  {
    name: '3 Months',
    duration: 3,
    price: 0.25, // 0.25 SOL (save ~17%)
    originalPrice: 0.3,
    popular: true,
  },
  {
    name: '6 Months',
    duration: 6,
    price: 0.45, // 0.45 SOL (save 25%)
    originalPrice: 0.6,
    popular: false,
  },
  {
    name: '12 Months',
    duration: 12,
    price: 0.8, // 0.8 SOL (save ~33%)
    originalPrice: 1.2,
    popular: false,
  },
]

const proFeatures = [
  {
    icon: <Zap className="h-4 w-4 text-yellow-500" />,
    title: '20% Discount on Ads',
    description: 'Get 20% off all post promotions',
  },
  {
    icon: <Star className="h-4 w-4 text-yellow-500" />,
    title: 'Gold Username',
    description: 'Stand out with a premium gold username with shimmer effect',
  },
  {
    icon: <Crown className="h-4 w-4 text-purple-500" />,
    title: 'Pro Status',
    description: 'Show your Pro status to the community',
  },
]

export const ProModal = ({ isOpen, onClose, forceWalletSetup = false }: ProModalProps) => {
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string; avatar_url?: string; pro?: boolean; alpha_chat_enabled?: boolean; payout_wallet_address?: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubscribing, setIsSubscribing] = useState(false)
  const [showAlphaSettings, setShowAlphaSettings] = useState(false)
  const [payoutWalletAddress, setPayoutWalletAddress] = useState('')
  const [isSavingWallet, setIsSavingWallet] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showMainModal, setShowMainModal] = useState(true)
  const [showWalletSetupModal, setShowWalletSetupModal] = useState(false)
  const [successPaymentDetails, setSuccessPaymentDetails] = useState<{
    type: 'pro' | 'promotion' | 'featured-token' | 'alpha-chat-subscription'
    amount: number
    duration?: string
    signature?: string
  } | null>(null)
  const [pendingPaymentDetails, setPendingPaymentDetails] = useState<{
    amount: number
    duration: string
    signature: string
  } | null>(null)
  const router = useRouter()
  const { toasts, success, error, removeToast } = useToast()

  useEffect(() => {
    if (isOpen) {
      if (forceWalletSetup) {
        // For forced wallet setup, skip main modal and go directly to wallet setup
        setShowMainModal(false)
        setShowSuccessModal(false)
        setShowWalletSetupModal(true)
        setSuccessPaymentDetails(null)
        setPendingPaymentDetails(null)
      } else {
        // Normal flow
        setShowMainModal(true)
        setShowSuccessModal(false)
        setShowWalletSetupModal(false)
        setSuccessPaymentDetails(null)
        setPendingPaymentDetails(null)
      }
      getCurrentUser()
    }
  }, [isOpen, forceWalletSetup])

  // Listen for custom event to close all ProModals
  useEffect(() => {
    const handleCloseAllProModals = () => {
      if (!forceWalletSetup) {
        // Only close if this is not a forced wallet setup modal
        onClose()
      }
    }

    window.addEventListener('closeAllProModals', handleCloseAllProModals)
    return () => {
      window.removeEventListener('closeAllProModals', handleCloseAllProModals)
    }
  }, [forceWalletSetup, onClose])

  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Fetch user profile with pro status
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        setCurrentUser({ ...user, ...profile })
        setPayoutWalletAddress(profile?.payout_wallet_address || '')
      }
    } catch (error) {
      console.error('Error fetching user:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubscribe = async (plan: typeof pricingPlans[0]) => {
    if (!currentUser) {
      router.push('/auth/signin')
      return
    }

    // Check if Phantom is installed
    if (!isPhantomInstalled()) {
      error('Phantom wallet not found', 'Please install Phantom wallet to continue.')
      return
    }

    setIsSubscribing(true)
    try {
      // Process payment with Solana
      const paymentResult = await processUserToPlatformPayment({
        amount: plan.price,
        memo: `Pro subscription - ${plan.name}`
      })

      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Payment failed')
      }

      // Call the Pro subscription API with payment details
      const response = await fetch('/api/pro/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          duration: plan.duration,
          price: plan.price,
          userId: currentUser.id,
          signature: paymentResult.signature,
          fromAddress: paymentResult.fromAddress,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to process subscription')
      }

      const responseData = await response.json()

      // Create payment notification
      try {
        await createPaymentNotification(
          currentUser.id,
          'pro',
          plan.price,
          {
            duration: plan.name,
            signature: paymentResult.signature
          }
        )
      } catch (notifError) {
        console.error('Error creating notification:', notifError)
        // Don't fail the subscription if notification fails
      }

      // Success - refresh user data and check wallet setup
      await getCurrentUser()
      
      // Check if user needs to set up wallet address based on API response
      if (responseData.requiresWalletSetup) {
        // Store payment details for later use
        setPendingPaymentDetails({
          amount: plan.price,
          duration: plan.name,
          signature: paymentResult.signature || ''
        })
        // Hide main modal and show wallet setup popup
        setShowMainModal(false)
        setShowWalletSetupModal(true)
        success('Payment successful! Please set up your payout wallet address to complete the process.')
      } else {
        // Show success modal and close if wallet is already set
        setSuccessPaymentDetails({
          type: 'pro',
          amount: plan.price,
          duration: plan.name,
          signature: paymentResult.signature
        })
        setShowMainModal(false)
        setShowSuccessModal(true)
      }
    } catch (err) {
      console.error('Error subscribing to Pro:', err)
      error('Failed to process subscription', err instanceof Error ? err.message : 'Please try again.')
    } finally {
      setIsSubscribing(false)
    }
  }

  const handleSaveWalletAddress = async () => {
    try {
      setIsSavingWallet(true)
      
      if (!currentUser) {
        throw new Error('User not authenticated')
      }

      // Basic validation for Solana wallet address
      if (!payoutWalletAddress || payoutWalletAddress.length < 32) {
        throw new Error('Please enter a valid Solana wallet address')
      }
      
      const { error } = await supabase
        .from('profiles')
        .update({ payout_wallet_address: payoutWalletAddress })
        .eq('id', currentUser.id)

      if (error) {
        throw new Error(error.message)
      }

      // Update local state
      setCurrentUser(prev => prev ? { ...prev, payout_wallet_address: payoutWalletAddress } : null)
      success('Payout wallet address saved successfully!')
      
      // If this was from wallet setup modal, show success modal
      if (showWalletSetupModal && pendingPaymentDetails) {
        setShowWalletSetupModal(false)
        setSuccessPaymentDetails({
          type: 'pro',
          amount: pendingPaymentDetails.amount,
          duration: pendingPaymentDetails.duration,
          signature: pendingPaymentDetails.signature
        })
        setPendingPaymentDetails(null)
        setShowSuccessModal(true)
      } else if (forceWalletSetup) {
        setTimeout(() => {
          onClose()
        }, 1000)
      }
    } catch (err) {
      console.error('Error saving wallet address:', err)
      error('Failed to save wallet address', err instanceof Error ? err.message : 'Please try again.')
    } finally {
      setIsSavingWallet(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 pb-20 lg:pb-4">
      {!showWalletSetupModal && !showSuccessModal && (
        <div className="bg-black border border-gray-800 rounded-xl w-full max-w-4xl max-h-[calc(100vh-8rem)] lg:max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-800">
            <div className="flex items-center space-x-3">
              <Crown className="h-6 w-6 text-yellow-500" />
              <h2 className="text-2xl font-bold text-white">Upgrade to Pro</h2>
            </div>
            {!(forceWalletSetup && currentUser?.pro && !currentUser?.payout_wallet_address) && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            )}
          </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="text-white">Loading...</div>
          </div>
        ) : !currentUser ? (
          <div className="p-8 text-center">
            <h3 className="text-xl font-semibold text-white mb-4">Sign in to upgrade to Pro</h3>
            <Button onClick={() => router.push('/auth/signin')}>
              Sign In
            </Button>
          </div>
        ) : (
          <>
          {showMainModal && (
          <div className="p-6">
            {/* Pro Status Check */}
            {currentUser.pro && (
              <div className="mb-6 space-y-4">
                <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Crown className="h-5 w-5 text-green-500" />
                      <span className="text-green-500 font-medium">You&apos;re already a Pro member!</span>
                    </div>
                    <Button
                      onClick={() => setShowAlphaSettings(true)}
                      variant="outline"
                      size="sm"
                      className="bg-black border-0 text-white hover:bg-gray-800"
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Alpha Chat Settings
                    </Button>
                  </div>
                </div>

                {/* Force wallet setup message */}
                {forceWalletSetup && !currentUser.payout_wallet_address && (
                  <div className="p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Wallet className="h-5 w-5 text-yellow-500" />
                      <div>
                        <span className="text-yellow-500 font-medium">Setup Required</span>
                        <p className="text-yellow-400 text-sm mt-1">
                          Please set your payout wallet address below to complete your Pro setup. You cannot close this modal until you provide a valid wallet address.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Payout Wallet Address */}
                <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <Wallet className="h-5 w-5 text-blue-400" />
                    <div>
                      <h4 className="font-medium text-white">Payout Wallet Address</h4>
                      <p className="text-sm text-gray-400">
                        Set your Solana wallet address to receive subscription payments
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <Input
                      value={payoutWalletAddress}
                      onChange={(e) => setPayoutWalletAddress(e.target.value)}
                      placeholder="Enter your Solana wallet address (e.g., 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM)"
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                    />
                    <Button
                      onClick={handleSaveWalletAddress}
                      disabled={isSavingWallet}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isSavingWallet ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Saving...</span>
                        </div>
                      ) : (
                        'Save Wallet Address'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Features */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              {proFeatures.map((feature, index) => (
                <div key={index} className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    {feature.icon}
                    <h3 className="text-lg font-semibold ml-2 text-white">{feature.title}</h3>
                  </div>
                  <p className="text-gray-300 text-sm">{feature.description}</p>
                </div>
              ))}
            </div>

            {/* Pricing Plans */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {pricingPlans.map((plan, index) => (
                <div
                  key={index}
                  className={`relative bg-gray-900/50 border rounded-lg p-4 ${
                    plan.popular
                      ? 'border-yellow-500/50 bg-gradient-to-b from-yellow-500/10 to-transparent'
                      : 'border-gray-800'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                      <span className="bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-medium">
                        Most Popular
                      </span>
                    </div>
                  )}
                  
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2 text-white">{plan.name}</h3>
                    <div className="mb-3">
                      <span className="text-2xl font-bold text-white">{plan.price} SOL</span>
                      {plan.originalPrice > plan.price && (
                        <span className="text-gray-400 line-through ml-2 text-sm">{plan.originalPrice} SOL</span>
                      )}
                    </div>
                    
                    <ul className="text-left space-y-1 mb-4 text-sm">
                      <li className="flex items-center">
                        <Check className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                        <span className="text-gray-300">20% discount on ads</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                        <span className="text-gray-300">Gold username with shimmer</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                        <span className="text-gray-300">Pro status badge</span>
                      </li>
                    </ul>

                    <Button
                      onClick={() => handleSubscribe(plan)}
                      disabled={isSubscribing || currentUser.pro}
                      className={`w-full ${
                        plan.popular
                          ? 'bg-yellow-500 hover:bg-yellow-600 text-black'
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      {currentUser.pro ? 'Already Pro' : isSubscribing ? 'Activating...' : 'Activate Pro'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* FAQ Section */}
            <div className="mt-8">
              <h3 className="text-xl font-bold text-white mb-4">Frequently Asked Questions</h3>
              <div className="space-y-4">
                <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-white mb-2">How does the 20% discount work?</h4>
                  <p className="text-gray-300 text-sm">
                    When you promote a post, you&apos;ll automatically get 20% off the total cost. 
                    The discount is applied at checkout.
                  </p>
                </div>
                <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-white mb-2">Can I cancel my Pro subscription?</h4>
                  <p className="text-gray-300 text-sm">
                    Pro subscriptions are one-time payments for the selected duration. You&apos;ll keep your Pro benefits 
                    until the subscription period expires.
                  </p>
                </div>
                <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-white mb-2">How do I get Pro benefits?</h4>
                  <p className="text-gray-300 text-sm">
                    Simply click subscribe on any plan and your Pro benefits will be activated immediately. 
                    You&apos;ll get gold username with shimmer, 20% discount on ads, and Pro status badge.
                  </p>
                </div>
              </div>
            </div>
          </div>
          )}
          </>
        )}
        </div>
      )}
      
      {/* Alpha Chat Settings Modal */}
      {showAlphaSettings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-60 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-lg w-full max-w-md relative">
            <button
              onClick={() => setShowAlphaSettings(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
            >
              <X className="h-5 w-5" />
            </button>
            <AlphaChatSettings onClose={() => setShowAlphaSettings(false)} />
          </div>
        </div>
      )}
      

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
      
      <ToastContainer toasts={toasts} onClose={removeToast} />
      
      {/* Wallet Setup Modal - Outside main modal container */}
      {showWalletSetupModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 pb-20 lg:pb-4">
          <div className="bg-black border border-gray-700 rounded-xl max-w-md w-full max-h-[calc(100vh-8rem)] lg:max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div className="flex items-center space-x-3">
                <Wallet className="h-6 w-6 text-yellow-500" />
                <h2 className="text-xl font-semibold text-white">Setup Required</h2>
              </div>
              {!forceWalletSetup && (
                <button
                  onClick={() => setShowWalletSetupModal(false)}
                  className="text-gray-400 hover:text-white hover:bg-gray-800 rounded-full p-2 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
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
                <h3 className="text-lg font-semibold text-white mb-2">
                  Pro Payment Successful!
                </h3>
                <p className="text-gray-300 mb-4">
                  Your Pro subscription has been activated. To complete the setup, please provide your payout wallet address.
                </p>
                <p className="text-sm text-gray-400">
                  This wallet will be used for any future subscription payments or rewards.
                </p>
              </div>

              {/* Wallet Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Solana Wallet Address
                </label>
                <Input
                  value={payoutWalletAddress}
                  onChange={(e) => setPayoutWalletAddress(e.target.value)}
                  placeholder="Enter your Solana wallet address"
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 mb-3"
                />
                <Button
                  onClick={handleSaveWalletAddress}
                  disabled={isSavingWallet || !payoutWalletAddress.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSavingWallet ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </div>
                  ) : (
                    'Complete Setup'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
