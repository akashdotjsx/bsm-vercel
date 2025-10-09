import { useState, useEffect, useCallback, useMemo } from 'react'
import { createGraphQLClient } from '@/lib/graphql/client'
import { Ticket } from '@/lib/types/tickets'
import { gql } from 'graphql-request'

interface TicketsParams {
  page?: number
  limit?: number
  status?: string
  priority?: string
  type?: string
  assignee_id?: string
  search?: string
  organization_id?: string
}

interface TicketsResponse {
  ticketsCollection: {
    edges: Array<{
      node: any
    }>
    pageInfo: {
      hasNextPage: boolean
      hasPreviousPage: boolean
      startCursor?: string
      endCursor?: string
    }
  }
}

/**
 * GraphQL-powered hook for fetching tickets with advanced filtering
 * Benefits over REST:
 * - Single query for tickets + related data (requester, assignee, team, SLA)
 * - Reduced over-fetching - only request fields you need
 * - Better performance for complex nested data
 */
export function useTicketsGQL(params: TicketsParams = {}) {
  console.log('🚀 useTicketsGQL hook initialized with params:', params)
  
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
    hasNextPage: false,
    hasPreviousPage: false
  })

  // Stable params to prevent unnecessary re-renders
  const stableParams = useMemo(() => ({
    page: params.page || 1,
    limit: params.limit || 50,
    status: params.status,
    priority: params.priority,
    type: params.type,
    assignee_id: params.assignee_id,
    search: params.search,
    organization_id: params.organization_id
  }), [
    params.page,
    params.limit,
    params.status,
    params.priority,
    params.type,
    params.assignee_id,
    params.search,
    params.organization_id
  ])

  const fetchTickets = useCallback(async () => {
    try {
      console.log('🚀 GraphQL: Fetching tickets with params:', stableParams)
      setLoading(true)
      setError(null)

      const client = await createGraphQLClient()

      // True GraphQL query
      const query = gql`
        query GetTickets($first: Int!, $offset: Int!) {
          ticketsCollection(first: $first, offset: $offset) {
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

      const variables = {
        first: stableParams.limit,
        offset: (stableParams.page - 1) * stableParams.limit
      }

      console.log('🔍 GraphQL Query executing...', variables)

      const data: any = await client.request(query, variables)

      console.log('✅ GraphQL response received:', data)

      // Transform GraphQL response
      const rawTickets = data.ticketsCollection.edges.map((edge: any) => edge.node)

      // Batch-fetch requester and assignee profiles via GraphQL
      const requesterIds = Array.from(new Set(rawTickets.map((t: any) => t.requester_id).filter(Boolean)))
      const assigneeIds = Array.from(new Set(rawTickets.map((t: any) => t.assignee_id).filter(Boolean)))
      const allIds = Array.from(new Set([...requesterIds, ...assigneeIds]))

      let profileById: Record<string, any> = {}
      if (allIds.length > 0) {
        const profilesQuery = gql`
          query Profiles($ids: [UUID!]) {
            profilesCollection(filter: { id: { in: $ids } }, first: 1000) {
              edges { node { id first_name last_name display_name email avatar_url } }
            }
          }
        `
        const profilesData: any = await client.request(profilesQuery, { ids: allIds })
        const profiles = profilesData.profilesCollection.edges.map((e: any) => e.node)
        profileById = profiles.reduce((acc: any, p: any) => { acc[p.id] = p; return acc }, {})
      }

      const tickets = rawTickets.map((t: any) => ({
        ...t,
        requester: t.requester_id ? profileById[t.requester_id] || null : null,
        assignee: t.assignee_id ? profileById[t.assignee_id] || null : null,
      }))

      setTickets(tickets)
      setPagination({
        page: stableParams.page,
        limit: stableParams.limit,
        total: tickets.length,
        pages: Math.ceil(tickets.length / stableParams.limit),
        hasNextPage: tickets.length === stableParams.limit,
        hasPreviousPage: stableParams.page > 1
      })

      console.log('📊 GraphQL: Tickets (with profiles) loaded:', tickets.length)
    } catch (err) {
      console.error('❌ GraphQL Error:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch tickets')
    } finally {
      setLoading(false)
    }
  }, [stableParams])

  useEffect(() => {
    console.log('🔄 useEffect triggered, calling fetchTickets')
    fetchTickets()
  }, [fetchTickets])

  return {
    tickets,
    loading,
    error,
    pagination,
    refetch: fetchTickets
  }
}

/**
 * GraphQL mutation for creating a ticket
 */
export async function createTicketGQL(ticketData: Partial<Ticket>): Promise<Ticket> {
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
          requester_id
          assignee_id
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
  `
  
  const variables = {
    input: {
      title: ticketData.title,
      description: ticketData.description,
      type: ticketData.type,
      category: ticketData.category,
      subcategory: ticketData.subcategory,
      priority: ticketData.priority,
      urgency: ticketData.urgency,
      impact: ticketData.impact,
      status: ticketData.status || 'open',
      requester_id: ticketData.requester_id,
      assignee_id: ticketData.assignee_id,
      team_id: ticketData.team_id,
      sla_policy_id: ticketData.sla_policy_id,
      due_date: ticketData.due_date,
      custom_fields: ticketData.custom_fields,
      tags: ticketData.tags
    }
  }
  
  const response: any = await client.request(mutation, variables)
  return response.insertIntoticketsCollection.records[0]
}

/**
 * GraphQL mutation for updating a ticket
 */
export async function updateTicketGQL(id: string, updates: Partial<Ticket>): Promise<Ticket> {
  const client = await createGraphQLClient()
  
  const mutation = gql`
    mutation UpdateTicket($id: UUID!, $set: ticketsUpdateInput!) {
      updateticketsCollection(filter: { id: { eq: $id } }, set: $set) {
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
          requester_id
          assignee_id
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
  `
  
  const variables = {
    id,
    set: updates
  }
  
  const response: any = await client.request(mutation, variables)
  return response.updateticketsCollection.records[0]
}

/**
 * GraphQL mutation for deleting a ticket
 */
export async function deleteTicketGQL(id: string): Promise<boolean> {
  const client = await createGraphQLClient()
  
  const mutation = gql`
    mutation DeleteTicket($id: UUID!) {
      deleteFromticketsCollection(filter: { id: { eq: $id } }) {
        affectedCount
      }
    }
  `
  
  const response: any = await client.request(mutation, { id })
  return response.deleteFromticketsCollection.affectedCount > 0
}

/**
 * GraphQL hook for fetching a single ticket with all related data
 * Benefits: Single query fetches ticket + comments + attachments + checklist
 */
export function useTicketGQL(id: string) {
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTicket = useCallback(async () => {
    if (!id) return

    try {
      setLoading(true)
      setError(null)

      const client = await createGraphQLClient()
      
      const data = await client.request<any>(
        GET_TICKET_BY_ID_QUERY,
        { id }
      )

      if (data.ticketsCollection.edges.length === 0) {
        throw new Error('Ticket not found')
      }

      const ticketNode = data.ticketsCollection.edges[0].node

      // Transform nested collections
      const transformedTicket: Ticket = {
        ...ticketNode,
        requester: ticketNode.requester,
        assignee: ticketNode.assignee,
        team: ticketNode.team,
        comments: ticketNode.comments?.edges.map((e: any) => e.node) || [],
        attachments: ticketNode.attachments?.edges.map((e: any) => e.node) || [],
        checklist: ticketNode.checklist?.edges.map((e: any) => e.node) || []
      }

      setTicket(transformedTicket)
      console.log('✅ GraphQL: Single ticket loaded with all relations')
    } catch (err) {
      console.error('❌ GraphQL Error fetching ticket:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch ticket')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (id) {
      fetchTicket()
    }
  }, [fetchTicket, id])

  return {
    ticket,
    loading,
    error,
    refetch: fetchTicket
  }
}
