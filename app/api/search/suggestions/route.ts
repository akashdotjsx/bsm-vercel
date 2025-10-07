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
    
    // Get real data for dynamic suggestions
    const [ticketSuggestions, userSuggestions, historicalSearches] = await Promise.all([
      // Get matching tickets
      supabase
        .from('tickets')
        .select('title, ticket_number, type')
        .eq('organization_id', profile.organization_id)
        .ilike('title', `%${query}%`)
        .limit(10),
      
      // Get matching users
      supabase
        .from('profiles')
        .select('display_name, email, department')
        .eq('organization_id', profile.organization_id)
        .or(`display_name.ilike.%${query}%,email.ilike.%${query}%,department.ilike.%${query}%`)
        .limit(10),
      
      // Get historical searches
      supabase
        .from('search_suggestions')
        .select('query, result_count, created_at')
        .eq('organization_id', profile.organization_id)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .ilike('query', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(5)
    ])

    // Check for errors in any of the queries
    const hasErrors = [ticketSuggestions.error, userSuggestions.error, historicalSearches.error].some(e => e)
    if (hasErrors) {
      console.error('❌ Search Suggestions API - Database error:', { 
        ticketError: ticketSuggestions.error, 
        userError: userSuggestions.error, 
        historyError: historicalSearches.error 
      })
    }

    // Get user's recent searches (personal history)
    const { data: recentSearches } = await supabase
      .from('search_suggestions')
      .select('query, search_type, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    // Create dynamic suggestions from real data
    const dynamicSuggestions = new Set<string>()
    
    // Add ticket titles and numbers as suggestions
    ticketSuggestions.data?.forEach(ticket => {
      if (ticket.title && ticket.title.toLowerCase().includes(query.toLowerCase())) {
        dynamicSuggestions.add(ticket.title)
      }
      if (ticket.ticket_number && ticket.ticket_number.toLowerCase().includes(query.toLowerCase())) {
        dynamicSuggestions.add(ticket.ticket_number)
      }
      // Add type-based suggestions
      if (query.length >= 2) {
        dynamicSuggestions.add(`${ticket.type} tickets`)
      }
    })
    
    // Add user-based suggestions
    userSuggestions.data?.forEach(user => {
      if (user.display_name && user.display_name.toLowerCase().includes(query.toLowerCase())) {
        dynamicSuggestions.add(user.display_name)
      }
      if (user.department && user.department.toLowerCase().includes(query.toLowerCase())) {
        dynamicSuggestions.add(user.department)
      }
      if (user.email && user.email.toLowerCase().includes(query.toLowerCase())) {
        dynamicSuggestions.add(user.email)
      }
    })
    
    // Add popular searches from history
    historicalSearches.data?.forEach(search => {
      dynamicSuggestions.add(search.query)
    })
    
    // Add contextual/smart suggestions
    const contextualSuggestions = generateSmartSuggestions(query, ticketSuggestions.data || [], userSuggestions.data || [])
    contextualSuggestions.forEach(s => dynamicSuggestions.add(s))

    console.log('✅ Search Suggestions API - Found:', dynamicSuggestions.size, 'suggestions')

    // If no query, show recent searches
    const finalSuggestions = query.length < 2 
      ? recentSearches?.map(r => r.query).slice(0, limit) || []
      : Array.from(dynamicSuggestions).slice(0, limit)

    return NextResponse.json({
      suggestions: finalSuggestions,
      recent_searches: recentSearches?.map(r => r.query) || [],
      contextual: contextualSuggestions,
      has_real_data: {
        tickets: ticketSuggestions.data?.length || 0,
        users: userSuggestions.data?.length || 0,
        history: historicalSearches.data?.length || 0
      }
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

function generateSmartSuggestions(query: string, tickets: any[], users: any[]): string[] {
  const suggestions: string[] = []
  const queryLower = query.toLowerCase()
  
  if (query.length < 2) return []
  
  // Autocomplete for prefixes like 'dev-', 'fix-', etc.
  const autocompleteMatches = new Set<string>()
  
  // Get ticket titles that start with or contain the query for autocomplete
  tickets.forEach(ticket => {
    if (ticket.title) {
      const words = ticket.title.toLowerCase().split(/\s+/)
      words.forEach(word => {
        if (word.startsWith(queryLower) && word.length > queryLower.length) {
          autocompleteMatches.add(word)
        }
      })
      
      // For prefixes like 'dev-', suggest the full phrase
      if (ticket.title.toLowerCase().includes(queryLower)) {
        const titleWords = ticket.title.split(' ')
        titleWords.forEach((word, index) => {
          if (word.toLowerCase().includes(queryLower) && titleWords.length > index + 1) {
            autocompleteMatches.add(titleWords.slice(index, index + 2).join(' '))
          }
        })
      }
    }
  })
  
  // Add at least 3 autocomplete suggestions
  const autocompleteSuggestions = Array.from(autocompleteMatches).slice(0, 3)
  suggestions.push(...autocompleteSuggestions)
  
  // Smart contextual suggestions based on real data
  const departments = new Set(users.filter(u => u.department).map(u => u.department))
  const ticketTypes = new Set(tickets.map(t => t.type))
  
  // Suggest departments if query matches
  departments.forEach(dept => {
    if (dept.toLowerCase().includes(queryLower)) {
      suggestions.push(`${dept} team`, `${dept} tickets`, `${dept} users`)
    }
  })
  
  // Suggest ticket types
  ticketTypes.forEach(type => {
    if (type.toLowerCase().includes(queryLower)) {
      suggestions.push(`${type} tickets`, `open ${type}s`, `recent ${type}s`)
    }
  })
  
  // Smart prefix matching
  if (queryLower.startsWith('fix')) {
    suggestions.push('fix login page error', 'fix network issues', 'fix software bugs')
  }
  if (queryLower.startsWith('dev') || queryLower.startsWith('develop')) {
    suggestions.push('development team', 'developer tools', 'development tickets')
  }
  if (queryLower.startsWith('deploy')) {
    suggestions.push('deployment issues', 'deploy new features', 'deployment tickets')
  }
  if (queryLower.startsWith('admin')) {
    suggestions.push('administrator access', 'admin panel', 'admin users')
  }
  
  return [...new Set(suggestions)].slice(0, 8)
}

export const dynamic = "force-dynamic"
