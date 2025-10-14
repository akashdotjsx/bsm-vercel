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
    if (priority === "high") return "text-red-600 dark:text-red-400"
    if (priority === "medium") return "text-orange-600 dark:text-orange-400"
    return "text-muted-foreground"
  }

  const getPriorityBadge = (priority: string) => {
    const colors = {
      high: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      medium: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
      low: "bg-muted text-foreground dark:bg-gray-800/30 dark:text-muted-foreground",
    }
    return colors[priority as keyof typeof colors] || colors.low
  }

  return (
    <PageContent>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Notifications</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Stay updated with system alerts, ticket updates, and workflow notifications
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-sm">
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
        <div className="flex items-center gap-2 pb-4 border-b border-border">
          <Button
            variant={currentFilter === "all" ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilter("all")}
            className="text-sm"
          >
            All ({getCountByType("all")})
          </Button>
          <Button
            variant={currentFilter === "unread" ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilter("unread")}
            className="text-sm"
          >
            Unread ({unreadCount})
          </Button>
          <Button
            variant={currentFilter === "tickets" ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilter("tickets")}
            className="text-sm"
          >
            Tickets ({getCountByType("tickets")})
          </Button>
          <Button
            variant={currentFilter === "workflows" ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilter("workflows")}
            className="text-sm"
          >
            Workflows ({getCountByType("workflows")})
          </Button>
          <Button
            variant={currentFilter === "system" ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilter("system")}
            className="text-sm"
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
                className={`p-4 rounded-lg border transition-colors hover:bg-muted/50 ${
                  notification.read
                    ? "0 dark:bg-gray-900 border-border"
                    : "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-full ${
                      notification.read ? "bg-muted" : "bg-blue-100 dark:bg-blue-900/30"
                    }`}
                  >
                    <IconComponent
                      className={`h-4 w-4 ${getNotificationColor(notification.type, notification.priority)}`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3
                        className={`text-sm font-medium ${
                          notification.read ? "text-foreground" : "text-foreground"
                        }`}
                      >
                        {notification.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Badge className={`text-sm ${getPriorityBadge(notification.priority)}`}>
                          {notification.priority}
                        </Badge>
                        {!notification.read && <div className="w-2 h-2 bg-blue-600 rounded-full"></div>}
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {notification.time}
                      </div>

                      <div className="flex items-center gap-2">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-sm h-6 px-2"
                            onClick={() => markAsRead(notification.id)}
                          >
                            Mark as read
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-sm h-6 px-2"
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
