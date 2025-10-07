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

    // Get ticket with all related data
    const { data: ticket, error } = await supabase
      .from('tickets')
      .select(`
        *,
        requester:profiles!tickets_requester_id_fkey(id, first_name, last_name, display_name, email, avatar_url),
        assignee:profiles!tickets_assignee_id_fkey(id, first_name, last_name, display_name, email, avatar_url),
        team:teams(id, name, description),
        sla_policy:sla_policies(id, name, first_response_time_hours, resolution_time_hours),
        comments:ticket_comments(
          id,
          content,
          is_internal,
          is_system,
          metadata,
          created_at,
          author:profiles!ticket_comments_author_id_fkey(id, first_name, last_name, display_name, email, avatar_url)
        ),
        attachments:ticket_attachments(
          id,
          filename,
          file_size,
          mime_type,
          storage_path,
          is_public,
          created_at,
          uploaded_by:profiles!ticket_attachments_uploaded_by_fkey(id, first_name, last_name, display_name, email)
        ),
        history:ticket_history(
          id,
          field_name,
          old_value,
          new_value,
          change_reason,
          created_at,
          changed_by:profiles!ticket_history_changed_by_fkey(id, first_name, last_name, display_name, email)
        )
      `)
      .eq('id', params.id)
      .eq('organization_id', profile.organization_id)
      .single()

    if (error) {
      console.error('Error fetching ticket:', error)
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    return NextResponse.json({ ticket })
  } catch (error) {
    console.error('Unexpected error in ticket GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
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

    const body = await request.json()
    const {
      title,
      description,
      type,
      category,
      subcategory,
      priority,
      urgency,
      impact,
      status,
      assignee_id,
      team_id,
      due_date,
      tags,
      custom_fields
    } = body

    // Get current ticket to track changes
    const { data: currentTicket } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', params.id)
      .eq('organization_id', profile.organization_id)
      .single()

    if (!currentTicket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (type !== undefined) updateData.type = type
    if (category !== undefined) updateData.category = category
    if (subcategory !== undefined) updateData.subcategory = subcategory
    if (priority !== undefined) updateData.priority = priority
    if (urgency !== undefined) updateData.urgency = urgency
    if (impact !== undefined) updateData.impact = impact
    if (status !== undefined) updateData.status = status
    if (assignee_id !== undefined) updateData.assignee_id = assignee_id
    if (team_id !== undefined) updateData.team_id = team_id
    if (due_date !== undefined) updateData.due_date = due_date ? new Date(due_date).toISOString() : null
    if (tags !== undefined) updateData.tags = tags
    if (custom_fields !== undefined) updateData.custom_fields = custom_fields

    // Update ticket
    const { data: ticket, error } = await supabase
      .from('tickets')
      .update(updateData)
      .eq('id', params.id)
      .eq('organization_id', profile.organization_id)
      .select(`
        *,
        requester:profiles!tickets_requester_id_fkey(id, first_name, last_name, display_name, email, avatar_url),
        assignee:profiles!tickets_assignee_id_fkey(id, first_name, last_name, display_name, email, avatar_url),
        team:teams(id, name, description)
      `)
      .single()

    if (error) {
      console.error('Error updating ticket:', error)
      return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 })
    }

    // Create history entries for changed fields
    const historyEntries = []
    for (const [field, newValue] of Object.entries(updateData)) {
      if (field === 'updated_at') continue
      
      const oldValue = currentTicket[field]
      if (oldValue !== newValue) {
        historyEntries.push({
          ticket_id: params.id,
          changed_by: user.id,
          field_name: field,
          old_value: oldValue ? String(oldValue) : null,
          new_value: newValue ? String(newValue) : null,
          change_reason: 'Field updated'
        })
      }
    }

    if (historyEntries.length > 0) {
      await supabase
        .from('ticket_history')
        .insert(historyEntries)
    }

    return NextResponse.json({
      success: true,
      ticket
    })
  } catch (error) {
    console.error('Unexpected error in ticket PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🗑️ DELETE API called with ticket ID:', params.id)
    
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.log('❌ No user found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('✅ User authenticated:', user.id)

    // Get user's organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      console.log('❌ Profile not found for user:', user.id)
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    console.log('✅ User organization:', profile.organization_id)

    // Check if ticket exists first
    const { data: existingTicket } = await supabase
      .from('tickets')
      .select('id, ticket_number, title')
      .eq('id', params.id)
      .eq('organization_id', profile.organization_id)
      .single()

    if (!existingTicket) {
      console.log('❌ Ticket not found:', params.id)
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    console.log('✅ Ticket found:', existingTicket.ticket_number, existingTicket.title)

    // Delete ticket (this will cascade to related records)
    const { error } = await supabase
      .from('tickets')
      .delete()
      .eq('id', params.id)
      .eq('organization_id', profile.organization_id)

    if (error) {
      console.error('❌ Error deleting ticket:', error)
      return NextResponse.json({ error: 'Failed to delete ticket' }, { status: 500 })
    }

    console.log('✅ Ticket deleted successfully from database')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Unexpected error in ticket DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
