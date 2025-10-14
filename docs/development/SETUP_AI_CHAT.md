# 🚀 Quick Setup - AI Chat Feature

## ⚡ 1-Minute Setup

```bash
# 1. Install dependencies
npm install portkey-ai openai ai @ai-sdk/openai @ai-sdk/react

# 2. Add env vars (already in your .env)
# PORTKEY_API_KEY, OPENROUTER_API_KEY, OPENAI_API_KEY

# 3. Create the files (follow the guide in docs/AI_CHAT_IMPLEMENTATION.md)
```

## 📋 Files to Create

1. **`lib/ai/portkey-client.ts`** - Portkey setup
2. **`lib/ai/ticket-context.ts`** - GraphQL query for tickets
3. **`lib/ai/tools.ts`** - Tool definitions
4. **`app/api/ai/chat/route.ts`** - Chat API endpoint
5. **`app/api/ai/suggestions/route.ts`** - Suggestions API
6. **`components/ai/ai-chat-panel.tsx`** - Chat UI component

## 🎯 Key Features

✅ **Portkey** gateway with OpenRouter + OpenAI fallback  
✅ **Auto-suggestions** (3-4 as you type)  
✅ **20 recent tickets** as context  
✅ **Tool calling** for Supabase queries  
✅ **Slide-in panel** (like ticket tray, no blur)  
✅ **Proper chatbot** with message history  

## 🔗 See Full Guide

📄 **[docs/AI_CHAT_IMPLEMENTATION.md](./docs/AI_CHAT_IMPLEMENTATION.md)**

Contains:
- Complete code for all files
- Architecture diagrams
- API documentation
- Usage examples
- Testing instructions

## 💡 Quick Test

After setting up, add to your tickets page:

```typescript
import { AIChatPanel } from '@/components/ai/ai-chat-panel'

const [showAI, setShowAI] = useState(false)

<Button onClick={() => setShowAI(true)}>
  <Sparkles className="h-4 w-4 mr-2" />
  Ask AI
</Button>

<AIChatPanel open={showAI} onClose={() => setShowAI(false)} />
```

**Ready!** 🎉
