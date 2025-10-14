"use client"

import { useQuery } from "@tanstack/react-query"
import { createGraphQLClient } from "@/lib/graphql/client"
import { gql } from "graphql-request"

export interface SearchResult {
  id: string
  type: 'ticket' | 'user' | 'service' | 'asset'
  title: string
  description: string
  relevance: number
  metadata?: any
}

interface GlobalSearchParams {
  query: string
  searchType?: 'all' | 'tickets' | 'users' | 'services' | 'assets'
  limit?: number
}

interface SearchResponse {
  tickets: SearchResult[]
  users: SearchResult[]
  services: SearchResult[]
  assets: SearchResult[]
  totalCount: number
}

/**
 * Perform global search across all entities using GraphQL
 */
async function performGlobalSearchGraphQL(params: GlobalSearchParams): Promise<SearchResponse> {
  const { query, searchType = 'all', limit = 10 } = params
  
  if (!query || query.length < 2) {
    return { tickets: [], users: [], services: [], assets: [], totalCount: 0 }
  }

  const client = await createGraphQLClient()
  const searchPattern = `%${query}%`
  
  const results: SearchResponse = {
    tickets: [],
    users: [],
    services: [],
    assets: [],
    totalCount: 0
  }

  try {
    // Search tickets
    if (searchType === 'all' || searchType === 'tickets') {
      const ticketsQuery = gql`
        query SearchTickets($pattern: String!, $limit: Int!) {
          ticketsCollection(
            filter: {
              or: [
                { title: { ilike: $pattern } }
                { description: { ilike: $pattern } }
                { ticket_number: { ilike: $pattern } }
              ]
            }
            first: $limit
            orderBy: { created_at: DescNullsLast }
          ) {
            edges {
              node {
                id
                ticket_number
                title
                description
                status
                priority
                created_at
                requester_id
              }
            }
          }
        }
      `

      const ticketsData: any = await client.request(ticketsQuery, { 
        pattern: searchPattern, 
        limit 
      })

      const tickets = ticketsData.ticketsCollection.edges.map((edge: any) => ({
        id: edge.node.id,
        type: 'ticket' as const,
        title: `#${edge.node.ticket_number} - ${edge.node.title}`,
        description: edge.node.description || '',
        relevance: calculateRelevance(query, edge.node.title + ' ' + edge.node.description),
        metadata: {
          status: edge.node.status,
          priority: edge.node.priority,
          ticket_number: edge.node.ticket_number,
          created_at: edge.node.created_at
        }
      }))

      results.tickets = tickets
    }

    // Search users/profiles
    if (searchType === 'all' || searchType === 'users') {
      const usersQuery = gql`
        query SearchUsers($pattern: String!, $limit: Int!) {
          profilesCollection(
            filter: {
              or: [
                { first_name: { ilike: $pattern } }
                { last_name: { ilike: $pattern } }
                { email: { ilike: $pattern } }
                { display_name: { ilike: $pattern } }
              ]
            }
            first: $limit
          ) {
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

      const usersData: any = await client.request(usersQuery, { 
        pattern: searchPattern, 
        limit 
      })

      const users = usersData.profilesCollection.edges.map((edge: any) => ({
        id: edge.node.id,
        type: 'user' as const,
        title: edge.node.display_name || `${edge.node.first_name} ${edge.node.last_name}`,
        description: edge.node.email || '',
        relevance: calculateRelevance(query, `${edge.node.first_name} ${edge.node.last_name} ${edge.node.email}`),
        metadata: {
          email: edge.node.email,
          role: edge.node.role,
          department: edge.node.department,
          avatar_url: edge.node.avatar_url
        }
      }))

      results.users = users
    }

    // Search services
    if (searchType === 'all' || searchType === 'services') {
      const servicesQuery = gql`
        query SearchServices($pattern: String!, $limit: Int!) {
          servicesCollection(
            filter: {
              or: [
                { name: { ilike: $pattern } }
                { description: { ilike: $pattern } }
              ]
            }
            first: $limit
          ) {
            edges {
              node {
                id
                name
                description
                category
                status
                estimated_delivery_days
              }
            }
          }
        }
      `

      const servicesData: any = await client.request(servicesQuery, { 
        pattern: searchPattern, 
        limit 
      })

      const services = servicesData.servicesCollection.edges.map((edge: any) => ({
        id: edge.node.id,
        type: 'service' as const,
        title: edge.node.name,
        description: edge.node.description || '',
        relevance: calculateRelevance(query, edge.node.name + ' ' + edge.node.description),
        metadata: {
          category: edge.node.category,
          status: edge.node.status,
          estimated_delivery_days: edge.node.estimated_delivery_days
        }
      }))

      results.services = services
    }

    // Search assets
    if (searchType === 'all' || searchType === 'assets') {
      const assetsQuery = gql`
        query SearchAssets($pattern: String!, $limit: Int!) {
          assetsCollection(
            filter: {
              or: [
                { name: { ilike: $pattern } }
                { asset_tag: { ilike: $pattern } }
                { serial_number: { ilike: $pattern } }
                { model: { ilike: $pattern } }
              ]
            }
            first: $limit
          ) {
            edges {
              node {
                id
                name
                asset_tag
                serial_number
                model
                manufacturer
                category
                status
                location
              }
            }
          }
        }
      `

      const assetsData: any = await client.request(assetsQuery, { 
        pattern: searchPattern, 
        limit 
      })

      const assets = assetsData.assetsCollection.edges.map((edge: any) => ({
        id: edge.node.id,
        type: 'asset' as const,
        title: edge.node.name || edge.node.model || 'Unnamed Asset',
        description: `${edge.node.manufacturer || ''} ${edge.node.model || ''} - ${edge.node.asset_tag || ''}`.trim(),
        relevance: calculateRelevance(query, `${edge.node.name} ${edge.node.asset_tag} ${edge.node.serial_number} ${edge.node.model}`),
        metadata: {
          asset_tag: edge.node.asset_tag,
          serial_number: edge.node.serial_number,
          category: edge.node.category,
          status: edge.node.status,
          location: edge.node.location
        }
      }))

      results.assets = assets
    }

    // Calculate total count
    results.totalCount = results.tickets.length + results.users.length + 
                        results.services.length + results.assets.length

    return results
  } catch (error) {
    console.error('Global search error:', error)
    throw error
  }
}

/**
 * Calculate relevance score based on query match
 * Higher score = better match
 */
function calculateRelevance(query: string, text: string): number {
  if (!text) return 0
  
  const lowerQuery = query.toLowerCase()
  const lowerText = text.toLowerCase()
  
  // Exact match gets highest score
  if (lowerText === lowerQuery) return 1.0
  
  // Starts with query gets high score
  if (lowerText.startsWith(lowerQuery)) return 0.9
  
  // Contains query as whole word gets good score
  const words = lowerText.split(/\s+/)
  if (words.some(word => word === lowerQuery)) return 0.8
  
  // Contains query gets medium score
  if (lowerText.includes(lowerQuery)) return 0.7
  
  // Fuzzy match based on character overlap
  let matches = 0
  for (const char of lowerQuery) {
    if (lowerText.includes(char)) matches++
  }
  return (matches / lowerQuery.length) * 0.5
}

/**
 * Hook for global search with React Query caching
 */
export function useGlobalSearch(params: GlobalSearchParams) {
  return useQuery({
    queryKey: ['globalSearch', params.query, params.searchType, params.limit],
    queryFn: () => performGlobalSearchGraphQL(params),
    enabled: params.query.length >= 2,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Get all search results as a flat array, sorted by relevance
 */
export function useGlobalSearchResults(params: GlobalSearchParams) {
  const { data, ...rest } = useGlobalSearch(params)
  
  if (!data) {
    return { results: [], ...rest }
  }
  
  // Combine all results and sort by relevance
  const allResults = [
    ...data.tickets,
    ...data.users,
    ...data.services,
    ...data.assets,
  ].sort((a, b) => b.relevance - a.relevance)
  
  return {
    results: allResults,
    byType: data,
    ...rest
  }
}
