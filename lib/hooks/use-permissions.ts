import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/contexts/auth-context'
import { rbacApi } from '@/lib/api/rbac'
import type { UserPermissionsResponse } from '@/lib/types/rbac'

export interface UsePermissionsResult {
  permissions: UserPermissionsResponse[]
  loading: boolean
  error: string | null
  hasPermission: (permissionName: string) => boolean
  hasAnyPermission: (permissionNames: string[]) => boolean
  hasAllPermissions: (permissionNames: string[]) => boolean
  canView: (module: string) => boolean
  canEdit: (module: string) => boolean
  canFullEdit: (module: string) => boolean
  canCreate: (module: string) => boolean
  canDelete: (module: string) => boolean
  refresh: () => Promise<void>
}

export function usePermissions(): UsePermissionsResult {
  const { user } = useAuth()
  const [permissions, setPermissions] = useState<UserPermissionsResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPermissions = async () => {
    if (!user) {
      setPermissions([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const userPermissions = await rbacApi.getCurrentUserPermissions()
      setPermissions(userPermissions.filter(p => p.granted))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load permissions')
      console.error('Error loading permissions:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPermissions()
  }, [user])

  const hasPermission = (permissionName: string): boolean => {
    return permissions.some(p => p.permission_name === permissionName && p.granted)
  }

  const hasAnyPermission = (permissionNames: string[]): boolean => {
    return permissionNames.some(name => hasPermission(name))
  }

  const hasAllPermissions = (permissionNames: string[]): boolean => {
    return permissionNames.every(name => hasPermission(name))
  }

  const canView = (module: string): boolean => {
    return hasAnyPermission([
      `${module}.view`,
      `${module}.edit`, 
      `${module}.full_edit`
    ])
  }

  const canEdit = (module: string): boolean => {
    return hasAnyPermission([
      `${module}.edit`,
      `${module}.full_edit`
    ])
  }

  const canFullEdit = (module: string): boolean => {
    return hasPermission(`${module}.full_edit`)
  }

  const canCreate = (module: string): boolean => {
    return hasPermission(`${module}.create`)
  }

  const canDelete = (module: string): boolean => {
    return hasAnyPermission([
      `${module}.delete`,
      `${module}.full_edit`
    ])
  }

  return {
    permissions,
    loading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canView,
    canEdit,
    canFullEdit,
    canCreate,
    canDelete,
    refresh: loadPermissions
  }
}

// Specialized hooks for common permission patterns
export function useModulePermissions(module: string) {
  const { hasPermission, canView, canEdit, canFullEdit, canCreate, canDelete, loading } = usePermissions()
  
  return {
    loading,
    canView: canView(module),
    canEdit: canEdit(module),
    canFullEdit: canFullEdit(module),
    canCreate: canCreate(module),
    canDelete: canDelete(module),
    hasView: hasPermission(`${module}.view`),
    hasEdit: hasPermission(`${module}.edit`),
    hasFullEdit: hasPermission(`${module}.full_edit`),
    hasCreate: hasPermission(`${module}.create`),
    hasDeletePerm: hasPermission(`${module}.delete`)
  }
}

// Permission guard types for the separate component file
export interface PermissionGuardProps {
  permission?: string
  permissions?: string[]
  fallback?: React.ReactNode
  children: React.ReactNode
}
