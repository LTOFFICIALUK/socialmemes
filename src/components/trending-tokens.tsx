'use client'

import { TrendingUp, ExternalLink, Coins } from 'lucide-react'
import { TrendingToken } from '@/lib/database'
import { formatNumber, getBestDexScreenerUrl } from '@/lib/utils'

interface TrendingTokensProps {
  trendingTokens: TrendingToken[]
  tokenImages: Record<string, string>
}

export const TrendingTokens = ({ trendingTokens, tokenImages }: TrendingTokensProps) => {
  const handleTokenClick = async (token: TrendingToken) => {
    if (token.token_address) {
      try {
        const bestUrl = await getBestDexScreenerUrl(token.token_address)
        window.open(bestUrl, '_blank', 'noopener,noreferrer')
      } catch (error) {
        console.error('Error getting DexScreener URL:', error)
        // Fallback to stored URL if available
        if (token.dex_screener_url) {
          window.open(token.dex_screener_url, '_blank', 'noopener,noreferrer')
        }
      }
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

  const getRankTextColor = (index: number): string => {
    switch (index) {
      case 0: return 'text-yellow-400' // Gold for 1st place
      default: return 'text-white' // Default white for others
    }
  }

  if (trendingTokens.length === 0) {
    return null
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
            <div className="w-6 h-6 rounded-full flex items-center justify-center overflow-hidden">
              {token.token_address && tokenImages[token.token_address] ? (
                <img 
                  src={tokenImages[token.token_address]} 
                  alt={`${token.token_symbol} logo`}
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    // Fallback to emoji if image fails to load
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    const parent = target.parentElement
                    if (parent) {
                      parent.innerHTML = `<span class="text-xs">${getTokenEmoji(token.token_symbol)}</span>`
                    }
                  }}
                />
              ) : (
                <span className="text-xs">{getTokenEmoji(token.token_symbol)}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <p className={`text-sm font-medium truncate ${getRankTextColor(index)}`}>
                  ${token.token_symbol}
                </p>
                {token.token_address && (
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
