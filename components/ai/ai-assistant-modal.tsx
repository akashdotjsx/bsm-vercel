"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { X, Maximize2, ChevronRight, Settings } from "lucide-react"
import Image from "next/image"

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

export function AIAssistantModal({ isOpen, onClose }: AIAssistantModalProps) {
  const [input, setInput] = useState("")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!isOpen || !mounted) return null

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
        pointerEvents: 'auto'
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
              <p className="text-sm text-[#717171]">Ask me anything about your tickets</p>
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
        <div className="px-6 py-4 h-full flex flex-col">
          {/* Suggestions Section */}
          <div className="mb-8">
            <h3 className="text-sm font-medium text-[#717171] mb-4">Suggestions</h3>
            <div className="space-y-3">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  className="w-full flex items-center justify-between px-4 py-3 bg-[#F3F4FF] rounded-lg hover:bg-[#E8E9FF] transition-colors group"
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

          {/* Spacer to push input to bottom */}
          <div className="flex-1" />

          {/* Input Section */}
          <div className="space-y-4 pb-4">
            {/* Input Field */}
            <div className="relative">
              <div className="w-full h-[120px] bg-gradient-to-r from-[#6E72FF] to-[#FF2CB9] rounded-xl p-[2px]">
                <div className="w-full h-full bg-white rounded-xl flex items-start p-4">
                  <span className="text-sm text-[#797979]">Ask Anything...</span>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button className="w-8 h-8 hover:bg-gray-100 rounded-lg flex items-center justify-center">
                  <Settings className="w-4 h-4 text-[#717171]" />
                </button>
                
                <div className="flex items-center gap-2 bg-white border border-[#DADADA] rounded-lg px-3 py-2">
                  <div className="w-4 h-4 bg-[#168846] rounded flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-sm" />
                  </div>
                  <span className="text-xs text-[#9F9F9F]">GPT-4.1</span>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M4 3L8 6L4 9"
                      stroke="#9F9F9F"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                
                <div className="flex items-center gap-2 bg-white border border-[#DADADA] rounded-lg px-3 py-2">
                  <span className="text-xs text-[#9F9F9F]">Output in -</span>
                  <span className="text-xs text-[#9F9F9F]">English</span>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M4 3L8 6L4 9"
                      stroke="#9F9F9F"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>

              {/* Send Button */}
              <button className="w-10 h-10 bg-gradient-to-r from-[#6E72FF] to-[#FF2CB9] hover:from-[#6E72FF]/90 hover:to-[#FF2CB9]/90 rounded-xl flex items-center justify-center">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M8 1L15 8L8 15L8 1Z"
                    fill="white"
                  />
                  <path
                    d="M8 1V8"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
