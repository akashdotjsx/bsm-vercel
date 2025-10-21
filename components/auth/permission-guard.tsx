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