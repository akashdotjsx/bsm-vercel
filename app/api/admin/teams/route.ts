import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if current user is admin
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('role, organization_id')
      .eq('id', user.id)
      .single()

    if (!currentProfile || currentProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    // Fetch all teams in the organization
    const { data: teams, error } = await supabase
      .from('teams')
      .select(`
        id,
        name,
        description,
        department,
        is_active,
        created_at,
        lead:lead_id (
          id,
          display_name
        ),
        team_members (
          id
        )
      `)
      .eq('organization_id', currentProfile.organization_id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching teams:', error)
      return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 })
    }

    // Transform data to include member count
    const teamsWithCounts = teams?.map(team => ({
      ...team,
      members: team.team_members?.length || 0,
      lead_name: team.lead?.display_name || 'Unassigned'
    }))

    return NextResponse.json({ teams: teamsWithCounts || [] })
  } catch (error) {
    console.error('Unexpected error in admin/teams GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
