import { NextRequest, NextResponse } from 'next/server'
import Portkey from 'portkey-ai'
import mammoth from 'mammoth'
import pdfParse from 'pdf-parse'
import TurndownService from 'turndown'

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
})

// Initialize Portkey (will use env vars)
const getPortkeyClient = () => {
  if (!process.env.NEXT_PUBLIC_PORTKEY_API_KEY) {
    return null
  }

  return new Portkey({
    apiKey: process.env.NEXT_PUBLIC_PORTKEY_API_KEY,
    virtualKey: process.env.VIRTUAL_KEY_OPENAI,
  })
}

async function parseDocument(file: File): Promise<{ content: string; title: string }> {
  const buffer = Buffer.from(await file.arrayBuffer())
  const fileName = file.name
  const fileExt = fileName.split('.').pop()?.toLowerCase()

  try {
    switch (fileExt) {
      case 'txt':
        return {
          content: buffer.toString('utf-8'),
          title: fileName.replace(/\.[^/.]+$/, ''),
        }

      case 'md':
        return {
          content: buffer.toString('utf-8'),
          title: fileName.replace(/\.[^/.]+$/, ''),
        }

      case 'docx':
      case 'doc': {
        const result = await mammoth.convertToHtml({ buffer })
        const markdown = turndownService.turndown(result.value)
        const title = extractTitleFromContent(markdown) || fileName.replace(/\.[^/.]+$/, '')
        return { content: markdown, title }
      }

      case 'pdf': {
        const pdfData = await pdfParse(buffer)
        const title = extractTitleFromContent(pdfData.text) || fileName.replace(/\.[^/.]+$/, '')
        return { content: pdfData.text, title }
      }

      case 'html':
      case 'htm': {
        const html = buffer.toString('utf-8')
        const markdown = turndownService.turndown(html)
        const title = extractTitleFromContent(markdown) || fileName.replace(/\.[^/.]+$/, '')
        return { content: markdown, title }
      }

      default:
        throw new Error(`Unsupported file type: ${fileExt}`)
    }
  } catch (error: any) {
    throw new Error(`Failed to parse document: ${error.message}`)
  }
}

function extractTitleFromContent(content: string): string | null {
  // Try to find first heading
  const headingMatch = content.match(/^#\s+(.+)$/m)
  if (headingMatch) return headingMatch[1].trim()

  // Try first line if it looks like a title
  const firstLine = content.split('\n')[0].trim()
  if (firstLine && firstLine.length < 100 && !firstLine.includes('.')) {
    return firstLine
  }

  return null
}

async function enhanceWithAI(
  content: string,
  title: string,
  categories: string[]
): Promise<{
  title: string
  summary: string
  category: string | null
  tags: string[]
  content: string
  qualityScore: number
}> {
  const portkey = getPortkeyClient()

  // Fallback if no Portkey configured
  if (!portkey) {
    return {
      title,
      summary: content.substring(0, 200) + '...',
      category: null,
      tags: [],
      content,
      qualityScore: 50,
    }
  }

  try {
    const prompt = `Analyze this article and provide structured output in JSON format:

Available Categories: ${categories.join(', ')}

Article Title: ${title}
Article Content:
${content.substring(0, 3000)}

Provide a JSON response with:
1. "title": Improved/corrected title (if current title is filename or poor quality, suggest better one)
2. "summary": 2-3 sentence summary of the article
3. "category": Best matching category from the list above (or null if none match)
4. "tags": Array of 3-5 relevant tags
5. "content": Cleaned markdown content (fix formatting, preserve structure)
6. "qualityScore": 0-100 score based on completeness, clarity, and structure

Return ONLY valid JSON, no markdown formatting.`

    const response = await portkey.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a knowledge base content analyzer. You analyze documents and provide structured metadata. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    })

    const result = JSON.parse(response.choices[0].message.content || '{}')

    return {
      title: result.title || title,
      summary: result.summary || '',
      category: result.category || null,
      tags: result.tags || [],
      content: result.content || content,
      qualityScore: result.qualityScore || 50,
    }
  } catch (error: any) {
    console.error('AI enhancement error:', error)
    // Fallback to basic parsing
    return {
      title,
      summary: content.substring(0, 200) + '...',
      category: null,
      tags: [],
      content,
      qualityScore: 50,
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const categoriesJson = formData.get('categories') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Parse categories
    const categories: string[] = categoriesJson ? JSON.parse(categoriesJson) : []

    // Parse document
    const { content, title } = await parseDocument(file)

    // Enhance with AI
    const enhanced = await enhanceWithAI(content, title, categories)

    return NextResponse.json({
      success: true,
      data: {
        originalFileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        ...enhanced,
      },
    })
  } catch (error: any) {
    console.error('Document import error:', error)
    return NextResponse.json(
      {
        error: 'Failed to process document',
        message: error.message,
      },
      { status: 500 }
    )
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}
