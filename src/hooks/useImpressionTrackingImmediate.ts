import { useEffect, useRef } from 'react'

interface UseImpressionTrackingImmediateProps {
  postId: string
  userId?: string
  enabled?: boolean
}

export const useImpressionTrackingImmediate = ({
  postId,
  userId,
  enabled = true
}: UseImpressionTrackingImmediateProps) => {
  const hasTrackedRef = useRef(false)

  useEffect(() => {
    if (!enabled || hasTrackedRef.current) {
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

    trackImpression()
  }, [postId, userId, enabled])
}

