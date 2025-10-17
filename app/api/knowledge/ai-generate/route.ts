import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAIClient, isAIAvailable, AI_CONFIG } from '@/lib/ai/portkey-client';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

// Validation schema for AI generation request
const GenerateArticleSchema = z.object({
  topic: z.string().min(3, 'Topic must be at least 3 characters'),
  category: z.string().min(1, 'Category is required'),
  tone: z.enum(['professional', 'casual', 'technical']).optional().default('professional'),
  length: z.enum(['short', 'medium', 'long']).optional().default('medium'),
  includeExamples: z.boolean().optional().default(true),
});

type GenerateArticleInput = z.infer<typeof GenerateArticleSchema>;

/**
 * POST /api/knowledge/ai-generate
 * Generate a knowledge base article using AI
 */
export async function POST(req: NextRequest) {
  try {
    // Check AI availability
    if (!isAIAvailable()) {
      return NextResponse.json(
        { 
          error: 'AI service not configured', 
          message: 'Please set OPENAI_API_KEY or (PORTKEY_API_KEY + OPENROUTER_API_KEY)' 
        },
        { status: 503 }
      );
    }

    // Verify authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in to generate articles' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validation = GenerateArticleSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { topic, category, tone, length, includeExamples } = validation.data;

    // Get AI client
    const aiClient = getAIClient();
    if (!aiClient) {
      return NextResponse.json(
        { error: 'AI client initialization failed' },
        { status: 500 }
      );
    }

    // Build the prompt based on parameters
    const lengthGuide = {
      short: '300-500 words',
      medium: '800-1200 words',
      long: '1500-2500 words'
    };

    const systemPrompt = `You are an expert technical writer creating knowledge base articles for a Business Service Management platform. 
Your writing should be ${tone}, clear, and actionable.`;

    const userPrompt = `Write a comprehensive knowledge base article about: "${topic}"

Requirements:
- Category: ${category}
- Tone: ${tone}
- Length: ${lengthGuide[length]}
- ${includeExamples ? 'Include practical examples and use cases' : 'Focus on concepts without specific examples'}

Structure the article with:
1. A clear, engaging title
2. A brief summary (2-3 sentences)
3. Well-organized sections with headers
4. Step-by-step instructions where applicable
5. Best practices and tips
6. Common pitfalls to avoid

Format the response as JSON with this structure:
{
  "title": "Article Title",
  "summary": "Brief summary",
  "content": "Full article content in Markdown format",
  "tags": ["tag1", "tag2", "tag3"]
}`;

    // Make AI request with streaming disabled for JSON response
    const response = await aiClient.chat.completions.create({
      model: AI_CONFIG.models.chat,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: AI_CONFIG.temperature.chat,
      max_tokens: AI_CONFIG.maxTokens.chat,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      return NextResponse.json(
        { error: 'No content generated', message: 'AI returned empty response' },
        { status: 500 }
      );
    }

    // Parse the JSON response
    let articleData;
    try {
      articleData = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return NextResponse.json(
        { error: 'Invalid AI response', message: 'Could not parse generated content' },
        { status: 500 }
      );
    }

    // Validate that we got the expected fields
    if (!articleData.title || !articleData.content) {
      return NextResponse.json(
        { error: 'Incomplete article', message: 'AI did not generate required fields' },
        { status: 500 }
      );
    }

    // Return the generated article data
    return NextResponse.json({
      success: true,
      article: {
        title: articleData.title,
        content: articleData.content,
        summary: articleData.summary || '',
        tags: Array.isArray(articleData.tags) ? articleData.tags : [],
        category,
        status: 'draft' as const,
        author_id: user.id,
        metadata: {
          generatedBy: 'ai',
          generatedAt: new Date().toISOString(),
          aiProvider: AI_CONFIG.type,
          parameters: { topic, tone, length, includeExamples }
        }
      }
    });

  } catch (error: any) {
    console.error('AI generation error:', error);
    
    return NextResponse.json(
      { 
        error: 'Generation failed', 
        message: error.message || 'An unexpected error occurred',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/knowledge/ai-generate
 * Check AI service status
 */
export async function GET() {
  return NextResponse.json({
    available: isAIAvailable(),
    provider: AI_CONFIG.type,
    models: AI_CONFIG.models
  });
}
