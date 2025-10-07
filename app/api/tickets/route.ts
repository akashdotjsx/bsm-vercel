import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    let organizationId = null
    
    if (user) {
      // Get user's organization if authenticated
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()
      
      organizationId = profile?.organization_id
    }
    
    console.log('🔐 API Route - User authenticated:', !!user, 'Org ID:', organizationId)

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
      .order('created_at', { ascending: false })
    
    // Only filter by organization if we have one
    if (organizationId) {
      query = query.eq('organization_id', organizationId)
    }

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

    console.log('🔍 API Route - Executing query with params:', { page, limit, status, priority, type, assignee_id, search })
    const { data: tickets, error, count } = await query

    console.log('📊 API Route - Query result:', { 
      ticketsCount: tickets?.length || 0, 
      error: error?.message || 'None', 
      count 
    })

    if (error) {
      console.error('❌ API Route - Error fetching tickets:', error)
      return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 })
    }

    const result = {
      tickets: tickets || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    }
    
    console.log('✅ API Route - Returning result:', result)
    return NextResponse.json(result)
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
    console.log('📝 API Route - Creating ticket with data:', body)
    
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
      custom_fields = {},
      initial_comments = [],
      initial_checklist = []
    } = body

    // Validate required fields
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    if (!description || (typeof description === 'string' && description.trim() === '')) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 })
    }

    // Generate unique ticket number
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substr(2, 6).toUpperCase()
    const ticketNumber = `TK-${timestamp}-${randomString}`
    
    console.log('🎫 Generated ticket number:', ticketNumber)

    // Prepare ticket data, only including defined values
    const ticketData: any = {
      organization_id: profile.organization_id,
      ticket_number: ticketNumber,
      title,
      description,
      type,
      priority,
      urgency,
      impact,
      status: 'new',
      requester_id: user.id,
      due_date: due_date ? new Date(due_date).toISOString() : null,
      tags: tags || [],
      custom_fields,
      channel: 'web'
    }

    // Only include optional fields if they have values
    if (category) ticketData.category = category
    if (subcategory) ticketData.subcategory = subcategory
    if (assignee_id) ticketData.assignee_id = assignee_id
    if (team_id) ticketData.team_id = team_id

    console.log('📝 API Route - Inserting ticket data:', ticketData)

    // Create ticket
    const { data: ticket, error } = await supabase
      .from('tickets')
      .insert(ticketData)
      .select(`
        *,
        requester:profiles!tickets_requester_id_fkey(id, first_name, last_name, display_name, email, avatar_url),
        assignee:profiles!tickets_assignee_id_fkey(id, first_name, last_name, display_name, email, avatar_url),
        team:teams(id, name, description)
      `)
      .single()

    if (error) {
      console.error('❌ API Route - Error creating ticket:', error)
      console.error('❌ API Route - Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      
      // Provide more specific error messages based on error codes
      let errorMessage = 'Failed to create ticket'
      if (error.code === '23503') {
        errorMessage = 'Foreign key constraint violation - check if referenced records exist'
      } else if (error.code === '23505') {
        errorMessage = 'Duplicate entry - ticket number already exists'
      } else if (error.code === '23514') {
        errorMessage = 'Check constraint violation - invalid data values'
      }
      
      return NextResponse.json({ 
        error: errorMessage, 
        details: error.message,
        code: error.code
      }, { status: 500 })
    }

    // Optionally create initial comments
    if (Array.isArray(initial_comments) && initial_comments.length > 0) {
      const rows = initial_comments
        .filter((c: any) => c && typeof c.content === 'string' && c.content.trim() !== '')
        .map((c: any) => ({
          ticket_id: ticket.id,
          author_id: user.id,
          content: c.content.trim(),
          is_internal: !!c.is_internal,
          metadata: {}
        }))
      if (rows.length > 0) {
        const { error: commentErr } = await supabase
          .from('ticket_comments')
          .insert(rows)
        if (commentErr) {
          // Roll back ticket to avoid partial creation
          await supabase.from('tickets').delete().eq('id', ticket.id)
          return NextResponse.json({ error: 'Failed to create initial comments' }, { status: 500 })
        }
      }
    }

    // Optionally create initial checklist
    if (Array.isArray(initial_checklist) && initial_checklist.length > 0) {
      const rows = initial_checklist
        .filter((i: any) => i && typeof i.text === 'string' && i.text.trim() !== '')
        .map((i: any) => ({
          ticket_id: ticket.id,
          text: i.text.trim(),
          completed: !!i.completed,
          assignee_id: i.assignee_id || null,
          due_date: i.due_date ? new Date(i.due_date).toISOString() : null,
          created_by: user.id
        }))
      if (rows.length > 0) {
        const { error: checklistErr } = await supabase
          .from('ticket_checklist')
          .insert(rows)
        if (checklistErr) {
          await supabase.from('tickets').delete().eq('id', ticket.id)
          return NextResponse.json({ error: 'Failed to create initial checklist' }, { status: 500 })
        }
      }
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
