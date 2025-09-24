"use client"

import { useEffect, useState } from "react"
import { apiClient } from "../api/client"
import { useStore } from "../store"

interface UseDataFetcherOptions {
  table: string
  select?: string
  filters?: Record<string, any>
  orderBy?: { column: string; ascending?: boolean }
  cache?: boolean
  cacheTTL?: number
  enabled?: boolean
}

export function useDataFetcher<T>({
  table,
  select = "*",
  filters,
  orderBy,
  cache = true,
  cacheTTL,
  enabled = true,
}: UseDataFetcherOptions) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const { setLoading: setGlobalLoading } = useStore()

  const fetchData = async () => {
    if (!enabled) return

    try {
      setLoading(true)
      setGlobalLoading(table as any, true)
      setError(null)

      const result = await apiClient.get<T>(table, {
        select,
        filters,
        orderBy,
        cache,
        cacheTTL,
      })

      setData(result)
    } catch (err) {
      setError(err as Error)
      console.error(`[v0] Error fetching ${table}:`, err)
    } finally {
      setLoading(false)
      setGlobalLoading(table as any, false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [table, JSON.stringify(filters), JSON.stringify(orderBy), enabled])

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  }
}
