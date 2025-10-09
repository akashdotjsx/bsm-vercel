import { useState, useEffect, useCallback, useMemo } from 'react'
import { createGraphQLClient } from '@/lib/graphql/client'
import {
  GET_SERVICES_QUERY,
  GET_SERVICE_CATEGORIES_QUERY,
  GET_SERVICE_REQUESTS_QUERY,
  GET_ASSETS_QUERY,
  GET_ASSET_TYPES_QUERY
} from '@/lib/graphql/queries'

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
      console.log('🔄 GraphQL: Fetching services with params:', stableParams)
      setLoading(true)
      setError(null)

      const client = await createGraphQLClient()

      const filter: any = {}
      
      if (stableParams.organization_id) {
        filter.organization_id = { eq: stableParams.organization_id }
      }
      
      if (stableParams.category_id) {
        filter.category_id = { eq: stableParams.category_id }
      }
      
      if (stableParams.status) {
        filter.status = { eq: stableParams.status }
      }
      
      if (stableParams.is_requestable !== undefined) {
        filter.is_requestable = { eq: stableParams.is_requestable }
      }
      
      if (stableParams.search) {
        filter.or = [
          { name: { ilike: `%${stableParams.search}%` } },
          { description: { ilike: `%${stableParams.search}%` } }
        ]
      }

      const variables = {
        filter: Object.keys(filter).length > 0 ? filter : undefined,
        orderBy: [{ popularity_score: 'DescNullsLast' }, { name: 'AscNullsLast' }],
        first: stableParams.limit || 100,
        offset: ((stableParams.page || 1) - 1) * (stableParams.limit || 100)
      }

      const data = await client.request<any>(GET_SERVICES_QUERY, variables)
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
      console.log('🔄 GraphQL: Fetching service categories')
      setLoading(true)
      setError(null)

      const client = await createGraphQLClient()

      const filter: any = {}
      
      if (stableParams.organization_id) {
        filter.organization_id = { eq: stableParams.organization_id }
      }
      
      if (stableParams.is_active !== undefined) {
        filter.is_active = { eq: stableParams.is_active }
      }

      const variables = {
        filter: Object.keys(filter).length > 0 ? filter : undefined,
        orderBy: [{ display_order: 'AscNullsLast' }, { name: 'AscNullsLast' }]
      }

      const data = await client.request<any>(GET_SERVICE_CATEGORIES_QUERY, variables)
      
      const transformedCategories = data.service_categoriesCollection.edges.map((edge: any) => ({
        ...edge.node,
        services: edge.node.services?.edges.map((e: any) => e.node) || []
      }))
      
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
  service_id?: string
  organization_id?: string
  page?: number
  limit?: number
}

export function useServiceRequestsGQL(params: ServiceRequestsParams = {}) {
  const [serviceRequests, setServiceRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const stableParams = useMemo(() => params, [
    params.status,
    params.requester_id,
    params.service_id,
    params.organization_id,
    params.page,
    params.limit
  ])

  const fetchServiceRequests = useCallback(async () => {
    try {
      console.log('🔄 GraphQL: Fetching service requests with params:', stableParams)
      setLoading(true)
      setError(null)

      const client = await createGraphQLClient()

      const filter: any = {}
      
      if (stableParams.organization_id) {
        filter.organization_id = { eq: stableParams.organization_id }
      }
      
      if (stableParams.status && stableParams.status !== 'all') {
        filter.status = { eq: stableParams.status }
      }
      
      if (stableParams.requester_id) {
        filter.requester_id = { eq: stableParams.requester_id }
      }
      
      if (stableParams.service_id) {
        filter.service_id = { eq: stableParams.service_id }
      }

      const variables = {
        filter: Object.keys(filter).length > 0 ? filter : undefined,
        orderBy: [{ created_at: 'DescNullsLast' }],
        first: stableParams.limit || 50,
        offset: ((stableParams.page || 1) - 1) * (stableParams.limit || 50)
      }

      const data = await client.request<any>(GET_SERVICE_REQUESTS_QUERY, variables)
      const transformedRequests = data.service_requestsCollection.edges.map((edge: any) => edge.node)
      
      setServiceRequests(transformedRequests)
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

      const filter: any = {}
      
      if (stableParams.organization_id) {
        filter.organization_id = { eq: stableParams.organization_id }
      }
      
      if (stableParams.asset_type_id) {
        filter.asset_type_id = { eq: stableParams.asset_type_id }
      }
      
      if (stableParams.status) {
        filter.status = { eq: stableParams.status }
      }
      
      if (stableParams.criticality) {
        filter.criticality = { eq: stableParams.criticality }
      }
      
      if (stableParams.owner_id) {
        filter.owner_id = { eq: stableParams.owner_id }
      }
      
      if (stableParams.support_team_id) {
        filter.support_team_id = { eq: stableParams.support_team_id }
      }
      
      if (stableParams.search) {
        filter.or = [
          { name: { ilike: `%${stableParams.search}%` } },
          { hostname: { ilike: `%${stableParams.search}%` } },
          { ip_address: { ilike: `%${stableParams.search}%` } },
          { asset_tag: { ilike: `%${stableParams.search}%` } }
        ]
      }

      const variables = {
        filter: Object.keys(filter).length > 0 ? filter : undefined,
        orderBy: [{ created_at: 'DescNullsLast' }],
        first: stableParams.limit || 50,
        offset: ((stableParams.page || 1) - 1) * (stableParams.limit || 50)
      }

      const data = await client.request<any>(GET_ASSETS_QUERY, variables)
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

      const filter: any = {}
      
      if (stableParams.organization_id) {
        filter.organization_id = { eq: stableParams.organization_id }
      }
      
      if (stableParams.is_active !== undefined) {
        filter.is_active = { eq: stableParams.is_active }
      }

      const variables = {
        filter: Object.keys(filter).length > 0 ? filter : undefined,
        orderBy: [{ name: 'AscNullsLast' }]
      }

      const data = await client.request<any>(GET_ASSET_TYPES_QUERY, variables)
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
