'use client'

import React from 'react'
import { usePermissions, PermissionGuardProps } from '@/lib/hooks/use-permissions'

export function PermissionGuard({ 
  permission, 
  permissions,
  fallback = null, 
  children 
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, loading } = usePermissions()

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-8 rounded"></div>
  }

  const hasAccess = permission 
    ? hasPermission(permission)
    : permissions 
    ? hasAnyPermission(permissions)
    : false

  if (!hasAccess) {
    return <>{fallback}</>
  }

  return <>{children}</>
}