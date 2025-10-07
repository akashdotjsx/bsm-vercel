import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  console.log('🔍 Search Services API Route called')
  
  try {
    const supabase = await createClient()
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session?.user) {
      console.log('❌ Search Services API - User not authenticated')
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
      console.log('❌ Search Services API - User has no organization')
      return NextResponse.json({ error: 'User not in organization' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '10')
    
    console.log('🔍 Search Services API - Searching for:', { query, limit })
    
    if (query.length < 2) {
      return NextResponse.json({
        services: [],
        suggestions: [
          'IT Services',
          'HR Services',
          'Hardware Request',
          'Software Installation',
          'Access Request'
        ]
      })
    }

    // Search services
    const { data: services, error } = await supabase
      .from('services')
      .select(`
        id,
        name,
        description,
        short_description,
        category_id,
        status,
        created_at,
        updated_at,
        service_categories!category_id(
          name
        )
      `)
      .eq('organization_id', profile.organization_id)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%,short_description.ilike.%${query}%`)
      .neq('status', 'draft')
      .order('name', { ascending: true })
      .limit(limit)

    if (error) {
      console.error('❌ Search Services API - Database error:', error)
      return NextResponse.json({ error: 'Search failed' }, { status: 500 })
    }

    const searchResults = services.map(service => ({
      id: service.id,
      title: service.name,
      description: service.description || service.short_description || `Service in ${service.service_categories?.name || 'General'} category`,
      type: 'service' as const,
      category: service.service_categories?.name || 'General',
      url: `/services/${service.id}`,
      relevance: calculateServiceRelevance(service, query),
      metadata: {
        category: service.service_categories?.name,
        status: service.status,
        created_at: service.created_at
      }
    }))

    console.log('✅ Search Services API - Found:', searchResults.length, 'services')

    return NextResponse.json({
      services: searchResults,
      suggestions: []
    })

  } catch (error) {
    console.error('❌ Search Services API - Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function calculateServiceRelevance(service: any, query: string): number {
  const queryLower = query.toLowerCase()
  let score = 0

  // Name matching (highest weight)
  if (service.name && service.name.toLowerCase().includes(queryLower)) {
    score += 0.8
    if (service.name.toLowerCase().startsWith(queryLower)) {
      score += 0.2
    }
  }

  // Description matching
  if (service.description && service.description.toLowerCase().includes(queryLower)) {
    score += 0.6
  }

  // Category matching
  if (service.service_categories?.name && service.service_categories.name.toLowerCase().includes(queryLower)) {
    score += 0.5
  }

  // Short description matching
  if (service.short_description && service.short_description.toLowerCase().includes(queryLower)) {
    score += 0.4
  }

  return Math.min(score, 1.0)
}

export const dynamic = "force-dynamic"