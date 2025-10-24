# 🎯 Self-Contained AI Chat Implementation Audit

## Overview
Build AI chat feature **entirely within kroolo-bsm** using Agno SDK directly in Next.js API routes. No dependency on external FastAPI backend.

---

## 📊 Current State Analysis

### What You Have ✅
1. **Supabase + PostgreSQL** with full ticket data
2. **GraphQL API** via pg_graphql for querying
3. **Next.js 14** with App Router
4. **TypeScript** for type safety
5. **Ticket System** with rich data model:
   - Tickets, comments, history, checklist
   - Assignees, teams, SLA policies
   - Custom fields, tags, attachments

### What You Need ❌
1. **Agno SDK** for AI agent creation
2. **SSE (Server-Sent Events)** handling for streaming
3. **Chat UI components** from scratch
4. **Ticket context builder** for GraphQL queries
5. **API routes** for agent creation & streaming

---

## 🏗️ Simplified Architecture

```
┌─────────────────────────────────────────────────────┐
│              KROOLO-BSM (Next.js 14)                │
│                                                      │
│  ┌──────────────────────────────────────────┐      │
│  │  Ticket Detail Page                       │      │
│  │  - Shows ticket info                      │      │
│  │  - "Ask AI" floating button               │      │
│  └───────────────┬──────────────────────────┘      │
│                  │ onClick → Open Modal             │
│                  ▼                                   │
│  ┌──────────────────────────────────────────┐      │
│  │  AI Chat Modal Component                  │      │
│  │  - Chat interface                         │      │
│  │  - Message bubbles                        │      │
│  │  - Input box                              │      │
│  │  - Quick prompts                          │      │
│  └───────────────┬──────────────────────────┘      │
│                  │ POST /api/ai/ticket-chat         │
│                  ▼                                   │
│  ┌──────────────────────────────────────────┐      │
│  │  Next.js API Route                        │      │
│  │  /app/api/ai/ticket-chat/route.ts        │      │
│  │                                            │      │
│  │  1. Fetch ticket context (GraphQL)       │      │
│  │  2. Create Agno agent with context       │      │
│  │  3. Stream agent responses (SSE)         │      │
│  └───────────────┬──────────────────────────┘      │
│                  │                                   │
│  ┌──────────────▼──────────────────────────┐      │
│  │  Agno Agent (In-Process)                 │      │
│  │  - Created via @agno/sdk                 │      │
│  │  - Injected with ticket context          │      │
│  │  - Uses OpenAI/Anthropic                 │      │
│  │  - Streams responses back                │      │
│  └──────────────────────────────────────────┘      │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## 📦 Required Dependencies

```json
{
  "dependencies": {
    "@agno/sdk": "^1.0.0",           // Agno SDK for agents
    "eventsource-parser": "^1.1.2",   // Parse SSE streams
    "uuid": "^9.0.0"                  // Generate session IDs
  }
}
```

### Environment Variables
```env
# .env.local
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

---

## 🔧 Implementation Breakdown

### **Task 1: Setup AI Infrastructure**

**Files to create/modify:**
- `package.json` - Add dependencies
- `.env.local` - Add API keys
- `lib/ai/config.ts` - Agno configuration

```typescript
// lib/ai/config.ts
import { AgnoClient } from '@agno/sdk'

export const agnoClient = new AgnoClient({
  apiKey: process.env.OPENAI_API_KEY!,
  provider: 'openai',
  model: 'gpt-4o'
})
```

**Estimated Time:** 30 minutes

---

### **Task 2: Create Ticket Context Builder**

**Files to create:**
- `lib/ai/ticket-context-builder.ts`

**Purpose:**
- Fetch all ticket data via GraphQL
- Format into structured context for AI agent
- Include: details, comments, history, checklist, team

```typescript
// lib/ai/ticket-context-builder.ts
export interface TicketContext {
  ticket: {
    id: string
    number: string
    title: string
    description: string
    status: string
    priority: string
    type: string
    created_at: string
    assignee?: { name: string, email: string }
    requester?: { name: string, email: string }
    team?: { name: string }
  }
  comments: Array<{
    author: string
    content: string
    timestamp: string
    is_internal: boolean
  }>
  history: Array<{
    field: string
    old_value: string
    new_value: string
    changed_by: string
    timestamp: string
  }>
  checklist: Array<{
    text: string
    completed: boolean
  }>
}

export async function buildTicketContext(
  ticketId: string
): Promise<TicketContext> {
  // GraphQL query to Supabase
  const query = `
    query GetTicketContext($ticketId: UUID!) {
      ticketsCollection(filter: { id: { eq: $ticketId } }) {
        edges {
          node {
            id
            ticket_number
            title
            description
            status
            priority
            type
            created_at
            updated_at
            assignee { display_name, email }
            requester { display_name, email }
            team { name }
            
            ticket_commentsCollection(orderBy: { created_at: AscNullsLast }) {
              edges {
                node {
                  content
                  created_at
                  is_internal
                  author { display_name }
                }
              }
            }
            
            ticket_historyCollection(orderBy: { created_at: AscNullsLast }) {
              edges {
                node {
                  field_name
                  old_value
                  new_value
                  created_at
                  changed_by { display_name }
                }
              }
            }
            
            ticket_checklistCollection {
              edges {
                node {
                  text
                  completed
                }
              }
            }
          }
        }
      }
    }
  `
  
  const supabase = createClient()
  const { data } = await supabase.graphql(query, { ticketId })
  
  return transformToContext(data)
}

function transformToContext(data: any): TicketContext {
  // Transform GraphQL response to structured context
  // ...implementation
}

export function formatContextForAgent(context: TicketContext): string {
  return `
# TICKET CONTEXT

## Ticket Information
- **ID**: ${context.ticket.number}
- **Title**: ${context.ticket.title}
- **Description**: ${context.ticket.description}
- **Status**: ${context.ticket.status}
- **Priority**: ${context.ticket.priority}
- **Type**: ${context.ticket.type}
- **Assignee**: ${context.ticket.assignee?.name || 'Unassigned'}
- **Requester**: ${context.ticket.requester?.name}
- **Team**: ${context.ticket.team?.name}
- **Created**: ${context.ticket.created_at}

## Comments (${context.comments.length})
${context.comments.map(c => `
- **${c.author}** (${c.timestamp}): ${c.content}
`).join('\n')}

## History (${context.history.length} changes)
${context.history.map(h => `
- ${h.changed_by} changed ${h.field} from "${h.old_value}" to "${h.new_value}"
`).join('\n')}

## Checklist (${context.checklist.filter(c => c.completed).length}/${context.checklist.length} completed)
${context.checklist.map(c => `
- [${c.completed ? 'x' : ' '}] ${c.text}
`).join('\n')}
  `.trim()
}
```

**Estimated Time:** 2-3 hours

---

### **Task 3: Create Agno Agent API Route**

**Files to create:**
- `app/api/ai/ticket-chat/route.ts`

**Purpose:**
- Receive user query + ticket ID
- Build ticket context
- Create Agno agent with instructions
- Stream responses via SSE

```typescript
// app/api/ai/ticket-chat/route.ts
import { NextRequest } from 'next/server'
import { Agent } from '@agno/sdk'
import { buildTicketContext, formatContextForAgent } from '@/lib/ai/ticket-context-builder'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs' // Required for streaming

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ticketId, userQuery, sessionId, userId, organizationId } = body

    // 1. Build ticket context
    const ticketContext = await buildTicketContext(ticketId)
    const contextPrompt = formatContextForAgent(ticketContext)

    // 2. Create Agno agent
    const agent = new Agent({
      name: 'Ticket AI Assistant',
      model: 'gpt-4o',
      instructions: [
        'You are an intelligent ticket assistant for a service management system.',
        'You have full context about the current ticket and related data.',
        contextPrompt,
        '',
        'CAPABILITIES:',
        '- Answer questions about the ticket',
        '- Analyze ticket history and patterns',
        '- Suggest next actions based on status and checklist',
        '- Draft responses to requesters',
        '- Identify blockers and recommend solutions',
        '',
        'RULES:',
        '- Be concise and actionable',
        '- Reference specific ticket data when relevant',
        '- Use bullet points for recommendations',
        '- If suggesting actions, explain the reasoning'
      ].join('\n'),
      temperature: 0.7,
      stream: true
    })

    // 3. Stream agent response
    const stream = await agent.chat(userQuery, {
      sessionId,
      userId
    })

    // 4. Setup SSE stream
    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const sseEvent = `data: ${JSON.stringify(chunk)}\n\n`
            controller.enqueue(encoder.encode(sseEvent))
          }
          
          // Send completion event
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (error) {
          console.error('Streaming error:', error)
          controller.error(error)
        }
      }
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    })

  } catch (error) {
    console.error('API Error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to process request' }),
      { status: 500 }
    )
  }
}
```

**Estimated Time:** 3-4 hours

---

### **Task 4: Build Chat UI Components**

**Files to create:**
- `components/tickets/ai-chat/ChatModal.tsx`
- `components/tickets/ai-chat/MessageBubble.tsx`
- `components/tickets/ai-chat/ChatInput.tsx`
- `components/tickets/ai-chat/QuickPrompts.tsx`

```typescript
// components/tickets/ai-chat/ChatModal.tsx
'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { MessageBubble } from './MessageBubble'
import { ChatInput } from './ChatInput'
import { QuickPrompts } from './QuickPrompts'
import { useAIStream } from '@/hooks/use-ai-stream'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ChatModalProps {
  ticketId: string
  ticketNumber: string
  isOpen: boolean
  onClose: () => void
}

export function ChatModal({ ticketId, ticketNumber, isOpen, onClose }: ChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const { isStreaming, sendMessage } = useAIStream({
    ticketId,
    onMessage: (msg) => {
      setMessages(prev => [...prev, msg])
    }
  })

  const handleSend = async (query: string) => {
    // Add user message
    setMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      role: 'user',
      content: query,
      timestamp: new Date()
    }])

    // Clear input
    setInput('')

    // Stream AI response
    await sendMessage(query)
  }

  const handleQuickPrompt = (prompt: string) => {
    handleSend(prompt)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Ask AI about Ticket #{ticketNumber}</DialogTitle>
        </DialogHeader>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto space-y-4 p-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground mt-8">
              <p className="text-lg mb-4">👋 Hi! I'm your ticket AI assistant.</p>
              <p className="text-sm">Ask me anything about this ticket!</p>
            </div>
          )}
          
          {messages.map(msg => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          
          {isStreaming && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
              <span className="text-sm">AI is thinking...</span>
            </div>
          )}
        </div>

        {/* Quick Prompts */}
        {messages.length === 0 && (
          <QuickPrompts onSelect={handleQuickPrompt} />
        )}

        {/* Input Area */}
        <div className="border-t pt-4">
          <ChatInput
            value={input}
            onChange={setInput}
            onSend={handleSend}
            disabled={isStreaming}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

```typescript
// components/tickets/ai-chat/MessageBubble.tsx
'use client'

import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'

  return (
    <div className={cn(
      'flex',
      isUser ? 'justify-end' : 'justify-start'
    )}>
      <div className={cn(
        'max-w-[80%] rounded-lg px-4 py-3',
        isUser 
          ? 'bg-primary text-primary-foreground' 
          : 'bg-muted'
      )}>
        <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none">
          {message.content}
        </ReactMarkdown>
        <div className="text-xs opacity-60 mt-2">
          {message.timestamp.toLocaleTimeString()}
        </div>
      </div>
    </div>
  )
}
```

```typescript
// components/tickets/ai-chat/ChatInput.tsx
'use client'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send } from 'lucide-react'

export function ChatInput({ value, onChange, onSend, disabled }: Props) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (value.trim()) {
        onSend(value)
      }
    }
  }

  return (
    <div className="flex gap-2">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask anything about this ticket..."
        className="min-h-[60px] resize-none"
        disabled={disabled}
      />
      <Button
        onClick={() => onSend(value)}
        disabled={disabled || !value.trim()}
        size="icon"
        className="h-[60px]"
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  )
}
```

```typescript
// components/tickets/ai-chat/QuickPrompts.tsx
'use client'

import { Button } from '@/components/ui/button'

const QUICK_PROMPTS = [
  "📝 Summarize this ticket",
  "🎯 Suggest next actions",
  "🔍 Find similar tickets",
  "✍️ Draft response to requester",
  "🔎 Analyze root cause"
]

export function QuickPrompts({ onSelect }: { onSelect: (prompt: string) => void }) {
  return (
    <div className="px-4 pb-4">
      <p className="text-sm text-muted-foreground mb-3">Quick prompts:</p>
      <div className="flex flex-wrap gap-2">
        {QUICK_PROMPTS.map(prompt => (
          <Button
            key={prompt}
            variant="outline"
            size="sm"
            onClick={() => onSelect(prompt)}
            className="text-xs"
          >
            {prompt}
          </Button>
        ))}
      </div>
    </div>
  )
}
```

**Estimated Time:** 4-5 hours

---

### **Task 5: Implement SSE Streaming Hook**

**Files to create:**
- `hooks/use-ai-stream.ts`

```typescript
// hooks/use-ai-stream.ts
'use client'

import { useState, useCallback } from 'react'
import { useAuth } from '@/lib/contexts/auth-context'

interface UseAIStreamProps {
  ticketId: string
  onMessage: (message: ChatMessage) => void
}

export function useAIStream({ ticketId, onMessage }: UseAIStreamProps) {
  const [isStreaming, setIsStreaming] = useState(false)
  const { user, organizationId } = useAuth()
  
  const sendMessage = useCallback(async (query: string) => {
    setIsStreaming(true)
    
    try {
      const response = await fetch('/api/ai/ticket-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId,
          userQuery: query,
          sessionId: crypto.randomUUID(),
          userId: user?.id,
          organizationId
        })
      })

      if (!response.ok) throw new Error('Stream failed')

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let aiMessage = {
        id: crypto.randomUUID(),
        role: 'assistant' as const,
        content: '',
        timestamp: new Date()
      }

      while (true) {
        const { done, value } = await reader!.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') break

            try {
              const chunk = JSON.parse(data)
              if (chunk.content) {
                aiMessage.content += chunk.content
                onMessage({ ...aiMessage })
              }
            } catch (e) {
              console.error('Parse error:', e)
            }
          }
        }
      }
    } catch (error) {
      console.error('Stream error:', error)
    } finally {
      setIsStreaming(false)
    }
  }, [ticketId, user, organizationId, onMessage])

  return { isStreaming, sendMessage }
}
```

**Estimated Time:** 2-3 hours

---

### **Task 6: Add Ask AI Button to Tickets**

**Files to modify:**
- `app/(dashboard)/tickets/[id]/page.tsx`

```typescript
// app/(dashboard)/tickets/[id]/page.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Bot } from 'lucide-react'
import { ChatModal } from '@/components/tickets/ai-chat/ChatModal'

export default function TicketDetailPage({ params }: { params: { id: string } }) {
  const [showAI, setShowAI] = useState(false)
  
  // ... existing code ...

  return (
    <div>
      {/* Existing ticket content */}
      
      {/* Floating Ask AI Button */}
      <Button
        onClick={() => setShowAI(true)}
        className="fixed bottom-6 right-6 rounded-full shadow-lg h-14 px-6"
        size="lg"
      >
        <Bot className="h-5 w-5 mr-2" />
        Ask AI
      </Button>

      {/* AI Chat Modal */}
      <ChatModal
        ticketId={params.id}
        ticketNumber={ticket?.ticket_number || ''}
        isOpen={showAI}
        onClose={() => setShowAI(false)}
      />
    </div>
  )
}
```

**Estimated Time:** 1 hour

---

### **Task 7: Test & Polish**

**Testing checklist:**
- ✅ AI responds with correct ticket context
- ✅ Streaming works smoothly
- ✅ Error handling for API failures
- ✅ Loading states are clear
- ✅ Mobile responsive
- ✅ Quick prompts work
- ✅ Markdown rendering in responses
- ✅ RLS permissions respected

**Estimated Time:** 4-5 hours

---

## ⏱️ Total Timeline

| Task | Time | Cumulative |
|------|------|-----------|
| 1. Setup AI Infrastructure | 30m | 30m |
| 2. Ticket Context Builder | 2-3h | 3h |
| 3. Agno Agent API Route | 3-4h | 7h |
| 4. Chat UI Components | 4-5h | 12h |
| 5. SSE Streaming Hook | 2-3h | 15h |
| 6. Add Ask AI Button | 1h | 16h |
| 7. Test & Polish | 4-5h | **21h** |

**Total: ~21 hours (3 days of focused work)**

---

## 🎯 Key Advantages

1. ✅ **Self-contained** - No external FastAPI dependency
2. ✅ **Simple** - All code in one codebase
3. ✅ **Direct Agno** - Use SDK directly in API routes
4. ✅ **Full control** - Customize everything
5. ✅ **GraphQL access** - Rich ticket context via Supabase
6. ✅ **Streaming** - Real-time responses via SSE
7. ✅ **Type-safe** - TypeScript end-to-end

---

## 🚨 Important Notes

1. **Agno SDK** - Requires Node.js runtime in API routes
2. **Streaming** - Must use `runtime = 'nodejs'` in route config
3. **RLS** - All GraphQL queries respect Supabase RLS
4. **API Keys** - Store securely in .env.local
5. **Rate Limits** - Consider implementing rate limiting
6. **Costs** - Monitor OpenAI API usage

---

## 📚 Resources

- Agno SDK: https://docs.agno.com
- Next.js API Routes: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- SSE in Next.js: https://nextjs.org/docs/app/building-your-application/routing/route-handlers#streaming
- Supabase GraphQL: https://supabase.com/docs/guides/api/graphql

---

## ✅ Success Criteria

- [ ] AI chat modal opens from ticket page
- [ ] AI has full context of ticket
- [ ] Responses stream in real-time
- [ ] Quick prompts work
- [ ] Error handling is graceful
- [ ] Mobile responsive
- [ ] Performance is acceptable (<3s first response)

---

## 🎓 Next Steps

Ready to implement? Just tell me which task to start with!

I recommend starting with Task 1 (Setup), then Task 2 (Context Builder) to validate GraphQL queries work properly.
