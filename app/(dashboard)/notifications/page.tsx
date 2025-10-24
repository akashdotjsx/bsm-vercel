"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/contexts/auth-context'
import { useTheme } from 'next-themes'
import { PageContent } from '@/components/layout/page-content'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useNotificationsGQL } from '@/hooks/use-notifications-gql'
import { formatDistanceToNow } from 'date-fns'
import { Bell, Check, CheckCheck, Trash2, Filter } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function NotificationsPage() {
  const { user, profile } = useAuth()
  const { theme } = useTheme()
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    isMarkingAsRead,
    isMarkingAllAsRead,
    isDeleting
  } = useNotificationsGQL(
    profile?.organization_id || '',
    user?.id || ''
  )

  // Filter notifications based on selected filters
  const filteredNotifications = notifications.filter(notification => {
    const matchesReadFilter = filter === 'all' || 
      (filter === 'unread' && !notification.read) || 
      (filter === 'read' && notification.read)
    
    const matchesTypeFilter = typeFilter === 'all' || notification.type === typeFilter
    
    return matchesReadFilter && matchesTypeFilter
  })

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId)
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead()
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId)
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ticket':
        return '🎫'
      case 'system':
        return '⚙️'
      case 'workflow':
        return '🔄'
      case 'info':
        return '📢'
      default:
        return '📢'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'ticket':
        return 'Ticket'
      case 'system':
        return 'System'
      case 'workflow':
        return 'Workflow'
      case 'info':
        return 'Info'
      default:
        return 'Notification'
    }
  }

  if (!user || !profile) {
    return (
      <PageContent
        title="Notifications"
        description="Manage your notifications"
      >
        <div className="text-center py-8">
          <p className="text-gray-500">Please log in to view notifications</p>
        </div>
      </PageContent>
    )
  }

  return (
    <PageContent
      title="Notifications"
      description="Manage your notifications and stay updated"
    >
      <div className="space-y-6">
        {/* Header with filters and actions */}
        <Card 
          className="border shadow-lg" 
          style={{ 
            backgroundColor: theme === 'dark' ? '#1e2024' : '#ffffff',
            color: theme === 'dark' ? '#ffffff' : '#000000'
          }}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Bell className="h-5 w-5" />
                <div>
                  <CardTitle className="text-lg">Notifications</CardTitle>
                  <p className="text-sm text-gray-600">
                    {unreadCount} unread notifications
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    disabled={isMarkingAllAsRead}
                  >
                    <CheckCheck className="h-4 w-4 mr-2" />
                    Mark all read
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4" />
                <span className="text-sm font-medium">Filters:</span>
              </div>
              <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="ticket">Ticket</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="workflow">Workflow</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        <Card 
          className="border shadow-lg" 
          style={{ 
            backgroundColor: theme === 'dark' ? '#1e2024' : '#ffffff',
            color: theme === 'dark' ? '#ffffff' : '#000000'
          }}
        >
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading notifications...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {filter === 'all' ? 'No notifications yet' : 'No notifications match your filter'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {filter === 'all' 
                    ? 'You\'ll receive notifications when tickets are created or assigned to you.'
                    : 'Try adjusting your filters to see more notifications.'
                  }
                </p>
              </div>
            ) : (
              <ScrollArea className="h-96">
                <div className="space-y-1">
                  {filteredNotifications.map((notification, index) => (
                    <div key={notification.id}>
                      <div className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                        !notification.read ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500' : ''
                      }`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-3 mb-2">
                              <span className="text-2xl">
                                {getTypeIcon(notification.type)}
                              </span>
                              <div className="flex-1 min-w-0">
                                <h4 className={`text-sm font-medium ${
                                  !notification.read ? 'text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'
                                }`}>
                                  {notification.title}
                                </h4>
                                <div className="flex items-center space-x-2 mt-1">
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs ${getPriorityColor(notification.priority)}`}
                                  >
                                    {notification.priority}
                                  </Badge>
                                  <Badge variant="secondary" className="text-xs">
                                    {getTypeLabel(notification.type)}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                              </span>
                              <div className="flex items-center space-x-2">
                                {!notification.read && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleMarkAsRead(notification.id)}
                                    disabled={isMarkingAsRead}
                                    className="text-xs"
                                  >
                                    <Check className="h-3 w-3 mr-1" />
                                    Mark read
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteNotification(notification.id)}
                                  disabled={isDeleting}
                                  className="text-red-500 hover:text-red-700 text-xs"
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      {index < filteredNotifications.length - 1 && <Separator />}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContent>
  )
}