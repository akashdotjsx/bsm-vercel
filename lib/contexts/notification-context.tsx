"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback } from "react"

export interface Notification {
  id: number
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
  setFilter: (filter: NotificationFilter) => void
  getCountByType: (type: string) => number
  getUnreadCountByType: (type: string) => number
  markAsRead: (id: number) => void
  markAllAsRead: () => void
  clearNotification: (id: number) => void
  clearAllNotifications: () => void
  addNotification: (notification: Omit<Notification, "id">) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider")
  }
  return context
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      type: "ticket",
      icon: null,
      title: "High Priority Ticket Assigned",
      message: "Ticket #TKT-2024-001 has been assigned to you by Sarah Johnson",
      time: "2 minutes ago",
      read: false,
      priority: "high",
    },
    {
      id: 2,
      type: "workflow",
      icon: null,
      title: "Workflow Approval Required",
      message: "Employee onboarding workflow for John Smith requires your approval",
      time: "15 minutes ago",
      read: false,
      priority: "medium",
    },
    {
      id: 3,
      type: "system",
      icon: null,
      title: "SLA Breach Warning",
      message: "Ticket #TKT-2024-002 is approaching SLA deadline (2 hours remaining)",
      time: "1 hour ago",
      read: false,
      priority: "high",
    },
    {
      id: 4,
      type: "info",
      icon: null,
      title: "System Maintenance Scheduled",
      message: "Scheduled maintenance window: Tonight 11 PM - 2 AM EST",
      time: "3 hours ago",
      read: true,
      priority: "low",
    },
    {
      id: 5,
      type: "success",
      icon: null,
      title: "Workflow Completed",
      message: "IT Asset Request workflow has been completed successfully",
      time: "5 hours ago",
      read: true,
      priority: "low",
    },
    {
      id: 6,
      type: "user",
      icon: null,
      title: "New Team Member Added",
      message: "Alex Chen has been added to the IT Support team",
      time: "1 day ago",
      read: true,
      priority: "low",
    },
  ])

  const [currentFilter, setCurrentFilter] = useState<NotificationFilter>("all")

  const filteredNotifications = notifications.filter((notification) => {
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

  const unreadCount = notifications.filter((n) => !n.read).length

  const getCountByType = useCallback(
    (type: string) => {
      switch (type) {
        case "tickets":
          return notifications.filter((n) => n.type === "ticket").length
        case "workflows":
          return notifications.filter((n) => n.type === "workflow").length
        case "system":
          return notifications.filter((n) => n.type === "system" || n.type === "info").length
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

  const markAsRead = useCallback((id: number) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
  }, [])

  const clearNotification = useCallback((id: number) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))
  }, [])

  const clearAllNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  const addNotification = useCallback(
    (notification: Omit<Notification, "id">) => {
      const newId = Math.max(...notifications.map((n) => n.id), 0) + 1
      setNotifications((prev) => [{ ...notification, id: newId }, ...prev])
    },
    [notifications],
  )

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        filteredNotifications,
        unreadCount,
        currentFilter,
        setFilter,
        getCountByType,
        getUnreadCountByType,
        markAsRead,
        markAllAsRead,
        clearNotification,
        clearAllNotifications,
        addNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}
