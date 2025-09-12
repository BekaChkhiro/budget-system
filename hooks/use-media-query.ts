'use client'

import { useState, useEffect } from 'react'

/**
 * Custom hook for media queries with SSR support
 * @param query - Media query string (e.g., '(max-width: 768px)')
 * @returns boolean - Whether the media query matches
 */
export function useMediaQuery(query: string): boolean {
  // Initialize with false to prevent hydration mismatch
  const [matches, setMatches] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Create media query list
    const mediaQuery = window.matchMedia(query)
    
    // Set initial value
    setMatches(mediaQuery.matches)
    
    // Create event listener function
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }
    
    // Add listener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', listener)
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(listener)
    }
    
    // Cleanup function
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', listener)
      } else {
        // Fallback for older browsers
        mediaQuery.removeListener(listener)
      }
    }
  }, [query])

  // Return false during SSR and initial render to prevent hydration mismatch
  if (!mounted) {
    return false
  }

  return matches
}

/**
 * Predefined breakpoint hooks
 */
export const useIsMobile = () => useMediaQuery('(max-width: 768px)')
export const useIsTablet = () => useMediaQuery('(min-width: 769px) and (max-width: 1024px)')
export const useIsDesktop = () => useMediaQuery('(min-width: 1025px)')
export const useIsTouchDevice = () => useMediaQuery('(hover: none) and (pointer: coarse)')

/**
 * Screen size categories
 */
export const useScreenSize = () => {
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  const isDesktop = useIsDesktop()

  if (isMobile) return 'mobile'
  if (isTablet) return 'tablet'
  if (isDesktop) return 'desktop'
  return 'unknown'
}