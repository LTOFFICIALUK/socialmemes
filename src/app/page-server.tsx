import { getTrendingTokensWithImages } from '@/lib/database'
import { HomeClient } from './home-client'

export default async function HomeServer() {
  // Fetch trending tokens data server-side
  const trendingData = await getTrendingTokensWithImages(5, '24 hours')

  return (
    <HomeClient 
      trendingTokens={trendingData.tokens}
      tokenImages={trendingData.tokenImages}
    />
  )
}
