import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createHash } from 'crypto'

// Generate a meaningful search ID based on query
function generateSearchId(query: string, orgId: string): string {
  // Create hash from query + timestamp for uniqueness
  const hash = createHash('sha256')
    .update(`${query.toLowerCase().trim()}-${orgId}-${Date.now()}`)
    .digest('base64url') // URL-safe base64
    .substring(0, 8) // Take first 8 characters
  
  return hash
}

// POST: Create a new search ID
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { query } = await request.json()
    
    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', session.user.id)
      .single()

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'User not in organization' }, { status: 403 })
    }

    // Generate search ID using hash algorithm (meaningful, not random)
    const searchId = generateSearchId(query.trim(), profile.organization_id)

    // Store in database (using search_suggestions table)
    const { error } = await supabase
      .from('search_suggestions')
      .insert({
        search_id: searchId,
        organization_id: profile.organization_id,
        user_id: session.user.id,
        query: query.trim(),
        search_type: 'all',
        result_count: 0,
      })

    if (error) {
      console.error('Error creating search ID:', error)
      return NextResponse.json({ error: 'Failed to create search ID' }, { status: 500 })
    }

    return NextResponse.json({ id: searchId, query })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET: Retrieve query by search ID
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', session.user.id)
      .single()

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'User not in organization' }, { status: 403 })
    }

    // Retrieve from database
    const { data, error } = await supabase
      .from('search_suggestions')
      .select('query')
      .eq('search_id', id)
      .eq('organization_id', profile.organization_id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Search ID not found' }, { status: 404 })
    }

    return NextResponse.json({ query: data.query })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"
