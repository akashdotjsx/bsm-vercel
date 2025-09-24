"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect } from "react"
import { useDebounce } from "@/lib/utils/performance"
import DatabaseOperations from "@/lib/database-operations"

interface SearchResult {
  id: string
  title: string
  description: string
  type: "ticket" | "user" | "knowledge" | "service" | "asset" | "workflow" | "account"
  category?: string
  url: string
  relevance: number
  metadata?: Record<string, any>
}

interface SearchContextType {
  searchTerm: string
  setSearchTerm: (term: string) => void
  results: SearchResult[]
  isSearching: boolean
  recentSearches: string[]
  suggestions: string[]
  performSearch: (term: string) => Promise<void>
  clearSearch: () => void
  addToRecent: (term: string) => void
}

const SearchContext = createContext<SearchContextType | undefined>(undefined)

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])

  const calculateRelevance = (item: SearchResult, term: string): number => {
    const termLower = term.toLowerCase()
    const titleLower = item.title.toLowerCase()
    const descriptionLower = item.description.toLowerCase()
    const categoryLower = item.category?.toLowerCase() || ""

    let score = 0

    // Exact match bonus (highest priority)
    if (titleLower === termLower) {
      score += 1.0
    } else if (titleLower.includes(termLower)) {
      score += 0.8
      // Bonus for starting with term
      if (titleLower.startsWith(termLower)) {
        score += 0.2
      }
      // Bonus for word boundary matches
      if (titleLower.includes(` ${termLower}`) || titleLower.startsWith(`${termLower} `)) {
        score += 0.1
      }
    }

    // Fuzzy matching for title
    const titleWords = titleLower.split(" ")
    const termWords = termLower.split(" ")

    termWords.forEach((termWord) => {
      titleWords.forEach((titleWord) => {
        if (titleWord.includes(termWord) && termWord.length > 2) {
          score += 0.3 * (termWord.length / titleWord.length)
        }
      })
    })

    // Description matching
    if (descriptionLower.includes(termLower)) {
      score += 0.4
    }

    // Category matching
    if (categoryLower.includes(termLower)) {
      score += 0.3
    }

    // Metadata matching
    if (item.metadata) {
      Object.values(item.metadata).forEach((value) => {
        if (String(value).toLowerCase().includes(termLower)) {
          score += 0.2
        }
      })
    }

    // Type-based relevance boost with recency and popularity factors
    const typeBoosts = {
      ticket: 0.15,
      user: 0.12,
      knowledge: 0.14,
      service: 0.11,
      asset: 0.08,
      workflow: 0.09,
      account: 0.07,
    }
    score += typeBoosts[item.type] || 0

    // Boost for recent or popular items
    if (item.metadata?.views && item.metadata.views > 100) {
      score += 0.05
    }
    if (item.metadata?.lastUpdated) {
      const daysSinceUpdate = Math.floor(
        (Date.now() - new Date(item.metadata.lastUpdated).getTime()) / (1000 * 60 * 60 * 24),
      )
      if (daysSinceUpdate < 30) {
        score += 0.05
      }
    }

    return Math.min(score, 1.0) // Cap at 1.0
  }

  const performDatabaseSearch = async (term: string): Promise<SearchResult[]> => {
    const dbOps = DatabaseOperations.getInstance()
    const searchResults: SearchResult[] = []

    try {
      // Search tickets
      const tickets = await dbOps.getTickets({
        search: term,
        limit: 20,
      })

      tickets.forEach((ticket: any) => {
        searchResults.push({
          id: `ticket-${ticket.id}`,
          title: ticket.title,
          description: ticket.description || "",
          type: "ticket",
          category: ticket.category || "General",
          url: `/bsm/tickets?id=${ticket.ticket_number}`,
          relevance: 0.9,
          metadata: {
            status: ticket.status,
            priority: ticket.priority,
            assignee: ticket.assignee ? `${ticket.assignee.first_name} ${ticket.assignee.last_name}` : "Unassigned",
            created_at: ticket.created_at,
          },
        })
      })

      // Search users
      const users = await dbOps.getUsers({
        search: term,
        limit: 10,
      })

      users.forEach((user: any) => {
        searchResults.push({
          id: `user-${user.id}`,
          title: `${user.first_name} ${user.last_name} - ${user.role?.name || "User"}`,
          description: `${user.email} - ${user.department?.name || "No Department"}`,
          type: "user",
          category: user.department?.name || "General",
          url: `/bsm/users/${user.id}`,
          relevance: 0.85,
          metadata: {
            department: user.department?.name,
            role: user.role?.name,
            status: user.status,
            email: user.email,
          },
        })
      })

      // Search assets
      const assets = await dbOps.getAssets({
        search: term,
        limit: 15,
      })

      assets.forEach((asset: any) => {
        searchResults.push({
          id: `asset-${asset.id}`,
          title: `${asset.name} - ${asset.asset_tag}`,
          description: `${asset.category} - ${asset.status}`,
          type: "asset",
          category: asset.category,
          url: `/bsm/assets/${asset.id}`,
          relevance: 0.8,
          metadata: {
            status: asset.status,
            category: asset.category,
            location: asset.location,
            assignee: asset.assigned_to ? `${asset.assigned_to.first_name} ${asset.assigned_to.last_name}` : null,
          },
        })
      })

      // Search knowledge base articles
      const articles = await dbOps.getKnowledgeArticles({
        search: term,
        limit: 10,
      })

      articles.forEach((article: any) => {
        searchResults.push({
          id: `kb-${article.id}`,
          title: article.title,
          description: article.summary || article.content?.substring(0, 150) + "...",
          type: "knowledge",
          category: article.category?.name || "General",
          url: `/bsm/knowledge-base/article/${article.id}`,
          relevance: 0.82,
          metadata: {
            views: article.view_count || 0,
            lastUpdated: article.updated_at,
            author: article.author ? `${article.author.first_name} ${article.author.last_name}` : "Unknown",
            status: article.status,
          },
        })
      })
    } catch (error) {
      console.error("[v0] Search error:", error)
    }

    return searchResults
  }

  const debouncedSearch = useDebounce(async (term: string) => {
    if (!term.trim()) {
      setResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)

    try {
      const searchResults = await performDatabaseSearch(term)

      // Calculate relevance and sort results
      const scoredResults = searchResults
        .map((item) => ({
          ...item,
          relevance: calculateRelevance(item, term),
        }))
        .filter((item) => item.relevance > 0.1) // Only show relevant results
        .sort((a, b) => {
          // Primary sort by relevance
          if (Math.abs(a.relevance - b.relevance) > 0.1) {
            return b.relevance - a.relevance
          }
          // Secondary sort by type priority
          const typePriority = { ticket: 1, user: 2, knowledge: 3, service: 4, asset: 5, workflow: 6, account: 7 }
          return (typePriority[a.type] || 8) - (typePriority[b.type] || 8)
        })
        .slice(0, 50) // Limit results

      setResults(scoredResults)
    } catch (error) {
      console.error("[v0] Search failed:", error)
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }, 300) // Slightly longer debounce for database queries

  const performSearch = useCallback(
    async (term: string) => {
      setSearchTerm(term)
      await debouncedSearch(term)
    },
    [debouncedSearch],
  )

  const clearSearch = useCallback(() => {
    setSearchTerm("")
    setResults([])
    setIsSearching(false)
  }, [])

  const addToRecent = useCallback((term: string) => {
    if (!term.trim()) return

    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item !== term)
      return [term, ...filtered].slice(0, 10) // Keep last 10 searches
    })
  }, [])

  // Generate suggestions based on search term
  useEffect(() => {
    if (searchTerm.length > 0) {
      const newSuggestions = [
        `Search for "${searchTerm}" in tickets`,
        `Search for "${searchTerm}" in knowledge base`,
        `Search for "${searchTerm}" in users`,
        `Search for "${searchTerm}" in assets`,
      ].slice(0, 8)

      setSuggestions(newSuggestions)
    } else {
      setSuggestions([])
    }
  }, [searchTerm])

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("kroolo-recent-searches")
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved))
      } catch (e) {
        console.error("Failed to load recent searches:", e)
      }
    }
  }, [])

  // Save recent searches to localStorage
  useEffect(() => {
    localStorage.setItem("kroolo-recent-searches", JSON.stringify(recentSearches))
  }, [recentSearches])

  return (
    <SearchContext.Provider
      value={{
        searchTerm,
        setSearchTerm,
        results,
        isSearching,
        recentSearches,
        suggestions,
        performSearch,
        clearSearch,
        addToRecent,
      }}
    >
      {children}
    </SearchContext.Provider>
  )
}

export function useSearch() {
  const context = useContext(SearchContext)
  if (context === undefined) {
    throw new Error("useSearch must be used within a SearchProvider")
  }
  return context
}
