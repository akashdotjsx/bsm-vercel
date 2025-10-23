# AI Tools Parsing & Display Documentation

## Overview
The AI Assistant displays tools used during each conversation in an elegant, collapsible dropdown similar to the enterprise-search-frontend implementation.

## Architecture

### 1. **Backend - Tool Tracking** (`app/api/ai/ask/route.ts`)

#### How Tools Are Tracked:
```typescript
let toolsUsed: string[] = []

// When searching for a user
toolsUsed.push(`🔍 Searching for user: "${personName}"`)
toolsUsed.push(`✅ Found user: ${user.display_name}`)
toolsUsed.push(`🎫 Fetching tickets for ${user.display_name}...`)
toolsUsed.push(`✅ Found ${userTickets.length} tickets`)

// When searching tickets
toolsUsed.push(`🔍 Searching tickets for: "${searchTerms}"`)
toolsUsed.push(`✅ Found ${searchResults.length} tickets`)

// When web search enabled
toolsUsed.push(`🌐 Web search enabled for: "${q}"`)
```

#### How Tools Are Sent to Client:
```typescript
// Tools are injected into the context
if (toolsUsed.length > 0) {
  additionalContext = `\n\n# TOOLS USED:\n${toolsUsed.map(t => `${t}`).join('\n')}\n` + additionalContext
}

// Context is passed to AI system prompt
const sys = `You are a helpful AI assistant... ${context}`
```

---

### 2. **Frontend - Tool Extraction** (`components/ai/ai-assistant-modal.tsx`)

#### Parsing Pattern:
The AI response streams back with tools embedded in markdown format:

```
# TOOLS USED:
🔍 Searching for user: "zufishan"
✅ Found user: Zufishan Ahmed
🎫 Fetching tickets for Zufishan Ahmed...
✅ Found 5 tickets

# USER INFORMATION FOR: Zufishan Ahmed
...
```

#### Extraction Code:
```typescript
// Extract tools from streamed content
if (fullContent.includes('# TOOLS USED:')) {
  const toolsMatch = fullContent.match(/# TOOLS USED:\n([\s\S]*?)\n\n/)
  if (toolsMatch && toolsMatch[1]) {
    toolsUsed = toolsMatch[1].split('\n').filter(t => t.trim())
  }
}

// Store in message object
const message = {
  id: aiMessageId,
  role: 'assistant',
  content: fullContent,
  toolsUsed,  // ✅ Parsed tools array
  conversationId,
  timestamp: new Date()
}
```

---

### 3. **UI Display - Collapsible Dropdown**

#### Visual Structure:
```
┌─────────────────────────────────────────┐
│ ● Tools Used (3)               ▼       │ ← Header (always visible, clickable)
├─────────────────────────────────────────┤
│ 👥 🔍 Searching for user: "zufishan"   │
│ 📊 ✅ Found user: Zufishan Ahmed       │ ← Expandable content with icons
│ 🎫 🔍 Fetching tickets...              │
│ ─────────────────────────────────────  │
│ Conversation ID: conv_123_abc           │ ← Footer metadata
└─────────────────────────────────────────┘
```

#### Implementation:
```tsx
{msg.toolsUsed && msg.toolsUsed.length > 0 && (
  <div className="max-w-[85%] bg-muted/30 border rounded-lg overflow-hidden">
    {/* Collapsible Header */}
    <button onClick={() => setIsToolsExpanded(!isToolsExpanded)}>
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
        <span>Tools Used</span>
        <span>({msg.toolsUsed.length})</span>
      </div>
      {isToolsExpanded ? <ChevronUp /> : <ChevronDown />}
    </button>
    
    {/* Expanded Content */}
    {isToolsExpanded && (
      <div className="border-t px-3 py-2">
        {msg.toolsUsed.map((tool, idx) => {
          const icon = getToolIcon(tool)  // Dynamic icon based on tool type
          const color = getToolColor(tool) // Dynamic color based on status
          
          return (
            <div className={`flex items-center gap-2 ${color}`}>
              {icon}
              <span>{tool}</span>
            </div>
          )
        })}
      </div>
    )}
  </div>
)}
```

---

## Icon & Color Mapping

### Tool Icons:
| Tool Type | Icon | Condition |
|-----------|------|-----------|
| User Search | `<Users />` | Contains "Searching for user" |
| Ticket Search | `<Search />` | Contains "Searching tickets" or "Fetching tickets" |
| Database Query | `<Database />` | Contains "Found" |
| Default | Blue dot | Everything else |

### Status Colors:
| Status | Color | Emoji Indicator |
|--------|-------|-----------------|
| Success | Green | ✅ |
| Searching | Blue | 🔍 🎫 |
| Error | Red | ❌ |
| Info | Yellow | ℹ️ |

---

## Message Flow Diagram

```
User Query: "know about zufishan"
         ↓
Backend detects user search pattern
         ↓
toolsUsed.push("🔍 Searching for user: zufishan")
         ↓
Search database → Find user
         ↓
toolsUsed.push("✅ Found user: Zufishan Ahmed")
         ↓
Fetch user's tickets
         ↓
toolsUsed.push("🎫 Fetching tickets...")
toolsUsed.push("✅ Found 5 tickets")
         ↓
Inject tools into context:
"# TOOLS USED:\n🔍...\n✅...\n..."
         ↓
Stream AI response to frontend
         ↓
Frontend parses "# TOOLS USED:" section
         ↓
Extract array of tool strings
         ↓
Display in collapsible dropdown
```

---

## Adding New Tools

### 1. Backend - Track Tool Usage
```typescript
// In /app/api/ai/ask/route.ts
if (someNewToolCondition) {
  toolsUsed.push(`🔧 Your new tool: "${input}"`)
  
  // Do the tool work
  const result = await yourNewTool(input)
  
  toolsUsed.push(`✅ Tool completed: ${result.count} items`)
}
```

### 2. Frontend - Add Icon/Color Mapping
```typescript
// In components/ai/ai-assistant-modal.tsx
const getToolIcon = () => {
  if (tool.includes('Your new tool')) return <Wrench className="h-3 w-3" />
  // ... existing conditions
}

const getToolColor = () => {
  if (tool.includes('🔧')) return 'text-orange-600 dark:text-orange-400'
  // ... existing conditions
}
```

---

## Benefits

### 1. **Transparency**
- Users see exactly what the AI is doing
- Real-time tool execution updates
- Clear indication of success/failure

### 2. **Debugging**
- Conversation ID for tracing
- Tool execution order visible
- Error states clearly shown

### 3. **Trust**
- Users understand the AI isn't "hallucinating"
- Shows real database queries being made
- Validates that AI is using actual data

---

## Example Scenarios

### Scenario 1: User Search
```
User: "know about zufishan"

Tools Displayed:
├─ 👥 🔍 Searching for user: "zufishan"
├─ 👥 ✅ Found user: Zufishan Ahmed
├─ 📊 🎫 Fetching tickets for Zufishan Ahmed...
└─ 📊 ✅ Found 3 tickets

AI Response:
"Zufishan Ahmed (zufishah@company.com) is in the IT Department..."
```

### Scenario 2: Ticket Search
```
User: "show high priority tickets"

Tools Displayed:
├─ 🔍 🔍 Searching tickets for: "high priority"
└─ 📊 ✅ Found 8 tickets

AI Response:
"Here are your high priority tickets: TK-001, TK-005..."
```

### Scenario 3: User Not Found
```
User: "tickets by john999"

Tools Displayed:
├─ 👥 🔍 Searching for user: "john999"
└─ ❌ ❌ User "john999" not found

AI Response:
"I couldn't find a user named john999. Try checking the spelling..."
```

---

## Performance Considerations

### Streaming Optimization
- Tools are parsed incrementally as content streams
- Regex match only runs when "# TOOLS USED:" is detected
- Array filtering removes empty strings

### UI Optimization
- Collapsed by default (minimal DOM elements)
- Only renders when expanded
- Uses memoized color/icon getters

---

## Future Enhancements

### 1. **Tool Metrics**
```typescript
toolsUsed.push({
  icon: '🔍',
  label: 'User Search',
  query: 'zufishan',
  duration: '120ms',
  status: 'success'
})
```

### 2. **Tool Links**
Make tools clickable to view detailed results:
```tsx
<a href="/users/${userId}">
  👥 ✅ Found user: Zufishan Ahmed
</a>
```

### 3. **Tool Analytics**
Track which tools are most used:
- Search frequency
- Success rates
- Average response times

---

## Troubleshooting

### Tools Not Showing?
1. Check backend logs for `toolsUsed` array
2. Verify "# TOOLS USED:" is in AI response
3. Check regex pattern matching

### Wrong Icons/Colors?
1. Verify emoji in tool string (`✅`, `🔍`, etc.)
2. Check `getToolIcon()` and `getToolColor()` conditions
3. Ensure Unicode emojis are preserved

### Parsing Errors?
1. Check for double newlines after tools section
2. Verify regex: `/# TOOLS USED:\n([\s\S]*?)\n\n/`
3. Ensure tools array is not empty after filtering
