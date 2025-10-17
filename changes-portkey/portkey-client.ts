export type Provider = 'openai' | 'anthropic' | 'groq' | 'openrouter' | 'aws'

export const SUPPORTED_MODELS: Record<Provider, string[]> = {
  openai: [
    'gpt-4o-mini',
    'gpt-4.1-mini',
    'gpt-4.1'
  ],
  anthropic: [
    'claude-3-haiku-20240307',
    'claude-3-5-sonnet-20241022',
    'claude-3-sonnet-20240229'
  ],
  groq: [
    'llama-3.1-70b-versatile',
    'llama-3.1-8b-instant',
    'mixtral-8x7b-32768'
  ],
  openrouter: [
    'openrouter/auto',
    'google/gemini-pro-1.5',
    'meta-llama/llama-3.1-70b-instruct:free'
  ],
  // alias for backward-compat in UI; will be mapped to 'anthropic' on server
  aws: [
    'claude-3-haiku-20240307',
    'claude-3-5-sonnet-20241022'
  ],
}

export interface StreamOptions {
  provider: Provider
  model?: string
  maxTokens?: number
  temperature?: number
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

async function streamChat(
  messages: ChatMessage[],
  onChunk: (chunk: any) => void,
  options: StreamOptions
) {
  const res = await fetch('/api/ai/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ messages, options })
  })

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `AI request failed (${res.status})`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    const lines = buffer.split('\n')
    // keep last partial line in buffer
    buffer = lines.pop() || ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) continue
      const data = trimmed.replace(/^data:\s*/, '')
      if (data === '[DONE]') {
        return
      }
      try {
        const json = JSON.parse(data)
        onChunk(json)
      } catch {
        // ignore non-JSON lines
      }
    }
  }
}

const portkeyClient = {
  streamChat,
}

export default portkeyClient
