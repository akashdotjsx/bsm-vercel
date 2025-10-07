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
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [searchType, setSearchType] = useState<'all' | 'tickets' | 'users'>('all')
  const [isTyping, setIsTyping] = useState(false)
  
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

  // Fetch suggestions function with enhanced real-time data
  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 1) {
      // For empty query, get recent searches
      try {
        setIsFetchingSuggestions(true)
        const response = await fetch(`/api/search/suggestions?q=&limit=8`)
        if (response.ok) {
          const data = await response.json()
          setSuggestions([])
          setRecentSearches(data.recent_searches || [])
        }
      } catch (error) {
        console.error('Error fetching recent searches:', error)
      } finally {
        setIsFetchingSuggestions(false)
      }
      return
    }

    if (query.length < 2) {
      setSuggestions([])
      setIsFetchingSuggestions(false)
      return
    }

    try {
      setIsFetchingSuggestions(true)
      const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}&limit=10`)
      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.suggestions || [])
        setRecentSearches(data.recent_searches || [])
        
        // Log real data stats for debugging
        if (data.has_real_data) {
          console.log('🔍 Real-time data:', {
            tickets: data.has_real_data.tickets,
            users: data.has_real_data.users,
            history: data.has_real_data.history,
            suggestions: data.suggestions?.length || 0
          })
        }
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error)
    } finally {
      setIsFetchingSuggestions(false)
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
          placeholder="Search tickets, users... (try: 'dev-', 'fix', 'admin')"
          className="pl-10 pr-16 h-8 text-[11px] bg-background border-border rounded-md hover:bg-muted transition-colors focus:ring-1 focus:ring-primary/20"
          value={searchTerm}
          onChange={(e) => {
            const value = e.target.value
            setSearchTerm(value)
            setIsTyping(true)
            // Stop typing indicator after 1 second of no input
            setTimeout(() => setIsTyping(false), 1000)
          }}
          onFocus={() => {
            setIsOpen(true)
            // Load recent searches when focused with no query
            if (!searchTerm) {
              fetchSuggestions('')
            }
          }}
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

          {/* Loading States */}
          {(isSearching || isFetchingSuggestions) && (
            <div className="p-4 flex items-center justify-center border-b border-border">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span className="text-[11px] text-muted-foreground">
                {isSearching ? 'Searching real-time data...' : 'Loading smart suggestions...'}
              </span>
              {isTyping && (
                <div className="ml-2 flex gap-1">
                  <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              )}
            </div>
          )}

          {/* Enhanced Suggestions with categorization */}
          {!isSearching && suggestions.length > 0 && (
            <div className="border-b border-border">
              <div className="p-2">
                <div className="flex items-center gap-2 mb-2 px-2">
                  <Sparkles className="h-3 w-3 text-primary" />
                  <span className="text-[10px] font-medium text-foreground">Smart Suggestions</span>
                  <Badge variant="outline" className="text-[8px] px-1 py-0 h-4">
                    {suggestions.length}
                  </Badge>
                </div>
                {suggestions.map((suggestion, index) => {
                  // Categorize suggestions based on content
                  const isTicketNumber = suggestion.match(/^TK-/)
                  const isDepartment = suggestion.includes('team') || suggestion.includes('department')
                  const isUserEmail = suggestion.includes('@')
                  const isPrefixMatch = suggestion.toLowerCase().startsWith(searchTerm.toLowerCase()) && suggestion.length > searchTerm.length
                  
                  return (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className={cn(
                        "flex items-center gap-3 w-full p-2 text-left hover:bg-muted rounded-sm transition-colors text-[11px] group",
                        selectedIndex === index && "bg-muted ring-1 ring-primary/20"
                      )}
                    >
                      {/* Dynamic icons based on suggestion type */}
                      <div className="text-muted-foreground group-hover:text-foreground transition-colors">
                        {isTicketNumber ? (
                          <Ticket className="h-3 w-3" />
                        ) : isDepartment ? (
                          <Users className="h-3 w-3" />
                        ) : isUserEmail ? (
                          <User className="h-3 w-3" />
                        ) : isPrefixMatch ? (
                          <Zap className="h-3 w-3 text-primary" />
                        ) : (
                          <Search className="h-3 w-3" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <span className="truncate group-hover:text-foreground transition-colors">
                          {/* Highlight matching parts */}
                          {searchTerm && suggestion.toLowerCase().includes(searchTerm.toLowerCase()) ? (
                            <>
                              {suggestion.split(new RegExp(`(${searchTerm})`, 'gi')).map((part, i) => 
                                part.toLowerCase() === searchTerm.toLowerCase() ? (
                                  <mark key={i} className="bg-primary/20 text-primary px-0.5 rounded">{part}</mark>
                                ) : (
                                  <span key={i}>{part}</span>
                                )
                              )}
                            </>
                          ) : (
                            suggestion
                          )}
                        </span>
                        
                        {/* Suggestion type indicator */}
                        {(isTicketNumber || isDepartment || isUserEmail) && (
                          <div className="text-[8px] text-muted-foreground mt-0.5">
                            {isTicketNumber && 'Ticket'}
                            {isDepartment && 'Department'}
                            {isUserEmail && 'User Email'}
                          </div>
                        )}
                      </div>
                      
                      {isPrefixMatch && (
                        <Badge variant="secondary" className="text-[7px] px-1 py-0 h-4">
                          autocomplete
                        </Badge>
                      )}
                    </button>
                  )
                })}
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
                      "flex items-start gap-3 w-full p-3 text-left hover:bg-muted rounded-sm transition-colors border-l-2 border-transparent hover:border-primary/20",
                      selectedIndex === (suggestions.length + index) && "bg-muted border-primary/40"
                    )}
                  >
                    <div className="text-muted-foreground mt-1">
                      {getResultIcon(result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[12px] font-semibold truncate text-foreground">{result.title}</span>
                        <Badge variant="secondary" className={cn("text-[9px] px-2 py-0.5 font-medium", getResultTypeColor(result.type))}>
                          {result.type}
                        </Badge>
                      </div>
                      
                      {/* Enhanced description with context */}
                      <p className="text-[10px] text-muted-foreground line-clamp-2 mb-2">
                        {result.description}
                      </p>
                      
                      {/* Rich metadata display */}
                      {result.metadata && (
                        <div className="flex items-center gap-3 mt-2 text-[9px] text-muted-foreground">
                          {/* Status badge */}
                          {result.metadata.status && (
                            <Badge variant="outline" className="text-[8px] px-1.5 py-0.5 h-5 font-medium">
                              {result.metadata.status}
                            </Badge>
                          )}
                          
                          {/* Priority for tickets */}
                          {result.metadata.priority && (
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "text-[8px] px-1.5 py-0.5 h-5 font-medium",
                                result.metadata.priority === 'high' && 'border-red-200 text-red-600',
                                result.metadata.priority === 'medium' && 'border-yellow-200 text-yellow-600',
                                result.metadata.priority === 'low' && 'border-green-200 text-green-600'
                              )}
                            >
                              {result.metadata.priority}
                            </Badge>
                          )}
                          
                          {/* Department */}
                          {result.metadata.department && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {result.metadata.department}
                            </span>
                          )}
                          
                          {/* Email for users */}
                          {result.metadata.email && (
                            <span className="truncate max-w-[120px]" title={result.metadata.email}>
                              {result.metadata.email}
                            </span>
                          )}
                          
                          {/* Ticket number */}
                          {result.metadata.ticket_number && (
                            <span className="font-mono text-[8px] bg-muted px-1.5 py-0.5 rounded">
                              {result.metadata.ticket_number}
                            </span>
                          )}
                          
                          {/* Creation date */}
                          {result.metadata.created_at && (
                            <span className="flex items-center gap-1 ml-auto">
                              <Clock className="h-3 w-3" />
                              {new Date(result.metadata.created_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-50" />
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

          {/* Default state - no search term - Show recent searches */}
          {!searchTerm && (
            <div className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-3 w-3 text-primary" />
                <span className="text-[11px] font-medium text-foreground">Enterprise Search</span>
              </div>
              <p className="text-[9px] text-muted-foreground mb-3">
                Search across tickets, users, and more with AI-powered suggestions
              </p>
              
              {/* Recent Searches - Show more when no query */}
              {recentSearches.length > 0 && (
                <div className="space-y-1 mb-3">
                  <div className="text-[9px] font-medium text-muted-foreground mb-1">Your recent searches:</div>
                  {recentSearches.slice(0, 5).map((search, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(search)}
                      className="flex items-center gap-2 w-full p-2 text-left hover:bg-muted rounded-sm transition-colors"
                    >
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[10px] text-foreground truncate">{search}</span>
                    </button>
                  ))}
                </div>
              )}
              
              <div className="space-y-1">
                <div className="text-[9px] font-medium text-muted-foreground mb-1">Quick searches:</div>
                {['dev-', 'fix ', 'deploy', 'admin', 'password reset', 'laptop'].map((example, index) => (
                  <button
                    key={index}
                    onClick={() => setSearchTerm(example)}
                    className="flex items-center gap-2 w-full p-2 text-left hover:bg-muted rounded-sm transition-colors"
                  >
                    <Search className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] text-foreground">{example}</span>
                    <span className="text-[8px] text-muted-foreground ml-auto">Try typing</span>
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
