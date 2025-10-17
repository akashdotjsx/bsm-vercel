"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, TrendingUp, Clock, Filter, X, Sparkles, Eye, HelpCircle, Copy, Check, Ticket, User, Settings as SettingsIcon, HardDrive } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useSearch } from "@/lib/contexts/search-context"
import { SearchFilters } from "@/components/search/search-filters"
import { cn } from "@/lib/utils"

export default function SearchPage({ initialQuery }: { initialQuery?: string } = {}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { searchTerm, setSearchTerm, results, isSearching, recentSearches, performSearch, addToRecent } = useSearch()

  const [filters, setFilters] = useState({})
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState("relevance")
  const [hasSearched, setHasSearched] = useState(false)
  const [activeType, setActiveType] = useState<'all' | 'ticket' | 'user' | 'service' | 'asset'>('all')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [spellingSuggestion, setSpellingSuggestion] = useState<string | null>(null)
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([])
  const [copiedExample, setCopiedExample] = useState<string | null>(null)

  useEffect(() => {
    // Auto-search if there's a search term from URL params or initialQuery prop
    const query = initialQuery || searchParams?.get("q")
    if (query && query !== searchTerm) {
      setSearchTerm(query)
      handleSearch(query)
    }
  }, [searchParams, initialQuery])

  // Only fetch suggestions as user types (no auto-search)
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchTerm.length > 2) {
        try {
          // Only fetch suggestions, don't perform search
          const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(searchTerm)}&limit=5`)
          if (response.ok) {
            const data = await response.json()
            setSuggestions(data.suggestions || [])
            
            // Check for spelling suggestions
            if (data.suggestions.length === 0 && searchTerm.length > 3) {
              const commonTerms = ['ticket', 'user', 'service', 'asset', 'laptop', 'access', 'password', 'reset']
              const similar = commonTerms.find(term => {
                const distance = levenshteinDistance(searchTerm.toLowerCase(), term.toLowerCase())
                return distance > 0 && distance <= 2
              })
              setSpellingSuggestion(similar || null)
            } else {
              setSpellingSuggestion(null)
            }
          }
        } catch (error) {
          console.error('Error fetching suggestions:', error)
        }
      } else {
        setSuggestions([])
        setSpellingSuggestion(null)
      }
    }

    const timeout = setTimeout(fetchSuggestions, 300)
    return () => clearTimeout(timeout)
  }, [searchTerm])

  // Load recently viewed items
  useEffect(() => {
    const loadRecentlyViewed = () => {
      try {
        const stored = localStorage.getItem('recently_viewed')
        if (stored) {
          const items = JSON.parse(stored)
          setRecentlyViewed(items.slice(0, 5))
        }
      } catch (error) {
        console.error('Error loading recently viewed:', error)
      }
    }
    loadRecentlyViewed()
  }, [])

  // Simple Levenshtein distance for spell check
  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix: number[][] = []
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }
    return matrix[str2.length][str1.length]
  }

  const parseSearchQuery = (query: string) => {
    // Parse advanced search syntax: field:value
    const filters: any = {}
    const keywords: string[] = []
    
    // Match patterns like status:open, priority:high, type:ticket, tag:urgent
    const filterRegex = /(\w+):(\w+)/g
    let match
    let cleanQuery = query
    
    while ((match = filterRegex.exec(query)) !== null) {
      const [fullMatch, field, value] = match
      filters[field] = value
      // Remove the filter from the query
      cleanQuery = cleanQuery.replace(fullMatch, '').trim()
    }
    
    // Remaining text is the keyword search
    if (cleanQuery) {
      keywords.push(cleanQuery)
    }
    
    return { filters, keywords: keywords.join(' ') }
  }

  const copyExample = (example: string) => {
    navigator.clipboard.writeText(example)
    setCopiedExample(example)
    setTimeout(() => setCopiedExample(null), 2000)
  }

  const handleSearch = async (term?: string) => {
    const searchQuery = term !== undefined ? term : searchTerm
    // Allow search with empty query if a type filter is active
    if (searchQuery.trim() || activeType !== 'all') {
      setHasSearched(true)
      setSuggestions([]) // Clear suggestions when searching
      
      // Parse the query for advanced syntax
      const { filters, keywords } = parseSearchQuery(searchQuery)
      
      // Add active type filter to search
      if (activeType !== 'all') {
        filters.type = activeType
      }
      
      // Build search term with keywords only (filters handled separately)
      // If empty query, pass empty string to get ALL items of that type
      const finalSearchTerm = keywords || searchQuery || ''
      
      // Perform search with parsed query and type filter
      await performSearch(finalSearchTerm, activeType !== 'all' ? activeType : undefined)
      if (searchQuery) addToRecent(searchQuery)
      
      // Update filters state to show active filters
      setFilters(filters)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setSearchTerm(suggestion)
    handleSearch(suggestion)
  }

  const getTypeIcon = (type: string) => {
    const icons = {
      ticket: "🎫",
      user: "👤",
      knowledge: "📚",
      service: "⚙️",
      asset: "💻",
      workflow: "🔄",
      account: "🏢",
    }
    return icons[type as keyof typeof icons] || "📄"
  }

  const getTypeColor = (type: string) => {
    const colors = {
      ticket: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      user: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      knowledge: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      service: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      asset: "bg-muted text-foreground dark:bg-gray-900 dark:text-gray-200",
      workflow: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      account: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
    }
    return colors[type as keyof typeof colors] || "bg-muted text-foreground"
  }

  const trendingSearches = [
    "laptop request",
    "VPN access",
    "password reset",
    "employee onboarding",
    "expense reimbursement",
  ]

  return (
    <div className="h-full flex flex-col">
      {/* Header with Search */}
      <div className="border-b border-border bg-background px-6 py-4">
        <div className="max-w-6xl mx-auto space-y-4">
          <div>
            <h1 className="text-lg font-semibold">Search</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Search across tickets, users, knowledge base, services, and more
            </p>
          </div>

          {/* Search Input */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search across your entire workspace..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch(searchTerm)
                    }
                  }}
                  className="pl-10 h-10 text-xs"
                />
              </div>
              <Button
                onClick={() => handleSearch(searchTerm)}
                size="icon"
                className="h-10 w-10"
                disabled={isSearching}
                title="Search"
              >
                {isSearching ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4" />
              </Button>
              <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10"
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-3">
                  <div>
                    <h4 className="text-xs font-semibold mb-2 flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-primary" />
                      Search Syntax
                    </h4>
                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      <div className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <div>
                          <code className="bg-muted px-1 rounded text-[10px]">tickets</code> or <code className="bg-muted px-1 rounded text-[10px]">services</code> - Show all of type
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <div>
                          <code className="bg-muted px-1 rounded text-[10px]">status:open</code> - Filter by status
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <div>
                          <code className="bg-muted px-1 rounded text-[10px]">priority:high</code> - Filter by priority
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <div>
                          <code className="bg-muted px-1 rounded text-[10px]">tag:urgent</code> - Filter by tag
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        <div>
                          <code className="bg-muted px-1 rounded text-[10px]">assignee:john</code> - Filter by assignee
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="bg-muted/50 rounded p-2 text-[10px]">
                      <div className="flex items-start gap-1.5">
                        <span className="text-xs">💡</span>
                        <div>
                          <strong className="text-foreground text-xs">Combine filters:</strong>
                          <br />
                          <code className="bg-muted px-1.5 py-0.5 rounded mt-1 inline-block text-foreground font-mono">
                            status:open priority:high laptop
                          </code>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            </div>

            {/* Type Filter Tabs */}
            <div className="flex items-center gap-2">
              <Button
                variant={activeType === 'all' ? 'default' : 'ghost'}
                size="sm"
                className="h-8 text-xs"
                onClick={() => {
                  setActiveType('all')
                  const newFilters = { ...filters }
                  delete newFilters.type
                  setFilters(newFilters)
                  // Auto-search when clicking filter
                  handleSearch(searchTerm || '')
                }}
              >
                All
              </Button>
              <Button
                variant={activeType === 'ticket' ? 'default' : 'ghost'}
                size="sm"
                className="h-8 text-xs"
                onClick={() => {
                  setActiveType('ticket')
                  // Auto-search when clicking filter
                  handleSearch(searchTerm || '')
                }}
              >
                <Ticket className="h-3 w-3 mr-1" />
                Tickets
              </Button>
              <Button
                variant={activeType === 'user' ? 'default' : 'ghost'}
                size="sm"
                className="h-8 text-xs"
                onClick={() => {
                  setActiveType('user')
                  // Auto-search when clicking filter
                  handleSearch(searchTerm || '')
                }}
              >
                <User className="h-3 w-3 mr-1" />
                Users
              </Button>
              <Button
                variant={activeType === 'service' ? 'default' : 'ghost'}
                size="sm"
                className="h-8 text-xs"
                onClick={() => {
                  setActiveType('service')
                  // Auto-search when clicking filter
                  handleSearch(searchTerm || '')
                }}
              >
                <SettingsIcon className="h-3 w-3 mr-1" />
                Services
              </Button>
              <Button
                variant={activeType === 'asset' ? 'default' : 'ghost'}
                size="sm"
                className="h-8 text-xs"
                onClick={() => {
                  setActiveType('asset')
                  // Auto-search when clicking filter
                  handleSearch(searchTerm || '')
                }}
              >
                <HardDrive className="h-3 w-3 mr-1" />
                Assets
              </Button>
            </div>
          </div>


          {/* Suggestions - Show while typing, before results load */}
          {suggestions.length > 0 && searchTerm.length > 2 && (
            <div className="bg-background rounded-lg border border-border p-2">
              <div className="flex items-center gap-2 mb-2 px-2">
                <Sparkles className="h-3 w-3 text-primary" />
                <span className="text-xs font-medium">Smart Suggestions</span>
              </div>
              <div className="space-y-1">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-2 py-1.5 text-xs hover:bg-muted rounded transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Filters */}
          {showFilters && (
            <div className="bg-muted/30 rounded-lg p-4 border border-border">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium">Filters</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => setShowFilters(false)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <SearchFilters onFiltersChange={setFilters} />
            </div>
          )}
        </div>
      </div>

      {/* Results Area */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-6 py-6">
          {/* Search Results or Empty State */}
          {hasSearched && searchTerm.trim() ? (
            <div className="space-y-4">
              {/* Did you mean suggestion */}
              {spellingSuggestion && !isSearching && results.length === 0 && (
                <div className="bg-muted/50 rounded-lg p-3 border border-border mb-4">
                  <p className="text-xs text-muted-foreground">
                    Did you mean:{" "}
                    <button
                      onClick={() => handleSuggestionClick(spellingSuggestion)}
                      className="text-primary hover:underline font-medium"
                    >
                      {spellingSuggestion}
                    </button>
                    ?
                  </p>
                </div>
              )}

              {/* Active Filters Display */}
              {Object.keys(filters).length > 0 && (
                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <span className="text-xs text-muted-foreground">Active filters:</span>
                  {Object.entries(filters).map(([key, value]) => (
                    <Badge key={key} variant="secondary" className="text-xs">
                      {key}: {value as string}
                      <button
                        onClick={() => {
                          const newFilters = { ...filters }
                          delete newFilters[key]
                          setFilters(newFilters)
                        }}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">
                  {isSearching ? "Searching..." : `Results for "${searchTerm}"`}
                  {!isSearching && results.length > 0 && (
                    <span className="text-muted-foreground font-normal ml-2 text-xs">
                      ({results.length} found)
                    </span>
                  )}
                </h2>
              </div>

              {isSearching && (
                <div className="grid gap-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Skeleton className="h-6 w-6 rounded" />
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <Skeleton className="h-4 w-48" />
                              <Skeleton className="h-4 w-16" />
                            </div>
                            <Skeleton className="h-3 w-full" />
                            <Skeleton className="h-3 w-3/4" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {!isSearching && results.length === 0 && searchTerm && (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Search className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-sm font-medium mb-2">No results found</h3>
                    <p className="text-muted-foreground text-center text-xs max-w-md">
                      We couldn't find anything matching "{searchTerm}". Try different keywords or
                      use filters to narrow your search.
                    </p>
                  </CardContent>
                </Card>
              )}

              {!isSearching && results.length > 0 && (
                <>
                  <div className="grid gap-3">
                    {results.map((result) => (
                    <Card 
                      key={result.id} 
                      className="hover:shadow-md transition-shadow cursor-pointer hover:border-primary/30"
                      onClick={() => router.push(result.url)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="text-lg mt-0.5">{getTypeIcon(result.type)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-xs truncate">{result.title}</h3>
                              <Badge variant="secondary" className={cn("text-[10px] px-2 py-0.5", getTypeColor(result.type))}>
                                {result.type}
                              </Badge>
                              <div className="text-[10px] text-muted-foreground ml-auto">
                                {Math.round(result.relevance * 100)}% match
                              </div>
                            </div>
                            <p className="text-muted-foreground text-xs mb-2 line-clamp-2">{result.description}</p>
                            <div className="flex items-center gap-3 text-[10px] text-muted-foreground flex-wrap">
                              {result.category && <span>in {result.category}</span>}
                              {result.metadata && (
                                <>
                                  {result.metadata.ticket_number && (
                                    <Badge variant="outline" className="text-[10px] h-5">
                                      {result.metadata.ticket_number}
                                    </Badge>
                                  )}
                                  {result.metadata.status && (
                                    <Badge variant="outline" className="text-[10px] h-5">
                                      {result.metadata.status}
                                    </Badge>
                                  )}
                                  {result.metadata.priority && (
                                    <Badge variant="outline" className="text-[10px] h-5">
                                      {result.metadata.priority}
                                    </Badge>
                                  )}
                                  {result.metadata.assignee && <span>Assigned to {result.metadata.assignee}</span>}
                                  {result.metadata.department && <span>{result.metadata.department}</span>}
                                  {result.metadata.email && result.type === 'user' && (
                                    <span className="truncate">{result.metadata.email}</span>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    ))}
                  </div>

                  {/* Recently Viewed Section */}
                  {recentlyViewed.length > 0 && (
                    <div className="mt-8">
                      <div className="flex items-center gap-2 mb-3">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-xs font-semibold">Recently Viewed</h3>
                      </div>
                      <div className="grid gap-2">
                        {recentlyViewed.map((item, index) => (
                          <Card
                            key={index}
                            className="hover:shadow-sm transition-shadow cursor-pointer hover:border-primary/20"
                            onClick={() => router.push(item.url)}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-center gap-2">
                                <div className="text-base">{getTypeIcon(item.type)}</div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-xs truncate">{item.title}</h4>
                                  <p className="text-[10px] text-muted-foreground truncate">{item.description}</p>
                                </div>
                                <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0.5", getTypeColor(item.type))}>
                                  {item.type}
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
              </>
              )}
            </div>
          ) : null}

          {/* Empty State - Show Recent & Trending */}
          {(!hasSearched || !searchTerm.trim()) && (
            <div className="grid gap-4 md:grid-cols-2">
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="h-4 w-4" />
                      <h3 className="text-xs font-semibold">Recent Searches</h3>
                    </div>
                    <div className="space-y-1">
                      {recentSearches.slice(0, 5).map((search, index) => (
                        <Button
                          key={index}
                          variant="ghost"
                          className="w-full justify-start text-xs h-8"
                          onClick={() => handleSearch(search)}
                        >
                          <Clock className="h-3 w-3 mr-2 text-muted-foreground" />
                          {search}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Trending Searches */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="h-4 w-4" />
                    <h3 className="text-xs font-semibold">Trending Searches</h3>
                  </div>
                  <div className="space-y-1">
                    {trendingSearches.map((search, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        className="w-full justify-start text-xs h-8"
                        onClick={() => handleSearch(search)}
                      >
                        <TrendingUp className="h-3 w-3 mr-2 text-muted-foreground" />
                        {search}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
