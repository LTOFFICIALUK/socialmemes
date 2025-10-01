import { Suspense } from 'react'
import { getTrendingTokensWithImages } from '@/lib/database'
import { SearchClient } from './search-client'

export default async function SearchPage() {
  // Fetch trending tokens data server-side
  const trendingData = await getTrendingTokensWithImages(5, '24 hours')

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    }>
      <SearchClient 
        trendingTokens={trendingData.tokens}
        tokenImages={trendingData.tokenImages}
      />
    </Suspense>
  )
}