// Assets API client using HTTP requests instead of direct Supabase calls
// This follows the same pattern as tickets API

// Types
export interface AssetType {
  id: string
  organization_id: string
  name: string
  description?: string
  icon?: string
  color?: string
  schema_definition?: Record<string, any>
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Asset {
  id: string
  organization_id: string
  asset_type_id: string
  asset_tag: string
  name: string
  hostname?: string
  ip_address?: string
  mac_address?: string
  serial_number?: string
  model?: string
  manufacturer?: string
  operating_system?: string
  os_version?: string
  cpu_info?: string
  memory_gb?: number
  storage_gb?: number
  location?: string
  owner_id?: string
  support_team_id?: string
  status: 'active' | 'inactive' | 'maintenance' | 'retired' | 'disposed'
  criticality: 'critical' | 'high' | 'medium' | 'low'
  lifecycle_stage: 'planning' | 'development' | 'testing' | 'production' | 'retiring' | 'retired'
  purchase_date?: string
  warranty_expiry?: string
  cost?: number
  depreciation_rate?: number
  custom_fields?: Record<string, any>
  tags?: string[]
  discovered_by?: string
  last_discovered_at?: string
  last_seen_at: string
  created_at: string
  updated_at: string
  created_by?: string
  updated_by?: string
  // Joined fields
  asset_type?: AssetType
  owner?: { id: string; display_name: string; email: string }
  support_team?: { id: string; name: string }
}

export interface AssetRelationship {
  id: string
  organization_id: string
  source_asset_id: string
  target_asset_id: string
  relationship_type: 'depends_on' | 'contains' | 'installed_on' | 'connected_to' | 'manages' | 'backs_up' | 'hosts' | 'runs_on' | 'uses'
  description?: string
  weight: number
  is_active: boolean
  discovered_by?: string
  created_at: string
  updated_at: string
  created_by?: string
  // Joined fields
  source_asset?: Asset
  target_asset?: Asset
}

export interface BusinessService {
  id: string
  organization_id: string
  name: string
  description?: string
  category?: string
  owner_id?: string
  support_team_id?: string
  status: 'active' | 'inactive' | 'maintenance' | 'planned'
  criticality: 'critical' | 'high' | 'medium' | 'low'
  sla_target_uptime: number
  current_uptime?: number
  last_outage_at?: string
  recovery_time_objective?: number
  recovery_point_objective?: number
  custom_fields?: Record<string, any>
  tags?: string[]
  created_at: string
  updated_at: string
  created_by?: string
  // Joined fields
  owner?: { id: string; display_name: string; email: string }
  support_team?: { id: string; name: string }
  asset_count?: number
}

export interface DiscoveryRule {
  id: string
  organization_id: string
  name: string
  description?: string
  rule_type: 'network_scan' | 'cloud_api' | 'agent_based' | 'database_query' | 'custom_script'
  configuration: Record<string, any>
  credentials_id?: string
  schedule_cron?: string
  is_active: boolean
  last_run_at?: string
  next_run_at?: string
  run_count: number
  success_count: number
  error_count: number
  last_error?: string
  created_at: string
  updated_at: string
  created_by?: string
  updated_by?: string
}

export interface CreateAssetData {
  asset_type_id: string
  asset_tag: string
  name: string
  hostname?: string
  ip_address?: string
  mac_address?: string
  serial_number?: string
  model?: string
  manufacturer?: string
  operating_system?: string
  os_version?: string
  cpu_info?: string
  memory_gb?: number
  storage_gb?: number
  location?: string
  owner_id?: string
  support_team_id?: string
  status?: Asset['status']
  criticality?: Asset['criticality']
  lifecycle_stage?: Asset['lifecycle_stage']
  purchase_date?: string
  warranty_expiry?: string
  cost?: number
  custom_fields?: Record<string, any>
  tags?: string[]
}

export interface UpdateAssetData extends Partial<CreateAssetData> {}

export interface AssetsFilters {
  page?: number
  limit?: number
  search?: string
  asset_type_id?: string
  status?: string
  criticality?: string
  owner_id?: string
  support_team_id?: string
  tags?: string[]
}


// Asset API class using HTTP calls
export class AssetAPI {
  // Get asset types
  async getAssetTypes(): Promise<AssetType[]> {
    const response = await fetch('/api/asset-types')
    if (!response.ok) {
      throw new Error('Failed to fetch asset types')
    }
    const data = await response.json()
    return data.assetTypes || []
  }

  // Get assets with pagination and filters
  async getAssets(organizationId: string, filters: AssetsFilters = {}): Promise<{
    assets: Asset[]
    pagination: {
      page: number
      limit: number
      total: number
      pages: number
    }
  }> {
    const searchParams = new URLSearchParams()
    
    if (filters.page) searchParams.set('page', filters.page.toString())
    if (filters.limit) searchParams.set('limit', filters.limit.toString())
    if (filters.search) searchParams.set('search', filters.search)
    if (filters.asset_type_id) searchParams.set('asset_type_id', filters.asset_type_id)
    if (filters.status) searchParams.set('status', filters.status)
    if (filters.criticality) searchParams.set('criticality', filters.criticality)
    if (filters.owner_id) searchParams.set('owner_id', filters.owner_id)
    if (filters.support_team_id) searchParams.set('support_team_id', filters.support_team_id)
    if (filters.tags && filters.tags.length > 0) searchParams.set('tags', filters.tags.join(','))

    const response = await fetch(`/api/assets?${searchParams.toString()}`)
    if (!response.ok) {
      throw new Error('Failed to fetch assets')
    }
    return response.json()
  }

  // Create asset
  async createAsset(data: CreateAssetData): Promise<Asset> {
    const response = await fetch('/api/assets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      throw new Error('Failed to create asset')
    }
    const result = await response.json()
    return result.asset
  }

}

// Create and export the API instance
export const assetAPI = new AssetAPI()
