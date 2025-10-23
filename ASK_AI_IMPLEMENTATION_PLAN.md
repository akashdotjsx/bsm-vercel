# 🤖 Ask AI in Tickets - Implementation Plan

## 📊 Current Architecture Audit

### ✅ What You Already Have

#### **Backend (enterprise-fastapi)**
- ✅ **Agno-based AI agent system** using `agno` library
- ✅ **Streaming responses** via SSE (Server-Sent Events)
- ✅ **Multi-agent orchestration** (Team-based with tagged agents)
- ✅ **Custom knowledge retrieval** using vector search (DeepMemory)
- ✅ **Tool integration** (Composio, Pipedream toolkits)
- ✅ **Hybrid Agent Manager** for performance optimization
- ✅ **Session management** with MongoDB

#### **Frontend (enterprise-search-frontend)**
- ✅ **Real-time streaming UI** with SSE handling
- ✅ **Chat interface** with message history
- ✅ **Tool call visualization** (search, chart generation, etc.)
- ✅ **Multi-select options** (web search, reasoning)
- ✅ **File/media upload** for context
- ✅ **Speech-to-text** integration

### 🎯 Your Current Setup (kroolo-bsm)
- ✅ Supabase + PostgreSQL database
- ✅ GraphQL API via pg_graphql
- ✅ Full ticket data: tickets, comments, attachments, history, checklist
- ✅ RBAC system with permissions
- ✅ Next.js 14 frontend with TypeScript

---

## 🚀 RECOMMENDED APPROACH: "Context-Aware Ticket AI"

### Why This Approach?
1. **Leverage existing AI infrastructure** - No need to rebuild
2. **Rich ticket context** - AI knows everything about tickets via GraphQL
3. **Minimal changes** - Reuse 90% of your chat system
4. **Smart & contextual** - AI has full visibility into tickets, users, teams, history

---

## 🏗️ Architecture Design

```
┌─────────────────────────────────────────────────────────────┐
│                    KROOLO BSM FRONTEND                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Tickets Page with "Ask AI" Button                   │   │
│  │  - Opens AI Chat Modal/Sidebar                       │   │
│  │  - Pre-filled with ticket context                    │   │
│  │  - Real-time streaming responses                     │   │
│  └────────────────┬─────────────────────────────────────┘   │
│                   │                                          │
│                   │ POST /api/ai/ticket-chat                 │
│                   ▼                                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Next.js API Route (Ticket Context Builder)          │   │
│  │  - Fetch ticket data from Supabase via GraphQL       │   │
│  │  - Build rich context object                         │   │
│  │  - Forward to FastAPI with context                   │   │
│  └────────────────┬─────────────────────────────────────┘   │
└────────────────────┼─────────────────────────────────────────┘
                     │
                     │ POST /v1/chat/ticket
                     ▼
┌─────────────────────────────────────────────────────────────┐
│               ENTERPRISE-FASTAPI BACKEND                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  New Endpoint: /v1/chat/ticket                        │   │
│  │  - Receives ticket context + user query              │   │
│  │  - Creates specialized "Ticket Assistant" agent      │   │
│  │  - Agent has ticket knowledge injected               │   │
│  │  - Streams response back                             │   │
│  └────────────────┬─────────────────────────────────────┘   │
│                   │                                          │
│                   │ Uses Agno Agent with                     │
│                   ▼                                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Ticket-Aware Agent                                   │   │
│  │  - Instructions: "You are a ticket assistant"        │   │
│  │  - Context: Full ticket data as structured prompt    │   │
│  │  - Tools: GraphQL query tool for live data           │   │
│  │  - Memory: Session-based conversation history        │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Implementation Steps

### **Phase 1: Backend Setup (enterprise-fastapi)**

#### 1.1 Create New Endpoint
```python
# routers/ticket_chat.py
from models.chat import TicketChatRequest
from services.ai.ticket_agent import create_ticket_agent

@router.post("/v1/chat/ticket")
async def ticket_chat(request: TicketChatRequest):
    """
    Specialized endpoint for ticket-related AI conversations
    - Receives ticket context from frontend
    - Creates agent with ticket knowledge
    - Streams intelligent responses
    """
    agent = await create_ticket_agent(
        session_id=request.session_id,
        ticket_context=request.ticket_context,
        company_id=request.company_id,
        user_id=request.user_id
    )
    return _sse_response(request.user_query, agent)
```

#### 1.2 Create Ticket Agent
```python
# services/ai/ticket_agent.py
async def create_ticket_agent(
    session_id: str,
    ticket_context: Dict[str, Any],
    company_id: str,
    user_id: str
) -> Agent:
    """
    Creates a specialized agent for ticket conversations
    """
    # Build rich instructions with ticket context
    instructions = [
        "You are an intelligent ticket assistant for a service management system.",
        "You have full context about the current ticket and related data.",
        f"Ticket Details:\n{format_ticket_context(ticket_context)}",
        "Help users by:",
        "- Analyzing ticket information",
        "- Suggesting solutions based on history",
        "- Identifying patterns and trends",
        "- Recommending next actions",
        "- Answering questions about the ticket"
    ]
    
    # GraphQL tool for live queries
    graphql_tool = create_graphql_query_tool(company_id, user_id)
    
    agent = Agent(
        name="Ticket AI Assistant",
        model=get_llm_agno("openai", "gpt-4o"),
        instructions=instructions,
        tools=[graphql_tool],
        db=get_agent_db(),
        memory_manager=get_agent_memory_manager(),
        user_id=user_id
    )
    
    return agent
```

#### 1.3 Create GraphQL Query Tool
```python
# utils/graphql_tool.py
from agno.tools import Toolkit

def create_graphql_query_tool(company_id: str, user_id: str) -> Toolkit:
    """
    Tool that allows the agent to query Supabase GraphQL
    for live ticket data
    """
    
    @tool
    def query_ticket_data(query: str, variables: dict) -> dict:
        """
        Execute GraphQL query against Supabase
        
        Args:
            query: GraphQL query string
            variables: Query variables
            
        Returns:
            Query results
        """
        # Call Supabase GraphQL endpoint
        response = supabase_graphql_client.execute(query, variables)
        return response
    
    return query_ticket_data
```

---

### **Phase 2: Frontend Setup (kroolo-bsm)**

#### 2.1 Create Ticket Context Builder
```typescript
// lib/ai/ticket-context-builder.ts
export async function buildTicketContext(ticketId: string): Promise<TicketContext> {
  const supabase = createClient()
  
  // Fetch comprehensive ticket data via GraphQL
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
            assignee { display_name, email }
            requester { display_name, email }
            team { name }
            created_at
            updated_at
            
            # Related data
            ticket_commentsCollection {
              edges { node { content, created_at, author { display_name } } }
            }
            ticket_historyCollection {
              edges { node { field_name, old_value, new_value } }
            }
            ticket_checklistCollection {
              edges { node { text, completed } }
            }
          }
        }
      }
    }
  `
  
  const { data } = await supabase.graphql(query, { ticketId })
  return transformToContext(data)
}
```

#### 2.2 Create AI Chat Modal
```typescript
// components/tickets/AskAIModal.tsx
'use client'

export function AskAIModal({ ticketId, isOpen, onClose }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  
  const handleSubmit = async () => {
    // Build ticket context
    const ticketContext = await buildTicketContext(ticketId)
    
    // Call Next.js API route
    const response = await fetch('/api/ai/ticket-chat', {
      method: 'POST',
      body: JSON.stringify({
        user_query: input,
        ticket_context: ticketContext,
        session_id: generateSessionId(),
        company_id: organizationId,
        user_id: userId
      })
    })
    
    // Stream response
    await handleSSEStream(response, setMessages, setIsStreaming)
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>Ask AI about Ticket #{ticketNumber}</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          {messages.map(msg => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
        </div>
        
        <div className="border-t pt-4">
          <ChatInput 
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            disabled={isStreaming}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

#### 2.3 Create Next.js API Route (Proxy)
```typescript
// app/api/ai/ticket-chat/route.ts
export async function POST(request: Request) {
  const body = await request.json()
  
  // Forward to FastAPI with streaming
  const response = await fetch(
    `${process.env.FASTAPI_URL}/v1/chat/ticket`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.FASTAPI_API_KEY}`
      },
      body: JSON.stringify(body)
    }
  )
  
  // Stream response back to frontend
  return new Response(response.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  })
}
```

---

## 🎯 What the AI Will Know

The AI will have **complete context** about:

1. **Ticket Details**
   - Title, description, status, priority
   - Type (incident, request, problem, change)
   - Created/updated dates
   - Custom fields

2. **People Involved**
   - Requester info
   - Assignee(s)
   - Team members
   - Historical assignees

3. **Conversation History**
   - All comments
   - Internal notes
   - Timestamps and authors

4. **Change History**
   - Status changes
   - Priority changes
   - Assignee changes
   - Field updates

5. **Related Items**
   - Checklists and completion status
   - Attachments
   - Linked tickets
   - SLA policy

---

## 💡 Smart AI Capabilities

### Example Conversations:

**User:** "Why has this ticket been pending so long?"
**AI:** "This ticket has been in 'Pending' status for 5 days. Looking at the history, it was reassigned from John to Sarah 3 days ago, and the last comment from the requester asking for a status update was 2 days ago. I recommend:\n1. Following up with Sarah to get current status\n2. Updating the requester with progress\n3. If blocked, escalating to team lead"

**User:** "What's the root cause of this issue?"
**AI:** "Based on the ticket description and comments, the root cause appears to be a misconfiguration in the email server settings. Previous tickets (#TKT-456, #TKT-789) had similar symptoms and were resolved by checking SMTP port configuration. I suggest verifying the Exchange Server settings first."

**User:** "Suggest next actions"
**AI:** "Based on the current state:\n1. Complete the pending security checklist (2/5 items done)\n2. Get approval from the IT Manager (marked as required)\n3. Schedule the maintenance window\n4. Send notification to affected users\n\nShall I draft the notification email for you?"

---

## ⚡ Performance Optimizations

1. **Context Caching**
   - Cache ticket context for 5 minutes
   - Only refetch on updates

2. **Streaming Responses**
   - Users see responses as they're generated
   - No waiting for complete response

3. **Session Memory**
   - Agent remembers conversation history
   - No need to repeat context

4. **GraphQL Batching**
   - Fetch all needed data in single query
   - Reduce database round trips

---

## 🔒 Security Considerations

1. **RLS Enforcement**
   - All GraphQL queries respect Row Level Security
   - Users only see tickets they have access to

2. **Permission Checks**
   - Verify user has `canView('tickets')` permission
   - Respect organization boundaries

3. **Context Sanitization**
   - Remove sensitive data from context
   - Mask PII if needed

4. **API Key Protection**
   - FastAPI calls authenticated with secure key
   - Never expose API keys to frontend

---

## 📦 Required Dependencies

### Backend (enterprise-fastapi)
```bash
# Already have these
agno
composio-core
fastapi
```

### Frontend (kroolo-bsm)
```bash
npm install eventsource-parser  # For SSE parsing
```

---

## 🎨 UI/UX Recommendations

### 1. **Floating "Ask AI" Button**
```typescript
<Button 
  className="fixed bottom-4 right-4 rounded-full"
  onClick={() => setShowAI(true)}
>
  <Bot className="mr-2" />
  Ask AI
</Button>
```

### 2. **Sidebar Modal** (like your chat interface)
- Slide in from right
- 40% of screen width
- Ticket context visible
- Chat interface below

### 3. **Quick Prompts**
```typescript
const quickPrompts = [
  "Summarize this ticket",
  "Suggest next actions",
  "Find similar tickets",
  "Draft response to requester",
  "Analyze root cause"
]
```

### 4. **AI Response Formatting**
- Markdown support
- Clickable ticket references (e.g., #TKT-123)
- Action buttons ("Apply suggestion", "Copy response")

---

## 📊 Success Metrics

Track these to measure AI effectiveness:

1. **Usage**
   - Number of AI conversations per ticket
   - Average conversation length

2. **Satisfaction**
   - Thumbs up/down on AI responses
   - User feedback

3. **Impact**
   - Time to resolution (before/after AI)
   - Number of escalations

4. **Quality**
   - Accuracy of AI suggestions
   - Relevance score

---

## 🚀 Quick Start Guide

### Step 1: Add "Ask AI" Button
```typescript
// app/(dashboard)/tickets/[id]/page.tsx
<Button onClick={() => setShowAI(true)}>
  <Bot className="mr-2" />
  Ask AI
</Button>
```

### Step 2: Install dependencies
```bash
npm install eventsource-parser uuid
```

### Step 3: Copy chat components
- Copy ChatArea.tsx
- Copy ChatInput.tsx
- Copy streaming hook
- Adapt to ticket context

### Step 4: Test with simple query
```typescript
// Test the flow
"Tell me about this ticket" → Should return ticket summary
```

---

## 🎯 Next Steps

1. **Prototype** (1-2 days)
   - Basic chat modal
   - Ticket context builder
   - Simple streaming

2. **Backend Integration** (2-3 days)
   - Create ticket_chat endpoint
   - Build ticket agent
   - Add GraphQL tool

3. **Polish** (1-2 days)
   - UI refinements
   - Error handling
   - Loading states

4. **Testing** (1 day)
   - Test with real tickets
   - Verify permissions
   - Performance testing

5. **Deploy** 🚀

---

## ✅ Why This Approach Wins

1. ✅ **Reuses 90% of existing chat system**
2. ✅ **AI has full ticket context automatically**
3. ✅ **No complex integrations needed**
4. ✅ **Scales with your existing infrastructure**
5. ✅ **GraphQL gives AI real-time data access**
6. ✅ **Session memory for context retention**
7. ✅ **Streaming for best UX**
8. ✅ **Minimal code changes**

---

## 🤔 Alternative Approaches (Not Recommended)

### ❌ Option A: Embed Tickets in Agno Knowledge Base
- **Problem**: Static data, requires reindexing on every ticket update
- **Problem**: Complex sync logic

### ❌ Option B: Build Custom AI from Scratch
- **Problem**: Reinventing the wheel
- **Problem**: Months of development

### ❌ Option C: Use OpenAI Assistant API Directly
- **Problem**: Less flexible than Agno
- **Problem**: No multi-agent orchestration

---

## 🎓 Learning Resources

1. **Agno Documentation**: https://docs.agno.com
2. **Your existing chat code**: `enterprise-search-frontend/src/app/(app)/chat`
3. **FastAPI streaming**: `enterprise-fastapi/routers/chat.py`

---

## 💪 Final Recommendation

**GO WITH THE CONTEXT-AWARE TICKET AI APPROACH** 

It's the perfect balance of:
- Powerful (full AI capabilities)
- Simple (reuse existing code)
- Fast (quick to implement)
- Scalable (grows with you)
- Smart (AI knows everything about tickets)

You can have a **working prototype in 1-2 days** and a **production-ready feature in 1 week**.

Let me know when you want to start, and I'll guide you step-by-step! 🚀
