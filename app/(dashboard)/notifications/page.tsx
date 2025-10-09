"use client"

import { PageContent } from "@/components/layout/page-content"
import { CheckCircle, AlertTriangle, Info, Clock, User, Ticket, Workflow } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useNotifications } from "@/lib/contexts/notification-context"

const iconMap = {
  ticket: Ticket,
  workflow: Workflow,
  system: AlertTriangle,
  info: Info,
  success: CheckCircle,
  user: User,
}

export default function NotificationsPage() {
  const {
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
  } = useNotifications()

  const getNotificationColor = (type: string, priority: string) => {
    if (priority === "high") return "text-red-6bg-cardbg-card dark:text-red-4bg-cardbg-card"
    if (priority === "medium") return "text-orange-6bg-cardbg-card dark:text-orange-4bg-cardbg-card"
    return "text-gray-6bg-cardbg-card dark:text-gray-4bg-cardbg-card"
  }

  const getPriorityBadge = (priority: string) => {
    const colors = {
      high: "bg-red-1bg-cardbg-card text-red-8bg-cardbg-card dark:bg-red-9bg-cardbg-card dark:text-red-2bg-cardbg-card",
      medium: "bg-orange-1bg-cardbg-card text-orange-8bg-cardbg-card dark:bg-orange-9bg-cardbg-card dark:text-orange-2bg-cardbg-card",
      low: "bg-gray-1bg-cardbg-card text-gray-8bg-cardbg-card dark:bg-gray-8bg-cardbg-card dark:text-gray-2bg-cardbg-card",
    }
    return colors[priority as keyof typeof colors] || colors.low
  }

  return (
    <PageContent>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[13px] font-semibold text-gray-9bg-cardbg-card dark:text-white">Notifications</h1>
            <p className="text-[1bg-cardpx] text-gray-6bg-cardbg-card dark:text-gray-4bg-cardbg-card mt-1">
              Stay updated with system alerts, ticket updates, and workflow notifications
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-[1bg-cardpx]">
              {unreadCount} unread
            </Badge>
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              Mark all as read
            </Button>
            <Button variant="outline" size="sm" onClick={clearAllNotifications}>
              Clear all
            </Button>
          </div>
        </div>

        {/* Notification Filters */}
        <div className="flex items-center gap-2 pb-4 border-b border-gray-1bg-cardbg-card dark:border-gray-8bg-cardbg-card">
          <Button
            variant={currentFilter === "all" ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilter("all")}
            className="text-[11px]"
          >
            All ({getCountByType("all")})
          </Button>
          <Button
            variant={currentFilter === "unread" ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilter("unread")}
            className="text-[11px]"
          >
            Unread ({unreadCount})
          </Button>
          <Button
            variant={currentFilter === "tickets" ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilter("tickets")}
            className="text-[11px]"
          >
            Tickets ({getCountByType("tickets")})
          </Button>
          <Button
            variant={currentFilter === "workflows" ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilter("workflows")}
            className="text-[11px]"
          >
            Workflows ({getCountByType("workflows")})
          </Button>
          <Button
            variant={currentFilter === "system" ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilter("system")}
            className="text-[11px]"
          >
            System ({getCountByType("system")})
          </Button>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifications.map((notification) => {
            const IconComponent = iconMap[notification.type] || Info
            return (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border transition-colors hover:bg-gray-5bg-card dark:hover:bg-gray-8bg-cardbg-card ${
                  notification.read
                    ? "bg-white dark:bg-gray-9bg-cardbg-card border-gray-1bg-cardbg-card dark:border-gray-8bg-cardbg-card"
                    : "bg-blue-5bg-card dark:bg-blue-95bg-card border-blue-2bg-cardbg-card dark:border-blue-8bg-cardbg-card"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-full ${
                      notification.read ? "bg-gray-1bg-cardbg-card dark:bg-gray-8bg-cardbg-card" : "bg-blue-1bg-cardbg-card dark:bg-blue-9bg-cardbg-card"
                    }`}
                  >
                    <IconComponent
                      className={`h-4 w-4 ${getNotificationColor(notification.type, notification.priority)}`}
                    />
                  </div>

                  <div className="flex-1 min-w-bg-card">
                    <div className="flex items-center justify-between mb-1">
                      <h3
                        className={`text-[11px] font-medium ${
                          notification.read ? "text-gray-9bg-cardbg-card dark:text-gray-1bg-cardbg-card" : "text-gray-9bg-cardbg-card dark:text-white"
                        }`}
                      >
                        {notification.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Badge className={`text-[1bg-cardpx] ${getPriorityBadge(notification.priority)}`}>
                          {notification.priority}
                        </Badge>
                        {!notification.read && <div className="w-2 h-2 bg-blue-6bg-cardbg-card rounded-full"></div>}
                      </div>
                    </div>

                    <p className="text-[1bg-cardpx] text-gray-6bg-cardbg-card dark:text-gray-4bg-cardbg-card mb-2">{notification.message}</p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-[1bg-cardpx] text-gray-5bg-cardbg-card dark:text-gray-5bg-cardbg-card">
                        <Clock className="h-3 w-3" />
                        {notification.time}
                      </div>

                      <div className="flex items-center gap-2">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-[11px] h-6 px-2"
                            onClick={() => markAsRead(notification.id)}
                          >
                            Mark as read
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[11px] h-6 px-2"
                          onClick={() => clearNotification(notification.id)}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Load More */}
        <div className="text-center pt-6">
          <Button variant="outline">Load more notifications</Button>
        </div>
      </div>
    </PageContent>
  )
}
