"use client"

import { useState, useMemo, useCallback } from "react"

interface UseSearchFiltersOptions<T> {
  data: T[]
  searchFields: (keyof T)[]
  filterFields?: (keyof T)[]
}

export function useSearchFilters<T>({ data, searchFields, filterFields = [] }: UseSearchFiltersOptions<T>) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [sortBy, setSortBy] = useState<keyof T | null>(null)
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

  const filteredData = useMemo(() => {
    let result = data

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter((item) =>
        searchFields.some((field) => {
          const value = item[field]
          return value && String(value).toLowerCase().includes(query)
        }),
      )
    }

    // Apply filters
    Object.entries(filters).forEach(([field, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        result = result.filter((item) => {
          const itemValue = item[field as keyof T]
          if (Array.isArray(value)) {
            return value.includes(itemValue)
          }
          return itemValue === value
        })
      }
    })

    // Apply sorting
    if (sortBy) {
      result = [...result].sort((a, b) => {
        const aValue = a[sortBy]
        const bValue = b[sortBy]

        if (aValue < bValue) return sortOrder === "asc" ? -1 : 1
        if (aValue > bValue) return sortOrder === "asc" ? 1 : -1
        return 0
      })
    }

    return result
  }, [data, searchQuery, filters, sortBy, sortOrder, searchFields])

  const setFilter = useCallback((field: string, value: any) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
  }, [])

  const clearFilter = useCallback((field: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev }
      delete newFilters[field]
      return newFilters
    })
  }, [])

  const clearAllFilters = useCallback(() => {
    setFilters({})
    setSearchQuery("")
  }, [])

  const toggleSort = useCallback(
    (field: keyof T) => {
      if (sortBy === field) {
        setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
      } else {
        setSortBy(field)
        setSortOrder("asc")
      }
    },
    [sortBy],
  )

  return {
    searchQuery,
    setSearchQuery,
    filters,
    setFilter,
    clearFilter,
    clearAllFilters,
    sortBy,
    sortOrder,
    toggleSort,
    filteredData,
    totalCount: data.length,
    filteredCount: filteredData.length,
  }
}
