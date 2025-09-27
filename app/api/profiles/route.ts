import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
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

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const department = searchParams.get('department')
    const role = searchParams.get('role')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Build query
    let query = supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        display_name,
        email,
        avatar_url,
        phone,
        role,
        department,
        is_active,
        created_at
      `)
      .eq('organization_id', profile.organization_id)
      .eq('is_active', true)
      .order('display_name', { ascending: true })
      .limit(limit)

    // Apply filters
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,display_name.ilike.%${search}%,email.ilike.%${search}%`)
    }
    if (department) {
      query = query.eq('department', department)
    }
    if (role) {
      query = query.eq('role', role)
    }

    const { data: profiles, error } = await query

    if (error) {
      console.error('Error fetching profiles:', error)
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 })
    }

    return NextResponse.json({ profiles: profiles || [] })
  } catch (error) {
    console.error('Unexpected error in profiles GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
