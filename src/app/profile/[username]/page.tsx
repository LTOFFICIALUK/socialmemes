import { getTrendingTokensWithImages } from '@/lib/database'
import { ProfileClient } from './profile-client'

interface ProfilePageProps {
  params: {
    username: string
  }
}

export default async function ProfilePage({ params: { username } }: ProfilePageProps) {
  // Fetch trending tokens data server-side
  const trendingData = await getTrendingTokensWithImages(5, '24 hours')

  return (
    <ProfileClient 
      trendingTokens={trendingData.tokens}
      tokenImages={trendingData.tokenImages}
    />
  )
}