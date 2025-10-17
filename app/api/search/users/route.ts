import { NextRequest, NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'
import { CACHE_TAGS } from '@/lib/cache'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  console.log('🔍 Search Users API Route called')
  
  try {
    const supabase = await createClient()
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session?.user) {
      console.log('❌ Search Users API - User not authenticated')
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
      console.log('❌ Search Users API - User has no organization')
      return NextResponse.json({ error: 'User not in organization' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '10')
    
    console.log('🔍 Search Users API - Searching for:', { query, limit })

    // supabase already created above
    
    // Search in profiles/users
    let userQuery = supabase
      .from('profiles')
      .select(`
        id,
        email,
        display_name,
        avatar_url,
        phone,
        department,
        created_at,
        updated_at,
        user_roles!user_roles_user_id_fkey(
          roles(
            id,
            name,
            description
          )
        )
      `)
      .eq('organization_id', profile.organization_id)
    
    // Only apply search filter if query is provided
    if (query) {
      userQuery = userQuery.or(`display_name.ilike.%${query}%,email.ilike.%${query}%,department.ilike.%${query}%`)
    }
    
    const { data: users, error } = await userQuery
      .order('display_name', { ascending: true })
      .limit(limit)

    if (error) {
      console.error('❌ Search Users API - Database error:', error)
      return NextResponse.json({ error: 'Search failed' }, { status: 500 })
    }

    // Generate suggestions based on existing user data
    const { data: suggestionData } = await supabase
      .from('profiles')
      .select('display_name, department')
      .eq('organization_id', profile.organization_id)
      .limit(50)

    const suggestions = new Set<string>()
    
    // Add common terms from names and roles
    suggestionData?.forEach(profile => {
      if (profile.display_name) {
        profile.display_name.split(' ').forEach(word => {
          if (word.length > 2 && word.toLowerCase().includes(query.toLowerCase())) {
            suggestions.add(profile.display_name)
          }
        })
      }
      
      if (profile.department && profile.department.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(profile.department)
      }
    })

    // Add contextual suggestions
    suggestions.add(`Search users: "${query}"`)
    if (query.toLowerCase().includes('admin')) {
      suggestions.add('System Administrator')
      suggestions.add('Admin users')
    }
    if (query.toLowerCase().includes('dev')) {
      suggestions.add('Developer')
      suggestions.add('Development Team')
    }
    if (query.toLowerCase().includes('manager')) {
      suggestions.add('Manager')
      suggestions.add('Project Manager')
    }

    const searchResults = users.map(userProfile => ({
      id: userProfile.id,
      title: userProfile.display_name || userProfile.email,
      description: `User in ${userProfile.department || 'Organization'}`,
      type: 'user' as const,
      category: userProfile.department || 'General',
      url: `/users/${userProfile.id}`,
      relevance: calculateUserRelevance(userProfile, query),
      metadata: {
        email: userProfile.email,
        department: userProfile.department,
        avatar_url: userProfile.avatar_url,
        phone: userProfile.phone,
        roles: userProfile.user_roles?.map(ur => ur.roles.name) || [],
        created_at: userProfile.created_at
      }
    }))

    console.log('✅ Search Users API - Found:', searchResults.length, 'users')

    return NextResponse.json({
      users: searchResults,
      suggestions: Array.from(suggestions).slice(0, 8)
    })

  } catch (error) {
    console.error('❌ Search Users API - Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function calculateUserRelevance(userProfile: any, query: string): number {
  const queryLower = query.toLowerCase()
  let score = 0

  // Display name matching (highest weight)
  if (userProfile.display_name && userProfile.display_name.toLowerCase().includes(queryLower)) {
    score += 0.8
    if (userProfile.display_name.toLowerCase().startsWith(queryLower)) {
      score += 0.2
    }
  }

  // Email matching
  if (userProfile.email && userProfile.email.toLowerCase().includes(queryLower)) {
    score += 0.7
    // Exact email match gets highest score
    if (userProfile.email.toLowerCase() === queryLower) {
      score += 0.3
    }
  }

  // Department matching
  if (userProfile.department && userProfile.department.toLowerCase().includes(queryLower)) {
    score += 0.4
  }

  // Role matching
  if (userProfile.user_roles) {
    userProfile.user_roles.forEach((userRole: any) => {
      if (userRole.roles.name.toLowerCase().includes(queryLower)) {
        score += 0.3
      }
    })
  }

  return Math.min(score, 1.0)
}

export const dynamic = "force-dynamic"
