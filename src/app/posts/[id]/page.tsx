import { getTrendingTokensWithImages } from '@/lib/database'
import { PostClient } from './post-client'

interface PostPageProps {
  params: {
    id: string
  }
}

export default async function PostPage({ params }: PostPageProps) {
  // Fetch trending tokens data server-side
  const trendingData = await getTrendingTokensWithImages(5, '24 hours')

  return (
    <PostClient 
      trendingTokens={trendingData.tokens}
      tokenImages={trendingData.tokenImages}
    />
  )
}