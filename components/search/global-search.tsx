"use client"

import { useState, useEffect, useRef } from "react"
import {
  Search,
  Clock,
  ArrowRight,
  X,
  Zap,
  Sparkles,
  Database,
  FileText,
  Users,
  Settings,
  Building,
  Workflow,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useSearch } from "@/lib/contexts/search-context"
import { cn } from "@/lib/utils"

interface GlobalSearchProps {
  className?: string
}

export function GlobalSearch({ className }: GlobalSearchProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [activeFilter, setActiveFilter] = useState<string>("all")
  const inputRef = useRef<HTMLInputElement>(null)

  const {
    searchTerm,
    setSearchTerm,
    results,
    isSearching,
    recentSearches,
    suggestions,
    performSearch,
    clearSearch,
    addToRecent,
  } = useSearch()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setIsOpen(true)
      }
      if (e.key === "Escape") {
        setIsOpen(false)
        clearSearch()
      }
      if (isOpen && results.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault()
          setSelectedIndex((prev) => (prev + 1) % results.length)
        }
        if (e.key === "ArrowUp") {
          e.preventDefault()
          setSelectedIndex((prev) => (prev - 1 + results.length) % results.length)
        }
        if (e.key === "Enter" && results[selectedIndex]) {
          e.preventDefault()
          handleResultClick(results[selectedIndex])
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [clearSearch, isOpen, results, selectedIndex])

  // Focus input when dialog opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  const handleSearch = async (term: string) => {
    setSearchTerm(term)
    await performSearch(term)
    if (term.trim()) {
      addToRecent(term)
    }
  }

  const handleResultClick = (result: any) => {
    addToRecent(searchTerm)
    setIsOpen(false)
    // Navigate to result URL
    window.location.href = result.url
  }

  const getTypeIcon = (type: string) => {
    const iconMap = {
      ticket: <FileText className="h-4 w-4 text-blue-600" />,
      user: <Users className="h-4 w-4 text-green-600" />,
      knowledge: <Database className="h-4 w-4 text-purple-600" />,
      service: <Settings className="h-4 w-4 text-orange-600" />,
      asset: <Building className="h-4 w-4 text-gray-600" />,
      workflow: <Workflow className="h-4 w-4 text-yellow-600" />,
      account: <Building className="h-4 w-4 text-pink-600" />,
    }
    return iconMap[type as keyof typeof iconMap] || <FileText className="h-4 w-4 text-gray-600" />
  }

  const getTypeColor = (type: string) => {
    const colors = {
      ticket: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300",
      user: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300",
      knowledge: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300",
      service: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300",
      asset: "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950 dark:text-gray-300",
      workflow: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300",
      account: "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950 dark:text-pink-300",
    }
    return colors[type as keyof typeof colors] || "bg-gray-50 text-gray-700 border-gray-200"
  }

  const filteredResults = activeFilter === "all" ? results : results.filter((result) => result.type === activeFilter)

  const filterOptions = [
    { key: "all", label: "All", icon: <Sparkles className="h-3 w-3" />, count: results.length },
    {
      key: "ticket",
      label: "Tickets",
      icon: <FileText className="h-3 w-3" />,
      count: results.filter((r) => r.type === "ticket").length,
    },
    {
      key: "account",
      label: "Accounts",
      icon: <Building className="h-3 w-3" />,
      count: results.filter((r) => r.type === "account").length,
    },
    {
      key: "knowledge",
      label: "Knowledge",
      icon: <Database className="h-3 w-3" />,
      count: results.filter((r) => r.type === "knowledge").length,
    },
    {
      key: "service",
      label: "Services",
      icon: <Settings className="h-3 w-3" />,
      count: results.filter((r) => r.type === "service").length,
    },
    {
      key: "asset",
      label: "Assets",
      icon: <Building className="h-3 w-3" />,
      count: results.filter((r) => r.type === "asset").length,
    },
    {
      key: "user",
      label: "Users",
      icon: <Users className="h-3 w-3" />,
      count: results.filter((r) => r.type === "user").length,
    },
  ]

  return (
    <>
      {/* Search Input in Header */}
      <div className={cn("relative flex-1 max-w-lg mx-auto", className)}>
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search workspace... (⌘K)"
          className="pl-10 h-9 text-[13px] bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          onClick={() => setIsOpen(true)}
          readOnly
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>
      </div>

      {/* Enhanced Enterprise Search Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-[1200px] w-[95vw] p-0 gap-0 h-[850px] flex flex-col">
          <DialogHeader className="sr-only">
            <DialogTitle>Enterprise Search</DialogTitle>
          </DialogHeader>

          <div className="flex items-center gap-4 p-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Search className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-[16px] text-gray-900 dark:text-gray-100">Enterprise Search</h3>
                <p className="text-[13px] text-gray-600 dark:text-gray-400">
                  Search across all workspace content with AI-powered relevance
                </p>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <Badge variant="secondary" className="text-[12px] px-3 py-1.5">
                <Sparkles className="h-4 w-4 mr-1" />
                Smart Search
              </Badge>
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="h-9 w-9 p-0">
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-4 p-8 bg-white dark:bg-gray-950">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                ref={inputRef}
                placeholder="Search tickets, users, knowledge base, services, assets, workflows, and accounts..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-12 h-14 text-[14px] border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-lg"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {isSearching && (
              <div className="flex items-center gap-2 text-[13px] text-gray-500">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                Searching...
              </div>
            )}
          </div>

          {searchTerm && results.length > 0 && (
            <div className="flex items-center gap-1 px-6 py-4 bg-gray-50 dark:bg-gray-900">
              {filterOptions.map((filter) => (
                <Button
                  key={filter.key}
                  variant={activeFilter === filter.key ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveFilter(filter.key)}
                  className={cn(
                    "h-10 px-3 text-[14px] gap-2 rounded-lg flex-shrink-0",
                    activeFilter === filter.key
                      ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800",
                  )}
                >
                  {filter.icon}
                  {filter.label}
                  {filter.count > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 h-6 px-2 text-[12px] bg-white/20 text-current border-0 rounded-md"
                    >
                      {filter.count}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {!searchTerm && recentSearches.length > 0 && (
              <div className="p-8">
                <h4 className="text-[14px] font-medium text-gray-900 dark:text-gray-100 mb-5 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-gray-500" />
                  Recent Searches
                </h4>
                <div className="space-y-3">
                  {recentSearches.slice(0, 5).map((recent, index) => (
                    <button
                      key={index}
                      onClick={() => handleSearch(recent)}
                      className="flex items-center gap-4 w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <Clock className="h-5 w-5 text-gray-400" />
                      <span className="text-[14px] text-gray-700 dark:text-gray-300">{recent}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!searchTerm && (
              <div className="p-8">
                <h4 className="text-[14px] font-medium text-gray-900 dark:text-gray-100 mb-5 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-500" />
                  Quick Actions
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    {
                      label: "My Open Tickets",
                      query: "my tickets status:open",
                      icon: <FileText className="h-5 w-5" />,
                      color: "text-blue-600",
                    },
                    {
                      label: "Knowledge Base",
                      query: "knowledge base",
                      icon: <Database className="h-5 w-5" />,
                      color: "text-purple-600",
                    },
                    {
                      label: "Active Users",
                      query: "users status:active",
                      icon: <Users className="h-5 w-5" />,
                      color: "text-green-600",
                    },
                    {
                      label: "IT Services",
                      query: "services category:IT",
                      icon: <Settings className="h-5 w-5" />,
                      color: "text-orange-600",
                    },
                    {
                      label: "Asset Inventory",
                      query: "assets status:active",
                      icon: <Building className="h-5 w-5" />,
                      color: "text-gray-600",
                    },
                    {
                      label: "Active Workflows",
                      query: "workflows status:running",
                      icon: <Workflow className="h-5 w-5" />,
                      color: "text-yellow-600",
                    },
                  ].map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleSearch(action.query)}
                      className="flex items-center gap-4 p-5 text-left hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg border-0 bg-white dark:bg-gray-900 shadow-sm transition-colors"
                    >
                      <div className={cn("p-3 rounded-lg bg-gray-100 dark:bg-gray-800", action.color)}>
                        {action.icon}
                      </div>
                      <span className="text-[14px] font-medium text-gray-700 dark:text-gray-300">{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {filteredResults.length > 0 && (
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-[14px] font-medium text-gray-900 dark:text-gray-100">
                    Search Results ({filteredResults.length})
                  </h4>
                  <div className="text-[12px] text-gray-500">Sorted by relevance</div>
                </div>
                <div className="space-y-4">
                  {filteredResults.map((result, index) => (
                    <button
                      key={result.id}
                      onClick={() => handleResultClick(result)}
                      className={cn(
                        "flex items-start gap-5 w-full p-5 text-left hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg border-0 bg-white dark:bg-gray-900 shadow-sm transition-all duration-200",
                        selectedIndex === index
                          ? "ring-2 ring-blue-200 bg-blue-50 dark:ring-blue-800 dark:bg-blue-950"
                          : "",
                      )}
                    >
                      <div className="flex-shrink-0 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        {getTypeIcon(result.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h5 className="font-medium text-[14px] text-gray-900 dark:text-gray-100 truncate">
                            {result.title}
                          </h5>
                          <Badge
                            variant="outline"
                            className={cn("text-[11px] px-3 py-1 border-0 rounded-md", getTypeColor(result.type))}
                          >
                            {result.type}
                          </Badge>
                          <div className="ml-auto flex items-center gap-2">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <div
                                  key={i}
                                  className={cn(
                                    "w-1.5 h-1.5 rounded-full mr-1",
                                    i < Math.floor(result.relevance * 5) ? "bg-blue-500" : "bg-gray-300",
                                  )}
                                />
                              ))}
                            </div>
                            <span className="text-[11px] text-gray-500 ml-1">
                              {Math.round(result.relevance * 100)}%
                            </span>
                          </div>
                        </div>
                        <p className="text-[13px] text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                          {result.description}
                        </p>
                        <div className="flex items-center gap-5 text-[12px] text-gray-500">
                          {result.category && (
                            <span className="flex items-center gap-1">
                              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                              {result.category}
                            </span>
                          )}
                          {result.metadata &&
                            Object.entries(result.metadata)
                              .slice(0, 2)
                              .map(([key, value]) => (
                                <span key={key} className="flex items-center gap-1">
                                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                                  {key}: {String(value)}
                                </span>
                              ))}
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-gray-400 mt-3 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {searchTerm && !isSearching && results.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
                  <Search className="h-8 w-8 text-gray-400" />
                </div>
                <h4 className="text-[14px] font-medium text-gray-900 dark:text-gray-100 mb-2">No results found</h4>
                <p className="text-[12px] text-gray-600 dark:text-gray-400 text-center max-w-sm">
                  We couldn't find anything matching "{searchTerm}". Try different keywords or check your spelling.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {["tickets", "users", "knowledge", "services"].map((suggestion) => (
                    <Button
                      key={suggestion}
                      variant="outline"
                      size="sm"
                      onClick={() => handleSearch(suggestion)}
                      className="h-7 px-3 text-[11px] border-0 bg-gray-100 hover:bg-gray-200"
                    >
                      Try "{suggestion}"
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="px-8 py-5 bg-gray-50 dark:bg-gray-900">
            <div className="flex items-center justify-between text-[12px] text-gray-500">
              <div className="flex items-center gap-6">
                <span className="flex items-center gap-2">
                  <kbd className="px-3 py-1.5 bg-white dark:bg-gray-800 border-0 rounded text-[11px] shadow-sm">↑↓</kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-2">
                  <kbd className="px-3 py-1.5 bg-white dark:bg-gray-800 border-0 rounded text-[11px] shadow-sm">↵</kbd>
                  Select
                </span>
                <span className="flex items-center gap-2">
                  <kbd className="px-3 py-1.5 bg-white dark:bg-gray-800 border-0 rounded text-[11px] shadow-sm">
                    ESC
                  </kbd>
                  Close
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span>Powered by Smart Search</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
