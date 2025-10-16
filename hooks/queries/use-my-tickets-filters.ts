"use client"

import { useState, useCallback, useMemo } from "react"
import { useMyTicketsGraphQLQuery, buildMyTicketsParams, getMyTicketsFilterSummary } from "./use-my-tickets-graphql-query"

export interface MyTicketsFilters {
  search: string
  status: string
  priority: string
  type: string
  dateRange: {
    from: string
    to: string
  }
  sortBy: 'created_at' | 'updated_at' | 'priority' | 'status' | 'title'
  sortOrder: 'asc' | 'desc'
  tags: string[]
  isOverdue: boolean
  hasAttachments: boolean | undefined
  hasComments: boolean | undefined
  page: number
  limit: number
}

export interface MyTicketsFilterState {
  filters: MyTicketsFilters
  setFilter: <K extends keyof MyTicketsFilters>(key: K, value: MyTicketsFilters[K]) => void
  setFilters: (newFilters: Partial<MyTicketsFilters>) => void
  clearFilters: () => void
  resetFilters: () => void
  activeFiltersCount: number
  filterSummary: string[]
  hasActiveFilters: boolean
}

const defaultFilters: MyTicketsFilters = {
  search: '',
  status: 'all',
  priority: 'all',
  type: 'all',
  dateRange: {
    from: '',
    to: ''
  },
  sortBy: 'created_at',
  sortOrder: 'desc',
  tags: [],
  isOverdue: false,
  hasAttachments: undefined,
  hasComments: undefined,
  page: 1,
  limit: 50
}

/**
 * Custom hook for managing My Tickets filters with advanced query capabilities
 */
export function useMyTicketsFilters(userId: string) {
  const [filters, setFiltersState] = useState<MyTicketsFilters>(defaultFilters)

  // Build query parameters
  const queryParams = useMemo(() => {
    const params = buildMyTicketsParams(userId, {
      search: filters.search || undefined,
      status: filters.status === 'all' ? undefined : filters.status,
      priority: filters.priority === 'all' ? undefined : filters.priority,
      type: filters.type === 'all' ? undefined : filters.type,
      dateRange: filters.dateRange.from || filters.dateRange.to ? filters.dateRange : undefined,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
      page: filters.page,
      limit: filters.limit,
    })

    // Add advanced filters
    if (filters.tags.length > 0) {
      params.tags = filters.tags
    }
    if (filters.isOverdue) {
      params.isOverdue = true
    }
    if (filters.hasAttachments !== undefined) {
      params.hasAttachments = filters.hasAttachments
    }
    if (filters.hasComments !== undefined) {
      params.hasComments = filters.hasComments
    }

    return params
  }, [userId, filters])

  // Execute query
  const queryResult = useMyTicketsGraphQLQuery(queryParams)

  // Filter management functions
  const setFilter = useCallback(<K extends keyof MyTicketsFilters>(
    key: K, 
    value: MyTicketsFilters[K]
  ) => {
    setFiltersState(prev => ({
      ...prev,
      [key]: value,
      // Reset page when changing filters (except page itself)
      ...(key !== 'page' && { page: 1 })
    }))
  }, [])

  const setFilters = useCallback((newFilters: Partial<MyTicketsFilters>) => {
    setFiltersState(prev => ({
      ...prev,
      ...newFilters,
      // Reset page when changing filters (except page itself)
      ...(newFilters.page === undefined && { page: 1 })
    }))
  }, [])

  const clearFilters = useCallback(() => {
    setFiltersState(defaultFilters)
  }, [])

  const resetFilters = useCallback(() => {
    setFiltersState(prev => ({
      ...prev,
      search: '',
      status: 'all',
      priority: 'all',
      type: 'all',
      dateRange: { from: '', to: '' },
      tags: [],
      isOverdue: false,
      hasAttachments: undefined,
      hasComments: undefined,
      page: 1
    }))
  }, [])

  // Calculate active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (filters.search) count++
    if (filters.status !== 'all') count++
    if (filters.priority !== 'all') count++
    if (filters.type !== 'all') count++
    if (filters.dateRange.from || filters.dateRange.to) count++
    if (filters.tags.length > 0) count++
    if (filters.isOverdue) count++
    if (filters.hasAttachments !== undefined) count++
    if (filters.hasComments !== undefined) count++
    return count
  }, [filters])

  // Generate filter summary
  const filterSummary = useMemo(() => {
    return getMyTicketsFilterSummary(queryParams)
  }, [queryParams])

  const hasActiveFilters = activeFiltersCount > 0

  return {
    filters,
    setFilter,
    setFilters,
    clearFilters,
    resetFilters,
    activeFiltersCount,
    filterSummary,
    hasActiveFilters,
    queryResult,
    queryParams
  }
}

/**
 * Hook for quick filter presets
 */
export function useMyTicketsFilterPresets(userId: string) {
  const presets = useMemo(() => ({
    all: () => buildMyTicketsParams(userId),
    open: () => buildMyTicketsParams(userId, { status: 'new' }),
    inProgress: () => buildMyTicketsParams(userId, { status: 'waiting_on_you' }),
    review: () => buildMyTicketsParams(userId, { status: 'waiting_on_customer' }),
    done: () => buildMyTicketsParams(userId, { status: 'on_hold' }),
    highPriority: () => buildMyTicketsParams(userId, { priority: 'high' }),
    urgent: () => buildMyTicketsParams(userId, { priority: 'urgent' }),
    overdue: () => buildMyTicketsParams(userId, { isOverdue: true }),
    recent: () => buildMyTicketsParams(userId, { 
      dateRange: { 
        from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() 
      } 
    }),
    thisMonth: () => buildMyTicketsParams(userId, {
      dateRange: {
        from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
      }
    }),
    lastMonth: () => {
      const now = new Date()
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      return buildMyTicketsParams(userId, {
        dateRange: {
          from: lastMonth.toISOString(),
          to: thisMonth.toISOString()
        }
      })
    }
  }), [userId])

  return presets
}

/**
 * Hook for filter validation and suggestions
 */
export function useMyTicketsFilterValidation() {
  const validateFilters = useCallback((filters: MyTicketsFilters) => {
    const errors: string[] = []
    const warnings: string[] = []

    // Date range validation
    if (filters.dateRange.from && filters.dateRange.to) {
      const fromDate = new Date(filters.dateRange.from)
      const toDate = new Date(filters.dateRange.to)
      
      if (fromDate > toDate) {
        errors.push('Start date cannot be after end date')
      }
      
      const daysDiff = (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)
      if (daysDiff > 365) {
        warnings.push('Date range is very large (>1 year), results may be slow')
      }
    }

    // Search validation
    if (filters.search && filters.search.length < 2) {
      warnings.push('Search term is very short, try using more specific keywords')
    }

    // Tag validation
    if (filters.tags.length > 10) {
      warnings.push('Too many tags selected, consider using fewer for better performance')
    }

    return { errors, warnings, isValid: errors.length === 0 }
  }, [])

  const getFilterSuggestions = useCallback((filters: MyTicketsFilters) => {
    const suggestions: string[] = []

    if (filters.search && filters.search.length > 0) {
      suggestions.push('Try searching by ticket number, title, or description')
    }

    if (filters.status === 'all' && filters.priority === 'all' && filters.type === 'all') {
      suggestions.push('Use filters to narrow down your results')
    }

    if (!filters.dateRange.from && !filters.dateRange.to) {
      suggestions.push('Add a date range to find tickets from specific time periods')
    }

    return suggestions
  }, [])

  return {
    validateFilters,
    getFilterSuggestions
  }
}

/**
 * Hook for filter persistence (localStorage)
 */
export function useMyTicketsFilterPersistence(userId: string) {
  const storageKey = `my-tickets-filters-${userId}`

  const saveFilters = useCallback((filters: MyTicketsFilters) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(filters))
    } catch (error) {
      console.warn('Failed to save filters to localStorage:', error)
    }
  }, [storageKey])

  const loadFilters = useCallback((): MyTicketsFilters | null => {
    try {
      const saved = localStorage.getItem(storageKey)
      return saved ? JSON.parse(saved) : null
    } catch (error) {
      console.warn('Failed to load filters from localStorage:', error)
      return null
    }
  }, [storageKey])

  const clearSavedFilters = useCallback(() => {
    try {
      localStorage.removeItem(storageKey)
    } catch (error) {
      console.warn('Failed to clear saved filters:', error)
    }
  }, [storageKey])

  return {
    saveFilters,
    loadFilters,
    clearSavedFilters
  }
}
