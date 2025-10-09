"use client"

import { PlatformLayout } from "@/components/layout/platform-layout"
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
    <PlatformLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[13px] font-semibold text-gray-900 dark:text-white">Notifications</h1>
            <p className="text-[10px] text-gray-600 dark:text-gray-400 mt-1">
              Stay updated with system alerts, ticket updates, and workflow notifications
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-[10px]">
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
        <div className="flex items-center gap-2 pb-4 border-b border-gray-100 dark:border-gray-800">
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
                className={`p-4 rounded-lg border transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                  notification.read
                    ? "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800"
                    : "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-full ${
                      notification.read ? "bg-gray-100 dark:bg-gray-800" : "bg-blue-100 dark:bg-blue-900"
                    }`}
                  >
                    <IconComponent
                      className={`h-4 w-4 ${getNotificationColor(notification.type, notification.priority)}`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3
                        className={`text-[11px] font-medium ${
                          notification.read ? "text-gray-900 dark:text-gray-100" : "text-gray-900 dark:text-white"
                        }`}
                      >
                        {notification.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Badge className={`text-[10px] ${getPriorityBadge(notification.priority)}`}>
                          {notification.priority}
                        </Badge>
                        {!notification.read && <div className="w-2 h-2 bg-blue-600 rounded-full"></div>}
                      </div>
                    </div>

                    <p className="text-[10px] text-gray-600 dark:text-gray-400 mb-2">{notification.message}</p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-500">
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
    </PlatformLayout>
  )
}
