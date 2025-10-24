import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/contexts/auth-context'
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface Notification {
  id: string
  organization_id: string
  user_id: string
  type: 'ticket' | 'workflow' | 'system' | 'info' | 'success' | 'user'
  title: string
  message: string
  read: boolean
  priority: 'high' | 'medium' | 'low'
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export type NotificationFilter = 'all' | 'unread' | 'tickets' | 'workflows' | 'system'

interface UseNotificationsReturn {
  notifications: Notification[]
  loading: boolean
  error: string | null
  unreadCount: number
  fetchNotifications: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  clearNotification: (id: string) => Promise<void>
  clearAllNotifications: () => Promise<void>
  createNotification: (notification: Omit<Notification, 'id' | 'user_id' | 'organization_id' | 'read' | 'created_at' | 'updated_at'>) => Promise<Notification | null>
}

export function useNotifications(): UseNotificationsReturn {
  const { user, organizationId } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)

  const supabase = createClient()

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) {
      setNotifications([])
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100)

      if (fetchError) throw fetchError

      setNotifications(data || [])
    } catch (err) {
      console.error('Error fetching notifications:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications')
    } finally {
      setLoading(false)
    }
  }, [user?.id, supabase])

  // Mark single notification as read
  const markAsRead = useCallback(async (id: string) => {
    if (!user?.id) return

    try {
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id)
        .eq('user_id', user.id)

      if (updateError) throw updateError

      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      )
    } catch (err) {
      console.error('Error marking notification as read:', err)
      setError(err instanceof Error ? err.message : 'Failed to mark as read')
    }
  }, [user?.id, supabase])

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return

    try {
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false)

      if (updateError) throw updateError

      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      )
    } catch (err) {
      console.error('Error marking all as read:', err)
      setError(err instanceof Error ? err.message : 'Failed to mark all as read')
    }
  }, [user?.id, supabase])

  // Clear single notification
  const clearNotification = useCallback(async (id: string) => {
    if (!user?.id) return

    try {
      const { error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (deleteError) throw deleteError

      // Update local state
      setNotifications(prev => prev.filter(n => n.id !== id))
    } catch (err) {
      console.error('Error clearing notification:', err)
      setError(err instanceof Error ? err.message : 'Failed to clear notification')
    }
  }, [user?.id, supabase])

  // Clear all notifications
  const clearAllNotifications = useCallback(async () => {
    if (!user?.id) return

    try {
      const { error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id)

      if (deleteError) throw deleteError

      // Update local state
      setNotifications([])
    } catch (err) {
      console.error('Error clearing all notifications:', err)
      setError(err instanceof Error ? err.message : 'Failed to clear all notifications')
    }
  }, [user?.id, supabase])

  // Create notification (for system use)
  const createNotification = useCallback(async (
    notification: Omit<Notification, 'id' | 'user_id' | 'organization_id' | 'read' | 'created_at' | 'updated_at'>
  ): Promise<Notification | null> => {
    if (!user?.id || !organizationId) return null

    try {
      const { data, error: insertError } = await supabase
        .from('notifications')
        .insert({
          ...notification,
          user_id: user.id,
          organization_id: organizationId,
          read: false,
        })
        .select()
        .single()

      if (insertError) throw insertError

      return data
    } catch (err) {
      console.error('Error creating notification:', err)
      setError(err instanceof Error ? err.message : 'Failed to create notification')
      return null
    }
  }, [user?.id, organizationId, supabase])

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length

  // Setup realtime subscription
  useEffect(() => {
    if (!user?.id) return

    // Initial fetch
    fetchNotifications()

    // Setup realtime subscription
    const realtimeChannel = supabase
      .channel(`notifications:user_id=eq.${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Notification realtime event:', payload)
          
          if (payload.eventType === 'INSERT') {
            setNotifications(prev => [payload.new as Notification, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setNotifications(prev => 
              prev.map(n => n.id === payload.new.id ? payload.new as Notification : n)
            )
          } else if (payload.eventType === 'DELETE') {
            setNotifications(prev => 
              prev.filter(n => n.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe()

    setChannel(realtimeChannel)

    // Cleanup
    return () => {
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel)
      }
    }
  }, [user?.id, fetchNotifications, supabase])

  return {
    notifications,
    loading,
    error,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
    createNotification,
  }
}
