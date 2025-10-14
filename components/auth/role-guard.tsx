'use client'

import { useAuth } from '@/lib/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles?: string | string[]
  requireAuth?: boolean
  fallback?: React.ReactNode
  redirectTo?: string
}

export function RoleGuard({ 
  children, 
  allowedRoles = [], 
  requireAuth = true,
  fallback = null,
  redirectTo
}: RoleGuardProps) {
  const { user, profile, loading, hasRole } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      // If authentication is required but user is not logged in
      if (requireAuth && !user) {
        router.push('/auth/login')
        return
      }

      // If specific roles are required
      if (allowedRoles.length > 0 && profile && !hasRole(allowedRoles)) {
        if (redirectTo) {
          router.push(redirectTo)
        } else {
          // Default redirect based on user role
          switch (profile.role) {
            case 'user':
              router.push('/dashboard')
              break
            case 'agent':
              router.push('/tickets')
              break
            case 'manager':
              router.push('/dashboard')
              break
            case 'admin':
              router.push('/admin/dashboard')
              break
            default:
              router.push('/dashboard')
          }
        }
        return
      }
    }
  }, [loading, user, profile, requireAuth, allowedRoles, hasRole, router, redirectTo])

  // Show loading state with layout structure preserved
  if (loading) {
    return (
      <div className="h-full bg-background flex flex-col">
        <div className="h-12 bg-muted animate-pulse border-b" />
        <div className="flex flex-1 pt-0">
          <div className="w-64 border-r border-gray-200 h-[calc(100vh-3rem)] flex flex-col fixed left-0 top-12 z-40 bg-muted/50 animate-pulse" />
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

  // Check authentication
  if (requireAuth && !user) {
    return fallback || null
  }

  // Check role permissions
  if (allowedRoles.length > 0 && (!profile || !hasRole(allowedRoles))) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-[13px] font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-4">
            You don't have permission to access this page. 
            {profile && (
              <>
                <br />
                Current role: <strong>{profile.role}</strong>
              </>
            )}
          </p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

// Convenience components for common role checks
export function AdminOnly({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles="admin" fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

export function ManagerOrAdmin({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={['manager', 'admin']} fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

export function AgentOrAbove({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={['agent', 'manager', 'admin']} fallback={fallback}>
      {children}
    </RoleGuard>
  )
}