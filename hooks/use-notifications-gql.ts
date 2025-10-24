import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createGraphQLClient } from '@/lib/graphql/client'
import { gql } from 'graphql-request'

// GraphQL Queries
const GET_NOTIFICATIONS_QUERY = gql`
  query GetNotifications($organizationId: UUID!, $userId: UUID!) {
    notificationsCollection(
      filter: { 
        organization_id: { eq: $organizationId }
        user_id: { eq: $userId }
      }
      orderBy: { created_at: DescNullsLast }
      first: 50
    ) {
      edges {
        node {
          id
          type
          title
          message
          read
          priority
          metadata
          created_at
          updated_at
        }
      }
    }
  }
`

const GET_UNREAD_NOTIFICATIONS_COUNT_QUERY = gql`
  query GetUnreadNotificationsCount($organizationId: UUID!, $userId: UUID!) {
    notificationsCollection(
      filter: { 
        organization_id: { eq: $organizationId }
        user_id: { eq: $userId }
        read: { eq: false }
      }
    ) {
      edges {
        node {
          id
        }
      }
    }
  }
`

// GraphQL Mutations
const CREATE_NOTIFICATION_MUTATION = gql`
  mutation CreateNotification($input: notificationsInsertInput!) {
    insertIntonotificationsCollection(objects: [$input]) {
      records {
        id
        type
        title
        message
        read
        priority
        metadata
        created_at
      }
    }
  }
`

const MARK_NOTIFICATION_READ_MUTATION = gql`
  mutation MarkNotificationRead($id: UUID!) {
    updatenotificationsCollection(
      filter: { id: { eq: $id } }
      set: { read: true }
    ) {
      records {
        id
        read
      }
    }
  }
`

const MARK_ALL_NOTIFICATIONS_READ_MUTATION = gql`
  mutation MarkAllNotificationsRead($organizationId: UUID!, $userId: UUID!) {
    updatenotificationsCollection(
      filter: { 
        organization_id: { eq: $organizationId }
        user_id: { eq: $userId }
        read: { eq: false }
      }
      set: { read: true }
    ) {
      records {
        id
        read
      }
    }
  }
`

const DELETE_NOTIFICATION_MUTATION = gql`
  mutation DeleteNotification($id: UUID!) {
    deleteFromnotificationsCollection(filter: { id: { eq: $id } }) {
      records {
        id
      }
    }
  }
`

// Types
export interface Notification {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  priority: string
  metadata: any
  created_at: string
  updated_at: string
}

export interface CreateNotificationInput {
  organization_id: string
  user_id: string
  type: string
  title: string
  message: string
  priority?: string
  metadata?: any
}

// Hooks
export function useNotificationsGQL(organizationId: string, userId: string) {
  const queryClient = useQueryClient()


  const {
    data: notifications = [],
    loading,
    error,
    refetch
  } = useQuery({
    queryKey: ['notifications', organizationId, userId],
    queryFn: async () => {
      const client = await createGraphQLClient()
      const result: any = await client.request(GET_NOTIFICATIONS_QUERY, {
        organizationId,
        userId
      })
      return result.notificationsCollection.edges.map((edge: any) => edge.node)
    },
    enabled: !!organizationId && !!userId,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  })

  const {
    data: unreadCount = 0,
    refetch: refetchUnreadCount
  } = useQuery({
    queryKey: ['notifications-unread-count', organizationId, userId],
    queryFn: async () => {
      const client = await createGraphQLClient()
      const result: any = await client.request(GET_UNREAD_NOTIFICATIONS_COUNT_QUERY, {
        organizationId,
        userId
      })
      return result.notificationsCollection.edges.length
    },
    enabled: !!organizationId && !!userId,
    refetchInterval: 30000,
  })

  const createNotificationMutation = useMutation({
    mutationFn: async (input: CreateNotificationInput) => {
      const client = await createGraphQLClient()
      const result: any = await client.request(CREATE_NOTIFICATION_MUTATION, { input })
      return result.insertIntonotificationsCollection.records[0]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', organizationId, userId] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count', organizationId, userId] })
    }
  })

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const client = await createGraphQLClient()
      const result: any = await client.request(MARK_NOTIFICATION_READ_MUTATION, { id })
      return result.updatenotificationsCollection.records[0]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', organizationId, userId] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count', organizationId, userId] })
    }
  })

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const client = await createGraphQLClient()
      const result: any = await client.request(MARK_ALL_NOTIFICATIONS_READ_MUTATION, {
        organizationId,
        userId
      })
      return result.updatenotificationsCollection.records
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', organizationId, userId] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count', organizationId, userId] })
    }
  })

  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: string) => {
      const client = await createGraphQLClient()
      const result: any = await client.request(DELETE_NOTIFICATION_MUTATION, { id })
      return result.deleteFromnotificationsCollection.records[0]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', organizationId, userId] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count', organizationId, userId] })
    }
  })

  return {
    notifications,
    unreadCount,
    loading,
    error,
    refetch,
    createNotification: createNotificationMutation.mutateAsync,
    markAsRead: markAsReadMutation.mutateAsync,
    markAllAsRead: markAllAsReadMutation.mutateAsync,
    deleteNotification: deleteNotificationMutation.mutateAsync,
    isCreating: createNotificationMutation.isPending,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    isDeleting: deleteNotificationMutation.isPending
  }
}

// Utility functions for creating specific notification types
// NOTE: These functions use GraphQL ONLY - no REST API calls
console.log('🔔 Notification functions loaded')

export const createTicketCreatedNotification = async (
  organizationId: string,
  userId: string,
  ticketData: {
    id: string
    ticket_number: string
    title: string
    requester_id: string
  }
) => {
  console.log('🔔 createTicketCreatedNotification called with:', {
    organizationId,
    userId,
    ticketData
  })
  
  try {
    const client = await createGraphQLClient()
    console.log('🔔 GraphQL client created successfully for ticket created notification')
    
    const notificationInput = {
      organization_id: organizationId,
      user_id: userId,
      type: 'ticket',
      title: 'Ticket Created Successfully',
      message: `Your ticket #${ticketData.ticket_number} "${ticketData.title}" has been created successfully.`,
      priority: 'medium',
      metadata: JSON.stringify({
        ticket_id: ticketData.id,
        ticket_number: ticketData.ticket_number,
        action: 'ticket_created'
      })
    }
    
        console.log('🔔 Ticket created notification input prepared:', notificationInput)
        console.log('🔔 GraphQL mutation being called:', CREATE_NOTIFICATION_MUTATION)
        console.log('🔔 Variables being sent:', { input: notificationInput })
        
        const result: any = await client.request(CREATE_NOTIFICATION_MUTATION, { input: notificationInput })
        console.log('🔔 Ticket created GraphQL mutation result:', result)
    
    const notification = result.insertIntonotificationsCollection.records[0]
    console.log('🔔 Created ticket created notification:', notification)
    
    return notification
  } catch (error: any) {
    console.error('❌ Error in createTicketCreatedNotification:', {
      error,
      message: error?.message,
      stack: error?.stack,
      organizationId,
      userId,
      ticketData
    })
    console.error('❌ Full error details:', error)
    console.error('❌ Error message:', error?.message)
    console.error('❌ Error code:', error?.code)
    console.error('❌ Error details:', error?.details)
    console.error('❌ Error response:', error?.response)
    throw error
  }
}

// NOTE: This function uses GraphQL ONLY - no REST API calls
export const createTicketAssignedNotification = async (
  organizationId: string,
  assigneeId: string,
  ticketData: {
    id: string
    ticket_number: string
    title: string
    priority: string
    requester_id: string
  }
) => {
  console.log('🔔 createTicketAssignedNotification called with:', {
    organizationId,
    assigneeId,
    ticketData
  })
  
  try {
    const client = await createGraphQLClient()
    console.log('🔔 GraphQL client created successfully')
    
    const notificationInput = {
      organization_id: organizationId,
      user_id: assigneeId,
      type: 'ticket',
      title: 'New Ticket Assigned',
      message: `Ticket #${ticketData.ticket_number} "${ticketData.title}" has been assigned to you. Priority: ${ticketData.priority}`,
      priority: ticketData.priority === 'high' ? 'high' : 'medium',
      metadata: JSON.stringify({
        ticket_id: ticketData.id,
        ticket_number: ticketData.ticket_number,
        action: 'ticket_assigned',
        requester_id: ticketData.requester_id
      })
    }
    
        console.log('🔔 Notification input prepared:', notificationInput)
        console.log('🔔 GraphQL mutation being called:', CREATE_NOTIFICATION_MUTATION)
        console.log('🔔 Variables being sent:', { input: notificationInput })
        
        const result: any = await client.request(CREATE_NOTIFICATION_MUTATION, { input: notificationInput })
        console.log('🔔 GraphQL mutation result:', result)
    
    const notification = result.insertIntonotificationsCollection.records[0]
    console.log('🔔 Created notification:', notification)
    
    return notification
  } catch (error: any) {
    console.error('❌ Error in createTicketAssignedNotification:', {
      error,
      message: error?.message,
      stack: error?.stack,
      organizationId,
      assigneeId,
      ticketData
    })
    console.error('❌ Full error details:', error)
    console.error('❌ Error message:', error?.message)
    console.error('❌ Error code:', error?.code)
    console.error('❌ Error details:', error?.details)
    console.error('❌ Error response:', error?.response)
    throw error
  }
}
