import { useState, useEffect, useCallback, useMemo } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createGraphQLClient } from '@/lib/graphql/client'
import { gql } from 'graphql-request'

// ============================================
// WORKFLOWS HOOKS
// ============================================

interface WorkflowsParams {
  organization_id?: string
  status?: string
  search?: string
  page?: number
  limit?: number
}

export function useWorkflowsGQL(params: WorkflowsParams = {}) {
  const [workflows, setWorkflows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const stableParams = useMemo(() => params, [
    params.organization_id,
    params.status,
    params.search,
    params.page,
    params.limit
  ])

  const fetchWorkflows = useCallback(async () => {
    try {
      console.log('🚀 API: Fetching workflows with params:', stableParams)
      setLoading(true)
      setError(null)

      // Build query parameters
      const queryParams = new URLSearchParams()
      
      if (stableParams.organization_id) {
        queryParams.set('organization_id', stableParams.organization_id)
      }
      
      if (stableParams.status) {
        queryParams.set('status', stableParams.status)
      }
      
      if (stableParams.search) {
        queryParams.set('search', stableParams.search)
      }
      
      if (stableParams.page) {
        queryParams.set('page', stableParams.page.toString())
      }
      
      if (stableParams.limit) {
        queryParams.set('limit', stableParams.limit.toString())
      }

      const response = await fetch(`/api/workflows?${queryParams.toString()}`)
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch workflows')
      }
      
      const { workflows } = await response.json()
      
      setWorkflows(workflows || [])
      console.log('✅ API: Workflows loaded successfully:', workflows?.length || 0)
    } catch (err: any) {
      console.error('❌ API Error fetching workflows:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch workflows')
    } finally {
      setLoading(false)
    }
  }, [stableParams])

  useEffect(() => {
    fetchWorkflows()
  }, [fetchWorkflows])

  return {
    workflows,
    loading,
    error,
    refetch: fetchWorkflows
  }
}

// Workflow Mutations
export const createWorkflowGQL = async (data: any) => {
  const response = await fetch('/api/workflows', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create workflow')
  }
  
  const { workflow } = await response.json()
  return workflow
}

export const updateWorkflowGQL = async (id: string, data: any) => {
  const response = await fetch('/api/workflows', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...data })
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update workflow')
  }
  
  const { workflow } = await response.json()
  return workflow
}

export const deleteWorkflowGQL = async (id: string) => {
  const response = await fetch(`/api/workflows?id=${id}`, {
    method: 'DELETE'
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete workflow')
  }
}

// ============================================
// ORGANIZATIONS/ACCOUNTS HOOKS
// ============================================

interface OrganizationsParams {
  status?: string
  search?: string
  page?: number
  limit?: number
}

export function useOrganizationsGQL(params: OrganizationsParams = {}) {
  const [organizations, setOrganizations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const stableParams = useMemo(() => params, [
    params.status,
    params.search,
    params.page,
    params.limit
  ])

  const fetchOrganizations = useCallback(async () => {
    try {
      console.log('🚀 GraphQL: Fetching organizations with params:', stableParams)
      setLoading(true)
      setError(null)

      const client = await createGraphQLClient()

      // Build filter based on params
      const filter: any = {}
      
      if (stableParams.status) {
        filter.status = { eq: stableParams.status }
      }
      
      if (stableParams.search) {
        filter.or = [
          { name: { ilike: `%${stableParams.search}%` } },
          { domain: { ilike: `%${stableParams.search}%` } }
        ]
      }

      const query = gql`
        query GetOrganizations($filter: organizationsFilter, $first: Int!, $offset: Int!) {
          organizationsCollection(filter: $filter, first: $first, offset: $offset, orderBy: [{ created_at: DescNullsLast }]) {
            edges {
              node {
                id
                name
                domain
                status
                tier
                health_score
                settings
                created_at
                updated_at
              }
            }
          }
        }
      `

      const variables = {
        filter: Object.keys(filter).length > 0 ? filter : undefined,
        first: stableParams.limit || 100,
        offset: ((stableParams.page || 1) - 1) * (stableParams.limit || 100)
      }

      const data: any = await client.request(query, variables)
      
      if (!data?.organizationsCollection?.edges) {
        console.warn('⚠️ No organizationsCollection.edges in response')
        setOrganizations([])
        setLoading(false)
        return
      }
      
      const transformedOrganizations = data.organizationsCollection.edges.map((edge: any) => edge.node)
      
      setOrganizations(transformedOrganizations)
      console.log('✅ GraphQL: Organizations loaded successfully:', transformedOrganizations.length)
    } catch (err: any) {
      console.error('❌ GraphQL Error fetching organizations:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch organizations')
    } finally {
      setLoading(false)
    }
  }, [stableParams])

  useEffect(() => {
    fetchOrganizations()
  }, [fetchOrganizations])

  return {
    organizations,
    loading,
    error,
    refetch: fetchOrganizations
  }
}

// Organization Mutations
export const createOrganizationGQL = async (data: any) => {
  const client = await createGraphQLClient()
  
  const mutation = gql`
    mutation CreateOrganization($input: organizationsInsertInput!) {
      insertIntoorganizationsCollection(objects: [$input]) {
        records {
          id
          name
          domain
          status
          tier
          health_score
          created_at
        }
      }
    }
  `
  
  // Ensure proper data types for GraphQL - remove settings field that might be causing issues
  const inputData = {
    name: data.name,
    domain: data.domain || null,
    status: data.status || 'active',
    tier: data.tier || 'basic',
    health_score: data.health_score || 100
  }
  
  const result: any = await client.request(mutation, { input: inputData })
  return result.insertIntoorganizationsCollection.records[0]
}

export const updateOrganizationGQL = async (id: string, data: any) => {
  const client = await createGraphQLClient()
  
  const mutation = gql`
    mutation UpdateOrganization($id: UUID!, $set: organizationsUpdateInput!) {
      updateorganizationsCollection(filter: { id: { eq: $id } }, set: $set) {
        records {
          id
          name
          domain
          status
          tier
          health_score
          updated_at
        }
      }
    }
  `
  
  const result: any = await client.request(mutation, { id, set: data })
  return result.updateorganizationsCollection.records[0]
}

export const deleteOrganizationGQL = async (id: string) => {
  const client = await createGraphQLClient()
  
  const mutation = gql`
    mutation DeleteOrganization($id: UUID!) {
      deleteFromorganizationsCollection(filter: { id: { eq: $id } }) {
        records {
          id
        }
      }
    }
  `
  
  await client.request(mutation, { id })
}
