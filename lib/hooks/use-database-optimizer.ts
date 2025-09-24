"use client"

import { useEffect, useCallback } from "react"
import { queryOptimizer } from "@/lib/database/query-optimizer"
import { useStore } from "@/lib/store"
import { useApp } from "@/lib/contexts/app-context"

export function useDatabaseOptimizer() {
  const { user, addNotification } = useStore()
  const { handleError } = useApp()

  useEffect(() => {
    if (user) {
      queryOptimizer.preloadCriticalData(user.id).catch((error) => {
        handleError(error, "preload-critical-data")
      })
    }
  }, [user, handleError])

  const fetchDashboardData = useCallback(async () => {
    if (!user) return null

    try {
      return await queryOptimizer.getDashboardData(user.id)
    } catch (error) {
      handleError(error as Error, "fetch-dashboard-data")
      return null
    }
  }, [user, handleError])

  const searchGlobal = useCallback(
    async (searchTerm: string, limit = 20) => {
      if (!searchTerm.trim()) return []

      try {
        return await queryOptimizer.searchWithRanking(searchTerm, undefined, limit)
      } catch (error) {
        handleError(error as Error, "global-search")
        return []
      }
    },
    [handleError],
  )

  const batchUpdateTickets = useCallback(
    async (updates: Array<{ id: string; updates: any }>) => {
      try {
        await queryOptimizer.batchUpdateTickets(updates)

        addNotification({
          title: "Bulk Update Complete",
          message: `Successfully updated ${updates.length} tickets`,
          type: "success",
          read: false,
        })
      } catch (error) {
        handleError(error as Error, "batch-update-tickets")
      }
    },
    [addNotification, handleError],
  )

  const getOptimizedTickets = useCallback(
    async (options: any = {}) => {
      try {
        return await queryOptimizer.getTicketsOptimized(options)
      } catch (error) {
        handleError(error as Error, "get-optimized-tickets")
        return []
      }
    },
    [handleError],
  )

  return {
    fetchDashboardData,
    searchGlobal,
    batchUpdateTickets,
    getOptimizedTickets,
  }
}
