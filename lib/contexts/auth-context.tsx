'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

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
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  hasRole: (roles: string | string[]) => boolean
  isAdmin: boolean
  isManager: boolean
  isAgent: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)

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

  const refreshProfile = async () => {
    if (user) {
      const updatedProfile = await fetchProfile(user.id)
      setProfile(updatedProfile)

      if (updatedProfile?.organization_id) {
        const org = await fetchOrganization(updatedProfile.organization_id)
        setOrganization(org)
      }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Error signing out:', error)
      }
      // The auth state change will handle clearing the user data
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const hasRole = (roles: string | string[]): boolean => {
    if (!profile) return false
    
    const roleArray = Array.isArray(roles) ? roles : [roles]
    return roleArray.includes(profile.role)
  }

  const isAdmin = profile?.role === 'admin'
  const isManager = profile?.role === 'manager' || profile?.role === 'admin'
  const isAgent = profile?.role === 'agent' || profile?.role === 'manager' || profile?.role === 'admin'

  useEffect(() => {
    let isMounted = true
    console.log('🔄 AuthProvider useEffect starting...')
    
    // Check localStorage for existing session data
    const checkLocalStorage = () => {
      try {
        const keys = Object.keys(localStorage).filter(key => key.includes('supabase'))
        console.log('🗄️ LocalStorage supabase keys:', keys)
        keys.forEach(key => {
          const value = localStorage.getItem(key)
          console.log(`🔑 ${key}:`, value ? 'exists' : 'null')
        })
      } catch (error) {
        console.error('Error checking localStorage:', error)
      }
    }
    
    checkLocalStorage()
    
    // Get initial session
    const getSession = async () => {
      try {
        console.log('🔍 Getting initial session...')
        const { data: { session }, error } = await supabase.auth.getSession()
        console.log('📋 Initial session result:', { session: !!session, error, user: session?.user?.email })
        
        if (error) {
          console.error('❌ Error getting session:', error)
        }
        
        if (session?.user && isMounted) {
          console.log('✅ Initial session found:', session.user.email)
          setUser(session.user)
          const userProfile = await fetchProfile(session.user.id)
          
          if (isMounted) {
            console.log('👤 Setting profile:', userProfile?.display_name)
            setProfile(userProfile)
            
            if (userProfile?.organization_id) {
              const org = await fetchOrganization(userProfile.organization_id)
              if (isMounted) {
                console.log('🏢 Setting organization:', org?.name)
                setOrganization(org)
              }
            }
          }
        } else {
          console.log('❌ No initial session found')
        }
      } catch (error) {
        console.error('💥 Error getting initial session:', error)
      } finally {
        if (isMounted) {
          console.log('⏹️ Setting loading to false')
          setLoading(false)
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
        } else {
          console.log('🔄 Auth state changed - clearing user data')
          setUser(null)
          setProfile(null)
          setOrganization(null)
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
    loading,
    signOut,
    refreshProfile,
    hasRole,
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