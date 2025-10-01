import { getTrendingTokensWithImages } from '@/lib/database'
import { NotificationsClient } from './notifications-client'

export default async function NotificationsPage() {
  // Fetch trending tokens data server-side
  const trendingData = await getTrendingTokensWithImages(5, '24 hours')

  return (
    <NotificationsClient 
      trendingTokens={trendingData.tokens}
      tokenImages={trendingData.tokenImages}
    />
  )
}