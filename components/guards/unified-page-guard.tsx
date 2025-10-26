'use client'

import React from 'react'
import { useAuth } from '@/lib/contexts/auth-context'
import { usePathname } from 'next/navigation'
import { hasPageAccess, PAGE_ACCESS_CONFIG } from '@/config/page-access.config'
import { Button } from '@/components/ui/button'
import { PageContent } from '@/components/layout/page-content'
import { ShieldCheck } from 'lucide-react'

interface UnifiedPageGuardProps {
  children: React.ReactNode
  pagePath?: string // Optional override, otherwise uses current path
}

/**
 * Unified Page Guard - Uses config/page-access.config.ts
 * 
 * This component checks if the current user has access to a page
 * based on the rules defined in the config file.
 */
export function UnifiedPageGuard({ children, pagePath }: UnifiedPageGuardProps) {
  const { user, profile, permissions, loading } = useAuth()
  const pathname = usePathname()
  const currentPath = pagePath || pathname

  // Show loading state
  if (loading) {
    return (
      <div className="h-full bg-background flex flex-col">
        <div className="h-12 bg-muted animate-pulse border-b" />
        <div className="flex flex-1 pt-0">
          <div className="w-64 border-r border-border h-[calc(100vh-3rem)] flex flex-col fixed left-0 top-12 z-40 bg-muted/50 animate-pulse" />
          <div className="flex-1 ml-64 p-6">
            <div className="space-y-4">
              <div className="h-8 bg-muted rounded animate-pulse w-1/3" />
              <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse" />
                <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!user || !profile) {
    return (
      <PageContent>
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <ShieldCheck className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
          <p className="text-muted-foreground mb-4">Please log in to access this page</p>
          <Button onClick={() => window.location.href = '/auth/login'}>Go to Login</Button>
        </div>
      </PageContent>
    )
  }

  // Check access using config
  const userRole = profile.role as 'admin' | 'manager' | 'agent' | 'user'
  const permissionNames = permissions.map(p => p.permission_name)
  const hasAccess = hasPageAccess(currentPath, userRole, permissionNames)

  // No access - show access denied
  if (!hasAccess) {
    const pageConfig = PAGE_ACCESS_CONFIG.find(config => 
      currentPath.startsWith(config.path)
    )

    return (
      <PageContent>
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <ShieldCheck className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-4">
            You do not have permission to access {pageConfig?.label || 'this page'}
          </p>
          <div className="flex gap-2">
            <Button onClick={() => window.history.back()} variant="outline">Go Back</Button>
            <Button onClick={() => window.location.href = '/dashboard'}>Go to Dashboard</Button>
          </div>
        </div>
      </PageContent>
    )
  }

  // Has access - render page
  return <>{children}</>
}
