import { useState, useEffect, useCallback } from 'react'
import { assetAPI, Asset, AssetType, AssetsFilters, CreateAssetData, UpdateAssetData, BusinessService, DiscoveryRule } from '@/lib/api/assets'

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
      const data = await assetAPI.getAssets(organizationId, filters)
      setAssets(data.assets)
      setPagination(data.pagination)
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
      const newAsset = await assetAPI.createAsset(organizationId, data)
      setAssets(prev => [newAsset, ...prev])
      return newAsset
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create asset')
      throw err
    }
  }, [organizationId])

  const updateAsset = useCallback(async (id: string, data: UpdateAssetData) => {
    try {
      const updatedAsset = await assetAPI.updateAsset(id, data)
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
      await assetAPI.deleteAsset(id)
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
      const data = await assetAPI.getAsset(id)
      setAsset(data)
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
      const updatedAsset = await assetAPI.updateAsset(id, data)
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
      const data = await assetAPI.getAssetTypes(organizationId)
      setAssetTypes(data)
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
      const data = await assetAPI.getAssetRelationships(assetId)
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
      await assetAPI.createAssetRelationship(
        organizationId,
        sourceAssetId,
        targetAssetId,
        relationshipType as any,
        description
      )
      fetchRelationships()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create relationship')
      throw err
    }
  }, [fetchRelationships])

  const deleteRelationship = useCallback(async (relationshipId: string) => {
    try {
      await assetAPI.deleteAssetRelationship(relationshipId)
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