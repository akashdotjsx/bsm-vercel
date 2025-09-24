"use client"

import { useState, useMemo, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { PlatformLayout } from "@/components/layout/platform-layout"
import { createClient } from "@/lib/supabase/client"
import {
  Search,
  Filter,
  Download,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Activity,
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  Settings,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { format } from "date-fns"

const CATEGORY_FIELD_CONFIG = {
  Server: {
    displayFields: ["hostname", "ip", "os", "cpu", "memory"],
    tableHeaders: [
      "Asset",
      "Hostname",
      "IP Address",
      "OS",
      "CPU",
      "Memory",
      "Status",
      "Criticality",
      "Location",
      "Actions",
    ],
  },
  Workstation: {
    displayFields: ["hostname", "os", "cpu", "memory"],
    tableHeaders: ["Asset", "Computer Name", "OS", "Processor", "RAM", "Status", "Criticality", "Location", "Actions"],
  },
  Mobile: {
    displayFields: ["model", "os", "manufacturer", "serial_number"],
    tableHeaders: [
      "Asset",
      "Model",
      "OS Version",
      "Manufacturer",
      "Serial Number",
      "Status",
      "Criticality",
      "Location",
      "Actions",
    ],
  },
  Network: {
    displayFields: ["ip", "hostname", "model", "manufacturer"],
    tableHeaders: [
      "Asset",
      "Management IP",
      "Device Name",
      "Model",
      "Manufacturer",
      "Status",
      "Criticality",
      "Location",
      "Actions",
    ],
  },
  Storage: {
    displayFields: ["model", "memory", "hostname", "ip"],
    tableHeaders: [
      "Asset",
      "Storage Model",
      "Capacity",
      "Storage Name",
      "Management IP",
      "Status",
      "Criticality",
      "Location",
      "Actions",
    ],
  },
  Software: {
    displayFields: ["model", "vendor", "cost"],
    tableHeaders: ["Asset", "Version", "Vendor", "License Cost", "Status", "Criticality", "Location", "Actions"],
  },
}

export default function AssetCategoryPage() {
  const params = useParams()
  const router = useRouter()
  const category = params.category as string
  const categoryName = category.charAt(0).toUpperCase() + category.slice(1)

  const singularCategoryName = categoryName.endsWith("s") ? categoryName.slice(0, -1) : categoryName

  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [criticalityFilter, setCriticalityFilter] = useState("all")
  const [assets, setAssets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [showColumnSettings, setShowColumnSettings] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<any>(null)
  const [editingAsset, setEditingAsset] = useState<any>(null)

  const handleViewDetails = (asset: any) => {
    setSelectedAsset(asset)
    setShowDetailsModal(true)
  }

  const handleEditAsset = (asset: any) => {
    setEditingAsset({ ...asset })
    setShowEditModal(true)
  }

  const handleViewHistory = (asset: any) => {
    setSelectedAsset(asset)
    setShowHistoryModal(true)
  }

  const handleDeleteAsset = async (asset: any) => {
    if (confirm(`Are you sure you want to delete the asset "${asset.name}"? This action cannot be undone.`)) {
      try {
        const supabase = createClient()
        const { error } = await supabase.from("assets").delete().eq("asset_id", asset.id)

        if (error) throw error

        // Refresh the assets list
        setAssets(assets.filter((a) => a.asset_id !== asset.id))
      } catch (error) {
        console.error("Error deleting asset:", error)
        alert("Failed to delete asset. Please try again.")
      }
    }
  }

  const handleSaveAsset = async () => {
    if (!editingAsset) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("assets")
        .update({
          name: editingAsset.name,
          hostname: editingAsset.hostname,
          ip_address: editingAsset.ip,
          operating_system: editingAsset.os,
          cpu: editingAsset.cpu,
          memory: editingAsset.memory,
          status: editingAsset.status,
          criticality: editingAsset.criticality,
          location: editingAsset.location,
          model: editingAsset.model,
          manufacturer: editingAsset.manufacturer,
          serial_number: editingAsset.serial_number,
          cost: editingAsset.cost,
          vendor: editingAsset.vendor,
          notes: editingAsset.notes,
        })
        .eq("asset_id", editingAsset.id)

      if (error) throw error

      // Update the local state
      setAssets(assets.map((asset) => (asset.asset_id === editingAsset.id ? { ...asset, ...editingAsset } : asset)))

      setShowEditModal(false)
      setEditingAsset(null)
    } catch (error) {
      console.error("Error updating asset:", error)
      alert("Failed to update asset. Please try again.")
    }
  }

  const handleAdvancedFilters = () => {
    setShowAdvancedFilters(true)
  }

  const handleColumnSettings = () => {
    setShowColumnSettings(true)
  }

  useEffect(() => {
    const fetchCategoryAssets = async () => {
      try {
        setLoading(true)
        setError(null)

        const supabase = createClient()

        console.log(`[v0] Fetching ${category} assets from Supabase...`)

        const singularCategory = category.endsWith("s") ? category.slice(0, -1) : category

        const { data: assetsData, error: assetsError } = await supabase
          .from("assets")
          .select("*")
          .or(
            `category.ilike.%${category}%,category.ilike.%${singularCategory}%,category.ilike.%${category.charAt(0).toUpperCase() + category.slice(1)}%,category.ilike.%${singularCategory.charAt(0).toUpperCase() + singularCategory.slice(1)}%`,
          )
          .order("created_at", { ascending: false })

        if (assetsError) {
          console.error(`[v0] ${category} assets fetch error:`, assetsError)
          throw assetsError
        }

        console.log(`[v0] ${category} assets fetched successfully:`, assetsData)
        setAssets(assetsData || [])
      } catch (err) {
        console.error(`[v0] Error fetching ${category} assets:`, err)
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchCategoryAssets()
  }, [category])

  const transformedAssets = useMemo(() => {
    if (!assets) return []

    return assets.map((asset: any) => ({
      id: asset.asset_id || asset.id,
      name: asset.name || "Unknown Asset",
      hostname: asset.hostname,
      ip: asset.ip_address,
      os: asset.operating_system,
      cpu: asset.cpu,
      memory: asset.memory,
      status: asset.status || "active",
      owner: "Unassigned",
      type: asset.category || "Unknown",
      location: asset.location,
      service: "Unknown",
      criticality: asset.criticality || "medium",
      category: asset.category || "Unknown",
      subcategory: asset.subcategory,
      serial_number: asset.serial_number,
      model: asset.model,
      manufacturer: asset.manufacturer,
      purchase_date: asset.purchase_date,
      warranty_expiry: asset.warranty_expiry,
      cost: asset.cost,
      vendor: asset.vendor,
      notes: asset.notes,
      created_at: asset.created_at,
      updated_at: asset.updated_at,
    }))
  }, [assets])

  const filteredAssets = useMemo(() => {
    return transformedAssets.filter((asset) => {
      const matchesSearch =
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (asset.id && asset.id.toString().toLowerCase().includes(searchTerm.toLowerCase())) ||
        (asset.hostname && asset.hostname.toLowerCase().includes(searchTerm.toLowerCase())) ||
        asset.owner.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === "all" || asset.status === statusFilter
      const matchesCriticality = criticalityFilter === "all" || asset.criticality === criticalityFilter

      return matchesSearch && matchesStatus && matchesCriticality
    })
  }, [transformedAssets, searchTerm, statusFilter, criticalityFilter])

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
      case "healthy":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "maintenance":
      case "warning":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "inactive":
      case "critical":
      case "retired":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      case "disposed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
    }
  }

  const getCriticalityColor = (criticality: string) => {
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
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  const handleExportAssets = () => {
    const csvContent = [
      ["Asset ID", "Name", "Category", "Status", "Owner", "Location", "IP Address", "OS"].join(","),
      ...filteredAssets.map((asset) =>
        [asset.id, asset.name, asset.category, asset.status, asset.owner, asset.location, asset.ip, asset.os].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${category}-assets-export-${format(new Date(), "yyyy-MM-dd")}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getCategoryConfig = () => {
    return (
      CATEGORY_FIELD_CONFIG[singularCategoryName as keyof typeof CATEGORY_FIELD_CONFIG] || {
        displayFields: ["hostname", "ip", "os"],
        tableHeaders: ["Asset", "Details", "Status", "Criticality", "Location", "Actions"],
      }
    )
  }

  const renderAssetDetails = (asset: any) => {
    const config = getCategoryConfig()

    return config.displayFields.map((field, index) => {
      let value = ""
      switch (field) {
        case "hostname":
          value = asset.hostname || "N/A"
          break
        case "ip":
          value = asset.ip || "N/A"
          break
        case "os":
          value = asset.os || "N/A"
          break
        case "cpu":
          value = asset.cpu || "N/A"
          break
        case "memory":
          value = asset.memory || "N/A"
          break
        case "model":
          value = asset.model || "N/A"
          break
        case "manufacturer":
          value = asset.manufacturer || "N/A"
          break
        case "serial_number":
          value = asset.serial_number || "N/A"
          break
        case "vendor":
          value = asset.vendor || "N/A"
          break
        case "cost":
          value = asset.cost ? `$${asset.cost}` : "N/A"
          break
        default:
          value = "N/A"
      }

      return (
        <td key={index} className="p-3">
          <div className="text-sm">{value}</div>
        </td>
      )
    })
  }

  if (loading) {
    return (
      <PlatformLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading {category} assets...</span>
        </div>
      </PlatformLayout>
    )
  }

  if (error) {
    return (
      <PlatformLayout>
        <div className="flex items-center justify-center h-64">
          <AlertTriangle className="h-8 w-8 text-red-500" />
          <span className="ml-2 text-red-500">
            Error loading {category} assets: {error.message}
          </span>
          <Button onClick={() => window.location.reload()} variant="outline" className="ml-4 bg-transparent">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </PlatformLayout>
    )
  }

  const categoryConfig = getCategoryConfig()

  return (
    <PlatformLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">{categoryName} Assets</h1>
                <p className="text-sm text-muted-foreground">
                  Manage all {category} assets in your organization ({filteredAssets.length} total)
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleExportAssets}>
              <Download className="h-4 w-4 mr-2" />
              Export {categoryName}
            </Button>
            <Button onClick={() => router.push("/bsm/assets")}>
              <Plus className="h-4 w-4 mr-2" />
              Add Asset
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder={`Search ${category} assets...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="retired">Retired</SelectItem>
              <SelectItem value="disposed">Disposed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={criticalityFilter} onValueChange={setCriticalityFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Criticality" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Criticality</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Assets Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>
                {categoryName} Assets ({filteredAssets.length})
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleAdvancedFilters}>
                  <Filter className="h-4 w-4 mr-2" />
                  Advanced Filters
                </Button>
                <Button variant="outline" size="sm" onClick={handleColumnSettings}>
                  <Settings className="h-4 w-4 mr-2" />
                  Columns
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    {categoryConfig.tableHeaders.map((header, index) => (
                      <th key={index} className="text-left p-3 font-medium">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.length === 0 ? (
                    <tr>
                      <td
                        colSpan={categoryConfig.tableHeaders.length}
                        className="p-8 text-center text-muted-foreground"
                      >
                        No {category} assets found. Click "Add Asset" to create your first {category} asset.
                      </td>
                    </tr>
                  ) : (
                    filteredAssets.map((asset) => (
                      <tr key={asset.id} className="border-b hover:bg-muted/50">
                        <td className="p-3">
                          <div>
                            <div className="font-medium">{asset.name}</div>
                            <div className="text-sm text-muted-foreground">{asset.id}</div>
                          </div>
                        </td>
                        {renderAssetDetails(asset)}
                        <td className="p-3">
                          <Badge className={getStatusColor(asset.status)}>
                            {asset.status.charAt(0).toUpperCase() + asset.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Badge className={getCriticalityColor(asset.criticality)}>
                            {asset.criticality.charAt(0).toUpperCase() + asset.criticality.slice(1)}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="text-sm">{asset.location || "Not specified"}</div>
                        </td>
                        <td className="p-3 text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewDetails(asset)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditAsset(asset)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Asset
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleViewHistory(asset)}>
                                <Activity className="h-4 w-4 mr-2" />
                                View History
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteAsset(asset)}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Asset
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Asset Details Modal */}
        <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Asset Details - {selectedAsset?.name}</DialogTitle>
            </DialogHeader>
            {selectedAsset && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Asset ID</Label>
                    <div className="text-sm font-mono bg-muted p-2 rounded">{selectedAsset.id}</div>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <div className="text-sm">
                      <Badge className={getStatusColor(selectedAsset.status)}>
                        {selectedAsset.status.charAt(0).toUpperCase() + selectedAsset.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label>Hostname</Label>
                    <div className="text-sm">{selectedAsset.hostname || "N/A"}</div>
                  </div>
                  <div>
                    <Label>IP Address</Label>
                    <div className="text-sm">{selectedAsset.ip || "N/A"}</div>
                  </div>
                  <div>
                    <Label>Operating System</Label>
                    <div className="text-sm">{selectedAsset.os || "N/A"}</div>
                  </div>
                  <div>
                    <Label>Location</Label>
                    <div className="text-sm">{selectedAsset.location || "N/A"}</div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => setShowDetailsModal(false)}>Close</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Asset Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Asset - {editingAsset?.name}</DialogTitle>
            </DialogHeader>
            {editingAsset && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="assetName">Asset Name</Label>
                    <Input
                      id="assetName"
                      value={editingAsset.name || ""}
                      onChange={(e) => setEditingAsset({ ...editingAsset, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="hostname">Hostname</Label>
                    <Input
                      id="hostname"
                      value={editingAsset.hostname || ""}
                      onChange={(e) => setEditingAsset({ ...editingAsset, hostname: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="ipAddress">IP Address</Label>
                    <Input
                      id="ipAddress"
                      value={editingAsset.ip || ""}
                      onChange={(e) => setEditingAsset({ ...editingAsset, ip: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={editingAsset.status}
                      onValueChange={(value) => setEditingAsset({ ...editingAsset, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="retired">Retired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={editingAsset.location || ""}
                      onChange={(e) => setEditingAsset({ ...editingAsset, location: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="criticality">Criticality</Label>
                    <Select
                      value={editingAsset.criticality}
                      onValueChange={(value) => setEditingAsset({ ...editingAsset, criticality: value })}
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
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={editingAsset.notes || ""}
                    onChange={(e) => setEditingAsset({ ...editingAsset, notes: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowEditModal(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveAsset}>Save Changes</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Asset History Modal */}
        <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Asset History - {selectedAsset?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Asset history and audit trail would be displayed here.
              </div>
              <div className="space-y-2">
                <div className="border-l-2 border-blue-200 pl-4 py-2">
                  <div className="text-sm font-medium">Asset Created</div>
                  <div className="text-xs text-muted-foreground">
                    {selectedAsset?.created_at
                      ? format(new Date(selectedAsset.created_at), "MMM dd, yyyy HH:mm")
                      : "N/A"}
                  </div>
                </div>
                <div className="border-l-2 border-green-200 pl-4 py-2">
                  <div className="text-sm font-medium">Last Updated</div>
                  <div className="text-xs text-muted-foreground">
                    {selectedAsset?.updated_at
                      ? format(new Date(selectedAsset.updated_at), "MMM dd, yyyy HH:mm")
                      : "N/A"}
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => setShowHistoryModal(false)}>Close</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Advanced Filters Modal */}
        <Dialog open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Advanced Filters</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">Additional filtering options would be available here.</div>
              <div className="flex justify-end">
                <Button onClick={() => setShowAdvancedFilters(false)}>Close</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Column Settings Modal */}
        <Dialog open={showColumnSettings} onOpenChange={setShowColumnSettings}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Column Settings</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Column visibility and ordering options would be available here.
              </div>
              <div className="flex justify-end">
                <Button onClick={() => setShowColumnSettings(false)}>Close</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PlatformLayout>
  )
}
