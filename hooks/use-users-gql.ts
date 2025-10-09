import { useState, useEffect, useCallback, useMemo } from 'react'
import { createGraphQLClient } from '@/lib/graphql/client'
import { GET_PROFILES_QUERY, GET_TEAMS_QUERY, GET_PROFILE_BY_ID_QUERY } from '@/lib/graphql/queries'

interface Profile {
  id: string
  email: string
  first_name?: string
  last_name?: string
  display_name?: string
  avatar_url?: string
  phone?: string
  department?: string
  role: 'admin' | 'manager' | 'agent' | 'user'
  is_active: boolean
  created_at: string
  updated_at: string
  organization?: {
    id: string
    name: string
  }
  manager?: {
    id: string
    display_name: string
  }
}

interface Team {
  id: string
  name: string
  description?: string
  department?: string
  is_active: boolean
  created_at: string
  updated_at: string
  lead?: {
    id: string
    display_name: string
    email: string
  }
  organization?: {
    id: string
    name: string
  }
  members?: Array<{
    id: string
    role: string
    user: {
      id: string
      display_name: string
      email: string
      avatar_url?: string
    }
  }>
}

interface ProfilesParams {
  page?: number
  limit?: number
  search?: string
  department?: string
  role?: string
  is_active?: boolean
  organization_id?: string
}

/**
 * GraphQL hook for fetching users/profiles
 * Benefits: Single query with organization + manager data embedded
 */
export function useProfilesGQL(params: ProfilesParams = {}) {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const stableParams = useMemo(() => params, [
    params.page,
    params.limit,
    params.search,
    params.department,
    params.role,
    params.is_active,
    params.organization_id
  ])

  const fetchProfiles = useCallback(async () => {
    try {
      console.log('🔄 GraphQL: Fetching profiles with params:', stableParams)
      setLoading(true)
      setError(null)

      const client = await createGraphQLClient()

      // Build filter
      const filter: any = {}
      
      if (stableParams.organization_id) {
        filter.organization_id = { eq: stableParams.organization_id }
      }
      
      if (stableParams.department) {
        filter.department = { eq: stableParams.department }
      }
      
      if (stableParams.role) {
        filter.role = { eq: stableParams.role }
      }
      
      if (stableParams.is_active !== undefined) {
        filter.is_active = { eq: stableParams.is_active }
      }
      
      if (stableParams.search) {
        filter.or = [
          { display_name: { ilike: `%${stableParams.search}%` } },
          { email: { ilike: `%${stableParams.search}%` } },
          { first_name: { ilike: `%${stableParams.search}%` } },
          { last_name: { ilike: `%${stableParams.search}%` } }
        ]
      }

      const variables = {
        filter: Object.keys(filter).length > 0 ? filter : undefined,
        orderBy: [{ created_at: 'DescNullsLast' }],
        first: stableParams.limit || 100,
        offset: ((stableParams.page || 1) - 1) * (stableParams.limit || 100)
      }

      const data = await client.request<any>(GET_PROFILES_QUERY, variables)

      const transformedProfiles: Profile[] = data.profilesCollection.edges.map((edge: any) => edge.node)
      
      setProfiles(transformedProfiles)
      console.log('✅ GraphQL: Profiles loaded successfully:', transformedProfiles.length)
    } catch (err) {
      console.error('❌ GraphQL Error fetching profiles:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch profiles')
    } finally {
      setLoading(false)
    }
  }, [stableParams])

  useEffect(() => {
    fetchProfiles()
  }, [fetchProfiles])

  return {
    profiles,
    loading,
    error,
    refetch: fetchProfiles
  }
}

/**
 * GraphQL hook for fetching a single profile by ID
 */
export function useProfileGQL(id: string) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async () => {
    if (!id) return

    try {
      setLoading(true)
      setError(null)

      const client = await createGraphQLClient()
      const data = await client.request<any>(GET_PROFILE_BY_ID_QUERY, { id })

      if (data.profilesCollection.edges.length === 0) {
        throw new Error('Profile not found')
      }

      setProfile(data.profilesCollection.edges[0].node)
    } catch (err) {
      console.error('❌ GraphQL Error fetching profile:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch profile')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (id) {
      fetchProfile()
    }
  }, [fetchProfile, id])

  return {
    profile,
    loading,
    error,
    refetch: fetchProfile
  }
}

/**
 * GraphQL hook for fetching teams with members
 * Benefits: Single query fetches teams + lead + all members in one request
 */
export function useTeamsGQL(params: { organization_id?: string; is_active?: boolean } = {}) {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const stableParams = useMemo(() => params, [params.organization_id, params.is_active])

  const fetchTeams = useCallback(async () => {
    try {
      console.log('🔄 GraphQL: Fetching teams with params:', stableParams)
      setLoading(true)
      setError(null)

      const client = await createGraphQLClient()

      const filter: any = {}
      
      if (stableParams.organization_id) {
        filter.organization_id = { eq: stableParams.organization_id }
      }
      
      if (stableParams.is_active !== undefined) {
        filter.is_active = { eq: stableParams.is_active }
      }

      const variables = {
        filter: Object.keys(filter).length > 0 ? filter : undefined,
        orderBy: [{ name: 'AscNullsLast' }],
        first: 100
      }

      const data = await client.request<any>(GET_TEAMS_QUERY, variables)

      const transformedTeams: Team[] = data.teamsCollection.edges.map((edge: any) => ({
        ...edge.node,
        members: edge.node.members?.edges.map((e: any) => e.node) || []
      }))
      
      setTeams(transformedTeams)
      console.log('✅ GraphQL: Teams loaded successfully:', transformedTeams.length)
    } catch (err) {
      console.error('❌ GraphQL Error fetching teams:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch teams')
    } finally {
      setLoading(false)
    }
  }, [stableParams])

  useEffect(() => {
    fetchTeams()
  }, [fetchTeams])

  return {
    teams,
    loading,
    error,
    refetch: fetchTeams
  }
}
