import { useState, useEffect, useCallback, useMemo } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createGraphQLClient } from '@/lib/graphql/client'
import { gql } from 'graphql-request'

// ============================================
// SERVICES HOOKS
// ============================================

interface ServicesParams {
  category_id?: string
  status?: string
  is_requestable?: boolean
  organization_id?: string
  search?: string
  page?: number
  limit?: number
}

export function useServicesGQL(params: ServicesParams = {}) {
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const stableParams = useMemo(() => params, [
    params.category_id,
    params.status,
    params.is_requestable,
    params.organization_id,
    params.search,
    params.page,
    params.limit
  ])

  const fetchServices = useCallback(async () => {
    try {
      console.log('🚀 GraphQL: Fetching services with params:', stableParams)
      setLoading(true)
      setError(null)

      console.log('🔑 Creating GraphQL client for services...')
      const client = await createGraphQLClient()
      console.log('✅ GraphQL client created for services')

      // Build filter based on params
      const filter: any = {}
      
      if (stableParams.category_id) {
        filter.category_id = { eq: stableParams.category_id }
      }
      
      if (stableParams.status) {
        filter.status = { eq: stableParams.status }
      }
      
      if (stableParams.is_requestable !== undefined) {
        filter.is_requestable = { eq: stableParams.is_requestable }
      }
      
      if (stableParams.organization_id) {
        filter.organization_id = { eq: stableParams.organization_id }
      }
      
      if (stableParams.search) {
        filter.or = [
          { name: { ilike: `%${stableParams.search}%` } },
          { description: { ilike: `%${stableParams.search}%` } },
          { short_description: { ilike: `%${stableParams.search}%` } }
        ]
      }

      const query = gql`
        query GetServices($filter: servicesFilter, $first: Int!, $offset: Int!) {
          servicesCollection(filter: $filter, first: $first, offset: $offset, orderBy: [{ name: AscNullsLast }]) {
            edges {
              node {
                id
                name
                description
                icon
                short_description
                is_requestable
                requires_approval
                estimated_delivery_days
                popularity_score
                total_requests
                status
                request_form_config
                category_id
                organization_id
                created_at
                updated_at
                category: service_categories {
                  id
                  name
                  icon
                  description
                }
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

      console.log('🔍 Executing services query with variables:', variables)
      
      let data: any
      try {
        data = await client.request(query, variables)
        console.log('📦 Raw services response:', data)
        console.log('📦 Response type:', typeof data)
        console.log('📦 Response keys:', data ? Object.keys(data) : 'null')
      } catch (requestError: any) {
        console.error('💥 GraphQL Request Error:', requestError)
        console.error('💥 Error name:', requestError?.name)
        console.error('💥 Error message:', requestError?.message)
        console.error('💥 Error response:', requestError?.response)
        console.error('💥 Error request:', requestError?.request)
        throw requestError
      }
      
      if (!data?.servicesCollection?.edges) {
        console.warn('⚠️ No servicesCollection.edges in response')
        setServices([])
        setLoading(false)
        return
      }
      
      const transformedServices = data.servicesCollection.edges.map((edge: any) => ({
        ...edge.node,
        category_name: edge.node.category?.name || 'Uncategorized',
        category_icon: edge.node.category?.icon || 'Package',
        category_color: 'blue'
      }))
      
      setServices(transformedServices)
      console.log('✅ GraphQL: Services loaded successfully:', transformedServices.length, transformedServices)
    } catch (err: any) {
      console.error('❌ GraphQL Error fetching services:', err)
      console.error('Error message:', err?.message)
      console.error('Error response:', err?.response)
      console.error('Error stack:', err?.stack)
      setError(err instanceof Error ? err.message : 'Failed to fetch services')
    } finally {
      setLoading(false)
    }
  }, [stableParams])

  useEffect(() => {
    fetchServices()
  }, [fetchServices])

  return {
    services,
    loading,
    error,
    refetch: fetchServices
  }
}

export function useServiceCategoriesGQL(params: { organization_id?: string; is_active?: boolean } = {}) {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const stableParams = useMemo(() => params, [params.organization_id, params.is_active])

  const fetchCategories = useCallback(async () => {
    try {
      console.log('🚀 GraphQL: Fetching service categories')
      setLoading(true)
      setError(null)

      const client = await createGraphQLClient()
      console.log('✅ GraphQL Client created for service categories')

      const query = gql`
        query GetServiceCategories {
          service_categoriesCollection(orderBy: [{ sort_order: AscNullsLast }, { name: AscNullsLast }]) {
            edges {
              node {
                id
                name
                description
                icon
                color
                sort_order
                is_active
                created_at
                updated_at
                servicesCollection {
                  edges {
                    node {
                      id
                      name
                      description
                      short_description
                      is_requestable
                      requires_approval
                      estimated_delivery_days
                      popularity_score
                      total_requests
                      status
                      created_at
                      updated_at
                    }
                  }
                }
              }
            }
          }
        }
      `

      console.log('🔍 Executing service categories query...')
      
      let data: any
      try {
        data = await client.request(query)
        console.log('📦 Raw GraphQL response:', data)
        console.log('📦 Response type:', typeof data)
        console.log('📦 Response keys:', data ? Object.keys(data) : 'null')
      } catch (requestError: any) {
        console.error('💥 GraphQL Request Error:', requestError)
        console.error('💥 Error name:', requestError?.name)
        console.error('💥 Error message:', requestError?.message)
        console.error('💥 Error response:', requestError?.response)
        console.error('💥 Error request:', requestError?.request)
        throw requestError
      }
      
      if (!data?.service_categoriesCollection?.edges) {
        console.warn('⚠️ No service_categoriesCollection.edges in response')
        setCategories([])
        return
      }
      
      const transformedCategories = data.service_categoriesCollection.edges.map((edge: any) => ({
        ...edge.node,
        services: edge.node.servicesCollection?.edges.map((serviceEdge: any) => serviceEdge.node) || []
      }))
      
      setCategories(transformedCategories)
      console.log('✅ GraphQL: Service categories loaded:', transformedCategories.length, transformedCategories)
    } catch (err) {
      console.error('❌ GraphQL Error fetching service categories:', err)
      console.error('Error details:', JSON.stringify(err, null, 2))
      setError(err instanceof Error ? err.message : 'Failed to fetch service categories')
    } finally {
      setLoading(false)
    }
  }, [stableParams])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  return {
    categories,
    loading,
    error,
    refetch: fetchCategories
  }
}

// ============================================
// SERVICE REQUESTS HOOKS
// ============================================

interface ServiceRequestsParams {
  status?: string
  requester_id?: string
  assignee_id?: string
  service_id?: string
  organization_id?: string
  scope?: 'all' | 'my' | 'team' // all = all requests, my = requester_id filter, team = manager reports
  page?: number
  limit?: number
}

export function useServiceRequestsGQL(params: ServiceRequestsParams = {}) {
  const [serviceRequests, setServiceRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [count, setCount] = useState(0)

  const stableParams = useMemo(() => params, [
    params.status,
    params.requester_id,
    params.assignee_id,
    params.service_id,
    params.organization_id,
    params.scope,
    params.page,
    params.limit
  ])

  const fetchServiceRequests = useCallback(async () => {
    try {
      console.log('🚀 GraphQL: Fetching service requests with params:', stableParams)
      setLoading(true)
      setError(null)

      const client = await createGraphQLClient()

      // Build filter based on params
      const filter: any = {}
      
      if (stableParams.organization_id) {
        filter.organization_id = { eq: stableParams.organization_id }
      }
      
      if (stableParams.status) {
        filter.status = { eq: stableParams.status }
      }
      
      if (stableParams.requester_id) {
        filter.requester_id = { eq: stableParams.requester_id }
      }
      
      if (stableParams.assignee_id) {
        filter.assignee_id = { eq: stableParams.assignee_id }
      }
      
      if (stableParams.service_id) {
        filter.service_id = { eq: stableParams.service_id }
      }

      const query = gql`
        query GetServiceRequests($filter: service_requestsFilter, $first: Int!, $offset: Int!) {
          service_requestsCollection(
            filter: $filter
            orderBy: [{ created_at: DescNullsLast }]
            first: $first
            offset: $offset
          ) {
            edges {
              node {
                id
                request_number
                title
                description
                business_justification
                status
                priority
                urgency
                estimated_delivery_date
                actual_delivery_date
                cost_center
                form_data
                created_at
                updated_at
                service: services {
                  id
                  name
                  icon
                  estimated_delivery_days
                }
                requester: profiles {
                  id
                  first_name
                  last_name
                  display_name
                  email
                  department
                }
                assignee: profiles {
                  id
                  first_name
                  last_name
                  display_name
                  email
                }
                approver: profiles {
                  id
                  first_name
                  last_name
                  display_name
                  email
                }
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
      const transformedRequests = data.service_requestsCollection.edges.map((edge: any) => edge.node)
      
      setServiceRequests(transformedRequests)
      setCount(transformedRequests.length)
      console.log('✅ GraphQL: Service requests loaded successfully:', transformedRequests.length)
    } catch (err) {
      console.error('❌ GraphQL Error fetching service requests:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch service requests')
    } finally {
      setLoading(false)
    }
  }, [stableParams])

  useEffect(() => {
    fetchServiceRequests()
  }, [fetchServiceRequests])

  return {
    serviceRequests,
    count,
    loading,
    error,
    refetch: fetchServiceRequests
  }
}

// ============================================
// ASSETS HOOKS
// ============================================

interface AssetsParams {
  asset_type_id?: string
  status?: string
  criticality?: string
  owner_id?: string
  support_team_id?: string
  organization_id?: string
  search?: string
  tags?: string[]
  page?: number
  limit?: number
}

export function useAssetsGQL(params: AssetsParams = {}) {
  const [assets, setAssets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const stableParams = useMemo(() => params, [
    params.asset_type_id,
    params.status,
    params.criticality,
    params.owner_id,
    params.support_team_id,
    params.organization_id,
    params.search,
    params.tags?.join(','),
    params.page,
    params.limit
  ])

  const fetchAssets = useCallback(async () => {
    try {
      console.log('🔄 GraphQL: Fetching assets with params:', stableParams)
      setLoading(true)
      setError(null)

      const client = await createGraphQLClient()

      const query = gql`
        query GetAssets($first: Int!, $offset: Int!) {
          assetsCollection(first: $first, offset: $offset) {
            edges {
              node {
                id
                name
                asset_tag
                hostname
                ip_address
                status
                criticality
                asset_type_id
                owner_id
                support_team_id
                location
                purchase_date
                warranty_end_date
                attributes
                created_at
                updated_at
              }
            }
          }
        }
      `

      const variables = {
        first: stableParams.limit || 50,
        offset: ((stableParams.page || 1) - 1) * (stableParams.limit || 50)
      }

      const data: any = await client.request(query, variables)
      const transformedAssets = data.assetsCollection.edges.map((edge: any) => edge.node)
      
      setAssets(transformedAssets)
      console.log('✅ GraphQL: Assets loaded successfully:', transformedAssets.length)
    } catch (err) {
      console.error('❌ GraphQL Error fetching assets:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch assets')
    } finally {
      setLoading(false)
    }
  }, [stableParams])

  useEffect(() => {
    fetchAssets()
  }, [fetchAssets])

  return {
    assets,
    loading,
    error,
    refetch: fetchAssets
  }
}

export function useAssetTypesGQL(params: { organization_id?: string; is_active?: boolean } = {}) {
  const [assetTypes, setAssetTypes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const stableParams = useMemo(() => params, [params.organization_id, params.is_active])

  const fetchAssetTypes = useCallback(async () => {
    try {
      console.log('🔄 GraphQL: Fetching asset types')
      setLoading(true)
      setError(null)

      const client = await createGraphQLClient()

      const query = gql`
        query GetAssetTypes {
          asset_typesCollection {
            edges {
              node {
                id
                name
                description
                icon
                attributes_schema
                is_active
                created_at
                updated_at
              }
            }
          }
        }
      `

      const data: any = await client.request(query)
      const transformedTypes = data.asset_typesCollection.edges.map((edge: any) => edge.node)
      
      setAssetTypes(transformedTypes)
      console.log('✅ GraphQL: Asset types loaded:', transformedTypes.length)
    } catch (err) {
      console.error('❌ GraphQL Error fetching asset types:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch asset types')
    } finally {
      setLoading(false)
    }
  }, [stableParams])

  useEffect(() => {
    fetchAssetTypes()
  }, [fetchAssetTypes])

  return {
    assetTypes,
    loading,
    error,
    refetch: fetchAssetTypes
  }
}

// ============================================
// MUTATIONS - SERVICE CATEGORIES
// ============================================

export async function createServiceCategoryGQL(categoryData: any): Promise<any> {
  console.log('🔧 createServiceCategoryGQL - Received data:', categoryData)
  console.log('🔧 createServiceCategoryGQL - organization_id:', categoryData?.organization_id)
  console.log('🔧 createServiceCategoryGQL - organization_id type:', typeof categoryData?.organization_id)
  console.log('🔧 createServiceCategoryGQL - Full data:', JSON.stringify(categoryData, null, 2))
  
  // Ensure organization_id is present
  if (!categoryData.organization_id) {
    throw new Error('organization_id is required for creating service categories')
  }
  
  const client = await createGraphQLClient()
  const mutation = gql`
    mutation CreateServiceCategory($input: service_categoriesInsertInput!) {
      insertIntoservice_categoriesCollection(objects: [$input]) {
        records {
          id
          organization_id
          name
          description
          icon
          color
          is_active
          created_at
          updated_at
        }
      }
    }
  `
  const response: any = await client.request(mutation, { input: categoryData })
  return response.insertIntoservice_categoriesCollection.records[0]
}

export async function updateServiceCategoryGQL(id: string, updates: any): Promise<any> {
  const client = await createGraphQLClient()
  const mutation = gql`
    mutation UpdateServiceCategory($id: UUID!, $set: service_categoriesUpdateInput!) {
      updateservice_categoriesCollection(filter: { id: { eq: $id } }, set: $set) {
        records {
          id
          name
          description
          icon
          color
          is_active
          updated_at
        }
      }
    }
  `
  const response: any = await client.request(mutation, { id, set: updates })
  return response.updateservice_categoriesCollection.records[0]
}

export async function deleteServiceCategoryGQL(id: string): Promise<boolean> {
  const client = await createGraphQLClient()
  const mutation = gql`
    mutation DeleteServiceCategory($id: UUID!) {
      deleteFromservice_categoriesCollection(filter: { id: { eq: $id } }) {
        affectedCount
      }
    }
  `
  const response: any = await client.request(mutation, { id })
  return response.deleteFromservice_categoriesCollection.affectedCount > 0
}

// ============================================
// MUTATIONS - SERVICES
// ============================================

export async function createServiceGQL(serviceData: any): Promise<any> {
  // Ensure organization_id is present
  if (!serviceData.organization_id) {
    throw new Error('organization_id is required for creating services')
  }
  
  const client = await createGraphQLClient()
  
  const mutation = gql`
    mutation CreateService($input: servicesInsertInput!) {
      insertIntoservicesCollection(objects: [$input]) {
        records {
          id
          organization_id
          name
          description
          icon
          short_description
          is_requestable
          requires_approval
          estimated_delivery_days
          popularity_score
          total_requests
          status
          request_form_config
          category_id
          created_at
          updated_at
        }
      }
    }
  `
  
  const response: any = await client.request(mutation, { input: serviceData })
  return response.insertIntoservicesCollection.records[0]
}

export async function updateServiceGQL(id: string, updates: any): Promise<any> {
  const client = await createGraphQLClient()
  
  const mutation = gql`
    mutation UpdateService($id: UUID!, $set: servicesUpdateInput!) {
      updateservicesCollection(filter: { id: { eq: $id } }, set: $set) {
        records {
          id
          name
          description
          icon
          short_description
          is_requestable
          requires_approval
          estimated_delivery_days
          popularity_score
          total_requests
          status
          request_form_config
          category_id
          created_at
          updated_at
        }
      }
    }
  `
  
  const response: any = await client.request(mutation, { id, set: updates })
  return response.updateservicesCollection.records[0]
}

export async function deleteServiceGQL(id: string): Promise<boolean> {
  const client = await createGraphQLClient()
  
  const mutation = gql`
    mutation DeleteService($id: UUID!) {
      deleteFromservicesCollection(filter: { id: { eq: $id } }) {
        affectedCount
      }
    }
  `
  
  const response: any = await client.request(mutation, { id })
  return response.deleteFromservicesCollection.affectedCount > 0
}

// ============================================
// MUTATIONS - SERVICE REQUESTS
// ============================================

export async function createServiceRequestGQL(requestData: any): Promise<any> {
  const client = await createGraphQLClient()
  
  const mutation = gql`
    mutation CreateServiceRequest($input: service_requestsInsertInput!) {
      insertIntoservice_requestsCollection(objects: [$input]) {
        records {
          id
          service_id
          requester_id
          status
          priority
          form_data
          approval_status
          fulfilled_at
          created_at
          updated_at
        }
      }
    }
  `
  
  const response: any = await client.request(mutation, { input: requestData })
  return response.insertIntoservice_requestsCollection.records[0]
}

export async function updateServiceRequestGQL(id: string, updates: any): Promise<any> {
  const client = await createGraphQLClient()
  
  const mutation = gql`
    mutation UpdateServiceRequest($id: UUID!, $set: service_requestsUpdateInput!) {
      updateservice_requestsCollection(filter: { id: { eq: $id } }, set: $set) {
        records {
          id
          service_id
          requester_id
          status
          priority
          form_data
          approval_status
          fulfilled_at
          created_at
          updated_at
        }
      }
    }
  `
  
  const response: any = await client.request(mutation, { id, set: updates })
  return response.updateservice_requestsCollection.records[0]
}

// Service Request Actions - Approve/Reject/Assign/UpdateStatus
export async function approveServiceRequestGQL(id: string, comment?: string): Promise<any> {
  const client = await createGraphQLClient()
  
  const mutation = gql`
    mutation ApproveServiceRequest($id: UUID!, $set: service_requestsUpdateInput!) {
      updateservice_requestsCollection(filter: { id: { eq: $id } }, set: $set) {
        records {
          id
          status
          approval_status
          approved_at
          updated_at
        }
      }
    }
  `
  
  const updates: any = {
    status: 'approved',
    approval_status: 'approved',
    approved_at: new Date().toISOString(),
  }
  
  const response: any = await client.request(mutation, { id, set: updates })
  return response.updateservice_requestsCollection.records[0]
}

export async function rejectServiceRequestGQL(id: string, comment?: string): Promise<any> {
  const client = await createGraphQLClient()
  
  const mutation = gql`
    mutation RejectServiceRequest($id: UUID!, $set: service_requestsUpdateInput!) {
      updateservice_requestsCollection(filter: { id: { eq: $id } }, set: $set) {
        records {
          id
          status
          approval_status
          rejected_at
          updated_at
        }
      }
    }
  `
  
  const updates: any = {
    status: 'rejected',
    approval_status: 'rejected',
    rejected_at: new Date().toISOString(),
  }
  
  const response: any = await client.request(mutation, { id, set: updates })
  return response.updateservice_requestsCollection.records[0]
}

export async function assignServiceRequestGQL(id: string, assigneeId: string, comment?: string): Promise<any> {
  const client = await createGraphQLClient()
  
  const mutation = gql`
    mutation AssignServiceRequest($id: UUID!, $set: service_requestsUpdateInput!) {
      updateservice_requestsCollection(filter: { id: { eq: $id } }, set: $set) {
        records {
          id
          assignee_id
          status
          updated_at
        }
      }
    }
  `
  
  const updates: any = {
    assignee_id: assigneeId,
    status: 'in_progress',
  }
  
  const response: any = await client.request(mutation, { id, set: updates })
  return response.updateservice_requestsCollection.records[0]
}

export async function updateServiceRequestStatusGQL(id: string, status: string, comment?: string): Promise<any> {
  const client = await createGraphQLClient()
  
  const mutation = gql`
    mutation UpdateServiceRequestStatus($id: UUID!, $set: service_requestsUpdateInput!) {
      updateservice_requestsCollection(filter: { id: { eq: $id } }, set: $set) {
        records {
          id
          status
          updated_at
        }
      }
    }
  `
  
  const updates: any = {
    status,
  }
  
  // Set completion timestamp if status is completed
  if (status === 'completed') {
    updates.actual_delivery_date = new Date().toISOString()
  }
  
  const response: any = await client.request(mutation, { id, set: updates })
  return response.updateservice_requestsCollection.records[0]
}

// ============================================
// REACT QUERY HOOKS - SERVICE REQUESTS
// ============================================

export function useApproveServiceRequest() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ requestId, comment }: { requestId: string; comment?: string }) => {
      return await approveServiceRequestGQL(requestId, comment)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-requests'] })
    },
  })
}

export function useRejectServiceRequest() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ requestId, comment }: { requestId: string; comment?: string }) => {
      return await rejectServiceRequestGQL(requestId, comment)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-requests'] })
    },
  })
}

export function useAssignServiceRequest() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ requestId, assigneeId, comment }: { requestId: string; assigneeId: string; comment?: string }) => {
      return await assignServiceRequestGQL(requestId, assigneeId, comment)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-requests'] })
    },
  })
}

export function useUpdateServiceRequestStatus() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ requestId, status, comment }: { requestId: string; status: string; comment?: string }) => {
      return await updateServiceRequestStatusGQL(requestId, status, comment)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-requests'] })
    },
  })
}

// ============================================
// MUTATIONS - ASSETS
// ============================================

export async function createAssetGQL(assetData: any): Promise<any> {
  const client = await createGraphQLClient()
  
  const mutation = gql`
    mutation CreateAsset($input: assetsInsertInput!) {
      insertIntoassetsCollection(objects: [$input]) {
        records {
          id
          name
          asset_tag
          hostname
          ip_address
          status
          criticality
          asset_type_id
          owner_id
          support_team_id
          location
          purchase_date
          warranty_end_date
          attributes
          created_at
          updated_at
        }
      }
    }
  `
  
  const response: any = await client.request(mutation, { input: assetData })
  return response.insertIntoassetsCollection.records[0]
}

export async function updateAssetGQL(id: string, updates: any): Promise<any> {
  const client = await createGraphQLClient()
  
  const mutation = gql`
    mutation UpdateAsset($id: UUID!, $set: assetsUpdateInput!) {
      updateassetsCollection(filter: { id: { eq: $id } }, set: $set) {
        records {
          id
          name
          asset_tag
          hostname
          ip_address
          status
          criticality
          asset_type_id
          owner_id
          support_team_id
          location
          purchase_date
          warranty_end_date
          attributes
          created_at
          updated_at
        }
      }
    }
  `
  
  const response: any = await client.request(mutation, { id, set: updates })
  return response.updateassetsCollection.records[0]
}

export async function deleteAssetGQL(id: string): Promise<boolean> {
  const client = await createGraphQLClient()
  
  const mutation = gql`
    mutation DeleteAsset($id: UUID!) {
      deleteFromassetsCollection(filter: { id: { eq: $id } }) {
        affectedCount
      }
    }
  `
  
  const response: any = await client.request(mutation, { id })
  return response.deleteFromassetsCollection.affectedCount > 0
}

// ============================================
// ASSET STATS HOOK
// ============================================

export function useAssetStatsGQL(organizationId?: string) {
  const [stats, setStats] = useState({
    totalAssets: 0,
    assetsByType: {} as Record<string, number>,
    assetsByStatus: {} as Record<string, number>,
    assetsByCriticality: {} as Record<string, number>,
    recentAssets: [] as any[]
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      console.log('🔄 GraphQL: Fetching asset statistics')
      setLoading(true)
      setError(null)

      const client = await createGraphQLClient()

      const query = gql`
        query GetAssetStats($orgId: UUID) {
          assetsCollection(filter: { organization_id: { eq: $orgId } }, first: 1000) {
            edges {
              node {
                id
                name
                asset_tag
                status
                criticality
                asset_type_id
                created_at
                asset_type: asset_types {
                  name
                }
              }
            }
          }
        }
      `

      const data: any = await client.request(query, { orgId: organizationId })
      const assets = data.assetsCollection.edges.map((edge: any) => edge.node)

      const assetsByType: Record<string, number> = {}
      const assetsByStatus: Record<string, number> = {}
      const assetsByCriticality: Record<string, number> = {}

      assets.forEach((asset: any) => {
        const typeName = asset.asset_type?.name || 'Unknown'
        assetsByType[typeName] = (assetsByType[typeName] || 0) + 1
        assetsByStatus[asset.status] = (assetsByStatus[asset.status] || 0) + 1
        assetsByCriticality[asset.criticality] = (assetsByCriticality[asset.criticality] || 0) + 1
      })

      const recentAssets = assets.slice(0, 10)

      setStats({
        totalAssets: assets.length,
        assetsByType,
        assetsByStatus,
        assetsByCriticality,
        recentAssets
      })

      console.log('✅ GraphQL: Asset stats loaded successfully')
    } catch (err) {
      console.error('❌ GraphQL Error fetching asset stats:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch asset stats')
    } finally {
      setLoading(false)
    }
  }, [organizationId])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  }
}

// ============================================
// BUSINESS SERVICES HOOK
// ============================================

export function useBusinessServicesGQL(organizationId?: string) {
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchServices = useCallback(async () => {
    try {
      console.log('🔄 GraphQL: Fetching business services')
      setLoading(true)
      setError(null)

      const client = await createGraphQLClient()

      const query = gql`
        query GetBusinessServices($orgId: UUID) {
          business_servicesCollection(filter: { organization_id: { eq: $orgId } }) {
            edges {
              node {
                id
                name
                description
                category
                status
                criticality
                sla_target_uptime
                current_uptime
                created_at
                updated_at
              }
            }
          }
        }
      `

      const data: any = await client.request(query, { orgId: organizationId })
      const businessServices = data.business_servicesCollection?.edges.map((edge: any) => edge.node) || []

      setServices(businessServices)
      console.log('✅ GraphQL: Business services loaded:', businessServices.length)
    } catch (err) {
      console.error('❌ GraphQL Error fetching business services:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch business services')
    } finally {
      setLoading(false)
    }
  }, [organizationId])

  useEffect(() => {
    fetchServices()
  }, [fetchServices])

  return {
    services,
    loading,
    error,
    refetch: fetchServices
  }
}

// ============================================
// DISCOVERY RULES HOOK
// ============================================

export function useDiscoveryRulesGQL(organizationId?: string) {
  const [rules, setRules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRules = useCallback(async () => {
    try {
      console.log('🔄 GraphQL: Fetching discovery rules')
      setLoading(true)
      setError(null)

      const client = await createGraphQLClient()

      const query = gql`
        query GetDiscoveryRules($orgId: UUID) {
          discovery_rulesCollection(filter: { organization_id: { eq: $orgId } }) {
            edges {
              node {
                id
                name
                description
                rule_type
                configuration
                is_active
                last_run_at
                next_run_at
                run_count
                success_count
                error_count
                created_at
                updated_at
              }
            }
          }
        }
      `

      const data: any = await client.request(query, { orgId: organizationId })
      const discoveryRules = data.discovery_rulesCollection?.edges.map((edge: any) => edge.node) || []

      setRules(discoveryRules)
      console.log('✅ GraphQL: Discovery rules loaded:', discoveryRules.length)
    } catch (err) {
      console.error('❌ GraphQL Error fetching discovery rules:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch discovery rules')
    } finally {
      setLoading(false)
    }
  }, [organizationId])

  useEffect(() => {
    fetchRules()
  }, [fetchRules])

  return {
    rules,
    loading,
    error,
    refetch: fetchRules
  }
}
