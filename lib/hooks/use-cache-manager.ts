"use client"

import { useEffect, useCallback } from "react"
import { apiCache } from "@/lib/api/cache"
import { useStore } from "@/lib/store"

export function useCacheManager() {
  const { addNotification } = useStore()

  useEffect(() => {
    const interval = setInterval(() => {
      const health = apiCache.healthCheck()

      if (!health.healthy) {
        console.warn("[v0] Cache health issues:", health.issues)

        addNotification({
          title: "Cache Performance Warning",
          message: `Cache issues detected: ${health.issues.join(", ")}`,
          type: "warning",
          read: false,
        })
      }
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [addNotification])

  useEffect(() => {
    // Load cache from localStorage on mount
    const savedCache = localStorage.getItem("kroolo-api-cache")
    if (savedCache) {
      apiCache.import(savedCache)
    }

    // Save cache to localStorage periodically
    const saveInterval = setInterval(() => {
      try {
        const cacheData = apiCache.export()
        localStorage.setItem("kroolo-api-cache", cacheData)
      } catch (error) {
        console.error("[v0] Failed to save cache to localStorage:", error)
      }
    }, 30000) // Save every 30 seconds

    // Save on page unload
    const handleBeforeUnload = () => {
      try {
        const cacheData = apiCache.export()
        localStorage.setItem("kroolo-api-cache", cacheData)
      } catch (error) {
        console.error("[v0] Failed to save cache on unload:", error)
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      clearInterval(saveInterval)
      window.removeEventListener("beforeunload", handleBeforeUnload)
      handleBeforeUnload() // Save one last time
    }
  }, [])

  const getCacheStats = useCallback(() => {
    return apiCache.getStats()
  }, [])

  const clearCache = useCallback(() => {
    apiCache.clear()
    localStorage.removeItem("kroolo-api-cache")

    addNotification({
      title: "Cache Cleared",
      message: "All cached data has been cleared",
      type: "info",
      read: false,
    })
  }, [addNotification])

  const warmCache = useCallback(async () => {
    // Define cache warming functions
    const warmupFunctions = [
      // Warm up tickets
      async () => {
        const { apiClient } = await import("@/lib/api/client")
        await apiClient.get("tickets", { cache: true, cacheTTL: 10 * 60 * 1000 })
      },
      // Warm up assets
      async () => {
        const { apiClient } = await import("@/lib/api/client")
        await apiClient.get("assets", { cache: true, cacheTTL: 10 * 60 * 1000 })
      },
      // Warm up user data
      async () => {
        const { apiClient } = await import("@/lib/api/client")
        await apiClient.get("profiles", { cache: true, cacheTTL: 15 * 60 * 1000 })
      },
    ]

    await apiCache.warmCache(warmupFunctions)

    addNotification({
      title: "Cache Warmed",
      message: "Cache has been preloaded with frequently accessed data",
      type: "success",
      read: false,
    })
  }, [addNotification])

  return {
    getCacheStats,
    clearCache,
    warmCache,
  }
}
