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

async function searchDatabase(query: string, type: 'tickets' | 'users' = 'tickets', organizationId?: string) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    if (type === 'users') {
      const { data: users, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          display_name,
          avatar_url,
          department,
          phone,
          created_at,
          user_roles!user_roles_user_id_fkey(
            roles(
              id,
              name,
              description
            )
          )
        `)
        .ilike('display_name', `%${query}%`)
        .limit(10)

      if (error) return []
      return users || []
    } else {
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
          requester_id,
          requester:profiles!requester_id(id, display_name, email, department),
          assignee:profiles!assignee_id(id, display_name, email, department)
        `)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%,ticket_number.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) return []
      return tickets || []
    }
  } catch (e) {
    console.error('Search error:', e)
    return []
  }
}

// Universal search that fetches comprehensive results (tickets, users, services, assets)
async function universalSearch(query: string, organizationId?: string) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    // Search across all entities in parallel
    const [ticketsRes, usersRes, servicesRes, assetsRes] = await Promise.all([
      // Search tickets
      supabase
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
          requester:profiles!requester_id(id, display_name, email, department),
          assignee:profiles!assignee_id(id, display_name, email, department)
        `)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%,ticket_number.ilike.%${query}%`)
        .limit(10),
      
      // Search users
      supabase
        .from('profiles')
        .select(`
          id,
          email,
          display_name,
          avatar_url,
          department,
          phone,
          user_roles!user_roles_user_id_fkey(
            roles(id, name, description)
          )
        `)
        .or(`display_name.ilike.%${query}%,email.ilike.%${query}%,department.ilike.%${query}%`)
        .limit(8),
      
      // Search services
      supabase
        .from('services')
        .select(`
          id,
          name,
          description,
          status,
          service_categories!category_id(name)
        `)
        .ilike('name', `%${query}%`)
        .limit(6),
      
      // Search assets
      supabase
        .from('assets')
        .select(`
          id,
          asset_number,
          name,
          type,
          status,
          assigned_to
        `)
        .or(`name.ilike.%${query}%,asset_number.ilike.%${query}%`)
        .limit(5)
    ])

    return {
      tickets: ticketsRes.data || [],
      users: usersRes.data || [],
      services: servicesRes.data || [],
      assets: assetsRes.data || [],
      total: (ticketsRes.data?.length || 0) + (usersRes.data?.length || 0) + (servicesRes.data?.length || 0) + (assetsRes.data?.length || 0)
    }
  } catch (e) {
    console.error('Universal search error:', e)
    return { tickets: [], users: [], services: [], assets: [], total: 0 }
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
        requester_id,
        requester:profiles!requester_id(id, display_name, email, department),
        assignee:profiles!assignee_id(id, display_name, email, department)
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

    let additionalContext = ''
    let toolsUsed: string[] = []
    
    // Get ticket context for all queries with user info
    const ticketsContext = await getTicketsContext(userContext)
    
    // NEW: Try universal search first for comprehensive results
    // This captures any query that might match users, tickets, services, or assets
    const shouldUseUniversalSearch = query.length >= 3 && !query.match(/^(hello|hi|hey|thanks|thank you|ok|okay)$/i)
    
    if (shouldUseUniversalSearch) {
      toolsUsed.push(`🔍 Searching system for: "${query}"`)
      const searchResults = await universalSearch(query, userContext?.organizationId)
      
      if (searchResults.total > 0) {
        toolsUsed.push(`✅ Found ${searchResults.total} results (${searchResults.tickets.length} tickets, ${searchResults.users.length} users, ${searchResults.services.length} services, ${searchResults.assets.length} assets)`)
        
        additionalContext += `\n\n# UNIVERSAL SEARCH RESULTS FOR: "${query}"\n`
        
        // Add users found
        if (searchResults.users.length > 0) {
          additionalContext += `\n## USERS (${searchResults.users.length} found):\n`
          searchResults.users.forEach((u: any) => {
            additionalContext += `\n### ${u.display_name || u.email}\n`
            additionalContext += `- Email: ${u.email}\n`
            additionalContext += `- Department: ${u.department || 'Not specified'}\n`
            additionalContext += `- Roles: ${u.user_roles?.map((ur: any) => ur.roles?.name).filter(Boolean).join(', ') || 'None'}\n`
          })
        }
        
        // Add tickets found
        if (searchResults.tickets.length > 0) {
          additionalContext += `\n## TICKETS (${searchResults.tickets.length} found):\n`
          searchResults.tickets.forEach((t: any) => {
            additionalContext += `\n### ${t.ticket_number}: ${t.title}\n`
            additionalContext += `- Status: ${t.status}\n`
            additionalContext += `- Priority: ${t.priority}\n`
            additionalContext += `- Type: ${t.type}\n`
            additionalContext += `- Requester: ${t.requester?.display_name || 'Unknown'}\n`
            additionalContext += `- Assignee: ${t.assignee?.display_name || 'Unassigned'}\n`
            if (t.description) additionalContext += `- Description: ${t.description.substring(0, 150)}...\n`
          })
        }
        
        // Add services found
        if (searchResults.services.length > 0) {
          additionalContext += `\n## SERVICES (${searchResults.services.length} found):\n`
          searchResults.services.forEach((s: any) => {
            additionalContext += `- ${s.name} (${s.status})\n`
            if (s.description) additionalContext += `  Description: ${s.description.substring(0, 100)}\n`
          })
        }
        
        // Add assets found
        if (searchResults.assets.length > 0) {
          additionalContext += `\n## ASSETS (${searchResults.assets.length} found):\n`
          searchResults.assets.forEach((a: any) => {
            additionalContext += `- ${a.asset_number || a.name} (${a.type}, ${a.status})\n`
          })
        }
      } else {
        toolsUsed.push(`ℹ️ No specific results found, using general context`)
      }
    }
    
    // Enhanced: Detect if query is about specific user/person (case-insensitive)
    const nameMatch = query.match(/\b(about|for|of|from|by|know about)\s+([a-zA-Z][a-zA-Z]+(?:\s+[a-zA-Z]+)?)/i)
    
    // If query mentions a person, search for that user and their tickets
    if (nameMatch && nameMatch[2]) {
      const personName = nameMatch[2].trim()
      toolsUsed.push(`🔍 Searching for user: "${personName}"`)
      const users = await searchDatabase(personName, 'users')
      
      if (users.length > 0) {
        const user = users[0] as any
        toolsUsed.push(`✅ Found user: ${user.display_name || user.email}`)
        additionalContext += `\n\n# USER INFORMATION FOR: ${user.display_name || user.email}\n`
        additionalContext += `- Email: ${user.email}\n`
        additionalContext += `- Department: ${user.department || 'Not specified'}\n`
        additionalContext += `- Roles: ${user.user_roles?.map((ur: any) => ur.roles.name).join(', ') || 'None'}\n`
        additionalContext += `- Member since: ${new Date(user.created_at).toLocaleDateString()}\n`
        
        // Get tickets for this user (search by user ID)
        toolsUsed.push(`🎫 Fetching tickets for ${user.display_name}...`)
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          { auth: { persistSession: false } }
        )
        
        const { data: userTickets } = await supabase
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
            requester:profiles!requester_id(id, display_name, email),
            assignee:profiles!assignee_id(id, display_name, email)
          `)
          .or(`requester_id.eq.${user.id},assignee_id.eq.${user.id}`)
          .order('created_at', { ascending: false })
          .limit(20)
        
        if (userTickets && userTickets.length > 0) {
          toolsUsed.push(`✅ Found ${userTickets.length} tickets`)
          additionalContext += `\n## TICKETS RELATED TO ${user.display_name} (Total: ${userTickets.length}):\n`
          userTickets.forEach((t: any) => {
            const role = t.requester_id === user.id ? '📤 Requested' : '📥 Assigned'
            additionalContext += `\n### ${role} | ${t.ticket_number}: ${t.title}\n`
            additionalContext += `- Status: ${t.status}\n`
            additionalContext += `- Priority: ${t.priority}\n`
            additionalContext += `- Requester: ${t.requester?.display_name || 'Unknown'}\n`
            additionalContext += `- Assignee: ${t.assignee?.display_name || 'Unassigned'}\n`
            if (t.description) additionalContext += `- Description: ${t.description.substring(0, 200)}...\n`
          })
        } else {
          toolsUsed.push(`ℹ️ No tickets found for this user`)
        }
      } else {
        toolsUsed.push(`❌ User "${personName}" not found`)
        additionalContext += `\n\n# USER SEARCH RESULT:\n- No user found with name "${personName}"\n- Tip: Try searching with a different spelling or check the exact name\n`
      }
    }
    
    // Enhanced: Search for specific tickets if query contains keywords
    // Only trigger if query explicitly asks for tickets AND has meaningful search terms
    const ticketQueryMatch = query.match(/\b(ticket|show|find|search|list)\b.*\b(high|priority|critical|urgent|open|closed|pending|resolved|about|for)\b/i)
    
    if (ticketQueryMatch && !nameMatch) {
      let searchTerms = ''
      
      // Priority/Status search
      if (query.match(/\b(high|critical|urgent)\s+(priority)?\s*ticket/i)) {
        searchTerms = 'high'
        toolsUsed.push(`🔍 Searching for high priority tickets...`)
      } else if (query.match(/\b(low|medium)\s+(priority)?\s*ticket/i)) {
        const match = query.match(/\b(low|medium)/i)
        searchTerms = match ? match[1].toLowerCase() : ''
        toolsUsed.push(`🔍 Searching for ${searchTerms} priority tickets...`)
      } else if (query.match(/\b(open|closed|pending|resolved)\s*ticket/i)) {
        const match = query.match(/\b(open|closed|pending|resolved)/i)
        searchTerms = match ? match[1].toLowerCase() : ''
        toolsUsed.push(`🔍 Searching for ${searchTerms} tickets...`)
      } else if (query.match(/ticket.*about\s+(.+?)$/i)) {
        // "tickets about X" pattern
        const match = query.match(/about\s+([\w\s]+?)$/i)
        searchTerms = match ? match[1].trim() : ''
        if (searchTerms.length > 2) {
          toolsUsed.push(`🔍 Searching tickets about: "${searchTerms}"`)
        }
      }
      
      // Only search if we have valid search terms
      if (searchTerms && searchTerms.length > 1) {
        const searchResults = await searchDatabase(searchTerms, 'tickets')
        
        if (searchResults.length > 0) {
          toolsUsed.push(`✅ Found ${searchResults.length} matching tickets`)
          additionalContext += `\n\n# SEARCH RESULTS FOR: "${searchTerms}"\n`
          searchResults.slice(0, 10).forEach((t: any) => {
            additionalContext += `\n### ${t.ticket_number}: ${t.title}\n`
            additionalContext += `- Status: ${t.status}\n`
            additionalContext += `- Priority: ${t.priority}\n`
            additionalContext += `- Requester: ${t.requester?.display_name || 'Unknown'}\n`
            additionalContext += `- Assignee: ${t.assignee?.display_name || 'Unassigned'}\n`
          })
        } else {
          // No results from search, rely on general context
          toolsUsed.push(`📊 Using general ticket context (no specific search results)`)
        }
      } else {
        // Couldn't extract meaningful search terms, use general context
        toolsUsed.push(`📊 Using general ticket context`)
      }
    }
    
    let webContext = ''
    if (webSearch || /^\/(search|web)\s+/i.test(query)) {
      const q = query.replace(/^\/(search|web)\s+/i, '').trim() || query
      toolsUsed.push(`🌐 Web search enabled for: "${q}"`)
      webContext = await webSearchContext(q)
    }
    
    // Tools are sent separately via stream metadata, not in context
    // This keeps the AI response clean without tool listings

    const context = ticketsContext + additionalContext + webContext

    const sys = context
      ? `You are a helpful AI assistant for a ticket management system (Kroolo BSM). You have access to the ticket database and user information. 

**IMPORTANT CONTEXT RETENTION:**
- Remember all information from previous messages in this conversation
- When asked follow-up questions, refer back to earlier context
- If a user is mentioned, remember their details for the entire conversation

**YOUR CAPABILITIES:**
- Search and analyze tickets
- Find information about users and team members
- Provide insights about ticket trends and patterns
- Answer questions using the real-time database data below

${context}

**RESPONSE GUIDELINES:**
- Be concise and actionable
- When asked about tickets, reference the actual data provided above
- Include ticket numbers when discussing specific tickets
- If asked about a person, provide their details and related tickets
- Maintain conversation context across multiple messages`
      : 'You are a helpful AI assistant for a ticket management system. Be concise and actionable.'

    // Generate conversation ID for context tracking
    const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const messages = [
      { role: 'system', content: sys },
      ...history,
      { role: 'user', content: query },
    ]

    console.log(`🤖 AI Request [${conversationId}]:`, {
      query,
      toolsUsed,
      hasUserContext: !!userContext,
      contextLength: context.length,
      historyLength: history.length
    })

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

    // Create a transform stream to inject tools at the start
    const transformStream = new TransformStream({
      start(controller) {
        // Send tools as first chunk if available
        if (toolsUsed.length > 0) {
          const toolsData = JSON.stringify({
            type: 'tools',
            conversationId,
            tools: toolsUsed
          })
          controller.enqueue(new TextEncoder().encode(`data: ${toolsData}\n\n`))
        }
      },
      transform(chunk, controller) {
        controller.enqueue(chunk)
      }
    })

    // Pipe the response through our transform stream
    response.body?.pipeThrough(transformStream)

    return new Response(transformStream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Conversation-ID': conversationId,
        'X-Tools-Count': toolsUsed.length.toString(),
      },
    })
  } catch (e: any) {
    return new Response(`Error: ${e.message || 'unknown'}`, { status: 500 })
  }
}
