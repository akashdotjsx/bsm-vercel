"use client"

import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { X, Maximize2, ChevronRight, Settings, Send, ChevronDown, Globe } from "lucide-react"
import Image from "next/image"
import ReactMarkdown from 'react-markdown'
import { useAuth } from "@/lib/contexts/auth-context"

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

const AI_MODELS = [
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai' },
  { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', provider: 'openai' },
  { id: 'gpt-4.1', name: 'GPT-4.1', provider: 'openai' },
  { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'anthropic' },
  { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', provider: 'anthropic' },
  { id: 'llama-3.1-70b-versatile', name: 'Llama 3.1 70B', provider: 'groq' },
  { id: 'google/gemini-pro-1.5', name: 'Gemini Pro 1.5', provider: 'openrouter' },
]

const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese']

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export function AIAssistantModal({ isOpen, onClose }: AIAssistantModalProps) {
  const { user, profile } = useAuth()
  const [input, setInput] = useState("")
  const [mounted, setMounted] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [webSearch, setWebSearch] = useState(false)
  const [selectedModel, setSelectedModel] = useState(AI_MODELS[2]) // GPT-4.1 default
  const [selectedLanguage, setSelectedLanguage] = useState('English')
  const [showModelDropdown, setShowModelDropdown] = useState(false)
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const modelDropdownRef = useRef<HTMLDivElement>(null)
  const languageDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
        setShowModelDropdown(false)
      }
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target as Node)) {
        setShowLanguageDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (query: string) => {
    if (!query.trim() || isStreaming) return

    // Add user message
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: query,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsStreaming(true)

    const aiMessageId = crypto.randomUUID()
    let fullContent = ''

    try {
      // Call backend API route with user context
      const response = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          history: messages.map(m => ({ role: m.role, content: m.content })),
          webSearch,
          userContext: {
            userId: user?.id,
            userName: profile?.display_name || profile?.email || 'User',
            userEmail: profile?.email || user?.email,
          },
        }),
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText)
        throw new Error(`API error: ${errorText}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) throw new Error('No response body')

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

              // Update AI message
              setMessages(prev => {
                const existing = prev.find(m => m.id === aiMessageId)
                if (existing) {
                  return prev.map(m =>
                    m.id === aiMessageId
                      ? { ...m, content: fullContent }
                      : m
                  )
                }
                return [
                  ...prev,
                  {
                    id: aiMessageId,
                    role: 'assistant',
                    content: fullContent,
                    timestamp: new Date(),
                  },
                ]
              })
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    } catch (error: any) {
      console.error('AI Error:', error)
      const errorMessage = error.message || 'Unknown error occurred'
      setMessages(prev => [
        ...prev,
        {
          id: aiMessageId,
          role: 'assistant',
          content: `❌ **Error**: ${errorMessage}\n\nPlease try again or rephrase your question.`,
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsStreaming(false)
    }
  }

  const handleSend = () => {
    sendMessage(input)
  }

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!isOpen || !mounted) return null

  const modalContent = (
    <div 
      className="pointer-events-auto"
      style={{ 
        position: 'fixed',
        top: '0',
        right: '0',
        bottom: '0',
        width: '400px',
        height: '100vh',
        transform: 'translateX(0)',
        transition: 'transform 0.2s ease-in-out',
        pointerEvents: 'auto',
        zIndex: 99999,
        overflow: 'hidden'
      }}
    >
      {/* Side Tray - Fixed overlay */}
      <div className="relative bg-white dark:bg-[#1a1a1a] h-full shadow-2xl flex flex-col" style={{ borderRadius: '0' }}>
        {/* Header - Fixed */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a1a]">
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
              <h2 className="text-sm font-semibold text-[#2D2F34] dark:text-white">AI Assistant</h2>
              <p className="text-xs text-[#8e8e8e] dark:text-gray-400">Ask me anything about your tickets</p>
            </div>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-[#1a1a1a]">
          {messages.length === 0 ? (
            <>
              {/* Suggestions Section */}
              <div className="px-6 pt-4 mb-8">
                <h3 className="text-xs font-medium text-[#8e8e8e] dark:text-gray-400 mb-4">Suggestions</h3>
                <div className="space-y-3">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      disabled={isStreaming}
                      className="w-full flex items-center justify-between px-4 py-3 bg-[#F3F4FF] dark:bg-[#2a2a2a] rounded-lg hover:bg-[#E8E9FF] dark:hover:bg-[#333333] transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="text-xs text-[#2D2F34] dark:text-white text-left flex-1 pr-3">
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
                          stroke="currentColor"
                          className="stroke-[#2D2F34] dark:stroke-white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1" />
            </>
          ) : (
            <>
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4 px-6 pt-4 bg-white dark:bg-[#1a1a1a]">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-4 py-3 ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-[#6E72FF] to-[#FF2CB9] text-white'
                          : 'bg-[#F3F4FF] dark:bg-[#2a2a2a] text-[#2D2F34] dark:text-white'
                      }`}
                    >
                      <div className="prose prose-sm max-w-none text-xs">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                      <div
                        className={`text-[10px] mt-2 ${
                          msg.role === 'user' ? 'text-white/70' : 'text-[#8e8e8e] dark:text-gray-400'
                        }`}
                      >
                        {msg.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
                {isStreaming && (
                  <div className="flex items-center gap-2 text-[#8e8e8e] dark:text-gray-400 text-xs">
                    <div className="animate-spin h-4 w-4 border-2 border-[#6E72FF] border-t-transparent rounded-full" />
                    AI is thinking...
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </>
          )}

          {/* Input Section - Fixed at bottom */}
          <div className="flex-shrink-0 space-y-4 px-6 pb-4 pt-2 bg-white dark:bg-[#1a1a1a] border-t border-gray-200 dark:border-gray-700">
            {/* Input Field */}
            <div className="relative">
              <div className="w-full min-h-[120px] bg-gradient-to-r from-[#6E72FF] to-[#FF2CB9] rounded-xl p-[2px]">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask Anything..."
                  disabled={isStreaming}
                  className="w-full h-full min-h-[116px] bg-white dark:bg-[#1a1a1a] rounded-xl p-4 text-xs text-[#2D2F34] dark:text-white placeholder:text-[#8e8e8e] dark:placeholder:text-gray-500 resize-none focus:outline-none disabled:opacity-50"
                />
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between gap-2">
              {/* Web Search Toggle */}
              <button
                onClick={() => setWebSearch(!webSearch)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  webSearch
                    ? 'bg-gradient-to-r from-[#6E72FF] to-[#FF2CB9] text-white shadow-md'
                    : 'bg-white dark:bg-[#2a2a2a] text-[#5F5F5F] dark:text-gray-400 border border-[#E5E5E5] dark:border-gray-700 hover:border-[#6E72FF] dark:hover:border-[#6E72FF]'
                }`}
                title="Enable web search"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Web</span>
              </button>

              {/* Model Selector */}
              <div className="relative" ref={modelDropdownRef}>
                <button
                  onClick={() => setShowModelDropdown(!showModelDropdown)}
                  className="flex items-center gap-2 bg-white dark:bg-[#2a2a2a] border border-[#E5E5E5] dark:border-gray-700 rounded-lg px-3 py-2 hover:border-[#6E72FF] dark:hover:border-[#6E72FF] transition-colors"
                >
                  <div className="w-3 h-3 bg-[#168846] rounded flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-sm" />
                  </div>
                  <span className="text-xs text-[#5F5F5F] dark:text-gray-400 max-w-[80px] truncate">{selectedModel.name}</span>
                  <ChevronDown className="w-3 h-3 text-[#9F9F9F] dark:text-gray-500" />
                </button>
                
                {showModelDropdown && (
                  <div 
                    className="absolute bottom-full left-0 mb-2 w-48 bg-white dark:bg-[#2a2a2a] border border-[#E5E5E5] dark:border-gray-700 rounded-lg shadow-xl max-h-64 overflow-y-auto z-50"
                  >
                    {AI_MODELS.map((model) => (
                      <button
                        key={model.id}
                        onClick={() => {
                          setSelectedModel(model)
                          setShowModelDropdown(false)
                        }}
                        className={`w-full text-left px-3 py-2 text-xs hover:bg-[#F3F4FF] dark:hover:bg-[#333] transition-colors ${
                          selectedModel.id === model.id ? 'bg-[#F3F4FF] dark:bg-[#333] text-[#6E72FF]' : 'text-[#5F5F5F] dark:text-gray-400'
                        }`}
                      >
                        {model.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Language Selector */}
              <div className="relative" ref={languageDropdownRef}>
                <button
                  onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                  className="flex items-center gap-2 bg-white dark:bg-[#2a2a2a] border border-[#E5E5E5] dark:border-gray-700 rounded-lg px-3 py-2 hover:border-[#6E72FF] dark:hover:border-[#6E72FF] transition-colors"
                >
                  <span className="text-xs text-[#5F5F5F] dark:text-gray-400">{selectedLanguage}</span>
                  <ChevronDown className="w-3 h-3 text-[#9F9F9F] dark:text-gray-500" />
                </button>
                
                {showLanguageDropdown && (
                  <div 
                    className="absolute bottom-full right-0 mb-2 w-36 bg-white dark:bg-[#2a2a2a] border border-[#E5E5E5] dark:border-gray-700 rounded-lg shadow-xl max-h-64 overflow-y-auto z-50"
                  >
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang}
                        onClick={() => {
                          setSelectedLanguage(lang)
                          setShowLanguageDropdown(false)
                        }}
                        className={`w-full text-left px-3 py-2 text-xs hover:bg-[#F3F4FF] dark:hover:bg-[#333] transition-colors ${
                          selectedLanguage === lang ? 'bg-[#F3F4FF] dark:bg-[#333] text-[#6E72FF]' : 'text-[#5F5F5F] dark:text-gray-400'
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Send Button */}
              <button
                onClick={handleSend}
                disabled={!input.trim() || isStreaming}
                className="w-10 h-10 bg-gradient-to-r from-[#6E72FF] to-[#FF2CB9] hover:from-[#6E72FF]/90 hover:to-[#FF2CB9]/90 rounded-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex-shrink-0"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
