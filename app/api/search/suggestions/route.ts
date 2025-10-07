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
    
    // Get real data for dynamic suggestions (even for empty queries to show history-based suggestions)
    const [ticketSuggestions, userSuggestions, servicesSuggestions, historicalSearches] = await Promise.all([
      // Get matching tickets or recent tickets if no query
      supabase
        .from('tickets')
        .select('title, ticket_number, type, priority, status')
        .eq('organization_id', profile.organization_id)
        .then(response => {
          if (query) {
            return supabase
              .from('tickets')
              .select('title, ticket_number, type, priority, status')
              .eq('organization_id', profile.organization_id)
              .ilike('title', `%${query}%`)
              .limit(10)
          } else {
            // For empty query, get recent tickets for suggestions
            return supabase
              .from('tickets')
              .select('title, ticket_number, type, priority, status')
              .eq('organization_id', profile.organization_id)
              .order('created_at', { ascending: false })
              .limit(8)
          }
        }),
      
      // Get matching users or popular departments if no query
      supabase
        .from('profiles')
        .select('display_name, email, department')
        .eq('organization_id', profile.organization_id)
        .then(response => {
          if (query) {
            return supabase
              .from('profiles')
              .select('display_name, email, department')
              .eq('organization_id', profile.organization_id)
              .or(`display_name.ilike.%${query}%,email.ilike.%${query}%,department.ilike.%${query}%`)
              .limit(10)
          } else {
            // For empty query, get distinct departments for suggestions
            return supabase
              .from('profiles')
              .select('display_name, email, department')
              .eq('organization_id', profile.organization_id)
              .not('department', 'is', null)
              .limit(6)
          }
        }),
      
      // Get services data
      supabase
        .from('services')
        .select(`
          name, 
          description, 
          status,
          service_categories!category_id(
            name
          )
        `)
        .eq('organization_id', profile.organization_id)
        .then(response => {
          if (query) {
            return supabase
              .from('services')
              .select(`
                name, 
                description, 
                status,
                service_categories!category_id(
                  name
                )
              `)
              .eq('organization_id', profile.organization_id)
              .ilike('name', `%${query}%`)
              .neq('status', 'draft')
              .limit(8)
          } else {
            return supabase
              .from('services')
              .select(`
                name, 
                description, 
                status,
                service_categories!category_id(
                  name
                )
              `)
              .eq('organization_id', profile.organization_id)
              .neq('status', 'draft')
              .limit(5)
          }
        }),
      
      // Get historical searches
      supabase
        .from('search_suggestions')
        .select('query, result_count, created_at')
        .eq('organization_id', profile.organization_id)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .then(response => {
          if (query) {
            return supabase
              .from('search_suggestions')
              .select('query, result_count, created_at')
              .eq('organization_id', profile.organization_id)
              .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
              .ilike('query', `%${query}%`)
              .order('created_at', { ascending: false })
              .limit(5)
          } else {
            return supabase
              .from('search_suggestions')
              .select('query, result_count, created_at')
              .eq('organization_id', profile.organization_id)
              .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
              .order('created_at', { ascending: false })
              .limit(8)
          }
        })
    ])

    // Check for errors in any of the queries
    const hasErrors = [ticketSuggestions.error, userSuggestions.error, servicesSuggestions.error, historicalSearches.error].some(e => e)
    if (hasErrors) {
      console.error('❌ Search Suggestions API - Database error:', { 
        ticketError: ticketSuggestions.error, 
        userError: userSuggestions.error, 
        servicesError: servicesSuggestions.error,
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
    
    // Add ticket-based suggestions with fuzzy matching
    ticketSuggestions.data?.forEach(ticket => {
      if (query) {
        // Exact and fuzzy matching for ticket titles
        if (ticket.title) {
          const titleLower = ticket.title.toLowerCase()
          const queryLower = query.toLowerCase()
          
          // Exact substring match
          if (titleLower.includes(queryLower)) {
            dynamicSuggestions.add(ticket.title)
          }
          // Fuzzy match for typos (e.g., "hellop" matches "hello")
          else if (fuzzyMatchSimple(queryLower, titleLower)) {
            dynamicSuggestions.add(ticket.title)
          }
        }
        
        if (ticket.ticket_number && ticket.ticket_number.toLowerCase().includes(query.toLowerCase())) {
          dynamicSuggestions.add(ticket.ticket_number)
        }
        
        // Type-based suggestions with fuzzy matching
        if (ticket.type) {
          const typeLower = ticket.type.toLowerCase()
          if (typeLower.includes(query.toLowerCase()) || fuzzyMatchSimple(query.toLowerCase(), typeLower)) {
            dynamicSuggestions.add(`${ticket.type} tickets`)
          }
        }
      } else {
        // For empty query, suggest recent ticket titles and types
        if (ticket.title) dynamicSuggestions.add(ticket.title)
        if (ticket.type) dynamicSuggestions.add(`${ticket.type} tickets`)
        if (ticket.priority) dynamicSuggestions.add(`${ticket.priority} priority tickets`)
      }
    })
    
    // Add user-based suggestions
    userSuggestions.data?.forEach(user => {
      if (query) {
        if (user.display_name && user.display_name.toLowerCase().includes(query.toLowerCase())) {
          dynamicSuggestions.add(user.display_name)
        }
        if (user.department && user.department.toLowerCase().includes(query.toLowerCase())) {
          dynamicSuggestions.add(user.department)
        }
        if (user.email && user.email.toLowerCase().includes(query.toLowerCase())) {
          dynamicSuggestions.add(user.email)
        }
      } else {
        // For empty query, suggest departments and recent users
        if (user.department) dynamicSuggestions.add(user.department)
        if (user.display_name) dynamicSuggestions.add(user.display_name)
      }
    })
    
    // Add services-based suggestions
    servicesSuggestions.data?.forEach(service => {
      if (query) {
        if (service.name && service.name.toLowerCase().includes(query.toLowerCase())) {
          dynamicSuggestions.add(service.name)
        }
        if (service.service_categories?.name && service.service_categories.name.toLowerCase().includes(query.toLowerCase())) {
          dynamicSuggestions.add(`${service.service_categories.name} services`)
        }
      } else {
        // For empty query, suggest popular services
        if (service.name) dynamicSuggestions.add(service.name)
        if (service.service_categories?.name) dynamicSuggestions.add(`${service.service_categories.name} services`)
      }
    })
    
    // Add popular searches from history
    historicalSearches.data?.forEach(search => {
      if (search.query && search.query.trim()) {
        dynamicSuggestions.add(search.query)
      }
    })
    
    // Add contextual/smart suggestions
    const contextualSuggestions = generateSmartSuggestions(query, ticketSuggestions.data || [], userSuggestions.data || [], servicesSuggestions.data || [])
    contextualSuggestions.forEach(s => dynamicSuggestions.add(s))

    console.log('✅ Search Suggestions API - Found:', dynamicSuggestions.size, 'suggestions')

    // For empty query, combine recent searches with smart suggestions from real data
    // For any query (including single letters), show dynamic suggestions
    const allSuggestions = Array.from(dynamicSuggestions)
    const recentSearchList = recentSearches?.map(r => r.query).filter(q => q && q.trim()) || []
    
    let finalSuggestions
    if (!query || query.length === 0) {
      // Empty state: combine recent searches and smart suggestions from real data
      const combinedSuggestions = [...new Set([...recentSearchList.slice(0, 3), ...allSuggestions])]
      finalSuggestions = combinedSuggestions.slice(0, limit)
    } else {
      // Any query (including single letters): prioritize dynamic suggestions
      finalSuggestions = allSuggestions.slice(0, limit)
    }

    return NextResponse.json({
      suggestions: finalSuggestions,
      recent_searches: recentSearchList,
      contextual: contextualSuggestions,
      has_real_data: {
        tickets: ticketSuggestions.data?.length || 0,
        users: userSuggestions.data?.length || 0,
        services: servicesSuggestions.data?.length || 0,
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

function generateSmartSuggestions(query: string, tickets: any[], users: any[], services: any[]): string[] {
  const suggestions: string[] = []
  const queryLower = query.toLowerCase()
  
  // Allow single letters for prefix matching
  if (query.length < 1) return []
  
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
  const serviceCategories = new Set(services.filter(s => s.service_categories?.name).map(s => s.service_categories.name))
  
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
  
  // Suggest services and categories
  serviceCategories.forEach(category => {
    if (category.toLowerCase().includes(queryLower)) {
      suggestions.push(`${category} services`, `request ${category}`, `${category} support`)
    }
  })
  
  services.forEach(service => {
    if (service.name && service.name.toLowerCase().includes(queryLower)) {
      suggestions.push(`request ${service.name}`, service.name)
    }
  })
  
  // Smart prefix matching (including single letters)
  if (queryLower.startsWith('f')) {
    suggestions.push('fix login issues', 'fix network problems', 'fix software bugs', 'finance team')
  }
  if (queryLower.startsWith('d')) {
    suggestions.push('development team', 'developer tools', 'deployment tickets', 'database issues')
  }
  if (queryLower.startsWith('a')) {
    suggestions.push('administrator access', 'admin panel', 'admin users', 'access request')
  }
  if (queryLower.startsWith('s')) {
    suggestions.push('service request', 'software installation', 'system access', 'support ticket')
  }
  if (queryLower.startsWith('h')) {
    suggestions.push('hardware request', 'help desk', 'HR department', 'high priority tickets')
  }
  if (queryLower.startsWith('l')) {
    suggestions.push('laptop request', 'login issues', 'license request', 'low priority tickets')
  }
  if (queryLower.startsWith('p')) {
    suggestions.push('password reset', 'printer issues', 'project management', 'pending tickets')
  }
  if (queryLower.startsWith('n')) {
    suggestions.push('network issues', 'new user setup', 'new equipment', 'network access')
  }
  
  // More specific prefix matching
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

// Simple fuzzy matching function
function fuzzyMatchSimple(query: string, text: string): boolean {
  if (query.length === 0) return true
  if (text.length === 0) return false
  
  // Calculate Levenshtein distance
  const matrix = []
  for (let i = 0; i <= text.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= query.length; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= text.length; i++) {
    for (let j = 1; j <= query.length; j++) {
      const cost = text[i - 1] === query[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,     // deletion
        matrix[i][j - 1] + 1,     // insertion
        matrix[i - 1][j - 1] + cost // substitution
      )
    }
  }
  
  const distance = matrix[text.length][query.length]
  const maxLength = Math.max(query.length, text.length)
  const similarity = 1 - (distance / maxLength)
  
  // Also check for substring matches
  const words = text.toLowerCase().split(/\s+/)
  const queryWords = query.toLowerCase().split(/\s+/)
  const hasSubstring = queryWords.some(qWord => 
    words.some(word => word.includes(qWord) || qWord.includes(word))
  )
  
  return similarity > 0.7 || hasSubstring
}

export const dynamic = "force-dynamic"
