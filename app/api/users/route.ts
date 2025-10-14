import { NextRequest, NextResponse } from 'next/server'
import { createServerGraphQLClient } from '@/lib/graphql/client'
import { createClient as createSupabaseServer } from '@/lib/supabase/server'

// GraphQL Queries
const GET_USERS_QUERY = `
  query GetUsers($orgId: UUID!) {
    profilesCollection(
      filter: { organization_id: { eq: $orgId } }
      orderBy: [{ created_at: DescNullsLast }]
    ) {
      edges {
        node {
          id
          first_name
          last_name
          display_name
          email
          avatar_url
          phone
          role
          department
          is_active
          created_at
          organization_id
          manager_id
        }
      }
    }
  }
`

const GET_TEAMS_QUERY = `
  query GetTeams($orgId: UUID!) {
    teamsCollection(
      filter: { organization_id: { eq: $orgId } }
      orderBy: [{ name: AscNullsLast }]
    ) {
      edges {
        node {
          id
          name
          description
          department
          is_active
          created_at
          organization_id
          lead_id
          team_members: team_membersCollection {
            edges {
              node {
                id
                role
                user_id
              }
            }
          }
        }
      }
    }
  }
`

// GET: Fetch users or teams based on query param
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's organization from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'users' or 'teams'

    // Use service role GraphQL client for querying
    const client = createServerGraphQLClient()

    if (type === 'teams') {
      // Fetch teams
      const data = await client.request(GET_TEAMS_QUERY, {
        orgId: profile.organization_id
      })

      const teams = data.teamsCollection?.edges?.map((edge: any) => ({
        ...edge.node,
        team_members: edge.node.team_members?.edges?.map((m: any) => m.node) || []
      })) || []

      return NextResponse.json({ teams })
    } else {
      // Fetch users (default)
      const data = await client.request(GET_USERS_QUERY, {
        orgId: profile.organization_id
      })

      const users = data.profilesCollection?.edges?.map((edge: any) => edge.node) || []

      return NextResponse.json({ users })
    }
  } catch (error) {
    console.error('❌ GET /api/users error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// POST: Create user, team, or team member
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    const body = await request.json()
    const { type, ...data } = body // type: 'user', 'team', 'team_member'

    const client = createServerGraphQLClient()

    if (type === 'user') {
      // Create auth user first (requires service role)
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: data.email,
        password: data.password || crypto.randomUUID(),
        email_confirm: true,
        user_metadata: {
          organization_id: profile.organization_id,
          display_name: data.display_name || data.email.split('@')[0]
        }
      })

      if (authError || !authUser.user) {
        console.error('Auth user creation error:', authError)
        return NextResponse.json({ error: authError?.message || 'Failed to create auth user' }, { status: 500 })
      }

      // Create profile via GraphQL
      const CREATE_PROFILE_MUTATION = `
        mutation CreateProfile($input: profilesInsertInput!) {
          insertIntoprofilesCollection(objects: [$input]) {
            records {
              id
              email
              display_name
              first_name
              last_name
              role
              department
              is_active
              created_at
            }
          }
        }
      `

      const profileData = await client.request(CREATE_PROFILE_MUTATION, {
        input: {
          id: authUser.user.id,
          email: data.email,
          display_name: data.display_name || data.email.split('@')[0],
          first_name: data.first_name,
          last_name: data.last_name,
          role: data.role || 'user',
          department: data.department,
          organization_id: profile.organization_id,
          is_active: true
        }
      })

      return NextResponse.json({
        user: profileData.insertIntoprofilesCollection?.records[0],
        message: 'User created successfully'
      })
    } else if (type === 'team') {
      // Create team via GraphQL
      const CREATE_TEAM_MUTATION = `
        mutation CreateTeam($input: teamsInsertInput!) {
          insertIntoteamsCollection(objects: [$input]) {
            records {
              id
              name
              description
              department
              is_active
              created_at
            }
          }
        }
      `

      const teamData = await client.request(CREATE_TEAM_MUTATION, {
        input: {
          name: data.name,
          description: data.description,
          department: data.department,
          lead_id: data.lead_id,
          organization_id: profile.organization_id,
          is_active: true
        }
      })

      return NextResponse.json({
        team: teamData.insertIntoteamsCollection?.records[0],
        message: 'Team created successfully'
      })
    } else if (type === 'team_member') {
      // Add user to team
      const ADD_MEMBER_MUTATION = `
        mutation AddTeamMember($input: team_membersInsertInput!) {
          insertIntoteam_membersCollection(objects: [$input]) {
            records {
              id
              team_id
              user_id
              role
            }
          }
        }
      `

      const memberData = await client.request(ADD_MEMBER_MUTATION, {
        input: {
          team_id: data.team_id,
          user_id: data.user_id,
          role: data.role || 'member'
        }
      })

      return NextResponse.json({
        member: memberData.insertIntoteam_membersCollection?.records[0],
        message: 'Team member added successfully'
      })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('❌ POST /api/users error:', error)
    return NextResponse.json(
      { error: 'Failed to create resource', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// PUT: Update user, team, or team member
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, id, ...updates } = body

    const client = createServerGraphQLClient()

    if (type === 'user') {
      const UPDATE_PROFILE_MUTATION = `
        mutation UpdateProfile($id: UUID!, $updates: profilesUpdateInput!) {
          updateprofilesCollection(filter: { id: { eq: $id } }, set: $updates) {
            records {
              id
              email
              display_name
              first_name
              last_name
              role
              department
              is_active
            }
          }
        }
      `

      const data = await client.request(UPDATE_PROFILE_MUTATION, {
        id,
        updates
      })

      return NextResponse.json({
        user: data.updateprofilesCollection?.records[0],
        message: 'User updated successfully'
      })
    } else if (type === 'team') {
      const UPDATE_TEAM_MUTATION = `
        mutation UpdateTeam($id: UUID!, $updates: teamsUpdateInput!) {
          updateteamsCollection(filter: { id: { eq: $id } }, set: $updates) {
            records {
              id
              name
              description
              department
              is_active
            }
          }
        }
      `

      const data = await client.request(UPDATE_TEAM_MUTATION, {
        id,
        updates
      })

      return NextResponse.json({
        team: data.updateteamsCollection?.records[0],
        message: 'Team updated successfully'
      })
    } else if (type === 'team_member') {
      const UPDATE_MEMBER_MUTATION = `
        mutation UpdateTeamMember($teamId: UUID!, $userId: UUID!, $role: String!) {
          updateteam_membersCollection(
            filter: { team_id: { eq: $teamId }, user_id: { eq: $userId } }
            set: { role: $role }
          ) {
            records {
              id
              role
            }
          }
        }
      `

      const data = await client.request(UPDATE_MEMBER_MUTATION, {
        teamId: updates.team_id,
        userId: updates.user_id,
        role: updates.role
      })

      return NextResponse.json({
        member: data.updateteam_membersCollection?.records[0],
        message: 'Team member updated successfully'
      })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error) {
    console.error('❌ PUT /api/users error:', error)
    return NextResponse.json(
      { error: 'Failed to update resource', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// DELETE: Remove team or team member
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const id = searchParams.get('id')
    const teamId = searchParams.get('teamId')
    const userId = searchParams.get('userId')

    const client = createServerGraphQLClient()

    if (type === 'user') {
      // Deactivate user instead of deleting
      const UPDATE_PROFILE_MUTATION = `
        mutation DeactivateProfile($id: UUID!) {
          updateprofilesCollection(filter: { id: { eq: $id } }, set: { is_active: false }) {
            records {
              id
              is_active
            }
          }
        }
      `

      await client.request(UPDATE_PROFILE_MUTATION, { id })

      return NextResponse.json({ message: 'User deactivated successfully' })
    } else if (type === 'team') {
      // Deactivate team
      const UPDATE_TEAM_MUTATION = `
        mutation DeactivateTeam($id: UUID!) {
          updateteamsCollection(filter: { id: { eq: $id } }, set: { is_active: false }) {
            records {
              id
              is_active
            }
          }
        }
      `

      await client.request(UPDATE_TEAM_MUTATION, { id })

      return NextResponse.json({ message: 'Team deactivated successfully' })
    } else if (type === 'team_member' && teamId && userId) {
      // Remove team member
      const DELETE_MEMBER_MUTATION = `
        mutation RemoveTeamMember($teamId: UUID!, $userId: UUID!) {
          deleteFromteam_membersCollection(
            filter: { team_id: { eq: $teamId }, user_id: { eq: $userId } }
          ) {
            records {
              id
            }
          }
        }
      `

      await client.request(DELETE_MEMBER_MUTATION, { teamId, userId })

      return NextResponse.json({ message: 'Team member removed successfully' })
    }

    return NextResponse.json({ error: 'Invalid type or missing parameters' }, { status: 400 })
  } catch (error) {
    console.error('❌ DELETE /api/users error:', error)
    return NextResponse.json(
      { error: 'Failed to delete resource', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
