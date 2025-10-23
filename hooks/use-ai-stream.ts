'use client'

import { useState, useCallback } from 'react'
import { useAuth } from '@/lib/contexts/auth-context'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface UseAIStreamProps {
  ticketId: string
  onMessage: (message: ChatMessage) => void
  onError?: (error: string) => void
}

export function useAIStream({ ticketId, onMessage, onError }: UseAIStreamProps) {
  const [isStreaming, setIsStreaming] = useState(false)
  const { user, organizationId } = useAuth()

  const sendMessage = useCallback(
    async (query: string) => {
      setIsStreaming(true)

      const aiMessageId = crypto.randomUUID()
      let fullContent = ''

      try {
        const response = await fetch('/api/ai/ticket-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticketId,
            userQuery: query,
            sessionId: crypto.randomUUID(),
            userId: user?.id,
            organizationId,
          }),
        })

        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`)
        }

        if (!response.body) {
          throw new Error('No response body')
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n').filter(line => line.trim().startsWith('data:'))

          for (const line of lines) {
            const data = line.replace(/^data: /, '')
            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices?.[0]?.delta?.content
              if (content) {
                fullContent += content
                
                // Update the message with accumulated content
                onMessage({
                  id: aiMessageId,
                  role: 'assistant',
                  content: fullContent,
                  timestamp: new Date(),
                })
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      } catch (error) {
        console.error('Stream error:', error)
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        onError?.(errorMsg)
        
        // Send error message
        onMessage({
          id: aiMessageId,
          role: 'assistant',
          content: `❌ Sorry, I encountered an error: ${errorMsg}`,
          timestamp: new Date(),
        })
      } finally {
        setIsStreaming(false)
      }
    },
    [ticketId, user, organizationId, onMessage, onError]
  )

  return { isStreaming, sendMessage }
}
