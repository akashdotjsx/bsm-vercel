"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createGraphQLClient } from "@/lib/graphql/client"
import { GET_TICKET_BY_ID_QUERY } from "@/lib/graphql/queries"
import { gql } from "graphql-request"

// Query keys for cache management
export const ticketDetailKeys = {
  all: ["ticketDetails"] as const,
  ticket: (id: string) => [...ticketDetailKeys.all, "ticket", id] as const,
  comments: (id: string) => [...ticketDetailKeys.all, "comments", id] as const,
  attachments: (id: string) => [...ticketDetailKeys.all, "attachments", id] as const,
  checklist: (id: string) => [...ticketDetailKeys.all, "checklist", id] as const,
}

// ============================================================================
// SINGLE TICKET WITH ALL RELATIONS
// ============================================================================

/**
 * Fetch a single ticket with all related data (comments, attachments, checklist)
 */
async function fetchTicketWithDetailsGraphQL(id: string) {
  console.log("🚀 GraphQL: Fetching ticket details for:", id)
  const client = await createGraphQLClient()

  const data: any = await client.request(GET_TICKET_BY_ID_QUERY, { id })
  
  if (!data.ticketsCollection.edges || data.ticketsCollection.edges.length === 0) {
    throw new Error("Ticket not found")
  }

  const ticketNode = data.ticketsCollection.edges[0].node

  // Fetch assignee profiles if assignee_ids exist
  let assignees: any[] = []
  if (ticketNode.assignee_ids && ticketNode.assignee_ids.length > 0) {
    const profilesQuery = gql`
      query GetProfiles($ids: [UUID!]) {
        profilesCollection(filter: { id: { in: $ids } }, first: 100) {
          edges {
            node {
              id
              first_name
              last_name
              display_name
              email
              avatar_url
            }
          }
        }
      }
    `
    const profilesData: any = await client.request(profilesQuery, { ids: ticketNode.assignee_ids })
    assignees = profilesData.profilesCollection.edges.map((e: any) => ({
      id: e.node.id,
      name: e.node.display_name || e.node.email,
      display_name: e.node.display_name,
      first_name: e.node.first_name,
      last_name: e.node.last_name,
      email: e.node.email,
      avatar_url: e.node.avatar_url,
    }))
  }

  // Transform the nested collections
  const ticket = {
    ...ticketNode,
    requester: ticketNode.requester || null,
    assignee: ticketNode.assignee || null,
    assignees: assignees,
    team: ticketNode.team || null,
    comments: ticketNode.comments?.edges.map((e: any) => ({
      ...e.node,
      author: e.node.author || null
    })) || [],
    attachments: ticketNode.attachments?.edges.map((e: any) => ({
      ...e.node,
      uploaded_by: e.node.uploaded_by || null
    })) || [],
    checklist: ticketNode.checklist?.edges.map((e: any) => ({
      ...e.node,
      assignee: e.node.assignee || null
    })) || []
  }

  console.log("✅ GraphQL: Ticket details loaded with all relations")
  return ticket
}

/**
 * Hook to fetch ticket with all details using GraphQL
 */
export function useTicketDetailsGraphQL(id: string) {
  return useQuery({
    queryKey: ticketDetailKeys.ticket(id),
    queryFn: () => fetchTicketWithDetailsGraphQL(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes - fresh data for active tickets
    gcTime: 10 * 60 * 1000, // 10 minutes in cache
  })
}

// ============================================================================
// TICKET UPDATES
// ============================================================================

/**
 * Update ticket using GraphQL mutation
 */
async function updateTicketDetailsGraphQL({ id, updates }: { id: string; updates: any }) {
  const client = await createGraphQLClient()

  const mutation = gql`
    mutation UpdateTicket($id: UUID!, $updates: ticketsUpdateInput!) {
      updateticketsCollection(filter: { id: { eq: $id } }, set: $updates) {
        records {
          id
          ticket_number
          title
          description
          type
          category
          subcategory
          priority
          urgency
          impact
          status
          assignee_id
          assignee_ids
          team_id
          due_date
          custom_fields
          tags
          updated_at
        }
      }
    }
  `

  const data: any = await client.request(mutation, { id, updates })
  return data.updateticketsCollection.records[0]
}

/**
 * Hook to update ticket with optimistic updates
 */
export function useUpdateTicketDetailsGraphQL() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateTicketDetailsGraphQL,
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ticketDetailKeys.ticket(id) })
      const previousTicket = queryClient.getQueryData(ticketDetailKeys.ticket(id))

      queryClient.setQueryData(ticketDetailKeys.ticket(id), (old: any) => ({
        ...old,
        ...updates,
      }))

      return { previousTicket }
    },
    onError: (err, { id }, context) => {
      if (context?.previousTicket) {
        queryClient.setQueryData(ticketDetailKeys.ticket(id), context.previousTicket)
      }
    },
    onSettled: (data, error, { id }) => {
      // Invalidate the specific ticket detail
      queryClient.invalidateQueries({ queryKey: ticketDetailKeys.ticket(id) })
      // Invalidate ALL ticket details
      queryClient.invalidateQueries({ queryKey: ticketDetailKeys.all })
      // CRITICAL: Invalidate ALL ticket LISTS (separate query key namespace)
      queryClient.invalidateQueries({ queryKey: ["tickets"] })
      console.log("✅ Ticket updated - invalidated detail and all ticket lists")
    },
  })
}

// ============================================================================
// COMMENTS
// ============================================================================

/**
 * Add comment to ticket using GraphQL
 */
async function addCommentGraphQL(ticketId: string, content: string, isInternal: boolean = false) {
  const client = await createGraphQLClient()

  const mutation = gql`
    mutation AddComment($input: ticket_commentsInsertInput!) {
      insertIntoticket_commentsCollection(objects: [$input]) {
        records {
          id
          ticket_id
          content
          is_internal
          is_system
          created_at
          author: profiles {
            id
            first_name
            last_name
            display_name
            email
            avatar_url
          }
        }
      }
    }
  `

  const input = {
    ticket_id: ticketId,
    content,
    is_internal: isInternal,
    is_system: false,
  }

  const data: any = await client.request(mutation, { input })
  return data.insertIntoticket_commentsCollection.records[0]
}

/**
 * Hook to add comment with automatic cache update
 */
export function useAddCommentGraphQL(ticketId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ content, isInternal }: { content: string; isInternal?: boolean }) =>
      addCommentGraphQL(ticketId, content, isInternal || false),
    onSuccess: (newComment) => {
      // Optimistically add comment to cache
      queryClient.setQueryData(ticketDetailKeys.ticket(ticketId), (old: any) => {
        if (!old) return old
        return {
          ...old,
          comments: [...(old.comments || []), newComment],
        }
      })
      console.log("✅ Comment added to cache")
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ticketDetailKeys.ticket(ticketId) })
    },
  })
}

// ============================================================================
// ATTACHMENTS
// ============================================================================

/**
 * Add attachment metadata to ticket using GraphQL
 * Note: File upload is handled separately via Supabase Storage
 */
async function addAttachmentMetadataGraphQL(
  ticketId: string,
  filename: string,
  fileSize: number,
  mimeType: string,
  storagePath: string,
  isPublic: boolean = false
) {
  const client = await createGraphQLClient()

  const mutation = gql`
    mutation AddAttachment($input: ticket_attachmentsInsertInput!) {
      insertIntoticket_attachmentsCollection(objects: [$input]) {
        records {
          id
          ticket_id
          filename
          file_size
          mime_type
          storage_path
          is_public
          created_at
          uploaded_by: profiles {
            id
            display_name
          }
        }
      }
    }
  `

  const input = {
    ticket_id: ticketId,
    filename,
    file_size: fileSize,
    mime_type: mimeType,
    storage_path: storagePath,
    is_public: isPublic,
  }

  const data: any = await client.request(mutation, { input })
  return data.insertIntoticket_attachmentsCollection.records[0]
}

/**
 * Hook to add attachment metadata
 */
export function useAddAttachmentGraphQL(ticketId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (attachment: {
      filename: string
      fileSize: number
      mimeType: string
      storagePath: string
      isPublic?: boolean
    }) =>
      addAttachmentMetadataGraphQL(
        ticketId,
        attachment.filename,
        attachment.fileSize,
        attachment.mimeType,
        attachment.storagePath,
        attachment.isPublic || false
      ),
    onSuccess: (newAttachment) => {
      queryClient.setQueryData(ticketDetailKeys.ticket(ticketId), (old: any) => {
        if (!old) return old
        return {
          ...old,
          attachments: [...(old.attachments || []), newAttachment],
        }
      })
      console.log("✅ Attachment added to cache")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ticketDetailKeys.ticket(ticketId) })
    },
  })
}

// ============================================================================
// CHECKLIST
// ============================================================================

/**
 * Add checklist item using GraphQL
 */
async function addChecklistItemGraphQL(
  ticketId: string,
  text: string,
  assigneeId?: string,
  dueDate?: string
) {
  const client = await createGraphQLClient()

  const mutation = gql`
    mutation AddChecklistItem($input: ticket_checklistInsertInput!) {
      insertIntoticket_checklistCollection(objects: [$input]) {
        records {
          id
          ticket_id
          text
          completed
          due_date
          created_at
          updated_at
          assignee: profiles {
            id
            display_name
            email
            avatar_url
          }
        }
      }
    }
  `

  const input: any = {
    ticket_id: ticketId,
    text,
    completed: false,
  }

  if (assigneeId) input.assignee_id = assigneeId
  if (dueDate) input.due_date = dueDate

  const data: any = await client.request(mutation, { input })
  return data.insertIntoticket_checklistCollection.records[0]
}

/**
 * Update checklist item using GraphQL
 */
async function updateChecklistItemGraphQL(
  itemId: string,
  updates: { text?: string; completed?: boolean; assignee_id?: string; due_date?: string }
) {
  const client = await createGraphQLClient()

  const mutation = gql`
    mutation UpdateChecklistItem($id: UUID!, $updates: ticket_checklistUpdateInput!) {
      updateticket_checklistCollection(filter: { id: { eq: $id } }, set: $updates) {
        records {
          id
          ticket_id
          text
          completed
          due_date
          updated_at
          assignee: profiles {
            id
            display_name
            email
            avatar_url
          }
        }
      }
    }
  `

  const data: any = await client.request(mutation, { id: itemId, updates })
  return data.updateticket_checklistCollection.records[0]
}

/**
 * Delete checklist item using GraphQL
 */
async function deleteChecklistItemGraphQL(itemId: string) {
  const client = await createGraphQLClient()

  const mutation = gql`
    mutation DeleteChecklistItem($id: UUID!) {
      deleteFromticket_checklistCollection(filter: { id: { eq: $id } }) {
        records {
          id
        }
      }
    }
  `

  await client.request(mutation, { id: itemId })
}

/**
 * Hook to add checklist item
 */
export function useAddChecklistItemGraphQL(ticketId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ text, assigneeId, dueDate }: { text: string; assigneeId?: string; dueDate?: string }) =>
      addChecklistItemGraphQL(ticketId, text, assigneeId, dueDate),
    onSuccess: (newItem) => {
      queryClient.setQueryData(ticketDetailKeys.ticket(ticketId), (old: any) => {
        if (!old) return old
        return {
          ...old,
          checklist: [...(old.checklist || []), newItem],
        }
      })
      console.log("✅ Checklist item added")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ticketDetailKeys.ticket(ticketId) })
    },
  })
}

/**
 * Hook to update checklist item
 */
export function useUpdateChecklistItemGraphQL(ticketId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ itemId, updates }: { itemId: string; updates: any }) =>
      updateChecklistItemGraphQL(itemId, updates),
    onMutate: async ({ itemId, updates }) => {
      await queryClient.cancelQueries({ queryKey: ticketDetailKeys.ticket(ticketId) })
      const previousTicket = queryClient.getQueryData(ticketDetailKeys.ticket(ticketId))

      queryClient.setQueryData(ticketDetailKeys.ticket(ticketId), (old: any) => {
        if (!old) return old
        return {
          ...old,
          checklist: old.checklist?.map((item: any) =>
            item.id === itemId ? { ...item, ...updates } : item
          ),
        }
      })

      return { previousTicket }
    },
    onError: (err, variables, context) => {
      if (context?.previousTicket) {
        queryClient.setQueryData(ticketDetailKeys.ticket(ticketId), context.previousTicket)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ticketDetailKeys.ticket(ticketId) })
    },
  })
}

/**
 * Hook to delete checklist item
 */
export function useDeleteChecklistItemGraphQL(ticketId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (itemId: string) => deleteChecklistItemGraphQL(itemId),
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: ticketDetailKeys.ticket(ticketId) })
      const previousTicket = queryClient.getQueryData(ticketDetailKeys.ticket(ticketId))

      queryClient.setQueryData(ticketDetailKeys.ticket(ticketId), (old: any) => {
        if (!old) return old
        return {
          ...old,
          checklist: old.checklist?.filter((item: any) => item.id !== itemId),
        }
      })

      return { previousTicket }
    },
    onError: (err, variables, context) => {
      if (context?.previousTicket) {
        queryClient.setQueryData(ticketDetailKeys.ticket(ticketId), context.previousTicket)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ticketDetailKeys.ticket(ticketId) })
    },
  })
}
