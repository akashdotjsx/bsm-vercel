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

  // Debug logging
  console.log('🏗️ AuthProvider render - Current state:', {
    user: user?.email || 'null',
    profile: profile?.display_name || 'null',
    organization: organization?.name || 'null',
    loading
  })

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      console.log('🔍 Fetching profile for user ID:', userId)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('❌ Error fetching profile:', error)
        return null
      }

      console.log('✅ Profile fetched successfully:', data)
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
      console.log('🔐 Starting to load permissions for user:', userId)
      console.log('🔐 RBAC API available:', !!rbacApi)
      setPermissionsLoading(true)
      
      console.log('🔐 Calling getUserPermissions...')
      const userPermissionsPromise = rbacApi.getUserPermissions(userId)
      console.log('🔐 Calling getUserRoles...')
      const userRolesPromise = rbacApi.getUserRoles(userId)
      
      const [userPermissions, roles] = await Promise.all([
        userPermissionsPromise,
        userRolesPromise
      ])
      
      console.log('🔐 Raw permissions received:', userPermissions)
      console.log('🔐 User roles received:', roles)
      console.log('🔐 Permissions type:', typeof userPermissions, 'Array?', Array.isArray(userPermissions))
      console.log('🔐 Roles type:', typeof roles, 'Array?', Array.isArray(roles))
      
      if (!Array.isArray(userPermissions)) {
        console.error('❌ userPermissions is not an array:', userPermissions)
        throw new Error('Invalid permissions response')
      }
      
      const grantedPermissions = userPermissions.filter(p => p && p.granted === true)
      console.log('🔐 Granted permissions count:', grantedPermissions.length)
      console.log('🔐 First 5 granted permissions:', grantedPermissions.slice(0, 5))
      
      setPermissions(grantedPermissions)
      setUserRoles(Array.isArray(roles) ? roles : [])
      
      console.log('🔐 Permissions state updated - new count:', grantedPermissions.length)
    } catch (error) {
      console.error('❌ Error loading user permissions:', error)
      console.error('❌ Error details:', error instanceof Error ? error.message : String(error))
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack')
      setPermissions([])
      setUserRoles([])
    } finally {
      console.log('🔐 Setting permissionsLoading to false')
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
    const result = permissions.some(p => p.permission_name === permissionName && p.granted)
    console.log(`🔐 hasPermission('${permissionName}'):`, result, 'permissions count:', permissions.length)
    return result
  }

  const hasAnyPermission = (permissionNames: string[]): boolean => {
    return permissionNames.some(name => hasPermission(name))
  }

  const canView = (module: string): boolean => {
    const result = hasAnyPermission([
      `${module}.view`,
      `${module}.edit`, 
      `${module}.full_edit`
    ])
    console.log(`🔐 canView('${module}'):`, result)
    return result
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
    console.log('🔄 AuthProvider useEffect starting...', { isMounted })
    
    // Check if we're in browser (client-side)
    if (typeof window === 'undefined') {
      console.log('❌ Server-side rendering detected, skipping auth init')
      return
    }
    
    // Check localStorage for existing session data
    const checkLocalStorage = () => {
      try {
        console.log('🗄️ Checking localStorage...')
        const keys = Object.keys(localStorage).filter(key => key.includes('supabase'))
        console.log('🗄️ LocalStorage supabase keys:', keys)
        keys.forEach(key => {
          const value = localStorage.getItem(key)
          console.log(`🔑 ${key}:`, value ? 'exists' : 'null')
        })
      } catch (error) {
        console.error('❌ Error checking localStorage:', error)
      }
    }
    
    checkLocalStorage()
    
    // Get initial session
    const getSession = async () => {
      try {
        console.log('🔍 Getting initial session...', { isMounted })
        console.log('🔍 Supabase client:', !!supabase)
        
        const sessionResult = await supabase.auth.getSession()
        console.log('📋 Initial session result:', { 
          hasData: !!sessionResult.data, 
          hasSession: !!sessionResult.data.session, 
          error: sessionResult.error, 
          user: sessionResult.data.session?.user?.email 
        })
        
        const { data: { session }, error } = sessionResult
        
        if (error) {
          console.error('❌ Error getting session:', error)
          throw error
        }
        
        if (session?.user && isMounted) {
          console.log('✅ Initial session found for user:', session.user.email, 'ID:', session.user.id)
          setUser(session.user)
          
          console.log('🔍 Fetching profile for user ID:', session.user.id)
          const userProfile = await fetchProfile(session.user.id)
          
          if (isMounted) {
            console.log('👤 Profile fetch result:', userProfile ? userProfile.display_name : 'null')
            setProfile(userProfile)
            
            if (userProfile?.organization_id) {
              console.log('🏢 Fetching organization:', userProfile.organization_id)
              const org = await fetchOrganization(userProfile.organization_id)
              if (isMounted) {
                console.log('🏢 Organization fetch result:', org ? org.name : 'null')
                setOrganization(org)
              }
            }
            
            // Load permissions and roles
            console.log('🔐 Starting permission loading for user:', session.user.id)
            try {
              await loadUserPermissions(session.user.id)
              console.log('🔐 Permission loading completed')
            } catch (permError) {
              console.error('❌ Error loading permissions:', permError)
            }
          }
        } else {
          console.log('❌ No initial session found', { hasSession: !!session, isMounted })
        }
      } catch (error) {
        console.error('💥 Error in getSession:', error)
        console.error('💥 Error stack:', error instanceof Error ? error.stack : 'No stack')
      } finally {
        if (isMounted) {
          console.log('⏹️ Setting loading to false')
          setLoading(false)
        } else {
          console.log('⏹️ Component unmounted, not setting loading to false')
        }
      }
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        
        if (session?.user) {
          console.log('🔄 Auth state changed - setting user:', session.user.email)
          setUser(session.user)
          const userProfile = await fetchProfile(session.user.id)
          console.log('🔄 Auth state changed - profile set to:', userProfile)
          setProfile(userProfile)

          if (userProfile?.organization_id) {
            const org = await fetchOrganization(userProfile.organization_id)
            setOrganization(org)
          }
          
          // Load permissions and roles
          await loadUserPermissions(session.user.id)
        } else {
          console.log('🔄 Auth state changed - clearing user data')
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