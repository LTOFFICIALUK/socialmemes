import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs))
}

export const formatDate = (date: string | Date) => {
  const now = new Date()
  const postDate = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - postDate.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return `${diffInSeconds}s`
  } else if (diffInSeconds < 3600) {
    return `${Math.floor(diffInSeconds / 60)}m`
  } else if (diffInSeconds < 86400) {
    return `${Math.floor(diffInSeconds / 3600)}h`
  } else if (diffInSeconds < 604800) {
    return `${Math.floor(diffInSeconds / 86400)}d`
  } else {
    return postDate.toLocaleDateString()
  }
}

export const formatNumber = (num: number | undefined | null): string => {
  if (num == null || isNaN(num)) {
    return '0'
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

export const getBestDexScreenerUrl = async (tokenAddress: string): Promise<string> => {
  try {
    // Use DexScreener API to fetch real token information
    const response = await fetch(`https://api.dexscreener.com/token-pairs/v1/solana/${tokenAddress}`)
    
    if (!response.ok) {
      // Fallback to simple URL if API fails
      return `https://dexscreener.com/solana/${tokenAddress}`
    }

    const data = await response.json()
    
    if (!Array.isArray(data) || data.length === 0) {
      // Fallback to simple URL if no pairs found
      return `https://dexscreener.com/solana/${tokenAddress}`
    }

    // Sort by recent volume to get the most active pair first
    // Priority: m5 (5min) > h1 (1hr) > h6 (6hr) > h24 (24hr)
    const sortedPairs = data.sort((a, b) => {
      // First try 5-minute volume
      const aVol5m = a.volume?.m5 || 0
      const bVol5m = b.volume?.m5 || 0
      if (aVol5m !== bVol5m) return bVol5m - aVol5m
      
      // Then try 1-hour volume
      const aVol1h = a.volume?.h1 || 0
      const bVol1h = b.volume?.h1 || 0
      if (aVol1h !== bVol1h) return bVol1h - aVol1h
      
      // Then try 6-hour volume
      const aVol6h = a.volume?.h6 || 0
      const bVol6h = b.volume?.h6 || 0
      if (aVol6h !== bVol6h) return bVol6h - aVol6h
      
      // Finally fall back to 24-hour volume
      return (b.volume?.h24 || 0) - (a.volume?.h24 || 0)
    })
    
    const primaryPair = sortedPairs[0]
    
    // Return the specific pair URL if available, otherwise fallback to token URL
    return primaryPair.url || `https://dexscreener.com/solana/${tokenAddress}`
  } catch (error) {
    console.error('Error fetching DexScreener URL:', error)
    // Fallback to simple URL on any error
    return `https://dexscreener.com/solana/${tokenAddress}`
  }
}
