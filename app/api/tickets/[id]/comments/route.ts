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

    // Get comments
    const { data: comments, error } = await supabase
      .from('ticket_comments')
      .select(`
        id,
        content,
        is_internal,
        is_system,
        metadata,
        created_at,
        author:profiles!ticket_comments_author_id_fkey(id, first_name, last_name, display_name, email, avatar_url)
      `)
      .eq('ticket_id', params.id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching comments:', error)
      return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
    }

    return NextResponse.json({ comments: comments || [] })
  } catch (error) {
    console.error('Unexpected error in comments GET:', error)
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
    const { content, is_internal = false, metadata = {} } = body

    if (!content || content.trim() === '') {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 })
    }

    // Create comment
    const { data: comment, error } = await supabase
      .from('ticket_comments')
      .insert({
        ticket_id: params.id,
        author_id: user.id,
        content: content.trim(),
        is_internal,
        metadata
      })
      .select(`
        id,
        content,
        is_internal,
        is_system,
        metadata,
        created_at,
        author:profiles!ticket_comments_author_id_fkey(id, first_name, last_name, display_name, email, avatar_url)
      `)
      .single()

    if (error) {
      console.error('Error creating comment:', error)
      return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
    }

    // Create history entry
    await supabase
      .from('ticket_history')
      .insert({
        ticket_id: params.id,
        changed_by: user.id,
        field_name: 'comment',
        old_value: null,
        new_value: 'Comment added',
        change_reason: `Comment: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`
      })

    return NextResponse.json({
      success: true,
      comment
    }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error in comments POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
