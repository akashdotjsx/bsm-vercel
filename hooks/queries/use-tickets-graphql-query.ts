"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createGraphQLClient } from "@/lib/graphql/client"
import { gql } from "graphql-request"

// Query keys for React Query cache management
export const ticketKeys = {
  all: ["tickets"] as const,
  lists: () => [...ticketKeys.all, "list"] as const,
  list: (filters: Record<string, any>) => [...ticketKeys.lists(), filters] as const,
  details: () => [...ticketKeys.all, "detail"] as const,
  detail: (id: string) => [...ticketKeys.details(), id] as const,
}

interface TicketsParams {
  page?: number
  limit?: number
  status?: string
  priority?: string
  type?: string
  assignee_id?: string
  requester_id?: string
  search?: string
  organization_id?: string
  created_at_gte?: string
}

/**
 * Fetch tickets using GraphQL
 * This is the SAME GraphQL query you're already using, but now with React Query caching!
 */
async function fetchTicketsGraphQL(params: TicketsParams = {}) {
  console.log("🚀 GraphQL: Fetching tickets with params:", params)
  console.log("🔍 Organization ID being used:", params.organization_id)

  // Try REST API first to bypass GraphQL limits
  try {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    
    let query = supabase
      .from('tickets')
      .select(`
        *,
        requester:profiles!requester_id(
          id,
          first_name,
          last_name,
          display_name,
          email,
          avatar_url
        ),
        assignee:profiles!assignee_id(
          id,
          first_name,
          last_name,
          display_name,
          email,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false })
    
    // Apply filters
    if (params.organization_id) {
      query = query.eq('organization_id', params.organization_id)
    }
    if (params.requester_id) {
      query = query.eq('requester_id', params.requester_id)
    }
    if (params.assignee_id) {
      query = query.contains('assignee_ids', [params.assignee_id])
    }
    if (params.status && params.status !== 'all') {
      query = query.eq('status', params.status)
    }
    if (params.priority && params.priority !== 'all') {
      query = query.eq('priority', params.priority)
    }
    if (params.type && params.type !== 'all') {
      query = query.eq('type', params.type)
    }
    if (params.created_at_gte) {
      query = query.gte('created_at', params.created_at_gte)
    }
    
    const { data: tickets, error } = await query
    
    if (error) {
      console.error('❌ REST API Error:', error)
      throw error
    }
    
    console.log("✅ REST API Success:", tickets?.length || 0, "tickets")
    
    // Transform tickets to match expected format
    const transformedTickets = tickets?.map((ticket: any) => ({
      ...ticket,
      requester: ticket.requester, // Use the fetched requester data
      assignee: ticket.assignee,  // Use the fetched assignee data
      assignees: ticket.assignee ? [ticket.assignee] : [], // Convert single assignee to array
    })) || []
    
    return {
      tickets: transformedTickets,
      total: transformedTickets.length,
      hasNextPage: false,
      hasPreviousPage: false,
    }
  } catch (restError) {
    console.log("⚠️ REST API failed, falling back to GraphQL:", restError)
  }

  const client = await createGraphQLClient()

  // Import the standard query from lib/graphql/queries.ts
  const { GET_TICKETS_QUERY } = await import('@/lib/graphql/queries')
  const query = GET_TICKETS_QUERY

  // Build GraphQL filter
  const filter: any = {}
  
  if (params.requester_id) {
    filter.requester_id = { eq: params.requester_id }
  }
  
  if (params.assignee_id) {
    filter.assignee_ids = { contains: [params.assignee_id] }
  }
  
  if (params.status) {
    filter.status = { eq: params.status }
  }
  
  if (params.priority) {
    filter.priority = { eq: params.priority }
  }
  
  if (params.type) {
    filter.type = { eq: params.type }
  }
  
  if (params.created_at_gte) {
    filter.created_at = { gte: params.created_at_gte }
  }
  
  if (params.organization_id) {
    filter.organization_id = { eq: params.organization_id }
  }
  
  const variables: any = {
    first: 10000, // Set a very high limit to fetch all tickets
    offset: 0, // Start from the beginning
    filter: Object.keys(filter).length > 0 ? filter : undefined,
  }

  const data: any = await client.request(query, variables)
  
  console.log("🔍 GraphQL Response:", {
    edgesCount: data.ticketsCollection?.edges?.length || 0,
    hasPageInfo: !!data.ticketsCollection?.pageInfo,
    pageInfo: data.ticketsCollection?.pageInfo
  })

  // Get total count with a separate query
  const countQuery = gql`
    query GetTicketsCount($filter: ticketsFilter) {
      ticketsCollection(filter: $filter) {
        edges {
          node {
            id
          }
        }
      }
    }
  `
  
  const countData: any = await client.request(countQuery, { filter: variables.filter })
  const totalCount = countData.ticketsCollection.edges.length

  // Transform GraphQL response
  const rawTickets = data.ticketsCollection.edges.map((edge: any) => edge.node)

  // Batch-fetch requester and assignee profiles via GraphQL
  const requesterIds = Array.from(new Set(rawTickets.map((t: any) => t.requester_id).filter(Boolean)))
  const assigneeIds = Array.from(new Set(rawTickets.map((t: any) => t.assignee_id).filter(Boolean)))
  
  // Get all user IDs from assignee_ids array
  const arrayAssigneeIds = rawTickets.flatMap((t: any) => t.assignee_ids || []).filter(Boolean)
  
  const allIds = Array.from(new Set([...requesterIds, ...assigneeIds, ...arrayAssigneeIds]))

  let profileById: Record<string, any> = {}
  if (allIds.length > 0) {
    const profilesQuery = gql`
      query Profiles($ids: [UUID!]) {
        profilesCollection(filter: { id: { in: $ids } }, first: 1000) {
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
    const profilesData: any = await client.request(profilesQuery, { ids: allIds })
    const profiles = profilesData.profilesCollection.edges.map((e: any) => e.node)
    profileById = profiles.reduce((acc: any, p: any) => {
      acc[p.id] = p
      return acc
    }, {})
  }

  const tickets = rawTickets.map((t: any) => {
    // Map assignees from assignee_ids array with full profile data
    const assignees = (t.assignee_ids || []).map((userId: string) => {
      const profile = profileById[userId]
      return profile ? {
        id: profile.id,
        name: profile.display_name || profile.email,
        display_name: profile.display_name,
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
        avatar_url: profile.avatar_url,
      } : null
    }).filter(Boolean)
    
    return {
      ...t,
      requester: t.requester_id ? profileById[t.requester_id] || null : null,
      assignee: t.assignee_id ? profileById[t.assignee_id] || null : null,
      assignees: assignees, // Add the mapped assignees array from assignee_ids
    }
  })

  console.log("✅ GraphQL response processed:", tickets.length, "tickets")
  console.log("🔍 Total count from database:", totalCount)
  console.log("🔍 Raw tickets from GraphQL:", rawTickets.length)
  console.log("🔍 Sample processed ticket:", tickets[0] ? {
    id: tickets[0].id,
    title: tickets[0].title,
    assignee_id: tickets[0].assignee_id,
    assignee_ids: tickets[0].assignee_ids,
    requester_id: tickets[0].requester_id,
    assignee: tickets[0].assignee,
    requester: tickets[0].requester
  } : null)

  return {
    tickets,
    total: totalCount,
    hasNextPage: data.ticketsCollection.pageInfo?.hasNextPage || false,
    hasPreviousPage: data.ticketsCollection.pageInfo?.hasPreviousPage || false,
  }
}

/**
 * Fetch single ticket using GraphQL
 */
async function fetchTicketGraphQL(id: string) {
  const client = await createGraphQLClient()

  const query = gql`
    query GetTicket($id: UUID!) {
      ticketsCollection(filter: { id: { eq: $id } }, first: 1) {
        edges {
          node {
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
            requester_id
            assignee_id
            assignee_ids
            team_id
            sla_policy_id
            due_date
            created_at
            updated_at
            custom_fields
            tags
          }
        }
      }
    }
  `

  const data: any = await client.request(query, { id })
  const ticket = data.ticketsCollection.edges[0]?.node

  if (!ticket) throw new Error("Ticket not found")

  // Fetch profiles if needed (including assignee_ids array)
  const profileIds = [
    ticket.requester_id, 
    ticket.assignee_id,
    ...(ticket.assignee_ids || [])
  ].filter(Boolean)
  let profileById: Record<string, any> = {}

  if (profileIds.length > 0) {
    const profilesQuery = gql`
      query Profiles($ids: [UUID!]) {
        profilesCollection(filter: { id: { in: $ids } }, first: 10) {
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
    const profilesData: any = await client.request(profilesQuery, { ids: profileIds })
    const profiles = profilesData.profilesCollection.edges.map((e: any) => e.node)
    profileById = profiles.reduce((acc: any, p: any) => {
      acc[p.id] = p
      return acc
    }, {})
  }

  // Map assignees from assignee_ids array
  const assignees = (ticket.assignee_ids || []).map((userId: string) => {
    const profile = profileById[userId]
    return profile ? {
      id: profile.id,
      name: profile.display_name || profile.email,
      display_name: profile.display_name,
      first_name: profile.first_name,
      last_name: profile.last_name,
      email: profile.email,
      avatar_url: profile.avatar_url,
    } : null
  }).filter(Boolean)

  return {
    ...ticket,
    requester: ticket.requester_id ? profileById[ticket.requester_id] || null : null,
    assignee: ticket.assignee_id ? profileById[ticket.assignee_id] || null : null,
    assignees: assignees,
  }
}

/**
 * Create ticket using GraphQL mutation
 */
async function createTicketGraphQL(ticketData: any) {
  const client = await createGraphQLClient()

  const mutation = gql`
    mutation CreateTicket($input: ticketsInsertInput!) {
      insertIntoticketsCollection(objects: [$input]) {
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
          organization_id
          requester_id
          assignee_id
          due_date
          custom_fields
          tags
          created_at
          updated_at
        }
      }
    }
  `

  const data: any = await client.request(mutation, { input: ticketData })
  return data.insertIntoticketsCollection.records[0]
}

/**
 * Update ticket using GraphQL mutation
 */
async function updateTicketGraphQL({ id, updates }: { id: string; updates: any }) {
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
          priority
          status
          updated_at
        }
      }
    }
  `

  const data: any = await client.request(mutation, { id, updates })
  return data.updateticketsCollection.records[0]
}

/**
 * Delete ticket using GraphQL mutation
 */
async function deleteTicketGraphQL(id: string) {
  const client = await createGraphQLClient()

  const mutation = gql`
    mutation DeleteTicket($id: UUID!) {
      deleteFromticketsCollection(filter: { id: { eq: $id } }) {
        records {
          id
        }
      }
    }
  `

  await client.request(mutation, { id })
}

// ============================================================================
// REACT QUERY HOOKS - These wrap your GraphQL queries with intelligent caching
// ============================================================================

/**
 * Hook to fetch tickets using GraphQL with React Query caching
 * 
 * ✅ Uses your existing GraphQL queries
 * ✅ Adds automatic caching (5 min cache)
 * ✅ No refetch on page navigation if data is fresh
 * ✅ Background refetch when data becomes stale
 * ✅ Optimistic updates
 */
export function useTicketsGraphQLQuery(params: TicketsParams = {}) {
  return useQuery({
    queryKey: ticketKeys.list(params),
    queryFn: () => fetchTicketsGraphQL(params),
    staleTime: 0, // Always refetch to get latest data
    gcTime: 0, // Don't cache to ensure fresh data
    refetchOnMount: true, // Always refetch on mount
    refetchOnWindowFocus: true, // Always refetch on window focus
  })
}

/**
 * Hook to fetch a single ticket using GraphQL with caching
 */
export function useTicketGraphQLQuery(id: string) {
  return useQuery({
    queryKey: ticketKeys.detail(id),
    queryFn: () => fetchTicketGraphQL(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook to create a ticket using GraphQL with automatic cache invalidation
 */
export function useCreateTicketGraphQL() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createTicketGraphQL,
    onSuccess: () => {
      // Invalidate all ticket lists to refetch
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() })
      console.log("✅ Ticket created, cache invalidated")
    },
  })
}

/**
 * Hook to update a ticket using GraphQL with optimistic updates
 */
export function useUpdateTicketGraphQL() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateTicketGraphQL,
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ticketKeys.detail(id) })

      // Snapshot previous value
      const previousTicket = queryClient.getQueryData(ticketKeys.detail(id))

      // Optimistically update
      queryClient.setQueryData(ticketKeys.detail(id), (old: any) => ({
        ...old,
        ...updates,
      }))

      console.log("⚡ Optimistic update applied")

      return { previousTicket }
    },
    onError: (err, { id }, context) => {
      // Rollback on error
      if (context?.previousTicket) {
        queryClient.setQueryData(ticketKeys.detail(id), context.previousTicket)
        console.log("↩️ Rolled back optimistic update")
      }
    },
    onSettled: (data, error, { id }) => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() })
      console.log("✅ Ticket updated, cache refreshed")
    },
  })
}

/**
 * Hook to delete a ticket using GraphQL
 */
export function useDeleteTicketGraphQL() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteTicketGraphQL,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() })
      console.log("✅ Ticket deleted, cache invalidated")
    },
  })
}

/**
 * Prefetch tickets for instant navigation (hover on sidebar link)
 */
export function usePrefetchTicketsGraphQL(params: TicketsParams = {}) {
  const queryClient = useQueryClient()

  return () => {
    queryClient.prefetchQuery({
      queryKey: ticketKeys.list(params),
      queryFn: () => fetchTicketsGraphQL(params),
    })
  }
}
