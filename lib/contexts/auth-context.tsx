'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { rbacApi } from '@/lib/api/rbac'
import type { UserPermissionsResponse, UserRole } from '@/lib/types/rbac'

// Create a single instance of the client to be used throughout the auth context
const supabase = createClient()

interface Profile {
  id: string
  organization_id: string
  email: string
  first_name: string
  last_name: string
  display_name: string
  avatar_url: string | null
  phone: string | null
  role: 'admin' | 'manager' | 'agent' | 'user'
  department: string | null
  manager_id: string | null
  timezone: string
  is_active: boolean
  last_login: string | null
  preferences: Record<string, any>
  created_at: string
  updated_at: string
}

interface Organization {
  id: string
  name: string
  domain: string
  settings: Record<string, any>
  subscription_tier: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  organization: Organization | null
  permissions: UserPermissionsResponse[]
  userRoles: UserRole[]
  loading: boolean
  permissionsLoading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  refreshPermissions: () => Promise<void>
  hasRole: (roles: string | string[]) => boolean
  hasPermission: (permissionName: string) => boolean
  hasAnyPermission: (permissionNames: string[]) => boolean
  canView: (module: string) => boolean
  canEdit: (module: string) => boolean
  canFullEdit: (module: string) => boolean
  canCreate: (module: string) => boolean
  canDelete: (module: string) => boolean
  isAdmin: boolean
  isManager: boolean
  isAgent: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [permissions, setPermissions] = useState<UserPermissionsResponse[]>([])
  const [userRoles, setUserRoles] = useState<UserRole[]>([])
  const [loading, setLoading] = useState(true)
  const [permissionsLoading, setPermissionsLoading] = useState(false)


  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error fetching profile:', error)
      return null
    }
  }

  const fetchOrganization = async (organizationId: string): Promise<Organization | null> => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .single()

      if (error) {
        console.error('Error fetching organization:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error fetching organization:', error)
      return null
    }
  }

  const loadUserPermissions = async (userId: string) => {
    try {
      setPermissionsLoading(true)
      const [userPermissions, roles] = await Promise.all([
        rbacApi.getUserPermissions(userId),
        rbacApi.getUserRoles(userId)
      ])
      
      if (!Array.isArray(userPermissions)) {
        throw new Error('Invalid permissions response')
      }
      
      const grantedPermissions = userPermissions.filter(p => p && p.granted === true)
      setPermissions(grantedPermissions)
      setUserRoles(Array.isArray(roles) ? roles : [])
    } catch (error) {
      console.error('Error loading user permissions:', error)
      setPermissions([])
      setUserRoles([])
    } finally {
      setPermissionsLoading(false)
    }
  }

  const refreshProfile = async () => {
    if (user) {
      const updatedProfile = await fetchProfile(user.id)
      setProfile(updatedProfile)

      if (updatedProfile?.organization_id) {
        const org = await fetchOrganization(updatedProfile.organization_id)
        setOrganization(org)
      }
      
      // Load user permissions and roles
      await loadUserPermissions(user.id)
    }
  }

  const refreshPermissions = async () => {
    if (user) {
      await loadUserPermissions(user.id)
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Error signing out:', error)
      }
      // Clear all state immediately
      setUser(null)
      setProfile(null)
      setOrganization(null)
      setPermissions([])
      setUserRoles([])
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  // Permission checking functions
  const hasPermission = (permissionName: string): boolean => {
    return permissions.some(p => p.permission_name === permissionName && p.granted)
  }

  const hasAnyPermission = (permissionNames: string[]): boolean => {
    return permissionNames.some(name => hasPermission(name))
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

  // Legacy role checking (for backward compatibility)
  const hasRole = (roles: string | string[]): boolean => {
    if (!profile) return false
    
    const roleArray = Array.isArray(roles) ? roles : [roles]
    return roleArray.includes(profile.role)
  }

  // Convenience role checks based on permissions
  const isAdmin = hasPermission('administration.full_edit') || profile?.role === 'admin'
  const isManager = hasAnyPermission(['users.view', 'analytics.view']) || profile?.role === 'manager' || profile?.role === 'admin'
  const isAgent = hasAnyPermission(['tickets.edit', 'services.edit']) || profile?.role === 'agent' || profile?.role === 'manager' || profile?.role === 'admin'

  useEffect(() => {
    let isMounted = true
    
    // Check if we're in browser (client-side)
    if (typeof window === 'undefined') {
      return
    }
    
    // Get initial session
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          throw error
        }
        
        if (session?.user && isMounted) {
          setUser(session.user)
          const userProfile = await fetchProfile(session.user.id)
          
          if (isMounted) {
            setProfile(userProfile)
            
            if (userProfile?.organization_id) {
              const org = await fetchOrganization(userProfile.organization_id)
              if (isMounted) {
                setOrganization(org)
              }
            }
            
            // Load permissions and roles
            await loadUserPermissions(session.user.id)
          }
        }
      } catch (error) {
        console.error('Error in getSession:', error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user)
          const userProfile = await fetchProfile(session.user.id)
          setProfile(userProfile)

          if (userProfile?.organization_id) {
            const org = await fetchOrganization(userProfile.organization_id)
            setOrganization(org)
          }
          
          // Load permissions and roles
          await loadUserPermissions(session.user.id)
        } else {
          setUser(null)
          setProfile(null)
          setOrganization(null)
          setPermissions([])
          setUserRoles([])
        }

        setLoading(false)
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const value = {
    user,
    profile,
    organization,
    permissions,
    userRoles,
    loading,
    permissionsLoading,
    signOut,
    refreshProfile,
    refreshPermissions,
    hasRole,
    hasPermission,
    hasAnyPermission,
    canView,
    canEdit,
    canFullEdit,
    canCreate,
    canDelete,
    isAdmin,
    isManager,
    isAgent,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Export types
export type { Profile, Organization }