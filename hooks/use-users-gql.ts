import { useState, useEffect, useCallback, useMemo } from 'react'
import { createGraphQLClient } from '@/lib/graphql/client'
import { GET_PROFILES_QUERY, GET_TEAMS_QUERY, GET_PROFILE_BY_ID_QUERY } from '@/lib/graphql/queries'
import { gql } from 'graphql-request'

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
  organization_id?: string
  lead_id?: string
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
      
      console.log('📊 GraphQL: Raw teams data:', JSON.stringify(data.teamsCollection.edges.slice(0, 1), null, 2))

      const transformedTeams: Team[] = data.teamsCollection.edges.map((edge: any) => {
        const team = edge.node
        const teamMembers = team.members?.edges.map((e: any) => e.node) || []
        
        console.log(`👥 Team "${team.name}": ${teamMembers.length} members`, teamMembers.map((m: any) => m.user?.display_name || m.user?.email))
        
        return {
          ...team,
          team_members: teamMembers // Use team_members to match the page expectations
        }
      })
      
      setTeams(transformedTeams)
      console.log('✅ GraphQL: Teams loaded successfully:', transformedTeams.length, 'teams')
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

// ============================================
// MUTATIONS - PROFILES/USERS
// ============================================

// DEPRECATED: Use inviteUserViaAPI instead for proper auth user creation with email invitations
export async function createProfileGQL(profileData: Partial<Profile>): Promise<Profile> {
  throw new Error('createProfileGQL is deprecated - use inviteUserViaAPI for proper user creation with email invitations')
}

/**
 * Create a user with proper Supabase auth user creation and email invitation
 * This calls the /api/create-user endpoint which handles both auth user and profile creation
 */
export async function inviteUserViaAPI(userData: {
  first_name: string
  last_name: string  
  email: string
  role: string
  department?: string
  organization_id?: string
}): Promise<any> {
  const response = await fetch('/api/create-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  })
  
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.message || 'Failed to invite user')
  }
  
  return response.json()
}

export async function updateProfileGQL(id: string, updates: Partial<Profile>): Promise<Profile> {
  console.log('🔧 updateProfileGQL called with:', { id, updates })
  
  const client = await createGraphQLClient()
  
  const mutation = gql`
    mutation UpdateProfile($id: UUID!, $set: profilesUpdateInput!) {
      updateprofilesCollection(filter: { id: { eq: $id } }, set: $set) {
        records {
          id
          email
          first_name
          last_name
          display_name
          avatar_url
          phone
          department
          role
          is_active
          created_at
          updated_at
        }
      }
    }
  `
  
  try {
    const response: any = await client.request(mutation, { id, set: updates })
    console.log('✅ updateProfileGQL response:', response)
    
    if (!response.updateprofilesCollection.records[0]) {
      throw new Error('No user was updated. The user may not exist or you may not have permission.')
    }
    
    return response.updateprofilesCollection.records[0]
  } catch (error) {
    console.error('❌ updateProfileGQL error:', error)
    throw error
  }
}

// DEPRECATED: Use deleteUserViaAPI instead for proper deletion from auth.users table
export async function deleteProfileGQL(id: string): Promise<boolean> {
  throw new Error('deleteProfileGQL is deprecated - use deleteUserViaAPI for proper user deletion from Supabase Auth')
}

/**
 * Delete a user completely from Supabase Auth (which cascades to profiles table)
 * This calls the /api/delete-user endpoint which uses admin API to delete from auth.users
 */
export async function deleteUserViaAPI(userId: string): Promise<any> {
  const response = await fetch('/api/delete-user', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId })
  })
  
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to delete user')
  }
  
  return response.json()
}

// ============================================
// MUTATIONS - TEAMS
// ============================================

export async function createTeamGQL(teamData: Partial<Team>): Promise<Team> {
  const client = await createGraphQLClient()
  
  const mutation = gql`
    mutation CreateTeam($input: teamsInsertInput!) {
      insertIntoteamsCollection(objects: [$input]) {
        records {
          id
          name
          description
          department
          organization_id
          lead_id
          is_active
          created_at
          updated_at
        }
      }
    }
  `
  
  const response: any = await client.request(mutation, { input: teamData })
  return response.insertIntoteamsCollection.records[0]
}

export async function updateTeamGQL(id: string, updates: Partial<Team>): Promise<Team> {
  const client = await createGraphQLClient()
  
  const mutation = gql`
    mutation UpdateTeam($id: UUID!, $set: teamsUpdateInput!) {
      updateteamsCollection(filter: { id: { eq: $id } }, set: $set) {
        records {
          id
          name
          description
          department
          is_active
          created_at
          updated_at
        }
      }
    }
  `
  
  const response: any = await client.request(mutation, { id, set: updates })
  return response.updateteamsCollection.records[0]
}

export async function deleteTeamGQL(id: string): Promise<boolean> {
  const client = await createGraphQLClient()
  
  const mutation = gql`
    mutation DeleteTeam($id: UUID!) {
      deleteFromteamsCollection(filter: { id: { eq: $id } }) {
        affectedCount
      }
    }
  `
  
  const response: any = await client.request(mutation, { id })
  return response.deleteFromteamsCollection.affectedCount > 0
}

// ============================================
// MUTATIONS - TEAM MEMBERS
// ============================================

export async function addTeamMemberGQL(teamId: string, userId: string, role: string = 'member'): Promise<any> {
  const client = await createGraphQLClient()
  
  const mutation = gql`
    mutation AddTeamMember($input: team_membersInsertInput!) {
      insertIntoteam_membersCollection(objects: [$input]) {
        records {
          id
          team_id
          user_id
          role
          joined_at
        }
      }
    }
  `
  
  const input = {
    team_id: teamId,
    user_id: userId,
    role
  }
  
  const response: any = await client.request(mutation, { input })
  return response.insertIntoteam_membersCollection.records[0]
}

export async function removeTeamMemberGQL(teamId: string, userId: string): Promise<boolean> {
  const client = await createGraphQLClient()
  
  const mutation = gql`
    mutation RemoveTeamMember($teamId: UUID!, $userId: UUID!) {
      deleteFromteam_membersCollection(
        filter: { 
          and: [
            { team_id: { eq: $teamId } },
            { user_id: { eq: $userId } }
          ]
        }
      ) {
        affectedCount
      }
    }
  `
  
  const response: any = await client.request(mutation, { teamId, userId })
  return response.deleteFromteam_membersCollection.affectedCount > 0
}
