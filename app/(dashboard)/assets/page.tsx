"use client"

import { useState, useEffect, useMemo } from "react"
import { PageContent } from "@/components/layout/page-content"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Search,
  Plus,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Server,
  Smartphone,
  Cloud,
  Database,
  Network,
  HardDrive,
  Cpu,
  Eye,
  Edit,
  GitBranch,
  Activity,
  Zap,
  Monitor,
  MoreHorizontal,
  FileSpreadsheet,
  FileText,
  ArrowUp,
  ArrowDown,
  Loader2,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog"
import { useAssetsGQL, useAssetTypesGQL, createAssetGQL, updateAssetGQL, deleteAssetGQL, useAssetStatsGQL, useBusinessServicesGQL, useDiscoveryRulesGQL } from "@/hooks/use-services-assets-gql"
import { Asset, CreateAssetData, AssetType } from "@/lib/api/assets"
import { useAuth } from "@/lib/contexts/auth-context"
import { toast } from "@/lib/toast"
import { useDebounce } from "@/hooks/use-debounce"

// Icon mapping for asset types
const iconMap: Record<string, any> = {
  'Server': Server,
  'Workstation': Monitor,
  'Mobile Device': Smartphone,
  'Cloud Resource': Cloud,
  'Database': Database,
  'Network Equipment': Network,
  'Storage': HardDrive,
  'Application': Cpu,
}

export default function AssetManagementPage() {
  const { user } = useAuth()
  const organizationId = user?.user_metadata?.organization_id || "00000000-0000-0000-0000-000000000001"

  // Search and filters
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedAssetType, setSelectedAssetType] = useState<string | null>(null)

  // ✅ FIX: Debounce search to prevent API spam on every keystroke
  const debouncedSearch = useDebounce(searchTerm, 500)

  // Modal states
  const [showAutoDiscoveryModal, setShowAutoDiscoveryModal] = useState(false)
  const [showImportAssetsModal, setShowImportAssetsModal] = useState(false)
  const [showAddAssetModal, setShowAddAssetModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showAssetDetailModal, setShowAssetDetailModal] = useState(false)
  const [showEditAssetModal, setShowEditAssetModal] = useState(false)
  const [showDependenciesModal, setShowDependenciesModal] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [showDeleteAssetDialog, setShowDeleteAssetDialog] = useState(false)
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null)

  // Form data
  const [newAsset, setNewAsset] = useState<CreateAssetData>({
    asset_type_id: "",
    asset_tag: "",
    name: "",
    hostname: "",
    ip_address: "",
    operating_system: "",
    cpu_info: "",
    memory_gb: undefined,
    location: "",
    criticality: "medium",
  })

  // API hooks - GraphQL for reads and writes
  const { assets, loading: assetsLoading, error: assetsError, refetch } = useAssetsGQL({ 
    organization_id: organizationId,
    search: debouncedSearch, // ✅ Use debounced search to prevent API spam
    asset_type_id: selectedType !== "all" ? selectedType : undefined,
    status: selectedStatus !== "all" ? selectedStatus : undefined,
  })
  
  // GraphQL mutations for write operations
  const createAsset = async (data: any) => {
    try {
      const result = await createAssetGQL(data)
      refetch()
      toast.success('Asset created successfully!')
      return result
    } catch (error) {
      toast.error('Failed to create asset', {
        description: error instanceof Error ? error.message : 'An error occurred'
      })
      throw error
    }
  }
  
  const updateAsset = async (id: string, data: any) => {
    try {
      const result = await updateAssetGQL(id, data)
      refetch()
      toast.success('Asset updated successfully!')
      return result
    } catch (error) {
      toast.error('Failed to update asset', {
        description: error instanceof Error ? error.message : 'An error occurred'
      })
      throw error
    }
  }
  
  const deleteAsset = async (id: string) => {
    try {
      await deleteAssetGQL(id)
      refetch()
      toast.error('Asset deleted', 'The asset has been removed from the inventory')
    } catch (error) {
      toast.error('Failed to delete asset', error instanceof Error ? error.message : 'An error occurred')
      throw error
    }
  }

  const { assetTypes, loading: typesLoading } = useAssetTypesGQL({ organization_id: organizationId })
  const { stats, loading: statsLoading } = useAssetStatsGQL(organizationId)
  const { services, loading: servicesLoading } = useBusinessServicesGQL(organizationId)
  const { rules, loading: rulesLoading } = useDiscoveryRulesGQL(organizationId)

  const getStatusColor = (status: string | undefined | null) => {
    if (!status) return "bg-muted text-foreground dark:bg-gray-900 dark:text-gray-300"
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "maintenance":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "inactive":
      case "retired":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default:
        return "bg-muted text-foreground dark:bg-gray-900 dark:text-gray-300"
    }
  }

  const getCriticalityColor = (criticality: string | undefined | null) => {
    if (!criticality) return "bg-muted text-foreground dark:bg-gray-900 dark:text-gray-300"
    switch (criticality.toLowerCase()) {
      case "critical":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      case "high":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      default:
        return "bg-muted text-foreground dark:bg-gray-900 dark:text-gray-300"
    }
  }

  const handleAssetAction = (action: string, asset?: Asset) => {
    setSelectedAsset(asset || null)
    switch (action) {
      case "view_details":
        setShowAssetDetailModal(true)
        break
      case "edit_asset":
        if (asset) {
          setNewAsset({
            asset_type_id: asset.asset_type_id,
            asset_tag: asset.asset_tag,
            name: asset.name,
            hostname: asset.hostname || "",
            ip_address: asset.ip_address || "",
            operating_system: asset.operating_system || "",
            cpu_info: asset.cpu_info || "",
            memory_gb: asset.memory_gb,
            location: asset.location || "",
            criticality: asset.criticality,
          })
        }
        setShowEditAssetModal(true)
        break
      case "view_dependencies":
        setShowDependenciesModal(true)
        break
    }
  }

  const handleAddAsset = async () => {
    try {
      await createAsset(newAsset)
      setShowAddAssetModal(false)
      setNewAsset({
        asset_type_id: "",
        asset_tag: "",
        name: "",
        hostname: "",
        ip_address: "",
        operating_system: "",
        cpu_info: "",
        memory_gb: undefined,
        location: "",
        criticality: "medium",
      })
    } catch (error) {
      // Error already handled in createAsset function
    }
  }

  const handleUpdateAsset = async () => {
    if (selectedAsset) {
      try {
        await updateAsset(selectedAsset.id, newAsset)
        setShowEditAssetModal(false)
        setSelectedAsset(null)
      } catch (error) {
        // Error already handled in updateAsset function
      }
    }
  }

  const handleDeleteAsset = (asset: Asset) => {
    setAssetToDelete(asset)
    setShowDeleteAssetDialog(true)
  }

  const confirmDeleteAsset = async () => {
    if (!assetToDelete) return
    try {
      await deleteAsset(assetToDelete.id)
      setShowDeleteAssetDialog(false)
      setAssetToDelete(null)
    } catch (error) {
      // Error already handled in deleteAsset function
    }
  }

  const generateAssetTag = (assetTypeName: string) => {
    const prefix = assetTypeName.substring(0, 3).toUpperCase()
    const timestamp = Date.now().toString().slice(-6)
    return `${prefix}-${timestamp}`
  }

  // ✅ FIX: Memoize asset type cards to prevent recreation on every render
  const assetTypeCards = useMemo(() => {
    return assetTypes.map((type: AssetType) => {
      const count = stats.assetsByType[type.name] || 0
      const Icon = iconMap[type.name] || Server
      
      return {
        id: type.id,
        name: type.name,
        count,
        icon: Icon,
        color: type.color || "#6366f1"
      }
    })
  }, [assetTypes, stats.assetsByType])

  if (selectedAssetType) {
    const selectedTypeData = assetTypes.find(t => t.id === selectedAssetType)
    const filteredAssets = assets.filter(asset => asset.asset_type_id === selectedAssetType)

    return (
      <PageContent>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={() => setSelectedAssetType(null)}>
                ← Back to Assets
              </Button>
              <div>
                <h1 className="text-base font-semibold text-foreground">{selectedTypeData?.name}</h1>
                <p className="text-xs text-muted-foreground">
                  Detailed listing of all {selectedTypeData?.name?.toLowerCase()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowExportModal(true)}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button size="sm" onClick={() => setShowAddAssetModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Asset
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Search ${selectedTypeData?.name?.toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-48 text-sm"
              />
            </div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-48 text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="retired">Retired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Assets Table */}
          <div className="0 rounded-lg shadow-sm overflow-hidden">
            {assetsLoading ? (
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Asset Name</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Hostname</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">IP Address</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Operating System</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Criticality</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <tr key={`skel-${i}`}>
                      <td className="p-3">
                        <Skeleton className="h-4 w-32 mb-1" />
                        <Skeleton className="h-3 w-20" />
                      </td>
                      <td className="p-3"><Skeleton className="h-4 w-24" /></td>
                      <td className="p-3"><Skeleton className="h-4 w-28" /></td>
                      <td className="p-3"><Skeleton className="h-4 w-32" /></td>
                      <td className="p-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
                      <td className="p-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
                      <td className="p-3"><Skeleton className="h-8 w-8 rounded" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : filteredAssets.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-muted-foreground">No assets found</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Asset Name</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Hostname</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">IP Address</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Operating System</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Criticality</th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredAssets.map((asset) => (
                    <tr
                      key={asset.id}
                      className="hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleAssetAction("view_details", asset)}
                    >
                      <td className="p-3">
                        <div>
                          <p className="text-sm font-medium">{asset.name}</p>
                          <p className="text-xs text-muted-foreground">{asset.asset_tag}</p>
                        </div>
                      </td>
                      <td className="p-3 text-sm">{asset.hostname || '-'}</td>
                      <td className="p-3 text-sm">{asset.ip_address || '-'}</td>
                      <td className="p-3 text-sm">{asset.operating_system || '-'}</td>
                      <td className="p-3">
                        <Badge className={`${getStatusColor(asset.status)} text-xs`}>
                          {asset.status}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge className={`${getCriticalityColor(asset.criticality)} text-xs`}>
                          {asset.criticality}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="text-sm">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                handleAssetAction("view_details", asset)
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                handleAssetAction("edit_asset", asset)
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Asset
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                handleAssetAction("view_dependencies", asset)
                              }}
                            >
                              <GitBranch className="h-4 w-4 mr-2" />
                              View Dependencies
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </PageContent>
    )
  }

  return (
    <PageContent
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-foreground">Asset Management</h1>
            <p className="text-xs text-muted-foreground">
              Configuration Management Database (CMDB) - Service & Asset Mapping
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowAutoDiscoveryModal(true)}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Auto-Discovery
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowImportAssetsModal(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Import Assets
            </Button>
            <Button size="sm" onClick={() => setShowAddAssetModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Asset
            </Button>
          </div>
        </div>

        {/* Asset Type Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {statsLoading ? (
            Array(8).fill(0).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-2 text-center">
                  <div className="w-8 h-8 bg-muted rounded-lg mx-auto mb-1" />
                  <div className="h-3 bg-muted rounded mb-1" />
                  <div className="h-6 bg-muted rounded" />
                </CardContent>
              </Card>
            ))
          ) : (
            assetTypeCards.map((type) => {
              const Icon = type.icon
              return (
                <Card
                  key={type.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedAssetType(type.id)}
                >
                  <CardContent className="p-2 text-center">
                    <div className="p-1.5 rounded-lg mx-auto mb-1 w-fit" style={{ backgroundColor: type.color }}>
                      <Icon className="h-3 w-3 text-white" />
                    </div>
                    <p className="text-[11px] font-medium mb-1">{type.name}</p>
                    <p className="text-[13px] font-bold text-foreground">{type.count.toLocaleString()}</p>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="assets" className="space-y-4">
          <TabsList className="bg-transparent border-b border-border rounded-none p-0 h-auto w-full justify-start space-x-0">
            <TabsTrigger
              value="assets"
              className="text-[11px] font-medium px-4 py-2 bg-transparent border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-500 data-[state=active]:bg-transparent text-muted-foreground hover:text-foreground rounded-none shadow-none"
            >
              Assets
            </TabsTrigger>
            <TabsTrigger
              value="servicemap"
              className="text-[11px] font-medium px-4 py-2 bg-transparent border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-500 data-[state=active]:bg-transparent text-muted-foreground hover:text-foreground rounded-none shadow-none"
            >
              ServiceMap
            </TabsTrigger>
            <TabsTrigger
              value="dependencies"
              className="text-[11px] font-medium px-4 py-2 bg-transparent border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-500 data-[state=active]:bg-transparent text-muted-foreground hover:text-foreground rounded-none shadow-none"
            >
              Dependencies
            </TabsTrigger>
            <TabsTrigger
              value="discovery"
              className="text-[11px] font-medium px-4 py-2 bg-transparent border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-500 data-[state=active]:bg-transparent text-muted-foreground hover:text-foreground rounded-none shadow-none"
            >
              Discovery
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assets" className="space-y-4">
            {/* Filters */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search assets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-48 text-[11px]"
                />
              </div>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-48 text-[11px]">
                  <SelectValue placeholder="Asset Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {assetTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-48 text-[11px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={() => setShowExportModal(true)}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-[12px]">Configuration Items (CIs)</CardTitle>
                <CardDescription className="text-[10px]">
                  Centralized inventory of all IT assets and their relationships
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg overflow-hidden">
                  {assetsLoading ? (
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-3 text-[10px] font-medium text-muted-foreground">Asset Name</th>
                          <th className="text-left p-3 text-[10px] font-medium text-muted-foreground">Type</th>
                          <th className="text-left p-3 text-[10px] font-medium text-muted-foreground">Status</th>
                          <th className="text-left p-3 text-[10px] font-medium text-muted-foreground">Location</th>
                          <th className="text-left p-3 text-[10px] font-medium text-muted-foreground">Criticality</th>
                          <th className="text-left p-3 text-[10px] font-medium text-muted-foreground">Last Seen</th>
                          <th className="text-left p-3 text-[10px] font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <tr key={i} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                            <td className="p-3">
                              <div className="flex items-center space-x-3">
                                <Skeleton className="w-8 h-8 rounded-lg" />
                                <div className="space-y-2">
                                  <Skeleton className="h-4 w-32" />
                                  <Skeleton className="h-3 w-24" />
                                </div>
                              </div>
                            </td>
                            <td className="p-3"><Skeleton className="h-4 w-20" /></td>
                            <td className="p-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
                            <td className="p-3"><Skeleton className="h-4 w-24" /></td>
                            <td className="p-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
                            <td className="p-3"><Skeleton className="h-4 w-20" /></td>
                            <td className="p-3"><Skeleton className="h-8 w-8 rounded" /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : assets.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-muted-foreground">No assets found. Create your first asset to get started.</p>
                      <Button className="mt-4" onClick={() => setShowAddAssetModal(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Asset
                      </Button>
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-3 text-[10px] font-medium text-muted-foreground">Asset Name</th>
                          <th className="text-left p-3 text-[10px] font-medium text-muted-foreground">Type</th>
                          <th className="text-left p-3 text-[10px] font-medium text-muted-foreground">Status</th>
                          <th className="text-left p-3 text-[10px] font-medium text-muted-foreground">Location</th>
                          <th className="text-left p-3 text-[10px] font-medium text-muted-foreground">Criticality</th>
                          <th className="text-left p-3 text-[10px] font-medium text-muted-foreground">Last Seen</th>
                          <th className="text-left p-3 text-[10px] font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assets.map((asset, index) => {
                          const Icon = iconMap[asset.asset_type?.name || ''] || Server
                          return (
                            <tr
                              key={asset.id}
                              className={`hover:bg-muted/30 cursor-pointer ${index % 2 === 0 ? "bg-background" : "bg-muted/20"}`}
                              onClick={() => handleAssetAction("view_details", asset)}
                            >
                              <td className="p-3">
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                    <Icon className="h-4 w-4 text-primary" />
                                  </div>
                                  <div>
                                    <p className="text-[11px] font-medium">{asset.name || 'Unnamed Asset'}</p>
                                    <p className="text-[10px] text-muted-foreground">{asset.asset_tag || 'No Tag'}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-3 text-[11px]">{asset.asset_type?.name || 'Unknown Type'}</td>
                              <td className="p-3">
                                <Badge className={`${getStatusColor(asset.status)} text-[10px]`}>{asset.status || 'Unknown'}</Badge>
                              </td>
                              <td className="p-3 text-[11px]">{asset.location || '-'}</td>
                              <td className="p-3">
                                <Badge className={`${getCriticalityColor(asset.criticality)} text-[10px]`}>
                                  {asset.criticality || 'Unknown'}
                                </Badge>
                              </td>
                              <td className="p-3 text-[11px]">
                                {asset.last_seen_at ? new Date(asset.last_seen_at).toLocaleDateString() : 'Never'}
                              </td>
                              <td className="p-3">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="text-[11px]">
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleAssetAction("view_details", asset)
                                      }}
                                    >
                                      <Eye className="h-4 w-4 mr-2" />
                                      View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleAssetAction("edit_asset", asset)
                                      }}
                                    >
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit Asset
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleAssetAction("view_dependencies", asset)
                                      }}
                                    >
                                      <GitBranch className="h-4 w-4 mr-2" />
                                      View Dependencies
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="servicemap" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[12px] font-semibold">Business Service Mapping</h2>
                <p className="text-[10px] text-muted-foreground">
                  Visual representation of business services and their supporting assets
                </p>
              </div>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Map Service
              </Button>
            </div>

            {servicesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array(6).fill(0).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-4 bg-muted rounded mb-3" />
                      <div className="grid grid-cols-2 gap-3">
                        <div className="h-3 bg-muted rounded" />
                        <div className="h-3 bg-muted rounded" />
                        <div className="h-3 bg-muted rounded" />
                        <div className="h-3 bg-muted rounded" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : services.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground mb-4">No business services configured yet.</p>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Business Service
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {services.map((service) => (
                  <Card key={service.id} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-[11px] font-medium">{service.name}</h3>
                        <Badge className={`${getStatusColor(service.status)} text-[10px]`}>{service.status}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-[11px]">
                        <div>
                          <p className="text-muted-foreground text-[10px]">Assets</p>
                          <p className="font-medium">{service.asset_count || 0}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-[10px]">Criticality</p>
                          <Badge className={`${getCriticalityColor(service.criticality)} text-[10px]`}>
                            {service.criticality}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-[10px]">Uptime Target</p>
                          <p className="font-medium text-green-600 dark:text-green-400 text-[13px]">{service.sla_target_uptime}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-[10px]">Owner</p>
                          <p className="font-medium text-[11px]">{service.owner?.display_name || '-'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="dependencies" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[11px] font-semibold">Dependency Mapping</h2>
                <p className="text-[10px] text-muted-foreground">
                  Relationship visualization and impact analysis
                </p>
              </div>
              <Button size="sm">
                <Zap className="h-4 w-4 mr-2" />
                Launch Viewer
              </Button>
            </div>

            <Card>
              <CardContent className="p-8 text-center">
                <GitBranch className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">Dependency mapping will be available once you have assets configured.</p>
                <Button onClick={() => setShowAddAssetModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Asset
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="discovery" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[11px] font-semibold">Asset Discovery</h2>
                <p className="text-[10px] text-muted-foreground">
                  Automated discovery and inventory management
                </p>
              </div>
              <Button size="sm" onClick={() => setShowAutoDiscoveryModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Discovery Rule
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Network className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-[11px] font-medium">Network Scan</p>
                      <p className="text-[10px] text-muted-foreground">Discover network devices</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full text-[11px]">
                    Configure Scan
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <Cloud className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-[11px] font-medium">Cloud Discovery</p>
                      <p className="text-[10px] text-muted-foreground">AWS, Azure, GCP</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full text-[11px]">
                    Connect Cloud
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <Database className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-[11px] font-medium">Agent Discovery</p>
                      <p className="text-[10px] text-muted-foreground">Install agents</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full text-[11px]">
                    Deploy Agents
                  </Button>
                </CardContent>
              </Card>
            </div>

            {rulesLoading ? (
              <Card>
                <CardContent className="p-4">
                  <div className="animate-pulse">
                    <div className="h-4 bg-muted rounded mb-3" />
                    <div className="h-3 bg-muted rounded" />
                  </div>
                </CardContent>
              </Card>
            ) : rules.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <RefreshCw className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No discovery rules configured yet.</p>
                  <Button onClick={() => setShowAutoDiscoveryModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Discovery Rule
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-[12px]">Discovery Rules</CardTitle>
                  <CardDescription className="text-[10px]">
                    Configure automated discovery schedules and criteria
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {rules.map((rule) => (
                      <div key={rule.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <p className="text-[11px] font-medium">{rule.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            Type: {rule.rule_type} • Runs: {rule.run_count} • Success: {rule.success_count}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={rule.is_active ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" : "bg-muted text-muted-foreground"}>
                            {rule.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => runRule(rule.id)}
                            disabled={rulesLoading}
                          >
                            <Zap className="h-3 w-3 mr-1" />
                            Run Now
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Add Asset Modal */}
        <Dialog open={showAddAssetModal} onOpenChange={setShowAddAssetModal}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Add New Asset</DialogTitle>
              <DialogDescription>
                Add a new asset to the configuration management database
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="asset-type">Asset Type *</Label>
                  <Select 
                    value={newAsset.asset_type_id} 
                    onValueChange={(value) => {
                      const selectedType = assetTypes.find(t => t.id === value)
                      setNewAsset({ 
                        ...newAsset, 
                        asset_type_id: value,
                        asset_tag: selectedType ? generateAssetTag(selectedType.name) : ""
                      })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select asset type" />
                    </SelectTrigger>
                    <SelectContent>
                      {assetTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="asset-tag">Asset Tag *</Label>
                  <Input
                    id="asset-tag"
                    value={newAsset.asset_tag}
                    onChange={(e) => setNewAsset({ ...newAsset, asset_tag: e.target.value })}
                    placeholder="Auto-generated"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="asset-name">Asset Name *</Label>
                <Input
                  id="asset-name"
                  value={newAsset.name}
                  onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                  placeholder="Enter asset name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hostname">Hostname</Label>
                  <Input
                    id="hostname"
                    value={newAsset.hostname}
                    onChange={(e) => setNewAsset({ ...newAsset, hostname: e.target.value })}
                    placeholder="server.company.com"
                  />
                </div>
                <div>
                  <Label htmlFor="ip-address">IP Address</Label>
                  <Input
                    id="ip-address"
                    value={newAsset.ip_address}
                    onChange={(e) => setNewAsset({ ...newAsset, ip_address: e.target.value })}
                    placeholder="192.168.1.100"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="operating-system">Operating System</Label>
                  <Input
                    id="operating-system"
                    value={newAsset.operating_system}
                    onChange={(e) => setNewAsset({ ...newAsset, operating_system: e.target.value })}
                    placeholder="Ubuntu 20.04 LTS"
                  />
                </div>
                <div>
                  <Label htmlFor="cpu-info">CPU</Label>
                  <Input
                    id="cpu-info"
                    value={newAsset.cpu_info}
                    onChange={(e) => setNewAsset({ ...newAsset, cpu_info: e.target.value })}
                    placeholder="Intel Xeon E5-2680"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="memory">Memory (GB)</Label>
                  <Input
                    id="memory"
                    type="number"
                    value={newAsset.memory_gb || ""}
                    onChange={(e) => setNewAsset({ ...newAsset, memory_gb: parseInt(e.target.value) || undefined })}
                    placeholder="32"
                  />
                </div>
                <div>
                  <Label htmlFor="criticality">Criticality</Label>
                  <Select
                    value={newAsset.criticality}
                    onValueChange={(value: any) => setNewAsset({ ...newAsset, criticality: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={newAsset.location}
                    onChange={(e) => setNewAsset({ ...newAsset, location: e.target.value })}
                    placeholder="Data Center A"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddAssetModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddAsset} disabled={!newAsset.name || !newAsset.asset_type_id}>
                  Add Asset
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Asset Detail Modal */}
        <Dialog open={showAssetDetailModal} onOpenChange={setShowAssetDetailModal}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Asset Details - {selectedAsset?.name}</DialogTitle>
              <DialogDescription>
                Comprehensive information about {selectedAsset?.asset_tag}
              </DialogDescription>
            </DialogHeader>
            {selectedAsset && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Badge className={getCriticalityColor(selectedAsset.criticality)}>
                        {selectedAsset.criticality}
                      </Badge>
                      <p className="text-[10px] text-muted-foreground mt-1">Criticality</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Badge className={getStatusColor(selectedAsset.status)}>{selectedAsset.status}</Badge>
                      <p className="text-[10px] text-muted-foreground mt-1">Status</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-[11px] font-medium">{selectedAsset.location || '-'}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Location</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-[11px] font-medium">{selectedAsset.asset_type?.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Type</p>
                    </CardContent>
                  </Card>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-[12px] font-medium mb-3">Technical Specifications</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-[11px] text-muted-foreground">Hostname:</span>
                        <span className="text-[11px]">{selectedAsset.hostname || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[11px] text-muted-foreground">IP Address:</span>
                        <span className="text-[11px]">{selectedAsset.ip_address || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[11px] text-muted-foreground">Operating System:</span>
                        <span className="text-[11px]">{selectedAsset.operating_system || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[11px] text-muted-foreground">CPU:</span>
                        <span className="text-[11px]">{selectedAsset.cpu_info || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[11px] text-muted-foreground">Memory:</span>
                        <span className="text-[11px]">{selectedAsset.memory_gb ? `${selectedAsset.memory_gb} GB` : '-'}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-[12px] font-medium mb-3">Management Information</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-[11px] text-muted-foreground">Asset Tag:</span>
                        <span className="text-[11px]">{selectedAsset.asset_tag}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[11px] text-muted-foreground">Owner:</span>
                        <span className="text-[11px]">{selectedAsset.owner?.display_name || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[11px] text-muted-foreground">Last Seen:</span>
                        <span className="text-[11px]">{new Date(selectedAsset.last_seen_at).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[11px] text-muted-foreground">Discovery Method:</span>
                        <span className="text-[11px]">{selectedAsset.discovered_by || 'Manual'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowAssetDetailModal(false)}>
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      setShowAssetDetailModal(false)
                      handleAssetAction("edit_asset", selectedAsset)
                    }}
                  >
                    Edit Asset
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Asset Modal */}
        <Dialog open={showEditAssetModal} onOpenChange={setShowEditAssetModal}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Edit Asset</DialogTitle>
              <DialogDescription>Update asset information and configuration</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-asset-name">Asset Name *</Label>
                  <Input
                    id="edit-asset-name"
                    value={newAsset.name}
                    onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-hostname">Hostname</Label>
                  <Input
                    id="edit-hostname"
                    value={newAsset.hostname}
                    onChange={(e) => setNewAsset({ ...newAsset, hostname: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-ip">IP Address</Label>
                  <Input
                    id="edit-ip"
                    value={newAsset.ip_address}
                    onChange={(e) => setNewAsset({ ...newAsset, ip_address: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-os">Operating System</Label>
                  <Input
                    id="edit-os"
                    value={newAsset.operating_system}
                    onChange={(e) => setNewAsset({ ...newAsset, operating_system: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit-memory">Memory (GB)</Label>
                  <Input
                    id="edit-memory"
                    type="number"
                    value={newAsset.memory_gb || ""}
                    onChange={(e) => setNewAsset({ ...newAsset, memory_gb: parseInt(e.target.value) || undefined })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-criticality">Criticality</Label>
                  <Select
                    value={newAsset.criticality}
                    onValueChange={(value: any) => setNewAsset({ ...newAsset, criticality: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-location">Location</Label>
                  <Input
                    id="edit-location"
                    value={newAsset.location}
                    onChange={(e) => setNewAsset({ ...newAsset, location: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowEditAssetModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateAsset}>
                  Update Asset
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Asset Confirmation Dialog */}
        <DeleteConfirmationDialog
          open={showDeleteAssetDialog}
          onOpenChange={setShowDeleteAssetDialog}
          onConfirm={confirmDeleteAsset}
          title="Delete Asset"
          description="Do you want to delete this asset?"
          itemName={assetToDelete?.name}
        />
      </div>
    </PageContent>
  )
}
