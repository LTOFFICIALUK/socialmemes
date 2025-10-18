'use client'

import { useState, useEffect, useRef } from 'react'
import { getFeaturedTokens, FeaturedToken } from '@/lib/database'

interface FeaturedTokensProps {
  limit?: number
}

export const FeaturedTokens = ({ limit = 6 }: FeaturedTokensProps) => {
  const [featuredTokens, setFeaturedTokens] = useState<FeaturedToken[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const loadFeaturedTokens = async () => {
      try {
        setIsLoading(true)
        const tokens = await getFeaturedTokens(limit)
        setFeaturedTokens(tokens)
      } catch (err) {
        console.error('Error loading featured tokens:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadFeaturedTokens()
  }, [limit])

  // Auto-swipe animation
  useEffect(() => {
    if (featuredTokens.length > 1 && !isHovered) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % featuredTokens.length
          return nextIndex
        })
      }, 5000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [featuredTokens.length, isHovered])

  // Reset to first slide when tokens change
  useEffect(() => {
    setCurrentIndex(0)
  }, [featuredTokens.length])

  const handleTokenClick = (destinationUrl: string) => {
    window.open(destinationUrl, '_blank', 'noopener,noreferrer')
  }

  const handleMouseEnter = () => {
    setIsHovered(true)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
  }

  // Touch event handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe && featuredTokens.length > 1) {
      // Swipe left - go to next token
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % featuredTokens.length
        return nextIndex
      })
    }
    
    if (isRightSwipe && featuredTokens.length > 1) {
      // Swipe right - go to previous token
      setCurrentIndex((prevIndex) => {
        const prevIndexValue = prevIndex - 1
        return prevIndexValue < 0 ? featuredTokens.length - 1 : prevIndexValue
      })
    }
  }

  if (isLoading) {
    return null
  }

  if (featuredTokens.length === 0) {
    return null
  }

  // Single token - no animation needed
  if (featuredTokens.length === 1) {
    return (
      <div className="mt-4">
        <div
          onClick={() => handleTokenClick(featuredTokens[0].destination_url)}
          className="relative w-80 h-80 mx-auto rounded-lg overflow-hidden cursor-pointer group border border-white transition-all duration-300"
          role="button"
          tabIndex={0}
          aria-label={featuredTokens[0].title || 'Featured token promotion'}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleTokenClick(featuredTokens[0].destination_url)
            }
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <img
            src={featuredTokens[0].image_url}
            alt={featuredTokens[0].title || 'Featured token'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      </div>
    )
  }

  // Multiple tokens - with swipe animation
  return (
    <div className="mt-4">
        <div
          className="relative w-80 h-80 mx-auto overflow-hidden rounded-lg"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="flex transition-transform duration-500 ease-in-out h-full"
            style={{
              transform: `translateX(-${currentIndex * 320}px)`, // 320px = w-80
              width: `${featuredTokens.length * 320}px`, // 320px = w-80
              height: '100%'
            }}
          >
            {featuredTokens.map((token) => {
              return (
                <div
                  key={token.id}
                  className="relative w-80 h-80 flex-shrink-0"
                >
                <div
                  onClick={() => handleTokenClick(token.destination_url)}
                  className="relative w-full h-full rounded-lg overflow-hidden cursor-pointer group border border-white transition-all duration-300"
                  style={{ 
                    backgroundColor: '#1f2937' // bg-gray-800 equivalent
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={token.title || 'Featured token promotion'}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleTokenClick(token.destination_url)
                    }
                  }}
                >
                  <img
                    src={token.image_url}
                    alt={token.title || 'Featured token'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      // Try to reload the image
                      const img = e.target as HTMLImageElement
                      img.src = token.image_url + '?retry=' + Date.now()
                    }}
                  />
                  
                  {/* Fallback content for when image fails to load */}
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-700 text-white text-sm opacity-0 transition-opacity">
                    <span>{token.title || 'Featured Token'}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}

