import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export interface TicketContext {
  ticket: {
    id: string
    number: string
    title: string
    description: string | null
    status: string
    priority: string
    type: string
    created_at: string
    updated_at: string
    assignee?: { name: string; email: string } | null
    requester?: { name: string; email: string } | null
    team?: { name: string } | null
  }
  comments: Array<{
    author: string
    content: string
    timestamp: string
    is_internal: boolean
  }>
  history: Array<{
    field: string
    old_value: string | null
    new_value: string | null
    changed_by: string
    timestamp: string
  }>
  checklist: Array<{
    text: string
    completed: boolean
  }>
}

export async function buildTicketContext(ticketId: string): Promise<TicketContext> {
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
      },
    }
  )

  // Fetch ticket with all related data via GraphQL
  const { data, error } = await supabase
    .from('tickets')
    .select(`
      id,
      ticket_number,
      title,
      description,
      status,
      priority,
      type,
      created_at,
      updated_at,
      assignee_profile:profiles!tickets_assignee_id_fkey (
        display_name,
        email
      ),
      requester_profile:profiles!tickets_requester_id_fkey (
        display_name,
        email
      ),
      team_data:teams (
        name
      ),
      ticket_comments (
        content,
        created_at,
        is_internal,
        author:profiles!ticket_comments_author_id_fkey (
          display_name
        )
      ),
      ticket_history (
        field_name,
        old_value,
        new_value,
        created_at,
        changed_by:profiles!ticket_history_changed_by_fkey (
          display_name
        )
      ),
      ticket_checklist (
        text,
        completed
      )
    `)
    .eq('id', ticketId)
    .single()

  if (error || !data) {
    throw new Error(`Failed to fetch ticket: ${error?.message || 'Not found'}`)
  }

  // Transform to our context structure
  return {
    ticket: {
      id: data.id,
      number: data.ticket_number,
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      type: data.type,
      created_at: data.created_at,
      updated_at: data.updated_at,
      assignee: (data as any).assignee_profile
        ? { name: (data as any).assignee_profile.display_name || 'Unknown', email: (data as any).assignee_profile.email }
        : null,
      requester: (data as any).requester_profile
        ? { name: (data as any).requester_profile.display_name || 'Unknown', email: (data as any).requester_profile.email }
        : null,
      team: (data as any).team_data ? { name: (data as any).team_data.name } : null,
    },
    comments: (data.ticket_comments || []).map((c: any) => ({
      author: c.author?.display_name || 'Unknown',
      content: c.content,
      timestamp: c.created_at,
      is_internal: c.is_internal || false,
    })),
    history: (data.ticket_history || []).map((h: any) => ({
      field: h.field_name,
      old_value: h.old_value,
      new_value: h.new_value,
      changed_by: h.changed_by?.display_name || 'System',
      timestamp: h.created_at,
    })),
    checklist: (data.ticket_checklist || []).map((c: any) => ({
      text: c.text,
      completed: c.completed,
    })),
  }
}

export function formatContextForAgent(context: TicketContext): string {
  const completedCount = context.checklist.filter((c) => c.completed).length

  return `
# TICKET CONTEXT

## Ticket Information
- **ID**: ${context.ticket.number}
- **Title**: ${context.ticket.title}
- **Description**: ${context.ticket.description || 'No description'}
- **Status**: ${context.ticket.status}
- **Priority**: ${context.ticket.priority}
- **Type**: ${context.ticket.type}
- **Assignee**: ${context.ticket.assignee?.name || 'Unassigned'}
- **Requester**: ${context.ticket.requester?.name || 'Unknown'}
- **Team**: ${context.ticket.team?.name || 'No team'}
- **Created**: ${new Date(context.ticket.created_at).toLocaleString()}
- **Last Updated**: ${new Date(context.ticket.updated_at).toLocaleString()}

## Comments (${context.comments.length} total)
${
  context.comments.length > 0
    ? context.comments
        .map(
          (c) =>
            `- **${c.author}** (${new Date(c.timestamp).toLocaleString()})${c.is_internal ? ' [INTERNAL]' : ''}: ${c.content}`
        )
        .join('\n')
    : '- No comments yet'
}

## Change History (${context.history.length} changes)
${
  context.history.length > 0
    ? context.history
        .map(
          (h) =>
            `- ${h.changed_by} changed **${h.field}** from "${h.old_value || 'empty'}" to "${h.new_value || 'empty'}" on ${new Date(h.timestamp).toLocaleString()}`
        )
        .join('\n')
    : '- No history yet'
}

## Checklist (${completedCount}/${context.checklist.length} completed)
${
  context.checklist.length > 0
    ? context.checklist.map((c) => `- [${c.completed ? 'x' : ' '}] ${c.text}`).join('\n')
    : '- No checklist items'
}
`.trim()
}
