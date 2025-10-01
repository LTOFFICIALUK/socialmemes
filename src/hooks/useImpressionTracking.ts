import { useEffect, useRef } from 'react'

interface UseImpressionTrackingProps {
  postId: string
  userId?: string
  enabled?: boolean
  threshold?: number
  delay?: number
}

export const useImpressionTracking = ({
  postId,
  userId,
  enabled = true,
  threshold = 0.5,
  delay = 1000
}: UseImpressionTrackingProps) => {
  const elementRef = useRef<HTMLElement>(null)
  const hasTrackedRef = useRef(false)
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  useEffect(() => {
    if (!enabled || hasTrackedRef.current || !elementRef.current) {
      return
    }

    const trackImpression = async () => {
      if (hasTrackedRef.current) return
      
      hasTrackedRef.current = true
      
      try {
        await fetch('/api/impressions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            post_id: postId,
            user_id: userId
          })
        })
      } catch (error) {
        console.error('Failed to track impression:', error)
        hasTrackedRef.current = false
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasTrackedRef.current) {
            timeoutRef.current = setTimeout(() => {
              trackImpression()
            }, delay)
          } else {
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current)
            }
          }
        })
      },
      { threshold }
    )

    observer.observe(elementRef.current)

    return () => {
      observer.disconnect()
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [postId, userId, enabled, threshold, delay])

  return elementRef
}

