import { NextRequest } from 'next/server'
import { buildTicketContext, formatContextForAgent } from '@/lib/ai/ticket-context-builder'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const { ticketId, userQuery, sessionId } = await req.json()

    if (!ticketId || !userQuery) {
      return new Response('Missing required fields', { status: 400 })
    }

    // 1. Build ticket context
    const ticketContext = await buildTicketContext(ticketId)
    const contextPrompt = formatContextForAgent(ticketContext)

    // 2. Create system message with ticket context
    const systemMessage = `You are an intelligent ticket assistant for a service management system.

You have full context about the current ticket and related data:

${contextPrompt}

CAPABILITIES:
- Answer questions about the ticket
- Analyze ticket history and identify patterns
- Suggest next actions based on status, priority, and checklist
- Draft responses to requesters
- Identify blockers and recommend solutions
- Find insights from comments and history

RULES:
- Be concise and actionable
- Reference specific ticket data when relevant
- Use bullet points for recommendations
- If suggesting actions, explain the reasoning
- Focus on being helpful and practical`

    // 3. Call OpenAI with streaming
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        stream: true,
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: userQuery },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    // 4. Stream the response directly
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error: any) {
    console.error('AI API Error:', error)
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
