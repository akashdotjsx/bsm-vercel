import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import {
  fetchRecentTicketsForAI,
  formatTicketsForAI,
  AITicketContext,
} from '@/lib/ai/ticket-context';

// Use Node.js runtime (not edge) for OpenAI compatibility
export const runtime = 'nodejs';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string;
  name?: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  organizationId: string;
  includeContext?: boolean;
}

/**
 * POST /api/ai/chat
 * 
 * Main AI chat endpoint with streaming and tool calling support
 */
export async function POST(req: NextRequest) {
  try {
    // Check if OpenAI key is available
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OpenAI API key not configured');
      return NextResponse.json(
        { error: 'AI service not configured. Please set OPENAI_API_KEY.' },
        { status: 503 }
      );
    }

    let body: ChatRequest;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { messages, organizationId, includeContext = true } = body;

    console.log('📨 AI Chat Request:', {
      messageCount: messages?.length || 0,
      organizationId: organizationId?.substring(0, 8) + '...',
      includeContext,
    });

    if (!messages || messages.length === 0) {
      console.error('❌ No messages provided');
      return NextResponse.json(
        { error: 'Messages are required' },
        { status: 400 }
      );
    }

    if (!organizationId) {
      console.error('❌ No organization ID provided');
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Initialize OpenAI client
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });

    // Fetch ticket context if needed
    let ticketContext: AITicketContext[] = [];
    if (includeContext) {
      try {
        ticketContext = await fetchRecentTicketsForAI(organizationId, 20);
        console.log('✅ Fetched ticket context:', ticketContext.length, 'tickets');
      } catch (contextError) {
        console.error('⚠️  Failed to fetch ticket context:', contextError);
        // Continue without context rather than failing
      }
    }

    // Build system message with context
    const systemMessage = buildSystemMessage(ticketContext);

    // Prepare messages for OpenAI
    const openaiMessages = [
      { role: 'system' as const, content: systemMessage },
      ...messages.map((msg) => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
      })),
    ];

    // Make streaming request to OpenAI (without tools for now to simplify)
    const response = await client.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: openaiMessages,
      temperature: 0.7,
      max_tokens: 4000,
      stream: true,
    });

    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('❌ AI chat error:', error);
    console.error('Error stack:', error.stack);
    
    // Check if it's an OpenAI API error
    if (error.status) {
      return NextResponse.json(
        {
          error: 'OpenAI API error',
          details: error.message,
          status: error.status,
        },
        { status: error.status }
      );
    }
    
    return NextResponse.json(
      {
        error: 'Sorry, I encountered an error. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * Build system message with ticket context
 */
function buildSystemMessage(tickets: AITicketContext[]): string {
  const basePrompt = `You are an AI assistant for a ticket management system. You help users manage, search, and analyze support tickets.

Your capabilities:
- Answer questions about tickets
- Provide insights and summaries
- Help find specific information
- Analyze patterns and trends

Guidelines:
- Be concise and helpful
- Use clear formatting
- Cite ticket numbers when referring to specific tickets`;

  if (tickets.length > 0) {
    const contextStr = formatTicketsForAI(tickets);
    return `${basePrompt}

Current Ticket Context:
${contextStr}

Use this context to answer questions about recent tickets.`;
  }

  return basePrompt;
}
