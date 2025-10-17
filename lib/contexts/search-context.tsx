"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect } from "react"
import { useDebounce } from "@/lib/utils/performance"
import { createClient } from "@/lib/supabase/client"

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
  performSearch: (term: string, typeFilter?: string) => Promise<void>
  clearSearch: () => void
  addToRecent: (term: string) => void
}

const SearchContext = createContext<SearchContextType | undefined>(undefined)

// Mock search data - in real implementation, this would come from Elasticsearch or similar
const mockSearchData: SearchResult[] = [
  // Tickets
  {
    id: "ticket-1",
    title: "Laptop Request - John Doe",
    description: "Request for new MacBook Pro for development work",
    type: "ticket",
    category: "IT Services",
    url: "/tickets?id=ticket-1",
    relevance: 0.95,
    metadata: { status: "open", priority: "high", assignee: "IT Team" },
  },
  {
    id: "ticket-2",
    title: "VPN Access Issue",
    description: "Unable to connect to company VPN from home office",
    type: "ticket",
    category: "IT Services",
    url: "/tickets?id=ticket-2",
    relevance: 0.88,
    metadata: { status: "in_progress", priority: "medium", assignee: "Network Team" },
  },
  // Users
  {
    id: "user-1",
    title: "John Doe - Senior Developer",
    description: "Full-stack developer specializing in React and Node.js",
    type: "user",
    category: "Engineering",
    url: "/users/john-doe",
    relevance: 0.92,
    metadata: { department: "Engineering", role: "Senior Developer", status: "active" },
  },
  // Knowledge Base
  {
    id: "kb-1",
    title: "How to Setup VPN Connection",
    description: "Step-by-step guide for configuring VPN access on various devices",
    type: "knowledge",
    category: "IT Guides",
    url: "/knowledge-base/article/vpn-setup",
    relevance: 0.89,
    metadata: { views: 245, lastUpdated: "2024-01-15", author: "IT Team" },
  },
  // Services
  {
    id: "service-1",
    title: "Laptop Request Service",
    description: "Request new laptop or replacement hardware",
    type: "service",
    category: "IT Services",
    url: "/services/laptop-request",
    relevance: 0.87,
    metadata: { sla: "3-5 days", popularity: 5, department: "IT" },
  },
  // Assets
  {
    id: "asset-1",
    title: "MacBook Pro 16-inch - AST-001",
    description: "Apple MacBook Pro 16-inch M2 Pro assigned to John Doe",
    type: "asset",
    category: "Hardware",
    url: "/assets/AST-001",
    relevance: 0.84,
    metadata: { status: "active", assignee: "John Doe", location: "Office Floor 2" },
  },
  // Workflows
  {
    id: "workflow-1",
    title: "Employee Onboarding Workflow",
    description: "Automated workflow for new employee setup and orientation",
    type: "workflow",
    category: "HR Processes",
    url: "/workflows/employee-onboarding",
    relevance: 0.81,
    metadata: { status: "active", triggers: 12, lastRun: "2024-01-20" },
  },
  // Accounts
  {
    id: "account-1",
    title: "Acme Corporation - Enterprise Client",
    description: "Large enterprise client with 500+ employees using our platform",
    type: "account",
    category: "Enterprise",
    url: "/accounts/acme-corp",
    relevance: 0.78,
    metadata: { plan: "Enterprise", employees: 500, status: "active" },
  },
]

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

  const debouncedSearch = useDebounce(async (term: string, typeFilter?: string) => {
    if (!term.trim()) {
      setResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)

    try {
      const allResults: SearchResult[] = []
      
      // Use REST API endpoints instead of GraphQL for reliability
      if (typeFilter && typeFilter !== 'all') {
        // Search specific type
        if (typeFilter === 'ticket') {
          const response = await fetch(`/api/search/tickets?q=${encodeURIComponent(term)}&limit=50`)
          if (response.ok) {
            const data = await response.json()
            if (data.tickets) {
              allResults.push(...data.tickets)
            }
          }
        } else if (typeFilter === 'user') {
          const response = await fetch(`/api/search/users?q=${encodeURIComponent(term)}&limit=50`)
          if (response.ok) {
            const data = await response.json()
            if (data.users) {
              allResults.push(...data.users)
            }
          }
        } else if (typeFilter === 'service') {
          const response = await fetch(`/api/search/services?q=${encodeURIComponent(term)}&limit=50`)
          if (response.ok) {
            const data = await response.json()
            if (data.services) {
              allResults.push(...data.services)
            }
          }
        } else if (typeFilter === 'asset') {
          const response = await fetch(`/api/search/assets?q=${encodeURIComponent(term)}&limit=50`)
          if (response.ok) {
            const data = await response.json()
            if (data.assets) {
              allResults.push(...data.assets)
            }
          }
        }
      } else {
        // Search all types in parallel using REST APIs
        const [ticketRes, userRes, serviceRes, assetRes] = await Promise.allSettled([
          fetch(`/api/search/tickets?q=${encodeURIComponent(term)}&limit=25`).then(r => r.json()),
          fetch(`/api/search/users?q=${encodeURIComponent(term)}&limit=25`).then(r => r.json()),
          fetch(`/api/search/services?q=${encodeURIComponent(term)}&limit=25`).then(r => r.json()),
          fetch(`/api/search/assets?q=${encodeURIComponent(term)}&limit=25`).then(r => r.json())
        ])
        
        // Collect all results
        if (ticketRes.status === 'fulfilled' && ticketRes.value?.tickets) {
          allResults.push(...ticketRes.value.tickets)
        }
        if (userRes.status === 'fulfilled' && userRes.value?.users) {
          allResults.push(...userRes.value.users)
        }
        if (serviceRes.status === 'fulfilled' && serviceRes.value?.services) {
          allResults.push(...serviceRes.value.services)
        }
        if (assetRes.status === 'fulfilled' && assetRes.value?.assets) {
          allResults.push(...assetRes.value.assets)
        }
      }

      // Sort by relevance
      allResults.sort((a, b) => b.relevance - a.relevance)

      setResults(allResults.slice(0, 50))
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }, 300)
  
  // Calculate match relevance (prioritize exact > starts with > contains)
  const calculateMatchRelevance = (searchTerm: string, title: string, description: string): number => {
    const term = searchTerm.toLowerCase()
    const titleLower = (title || '').toLowerCase()
    const descLower = (description || '').toLowerCase()
    
    let score = 0
    
    // Exact match (highest priority)
    if (titleLower === term) score += 1.0
    else if (descLower === term) score += 0.8
    
    // Starts with match
    else if (titleLower.startsWith(term)) score += 0.7
    else if (descLower.startsWith(term)) score += 0.5
    
    // Contains match (substring)
    else if (titleLower.includes(term)) score += 0.5
    else if (descLower.includes(term)) score += 0.3
    
    // Word boundary match bonus
    const words = titleLower.split(/\s+/)
    if (words.some(w => w.startsWith(term))) score += 0.2
    
    return Math.min(score, 1.0)
  }

  const performSearch = useCallback(
    async (term: string, typeFilter?: string) => {
      setSearchTerm(term)
      await debouncedSearch(term, typeFilter)
    },
    [debouncedSearch],
  )

  const clearSearch = useCallback(() => {
    setSearchTerm("")
    setResults([])
    setIsSearching(false)
  }, [])

  const addToRecent = useCallback(async (term: string) => {
    if (!term.trim()) return

    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item !== term)
      return [term, ...filtered].slice(0, 10) // Keep last 10 searches
    })
    
    // Save to database
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Get organization_id from user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('id', user.id)
          .single()
        
        if (profile?.organization_id) {
          await supabase.from('search_suggestions').insert({
            organization_id: profile.organization_id,
            user_id: user.id,
            query: term,
            search_type: 'all',
            result_count: results.length
          })
        }
      }
    } catch (error) {
      console.error('Failed to save search to database:', error)
    }
  }, [results.length])

  // Generate suggestions based on search term (top 3 only)
  useEffect(() => {
    if (searchTerm.length > 0) {
      const termLower = searchTerm.toLowerCase()
      const newSuggestions = mockSearchData
        .filter(
          (item) =>
            item.title.toLowerCase().includes(termLower) || item.category?.toLowerCase().includes(termLower),
        )
        .map((item) => item.title)
        .slice(0, 3) // Only top 3 suggestions

      setSuggestions(newSuggestions)
    } else {
      setSuggestions([])
    }
  }, [searchTerm])

  // Load recent searches from database
  useEffect(() => {
    const loadRecentSearches = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          const { data, error } = await supabase
            .from('search_suggestions')
            .select('query')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10)
          
          if (data && !error) {
            // Get unique search queries
            const uniqueQueries = [...new Set(data.map(item => item.query))]
            setRecentSearches(uniqueQueries.slice(0, 10))
          }
        }
      } catch (e) {
        console.error("Failed to load recent searches:", e)
      }
    }
    
    loadRecentSearches()
  }, [])


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
