"use client"

import { Bell, X, CheckCircle, AlertTriangle, Info, Clock, User, Ticket, Workflow, MoreHorizontal, Check, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useNotifications } from "@/lib/contexts/notification-context"
import { useTheme } from "next-themes"
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
  const { theme } = useTheme()
  const [activeTab, setActiveTab] = useState("All")
  const [isOpen, setIsOpen] = useState(false)

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
    return "text-muted-foreground dark:text-muted-foreground"
  }

  const getPriorityBadge = (priority: string) => {
    const colors = {
      high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      medium: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      low: "bg-muted text-foreground dark:bg-gray-800 dark:text-gray-200",
    }
    return colors[priority as keyof typeof colors] || colors.low
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 relative" title="Notifications">
          <Bell className="h-4 w-4" style={{ color: theme === 'dark' ? '#d1d5db' : '#000000' }} />
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
        className="w-[420px] p-0 border border-border bg-popover shadow-lg rounded-lg"
      >
        {/* Header with tabs */}
        <div className="p-3 pb-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
            <div className="flex items-center gap-1">
              {/* Meatball menu with actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-accent">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => {
                    markAllAsRead()
                  }} className="cursor-pointer">
                    <Check className="h-4 w-4 mr-2" />
                    Mark all as read
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    // Clear all unread notifications
                    unreadNotifications.forEach(n => clearNotification(n.id))
                  }} className="cursor-pointer text-destructive focus:text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear all
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {/* Close button */}
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 w-7 p-0 hover:bg-accent"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Tab navigation */}
          <div className="flex items-center gap-3 border-b border-border overflow-x-auto pb-0">
            {["All", "Tasks", "Mentioned", "Channels", "DM", "Others"].map((tab) => {
              const count = getTabCount(tab)
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-2 px-1 text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === tab
                      ? "text-primary border-b-2 border-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab}
                  {count > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
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
        <div className="flex-1 flex flex-col items-center justify-center py-8 px-4">
          {unreadNotifications.length === 0 ? (
            <>
              {/* Notification icon */}
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Bell className="h-6 w-6 text-primary" />
              </div>
              
              {/* Empty state text */}
              <h4 className="text-sm font-semibold text-foreground mb-1">
                {activeTab === "All" ? "You're All Caught Up" : `No ${activeTab} Notifications`}
              </h4>
              <p className="text-xs text-muted-foreground text-center max-w-xs">
                {activeTab === "All" 
                  ? "We'll let you know when something needs your attention."
                  : `No ${activeTab.toLowerCase()} notifications at the moment.`
                }
              </p>
            </>
          ) : (
            <div className="w-full space-y-1 max-h-[380px] overflow-y-auto">
              {unreadNotifications.map((notification) => {
                const IconComponent = iconMap[notification.type]
                return (
                  <div
                    key={notification.id}
                    className="group p-2.5 hover:bg-accent transition-colors cursor-pointer rounded-md mx-1"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 rounded-full bg-primary/10 mt-0.5">
                        <IconComponent className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="text-xs font-medium text-foreground line-clamp-1 flex-1">
                            {notification.title}
                          </h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              clearNotification(notification.id)
                            }}
                            className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive flex-shrink-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mb-1.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
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
