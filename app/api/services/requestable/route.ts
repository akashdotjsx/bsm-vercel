import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 400 })
    }

    // Get search parameters
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')
    const search = searchParams.get('search')

    // Build query
    let query = supabase
      .from('services')
      .select(`
        *,
        category:service_categories(name, icon, color)
      `)
      .eq('organization_id', profile.organization_id)
      .eq('status', 'active')
      .eq('is_requestable', true)

    // Apply filters
    if (categoryId && categoryId !== 'all') {
      query = query.eq('category_id', categoryId)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Execute query with ordering
    const { data: services, error } = await query.order('name', { ascending: true })

    if (error) {
      console.error('Error fetching requestable services:', error)
      return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 })
    }

    // Transform the data to include category name directly
    const transformedServices = services.map(service => ({
      ...service,
      category_name: service.category?.name || 'Uncategorized',
      category_icon: service.category?.icon || 'Settings',
      category_color: service.category?.color || 'bg-blue-500'
    }))

    return NextResponse.json({ services: transformedServices }, { status: 200 })

  } catch (error) {
    console.error('Error in requestable services API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}