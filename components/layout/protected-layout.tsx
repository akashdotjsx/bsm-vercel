'use client'

import { RoleGuard } from '@/components/auth/role-guard'
import { PlatformLayout } from '@/components/layout/platform-layout'

interface ProtectedLayoutProps {
  children: React.ReactNode
  allowedRoles?: string | string[]
  requireAuth?: boolean
  breadcrumb?: {
    label: string
    href?: string
  }[]
}

export function ProtectedLayout({ 
  children, 
  allowedRoles = [], 
  requireAuth = true,
  breadcrumb 
}: ProtectedLayoutProps) {
  return (
    <RoleGuard allowedRoles={allowedRoles} requireAuth={requireAuth}>
      <PlatformLayout breadcrumb={breadcrumb}>
        {children}
      </PlatformLayout>
    </RoleGuard>
  )
}

// Convenience layouts for different roles
export function AdminLayout({ children, breadcrumb }: { children: React.ReactNode; breadcrumb?: any }) {
  return (
    <ProtectedLayout allowedRoles="admin" breadcrumb={breadcrumb}>
      {children}
    </ProtectedLayout>
  )
}

export function ManagerLayout({ children, breadcrumb }: { children: React.ReactNode; breadcrumb?: any }) {
  return (
    <ProtectedLayout allowedRoles={['manager', 'admin']} breadcrumb={breadcrumb}>
      {children}
    </ProtectedLayout>
  )
}

export function AgentLayout({ children, breadcrumb }: { children: React.ReactNode; breadcrumb?: any }) {
  return (
    <ProtectedLayout allowedRoles={['agent', 'manager', 'admin']} breadcrumb={breadcrumb}>
      {children}
    </ProtectedLayout>
  )
}