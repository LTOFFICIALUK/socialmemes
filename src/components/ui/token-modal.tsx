'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, Coins, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface TokenInfo {
  symbol: string
  name: string
  address: string
  decimals: number
  logo?: string
  dexScreenerUrl?: string
}

interface TokenModalProps {
  isOpen: boolean
  onClose: () => void
  onTokenSelect: (tokenInfo: TokenInfo) => void
  currentToken?: TokenInfo | null
  onTokenRemove?: () => void
}

export const TokenModal = ({ isOpen, onClose, onTokenSelect, currentToken, onTokenRemove }: TokenModalProps) => {
  const [contractAddress, setContractAddress] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null)
  const [error, setError] = useState('')

  const isValidSolanaAddress = (address: string): boolean => {
    // Solana addresses are base58 encoded and typically 32-44 characters
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)
  }

  const fetchTokenInfo = async (address: string) => {
    setIsLoading(true)
    setError('')
    setTokenInfo(null)

    try {
      // Use DexScreener API to fetch real token information
      const response = await fetch(`https://api.dexscreener.com/token-pairs/v1/solana/${address}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Token not found on DexScreener. This token may not have any trading pairs.')
        }
        throw new Error(`API Error: ${response.status}`)
      }

      const data = await response.json()
      
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('No trading pairs found for this token.')
      }

      // Get the first (most liquid) pair for token info
      // Sort by recent volume to get the most active pair first
      // Priority: m5 (5min) > h1 (1hr) > h6 (6hr) > h24 (24hr)
      const sortedPairs = data.sort((a, b) => {
        // First try 5-minute volume
        const aVol5m = a.volume?.m5 || 0
        const bVol5m = b.volume?.m5 || 0
        if (aVol5m !== bVol5m) return bVol5m - aVol5m
        
        // Then try 1-hour volume
        const aVol1h = a.volume?.h1 || 0
        const bVol1h = b.volume?.h1 || 0
        if (aVol1h !== bVol1h) return bVol1h - aVol1h
        
        // Then try 6-hour volume
        const aVol6h = a.volume?.h6 || 0
        const bVol6h = b.volume?.h6 || 0
        if (aVol6h !== bVol6h) return bVol6h - aVol6h
        
        // Finally fall back to 24-hour volume
        return (b.volume?.h24 || 0) - (a.volume?.h24 || 0)
      })
      const primaryPair = sortedPairs[0]
      const baseToken = primaryPair.baseToken
      
      // Debug: Log the baseToken structure to see what fields are available
      console.log('BaseToken structure:', baseToken)
      
      // DexScreener doesn't provide logos in token-pairs endpoint
      // Use a fallback logo service for common tokens or generate a placeholder
      const getTokenLogo = (symbol: string, address: string) => {
        // Try CoinGecko API for token logos
        const symbolLower = symbol.toLowerCase()
        
        // Common token logos (you can expand this list)
        const commonLogos: { [key: string]: string } = {
          'sol': 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
          'usdc': 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
          'usdt': 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.png',
          'bonk': 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263/logo.png',
          'wif': 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm/logo.png',
          'pwood': 'https://arweave.net/b1kNtxC3Yvv7t1wM6vfrcgw4y86XaxcaPTquxngspump/logo.png' // Example for PumpWood
        }
        
        return commonLogos[symbolLower] || undefined
      }
      
      const logoUrl = getTokenLogo(baseToken.symbol, baseToken.address)
      
      const realTokenInfo: TokenInfo = {
        symbol: baseToken.symbol || 'UNKNOWN',
        name: baseToken.name || 'Unknown Token',
        address: baseToken.address.toLowerCase(),
        decimals: baseToken.decimals || 9,
        logo: logoUrl,
        dexScreenerUrl: primaryPair.url
      }

      setTokenInfo(realTokenInfo)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch token information. Please check the contract address.'
      setError(errorMessage)
      console.error('Error fetching token info:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddressChange = (value: string) => {
    setContractAddress(value)
    setTokenInfo(null)
    setError('')
  }

  const handleSubmit = () => {
    if (!isValidSolanaAddress(contractAddress)) {
      setError('Please enter a valid Solana contract address')
      return
    }
    fetchTokenInfo(contractAddress)
  }

  const handleTokenConfirm = () => {
    if (tokenInfo) {
      onTokenSelect(tokenInfo)
      onClose()
      // Reset state
      setContractAddress('')
      setTokenInfo(null)
      setError('')
    }
  }

  const handleClose = () => {
    onClose()
    // Reset state
    setContractAddress('')
    setTokenInfo(null)
    setError('')
    setIsLoading(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-black border border-gray-700 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Coins className="h-5 w-5 text-green-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Link Token</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-gray-400 hover:text-white hover:bg-gray-800 rounded-full p-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Current Token Information */}
          {currentToken ? (
            <div className="bg-black border border-gray-700 rounded-lg p-4 space-y-4">
              <div className="flex items-center space-x-2 mb-3">
                <Coins className="h-4 w-4 text-green-400" />
                <span className="text-sm font-medium text-green-400">Current Token</span>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Symbol:</span>
                  <div className="flex items-center space-x-2">
                    {currentToken.logo && (
                      <img 
                        src={currentToken.logo} 
                        alt={`${currentToken.symbol} logo`}
                        className="w-5 h-5 rounded-full"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    )}
                    <span className="text-sm font-medium text-white">${currentToken.symbol}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Name:</span>
                  <span className="text-sm font-medium text-white">{currentToken.name}</span>
                </div>
                
                <div className="space-y-1">
                  <span className="text-sm text-gray-400">Contract Address:</span>
                  <div className="flex items-center space-x-2">
                    <code className="text-xs bg-gray-900 px-2 py-1 rounded border text-green-400 font-mono break-all flex-1">
                      {currentToken.address}
                    </code>
                    {currentToken.dexScreenerUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-green-400 hover:text-green-300 hover:bg-green-500/10 p-1"
                        onClick={() => window.open(currentToken.dexScreenerUrl, '_blank')}
                        title="View on DexScreener"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-2">
                <Button
                  onClick={() => {
                    onTokenRemove?.()
                    onClose()
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2.5"
                >
                  Unlink Token
                </Button>
                <Button
                  onClick={() => {
                    setContractAddress('')
                    setTokenInfo(null)
                    setError('')
                  }}
                  className="flex-1 border border-gray-600 cursor-pointer"
                >
                  Link Different Token
                </Button>
              </div>
            </div>
          ) : (
            /* Contract Address Input */
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white">
                Token Contract Address (CA)
              </label>
              <Input
                placeholder="Enter contract address (e.g., So11111111111111111111111111111111111111112)"
                value={contractAddress}
                onChange={(e) => handleAddressChange(e.target.value)}
                className={cn(
                  "mt-1 border-gray-700 focus-visible:border-gray-600 bg-black text-white",
                  error && "border-red-500"
                )}
                disabled={isLoading}
              />
              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
            </div>
          )}

          {/* Search Button - Only show when no current token */}
          {!currentToken && (
            <Button
              onClick={handleSubmit}
              disabled={!contractAddress.trim() || !isValidSolanaAddress(contractAddress) || isLoading}
              className="w-full border border-gray-600 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Fetching Token Info...
                </>
              ) : (
                'Fetch Token Information'
              )}
            </Button>
          )}

          {/* Token Information Display - Only show when no current token */}
          {!currentToken && tokenInfo && (
            <div className="bg-black border border-gray-700 rounded-lg p-4 space-y-4">
              <div className="flex items-center space-x-2 mb-3">
                <Coins className="h-4 w-4 text-green-400" />
                <span className="text-sm font-medium text-green-400">Token Found</span>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Symbol:</span>
                  <div className="flex items-center space-x-2">
                    {tokenInfo.logo && (
                      <img 
                        src={tokenInfo.logo} 
                        alt={`${tokenInfo.symbol} logo`}
                        className="w-5 h-5 rounded-full"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    )}
                    <span className="text-sm font-medium text-white">{tokenInfo.symbol}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Name:</span>
                  <span className="text-sm font-medium text-white">{tokenInfo.name}</span>
                </div>
                
                <div className="space-y-1">
                  <span className="text-sm text-gray-400">Contract Address:</span>
                  <div className="flex items-center space-x-2">
                    <code className="text-xs bg-gray-900 px-2 py-1 rounded border text-green-400 font-mono break-all flex-1">
                      {tokenInfo.address}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-green-400 hover:text-green-300 hover:bg-green-500/10 p-1"
                      onClick={() => window.open(tokenInfo.dexScreenerUrl || `https://dexscreener.com/solana/${tokenInfo.address}`, '_blank')}
                      title="View on DexScreener"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Confirm Button */}
              <Button
                onClick={handleTokenConfirm}
                className="w-full border border-gray-600 cursor-pointer"
              >
                Link This Token
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
