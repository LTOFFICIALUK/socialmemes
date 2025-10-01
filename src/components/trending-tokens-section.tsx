'use client'

import { useState, useEffect } from 'react'
import { TrendingTokens } from '@/components/trending-tokens'
import { TrendingToken } from '@/lib/database'

export const TrendingTokensSection = () => {
  const [trendingTokens, setTrendingTokens] = useState<TrendingToken[]>([])
  const [tokenImages, setTokenImages] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTrendingTokens = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const response = await fetch('/api/trending-tokens?limit=5&timePeriod=24%20hours')
        
        if (!response.ok) {
          throw new Error('Failed to fetch trending tokens')
        }
        
        const data = await response.json()
        setTrendingTokens(data.tokens || [])
        setTokenImages(data.tokenImages || {})
      } catch (err) {
        console.error('Error fetching trending tokens:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch trending tokens')
        setTrendingTokens([])
        setTokenImages({})
      } finally {
        setIsLoading(false)
      }
    }

    fetchTrendingTokens()
  }, [])

  // Don't show the section if loading, error, or no tokens
  if (isLoading || error || !trendingTokens || trendingTokens.length === 0) {
    return null
  }

  return (
    <div className="bg-black rounded-xl border border-gray-800">
      <div className="bg-black backdrop-blur-sm px-4 py-3 rounded-t-xl">
        <h2 className="text-lg font-bold text-white">Trending Tokens</h2>
      </div>
      
      <div className="px-4 pb-4 pt-1">
        <TrendingTokens 
          trendingTokens={trendingTokens}
          tokenImages={tokenImages}
        />
      </div>
    </div>
  )
}
