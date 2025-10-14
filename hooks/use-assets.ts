import { useState, useEffect, useCallback } from 'react'
import { Asset, AssetType, AssetsFilters, CreateAssetData, UpdateAssetData, BusinessService, DiscoveryRule } from '@/lib/types/assets'
// NOTE: This hook uses legacy REST API calls. Consider migrating to GraphQL hooks from use-services-assets-gql.ts
// import { assetAPI } from '@/lib/api/assets' // DEPRECATED - API file deleted, use REST endpoints directly or GraphQL

export function useAssets(organizationId: string, filters: AssetsFilters = {}) {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  })

  const fetchAssets = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      // Direct REST API call (legacy - consider migrating to GraphQL)
      const searchParams = new URLSearchParams()
      if (filters.page) searchParams.set('page', filters.page.toString())
      if (filters.limit) searchParams.set('limit', filters.limit.toString())
      if (filters.search) searchParams.set('search', filters.search)
      if (filters.asset_type_id) searchParams.set('asset_type_id', filters.asset_type_id)
      if (filters.status) searchParams.set('status', filters.status)
      
      const response = await fetch(`/api/assets?${searchParams.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch assets')
      const data = await response.json()
      
      setAssets(data.assets || [])
      setPagination(data.pagination || { page: 1, limit: 50, total: 0, pages: 0 })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch assets')
    } finally {
      setLoading(false)
    }
  }, [organizationId, JSON.stringify(filters)])

  useEffect(() => {
    fetchAssets()
  }, [fetchAssets])

  const createAsset = useCallback(async (data: CreateAssetData) => {
    try {
      const response = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Failed to create asset')
      const result = await response.json()
      const newAsset = result.asset
      setAssets(prev => [newAsset, ...prev])
      return newAsset
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create asset')
      throw err
    }
  }, [organizationId])

  const updateAsset = useCallback(async (id: string, data: UpdateAssetData) => {
    try {
      const response = await fetch(`/api/assets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Failed to update asset')
      const result = await response.json()
      const updatedAsset = result.asset
      setAssets(prev => prev.map(asset => 
        asset.id === id ? updatedAsset : asset
      ))
      return updatedAsset
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update asset')
      throw err
    }
  }, [])

  const deleteAsset = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/assets/${id}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to delete asset')
      setAssets(prev => prev.filter(asset => asset.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete asset')
      throw err
    }
  }, [])

  return {
    assets,
    loading,
    error,
    pagination,
    fetchAssets,
    createAsset,
    updateAsset,
    deleteAsset
  }
}

export function useAsset(id: string) {
  const [asset, setAsset] = useState<Asset | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAsset = useCallback(async () => {
    if (!id) return
    
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/assets/${id}`)
      if (!response.ok) throw new Error('Failed to fetch asset')
      const result = await response.json()
      setAsset(result.asset)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch asset')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchAsset()
  }, [fetchAsset])

  const updateAsset = useCallback(async (data: UpdateAssetData) => {
    try {
      const response = await fetch(`/api/assets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Failed to update asset')
      const result = await response.json()
      const updatedAsset = result.asset
      setAsset(updatedAsset)
      return updatedAsset
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update asset')
      throw err
    }
  }, [id])

  return {
    asset,
    loading,
    error,
    fetchAsset,
    updateAsset
  }
}

export function useAssetTypes(organizationId: string) {
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAssetTypes = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/asset-types')
      if (!response.ok) throw new Error('Failed to fetch asset types')
      const result = await response.json()
      setAssetTypes(result.assetTypes || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch asset types')
    } finally {
      setLoading(false)
    }
  }, [organizationId])

  useEffect(() => {
    fetchAssetTypes()
  }, [fetchAssetTypes])

  return {
    assetTypes,
    loading,
    error,
    fetchAssetTypes
  }
}

export function useAssetRelationships(assetId: string) {
  const [relationships, setRelationships] = useState({
    upstream: [],
    downstream: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRelationships = useCallback(async () => {
    if (!assetId) return

    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/assets/${assetId}/relationships`)
      if (!response.ok) throw new Error('Failed to fetch relationships')
      const data = await response.json()
      setRelationships(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch relationships')
    } finally {
      setLoading(false)
    }
  }, [assetId])

  useEffect(() => {
    fetchRelationships()
  }, [fetchRelationships])

  const createRelationship = useCallback(async (
    organizationId: string,
    sourceAssetId: string,
    targetAssetId: string,
    relationshipType: string,
    description?: string
  ) => {
    try {
      const response = await fetch('/api/asset-relationships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: organizationId,
          source_asset_id: sourceAssetId,
          target_asset_id: targetAssetId,
          relationship_type: relationshipType,
          description
        })
      })
      if (!response.ok) throw new Error('Failed to create relationship')
      fetchRelationships()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create relationship')
      throw err
    }
  }, [fetchRelationships])

  const deleteRelationship = useCallback(async (relationshipId: string) => {
    try {
      const response = await fetch(`/api/asset-relationships/${relationshipId}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to delete relationship')
      fetchRelationships()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete relationship')
      throw err
    }
  }, [fetchRelationships])

  return {
    relationships,
    loading,
    error,
    fetchRelationships,
    createRelationship,
    deleteRelationship
  }
}

export function useBusinessServices(organizationId: string) {
  const [services, setServices] = useState<BusinessService[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await assetAPI.getBusinessServices(organizationId)
      setServices(data)
    } catch (err) {
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
    fetchServices
  }
}

export function useDiscoveryRules(organizationId: string) {
  const [rules, setRules] = useState<DiscoveryRule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRules = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await assetAPI.getDiscoveryRules(organizationId)
      setRules(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch discovery rules')
    } finally {
      setLoading(false)
    }
  }, [organizationId])

  useEffect(() => {
    fetchRules()
  }, [fetchRules])

  const runRule = useCallback(async (ruleId: string) => {
    try {
      await assetAPI.runDiscoveryRule(ruleId)
      fetchRules() // Refresh to get updated last_run_at
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run discovery rule')
      throw err
    }
  }, [fetchRules])

  return {
    rules,
    loading,
    error,
    fetchRules,
    runRule
  }
}

// Utility hook to get asset statistics
export function useAssetStats(organizationId: string) {
  const [stats, setStats] = useState({
    totalAssets: 0,
    assetsByType: {} as Record<string, number>,
    assetsByStatus: {} as Record<string, number>,
    assetsByCriticality: {} as Record<string, number>,
    recentAssets: [] as Asset[]
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch all assets to calculate statistics
      const { assets } = await assetAPI.getAssets(organizationId, { limit: 1000 })
      
      const assetsByType: Record<string, number> = {}
      const assetsByStatus: Record<string, number> = {}
      const assetsByCriticality: Record<string, number> = {}

      assets.forEach(asset => {
        // Count by type
        const typeName = asset.asset_type?.name || 'Unknown'
        assetsByType[typeName] = (assetsByType[typeName] || 0) + 1

        // Count by status
        assetsByStatus[asset.status] = (assetsByStatus[asset.status] || 0) + 1

        // Count by criticality
        assetsByCriticality[asset.criticality] = (assetsByCriticality[asset.criticality] || 0) + 1
      })

      // Get recent assets (last 10)
      const recentAssets = assets.slice(0, 10)

      setStats({
        totalAssets: assets.length,
        assetsByType,
        assetsByStatus,
        assetsByCriticality,
        recentAssets
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch asset statistics')
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
    fetchStats
  }
}