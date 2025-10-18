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
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { useRouter, useSearchParams, usePathname } from "next/navigation"

// Fuzzy matching utility functions
function calculateLevenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      )
    }
  }

  return matrix[str2.length][str1.length]
}

function fuzzyMatch(query: string, text: string): { score: number; isMatch: boolean } {
  const queryLower = query.toLowerCase()
  const textLower = text.toLowerCase()
  
  // Exact match
  if (textLower.includes(queryLower)) {
    return { score: 1.0, isMatch: true }
  }
  
  // Fuzzy match using Levenshtein distance
  const distance = calculateLevenshteinDistance(queryLower, textLower)
  const maxLength = Math.max(queryLower.length, textLower.length)
  const similarity = 1 - (distance / maxLength)
  
  // Also check if query words exist in text (substring match)
  const queryWords = queryLower.split(/\s+/)
  const textWords = textLower.split(/\s+/)
  const wordMatches = queryWords.filter(qWord => 
    textWords.some(tWord => tWord.includes(qWord) || qWord.includes(tWord))
  ).length
  const wordScore = wordMatches / queryWords.length
  
  const finalScore = Math.max(similarity, wordScore * 0.8)
  
  return { score: finalScore, isMatch: finalScore > 0.6 }
}

function generateSpellingSuggestion(query: string, suggestion: string): string | null {
  const queryLower = query.toLowerCase()
  const suggestionLower = suggestion.toLowerCase()
  
  if (queryLower === suggestionLower) return null
  
  const distance = calculateLevenshteinDistance(queryLower, suggestionLower)
  if (distance > 3 || distance === 0) return null // Too different or identical
  
  // Generate a "did you mean" style suggestion
  const queryChars = queryLower.split('')
  const suggestionChars = suggestionLower.split('')
  
  let result = ''
  let i = 0, j = 0
  
  while (i < queryChars.length || j < suggestionChars.length) {
    if (i < queryChars.length && j < suggestionChars.length && queryChars[i] === suggestionChars[j]) {
      result += suggestionChars[j]
      i++
      j++
    } else if (j < suggestionChars.length && (i >= queryChars.length || suggestionChars[j] < queryChars[i])) {
      result += suggestionChars[j] // Missing letter
      j++
    } else if (i < queryChars.length) {
      // Extra letter in query - we'll skip it
      i++
    }
  }
  
  return result !== suggestionLower ? null : suggestion
}

function generateCorrectionPreview(original: string, corrected: string): boolean {
  const distance = calculateLevenshteinDistance(original.toLowerCase(), corrected.toLowerCase())
  return distance > 0 && distance <= 3
}

interface GlobalSearchProps {
  className?: string
}

interface SearchResult {
  id: string
  title: string
  description: string
  type: 'ticket' | 'user' | 'service' | 'asset'
  category?: string
  url: string
  relevance: number
  metadata?: any
}

interface SearchResponse {
  tickets?: SearchResult[]
  users?: SearchResult[]
  services?: SearchResult[]
  assets?: SearchResult[]
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
  const [spellingSuggestions, setSpellingSuggestions] = useState<string[]>([])
  const [previewResults, setPreviewResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [searchType, setSearchType] = useState<'all' | 'tickets' | 'users' | 'services' | 'assets'>('all')
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const urlUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const [debouncedSearchTerm] = useDebounce(searchTerm, 400)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

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

  // Fetch preview results for recent searches
  const fetchPreviewResults = useCallback(async (queries: string[]) => {
    if (queries.length === 0) return
    
    try {
      const allResults: SearchResult[] = []
      
      // Take first 3 recent searches and get preview results
      for (const query of queries.slice(0, 3)) {
        const responses = await Promise.allSettled([
          fetch(`/api/search/tickets?q=${encodeURIComponent(query)}&limit=2`).then(r => r.json()),
          fetch(`/api/search/users?q=${encodeURIComponent(query)}&limit=1`).then(r => r.json()),
          fetch(`/api/search/services?q=${encodeURIComponent(query)}&limit=1`).then(r => r.json()),
        ])
        
        const [ticketsResponse, usersResponse, servicesResponse] = responses
        
        if (ticketsResponse.status === 'fulfilled' && ticketsResponse.value?.tickets) {
          allResults.push(...ticketsResponse.value.tickets.slice(0, 1))
        }
        if (usersResponse.status === 'fulfilled' && usersResponse.value?.users) {
          allResults.push(...usersResponse.value.users)
        }
        if (servicesResponse.status === 'fulfilled' && servicesResponse.value?.services) {
          allResults.push(...servicesResponse.value.services)
        }
      }
      
      setPreviewResults(allResults.slice(0, 6))
    } catch (error) {
      console.error('Error fetching preview results:', error)
    }
  }, [])

  // Fetch suggestions function with enhanced real-time data
  const fetchSuggestions = useCallback(async (query: string) => {
    try {
      setIsFetchingSuggestions(true)
      const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}&limit=10`)
      if (response.ok) {
        const data = await response.json()
        const suggestions = data.suggestions || []
        setSuggestions(suggestions)
        const recentSearches = data.recent_searches || []
        setRecentSearches(recentSearches)
        
        // Fetch preview results for empty state
        if (!query && recentSearches.length > 0) {
          fetchPreviewResults(recentSearches)
        }
        
        // Generate spell corrections if query has typos
        if (query.length > 2 && suggestions.length === 0) {
          const allPossibleSuggestions = [
            'hello', 'deploy', 'development', 'admin', 'administrator', 'password', 'reset', 'laptop', 'request', 'service',
            'ticket', 'user', 'asset', 'printer', 'network', 'access', 'login', 'software', 'hardware', 'fix', 'issue'
          ]
          
          const spellChecks = allPossibleSuggestions
            .filter(word => {
              const match = fuzzyMatch(query, word)
              return match.isMatch && match.score > 0.7
            })
            .slice(0, 3)
            
          setSpellingSuggestions(spellChecks)
        } else {
          setSpellingSuggestions([])
        }
        
        // Log real data stats for debugging
        if (data.has_real_data) {
          console.log('🔍 Real-time data:', {
            tickets: data.has_real_data.tickets,
            users: data.has_real_data.users,
            services: data.has_real_data.services,
            history: data.has_real_data.history,
            suggestions: suggestions.length
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
    if (query.length < 1) {
      setResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    try {
      const responses = await Promise.allSettled([
        searchType === 'all' || searchType === 'tickets' 
          ? fetch(`/api/search/tickets?q=${encodeURIComponent(query)}&limit=3`).then(r => r.json())
          : Promise.resolve(null),
        searchType === 'all' || searchType === 'users'
          ? fetch(`/api/search/users?q=${encodeURIComponent(query)}&limit=3`).then(r => r.json())
          : Promise.resolve(null),
        searchType === 'all' || searchType === 'services'
          ? fetch(`/api/search/services?q=${encodeURIComponent(query)}&limit=3`).then(r => r.json())
          : Promise.resolve(null),
        searchType === 'all' || searchType === 'assets'
          ? fetch(`/api/search/assets?q=${encodeURIComponent(query)}&limit=3`).then(r => r.json())
          : Promise.resolve(null)
      ])

      const [ticketsResponse, usersResponse, servicesResponse, assetsResponse] = responses
      const allResults: SearchResult[] = []

      if (ticketsResponse.status === 'fulfilled' && ticketsResponse.value?.tickets) {
        allResults.push(...ticketsResponse.value.tickets)
      }

      if (usersResponse.status === 'fulfilled' && usersResponse.value?.users) {
        allResults.push(...usersResponse.value.users)
      }
      
      if (servicesResponse.status === 'fulfilled' && servicesResponse.value?.services) {
        allResults.push(...servicesResponse.value.services)
      }
      
      if (assetsResponse.status === 'fulfilled' && assetsResponse.value?.assets) {
        allResults.push(...assetsResponse.value.assets)
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
            // Selected a suggestion - navigate with search ID
            const suggestion = suggestions[selectedIndex]
            setSearchTerm(suggestion)
            setIsOpen(false)
            trackSearch(suggestion, 0)
            if (pathname !== '/search' && !pathname.startsWith('/search')) {
              fetch('/api/search/id', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: suggestion })
              })
                .then(r => r.json())
                .then(({ id }) => router.push(`/search/${id}`))
                .catch(() => router.push(`/search?q=${encodeURIComponent(suggestion)}`))
            }
          } else {
            // Selected a result - navigate to result page
            const result = results[selectedIndex - suggestions.length]
            setIsOpen(false)
            trackSearch(searchTerm, 1, result.id, result.type)
            router.push(result.url)
          }
        } else if (searchTerm && searchTerm.trim().length >= 1) {
          // Go to search results page with search ID (non-blocking)
          if (pathname !== '/search' && !pathname.startsWith('/search')) {
            // Create search ID in background and navigate
            fetch('/api/search/id', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ query: searchTerm.trim() })
            })
              .then(r => r.json())
              .then(({ id }) => router.push(`/search/${id}`))
              .catch(() => router.push(`/search?q=${encodeURIComponent(searchTerm)}`))
          }
          setIsOpen(false)
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSelectedIndex(-1)
        break
    }
  }, [isOpen, selectedIndex, suggestions, results, searchTerm, pathname, router])

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
      // Cleanup timeouts
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      if (urlUpdateTimeoutRef.current) {
        clearTimeout(urlUpdateTimeoutRef.current)
      }
    }
  }, [handleKeyDown])

  // Debounce search input for results
  useEffect(() => {
    if (debouncedSearchTerm && debouncedSearchTerm.length >= 1) {
      performSearch(debouncedSearchTerm)
    } else {
      setResults([])
      setIsSearching(false)
    }
  }, [debouncedSearchTerm, performSearch])

  // Fetch suggestions when search term changes (debounced)
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (searchTerm && searchTerm.length >= 1) {
        fetchSuggestions(searchTerm)
      } else if (!searchTerm) {
        setSuggestions([])
        setSpellingSuggestions([])
      }
    }, 300) // Increased debounce to reduce flashing

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
  
  // Initialize search term from URL on mount
  useEffect(() => {
    const queryFromUrl = searchParams.get('q')
    // Only set initial value, don't override while typing
    if (queryFromUrl && !searchTerm) {
      setSearchTerm(queryFromUrl)
    }
  }, []) // Only on mount

  const handleSuggestionClick = async (suggestion: string) => {
    setSearchTerm(suggestion)
    setIsOpen(false)
    // Track suggestion click
    await trackSearch(suggestion, 0)
    // Navigate to /search page with search ID
    if (pathname !== '/search' && !pathname.startsWith('/search')) {
      try {
        const response = await fetch('/api/search/id', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: suggestion })
        })
        if (response.ok) {
          const { id } = await response.json()
          router.push(`/search/${id}`)
        } else {
          router.push(`/search?q=${encodeURIComponent(suggestion)}`)
        }
      } catch (error) {
        router.push(`/search?q=${encodeURIComponent(suggestion)}`)
      }
    }
  }

  const handleResultClick = async (result: SearchResult) => {
    setIsOpen(false)
    // Track result click
    await trackSearch(searchTerm, 1, result.id, result.type)
    // Navigate directly to result (not through search ID system)
    router.push(result.url)
  }

  const handleSearchTypeChange = (type: 'all' | 'tickets' | 'users' | 'services' | 'assets') => {
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
      case 'service':
        return <Settings className="h-4 w-4" />
      case 'asset':
        return <HardDrive className="h-4 w-4" />
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
      case 'service':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'asset':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      default:
        return 'bg-muted text-foreground dark:bg-gray-900 dark:text-gray-200'
    }
  }


  return (
    <div className={cn("relative flex-1 max-w-lg mx-auto", className)} ref={dropdownRef}>
      {/* Search Input in Header */}
      <div className="relative">
        <Search 
          className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer hover:text-primary transition-colors pointer-events-none" 
        />
        <Input
          ref={inputRef}
          placeholder="Search items..."
          className="pl-10 pr-16 h-9 text-xs bg-background border-border rounded-md hover:bg-muted transition-colors focus:ring-1 focus:ring-primary/20"
          value={searchTerm}
          onChange={(e) => {
            const value = e.target.value
            setSearchTerm(value)
          }}
          onFocus={() => {
            setIsOpen(true)
            // Load recent searches when focused with no query
            if (!searchTerm) {
              fetchSuggestions('')
            }
          }}
          onClick={(e) => {
            // Keep dropdown open when clicking inside search box
            e.stopPropagation()
            setIsOpen(true)
          }}
          onKeyDown={async (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              // Navigate to search page on Enter with search ID
              if (pathname !== '/search' && !pathname.startsWith('/search')) {
                if (searchTerm && searchTerm.trim().length >= 1) {
                  // Create search ID and navigate
                  try {
                    const response = await fetch('/api/search/id', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ query: searchTerm.trim() })
                    })
                    if (response.ok) {
                      const { id } = await response.json()
                      router.push(`/search/${id}`)
                    } else {
                      // Fallback to query parameter
                      router.push(`/search?q=${encodeURIComponent(searchTerm)}`)
                    }
                  } catch (error) {
                    // Fallback to query parameter
                    router.push(`/search?q=${encodeURIComponent(searchTerm)}`)
                  }
                } else if (searchTerm.trim().length < 1) {
                  // Empty search - do nothing
                  return
                } else {
                  router.push('/search')
                }
                setIsOpen(false)
              } else if (!searchTerm) {
                // On search page with empty query, just close dropdown
                setIsOpen(false)
              }
            }
          }}
        />
        <div className="absolute right-2.5 top-1/2 transform -translate-y-1/2 flex items-center">
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>
      </div>

      {/* Google-like Search Dropdown */}
      {isOpen && (
        <div 
          className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-50 max-h-96 overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
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
                <Button
                  variant={searchType === 'services' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-6 text-[10px] px-2"
                  onClick={() => handleSearchTypeChange('services')}
                >
                  <Settings className="h-3 w-3 mr-1" />
                  Services
                </Button>
                <Button
                  variant={searchType === 'assets' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-6 text-[10px] px-2"
                  onClick={() => handleSearchTypeChange('assets')}
                >
                  <HardDrive className="h-3 w-3 mr-1" />
                  Assets
                </Button>
              </div>
            </div>
          )}

          {/* No loading indicators - just show results instantly */}

          {/* Enhanced Suggestions with categorization */}
          {!isSearching && suggestions.length > 0 && (
            <div className="border-b border-border">
              <div className="p-2">
                <div className="flex items-center gap-2 mb-2 px-2">
                  <Sparkles className="h-3 w-3 text-primary" />
                  <span className="text-xs font-medium text-foreground">Smart Suggestions</span>
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
                        "flex items-center gap-3 w-full p-2 text-left hover:bg-muted rounded-sm transition-colors text-xs group",
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
                <div className="text-xs font-medium text-muted-foreground mb-1 px-2">Results</div>
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
                        <span className="text-xs font-semibold truncate text-foreground">{result.title}</span>
                        <Badge variant="secondary" className={cn("text-[9px] px-2 py-0.5 font-medium", getResultTypeColor(result.type))}>
                          {result.type}
                        </Badge>
                      </div>
                      
                      {/* Enhanced description with context */}
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {result.description}
                      </p>
                      
                      {/* Rich metadata display */}
                      {result.metadata && (
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
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
                {searchTerm && searchTerm.length >= 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start h-8 text-xs mt-1"
                    onClick={async () => {
                      // Navigate to /search page with search ID
                      if (pathname !== '/search' && !pathname.startsWith('/search')) {
                        try {
                          const response = await fetch('/api/search/id', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ query: searchTerm.trim() })
                          })
                          if (response.ok) {
                            const { id } = await response.json()
                            router.push(`/search/${id}`)
                          } else {
                            router.push(`/search?q=${encodeURIComponent(searchTerm)}`)
                          }
                        } catch (error) {
                          router.push(`/search?q=${encodeURIComponent(searchTerm)}`)
                        }
                      }
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

          {/* Spell correction suggestions */}
          {!isSearching && searchTerm && spellingSuggestions.length > 0 && suggestions.length === 0 && (
            <div className="p-3 border-b border-border">
              <div className="text-xs text-muted-foreground mb-2">Did you mean:</div>
              <div className="space-y-1">
                {spellingSuggestions.map((suggestion, index) => {
                  const correctionPreview = generateCorrectionPreview(searchTerm, suggestion)
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        setSearchTerm(suggestion)
                        handleSuggestionClick(suggestion)
                      }}
                      className="flex items-center gap-2 w-full p-2 text-left hover:bg-muted rounded-sm transition-colors group"
                    >
                      <div className="text-muted-foreground group-hover:text-orange-500">
                        <Zap className="h-3 w-3" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {correctionPreview && (
                            <span className="text-xs text-muted-foreground line-through opacity-60">
                              {searchTerm}
                            </span>
                          )}
                          <span className="text-xs text-foreground font-medium">
                            {suggestion}
                          </span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[7px] px-1 py-0 h-4">
                        spell check
                      </Badge>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* No results */}
          {!isSearching && searchTerm && results.length === 0 && suggestions.length === 0 && spellingSuggestions.length === 0 && (
            <div className="p-4 text-center">
              <Search className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground">No results found for "{searchTerm}"</p>
              <p className="text-xs text-muted-foreground mt-1 opacity-60">Try a different search term</p>
            </div>
          )}

          {/* Enhanced empty state with smart suggestions and preview cards */}
          {!searchTerm && (
            <div className="">
              {/* Top 3 recent searches */}
              {recentSearches.length > 0 && (
                <div className="p-3 border-b border-border">
                  <div className="text-xs font-medium text-muted-foreground mb-2 px-1">Recent searches:</div>
                  <div className="space-y-1">
                    {recentSearches
                      .filter(search => {
                        const isFieldName = ['status', 'priority', 'type', 'department', 'category'].includes(search.toLowerCase())
                        const isTooShort = search.length < 3
                        const isSystemQuery = search.startsWith('TK-') && search.length < 8
                        return !isFieldName && !isTooShort && !isSystemQuery
                      })
                      .slice(0, 3)
                      .map((search, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(search)}
                          className="flex items-center gap-2 w-full px-2 py-2 text-left hover:bg-muted rounded-sm transition-colors group"
                        >
                          <Clock className="h-3 w-3 text-muted-foreground group-hover:text-primary" />
                          <span className="text-xs text-foreground font-medium group-hover:text-primary truncate">{search}</span>
                        </button>
                      ))
                    }
                  </div>
                </div>
              )}
              
              {/* Preview cards from recent searches */}
              {previewResults.length > 0 && (
                <div className="p-2">
                  <div className="text-xs font-medium text-muted-foreground mb-2 px-1">Recent results:</div>
                  <div className="space-y-1">
                    {previewResults.map((result, index) => (
                      <button
                        key={result.id}
                        onClick={() => handleResultClick(result)}
                        className="flex items-start gap-2 w-full p-2 text-left hover:bg-muted rounded-sm transition-colors group border border-transparent hover:border-primary/20"
                      >
                        <div className="text-muted-foreground mt-0.5 group-hover:text-primary">
                          {getResultIcon(result.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium truncate text-foreground group-hover:text-primary">{result.title}</span>
                            <Badge variant="secondary" className={cn("text-[7px] px-1 py-0.5 h-3", getResultTypeColor(result.type))}>
                              {result.type}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1 group-hover:text-muted-foreground/80">
                            {result.description}
                          </p>
                          {result.metadata && (
                            <div className="flex items-center gap-2 mt-1 text-[7px] text-muted-foreground">
                              {result.metadata.status && (
                                <Badge variant="outline" className="text-[6px] px-1 py-0 h-3">
                                  {result.metadata.status}
                                </Badge>
                              )}
                              {result.metadata.priority && (
                                <Badge variant="outline" className="text-[6px] px-1 py-0 h-3">
                                  {result.metadata.priority}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                        <ArrowRight className="h-3 w-3 text-muted-foreground opacity-30 group-hover:opacity-60" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Minimal hint only if completely empty */}
              {recentSearches.length === 0 && previewResults.length === 0 && (
                <div className="text-center py-8">
                  <Search className="h-6 w-6 mx-auto text-muted-foreground mb-2 opacity-30" />
                  <p className="text-xs text-muted-foreground opacity-50">Start typing to search</p>
                  <p className="text-xs text-muted-foreground opacity-30 mt-1">tickets • users • services • assets</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
