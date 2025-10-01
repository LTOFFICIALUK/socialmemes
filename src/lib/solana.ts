import { Connection, PublicKey } from '@solana/web3.js'

// Revenue wallet address (hardcoded as it can't be manipulated)
export const REVENUE_WALLET_ADDRESS = 'Eo7ckS6V3ojYkmkBpp29nfb12r8vfbgpCGxh1Ldw7Eu'

// Solana mainnet connection
const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed')

export interface PaymentVerification {
  isValid: boolean
  amount: number
  fromAddress: string
  signature: string
  error?: string
}

/**
 * Verify a SOL payment transaction
 * @param signature - The transaction signature to verify
 * @param expectedAmount - The expected SOL amount (in SOL, not lamports)
 * @param fromAddress - The expected sender address (optional)
 * @returns PaymentVerification object
 */
export const verifyPayment = async (
  signature: string,
  expectedAmount: number,
  fromAddress?: string
): Promise<PaymentVerification> => {
  try {
    // Get transaction details
    const transaction = await connection.getTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0
    })

    if (!transaction) {
      return {
        isValid: false,
        amount: 0,
        fromAddress: '',
        signature,
        error: 'Transaction not found'
      }
    }

    // Check if transaction was successful
    if (transaction.meta?.err) {
      return {
        isValid: false,
        amount: 0,
        fromAddress: '',
        signature,
        error: 'Transaction failed'
      }
    }

    // Get the revenue wallet public key
    const revenueWallet = new PublicKey(REVENUE_WALLET_ADDRESS)

    // Find transfers to our revenue wallet
    const preBalances = transaction.meta?.preBalances || []
    const postBalances = transaction.meta?.postBalances || []
    const accountKeys = transaction.transaction.message.staticAccountKeys

    let totalReceived = 0
    let senderAddress = ''

    // Check each account for balance changes
    for (let i = 0; i < accountKeys.length; i++) {
      const accountKey = accountKeys[i]
      
      // If this is our revenue wallet
      if (accountKey.equals(revenueWallet)) {
        const preBalance = preBalances[i] || 0
        const postBalance = postBalances[i] || 0
        const received = postBalance - preBalance
        
        if (received > 0) {
          totalReceived += received
        }
      }
    }

    // Convert lamports to SOL
    const receivedSOL = totalReceived / 1e9

    // Check if the amount matches (with small tolerance for fees)
    const tolerance = 0.001 // 0.001 SOL tolerance
    const amountMatches = Math.abs(receivedSOL - expectedAmount) <= tolerance

    if (!amountMatches) {
      return {
        isValid: false,
        amount: receivedSOL,
        fromAddress: senderAddress,
        signature,
        error: `Amount mismatch. Expected: ${expectedAmount} SOL, Received: ${receivedSOL} SOL`
      }
    }

    // Find the sender address (first account that's not our revenue wallet)
    for (let i = 0; i < accountKeys.length; i++) {
      const accountKey = accountKeys[i]
      if (!accountKey.equals(revenueWallet)) {
        const preBalance = preBalances[i] || 0
        const postBalance = postBalances[i] || 0
        const sent = preBalance - postBalance
        
        if (sent > 0) {
          senderAddress = accountKey.toString()
          break
        }
      }
    }

    // If fromAddress is provided, verify it matches
    if (fromAddress && senderAddress !== fromAddress) {
      return {
        isValid: false,
        amount: receivedSOL,
        fromAddress: senderAddress,
        signature,
        error: `Sender mismatch. Expected: ${fromAddress}, Actual: ${senderAddress}`
      }
    }

    return {
      isValid: true,
      amount: receivedSOL,
      fromAddress: senderAddress,
      signature
    }

  } catch (error) {
    console.error('Error verifying payment:', error)
    return {
      isValid: false,
      amount: 0,
      fromAddress: '',
      signature,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get the revenue wallet address
 */
export const getRevenueWalletAddress = (): string => {
  return REVENUE_WALLET_ADDRESS
}

/**
 * Format SOL amount for display
 */
export const formatSOL = (lamports: number): string => {
  return (lamports / 1e9).toFixed(2)
}

/**
 * Convert SOL to lamports
 */
export const solToLamports = (sol: number): number => {
  return Math.round(sol * 1e9)
}
