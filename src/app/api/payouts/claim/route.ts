import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Connection, PublicKey, SystemProgram, Transaction, Keypair, LAMPORTS_PER_SOL, sendAndConfirmTransaction } from '@solana/web3.js'
import bs58 from 'bs58'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
})

// Claim payout - sends SOL from platform wallet to user
export async function POST(request: NextRequest) {
  try {
    const { 
      userId, 
      periodStart, 
      periodEnd, 
      notificationType, // 'payout_earned' or 'referral_bonus'
      walletAddress // Optional: if user provides it in the modal
    } = await request.json()

    if (!userId || !periodStart || !periodEnd || !notificationType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify platform wallet key is configured
    const platformWalletKey = process.env.PLATFORM_WALLET_KEY
    if (!platformWalletKey) {
      console.error('PLATFORM_WALLET_KEY not configured in environment variables')
      return NextResponse.json(
        { error: 'Platform wallet not configured. Please contact support.' },
        { status: 500 }
      )
    }

    // Get user's profile with wallet address
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('payout_wallet_address')
      .eq('id', userId)
      .single()

    if (profileError) {
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 400 }
      )
    }

    // Use provided wallet address or existing one
    let recipientWalletAddress = profile?.payout_wallet_address || walletAddress

    if (!recipientWalletAddress) {
      return NextResponse.json(
        { error: 'No payout wallet address found. Please set your wallet address in profile settings.' },
        { status: 400 }
      )
    }

    // If wallet address was provided and different from profile, update profile
    if (walletAddress && walletAddress !== profile?.payout_wallet_address) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ payout_wallet_address: walletAddress })
        .eq('id', userId)

      if (updateError) {
        console.error('Error updating wallet address:', updateError)
        // Don't fail the request, just log the error
      } else {
        console.log(`Updated wallet address for user ${userId}`)
        recipientWalletAddress = walletAddress
      }
    }

    let payoutData
    let payoutAmount: number
    let tableName: string
    let payoutId: string

    // Get payout data based on type
    if (notificationType === 'payout_earned') {
      tableName = 'user_payouts'
      
      // Check if payout exists and is pending
      const { data: userPayout, error: userError } = await supabase
        .from('user_payouts')
        .select('*')
        .eq('user_id', userId)
        .eq('period_start', periodStart)
        .eq('period_end', periodEnd)
        .eq('payout_status', 'pending')
        .single()

      if (userError || !userPayout) {
        return NextResponse.json(
          { error: 'No pending payout found for this period' },
          { status: 404 }
        )
      }

      payoutData = userPayout
      payoutAmount = parseFloat(userPayout.final_payout_sol || '0')
      payoutId = userPayout.id

    } else if (notificationType === 'referral_bonus') {
      tableName = 'referral_payouts'
      
      // For referral bonus, we need to get all pending referral payouts for this user in this period
      const { data: referralPayouts, error: referralError } = await supabase
        .from('referral_payouts')
        .select('*')
        .eq('referrer_id', userId)
        .eq('period_start', periodStart)
        .eq('period_end', periodEnd)
        .eq('payout_status', 'pending')

      if (referralError || !referralPayouts || referralPayouts.length === 0) {
        return NextResponse.json(
          { error: 'No pending referral payouts found for this period' },
          { status: 404 }
        )
      }

      // Calculate total referral bonus
      payoutAmount = referralPayouts.reduce((sum, payout) => 
        sum + parseFloat(payout.referral_bonus_sol || '0'), 0
      )
      
      // Store all payout IDs to update later
      payoutData = referralPayouts
      payoutId = referralPayouts[0].id // Store first ID for reference

    } else {
      return NextResponse.json(
        { error: 'Invalid notification type' },
        { status: 400 }
      )
    }

    // Validate payout amount
    if (payoutAmount <= 0) {
      return NextResponse.json(
        { error: 'No payout amount available' },
        { status: 400 }
      )
    }

    // Initialize Solana connection
    const connection = new Connection(
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
      'confirmed'
    )

    // Decode platform wallet private key
    let platformKeypair: Keypair
    try {
      const privateKeyBytes = bs58.decode(platformWalletKey)
      platformKeypair = Keypair.fromSecretKey(privateKeyBytes)
    } catch (error) {
      console.error('Error decoding platform wallet key:', error)
      return NextResponse.json(
        { error: 'Invalid platform wallet configuration. Please contact support.' },
        { status: 500 }
      )
    }

    // Create recipient public key
    let recipientPubkey: PublicKey
    try {
      recipientPubkey = new PublicKey(recipientWalletAddress)
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid recipient wallet address' },
        { status: 400 }
      )
    }

    // Create transaction
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: platformKeypair.publicKey,
        toPubkey: recipientPubkey,
        lamports: Math.floor(payoutAmount * LAMPORTS_PER_SOL), // Convert SOL to lamports
      })
    )

    // Send transaction
    let txHash: string
    try {
      txHash = await sendAndConfirmTransaction(
        connection,
        transaction,
        [platformKeypair],
        {
          commitment: 'confirmed',
        }
      )
      
      console.log(`Payout transaction successful: ${txHash}`)
    } catch (error) {
      console.error('Error sending payout transaction:', error)
      return NextResponse.json(
        { error: 'Failed to send payout. Please try again later or contact support.' },
        { status: 500 }
      )
    }

    // Update payout status to "claimed"
    if (notificationType === 'payout_earned') {
      const { error: updateError } = await supabase
        .from('user_payouts')
        .update({
          payout_status: 'claimed',
          payment_tx_hash: txHash,
          updated_at: new Date().toISOString()
        })
        .eq('id', payoutId)

      if (updateError) {
        console.error('Error updating payout status:', updateError)
        // Transaction succeeded but status update failed - log this critical error
        console.error(`CRITICAL: Payment sent but status not updated. TxHash: ${txHash}, PayoutId: ${payoutId}`)
      }

    } else if (notificationType === 'referral_bonus') {
      // Update all referral payouts for this user in this period
      const referralPayoutIds = (payoutData as { id: string }[]).map(p => p.id)
      
      const { error: updateError } = await supabase
        .from('referral_payouts')
        .update({
          payout_status: 'claimed',
          payment_tx_hash: txHash,
          updated_at: new Date().toISOString()
        })
        .in('id', referralPayoutIds)

      if (updateError) {
        console.error('Error updating referral payout status:', updateError)
        // Transaction succeeded but status update failed - log this critical error
        console.error(`CRITICAL: Payment sent but status not updated. TxHash: ${txHash}, PayoutIds: ${referralPayoutIds.join(', ')}`)
      }
    }

    return NextResponse.json({
      success: true,
      transactionHash: txHash,
      amount: payoutAmount,
      message: `Successfully sent ${payoutAmount.toFixed(4)} SOL to your wallet!`
    })

  } catch (error) {
    console.error('Error in claim payout API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
