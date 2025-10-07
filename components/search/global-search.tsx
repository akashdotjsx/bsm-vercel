"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useDebounce } from 'use-debounce'
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
  Ticket,
  User,
  ArrowRight,
  Clock,
  Loader2,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

interface GlobalSearchProps {
  className?: string
}

interface SearchResult {
  id: string
  title: string
  description: string
  type: 'ticket' | 'user'
  category?: string
  url: string
  relevance: number
  metadata?: any
}

interface SearchResponse {
  tickets?: SearchResult[]
  users?: SearchResult[]
  suggestions: string[]
}

export function GlobalSearch({ className }: GlobalSearchProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [searchType, setSearchType] = useState<'all' | 'tickets' | 'users'>('all')
  
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()

  // Track search function
  const trackSearch = useCallback(async (query: string, resultCount: number = 0, clickedId?: string, clickedType?: string) => {
    try {
      await fetch('/api/search/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          search_type: searchType,
          result_count: resultCount,
          clicked_result_id: clickedId,
          clicked_result_type: clickedType
        })
      })
    } catch (error) {
      console.error('Error tracking search:', error)
    }
  }, [searchType])

  // Fetch suggestions function
  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([])
      return
    }

    try {
      const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}&limit=8`)
      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.suggestions || [])
        setRecentSearches(data.recent_searches || [])
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error)
    }
  }, [])

  // Debounced search function
  const performSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    try {
      const responses = await Promise.allSettled([
        searchType === 'all' || searchType === 'tickets' 
          ? fetch(`/api/search/tickets?q=${encodeURIComponent(query)}&limit=5`).then(r => r.json())
          : Promise.resolve(null),
        searchType === 'all' || searchType === 'users'
          ? fetch(`/api/search/users?q=${encodeURIComponent(query)}&limit=5`).then(r => r.json())
          : Promise.resolve(null)
      ])

      const [ticketsResponse, usersResponse] = responses
      const allResults: SearchResult[] = []

      if (ticketsResponse.status === 'fulfilled' && ticketsResponse.value?.tickets) {
        allResults.push(...ticketsResponse.value.tickets)
      }

      if (usersResponse.status === 'fulfilled' && usersResponse.value?.users) {
        allResults.push(...usersResponse.value.users)
      }

      // Sort by relevance
      allResults.sort((a, b) => b.relevance - a.relevance)
      
      setResults(allResults.slice(0, 8))
      
      // Track the search
      await trackSearch(query, allResults.length)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
    }
  }, [searchType, trackSearch])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return

    const totalItems = suggestions.length + results.length
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % (totalItems + 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev <= 0 ? totalItems : prev - 1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0) {
          if (selectedIndex < suggestions.length) {
            // Selected a suggestion
            const suggestion = suggestions[selectedIndex]
            handleSuggestionClick(suggestion)
          } else {
            // Selected a result
            const result = results[selectedIndex - suggestions.length]
            handleResultClick(result)
          }
        } else if (searchTerm) {
          // Go to search results page
          router.push(`/search?q=${encodeURIComponent(searchTerm)}`)
          setIsOpen(false)
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSelectedIndex(-1)
        break
    }
  }, [isOpen, selectedIndex, suggestions.length, results.length, searchTerm, router])

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setIsOpen(true)
      }
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener("keydown", handleGlobalKeyDown)
    document.addEventListener("keydown", handleKeyDown)
    document.addEventListener("mousedown", handleClickOutside)
    
    return () => {
      document.removeEventListener("keydown", handleGlobalKeyDown)
      document.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [handleKeyDown])

  // Debounce search input for results
  useEffect(() => {
    if (debouncedSearchTerm) {
      performSearch(debouncedSearchTerm)
    } else {
      setResults([])
      setIsSearching(false)
    }
  }, [debouncedSearchTerm, performSearch])

  // Fetch suggestions when search term changes (faster debounce)
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (searchTerm) {
        fetchSuggestions(searchTerm)
      } else {
        setSuggestions([])
      }
    }, 150) // Faster for suggestions

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchTerm, fetchSuggestions])

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
      setSelectedIndex(-1)
    }
  }, [isOpen])

  const handleSuggestionClick = async (suggestion: string) => {
    setSearchTerm(suggestion)
    setIsOpen(false)
    // Track suggestion click
    await trackSearch(suggestion, 0)
    router.push(`/search?q=${encodeURIComponent(suggestion)}`)
  }

  const handleResultClick = async (result: SearchResult) => {
    setIsOpen(false)
    // Track result click
    await trackSearch(searchTerm, 1, result.id, result.type)
    router.push(result.url)
  }

  const handleSearchTypeChange = (type: 'all' | 'tickets' | 'users') => {
    setSearchType(type)
    if (searchTerm) {
      performSearch(searchTerm)
    }
  }

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'ticket':
        return <Ticket className="h-4 w-4" />
      case 'user':
        return <User className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getResultTypeColor = (type: string) => {
    switch (type) {
      case 'ticket':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'user':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }


  return (
    <div className={cn("relative flex-1 max-w-lg mx-auto", className)} ref={dropdownRef}>
      {/* Search Input in Header */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder="Search tickets, users..."
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
          {/* Search Type Filters */}
          {searchTerm && (
            <div className="p-2 border-b border-border">
              <div className="flex gap-1">
                <Button
                  variant={searchType === 'all' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-6 text-[10px] px-2"
                  onClick={() => handleSearchTypeChange('all')}
                >
                  All
                </Button>
                <Button
                  variant={searchType === 'tickets' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-6 text-[10px] px-2"
                  onClick={() => handleSearchTypeChange('tickets')}
                >
                  <Ticket className="h-3 w-3 mr-1" />
                  Tickets
                </Button>
                <Button
                  variant={searchType === 'users' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-6 text-[10px] px-2"
                  onClick={() => handleSearchTypeChange('users')}
                >
                  <User className="h-3 w-3 mr-1" />
                  Users
                </Button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isSearching && (
            <div className="p-4 flex items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span className="text-[11px] text-muted-foreground">Searching...</span>
            </div>
          )}

          {/* Suggestions */}
          {!isSearching && suggestions.length > 0 && (
            <div className="border-b border-border">
              <div className="p-2">
                <div className="text-[10px] font-medium text-muted-foreground mb-1 px-2">Suggestions</div>
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={cn(
                      "flex items-center gap-2 w-full p-2 text-left hover:bg-muted rounded-sm transition-colors text-[11px]",
                      selectedIndex === index && "bg-muted"
                    )}
                  >
                    <Search className="h-3 w-3 text-muted-foreground" />
                    <span className="flex-1 truncate">{suggestion}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search Results */}
          {!isSearching && results.length > 0 && (
            <div className="">
              <div className="p-2">
                <div className="text-[10px] font-medium text-muted-foreground mb-1 px-2">Results</div>
                {results.map((result, index) => (
                  <button
                    key={result.id}
                    onClick={() => handleResultClick(result)}
                    className={cn(
                      "flex items-start gap-3 w-full p-2 text-left hover:bg-muted rounded-sm transition-colors",
                      selectedIndex === (suggestions.length + index) && "bg-muted"
                    )}
                  >
                    <div className="text-muted-foreground mt-0.5">
                      {getResultIcon(result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-medium truncate">{result.title}</span>
                        <Badge variant="secondary" className={cn("text-[9px] px-1 py-0", getResultTypeColor(result.type))}>
                          {result.type}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground line-clamp-1">
                        {result.description}
                      </p>
                      {result.metadata && (
                        <div className="flex items-center gap-2 mt-1 text-[9px] text-muted-foreground">
                          {result.metadata.status && (
                            <Badge variant="outline" className="text-[8px] px-1 py-0 h-4">
                              {result.metadata.status}
                            </Badge>
                          )}
                          {result.metadata.department && (
                            <span>{result.metadata.department}</span>
                          )}
                        </div>
                      )}
                    </div>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  </button>
                ))}
                
                {/* View all results link */}
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start h-8 text-[10px] mt-1"
                    onClick={() => {
                      router.push(`/search?q=${encodeURIComponent(searchTerm)}`)
                      setIsOpen(false)
                    }}
                  >
                    <Search className="h-3 w-3 mr-2" />
                    View all results for "{searchTerm}"
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* No results */}
          {!isSearching && searchTerm && results.length === 0 && suggestions.length === 0 && (
            <div className="p-4 text-center">
              <Search className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-[11px] text-muted-foreground">No results found for "{searchTerm}"</p>
            </div>
          )}

          {/* Default state - no search term */}
          {!searchTerm && (
            <div className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-3 w-3 text-primary" />
                <span className="text-[11px] font-medium text-foreground">Enterprise Search</span>
              </div>
              <p className="text-[9px] text-muted-foreground mb-3">
                Search across tickets, users, and more with real-time suggestions
              </p>
              
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="space-y-1 mb-3">
                  <div className="text-[9px] font-medium text-muted-foreground mb-1">Recent searches:</div>
                  {recentSearches.slice(0, 3).map((search, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(search)}
                      className="flex items-center gap-2 w-full p-2 text-left hover:bg-muted rounded-sm transition-colors"
                    >
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[10px] text-foreground">{search}</span>
                    </button>
                  ))}
                </div>
              )}
              
              <div className="space-y-1">
                <div className="text-[9px] font-medium text-muted-foreground mb-1">Try searching for:</div>
                {['laptop request', 'John Doe', 'password reset', 'hardware issue'].map((example, index) => (
                  <button
                    key={index}
                    onClick={() => setSearchTerm(example)}
                    className="flex items-center gap-2 w-full p-2 text-left hover:bg-muted rounded-sm transition-colors"
                  >
                    <Search className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] text-foreground">{example}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
