"use client"

import { Bell, X, CheckCircle, AlertTriangle, Info, Clock, User, Ticket, Workflow } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useNotifications } from "@/lib/contexts/notification-context"
import Link from "next/link"
import { useState } from "react"

const iconMap = {
  ticket: Ticket,
  workflow: Workflow,
  system: AlertTriangle,
  info: Info,
  success: CheckCircle,
  user: User,
}

export function NotificationBell() {
  const { notifications, unreadCount, getUnreadCountByType, markAsRead, markAllAsRead, clearNotification } =
    useNotifications()
  const [activeTab, setActiveTab] = useState("All")

  // Filter notifications based on active tab
  const getFilteredNotifications = () => {
    let filtered = notifications.filter((n) => !n.read)
    
    switch (activeTab) {
      case "Tasks":
        return filtered.filter(n => n.type === "workflow" || n.type === "ticket")
      case "Mentioned":
        return filtered.filter(n => n.message.includes("@") || n.title.includes("mentioned"))
      case "Channels":
        return filtered.filter(n => n.type === "system" || n.title.includes("channel"))
      case "DM":
        return filtered.filter(n => n.type === "user")
      case "Others":
        return filtered.filter(n => !(["workflow", "ticket", "user", "system"].includes(n.type)))
      default:
        return filtered
    }
  }
  
  const unreadNotifications = getFilteredNotifications().slice(0, 5)
  
  // Get count for each tab
  const getTabCount = (tabName: string) => {
    const allUnread = notifications.filter((n) => !n.read)
    switch (tabName) {
      case "All":
        return allUnread.length
      case "Tasks":
        return allUnread.filter(n => n.type === "workflow" || n.type === "ticket").length
      case "Mentioned":
        return allUnread.filter(n => n.message.includes("@") || n.title.includes("mentioned")).length
      case "Channels":
        return allUnread.filter(n => n.type === "system" || n.title.includes("channel")).length
      case "DM":
        return allUnread.filter(n => n.type === "user").length
      case "Others":
        return allUnread.filter(n => !(["workflow", "ticket", "user", "system"].includes(n.type))).length
      default:
        return 0
    }
  }

  const getNotificationColor = (type: string, priority: string) => {
    if (priority === "high") return "text-red-600 dark:text-red-400"
    if (priority === "medium") return "text-orange-600 dark:text-orange-400"
    return "text-gray-600 dark:text-gray-400"
  }

  const getPriorityBadge = (priority: string) => {
    const colors = {
      high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      medium: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      low: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    }
    return colors[priority as keyof typeof colors] || colors.low
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 relative">
          <Bell className="h-4 w-4 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-medium">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        alignOffset={-20}
        className="w-[32rem] p-0 border border-border bg-popover shadow-lg rounded-lg"
      >
        {/* Header with tabs */}
        <div className="p-4 pb-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-foreground">Notifications</h3>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="1"/>
                  <circle cx="19" cy="12" r="1"/>
                  <circle cx="5" cy="12" r="1"/>
                </svg>
              </Button>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Tab navigation */}
          <div className="flex items-center gap-4 border-b border-border overflow-x-auto pb-0">
            {["All", "Tasks", "Mentioned", "Channels", "DM", "Others"].map((tab) => {
              const count = getTabCount(tab)
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-2 px-1 text-sm font-medium transition-colors flex items-center gap-1 whitespace-nowrap ${
                    activeTab === tab
                      ? "text-primary border-b-2 border-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab}
                  {count > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      activeTab === tab
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 flex flex-col items-center justify-center py-12 px-6">
          {unreadNotifications.length === 0 ? (
            <>
              {/* Notification icon */}
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <Bell className="h-8 w-8 text-primary" />
              </div>
              
              {/* Empty state text */}
              <h4 className="text-lg font-semibold text-foreground mb-2">
                {activeTab === "All" ? "You're All Caught Up" : `No ${activeTab} Notifications`}
              </h4>
              <p className="text-sm text-muted-foreground text-center max-w-xs">
                {activeTab === "All" 
                  ? "We'll let you know when something needs your attention."
                  : `No ${activeTab.toLowerCase()} notifications at the moment.`
                }
              </p>
            </>
          ) : (
            <div className="w-full space-y-2 max-h-80 overflow-y-auto">
              {unreadNotifications.map((notification) => {
                const IconComponent = iconMap[notification.type]
                return (
                  <div
                    key={notification.id}
                    className="p-3 hover:bg-accent transition-colors cursor-pointer rounded-md mx-2"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 rounded-full bg-primary/10">
                        <IconComponent className="h-3 w-3 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <h4 className="text-sm font-medium text-foreground line-clamp-1">
                            {notification.title}
                          </h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              clearNotification(notification.id)
                            }}
                            className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {notification.time}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
