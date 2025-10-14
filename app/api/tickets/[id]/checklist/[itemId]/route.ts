import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
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
    const { text, completed, assignee_id, due_date } = body

    // Get current checklist item
    const { data: currentItem } = await supabase
      .from('ticket_checklist')
      .select('*')
      .eq('id', params.itemId)
      .eq('ticket_id', params.id)
      .single()

    if (!currentItem) {
      return NextResponse.json({ error: 'Checklist item not found' }, { status: 404 })
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (text !== undefined) updateData.text = text
    if (completed !== undefined) updateData.completed = completed
    if (assignee_id !== undefined) updateData.assignee_id = assignee_id
    if (due_date !== undefined) updateData.due_date = due_date ? new Date(due_date).toISOString() : null

    // Update checklist item
    const { data: checklistItem, error } = await supabase
      .from('ticket_checklist')
      .update(updateData)
      .eq('id', params.itemId)
      .eq('ticket_id', params.id)
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
      console.error('Error updating checklist item:', error)
      return NextResponse.json({ error: 'Failed to update checklist item' }, { status: 500 })
    }

    // Create history entries for changed fields
    const historyEntries = []
    for (const [field, newValue] of Object.entries(updateData)) {
      if (field === 'updated_at') continue
      
      const oldValue = currentItem[field]
      if (oldValue !== newValue) {
        historyEntries.push({
          ticket_id: params.id,
          changed_by: user.id,
          field_name: `checklist_${field}`,
          old_value: oldValue ? String(oldValue) : null,
          new_value: newValue ? String(newValue) : null,
          change_reason: `Checklist item updated: ${field}`
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
      checklistItem
    })
  } catch (error) {
    console.error('Unexpected error in checklist item PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
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

    // Get checklist item before deletion
    const { data: checklistItem } = await supabase
      .from('ticket_checklist')
      .select('text')
      .eq('id', params.itemId)
      .eq('ticket_id', params.id)
      .single()

    if (!checklistItem) {
      return NextResponse.json({ error: 'Checklist item not found' }, { status: 404 })
    }

    // Delete checklist item
    const { error } = await supabase
      .from('ticket_checklist')
      .delete()
      .eq('id', params.itemId)
      .eq('ticket_id', params.id)

    if (error) {
      console.error('Error deleting checklist item:', error)
      return NextResponse.json({ error: 'Failed to delete checklist item' }, { status: 500 })
    }

    // Create history entry
    await supabase
      .from('ticket_history')
      .insert({
        ticket_id: params.id,
        changed_by: user.id,
        field_name: 'checklist',
        old_value: 'Checklist item exists',
        new_value: 'Checklist item deleted',
        change_reason: `Deleted: ${checklistItem.text.substring(0, 50)}${checklistItem.text.length > 50 ? '...' : ''}`
      })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error in checklist item DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
