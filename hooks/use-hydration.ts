"use client"

import { useEffect, useState } from 'react'

/**
 * Hook to safely check if component is hydrated on client-side
 * Prevents hydration mismatches by ensuring client-only rendering
 */
export function useHydration() {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    // This only runs on client-side after hydration
    setIsHydrated(true)
  }, [])

  return isHydrated
}