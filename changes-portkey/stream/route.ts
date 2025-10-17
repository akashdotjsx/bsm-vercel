import { NextRequest } from 'next/server'

export const runtime = 'nodejs'

const PORTKEY_URL = 'https://api.portkey.ai/v1/chat/completions'

// Virtual key mapping
const VIRTUAL_KEYS: Record<string, string | undefined> = {
  aws: process.env.VIRTUAL_KEY_AWS,
  openai: process.env.VIRTUAL_KEY_OPENAI,
  groq: process.env.VIRTUAL_KEY_GROQ,
  openrouter: process.env.VIRTUAL_KEY_OPENROUTER,
}

export async function POST(req: NextRequest) {
  try {
    const { messages, options } = await req.json()
    const provider = options?.provider || 'aws'
    const model = options?.model
    const max_tokens = options?.maxTokens ?? 1000
    const temperature = options?.temperature ?? 0.7

    const apiKey = process.env.PORTKEY_API_KEY
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Missing PORTKEY_API_KEY' }), { status: 500 })
    }

    const virtualKey = VIRTUAL_KEYS[provider]
    if (!virtualKey) {
      return new Response(JSON.stringify({ error: `Missing virtual key for provider: ${provider}` }), { status: 500 })
    }

    const upstream = await fetch(PORTKEY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-portkey-api-key': apiKey,
        'x-portkey-virtual-key': virtualKey,
      },
      body: JSON.stringify({
        model: model || undefined,
        messages,
        stream: true,
        temperature,
        max_tokens,
      }),
    })

    if (!upstream.ok || !upstream.body) {
      const text = await upstream.text().catch(() => '')
      return new Response(JSON.stringify({ error: text || 'Upstream request failed' }), { status: upstream.status })
    }

    const { readable, writable } = new TransformStream()
    const writer = writable.getWriter()

    const reader = upstream.body.getReader()
    const encoder = new TextEncoder()

    async function pump() {
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        if (value) await writer.write(value)
      }
      await writer.close()
    }

    pump()

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no',
        'Connection': 'keep-alive',
      },
    })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'Unknown error' }), { status: 500 })
  }
}