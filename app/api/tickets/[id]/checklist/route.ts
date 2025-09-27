import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Verify ticket exists and user has access
    const { data: ticket } = await supabase
      .from('tickets')
      .select('id')
      .eq('id', params.id)
      .eq('organization_id', profile.organization_id)
      .single()

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Get checklist items
    const { data: checklist, error } = await supabase
      .from('ticket_checklist')
      .select(`
        id,
        text,
        completed,
        due_date,
        created_at,
        updated_at,
        assignee:profiles!ticket_checklist_assignee_id_fkey(id, first_name, last_name, display_name, email, avatar_url),
        created_by:profiles!ticket_checklist_created_by_fkey(id, first_name, last_name, display_name, email)
      `)
      .eq('ticket_id', params.id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching checklist:', error)
      return NextResponse.json({ error: 'Failed to fetch checklist' }, { status: 500 })
    }

    return NextResponse.json({ checklist: checklist || [] })
  } catch (error) {
    console.error('Unexpected error in checklist GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Verify ticket exists and user has access
    const { data: ticket } = await supabase
      .from('tickets')
      .select('id')
      .eq('id', params.id)
      .eq('organization_id', profile.organization_id)
      .single()

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    const body = await request.json()
    const { text, assignee_id, due_date } = body

    if (!text || text.trim() === '') {
      return NextResponse.json({ error: 'Checklist item text is required' }, { status: 400 })
    }

    // Create checklist item
    const { data: checklistItem, error } = await supabase
      .from('ticket_checklist')
      .insert({
        ticket_id: params.id,
        text: text.trim(),
        assignee_id,
        due_date: due_date ? new Date(due_date).toISOString() : null,
        created_by: user.id
      })
      .select(`
        id,
        text,
        completed,
        due_date,
        created_at,
        updated_at,
        assignee:profiles!ticket_checklist_assignee_id_fkey(id, first_name, last_name, display_name, email, avatar_url),
        created_by:profiles!ticket_checklist_created_by_fkey(id, first_name, last_name, display_name, email)
      `)
      .single()

    if (error) {
      console.error('Error creating checklist item:', error)
      return NextResponse.json({ error: 'Failed to create checklist item' }, { status: 500 })
    }

    // Create history entry
    await supabase
      .from('ticket_history')
      .insert({
        ticket_id: params.id,
        changed_by: user.id,
        field_name: 'checklist',
        old_value: null,
        new_value: 'Checklist item added',
        change_reason: `Added: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`
      })

    return NextResponse.json({
      success: true,
      checklistItem
    }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error in checklist POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
