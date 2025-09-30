import { PublicKey, Transaction } from '@solana/web3.js'

interface PhantomProvider {
  isPhantom?: boolean
  isConnected: boolean
  publicKey?: PublicKey
  connect(): Promise<{ publicKey: PublicKey }>
  disconnect(): Promise<void>
  signTransaction(transaction: Transaction): Promise<Transaction>
  signAllTransactions(transactions: Transaction[]): Promise<Transaction[]>
}

declare global {
  interface Window {
    phantom?: {
      solana?: PhantomProvider
    }
  }
}
