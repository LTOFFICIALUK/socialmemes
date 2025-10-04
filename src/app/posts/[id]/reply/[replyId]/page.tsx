import { getTrendingTokensWithImages } from '@/lib/database'
import { ReplyClient } from './reply-client'

interface ReplyPageProps {
  params: {
    id: string
    replyId: string
  }
}

export default async function ReplyPage({ params: { id, replyId } }: ReplyPageProps) {
  // Fetch trending tokens data server-side
  const trendingData = await getTrendingTokensWithImages(5, '24 hours')

  return (
    <ReplyClient 
      trendingTokens={trendingData.tokens}
      tokenImages={trendingData.tokenImages}
    />
  )
}