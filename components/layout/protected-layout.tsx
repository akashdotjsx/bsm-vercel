'use client'

import Link from 'next/link'
import { RoleGuard } from '@/components/auth/role-guard'
import { PlatformLayout } from '@/components/layout/platform-layout'
import { PermissionGuard } from '@/components/auth/permission-guard'

interface ProtectedLayoutProps {
  children: React.ReactNode
  allowedRoles?: string | string[]
  requiredPermissions?: string | string[]
  requireAuth?: boolean
  breadcrumb?: {
    label: string
    href?: string
  }[]
  title?: string
  description?: string
  breadcrumbs?: { label: string; href?: string }[]
}

export function ProtectedLayout({ 
  children, 
  allowedRoles = [], 
  requiredPermissions,
  requireAuth = true,
  breadcrumb,
  title,
  description,
  breadcrumbs
}: ProtectedLayoutProps) {
  if (requiredPermissions) {
    // Use permission-based protection
    const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions]
    return (
      <PermissionGuard 
        permissions={permissions} 
        fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <h1 className="text-[13px] font-bold text-foreground mb-4">Access Denied</h1>
              <p className="text-muted-foreground mb-4">You don't have permission to access this page.</p>
              <Link href="/dashboard" className="text-blue-600 hover:underline">Return to Dashboard</Link>
            </div>
          </div>
        }
      >
        <PlatformLayout breadcrumb={breadcrumb}>
          {children}
        </PlatformLayout>
      </PermissionGuard>
    )
  }
  
  // Use role-based protection (legacy)
  return (
    <RoleGuard allowedRoles={allowedRoles} requireAuth={requireAuth}>
      <PlatformLayout breadcrumb={breadcrumb}>
        {children}
      </PlatformLayout>
    </RoleGuard>
  )
}

// Permission-based layouts
export function AdminLayout({ 
  children, 
  breadcrumb, 
  title, 
  description, 
  breadcrumbs 
}: { 
  children: React.ReactNode
  breadcrumb?: any
  title?: string
  description?: string
  breadcrumbs?: { label: string; href?: string }[]
}) {
  return (
    <ProtectedLayout requiredPermissions={['administration.view', 'users.view']} breadcrumb={breadcrumb}>
      <div className="space-y-6">
        {(title || description || breadcrumbs) && (
          <div className="space-y-2">
            {breadcrumbs && (
              <nav className="text-sm">
                {breadcrumbs.map((crumb, index) => (
                  <span key={crumb.label}>
                    {crumb.href ? (
                      <Link href={crumb.href} className="text-muted-foreground hover:text-foreground">
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="text-foreground">{crumb.label}</span>
                    )}
                    {index < breadcrumbs.length - 1 && (
                      <span className="mx-2 text-muted-foreground">/</span>
                    )}
                  </span>
                ))}
              </nav>
            )}
            {title && <h1 className="text-[13px] font-bold">{title}</h1>}
            {description && <p className="text-muted-foreground">{description}</p>}
          </div>
        )}
        {children}
      </div>
    </ProtectedLayout>
  )
}

export function ManagerLayout({ children, breadcrumb }: { children: React.ReactNode; breadcrumb?: any }) {
  return (
    <ProtectedLayout requiredPermissions={['users.view', 'analytics.view']} breadcrumb={breadcrumb}>
      {children}
    </ProtectedLayout>
  )
}

export function AgentLayout({ children, breadcrumb }: { children: React.ReactNode; breadcrumb?: any }) {
  return (
    <ProtectedLayout requiredPermissions={['tickets.view', 'services.view']} breadcrumb={breadcrumb}>
      {children}
    </ProtectedLayout>
  )
}
