"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, TrendingUp, Clock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useSearch } from "@/lib/contexts/search-context"
import { SearchFilters } from "@/components/search/search-filters"
import { cn } from "@/lib/utils"

export default function SearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { searchTerm, setSearchTerm, results, isSearching, recentSearches, performSearch, addToRecent } = useSearch()

  const [filters, setFilters] = useState({})
  const [sortBy, setSortBy] = useState("relevance")

  useEffect(() => {
    // Auto-search if there's a search term from URL params
    const query = searchParams?.get("q")
    if (query) {
      setSearchTerm(query)
      performSearch(query)
    }
  }, [searchParams])

  const handleSearch = async (term: string) => {
    await performSearch(term)
    if (term.trim()) {
      addToRecent(term)
    }
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
      asset: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
      workflow: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      account: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
    }
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const trendingSearches = [
    "laptop request",
    "VPN access",
    "password reset",
    "employee onboarding",
    "expense reimbursement",
  ]

  return (
    <div className="container mx-auto px-6 py-8 max-w-6xl">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-[13px] font-bold tracking-tight">Search Workspace</h1>
          <p className="text-muted-foreground text-[13px] mt-1">
            Search across tickets, users, knowledge base, services, and more
          </p>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search across your entire workspace..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch(searchTerm)
              }
            }}
            className="pl-12 h-12 text-[13px] text-[11px]"
          />
          <Button
            onClick={() => handleSearch(searchTerm)}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8"
            disabled={isSearching}
          >
            {isSearching ? "Searching..." : "Search"}
          </Button>
        </div>

        {/* Filters */}
        <SearchFilters onFiltersChange={setFilters} />

        {/* Search Results */}
        {searchTerm && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[13px] font-semibold">
                {isSearching ? "Searching..." : `Results for "${searchTerm}"`}
                {!isSearching && results.length > 0 && (
                  <span className="text-muted-foreground font-normal ml-2">({results.length} found)</span>
                )}
              </h2>
            </div>

            {isSearching && (
              <div className="grid gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Skeleton className="h-8 w-8 rounded" />
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-5 w-48" />
                            <Skeleton className="h-5 w-16" />
                            <Skeleton className="h-4 w-20" />
                          </div>
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-3/4" />
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-20" />
                          </div>
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
                  <h3 className="text-[11px] font-medium mb-2">No results found</h3>
                  <p className="text-muted-foreground text-center text-[13px] max-w-md">
                    We couldn't find anything matching "{searchTerm}". Try different keywords, check your spelling, or
                    use filters to narrow your search.
                  </p>
                </CardContent>
              </Card>
            )}

            {!isSearching && results.length > 0 && (
              <div className="grid gap-4">
                {results.map((result) => (
                  <Card 
                    key={result.id} 
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => router.push(result.url)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="text-[13px] mt-1">{getTypeIcon(result.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-[13px] truncate">{result.title}</h3>
                            <Badge variant="secondary" className={cn("text-xs px-2 py-1", getTypeColor(result.type))}>
                              {result.type}
                            </Badge>
                            <div className="text-xs text-muted-foreground">
                              {Math.round(result.relevance * 100)}% match
                            </div>
                          </div>
                          <p className="text-muted-foreground text-[13px] mb-3 line-clamp-2">{result.description}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {result.category && <span>in {result.category}</span>}
                            {result.metadata && (
                              <>
                                {result.metadata.ticket_number && (
                                  <Badge variant="outline" className="text-xs">
                                    {result.metadata.ticket_number}
                                  </Badge>
                                )}
                                {result.metadata.status && (
                                  <Badge variant="outline" className="text-xs">
                                    {result.metadata.status}
                                  </Badge>
                                )}
                                {result.metadata.priority && (
                                  <Badge variant="outline" className="text-xs">
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
            )}
          </div>
        )}

        {/* Default State - No Search */}
        {!searchTerm && (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[11px]">
                    <Clock className="h-5 w-5" />
                    Recent Searches
                  </CardTitle>
                  <CardDescription className="text-[13px]">Your recent search queries</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {recentSearches.slice(0, 5).map((search, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        className="w-full justify-start text-[13px] h-8"
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
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[11px]">
                  <TrendingUp className="h-5 w-5" />
                  Trending Searches
                </CardTitle>
                <CardDescription className="text-[13px]">Popular searches in your workspace</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {trendingSearches.map((search, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      className="w-full justify-start text-[13px] h-8"
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
  )
}
