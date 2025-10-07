import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  console.log('🔍 Search Tickets API Route called')
  
  try {
    const supabase = await createClient()
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session?.user) {
      console.log('❌ Search Tickets API - User not authenticated')
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
      console.log('❌ Search Tickets API - User has no organization')
      return NextResponse.json({ error: 'User not in organization' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '10')
    
    console.log('🔍 Search Tickets API - Searching for:', { query, limit })
    
    if (query.length < 2) {
      return NextResponse.json({
        tickets: [],
        suggestions: [
          'laptop request',
          'password reset',
          'VPN access',
          'software install',
          'hardware issue'
        ]
      })
    }

    // supabase already created above
    
    // Search in tickets with text matching
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select(`
        id,
        ticket_number,
        title,
        description,
        type,
        category,
        subcategory,
        priority,
        urgency,
        impact,
        status,
        requester_id,
        assignee_id,
        team_id,
        due_date,
        created_at,
        updated_at,
        custom_fields,
        tags,
        requester:profiles!requester_id(id, display_name, email, avatar_url),
        assignee:profiles!assignee_id(id, display_name, email, avatar_url),
        team:teams!team_id(id, name)
      `)
      .eq('organization_id', profile.organization_id)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,ticket_number.ilike.%${query}%,subcategory.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('❌ Search Tickets API - Database error:', error)
      return NextResponse.json({ error: 'Search failed' }, { status: 500 })
    }

    // Generate suggestions based on existing ticket data
    const { data: suggestionData } = await supabase
      .from('tickets')
      .select('title, subcategory, tags')
      .eq('organization_id', profile.organization_id)
      .limit(50)

    const suggestions = new Set<string>()
    
    // Add common terms from titles
    suggestionData?.forEach(ticket => {
      if (ticket.title) {
        ticket.title.toLowerCase().split(' ').forEach(word => {
          if (word.length > 3 && word.toLowerCase().includes(query.toLowerCase())) {
            suggestions.add(ticket.title)
          }
        })
      }
      
      if (ticket.subcategory && ticket.subcategory.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(ticket.subcategory)
      }
      
      if (ticket.tags) {
        ticket.tags.forEach((tag: string) => {
          if (tag.toLowerCase().includes(query.toLowerCase())) {
            suggestions.add(tag)
          }
        })
      }
    })

    // Add contextual suggestions
    suggestions.add(`Search tickets: "${query}"`)
    if (query.toLowerCase().includes('password')) {
      suggestions.add('password reset')
      suggestions.add('password expired')
    }
    if (query.toLowerCase().includes('laptop') || query.toLowerCase().includes('computer')) {
      suggestions.add('laptop request')
      suggestions.add('hardware replacement')
    }
    if (query.toLowerCase().includes('access')) {
      suggestions.add('VPN access')
      suggestions.add('system access')
    }

    const searchResults = tickets.map(ticket => ({
      id: ticket.id,
      title: ticket.title,
      description: ticket.description,
      type: 'ticket' as const,
      category: ticket.subcategory || 'General',
      url: `/tickets?view=${ticket.id}`,
      relevance: calculateRelevance(ticket, query),
      metadata: {
        ticket_number: ticket.ticket_number,
        status: ticket.status,
        priority: ticket.priority,
        assignee: ticket.assignee?.display_name || 'Unassigned',
        team: ticket.team?.name,
        due_date: ticket.due_date,
        created_at: ticket.created_at,
        tags: ticket.tags
      }
    }))

    console.log('✅ Search Tickets API - Found:', searchResults.length, 'tickets')

    return NextResponse.json({
      tickets: searchResults,
      suggestions: Array.from(suggestions).slice(0, 8)
    })

  } catch (error) {
    console.error('❌ Search Tickets API - Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function calculateRelevance(ticket: any, query: string): number {
  const queryLower = query.toLowerCase()
  let score = 0

  // Title matching (highest weight)
  if (ticket.title.toLowerCase().includes(queryLower)) {
    score += 0.8
    if (ticket.title.toLowerCase().startsWith(queryLower)) {
      score += 0.2
    }
  }

  // Description matching
  if (ticket.description && ticket.description.toLowerCase().includes(queryLower)) {
    score += 0.4
  }

  // Ticket number exact match
  if (ticket.ticket_number.toLowerCase().includes(queryLower)) {
    score += 0.9
  }

  // Category/subcategory matching
  if (ticket.subcategory && ticket.subcategory.toLowerCase().includes(queryLower)) {
    score += 0.3
  }

  // Tags matching
  if (ticket.tags && ticket.tags.some((tag: string) => tag.toLowerCase().includes(queryLower))) {
    score += 0.2
  }

  // Priority boost for recent tickets
  const daysSinceCreated = Math.floor((Date.now() - new Date(ticket.created_at).getTime()) / (1000 * 60 * 60 * 24))
  if (daysSinceCreated < 7) {
    score += 0.1
  }

  // Status boost for active tickets
  if (['new', 'open', 'in_progress'].includes(ticket.status)) {
    score += 0.1
  }

  return Math.min(score, 1.0)
}

export const dynamic = "force-dynamic"
