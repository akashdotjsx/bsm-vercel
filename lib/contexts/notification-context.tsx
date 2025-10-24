"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useMemo } from "react"
import { useNotifications as useNotificationsHook } from '@/hooks/use-notifications'
import type { Notification as DBNotification } from '@/hooks/use-notifications'
import { formatDistanceToNow } from 'date-fns'

// Legacy interface for backward compatibility with existing UI components
export interface Notification {
  id: string
  type: "ticket" | "workflow" | "system" | "info" | "success" | "user"
  icon: any
  title: string
  message: string
  time: string
  read: boolean
  priority: "high" | "medium" | "low"
}

export type NotificationFilter = "all" | "unread" | "tickets" | "workflows" | "system"

interface NotificationContextType {
  notifications: Notification[]
  filteredNotifications: Notification[]
  unreadCount: number
  currentFilter: NotificationFilter
  loading: boolean
  error: string | null
  setFilter: (filter: NotificationFilter) => void
  getCountByType: (type: string) => number
  getUnreadCountByType: (type: string) => number
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearNotification: (id: string) => void
  clearAllNotifications: () => void
  addNotification: (notification: Omit<Notification, "id" | "time">) => void
  refreshNotifications: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider")
  }
  return context
}

// Helper to convert DB notification to UI notification format
function convertToUINotification(dbNotification: DBNotification): Notification {
  return {
    id: dbNotification.id,
    type: dbNotification.type,
    icon: null, // Icons are handled in UI components
    title: dbNotification.title,
    message: dbNotification.message,
    time: formatDistanceToNow(new Date(dbNotification.created_at), { addSuffix: true }),
    read: dbNotification.read,
    priority: dbNotification.priority,
  }
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  // Use the real Supabase notifications hook
  const {
    notifications: dbNotifications,
    loading,
    error,
    unreadCount,
    fetchNotifications,
    markAsRead: dbMarkAsRead,
    markAllAsRead: dbMarkAllAsRead,
    clearNotification: dbClearNotification,
    clearAllNotifications: dbClearAllNotifications,
    createNotification: dbCreateNotification,
  } = useNotificationsHook()

  const [currentFilter, setCurrentFilter] = useState<NotificationFilter>("all")

  // Convert DB notifications to UI format
  const notifications = useMemo(
    () => dbNotifications.map(convertToUINotification),
    [dbNotifications]
  )

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      switch (currentFilter) {
        case "unread":
          return !notification.read
        case "tickets":
          return notification.type === "ticket"
        case "workflows":
          return notification.type === "workflow"
        case "system":
          return notification.type === "system" || notification.type === "info"
        default:
          return true
      }
    })
  }, [notifications, currentFilter])

  const getCountByType = useCallback(
    (type: string) => {
      switch (type) {
        case "tickets":
          return notifications.filter((n) => n.type === "ticket").length
        case "workflows":
          return notifications.filter((n) => n.type === "workflow").length
        case "system":
          return notifications.filter((n) => n.type === "system" || n.type === "info").length
        case "all":
          return notifications.length
        default:
          return notifications.length
      }
    },
    [notifications],
  )

  const getUnreadCountByType = useCallback(
    (type: string) => {
      switch (type) {
        case "tickets":
          return notifications.filter((n) => n.type === "ticket" && !n.read).length
        case "workflows":
          return notifications.filter((n) => n.type === "workflow" && !n.read).length
        case "system":
          return notifications.filter((n) => (n.type === "system" || n.type === "info") && !n.read).length
        default:
          return unreadCount
      }
    },
    [notifications, unreadCount],
  )

  const setFilter = useCallback((filter: NotificationFilter) => {
    setCurrentFilter(filter)
  }, [])

  const markAsRead = useCallback((id: string) => {
    dbMarkAsRead(id)
  }, [dbMarkAsRead])

  const markAllAsRead = useCallback(() => {
    dbMarkAllAsRead()
  }, [dbMarkAllAsRead])

  const clearNotification = useCallback((id: string) => {
    dbClearNotification(id)
  }, [dbClearNotification])

  const clearAllNotifications = useCallback(() => {
    dbClearAllNotifications()
  }, [dbClearAllNotifications])

  const addNotification = useCallback(
    async (notification: Omit<Notification, "id" | "time">) => {
      await dbCreateNotification({
        type: notification.type,
        title: notification.title,
        message: notification.message,
        priority: notification.priority,
        metadata: {},
      })
    },
    [dbCreateNotification],
  )

  const refreshNotifications = useCallback(() => {
    fetchNotifications()
  }, [fetchNotifications])

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        filteredNotifications,
        unreadCount,
        currentFilter,
        loading,
        error,
        setFilter,
        getCountByType,
        getUnreadCountByType,
        markAsRead,
        markAllAsRead,
        clearNotification,
        clearAllNotifications,
        addNotification,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}
