'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ProModal } from './pro-modal'

export const GlobalWalletSetup = () => {
  const [showWalletSetup, setShowWalletSetup] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkWalletSetup = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session?.user) {
          setIsLoading(false)
          return
        }

        // Get user profile to check Pro status and wallet address
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('pro, payout_wallet_address')
          .eq('id', session.user.id)
          .single()

        if (error) {
          console.error('Error fetching profile:', error)
          setIsLoading(false)
          return
        }

        // Show wallet setup if user is Pro but has no wallet address
        if (profile?.pro && (!profile.payout_wallet_address || profile.payout_wallet_address.trim() === '')) {
          // Close any existing ProModal instances by dispatching a custom event
          window.dispatchEvent(new CustomEvent('closeAllProModals'))
          setShowWalletSetup(true)
        }
      } catch (error) {
        console.error('Error checking wallet setup:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkWalletSetup()
  }, [])

  // Don't render anything while loading
  if (isLoading) {
    return null
  }

  return (
    <ProModal
      isOpen={showWalletSetup}
      onClose={() => setShowWalletSetup(false)}
      forceWalletSetup={true}
    />
  )
}
