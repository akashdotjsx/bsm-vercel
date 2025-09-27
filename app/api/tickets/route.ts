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
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const type = searchParams.get('type')
    const assignee_id = searchParams.get('assignee_id')
    const search = searchParams.get('search')

    // Build query
    let query = supabase
      .from('tickets')
      .select(`
        *,
        requester:profiles!tickets_requester_id_fkey(id, first_name, last_name, display_name, email, avatar_url),
        assignee:profiles!tickets_assignee_id_fkey(id, first_name, last_name, display_name, email, avatar_url),
        team:teams(id, name, description),
        sla_policy:sla_policies(id, name, first_response_time_hours, resolution_time_hours)
      `)
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: false })

    // Apply filters
    if (status) query = query.eq('status', status)
    if (priority) query = query.eq('priority', priority)
    if (type) query = query.eq('type', type)
    if (assignee_id) query = query.eq('assignee_id', assignee_id)
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,ticket_number.ilike.%${search}%`)
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: tickets, error, count } = await query

    if (error) {
      console.error('Error fetching tickets:', error)
      return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 })
    }

    return NextResponse.json({
      tickets: tickets || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Unexpected error in tickets GET:', error)
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

    // Get user's profile and organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, first_name, last_name, display_name')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const body = await request.json()
    const {
      title,
      description,
      type = 'request',
      category,
      subcategory,
      priority = 'medium',
      urgency = 'medium',
      impact = 'medium',
      assignee_id,
      team_id,
      due_date,
      tags = [],
      custom_fields = {}
    } = body

    // Validate required fields
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Generate ticket number
    const ticketNumber = `TK-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`

    // Create ticket
    const { data: ticket, error } = await supabase
      .from('tickets')
      .insert({
        organization_id: profile.organization_id,
        ticket_number: ticketNumber,
        title,
        description,
        type,
        category,
        subcategory,
        priority,
        urgency,
        impact,
        status: 'new',
        requester_id: user.id,
        assignee_id,
        team_id,
        due_date: due_date ? new Date(due_date).toISOString() : null,
        tags,
        custom_fields,
        channel: 'web'
      })
      .select(`
        *,
        requester:profiles!tickets_requester_id_fkey(id, first_name, last_name, display_name, email, avatar_url),
        assignee:profiles!tickets_assignee_id_fkey(id, first_name, last_name, display_name, email, avatar_url),
        team:teams(id, name, description)
      `)
      .single()

    if (error) {
      console.error('Error creating ticket:', error)
      return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 })
    }

    // Create initial history entry
    await supabase
      .from('ticket_history')
      .insert({
        ticket_id: ticket.id,
        changed_by: user.id,
        field_name: 'status',
        old_value: null,
        new_value: 'new',
        change_reason: 'Ticket created'
      })

    return NextResponse.json({
      success: true,
      ticket
    }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error in tickets POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
