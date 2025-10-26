'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { rbacApi } from '@/lib/api/rbac'
import type { UserPermissionsResponse, UserRole } from '@/lib/types/rbac'
import { useHydration } from '@/hooks/use-hydration'
import dynamic from 'next/dynamic'

// Dynamic import to prevent SSR hydration issues
const KrooloMainLoader = dynamic(
  () => import('@/components/common/kroolo-main-loader').catch(() => {
    // Fallback if import fails
    return { default: () => <div className="min-h-screen bg-background" /> }
  }),
  {
    ssr: false,
    loading: () => <div className="min-h-screen bg-background" />
  }
)

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
  status: string
  status_color: string
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
  organizationId: string | null
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

// Session storage keys
const AUTH_CACHE_KEY = 'kroolo_auth_cache'
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

interface AuthCache {
  profile: Profile | null
  organization: Organization | null
  permissions: UserPermissionsResponse[]
  userRoles: UserRole[]
  timestamp: number
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Try to load from cache immediately to prevent flash (memoized)
  const cachedAuth = React.useMemo(() => {
    if (typeof window === 'undefined') return null
    try {
      const cached = sessionStorage.getItem(AUTH_CACHE_KEY)
      if (!cached) return null
      const data = JSON.parse(cached) as AuthCache
      // Check if cache is still valid (within 5 minutes)
      if (Date.now() - data.timestamp > CACHE_DURATION) {
        sessionStorage.removeItem(AUTH_CACHE_KEY)
        return null
      }
      console.log('🚀 Loaded cached auth - NO FLASH!')
      return data
    } catch {
      return null
    }
  }, [])
  
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(cachedAuth?.profile || null)
  const [organization, setOrganization] = useState<Organization | null>(cachedAuth?.organization || null)
  const [permissions, setPermissions] = useState<UserPermissionsResponse[]>(cachedAuth?.permissions || [])
  const [userRoles, setUserRoles] = useState<UserRole[]>(cachedAuth?.userRoles || [])
  const [loading, setLoading] = useState(!cachedAuth) // If we have cache, don't show loading
  const [permissionsLoading, setPermissionsLoading] = useState(false)
  const [initialized, setInitialized] = useState(!!cachedAuth)
  const isHydrated = useHydration()


  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      // Add timeout to prevent hanging
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5s timeout
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      clearTimeout(timeoutId)

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

  // Cache auth data to prevent flashes on navigation
  const cacheAuthData = (profile: Profile | null, org: Organization | null, perms: UserPermissionsResponse[], roles: UserRole[]) => {
    if (typeof window === 'undefined') return
    try {
      const cache: AuthCache = {
        profile,
        organization: org,
        permissions: perms,
        userRoles: roles,
        timestamp: Date.now()
      }
      sessionStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(cache))
    } catch (err) {
      console.error('Failed to cache auth data:', err)
    }
  }

  // Parallel data loading - profile is blocking, organization is background
  const loadUserData = async (userId: string) => {
    try {
      // Fetch critical user data in parallel
      const [userProfile, userPermissions, roles] = await Promise.all([
        fetchProfile(userId),
        rbacApi.getUserPermissions(userId),
        rbacApi.getUserRoles(userId)
      ])

      // Set profile FIRST (this unblocks the app)
      if (userProfile) {
        setProfile(userProfile)
        
        // Set permissions immediately
        const grantedPermissions = Array.isArray(userPermissions) 
          ? userPermissions.filter(p => p && p.granted === true)
          : []
        setPermissions(grantedPermissions)
        setUserRoles(Array.isArray(roles) ? roles : [])
        
        // Fetch organization in BACKGROUND (non-blocking)
        if (userProfile.organization_id) {
          fetchOrganization(userProfile.organization_id)
            .then(org => {
              if (org) {
                setOrganization(org)
                // Cache after organization is loaded
                cacheAuthData(userProfile, org, grantedPermissions, Array.isArray(roles) ? roles : [])
              }
            })
            .catch(err => console.error('Organization fetch failed:', err))
        } else {
          // Cache even without organization
          cacheAuthData(userProfile, null, grantedPermissions, Array.isArray(roles) ? roles : [])
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error)
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
      // Actively clear the Supabase session so middleware/client both see logged-out state
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Error signing out from Supabase:', error)
    } finally {
      // Always clear local auth state
      setUser(null)
      setProfile(null)
      setOrganization(null)
      setPermissions([])
      setUserRoles([])
      // Clear session cache
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(AUTH_CACHE_KEY)
      }
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
      setLoading(false)
      return
    }
    
    // If we have cached data, skip loading state entirely
    if (cachedAuth) {
      console.log('✅ Using cached auth data - skipping auth check')
      // Still verify session in background but don't block
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user && isMounted) {
          setUser(session.user)
          // Refresh data in background
          loadUserData(session.user.id).catch(err => console.error('Background refresh failed:', err))
        } else if (!session?.user && isMounted) {
          // Session expired, clear cache
          sessionStorage.removeItem(AUTH_CACHE_KEY)
          setProfile(null)
          setOrganization(null)
          setPermissions([])
          setUserRoles([])
        }
      })
      return // Don't run the rest of the effect
    }
    
    // Safety timeout - aggressive for better UX
    const emergencyTimeout = setTimeout(() => {
      if (isMounted && loading) {
        console.error('❌ Auth timeout - force completing to prevent infinite loading')
        setLoading(false)
        setInitialized(true)
        // If we have user but no profile, still allow render
        if (user && !profile) {
          console.warn('⚠️ Rendering without profile due to timeout')
        }
      }
    }, 1500) // 1.5s timeout - aggressive to prevent stuck loading
    
    // Get initial session
    const getSession = async () => {
      try {
        console.log('🔍 Getting initial session...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('❌ Error getting session:', error)
          if (isMounted) {
            setLoading(false)
            setInitialized(true)
            setAuthCheckComplete(true)
          }
          return
        }
        
        if (session?.user && isMounted) {
          console.log('✅ User found, loading profile...', session.user.email)
          setUser(session.user)
          setAuthCheckComplete(true) // Auth check is done, we know user exists
          
          // Load profile data in background (DON'T AWAIT - prevents blocking)
          loadUserData(session.user.id)
            .catch(err => console.error('Failed to load user data:', err))
            
        } else if (isMounted && !session?.user) {
          console.log('❌ No user session found')
          // Clear state when no user
          setUser(null)
          setProfile(null)
          setOrganization(null)
          setPermissions([])
          setUserRoles([])
          setAuthCheckComplete(true)
        }
      } catch (error) {
        console.error('❌ Error in getSession:', error)
      } finally {
        if (isMounted) {
          console.log('✅ Auth initialization complete')
          setLoading(false)
          setInitialized(true)
          clearTimeout(emergencyTimeout)
          // Remove root loader
          if (typeof document !== 'undefined') {
            document.body.classList.add('auth-resolved')
          }
        }
      }
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return
        
        console.log('🔄 Auth state change:', event, session?.user?.email || 'no user')
        
        if (session?.user) {
          setUser(session.user)
          
          // Load all user data in parallel (non-blocking)
          loadUserData(session.user.id)
            .catch(err => console.error('Failed to load user data:', err))
            
        } else {
          setUser(null)
          setProfile(null)
          setOrganization(null)
          setPermissions([])
          setUserRoles([])
        }

        // Always complete loading for auth state changes
        if (isMounted) {
          setLoading(false)
          setInitialized(true)
        }
      }
    )

    return () => {
      isMounted = false
      clearTimeout(emergencyTimeout)
      subscription.unsubscribe()
    }
  }, [])

  const value = {
    user,
    profile,
    organization,
    organizationId: profile?.organization_id || null,
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

  // Prevent hydration errors by only showing loader after hydration
  // During SSR and initial hydration, show nothing to avoid mismatch
  if (typeof window === 'undefined') {
    return (
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
    )
  }

  // CRITICAL: Never show loader if we have cached auth
  // This prevents flashes on page refresh/navigation
  if (!cachedAuth) {
    // Only show loader during initial hydration or when loading without cache
    if (!isHydrated || (loading && !initialized)) {
      return <KrooloMainLoader />
    }
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