'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Wallet, 
  ExternalLink, 
  CheckCircle, 
  AlertCircle,
  Loader2
} from 'lucide-react'

interface PhantomPayoutClaimProps {
  payoutData: {
    periodStart: string
    periodEnd: string
    payoutType: 'user_payout' | 'referral_payout'
  }
  onSuccess: (transactionHash: string) => void
  onError: (error: string) => void
}

declare global {
  interface Window {
    solana?: {
      isPhantom?: boolean
      connect: () => Promise<{ publicKey: { toString: () => string } }>
      signAndSendTransaction: (transaction: { serialize: () => Uint8Array }) => Promise<{ signature: string }>
    }
  }
}

export function PhantomPayoutClaim({ payoutData, onSuccess, onError }: PhantomPayoutClaimProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)

  const connectPhantom = async () => {
    setIsConnecting(true)
    try {
      if (!window.solana?.isPhantom) {
        throw new Error('Phantom wallet not found. Please install Phantom wallet.')
      }

      const response = await window.solana.connect()
      setWalletAddress(response.publicKey.toString())
      setIsConnected(true)
    } catch (error) {
      console.error('Error connecting to Phantom:', error)
      onError(error instanceof Error ? error.message : 'Failed to connect to Phantom wallet')
    } finally {
      setIsConnecting(false)
    }
  }

  const claimPayout = async () => {
    setIsClaiming(true)
    try {
      // Get payout details from API
      const response = await fetch('/api/payouts/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payoutData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to get payout details')
      }

      const { transaction } = await response.json()

      // Create Solana transaction
      const transactionData = {
        to: transaction.recipient,
        amount: transaction.amount,
        // Add other transaction details as needed
      }

      // Sign and send transaction via Phantom
      if (!window.solana) {
        throw new Error('Phantom wallet not available')
      }

      const result = await window.solana.signAndSendTransaction(transactionData)
      
      // Confirm the payout
      const confirmResponse = await fetch('/api/payouts/claim', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payoutId: transaction.payoutId,
          transactionHash: result.signature,
          payoutType: payoutData.payoutType
        }),
      })

      if (!confirmResponse.ok) {
        throw new Error('Failed to confirm payout')
      }

      onSuccess(result.signature)
    } catch (error) {
      console.error('Error claiming payout:', error)
      onError(error instanceof Error ? error.message : 'Failed to claim payout')
    } finally {
      setIsClaiming(false)
    }
  }

  if (!window.solana?.isPhantom) {
    return (
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-3">
          <AlertCircle className="w-5 h-5 text-yellow-400" />
          <h3 className="font-semibold text-yellow-400">Phantom Wallet Required</h3>
        </div>
        <p className="text-sm text-gray-300 mb-4">
          You need to install Phantom wallet to claim your payout.
        </p>
        <Button
          onClick={() => window.open('https://phantom.app/', '_blank')}
          variant="outline"
          className="border-yellow-500 text-yellow-400 hover:bg-yellow-500/10"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Install Phantom Wallet
        </Button>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-3">
          <Wallet className="w-5 h-5 text-blue-400" />
          <h3 className="font-semibold text-blue-400">Connect Phantom Wallet</h3>
        </div>
        <p className="text-sm text-gray-300 mb-4">
          Connect your Phantom wallet to claim your payout.
        </p>
        <Button
          onClick={connectPhantom}
          disabled={isConnecting}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isConnecting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Wallet className="w-4 h-4 mr-2" />
              Connect Phantom
            </>
          )}
        </Button>
      </div>
    )
  }

  return (
    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
      <div className="flex items-center gap-3 mb-3">
        <CheckCircle className="w-5 h-5 text-green-400" />
        <h3 className="font-semibold text-green-400">Ready to Claim</h3>
      </div>
      <p className="text-sm text-gray-300 mb-2">
        Wallet: {walletAddress?.slice(0, 8)}...{walletAddress?.slice(-8)}
      </p>
      <p className="text-sm text-gray-300 mb-4">
        Click below to sign the transaction and receive your payout.
      </p>
      <Button
        onClick={claimPayout}
        disabled={isClaiming}
        className="bg-green-600 hover:bg-green-700 text-white w-full"
      >
        {isClaiming ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing Transaction...
          </>
        ) : (
          <>
            <CheckCircle className="w-4 h-4 mr-2" />
            Claim Payout
          </>
        )}
      </Button>
    </div>
  )
}
