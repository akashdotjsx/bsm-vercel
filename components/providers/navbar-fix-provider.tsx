"use client"

import { useEffect } from 'react'
import { setupNavbarFix } from '@/lib/utils/navbar-fix'

export function NavbarFixProvider({ children }: { children: React.ReactNode }) {
  // DISABLED: This was causing UI blocking issues after modal operations
  // useEffect(() => {
  //   const cleanup = setupNavbarFix()
  //   return cleanup
  // }, [])

  return <>{children}</>
}
