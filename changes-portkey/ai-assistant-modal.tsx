"use client"

import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { X, Maximize2, ChevronRight, Settings, Send, Loader2, Brain, Sparkles, Zap, BarChart3 } from "lucide-react"
import Image from "next/image"
import portkeyClient, { Provider, SUPPORTED_MODELS } from "@/lib/portkey-client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface AIAssistantModalProps {
  isOpen: boolean
  onClose: () => void
}

const suggestions = [
  "Show me high priority tickets",
  "Are there any tasks with upcoming due dates that need attention?",
  "What is the current status of all subtasks in the project?",
  "What is the testing status across all project features?",
  "What is the distribution of tasks by priority level in this project?"
]

// Provider icons and colors
const PROVIDER_INFO = {
  aws: { name: 'AWS Claude', icon: Brain, color: '#FF9900', badge: 'Quality' },
  openai: { name: 'OpenAI GPT', icon: Sparkles, color: '#10A37F', badge: 'Natural' },
  groq: { name: 'Groq Llama', icon: Zap, color: '#F55036', badge: 'Speed' },
  openrouter: { name: 'OpenRouter', icon: BarChart3, color: '#6E72FF', badge: 'Balanced' }
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  provider?: Provider
  model?: string
}

export function AIAssistantModal({ isOpen, onClose }: AIAssistantModalProps) {
  const [input, setInput] = useState("")
  const [mounted, setMounted] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentProvider, setCurrentProvider] = useState<Provider>('aws')
  const [currentModel, setCurrentModel] = useState('auto')
  const [streamingText, setStreamingText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  if (!isOpen || !mounted) return null

  // Handle sending message
  const handleSend = async (text?: string) => {
    const messageText = text || input.trim()
    if (!messageText || isLoading) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setStreamingText('')

    const assistantId = `assistant-${Date.now()}`
    let fullResponse = ''

    try {
      // Prepare messages for API
      const apiMessages = [
        { role: 'system' as const, content: 'You are a helpful AI assistant for a ticketing system. Provide concise, actionable responses about tickets, priorities, and support workflows.' },
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user' as const, content: messageText }
      ]

      // Stream response from Portkey
      await portkeyClient.streamChat(
        apiMessages,
        (chunk) => {
          const delta = chunk.choices?.[0]?.delta?.content
          if (delta) {
            fullResponse += delta
            setStreamingText(fullResponse)

            // Update or add assistant message
            setMessages(prev => {
              const existing = prev.find(m => m.id === assistantId)
              if (existing) {
                return prev.map(m =>
                  m.id === assistantId ? { ...m, content: fullResponse } : m
                )
              } else {
                return [
                  ...prev,
                  {
                    id: assistantId,
                    role: 'assistant' as const,
                    content: fullResponse,
                    provider: currentProvider,
                    model: currentModel !== 'auto' ? currentModel : undefined
                  }
                ]
              }
            })
          }
        },
        {
          provider: currentProvider,
          model: currentModel !== 'auto' ? currentModel : undefined,
          maxTokens: 1000,
          temperature: 0.7
        }
      )
    } catch (error: any) {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `❌ Error: ${error.message || 'Failed to get AI response'}`
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      setStreamingText('')
    }
  }

  const providerInfo = PROVIDER_INFO[currentProvider]
  const ProviderIcon = providerInfo.icon

  const modalContent = (
    <div 
      className="fixed right-0 w-[400px] pointer-events-auto"
      style={{ 
        position: 'fixed',
        top: '64px', // Start below navbar
        right: '0',
        bottom: '20px', // End before screen edge
        width: '400px',
        height: 'calc(100vh - 84px)', // Full height minus navbar and bottom margin
        transform: 'translateX(0)',
        transition: 'transform 0.2s ease-in-out',
        pointerEvents: 'auto',
        zIndex: 9999 // Ensure modal appears above all other content
      }}
    >
      {/* Side Tray - Overlay that doesn't affect layout */}
      <div className="relative bg-white h-full shadow-2xl overflow-hidden" style={{ borderRadius: '25px 0px 0px 25px' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-[#6E72FF] to-[#FF2CB9] rounded-[16px] flex items-center justify-center">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8 0L10.5 5.5L16 8L10.5 10.5L8 16L5.5 10.5L0 8L5.5 5.5L8 0Z"
                  fill="white"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#2D2F34]">AI Assistant</h2>
              <p className="text-sm text-[#8e8e8e]">Ask me anything about your tickets</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="w-6 h-6 hover:bg-gray-100 rounded flex items-center justify-center">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2 2H14V4H2V2ZM2 6H14V8H2V6ZM2 10H14V12H2V10Z"
                  fill="#2D2F34"
                />
              </svg>
            </button>
            <button 
              className="w-6 h-6 hover:bg-gray-100 rounded flex items-center justify-center"
              onClick={onClose}
            >
              <X className="w-5 h-5 text-[#2D2F34]" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 h-full flex flex-col overflow-hidden">
          {/* Model Selection */}
          <div className="mb-4 space-y-3 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="text-xs font-medium text-[#8e8e8e] mb-1 block">AI Provider</label>
                <Select value={currentProvider} onValueChange={(v) => { setCurrentProvider(v as Provider); setCurrentModel('auto') }}>
                  <SelectTrigger className="h-9 text-sm border-[#DADADA]">
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        <ProviderIcon className="h-4 w-4" style={{ color: providerInfo.color }} />
                        <span>{providerInfo.name}</span>
                        <Badge variant="secondary" className="text-xs">{providerInfo.badge}</Badge>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PROVIDER_INFO).map(([key, info]) => {
                      const Icon = info.icon
                      return (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" style={{ color: info.color }} />
                            <span>{info.name}</span>
                            <Badge variant="outline" className="text-xs">{info.badge}</Badge>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label className="text-xs font-medium text-[#8e8e8e] mb-1 block">Model</label>
                <Select value={currentModel} onValueChange={setCurrentModel}>
                  <SelectTrigger className="h-9 text-sm border-[#DADADA]">
                    <SelectValue placeholder="Auto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto (Default)</SelectItem>
                    {SUPPORTED_MODELS[currentProvider].map((model) => (
                      <SelectItem key={model} value={model}>
                        <span className="text-xs font-mono">{model}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Messages or Suggestions */}
          <div className="flex-1 overflow-y-auto mb-4">
            {messages.length === 0 ? (
              <div>
                <h3 className="text-sm font-medium text-[#8e8e8e] mb-4">Suggestions</h3>
                <div className="space-y-3">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSend(suggestion)}
                      disabled={isLoading}
                      className="w-full flex items-center justify-between px-4 py-3 bg-[#F3F4FF] rounded-lg hover:bg-[#E8E9FF] transition-colors group disabled:opacity-50"
                    >
                      <span className="text-sm text-[#2D2F34] text-left flex-1 pr-3">
                        {suggestion}
                      </span>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="opacity-60 group-hover:opacity-100 transition-opacity"
                      >
                        <path
                          d="M6 4L10 8L6 12"
                          stroke="#2D2F34"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-lg px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-[#6E72FF] to-[#FF2CB9] text-white'
                        : 'bg-[#F3F4FF] text-[#2D2F34]'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      {message.provider && (
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/20">
                          <Badge variant="outline" className="text-xs">
                            {PROVIDER_INFO[message.provider].name}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {streamingText && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] bg-[#F3F4FF] rounded-lg px-4 py-2">
                      <p className="text-sm whitespace-pre-wrap">{streamingText}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Loader2 className="h-3 w-3 animate-spin text-[#6E72FF]" />
                        <span className="text-xs text-[#8e8e8e]">AI is typing...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Section */}
          <div className="space-y-3 pb-4 flex-shrink-0">
            <div className="relative">
              <div className="w-full bg-gradient-to-r from-[#6E72FF] to-[#FF2CB9] rounded-xl p-[2px]">
                <div className="w-full bg-white rounded-xl p-3">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSend()
                      }
                    }}
                    disabled={isLoading}
                    placeholder="Ask anything about your tickets..."
                    className="w-full h-20 text-sm text-[#2D2F34] placeholder:text-[#8e8e8e] bg-transparent border-0 outline-none resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {messages.length > 0 && (
                  <button
                    onClick={() => setMessages([])}
                    className="text-xs text-[#8e8e8e] hover:text-[#2D2F34] transition-colors"
                  >
                    Clear Chat
                  </button>
                )}
              </div>

              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className="w-10 h-10 bg-gradient-to-r from-[#6E72FF] to-[#FF2CB9] hover:from-[#6E72FF]/90 hover:to-[#FF2CB9]/90 rounded-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                ) : (
                  <Send className="w-4 h-4 text-white" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
