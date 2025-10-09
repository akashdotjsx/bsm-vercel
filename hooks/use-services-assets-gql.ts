import { useState, useEffect, useCallback, useMemo } from 'react'
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

      const client = await createGraphQLClient()

      const query = gql`
        query GetServices($first: Int!, $offset: Int!) {
          servicesCollection(first: $first, offset: $offset) {
            edges {
              node {
                id
                name
                description
                icon
                short_description
                detailed_description
                is_requestable
                requires_approval
                estimated_delivery_days
                popularity_score
                total_requests
                status
                form_schema
                category_id
                created_at
                updated_at
              }
            }
          }
        }
      `

      const variables = {
        first: stableParams.limit || 100,
        offset: ((stableParams.page || 1) - 1) * (stableParams.limit || 100)
      }

      const data: any = await client.request(query, variables)
      const transformedServices = data.servicesCollection.edges.map((edge: any) => edge.node)
      
      setServices(transformedServices)
      console.log('✅ GraphQL: Services loaded successfully:', transformedServices.length)
    } catch (err) {
      console.error('❌ GraphQL Error fetching services:', err)
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

      const query = gql`
        query GetServiceCategories {
          service_categoriesCollection {
            edges {
              node {
                id
                name
                description
                icon
                display_order
                is_active
                created_at
                updated_at
              }
            }
          }
        }
      `

      const data: any = await client.request(query)
      const transformedCategories = data.service_categoriesCollection.edges.map((edge: any) => edge.node)
      
      setCategories(transformedCategories)
      console.log('✅ GraphQL: Service categories loaded:', transformedCategories.length)
    } catch (err) {
      console.error('❌ GraphQL Error fetching service categories:', err)
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
                completed_at
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
// MUTATIONS - SERVICES
// ============================================

export async function createServiceGQL(serviceData: any): Promise<any> {
  const client = await createGraphQLClient()
  
  const mutation = gql`
    mutation CreateService($input: servicesInsertInput!) {
      insertIntoservicesCollection(objects: [$input]) {
        records {
          id
          name
          description
          icon
          short_description
          detailed_description
          is_requestable
          requires_approval
          estimated_delivery_days
          popularity_score
          total_requests
          status
          form_schema
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
          detailed_description
          is_requestable
          requires_approval
          estimated_delivery_days
          popularity_score
          total_requests
          status
          form_schema
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
