"use client"

import { Bell, X, CheckCircle, AlertTriangle, Info, Clock, User, Ticket, Workflow } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useNotifications } from "@/lib/contexts/notification-context"
import Link from "next/link"

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

  const unreadNotifications = notifications.filter((n) => !n.read).slice(0, 5)

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
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 relative hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-150"
        >
          <Bell className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-medium">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {unreadCount} unread
                </Badge>
              )}
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs h-6 px-2">
                  Mark all read
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 mt-3 text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Ticket className="h-3 w-3" />
              <span>Tickets: {getUnreadCountByType("tickets")}</span>
            </div>
            <div className="flex items-center gap-1">
              <Workflow className="h-3 w-3" />
              <span>Workflows: {getUnreadCountByType("workflows")}</span>
            </div>
            <div className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              <span>System: {getUnreadCountByType("system")}</span>
            </div>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {unreadNotifications.length === 0 ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No unread notifications</p>
            </div>
          ) : (
            <div className="space-y-0">
              {unreadNotifications.map((notification) => {
                const IconComponent = iconMap[notification.type]
                return (
                  <div
                    key={notification.id}
                    className="p-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 rounded-full bg-blue-100 dark:bg-blue-900">
                        <IconComponent
                          className={`h-3 w-3 ${getNotificationColor(notification.type, notification.priority)}`}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
                            {notification.title}
                          </h4>
                          <div className="flex items-center gap-1 ml-2">
                            <Badge className={`text-xs ${getPriorityBadge(notification.priority)}`}>
                              {notification.priority}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                clearNotification(notification.id)
                              }}
                              className="h-4 w-4 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                          {notification.message}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            {notification.time}
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                            className="text-xs h-5 px-2"
                          >
                            Mark read
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="p-3 border-t border-gray-100 dark:border-gray-800">
          <Link href="/notifications">
            <Button variant="ghost" className="w-full text-sm">
              View all notifications
            </Button>
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
