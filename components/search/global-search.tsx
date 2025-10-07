"use client"

import { useState, useEffect, useRef } from "react"
import {
  Search,
  Sparkles,
  Database,
  FileText,
  Users,
  Settings,
  Workflow,
  HardDrive,
  Zap,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface GlobalSearchProps {
  className?: string
}

export function GlobalSearch({ className }: GlobalSearchProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setIsOpen(true)
      }
      if (e.key === "Escape") {
        setIsOpen(false)
      }
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  const quickActions = [
    {
      label: "My Open Tickets",
      icon: <FileText className="h-3 w-3" />,
      href: "/tickets/my-tickets"
    },
    {
      label: "Knowledge Base", 
      icon: <Database className="h-3 w-3" />,
      href: "/knowledge-base"
    },
    {
      label: "Active Users",
      icon: <Users className="h-3 w-3" />,
      href: "/users"
    },
    {
      label: "IT Services",
      icon: <Settings className="h-3 w-3" />,
      href: "/services"
    },
    {
      label: "Asset Inventory",
      icon: <HardDrive className="h-3 w-3" />,
      href: "/assets"
    },
    {
      label: "Active Workflows",
      icon: <Workflow className="h-3 w-3" />,
      href: "/workflows"
    }
  ]

  const handleQuickAction = (href: string) => {
    setIsOpen(false)
    // For now, just log - you can implement navigation later
    console.log('Navigate to:', href)
  }


  return (
    <div className={cn("relative flex-1 max-w-lg mx-auto", className)} ref={dropdownRef}>
      {/* Search Input in Header */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder="Search..."
          className="pl-10 h-8 text-[11px] bg-background border-border rounded-md hover:bg-muted transition-colors"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsOpen(true)}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-70">
            <span className="text-[9px]">⌘</span>K
          </kbd>
        </div>
      </div>

      {/* Google-like Search Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
          {/* Enterprise Search Header */}
          <div className="p-3 border-b border-border">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-3 w-3 text-primary" />
              <span className="text-[11px] font-medium text-foreground">Enterprise Search</span>
            </div>
            <p className="text-[9px] text-muted-foreground">
              Search across all workspace content with AI-powered relevance
            </p>
          </div>

          {/* Smart Search Section */}
          <div className="p-3 border-b border-border">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-3 w-3 text-primary" />
              <span className="text-[10px] font-medium text-foreground">Smart Search</span>
            </div>
            <p className="text-[9px] text-muted-foreground">
              Search tickets, users, knowledge base, services, assets, workflows, and accounts...
            </p>
          </div>

          {/* Quick Actions */}
          <div className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-3 w-3 text-primary" />
              <span className="text-[10px] font-medium text-foreground">Quick Actions</span>
            </div>
            <div className="space-y-1">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickAction(action.href)}
                  className="flex items-center gap-2 w-full p-2 text-left hover:bg-muted rounded-sm transition-colors"
                >
                  <div className="text-muted-foreground">
                    {action.icon}
                  </div>
                  <span className="text-[10px] text-foreground">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
