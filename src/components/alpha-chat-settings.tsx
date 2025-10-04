'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Crown, MessageSquare, Wallet } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast, ToastContainer } from '@/components/ui/toast'

interface AlphaChatSettingsProps {
  onClose?: () => void
}

export const AlphaChatSettings = ({ onClose }: AlphaChatSettingsProps) => {
  const [isEnabled, setIsEnabled] = useState(false)
  const [payoutWalletAddress, setPayoutWalletAddress] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isToggling, setIsToggling] = useState(false)
  const [isSavingWallet, setIsSavingWallet] = useState(false)
  const { toasts, success, error, removeToast } = useToast()

  useEffect(() => {
    loadAlphaChatStatus()
  }, [])

  const loadAlphaChatStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('alpha_chat_enabled, payout_wallet_address')
          .eq('id', user.id)
          .single()
        
        setIsEnabled(profile?.alpha_chat_enabled || false)
        setPayoutWalletAddress(profile?.payout_wallet_address || '')
      }
    } catch (error) {
      console.error('Error loading alpha chat status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggle = async () => {
    try {
      setIsToggling(true)
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }
      
      const response = await fetch('/api/alpha-chat/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enabled: !isEnabled,
          userId: user.id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to toggle alpha chat')
      }

      const result = await response.json()
      setIsEnabled(result.alpha_chat_enabled)
      
      if (onClose) {
        onClose()
      }
    } catch (err) {
      console.error('Error toggling alpha chat:', err)
      error('Failed to update alpha chat settings', 'Please try again.')
    } finally {
      setIsToggling(false)
    }
  }

  const handleSaveWalletAddress = async () => {
    try {
      setIsSavingWallet(true)
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Basic validation for Solana wallet address
      if (payoutWalletAddress && payoutWalletAddress.length < 32) {
        throw new Error('Please enter a valid Solana wallet address')
      }
      
      const { error } = await supabase
        .from('profiles')
        .update({ payout_wallet_address: payoutWalletAddress || null })
        .eq('id', user.id)

      if (error) {
        throw new Error(error.message)
      }

      success('Payout wallet address saved successfully!')
    } catch (err) {
      console.error('Error saving wallet address:', err)
      error('Failed to save wallet address', err instanceof Error ? err.message : 'Please try again.')
    } finally {
      setIsSavingWallet(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-black text-white border border-gray-800 rounded-lg overflow-hidden">
      <div className="bg-black border-b border-gray-800 p-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-yellow-500/20 rounded-lg">
            <Crown className="h-6 w-6 text-yellow-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Alpha Chat</h3>
            <p className="text-sm text-gray-400">Premium content feed for your followers</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-4">
          <div className="bg-black border border-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <MessageSquare className="h-5 w-5 text-green-400" />
                <div>
                  <h4 className="font-medium text-white">Alpha Chat Feed</h4>
                  <p className="text-sm text-gray-400">
                    {isEnabled 
                      ? 'Your alpha chat is active and visible to subscribers'
                      : 'Enable to create a premium content feed for subscribers'
                    }
                  </p>
                </div>
              </div>
              <Button
                onClick={handleToggle}
                disabled={isToggling}
                className={`${
                  isEnabled 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {isToggling ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : isEnabled ? (
                  'Disable'
                ) : (
                  'Enable'
                )}
              </Button>
            </div>
          </div>

          {isEnabled && (
            <div className="space-y-4">
              <div className="bg-black border border-green-500/20 rounded-lg p-4">
                <h4 className="font-medium text-green-400 mb-2">Alpha Chat Active</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Your profile now shows &quot;Posts&quot; and &quot;Alpha&quot; tabs</li>
                  <li>• Users can subscribe to access your alpha content</li>
                  <li>• You and subscribers can post in the alpha feed</li>
                  <li>• Subscription pricing: 0.1 SOL per month</li>
                </ul>
              </div>

              <div className="bg-black border border-gray-800 rounded-lg p-4">
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

          {!isEnabled && (
            <div className="bg-black border border-gray-800 rounded-lg p-4">
              <h4 className="font-medium text-gray-400 mb-2">Alpha Chat Disabled</h4>
              <p className="text-sm text-gray-300">
                Enable alpha chat to create a premium content feed where users can subscribe for exclusive access to your insights and discussions.
              </p>
            </div>
          )}
        </div>
      </div>
      </div>
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  )
}
