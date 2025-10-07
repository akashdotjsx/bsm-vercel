import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  console.log('🔍 Search Suggestions API Route called')
  
  try {
    const supabase = await createClient()
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session?.user) {
      console.log('❌ Search Suggestions API - User not authenticated')
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
      console.log('❌ Search Suggestions API - User has no organization')
      return NextResponse.json({ error: 'User not in organization' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '10')
    
    console.log('🔍 Search Suggestions API - Getting suggestions for:', { query, limit })
    
    // Get popular search suggestions from the user's organization
    const { data: suggestions, error } = await supabase
      .from('search_suggestions')
      .select(`
        query,
        search_type,
        result_count,
        created_at
      `)
      .eq('organization_id', profile.organization_id)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
      .ilike('query', `%${query}%`)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('❌ Search Suggestions API - Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch suggestions' }, { status: 500 })
    }

    // Get user's recent searches
    const { data: recentSearches } = await supabase
      .from('search_suggestions')
      .select('query, search_type, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    // Combine and deduplicate suggestions
    const allSuggestions = new Set<string>()
    
    // Add popular suggestions
    suggestions?.forEach(s => allSuggestions.add(s.query))
    
    // Add contextual suggestions based on query
    const contextualSuggestions = generateContextualSuggestions(query)
    contextualSuggestions.forEach(s => allSuggestions.add(s))

    console.log('✅ Search Suggestions API - Found:', allSuggestions.size, 'suggestions')

    return NextResponse.json({
      suggestions: Array.from(allSuggestions).slice(0, limit),
      recent_searches: recentSearches?.map(r => r.query) || [],
      contextual: contextualSuggestions
    })

  } catch (error) {
    console.error('❌ Search Suggestions API - Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  console.log('🔍 Track Search API Route called')
  
  try {
    const supabase = await createClient()
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session?.user) {
      console.log('❌ Track Search API - User not authenticated')
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
      console.log('❌ Track Search API - User has no organization')
      return NextResponse.json({ error: 'User not in organization' }, { status: 403 })
    }

    const body = await request.json()
    const { query, search_type, result_count, clicked_result_id, clicked_result_type } = body
    
    // Get client IP and user agent
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    console.log('🔍 Track Search API - Recording search:', { query, search_type, result_count })
    
    // Insert search record
    const { error } = await supabase
      .from('search_suggestions')
      .insert({
        organization_id: profile.organization_id,
        user_id: user.id,
        query,
        search_type: search_type || 'all',
        result_count: result_count || 0,
        clicked_result_id,
        clicked_result_type,
        ip_address: ip,
        user_agent: userAgent
      })

    if (error) {
      console.error('❌ Track Search API - Database error:', error)
      return NextResponse.json({ error: 'Failed to record search' }, { status: 500 })
    }

    console.log('✅ Track Search API - Search recorded successfully')
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('❌ Track Search API - Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function generateContextualSuggestions(query: string): string[] {
  const suggestions: string[] = []
  const queryLower = query.toLowerCase()

  // IT/Technical suggestions
  if (queryLower.includes('password')) {
    suggestions.push('password reset', 'password expired', 'password policy')
  }
  if (queryLower.includes('laptop') || queryLower.includes('computer')) {
    suggestions.push('laptop request', 'laptop replacement', 'computer setup')
  }
  if (queryLower.includes('access')) {
    suggestions.push('VPN access', 'system access', 'access request')
  }
  if (queryLower.includes('email')) {
    suggestions.push('email setup', 'email not working', 'email forwarding')
  }
  if (queryLower.includes('network')) {
    suggestions.push('network issue', 'network access', 'WiFi problem')
  }

  // Software suggestions
  if (queryLower.includes('software')) {
    suggestions.push('software installation', 'software license', 'software update')
  }
  if (queryLower.includes('office')) {
    suggestions.push('Microsoft Office', 'Office 365', 'Office license')
  }

  // HR suggestions
  if (queryLower.includes('leave')) {
    suggestions.push('leave request', 'sick leave', 'vacation request')
  }
  if (queryLower.includes('payroll')) {
    suggestions.push('payroll issue', 'payroll inquiry', 'salary question')
  }

  // Common user searches
  if (queryLower.includes('john')) {
    suggestions.push('John Doe', 'John Smith')
  }
  if (queryLower.includes('admin')) {
    suggestions.push('Administrator', 'System Admin', 'Admin access')
  }

  return suggestions.slice(0, 5) // Limit contextual suggestions
}

export const dynamic = "force-dynamic"
