'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, ExternalLink, Coins } from 'lucide-react'
import { getTrendingTokens, TrendingToken } from '@/lib/database'
import { formatNumber } from '@/lib/utils'

interface TrendingTokensProps {
  limit?: number
  timePeriod?: string
}

export const TrendingTokens = ({ limit = 10, timePeriod = '24 hours' }: TrendingTokensProps) => {
  const [trendingTokens, setTrendingTokens] = useState<TrendingToken[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadTrendingTokens = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const tokens = await getTrendingTokens(limit, timePeriod)
        setTrendingTokens(tokens)
      } catch (err) {
        console.error('Error loading trending tokens:', err)
        const errorMessage = err instanceof Error ? err.message : 'Failed to load trending tokens'
        setError(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }

    loadTrendingTokens()
  }, [limit, timePeriod])

  const handleTokenClick = (token: TrendingToken) => {
    if (token.dex_screener_url) {
      window.open(token.dex_screener_url, '_blank', 'noopener,noreferrer')
    }
  }

  const getTokenEmoji = (tokenSymbol: string): string => {
    const symbol = tokenSymbol.toLowerCase()
    if (symbol.includes('pepe')) return '🐸'
    if (symbol.includes('doge')) return '🐕'
    if (symbol.includes('shib')) return '🐕‍🦺'
    if (symbol.includes('moon')) return '🌙'
    if (symbol.includes('rocket')) return '🚀'
    if (symbol.includes('diamond')) return '💎'
    if (symbol.includes('fire')) return '🔥'
    if (symbol.includes('gem')) return '💎'
    if (symbol.includes('safe')) return '🛡️'
    if (symbol.includes('baby')) return '👶'
    return '🪙'
  }

  const getTrendingScore = (score: number): string => {
    if (score >= 50) return '+500%'
    if (score >= 30) return '+300%'
    if (score >= 20) return '+200%'
    if (score >= 10) return '+100%'
    if (score >= 5) return '+50%'
    return '+25%'
  }

  if (isLoading) {
    return null
  }

  if (error) {
    return (
      <div>
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (trendingTokens.length === 0) {
    return (
      <div>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800 text-center">
          <Coins className="h-8 w-8 text-gray-500 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">No trending tokens yet</p>
          <p className="text-gray-500 text-xs mt-1">Posts with tokens will appear here</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="space-y-3">
        {trendingTokens.map((token, index) => (
          <div 
            key={`${token.token_symbol}-${token.token_address}`}
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => handleTokenClick(token)}
          >
            <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center text-gray-300 font-bold text-sm">
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium text-white truncate">
                  ${token.token_symbol}
                </p>
                {token.dex_screener_url && (
                  <ExternalLink className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
