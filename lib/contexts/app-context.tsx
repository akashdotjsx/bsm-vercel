"use client"

import React, { createContext, useContext, useEffect, type ReactNode } from "react"
import { useStore } from "@/lib/store"
import { apiClient } from "@/lib/api/client"

interface AppContextType {
  refreshData: () => Promise<void>
  syncWithServer: () => Promise<void>
  handleError: (error: Error, context?: string) => void
  isOnline: boolean
}

const AppContext = createContext<AppContextType | undefined>(undefined)

interface AppProviderProps {
  children: ReactNode
}

export function AppProvider({ children }: AppProviderProps) {
  const { setTickets, setAssets, setNotifications, setLoading, addNotification, isCacheValid, invalidateCache, user } =
    useStore()

  const [isOnline, setIsOnline] = React.useState(true)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  useEffect(() => {
    if (isOnline && user) {
      syncWithServer()
    }
  }, [isOnline, user])

  const refreshData = async () => {
    if (!user || !isOnline) return

    try {
      setLoading("tickets", true)
      setLoading("assets", true)
      setLoading("notifications", true)

      // Fetch fresh data from server
      const [tickets, assets, notifications] = await Promise.all([
        apiClient.get("tickets", { cache: false }),
        apiClient.get("assets", { cache: false }),
        apiClient.get("notifications", { cache: false, filters: { user_id: user.id } }),
      ])

      setTickets(tickets)
      setAssets(assets)
      setNotifications(notifications)

      addNotification({
        title: "Data Refreshed",
        message: "All data has been synchronized with the server",
        type: "success",
        read: false,
      })
    } catch (error) {
      handleError(error as Error, "refreshData")
    } finally {
      setLoading("tickets", false)
      setLoading("assets", false)
      setLoading("notifications", false)
    }
  }

  const syncWithServer = async () => {
    if (!user || !isOnline) return

    try {
      // Only sync if cache is invalid
      const promises = []

      if (!isCacheValid("tickets")) {
        promises.push(
          apiClient.get("tickets").then((data) => {
            setTickets(data)
          }),
        )
      }

      if (!isCacheValid("assets")) {
        promises.push(
          apiClient.get("assets").then((data) => {
            setAssets(data)
          }),
        )
      }

      if (!isCacheValid("notifications")) {
        promises.push(
          apiClient.get("notifications", { filters: { user_id: user.id } }).then((data) => {
            setNotifications(data)
          }),
        )
      }

      await Promise.all(promises)
    } catch (error) {
      handleError(error as Error, "syncWithServer")
    }
  }

  const handleError = (error: Error, context?: string) => {
    console.error(`[v0] Error in ${context || "unknown"}:`, error)

    addNotification({
      title: "Error Occurred",
      message: error.message || "An unexpected error occurred",
      type: "error",
      read: false,
    })

    // Invalidate cache on error to force fresh data on next request
    if (context === "refreshData" || context === "syncWithServer") {
      invalidateCache()
    }
  }

  const contextValue: AppContextType = {
    refreshData,
    syncWithServer,
    handleError,
    isOnline,
  }

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider")
  }
  return context
}
