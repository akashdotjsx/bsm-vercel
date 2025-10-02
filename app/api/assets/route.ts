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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search')
    const asset_type_id = searchParams.get('asset_type_id')
    const status = searchParams.get('status')
    const criticality = searchParams.get('criticality')
    const owner_id = searchParams.get('owner_id')
    const support_team_id = searchParams.get('support_team_id')
    const tags = searchParams.get('tags')?.split(',').filter(Boolean)

    // Build base query for count
    let countQuery = supabase
      .from('assets')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', profile.organization_id)

    // Build base query for data
    let dataQuery = supabase
      .from('assets')
      .select(`
        *,
        asset_type:asset_types(id, name, icon, color, description)
      `)
      .eq('organization_id', profile.organization_id)

    // Apply filters to both queries
    if (search) {
      const searchFilter = `name.ilike.%${search}%,hostname.ilike.%${search}%,ip_address.ilike.%${search}%,asset_tag.ilike.%${search}%`
      countQuery = countQuery.or(searchFilter)
      dataQuery = dataQuery.or(searchFilter)
    }
    if (asset_type_id) {
      countQuery = countQuery.eq('asset_type_id', asset_type_id)
      dataQuery = dataQuery.eq('asset_type_id', asset_type_id)
    }
    if (status) {
      countQuery = countQuery.eq('status', status)
      dataQuery = dataQuery.eq('status', status)
    }
    if (criticality) {
      countQuery = countQuery.eq('criticality', criticality)
      dataQuery = dataQuery.eq('criticality', criticality)
    }
    if (owner_id) {
      countQuery = countQuery.eq('owner_id', owner_id)
      dataQuery = dataQuery.eq('owner_id', owner_id)
    }
    if (support_team_id) {
      countQuery = countQuery.eq('support_team_id', support_team_id)
      dataQuery = dataQuery.eq('support_team_id', support_team_id)
    }
    if (tags && tags.length > 0) {
      countQuery = countQuery.overlaps('tags', tags)
      dataQuery = dataQuery.overlaps('tags', tags)
    }

    // Get total count
    const { count } = await countQuery
    const total = count || 0

    // Get paginated data
    const { data: assets, error } = await dataQuery
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 })
    }

    return NextResponse.json({
      assets: assets || [],
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    
    // Create asset
    const { data: asset, error } = await supabase
      .from('assets')
      .insert({
        ...body,
        organization_id: profile.organization_id,
        created_by: user.id,
        last_seen_at: new Date().toISOString()
      })
      .select(`
        *,
        asset_type:asset_types(id, name, icon, color)
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to create asset' }, { status: 500 })
    }

    return NextResponse.json({ asset })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}