import { NextRequest, NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'
import { CACHE_TAGS } from '@/lib/cache'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  console.log('🔍 Search Assets API Route called')
  
  try {
    const supabase = await createClient()
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session?.user) {
      console.log('❌ Search Assets API - User not authenticated')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user
    
    // Get user profile to extract organization_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()
    
    if (!profile?.organization_id) {
      console.log('❌ Search Assets API - User has no organization')
      return NextResponse.json({ error: 'User not in organization' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '10')
    
    console.log('🔍 Search Assets API - Searching for:', { query, limit })
    
    if (query.length < 2) {
      return NextResponse.json({
        assets: [],
        suggestions: [
          'Laptops',
          'Servers',
          'Printers',
          'Software Licenses',
          'Network Equipment'
        ]
      })
    }

    // Search assets with asset type information
    const { data: assets, error } = await supabase
      .from('assets')
      .select(`
        id,
        name,
        asset_tag,
        serial_number,
        model,
        vendor,
        status,
        location,
        owner_id,
        purchase_date,
        warranty_expiry,
        created_at,
        asset_types!asset_type_id (
          name,
          description
        ),
        profiles!owner_id (
          display_name,
          first_name,
          last_name
        )
      `)
      .eq('organization_id', profile.organization_id)
      .or(`name.ilike.%${query}%,asset_tag.ilike.%${query}%,model.ilike.%${query}%,vendor.ilike.%${query}%,serial_number.ilike.%${query}%`)
      .order('name', { ascending: true })
      .limit(limit)

    if (error) {
      console.error('❌ Search Assets API - Database error:', error)
      return NextResponse.json({ error: 'Search failed' }, { status: 500 })
    }

    const searchResults = assets.map(asset => ({
      id: asset.id,
      title: asset.name,
      description: `${asset.vendor || ''} ${asset.model || ''} - ${asset.asset_types?.name || 'Asset'}`,
      type: 'asset' as const,
      category: asset.asset_types?.name || 'General',
      url: `/assets/${asset.id}`,
      relevance: calculateAssetRelevance(asset, query),
      metadata: {
        asset_tag: asset.asset_tag,
        serial_number: asset.serial_number,
        vendor: asset.vendor,
        model: asset.model,
        status: asset.status,
        location: asset.location,
        owner: asset.profiles?.display_name || asset.profiles?.first_name || 'Unassigned',
        asset_type: asset.asset_types?.name,
        created_at: asset.created_at
      }
    }))

    console.log('✅ Search Assets API - Found:', searchResults.length, 'assets')

    return NextResponse.json({
      assets: searchResults,
      suggestions: []
    })

  } catch (error) {
    console.error('❌ Search Assets API - Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function calculateAssetRelevance(asset: any, query: string): number {
  const queryLower = query.toLowerCase()
  let score = 0

  // Name matching (highest weight)
  if (asset.name && asset.name.toLowerCase().includes(queryLower)) {
    score += 0.8
    if (asset.name.toLowerCase().startsWith(queryLower)) {
      score += 0.2
    }
  }

  // Asset tag matching
  if (asset.asset_tag && asset.asset_tag.toLowerCase().includes(queryLower)) {
    score += 0.9
  }

  // Model/Vendor matching
  if (asset.model && asset.model.toLowerCase().includes(queryLower)) {
    score += 0.7
  }
  if (asset.vendor && asset.vendor.toLowerCase().includes(queryLower)) {
    score += 0.6
  }

  // Serial number matching (high priority)
  if (asset.serial_number && asset.serial_number.toLowerCase().includes(queryLower)) {
    score += 0.8
  }

  // Type matching
  if (asset.asset_types?.name && asset.asset_types.name.toLowerCase().includes(queryLower)) {
    score += 0.5
  }

  return Math.min(score, 1.0)
}

export const dynamic = "force-dynamic"