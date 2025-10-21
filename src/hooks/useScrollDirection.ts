import { useState, useEffect } from 'react'

interface ScrollDirection {
  direction: 'up' | 'down' | null
  isScrolled: boolean
}

export const useScrollDirection = (threshold: number = 10): ScrollDirection => {
  const [scrollDirection, setScrollDirection] = useState<ScrollDirection>({
    direction: null,
    isScrolled: false
  })

  useEffect(() => {
    let lastScrollY = window.pageYOffset
    let ticking = false

    const updateScrollDirection = () => {
      const scrollY = window.pageYOffset
      const direction = scrollY > lastScrollY ? 'down' : 'up'
      const isScrolled = scrollY > threshold

      // Only update if direction changed or scroll state changed
      if (
        direction !== scrollDirection.direction ||
        isScrolled !== scrollDirection.isScrolled ||
        scrollY < threshold
      ) {
        setScrollDirection({ direction, isScrolled })
      }
      lastScrollY = scrollY > 0 ? scrollY : 0
      ticking = false
    }

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateScrollDirection)
        ticking = true
      }
    }

    window.addEventListener('scroll', onScroll)

    return () => window.removeEventListener('scroll', onScroll)
  }, [scrollDirection.direction, scrollDirection.isScrolled, threshold])

  return scrollDirection
}


