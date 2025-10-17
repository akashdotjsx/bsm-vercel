"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createGraphQLClient } from "@/lib/graphql/client"
import { gql } from "graphql-request"

// Query keys for My Tickets specific caching
export const myTicketKeys = {
  all: ["my-tickets"] as const,
  lists: () => [...myTicketKeys.all, "list"] as const,
  list: (filters: Record<string, any>) => [...myTicketKeys.lists(), filters] as const,
  details: () => [...myTicketKeys.all, "detail"] as const,
  detail: (id: string) => [...myTicketKeys.details(), id] as const,
  stats: (userId: string) => [...myTicketKeys.all, "stats", userId] as const,
  recent: (userId: string) => [...myTicketKeys.all, "recent", userId] as const,
}

interface MyTicketsParams {
  page?: number
  limit?: number
  status?: string
  priority?: string
  type?: string
  search?: string
  organization_id?: string
  requester_id: string // Required for My Tickets
  dateRange?: {
    from?: string
    to?: string
  }
  sortBy?: 'created_at' | 'updated_at' | 'priority' | 'status' | 'title'
  sortOrder?: 'asc' | 'desc'
  // Advanced filters
  tags?: string[]
  customFields?: Record<string, any>
  hasAttachments?: boolean
  hasComments?: boolean
  isOverdue?: boolean
}

/**
 * Enhanced GraphQL query specifically for My Tickets with advanced filtering
 */
async function fetchMyTicketsGraphQL(params: MyTicketsParams) {
  console.log("🎯 My Tickets GraphQL: Fetching user tickets with params:", params)

  const client = await createGraphQLClient()

  // Enhanced GraphQL query with more fields and better filtering
  const query = gql`
    query GetMyTickets($first: Int!, $offset: Int!, $filter: ticketsFilter, $orderBy: [ticketsOrderBy!]) {
      ticketsCollection(first: $first, offset: $offset, orderBy: $orderBy, filter: $filter) {
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
            # Additional fields for enhanced filtering
            resolution_time
            first_response_time
            satisfaction_rating
            is_escalated
            escalation_reason
          }
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
        totalCount
      }
    }
  `

  // Build comprehensive GraphQL filter
  const filter: any = {
    requester_id: { eq: params.requester_id } // Always filter by requester
  }
  
  // Status filtering
  if (params.status) {
    filter.status = { eq: params.status }
  }
  
  // Priority filtering
  if (params.priority) {
    filter.priority = { eq: params.priority }
  }
  
  // Type filtering
  if (params.type) {
    filter.type = { eq: params.type }
  }
  
  // Search filtering (title, description, ticket_number)
  if (params.search) {
    filter.or = [
      { title: { ilike: `%${params.search}%` } },
      { description: { ilike: `%${params.search}%` } },
      { ticket_number: { ilike: `%${params.search}%` } }
    ]
  }
  
  // Date range filtering
  if (params.dateRange?.from || params.dateRange?.to) {
    filter.created_at = {}
    if (params.dateRange.from) {
      filter.created_at.gte = params.dateRange.from
    }
    if (params.dateRange.to) {
      filter.created_at.lte = params.dateRange.to
    }
  }
  
  // Tags filtering
  if (params.tags && params.tags.length > 0) {
    filter.tags = { contains: params.tags }
  }
  
  // Has attachments filtering
  if (params.hasAttachments !== undefined) {
    // This would need to be implemented based on your attachment system
    // filter.attachments_count = params.hasAttachments ? { gt: 0 } : { eq: 0 }
  }
  
  // Overdue filtering
  if (params.isOverdue) {
    filter.and = [
      { due_date: { lt: new Date().toISOString() } },
      { status: { nin: ['resolved', 'closed', 'cancelled'] } }
    ]
  }

  // Build order by clause
  const orderBy = []
  if (params.sortBy) {
    orderBy.push({ [params.sortBy]: params.sortOrder || 'desc' })
  } else {
    orderBy.push({ created_at: 'desc' }) // Default sort
  }

  const variables: any = {
    first: params.limit || 50,
    offset: ((params.page || 1) - 1) * (params.limit || 50),
    filter,
    orderBy
  }

  const data: any = await client.request(query, variables)

  // Transform GraphQL response
  const rawTickets = data.ticketsCollection.edges.map((edge: any) => edge.node)

  // Batch-fetch requester and assignee profiles
  const requesterIds = Array.from(new Set(rawTickets.map((t: any) => t.requester_id).filter(Boolean)))
  const assigneeIds = Array.from(new Set(rawTickets.map((t: any) => t.assignee_id).filter(Boolean)))
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
              role
              department
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
        role: profile.role,
        department: profile.department,
      } : null
    }).filter(Boolean)
    
    return {
      ...t,
      requester: t.requester_id ? profileById[t.requester_id] || null : null,
      assignee: t.assignee_id ? profileById[t.assignee_id] || null : null,
      assignees: assignees,
    }
  })

  console.log("✅ My Tickets GraphQL response processed:", tickets.length, "tickets")

  return {
    tickets,
    total: data.ticketsCollection.totalCount || tickets.length,
    hasNextPage: data.ticketsCollection.pageInfo?.hasNextPage || false,
    hasPreviousPage: data.ticketsCollection.pageInfo?.hasPreviousPage || false,
    pageInfo: data.ticketsCollection.pageInfo,
  }
}

/**
 * Get My Tickets statistics (counts by status, priority, etc.)
 */
async function fetchMyTicketsStatsGraphQL(userId: string) {
  console.log("📊 My Tickets Stats: Fetching statistics for user:", userId)

  const client = await createGraphQLClient()

  const query = gql`
    query GetMyTicketsStats($requesterId: UUID!) {
      # Total count
      totalTickets: ticketsCollection(filter: { requester_id: { eq: $requesterId } }) {
        totalCount
      }
      
      # By status
      statusCounts: ticketsCollection(filter: { requester_id: { eq: $requesterId } }) {
        edges {
          node {
            status
          }
        }
      }
      
      # By priority
      priorityCounts: ticketsCollection(filter: { requester_id: { eq: $requesterId } }) {
        edges {
          node {
            priority
          }
        }
      }
      
      # By type
      typeCounts: ticketsCollection(filter: { requester_id: { eq: $requesterId } }) {
        edges {
          node {
            type
          }
        }
      }
      
      # Overdue tickets
      overdueTickets: ticketsCollection(
        filter: { 
          requester_id: { eq: $requesterId }
          and: [
            { due_date: { lt: "${new Date().toISOString()}" } }
            { status: { nin: ["resolved", "closed", "cancelled"] } }
          ]
        }
      ) {
        totalCount
      }
      
      # Recent tickets (last 7 days)
      recentTickets: ticketsCollection(
        filter: { 
          requester_id: { eq: $requesterId }
          created_at: { gte: "${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()}" }
        }
      ) {
        totalCount
      }
    }
  `

  const data: any = await client.request(query, { requesterId: userId })

  // Process counts
  const statusCounts = data.statusCounts.edges.reduce((acc: any, edge: any) => {
    const status = edge.node.status
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {})

  const priorityCounts = data.priorityCounts.edges.reduce((acc: any, edge: any) => {
    const priority = edge.node.priority
    acc[priority] = (acc[priority] || 0) + 1
    return acc
  }, {})

  const typeCounts = data.typeCounts.edges.reduce((acc: any, edge: any) => {
    const type = edge.node.type
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {})

  return {
    total: data.totalTickets.totalCount,
    statusCounts,
    priorityCounts,
    typeCounts,
    overdue: data.overdueTickets.totalCount,
    recent: data.recentTickets.totalCount,
  }
}

/**
 * Get recent My Tickets (last 10 tickets)
 */
async function fetchRecentMyTicketsGraphQL(userId: string, limit: number = 10) {
  console.log("🕒 Recent My Tickets: Fetching recent tickets for user:", userId)

  const client = await createGraphQLClient()

  const query = gql`
    query GetRecentMyTickets($requesterId: UUID!, $first: Int!) {
      ticketsCollection(
        filter: { requester_id: { eq: $requesterId } }
        orderBy: [{ created_at: DescNullsLast }]
        first: $first
      ) {
        edges {
          node {
            id
            ticket_number
            title
            status
            priority
            type
            created_at
            updated_at
          }
        }
      }
    }
  `

  const data: any = await client.request(query, { requesterId: userId, first: limit })
  return data.ticketsCollection.edges.map((edge: any) => edge.node)
}

// ============================================================================
// REACT QUERY HOOKS FOR MY TICKETS
// ============================================================================

/**
 * Hook to fetch My Tickets with advanced filtering
 */
export function useMyTicketsGraphQLQuery(params: MyTicketsParams) {
  return useQuery({
    queryKey: myTicketKeys.list(params),
    queryFn: () => fetchMyTicketsGraphQL(params),
    staleTime: 2 * 60 * 1000, // 2 minutes - shorter cache for user-specific data
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: "always",
    enabled: !!params.requester_id, // Only run if we have a user ID
  })
}

/**
 * Hook to fetch My Tickets statistics
 */
export function useMyTicketsStatsGraphQLQuery(userId: string) {
  return useQuery({
    queryKey: myTicketKeys.stats(userId),
    queryFn: () => fetchMyTicketsStatsGraphQL(userId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!userId,
  })
}

/**
 * Hook to fetch recent My Tickets
 */
export function useRecentMyTicketsGraphQLQuery(userId: string, limit: number = 10) {
  return useQuery({
    queryKey: myTicketKeys.recent(userId),
    queryFn: () => fetchRecentMyTicketsGraphQL(userId, limit),
    staleTime: 1 * 60 * 1000, // 1 minute - very fresh for recent data
    enabled: !!userId,
  })
}

/**
 * Prefetch My Tickets for instant navigation
 */
export function usePrefetchMyTicketsGraphQL(params: MyTicketsParams) {
  const queryClient = useQueryClient()

  return () => {
    queryClient.prefetchQuery({
      queryKey: myTicketKeys.list(params),
      queryFn: () => fetchMyTicketsGraphQL(params),
    })
  }
}

/**
 * Utility function to build My Tickets filter parameters
 */
export function buildMyTicketsParams(
  userId: string,
  filters: {
    search?: string
    status?: string
    priority?: string
    type?: string
    dateRange?: { from?: string; to?: string }
    sortBy?: 'created_at' | 'updated_at' | 'priority' | 'status' | 'title'
    sortOrder?: 'asc' | 'desc'
    page?: number
    limit?: number
  } = {}
): MyTicketsParams {
  return {
    requester_id: userId,
    page: filters.page || 1,
    limit: filters.limit || 50,
    search: filters.search,
    status: filters.status,
    priority: filters.priority,
    type: filters.type,
    dateRange: filters.dateRange,
    sortBy: filters.sortBy || 'created_at',
    sortOrder: filters.sortOrder || 'desc',
  }
}

/**
 * Utility function to get filter summary for UI display
 */
export function getMyTicketsFilterSummary(params: MyTicketsParams): string[] {
  const summary: string[] = []
  
  if (params.search) summary.push(`Search: "${params.search}"`)
  if (params.status) summary.push(`Status: ${params.status}`)
  if (params.priority) summary.push(`Priority: ${params.priority}`)
  if (params.type) summary.push(`Type: ${params.type}`)
  if (params.dateRange?.from) summary.push(`From: ${params.dateRange.from}`)
  if (params.dateRange?.to) summary.push(`To: ${params.dateRange.to}`)
  if (params.tags?.length) summary.push(`Tags: ${params.tags.join(', ')}`)
  if (params.isOverdue) summary.push('Overdue only')
  
  return summary
}

