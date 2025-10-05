import { Connection, PublicKey, Transaction, SystemProgram, TransactionInstruction } from '@solana/web3.js'

// Revenue wallet address (hardcoded as it can't be manipulated)
export const REVENUE_WALLET_ADDRESS = 'Eo7ckS6V3ojYkmkBpp29nfb12r8vfbgpCGxh1Ldw7Eu'

// Solana mainnet connection using Helius RPC
const connection = new Connection('https://mainnet.helius-rpc.com/?api-key=d72f6482-06d8-4c7b-a92a-867c8db174ad', 'confirmed')

export interface PaymentVerification {
  isValid: boolean
  amount: number
  fromAddress: string
  signature: string
  error?: string
}

export interface PhantomProvider {
  isPhantom?: boolean
  publicKey?: PublicKey
  connect(): Promise<{ publicKey: PublicKey }>
  signTransaction(transaction: Transaction): Promise<Transaction>
}

export interface PaymentResult {
  success: boolean
  signature?: string
  fromAddress?: string
  error?: string
}

export interface PaymentOptions {
  amount: number // Amount in SOL
  memo?: string
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

/**
 * Check if Phantom wallet is installed
 */
export const isPhantomInstalled = (): boolean => {
  return typeof window !== 'undefined' && !!(window as unknown as { solana?: { isPhantom?: boolean } }).solana?.isPhantom
}

/**
 * Get Phantom provider from window object
 */
export const getPhantomProvider = (): PhantomProvider | null => {
  if (typeof window === 'undefined') {
    return null
  }
  
  const phantom = (window as unknown as { solana?: PhantomProvider }).solana
  return phantom?.isPhantom ? phantom : null
}

/**
 * Connect to Phantom wallet and return public key
 */
export const connectPhantomWallet = async (): Promise<PublicKey> => {
  const provider = getPhantomProvider()
  
  if (!provider) {
    throw new Error('Phantom wallet is not installed. Please install Phantom wallet to continue.')
  }
  
  try {
    const response = await provider.connect()
    return response.publicKey
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('User rejected')) {
        throw new Error('User rejected the connection request')
      }
      throw new Error(`Failed to connect to Phantom wallet: ${error.message}`)
    }
    throw new Error('Failed to connect to Phantom wallet')
  }
}

/**
 * Send payment to platform wallet
 */
export const sendPaymentToPlatform = async (options: PaymentOptions): Promise<PaymentResult> => {
  try {
    const provider = getPhantomProvider()
    
    if (!provider) {
      return {
        success: false,
        error: 'Phantom wallet is not installed'
      }
    }
    
    if (!provider.publicKey) {
      return {
        success: false,
        error: 'Wallet not connected. Please connect your wallet first.'
      }
    }
    
    const fromPublicKey = provider.publicKey
    const toPublicKey = new PublicKey(REVENUE_WALLET_ADDRESS)
    const amountLamports = solToLamports(options.amount)
    
    // Create transaction
    const transaction = new Transaction()
    
    // Add transfer instruction
    const transferInstruction = SystemProgram.transfer({
      fromPubkey: fromPublicKey,
      toPubkey: toPublicKey,
      lamports: amountLamports,
    })
    
    transaction.add(transferInstruction)
    
    // Add memo if provided
    if (options.memo) {
      const memoInstruction = new TransactionInstruction({
        keys: [],
        programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysKcWfC85B2q2'),
        data: Buffer.from(options.memo, 'utf8'),
      })
      transaction.add(memoInstruction)
    }
    
    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash('confirmed')
    transaction.recentBlockhash = blockhash
    transaction.feePayer = fromPublicKey
    
    // Sign transaction
    const signedTransaction = await provider.signTransaction(transaction)
    
    // Send transaction
    const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
    })
    
    // Wait for confirmation
    const confirmation = await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight: (await connection.getLatestBlockhash('confirmed')).lastValidBlockHeight,
    })
    
    if (confirmation.value.err) {
      return {
        success: false,
        error: 'Transaction failed to confirm'
      }
    }
    
    return {
      success: true,
      signature,
      fromAddress: fromPublicKey.toString()
    }
    
  } catch (error) {
    console.error('Payment error:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('User rejected')) {
        return {
          success: false,
          error: 'User rejected the transaction'
        }
      }
      if (error.message.includes('insufficient funds')) {
        return {
          success: false,
          error: 'Insufficient funds for transaction'
        }
      }
      return {
        success: false,
        error: error.message
      }
    }
    
    return {
      success: false,
      error: 'Unknown error occurred during payment'
    }
  }
}

/**
 * Verify payment transaction
 */
export const verifyPaymentTransaction = async (
  signature: string, 
  amount: number, 
  fromAddress: string
): Promise<PaymentResult> => {
  try {
    const verification = await verifyPayment(signature, amount, fromAddress)
    
    if (!verification.isValid) {
      return {
        success: false,
        error: verification.error || 'Payment verification failed'
      }
    }
    
    return {
      success: true,
      signature,
      fromAddress: verification.fromAddress
    }
  } catch (error) {
    console.error('Verification error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Verification failed'
    }
  }
}

/**
 * Complete payment flow with verification
 */
export const processUserToPlatformPayment = async (options: PaymentOptions): Promise<PaymentResult> => {
  try {
    // Send payment
    const paymentResult = await sendPaymentToPlatform(options)
    
    if (!paymentResult.success || !paymentResult.signature || !paymentResult.fromAddress) {
      return paymentResult
    }
    
    // Verify payment
    const verificationResult = await verifyPaymentTransaction(
      paymentResult.signature,
      options.amount,
      paymentResult.fromAddress
    )
    
    return verificationResult
    
  } catch (error) {
    console.error('Payment processing error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment processing failed'
    }
  }
}

// ============================================
// USER-TO-USER PAYMENT FUNCTIONS
// ============================================

/**
 * Send payment to another user's wallet
 */
export const sendPaymentToUser = async (
  options: PaymentOptions & { toAddress: string }
): Promise<PaymentResult> => {
  try {
    const provider = getPhantomProvider()
    
    if (!provider) {
      return {
        success: false,
        error: 'Phantom wallet is not installed'
      }
    }
    
    if (!provider.publicKey) {
      return {
        success: false,
        error: 'Wallet not connected. Please connect your wallet first.'
      }
    }
    
    // Validate recipient address
    let toPublicKey: PublicKey
    try {
      toPublicKey = new PublicKey(options.toAddress)
    } catch {
      return {
        success: false,
        error: 'Invalid recipient wallet address'
      }
    }
    
    const fromPublicKey = provider.publicKey
    const amountLamports = solToLamports(options.amount)
    
    // Create transaction
    const transaction = new Transaction()
    
    // Add transfer instruction
    const transferInstruction = SystemProgram.transfer({
      fromPubkey: fromPublicKey,
      toPubkey: toPublicKey,
      lamports: amountLamports,
    })
    
    transaction.add(transferInstruction)
    
    // Add memo if provided
    if (options.memo) {
      const memoInstruction = new TransactionInstruction({
        keys: [],
        programId: new PublicKey('MemoSq4gqABAXKb96qnH8TysKcWfC85B2q2'),
        data: Buffer.from(options.memo, 'utf8'),
      })
      transaction.add(memoInstruction)
    }
    
    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash('confirmed')
    transaction.recentBlockhash = blockhash
    transaction.feePayer = fromPublicKey
    
    // Sign transaction
    const signedTransaction = await provider.signTransaction(transaction)
    
    // Send transaction
    const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
    })
    
    // Wait for confirmation
    const confirmation = await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight: (await connection.getLatestBlockhash('confirmed')).lastValidBlockHeight,
    })
    
    if (confirmation.value.err) {
      return {
        success: false,
        error: 'Transaction failed to confirm'
      }
    }
    
    return {
      success: true,
      signature,
      fromAddress: fromPublicKey.toString()
    }
    
  } catch (error) {
    console.error('User-to-user payment error:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('User rejected')) {
        return {
          success: false,
          error: 'User rejected the transaction'
        }
      }
      if (error.message.includes('insufficient funds')) {
        return {
          success: false,
          error: 'Insufficient funds for transaction'
        }
      }
      return {
        success: false,
        error: error.message
      }
    }
    
    return {
      success: false,
      error: 'Unknown error occurred during payment'
    }
  }
}

/**
 * Verify user-to-user payment transaction
 */
export const verifyUserToUserPayment = async (
  signature: string,
  expectedAmount: number,
  fromAddress: string,
  toAddress: string
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

    // Get the recipient wallet public key
    const recipientWallet = new PublicKey(toAddress)

    // Find transfers to the recipient wallet
    const preBalances = transaction.meta?.preBalances || []
    const postBalances = transaction.meta?.postBalances || []
    const accountKeys = transaction.transaction.message.staticAccountKeys

    let totalReceived = 0
    let senderAddress = ''

    // Check each account for balance changes
    for (let i = 0; i < accountKeys.length; i++) {
      const accountKey = accountKeys[i]
      
      // If this is the recipient wallet
      if (accountKey.equals(recipientWallet)) {
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

    // Find the sender address (first account that's not the recipient wallet)
    for (let i = 0; i < accountKeys.length; i++) {
      const accountKey = accountKeys[i]
      if (!accountKey.equals(recipientWallet)) {
        const preBalance = preBalances[i] || 0
        const postBalance = postBalances[i] || 0
        const sent = preBalance - postBalance
        
        if (sent > 0) {
          senderAddress = accountKey.toString()
          break
        }
      }
    }

    // Verify sender address matches
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
    console.error('Error verifying user-to-user payment:', error)
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
 * Complete user-to-user payment flow with verification
 */
export const processUserToUserPayment = async (
  options: PaymentOptions & { toAddress: string }
): Promise<PaymentResult> => {
  try {
    // Send payment
    const paymentResult = await sendPaymentToUser(options)
    
    if (!paymentResult.success || !paymentResult.signature || !paymentResult.fromAddress) {
      return paymentResult
    }
    
    // Verify payment
    const verification = await verifyUserToUserPayment(
      paymentResult.signature,
      options.amount,
      paymentResult.fromAddress,
      options.toAddress
    )
    
    if (!verification.isValid) {
      return {
        success: false,
        error: verification.error || 'Payment verification failed'
      }
    }
    
    return {
      success: true,
      signature: paymentResult.signature,
      fromAddress: paymentResult.fromAddress
    }
    
  } catch (error) {
    console.error('User-to-user payment processing error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment processing failed'
    }
  }
}
