import { NextRequest } from 'next/server';
import OpenAI from 'openai';

// Use Node.js runtime (not edge) for OpenAI compatibility
export const runtime = 'nodejs';

interface SuggestionRequest {
  input: string;
  organizationId: string;
  maxSuggestions?: number;
}

/**
 * POST /api/ai/suggestions
 * 
 * Generate AI-powered query suggestions as the user types
 */
export async function POST(req: NextRequest) {
  try {
    // Check if OpenAI key is available
    if (!process.env.OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({
          error: 'AI service not configured',
        }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const body = await req.json() as SuggestionRequest;
    const { input, organizationId, maxSuggestions = 4 } = body;

    // Don't suggest for very short inputs
    if (!input || input.trim().length < 3) {
      return Response.json({ suggestions: [] });
    }

    // Initialize OpenAI client
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });

    // Build prompt for suggestions
    const systemPrompt = `You are an AI assistant that suggests completions for ticket management queries.

Given a partial user input, suggest ${maxSuggestions} relevant completions that users might want to ask about tickets.

Focus on common ticket management tasks:
- Searching tickets by status, priority, category, assignee
- Getting statistics and summaries
- Finding specific tickets by number or keyword
- Analyzing patterns and trends
- Checking SLA status

Return ONLY a JSON array of ${maxSuggestions} short, actionable suggestions (without numbering).
Each suggestion should be a complete, natural question or command.

Example input: "show me high"
Example output: ["Show me high priority tickets", "Show me high urgency items", "Show me highly escalated tickets", "Show me tickets with high impact"]

Do not include explanations, just the JSON array.`;

    const userPrompt = `User input: "${input}"

Suggest ${maxSuggestions} completions:`;

    // Make request to OpenAI
    const response = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.5,
      max_tokens: 150,
      response_format: { type: 'json_object' } as any,
    });

    const completion = response.choices[0]?.message?.content;

    if (!completion) {
      return Response.json({ suggestions: [] });
    }

    // Parse the JSON response
    try {
      const parsed = JSON.parse(completion);
      
      // Handle different response formats
      let suggestions: string[] = [];
      
      if (Array.isArray(parsed)) {
        suggestions = parsed;
      } else if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
        suggestions = parsed.suggestions;
      } else if (parsed.completions && Array.isArray(parsed.completions)) {
        suggestions = parsed.completions;
      }

      // Clean and limit suggestions
      suggestions = suggestions
        .filter((s: any) => typeof s === 'string' && s.trim().length > 0)
        .map((s: string) => s.trim())
        .slice(0, maxSuggestions);

      return Response.json({ suggestions });
    } catch (parseError) {
      console.error('Failed to parse AI suggestions:', parseError);
      
      // Fallback: extract suggestions from text
      const lines = completion
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.startsWith('{') && !line.startsWith('['))
        .slice(0, maxSuggestions);

      return Response.json({ suggestions: lines });
    }
  } catch (error: any) {
    console.error('AI suggestions error:', error);
    
    // Return empty suggestions on error (don't block UX)
    return Response.json({ suggestions: [] });
  }
}

/**
 * GET /api/ai/suggestions/status
 * 
 * Check if AI suggestions are available
 */
export async function GET() {
  return Response.json({
    available: !!process.env.OPENAI_API_KEY,
    status: !!process.env.OPENAI_API_KEY ? 'ready' : 'unavailable',
  });
}
