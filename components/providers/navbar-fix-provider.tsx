"use client"

import { useEffect } from 'react'
import { setupNavbarFix } from '@/lib/utils/navbar-fix'

export function NavbarFixProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const cleanup = setupNavbarFix()
    return cleanup
  }, [])

  return <>{children}</>
}