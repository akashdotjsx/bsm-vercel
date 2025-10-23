import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

async function webSearchContext(query: string) {
  try {
    const q = encodeURIComponent(query)
    const res = await fetch(`https://api.duckduckgo.com/?q=${q}&format=json&no_redirect=1&no_html=1`, {
      headers: { 'User-Agent': 'kroolo-bsm/ai-assistant' },
      cache: 'no-store',
    })
    const data = await res.json()
    const related = Array.isArray(data?.RelatedTopics) ? data.RelatedTopics.slice(0, 5) : []
    const lines = related.map((r: any) => `- ${r.Text || ''} ${r.FirstURL ? `(${r.FirstURL})` : ''}`)
    return `\nWEB SEARCH RESULTS for: ${query}\n${lines.join('\n')}`
  } catch {
    return ''
  }
}

async function getTicketsContext(userContext?: { userId?: string; userName?: string; userEmail?: string }) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    const { data: tickets, error } = await supabase
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
        due_date,
        assignee_id,
        requester_id
      `)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error fetching tickets:', error)
      return ''
    }
    
    if (!tickets || tickets.length === 0) {
      return '\n# TICKET SYSTEM DATA\n\n## Summary\n- No tickets found in the system\n'
    }

    const openTickets = tickets.filter(t => t.status && ['new', 'open', 'in_progress', 'pending'].includes(t.status.toLowerCase()))
    const highPriority = tickets.filter(t => t.priority && ['high', 'urgent', 'critical'].includes(t.priority.toLowerCase()))
    
    // Filter tickets for current user
    const userTickets = userContext?.userId 
      ? tickets.filter(t => t.assignee_id === userContext.userId || t.requester_id === userContext.userId)
      : []
    const userOpenTickets = userTickets.filter(t => t.status && ['new', 'open', 'in_progress', 'pending'].includes(t.status.toLowerCase()))
    const userHighPriority = userTickets.filter(t => t.priority && ['high', 'urgent', 'critical'].includes(t.priority.toLowerCase()))

    let context = '\n# TICKET SYSTEM DATA\n'
    
    if (userContext?.userName) {
      context += `\n## Current User: ${userContext.userName}\n`
      context += `- User Email: ${userContext.userEmail}\n`
      context += `- Your total tickets: ${userTickets.length}\n`
      context += `- Your open tickets: ${userOpenTickets.length}\n`
      context += `- Your high priority tickets: ${userHighPriority.length}\n`
    }
    
    context += `\n## Overall Summary\n`
    context += `- Total tickets: ${tickets.length}\n`
    context += `- Open tickets: ${openTickets.length}\n`
    context += `- High priority tickets: ${highPriority.length}\n`
    context += `- Statuses: ${[...new Set(tickets.map(t => t.status))].join(', ')}\n`
    
    context += `\n## Recent Tickets (Last 10)\n`
    tickets.slice(0, 10).forEach(t => {
      context += `\n### ${t.ticket_number || 'Unknown'}: ${t.title || 'Untitled'}\n`
      context += `- Status: ${t.status || 'unknown'}\n`
      context += `- Priority: ${t.priority || 'none'}\n`
      context += `- Type: ${t.type || 'unknown'}\n`
      if (t.description) context += `- Description: ${t.description.substring(0, 200)}...\n`
    })

    if (highPriority.length > 0) {
      context += `\n## High Priority Tickets\n`
      highPriority.slice(0, 5).forEach(t => {
        context += `- ${t.ticket_number || 'Unknown'}: ${t.title || 'Untitled'} (${t.status || 'unknown'})\n`
      })
    }

    // Add user-specific tickets if available
    if (userContext?.userId && userTickets.length > 0) {
      context += `\n## Your Assigned/Requested Tickets\n`
      userTickets.slice(0, 10).forEach(t => {
        const isAssignee = t.assignee_id === userContext.userId
        const role = isAssignee ? 'Assigned to you' : 'Requested by you'
        context += `\n### ${t.ticket_number}: ${t.title}\n`
        context += `- Role: ${role}\n`
        context += `- Status: ${t.status}\n`
        context += `- Priority: ${t.priority}\n`
        if (t.description) context += `- Description: ${t.description.substring(0, 150)}...\n`
      })
    }

    return context
  } catch (e) {
    console.error('Failed to fetch tickets:', e)
    return ''
  }
}

export async function POST(req: NextRequest) {
  try {
    const { query, history = [], model = 'gpt-4o', webSearch = false, userContext } = await req.json()
    if (!query) return new Response('Missing query', { status: 400 })

    // Get ticket context for all queries with user info
    const ticketsContext = await getTicketsContext(userContext)
    
    let webContext = ''
    if (webSearch || /^\/(search|web)\s+/i.test(query)) {
      const q = query.replace(/^\/(search|web)\s+/i, '').trim() || query
      webContext = await webSearchContext(q)
    }

    const context = ticketsContext + webContext

    const sys = context
      ? `You are a helpful AI assistant for a ticket management system. You have access to the ticket database. Use the following data to answer questions:\n${context}\n\nBe concise and actionable. When asked about tickets, reference the actual data provided above.`
      : 'You are a helpful AI assistant for a ticket management system. Be concise and actionable.'

    const messages = [
      { role: 'system', content: sys },
      ...history,
      { role: 'user', content: query },
    ]

    const response = await fetch('https://api.portkey.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-portkey-api-key': process.env.PORTKEY_API_KEY || '',
        'x-portkey-virtual-key': process.env.VIRTUAL_KEY_OPENAI || 'temp-openai-pro-f51bf0',
      },
      body: JSON.stringify({ model, stream: true, messages, temperature: 0.7, max_tokens: 1200 }),
    })

    if (!response.ok) {
      const text = await response.text()
      return new Response(`Upstream error: ${text}`, { status: 502 })
    }

    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (e: any) {
    return new Response(`Error: ${e.message || 'unknown'}`, { status: 500 })
  }
}
