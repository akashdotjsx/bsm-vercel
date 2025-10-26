'use client'

import { ReactNode } from 'react'
import { PermissionGuard } from './permission-guard'
import { PageContent } from '@/components/layout/page-content'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/contexts/auth-context'
import { useEffect } from 'react'

interface AdminPageGuardProps {
  children: ReactNode
  permission?: string
  requireAdmin?: boolean
}

/**
 * Wrapper component for admin pages
 * Automatically redirects non-admin users and shows permission error
 */
export function AdminPageGuard({ 
  children, 
  permission = 'administration.view',
  requireAdmin = false 
}: AdminPageGuardProps) {
  const router = useRouter()
  const { isAdmin, loading } = useAuth()

  useEffect(() => {
    // If page requires admin role specifically, redirect non-admins
    if (!loading && requireAdmin && !isAdmin) {
      router.push('/unauthorized')
    }
  }, [isAdmin, loading, requireAdmin, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <PermissionGuard 
      permission={permission}
      fallback={
        <PageContent 
          title="Access Denied" 
          description="You don't have permission to access this page"
        >
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <svg 
                className="w-8 h-8 text-red-600 dark:text-red-500" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-1.924-1.333-2.464 0L4.35 16.5c-.77 1.333.192 3 1.732 3z" 
                />
              </svg>
            </div>
            <div className="text-center space-y-2">
              <p className="text-lg font-semibold">This page requires administration permissions</p>
              <p className="text-sm text-muted-foreground">
                Contact your administrator if you need access
              </p>
            </div>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Go Back
            </button>
          </div>
        </PageContent>
      }
    >
      {children}
    </PermissionGuard>
  )
}
