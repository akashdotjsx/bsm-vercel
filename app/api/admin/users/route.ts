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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const department = searchParams.get('department')

    // Fetch all users in the organization
    let query = supabase
      .from('profiles')
      .select(`
        id,
        email,
        first_name,
        last_name,
        display_name,
        role,
        department,
        is_active,
        last_login,
        created_at
      `)
      .eq('organization_id', currentProfile.organization_id)
      .order('created_at', { ascending: false })

    // Apply filters
    if (status === 'Active') {
      query = query.eq('is_active', true)
    } else if (status === 'Inactive') {
      query = query.eq('is_active', false)
    }

    if (department && department !== 'all') {
      query = query.eq('department', department)
    }

    const { data: users, error } = await query

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    return NextResponse.json({ users: users || [] })
  } catch (error) {
    console.error('Unexpected error in admin/users GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
