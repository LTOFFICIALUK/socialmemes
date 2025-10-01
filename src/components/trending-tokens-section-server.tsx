import { TrendingTokens } from '@/components/trending-tokens'
import { getTrendingTokensWithImages } from '@/lib/database'

export const TrendingTokensSectionServer = async () => {
  // Fetch trending tokens data server-side
  const { tokens: trendingTokens, tokenImages } = await getTrendingTokensWithImages(5, '24 hours')

  // Don't show the section if no tokens
  if (!trendingTokens || trendingTokens.length === 0) {
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