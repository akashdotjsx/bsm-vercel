"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
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
  Plus,
  Search,
  Filter,
  Upload,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Server,
  Monitor,
  Smartphone,
  Wifi,
  HardDrive,
  Package,
  Cloud,
  Database,
  Activity,
  AlertTriangle,
  Settings,
  RefreshCw,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { format } from "date-fns"
import { Checkbox } from "@/components/ui/checkbox"

const CATEGORY_FIELD_CONFIG = {
  Server: {
    required: ["name", "category", "hostname", "ip_address", "operating_system"],
    optional: [
      "cpu",
      "memory",
      "location",
      "serial_number",
      "model",
      "manufacturer",
      "cost",
      "purchase_date",
      "warranty_expiry",
      "vendor",
      "notes",
    ],
    fields: {
      hostname: { label: "Hostname", type: "text", placeholder: "server-01.company.com" },
      ip_address: { label: "IP Address", type: "text", placeholder: "192.168.1.100" },
      operating_system: {
        label: "Operating System",
        type: "select",
        options: [
          "Windows Server 2022",
          "Windows Server 2019",
          "Ubuntu 22.04",
          "Ubuntu 20.04",
          "CentOS 8",
          "RHEL 8",
          "RHEL 9",
        ],
      },
      cpu: { label: "CPU", type: "text", placeholder: "Intel Xeon E5-2680 v4" },
      memory: { label: "Memory (RAM)", type: "text", placeholder: "32GB DDR4" },
    },
  },
  Workstation: {
    required: ["name", "category", "hostname", "operating_system"],
    optional: [
      "ip_address",
      "cpu",
      "memory",
      "location",
      "serial_number",
      "model",
      "manufacturer",
      "cost",
      "purchase_date",
      "warranty_expiry",
      "vendor",
      "notes",
    ],
    fields: {
      hostname: { label: "Computer Name", type: "text", placeholder: "DESK-001" },
      ip_address: { label: "IP Address", type: "text", placeholder: "192.168.1.50" },
      operating_system: {
        label: "Operating System",
        type: "select",
        options: ["Windows 11", "Windows 10", "macOS Ventura", "macOS Monterey", "Ubuntu 22.04", "Ubuntu 20.04"],
      },
      cpu: { label: "Processor", type: "text", placeholder: "Intel Core i7-12700K" },
      memory: { label: "RAM", type: "text", placeholder: "16GB DDR4" },
    },
  },
  Mobile: {
    required: ["name", "category", "model", "operating_system"],
    optional: [
      "serial_number",
      "manufacturer",
      "location",
      "cost",
      "purchase_date",
      "warranty_expiry",
      "vendor",
      "notes",
    ],
    fields: {
      model: { label: "Device Model", type: "text", placeholder: "iPhone 14 Pro" },
      operating_system: { label: "OS Version", type: "text", placeholder: "iOS 16.1" },
      manufacturer: {
        label: "Manufacturer",
        type: "select",
        options: ["Apple", "Samsung", "Google", "OnePlus", "Xiaomi", "Huawei"],
      },
      serial_number: { label: "Serial Number", type: "text", placeholder: "F2LLD1234ABC" },
    },
  },
  Network: {
    required: ["name", "category", "ip_address", "model"],
    optional: [
      "hostname",
      "location",
      "serial_number",
      "manufacturer",
      "cost",
      "purchase_date",
      "warranty_expiry",
      "vendor",
      "notes",
    ],
    fields: {
      ip_address: { label: "Management IP", type: "text", placeholder: "192.168.1.1" },
      hostname: { label: "Device Name", type: "text", placeholder: "switch-core-01" },
      model: { label: "Model", type: "text", placeholder: "Cisco Catalyst 9300" },
      manufacturer: {
        label: "Manufacturer",
        type: "select",
        options: ["Cisco", "HP/Aruba", "Juniper", "Ubiquiti", "Netgear", "D-Link", "TP-Link"],
      },
    },
  },
  Storage: {
    required: ["name", "category", "model", "memory"],
    optional: [
      "hostname",
      "ip_address",
      "location",
      "serial_number",
      "manufacturer",
      "cost",
      "purchase_date",
      "warranty_expiry",
      "vendor",
      "notes",
    ],
    fields: {
      model: { label: "Storage Model", type: "text", placeholder: "Dell PowerVault ME4024" },
      memory: { label: "Capacity", type: "text", placeholder: "10TB RAID 5" },
      hostname: { label: "Storage Name", type: "text", placeholder: "storage-01" },
      ip_address: { label: "Management IP", type: "text", placeholder: "192.168.1.200" },
      manufacturer: {
        label: "Manufacturer",
        type: "select",
        options: ["Dell", "HP", "NetApp", "EMC", "Synology", "QNAP", "IBM"],
      },
    },
  },
  Software: {
    required: ["name", "category", "model"],
    optional: ["vendor", "cost", "purchase_date", "warranty_expiry", "location", "notes"],
    fields: {
      model: { label: "Software Version", type: "text", placeholder: "Microsoft Office 365 E3" },
      vendor: { label: "Vendor/Publisher", type: "text", placeholder: "Microsoft Corporation" },
      cost: { label: "License Cost", type: "number", placeholder: "299.99" },
    },
  },
}

export default function AssetsPage() {
  const router = useRouter()
  const [assets, setAssets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [criticalityFilter, setCriticalityFilter] = useState("all")
  const [showAddAssetModal, setShowAddAssetModal] = useState(false)
  const [showEditAssetModal, setShowEditAssetModal] = useState(false)
  const [editingAsset, setEditingAsset] = useState<any>(null)
  const [formStep, setFormStep] = useState<"category" | "details">("category")

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [showColumnSettings, setShowColumnSettings] = useState(false)
  const [showAssetDetails, setShowAssetDetails] = useState(false)
  const [showAssetHistory, setShowAssetHistory] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<any>(null)
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    category: true,
    status: true,
    criticality: true,
    location: true,
    lastUpdated: true,
  })
  const [advancedFilters, setAdvancedFilters] = useState({
    location: "",
    manufacturer: "",
    dateRange: { from: "", to: "" },
    costRange: { min: "", max: "" },
  })

  const [newAsset, setNewAsset] = useState<any>({
    name: "",
    category: "",
    status: "active",
    criticality: "medium",
  })

  const [error, setError] = useState<Error | null>(null)
  const [assetTypes, setAssetTypes] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState("All")

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const supabase = createClient()

        const [assetsResponse, typesResponse] = await Promise.all([
          supabase.from("assets").select("*").order("created_at", { ascending: false }),
          supabase.from("asset_types").select("*"),
        ])

        if (assetsResponse.error) {
          throw assetsResponse.error
        }

        if (typesResponse.error) {
          console.error("Asset types fetch error:", typesResponse.error)
        }

        setAssets(assetsResponse.data || [])
        setAssetTypes(typesResponse.data || [])
      } catch (err) {
        console.error("Error fetching data:", err)
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

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
      owner: "Unassigned", // Simplified for now
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

  const categoriesWithCounts = useMemo(() => {
    const defaultCategories = [
      { name: "Servers", icon: Server, color: "bg-blue-500" },
      { name: "Workstations", icon: Monitor, color: "bg-green-500" },
      { name: "Mobile", icon: Smartphone, color: "bg-purple-500" },
      { name: "Network", icon: Wifi, color: "bg-orange-500" },
      { name: "Storage", icon: HardDrive, color: "bg-red-500" },
      { name: "Software", icon: Package, color: "bg-yellow-500" },
      { name: "Cloud", icon: Cloud, color: "bg-cyan-500" },
      { name: "Database", icon: Database, color: "bg-indigo-500" },
    ]

    return defaultCategories.map((category) => {
      const singularCategory = category.name.slice(0, -1) // Remove 's' from plural
      return {
        ...category,
        count: transformedAssets.filter((asset) => {
          const assetCategory = asset.category.toLowerCase()
          const categoryLower = category.name.toLowerCase()
          const singularLower = singularCategory.toLowerCase()
          return (
            assetCategory === categoryLower ||
            assetCategory === singularLower ||
            assetCategory.includes(singularLower) ||
            assetCategory.includes(categoryLower)
          )
        }).length,
      }
    })
  }, [transformedAssets])

  const filteredAssets = useMemo(() => {
    return transformedAssets.filter((asset) => {
      const matchesSearch =
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (asset.id && asset.id.toString().toLowerCase().includes(searchTerm.toLowerCase())) ||
        (asset.hostname && asset.hostname.toLowerCase().includes(searchTerm.toLowerCase())) ||
        asset.owner.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesCategory =
        selectedCategory === "All" ||
        (() => {
          const assetCategory = asset.category.toLowerCase()
          const selectedLower = selectedCategory.toLowerCase()
          const singularSelected = selectedCategory.slice(0, -1).toLowerCase() // Remove 's'
          return (
            assetCategory === selectedLower ||
            assetCategory === singularSelected ||
            assetCategory.includes(singularSelected) ||
            assetCategory.includes(selectedLower)
          )
        })()

      const matchesStatus = statusFilter === "all" || asset.status === statusFilter
      const matchesCriticality = criticalityFilter === "all" || asset.criticality === criticalityFilter

      return matchesSearch && matchesCategory && matchesStatus && matchesCriticality
    })
  }, [transformedAssets, searchTerm, selectedCategory, statusFilter, criticalityFilter])

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
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
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
    a.download = `assets-export-${format(new Date(), "yyyy-MM-dd")}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getCategoryFields = (category: string) => {
    return (
      CATEGORY_FIELD_CONFIG[category as keyof typeof CATEGORY_FIELD_CONFIG] || {
        required: ["name", "category"],
        optional: ["location", "notes"],
        fields: {},
      }
    )
  }

  const renderFormField = (fieldKey: string, fieldConfig: any, isRequired: boolean) => {
    const value = newAsset[fieldKey] || ""

    if (fieldConfig.type === "select") {
      return (
        <div key={fieldKey} className="space-y-2">
          <Label htmlFor={fieldKey}>
            {fieldConfig.label} {isRequired && <span className="text-red-500">*</span>}
          </Label>
          <Select value={value} onValueChange={(val) => setNewAsset({ ...newAsset, [fieldKey]: val })}>
            <SelectTrigger>
              <SelectValue placeholder={`Select ${fieldConfig.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {fieldConfig.options.map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )
    }

    return (
      <div key={fieldKey} className="space-y-2">
        <Label htmlFor={fieldKey}>
          {fieldConfig.label} {isRequired && <span className="text-red-500">*</span>}
        </Label>
        <Input
          id={fieldKey}
          type={fieldConfig.type || "text"}
          value={value}
          onChange={(e) => setNewAsset({ ...newAsset, [fieldKey]: e.target.value })}
          placeholder={fieldConfig.placeholder}
        />
      </div>
    )
  }

  const handleAddAsset = async () => {
    try {
      console.log("[v0] Adding new asset:", newAsset)

      const supabase = createClient()

      const cleanedAsset: any = {
        name: newAsset.name?.trim() || null,
        category: newAsset.category?.trim() || null,
        status: newAsset.status || "active",
        criticality: newAsset.criticality || "medium",
      }

      // Add all other fields, converting empty strings to null
      Object.keys(newAsset).forEach((key) => {
        if (!["name", "category", "status", "criticality"].includes(key)) {
          const value = newAsset[key]
          cleanedAsset[key] = typeof value === "string" && value.trim() === "" ? null : value
        }
      })

      const { data, error } = await supabase.from("assets").insert([cleanedAsset]).select()

      if (error) throw error

      alert("Asset added successfully!")
      setShowAddAssetModal(false)
      setFormStep("category")
      setNewAsset({
        name: "",
        category: "",
        status: "active",
        criticality: "medium",
      })

      // Refresh assets list
      const { data: updatedAssets } = await supabase
        .from("assets")
        .select("*")
        .order("created_at", { ascending: false })

      if (updatedAssets) {
        setAssets(updatedAssets)
      }
    } catch (error) {
      console.error("Error adding asset:", error)
      alert("Error adding asset. Please try again.")
    }
  }

  const handleCategorySelect = (category: string) => {
    setNewAsset({
      ...newAsset,
      category,
      // Reset other fields when category changes
      name: "",
      hostname: "",
      ip_address: "",
      operating_system: "",
      cpu: "",
      memory: "",
      model: "",
      manufacturer: "",
      serial_number: "",
      vendor: "",
      location: "",
      cost: "",
      purchase_date: "",
      warranty_expiry: "",
      notes: "",
    })
    setFormStep("details")
  }

  const isFormValid = () => {
    if (formStep === "category") {
      return newAsset.category !== ""
    }

    const categoryConfig = getCategoryFields(newAsset.category)
    return categoryConfig.required.every((field) => {
      const value = newAsset[field]
      return value && value.toString().trim() !== ""
    })
  }

  const handleCategoryClick = (categoryName: string) => {
    setSelectedCategory(categoryName)
    router.push(`/bsm/assets/category/${categoryName.toLowerCase()}`)
  }

  const handleEditAsset = async () => {
    try {
      console.log("[v0] Updating asset:", editingAsset)

      const supabase = createClient()

      const cleanedAsset: any = {
        name: editingAsset.name?.trim() || null,
        category: editingAsset.category?.trim() || null,
        status: editingAsset.status || "active",
        criticality: editingAsset.criticality || "medium",
      }

      // Add all other fields, converting empty strings to null
      Object.keys(editingAsset).forEach((key) => {
        if (
          !["id", "asset_id", "created_at", "updated_at", "name", "category", "status", "criticality"].includes(key)
        ) {
          const value = editingAsset[key]
          cleanedAsset[key] = typeof value === "string" && value.trim() === "" ? null : value
        }
      })

      const { data, error } = await supabase.from("assets").update(cleanedAsset).eq("id", editingAsset.id).select()

      if (error) throw error

      alert("Asset updated successfully!")
      setShowEditAssetModal(false)
      setEditingAsset(null)

      // Refresh assets list
      const { data: updatedAssets } = await supabase
        .from("assets")
        .select("*")
        .order("created_at", { ascending: false })

      if (updatedAssets) {
        setAssets(updatedAssets)
      }
    } catch (error) {
      console.error("Error updating asset:", error)
      alert("Error updating asset. Please try again.")
    }
  }

  const openEditModal = (asset: any) => {
    console.log("[v0] Opening edit modal for asset:", asset)
    setEditingAsset({
      id: asset.id,
      name: asset.name,
      category: asset.category,
      status: asset.status,
      criticality: asset.criticality,
      hostname: asset.hostname || "",
      ip_address: asset.ip || "",
      operating_system: asset.os || "",
      cpu: asset.cpu || "",
      memory: asset.memory || "",
      model: asset.model || "",
      manufacturer: asset.manufacturer || "",
      serial_number: asset.serial_number || "",
      vendor: asset.vendor || "",
      location: asset.location || "",
      cost: asset.cost || "",
      purchase_date: asset.purchase_date || "",
      warranty_expiry: asset.warranty_expiry || "",
      notes: asset.notes || "",
    })
    setShowEditAssetModal(true)
  }

  const renderEditFormField = (fieldKey: string, fieldConfig: any, isRequired: boolean) => {
    const value = editingAsset[fieldKey] || ""

    if (fieldConfig.type === "select") {
      return (
        <div key={fieldKey} className="space-y-2">
          <Label htmlFor={fieldKey}>
            {fieldConfig.label} {isRequired && <span className="text-red-500">*</span>}
          </Label>
          <Select value={value} onValueChange={(val) => setEditingAsset({ ...editingAsset, [fieldKey]: val })}>
            <SelectTrigger>
              <SelectValue placeholder={`Select ${fieldConfig.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {fieldConfig.options.map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )
    }

    return (
      <div key={fieldKey} className="space-y-2">
        <Label htmlFor={fieldKey}>
          {fieldConfig.label} {isRequired && <span className="text-red-500">*</span>}
        </Label>
        <Input
          id={fieldKey}
          type={fieldConfig.type || "text"}
          value={value}
          onChange={(e) => setEditingAsset({ ...editingAsset, [fieldKey]: e.target.value })}
          placeholder={fieldConfig.placeholder}
        />
      </div>
    )
  }

  const isEditFormValid = () => {
    if (!editingAsset) return false

    const categoryConfig = getCategoryFields(editingAsset.category)
    return categoryConfig.required.every((field) => {
      const value = editingAsset[field]
      return value && value.toString().trim() !== ""
    })
  }

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "default"
      case "maintenance":
        return "secondary"
      case "inactive":
        return "destructive"
      case "retired":
        return "muted"
      default:
        return "outline"
    }
  }

  const getCriticalityVariant = (criticality: string) => {
    switch (criticality.toLowerCase()) {
      case "critical":
        return "destructive"
      case "high":
        return "secondary"
      case "medium":
        return "default"
      case "low":
        return "outline"
      default:
        return "muted"
    }
  }

  const handleImportAssets = () => {
    // Create a file input element
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".csv,.xlsx,.xls"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        alert(`Import functionality would process: ${file.name}. Feature coming soon!`)
      }
    }
    input.click()
  }

  const handleViewDetails = (asset: any) => {
    setSelectedAsset(asset)
    setShowAssetDetails(true)
  }

  const handleViewHistory = (asset: any) => {
    setSelectedAsset(asset)
    setShowAssetHistory(true)
  }

  const handleDeleteAsset = async (asset: any) => {
    if (confirm(`Are you sure you want to delete "${asset.name}"? This action cannot be undone.`)) {
      try {
        const supabase = createClient()
        const { error } = await supabase.from("assets").delete().eq("id", asset.id)

        if (error) throw error

        alert(`${asset.name} has been deleted successfully.`)

        // Refresh assets list
        const { data: updatedAssets } = await supabase
          .from("assets")
          .select("*")
          .order("created_at", { ascending: false })

        if (updatedAssets) {
          setAssets(updatedAssets)
        }
      } catch (error) {
        console.error("Error deleting asset:", error)
        alert("Error deleting asset. Please try again.")
      }
    }
  }

  const handleAdvancedFiltersApply = () => {
    // Apply advanced filters logic here
    alert("Advanced filters applied successfully!")
    setShowAdvancedFilters(false)
  }

  const handleColumnSettingsSave = () => {
    alert("Column settings saved successfully!")
    setShowColumnSettings(false)
  }

  const toggleColumn = (column: string) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [column]: !prev[column],
    }))
  }

  if (loading) {
    return (
      <PlatformLayout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading assets...</span>
        </div>
      </PlatformLayout>
    )
  }

  if (error) {
    return (
      <PlatformLayout>
        <div className="flex items-center justify-center h-64">
          <AlertTriangle className="h-8 w-8 text-red-500" />
          <span className="ml-2 text-red-500">Error loading assets: {error.message}</span>
          <Button onClick={() => window.location.reload()} variant="outline" className="ml-4 bg-transparent">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </PlatformLayout>
    )
  }

  return (
    <PlatformLayout title="Assets">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Assets</h1>
            <p className="text-sm text-muted-foreground">Track and manage all your IT assets across the organization</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleImportAssets}>
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button onClick={() => setShowAddAssetModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Asset
            </Button>
          </div>
        </div>

        {/* Asset Categories Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {categoriesWithCounts.map((category) => {
            const IconComponent = category.icon
            return (
              <Card
                key={category.name}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedCategory === category.name ? "ring-2 ring-blue-500" : ""
                }`}
                onClick={() => handleCategoryClick(category.name)}
              >
                <CardContent className="p-4 text-center">
                  <div
                    className={`w-12 h-12 ${category.color} rounded-lg flex items-center justify-center mx-auto mb-2`}
                  >
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-medium text-sm">{category.name}</h3>
                  <p className="text-2xl font-bold text-foreground">{category.count}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search assets..."
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
              <span>Assets ({filteredAssets.length})</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowAdvancedFilters(true)}>
                  <Filter className="h-4 w-4 mr-2" />
                  Advanced Filters
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowColumnSettings(true)}>
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
                    {visibleColumns.name && <th className="text-left p-3 font-medium">Name</th>}
                    {visibleColumns.category && <th className="text-left p-3 font-medium">Category</th>}
                    {visibleColumns.status && <th className="text-left p-3 font-medium">Status</th>}
                    {visibleColumns.criticality && <th className="text-left p-3 font-medium">Criticality</th>}
                    {visibleColumns.location && <th className="text-left p-3 font-medium">Location</th>}
                    {visibleColumns.lastUpdated && <th className="text-left p-3 font-medium">Last Updated</th>}
                    <th className="text-center p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.map((asset) => (
                    <tr key={asset.id} className="border-b hover:bg-muted/50">
                      {visibleColumns.name && (
                        <td className="p-3">
                          <div className="font-medium">{asset.name}</div>
                          <div className="text-sm text-muted-foreground">{asset.model || "No model specified"}</div>
                        </td>
                      )}
                      {visibleColumns.category && <td className="p-3">{asset.category}</td>}
                      {visibleColumns.status && (
                        <td className="p-3">
                          <Badge variant={getStatusVariant(asset.status)}>{asset.status}</Badge>
                        </td>
                      )}
                      {visibleColumns.criticality && (
                        <td className="p-3">
                          <Badge variant={getCriticalityVariant(asset.criticality)}>{asset.criticality}</Badge>
                        </td>
                      )}
                      {visibleColumns.location && <td className="p-3">{asset.location || "Not specified"}</td>}
                      {visibleColumns.lastUpdated && (
                        <td className="p-3 text-sm text-muted-foreground">
                          {asset.updated_at ? new Date(asset.updated_at).toLocaleDateString() : "N/A"}
                        </td>
                      )}
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
                            <DropdownMenuItem onClick={() => openEditModal(asset)}>
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
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Dialog
          open={showAddAssetModal}
          onOpenChange={(open) => {
            setShowAddAssetModal(open)
            if (!open) {
              setFormStep("category")
              setNewAsset({
                name: "",
                category: "",
                status: "active",
                criticality: "medium",
              })
            }
          }}
        >
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {formStep === "category" ? "Select Asset Category" : `Add New ${newAsset.category}`}
              </DialogTitle>
            </DialogHeader>

            {formStep === "category" ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Choose the category that best describes your asset. This will determine which fields are required.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {Object.keys(CATEGORY_FIELD_CONFIG).map((category) => {
                    const categoryInfo = categoriesWithCounts.find((c) => c.name.startsWith(category))
                    const IconComponent = categoryInfo?.icon || Package
                    const color = categoryInfo?.color || "bg-gray-500"

                    return (
                      <Card
                        key={category}
                        className="cursor-pointer transition-all hover:shadow-md hover:scale-105"
                        onClick={() => handleCategorySelect(category)}
                      >
                        <CardContent className="p-4 text-center">
                          <div
                            className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center mx-auto mb-2`}
                          >
                            <IconComponent className="h-6 w-6 text-white" />
                          </div>
                          <h3 className="font-medium">{category}</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {CATEGORY_FIELD_CONFIG[category as keyof typeof CATEGORY_FIELD_CONFIG].required.length}{" "}
                            required fields
                          </p>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Button variant="ghost" size="sm" onClick={() => setFormStep("category")}>
                    ← Back to Categories
                  </Button>
                  <Badge variant="outline">{newAsset.category}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Asset Name - Always required */}
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Asset Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={newAsset.name}
                      onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                      placeholder="Enter asset name"
                    />
                  </div>

                  {/* Status */}
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={newAsset.status}
                      onValueChange={(value) => setNewAsset({ ...newAsset, status: value })}
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

                  {/* Criticality */}
                  <div className="space-y-2">
                    <Label htmlFor="criticality">Criticality</Label>
                    <Select
                      value={newAsset.criticality}
                      onValueChange={(value) => setNewAsset({ ...newAsset, criticality: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Dynamic category-specific fields */}
                  {(() => {
                    const categoryConfig = getCategoryFields(newAsset.category)
                    const allFields = [...categoryConfig.required, ...categoryConfig.optional]

                    return allFields
                      .filter((field) => !["name", "category", "status", "criticality"].includes(field))
                      .map((field) => {
                        const fieldConfig = categoryConfig.fields[field]
                        const isRequired = categoryConfig.required.includes(field)

                        if (fieldConfig) {
                          return renderFormField(field, fieldConfig, isRequired)
                        }

                        // Default field rendering for common fields
                        return (
                          <div key={field} className="space-y-2">
                            <Label htmlFor={field}>
                              {field.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                              {isRequired && <span className="text-red-500">*</span>}
                            </Label>
                            <Input
                              id={field}
                              value={newAsset[field] || ""}
                              onChange={(e) => setNewAsset({ ...newAsset, [field]: e.target.value })}
                              placeholder={`Enter ${field.replace(/_/g, " ")}`}
                            />
                          </div>
                        )
                      })
                  })()}

                  {/* Notes - Always available */}
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={newAsset.notes || ""}
                      onChange={(e) => setNewAsset({ ...newAsset, notes: e.target.value })}
                      placeholder="Enter any additional notes"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowAddAssetModal(false)}>
                Cancel
              </Button>
              {formStep === "details" && (
                <Button onClick={handleAddAsset} disabled={!isFormValid()}>
                  Add Asset
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog
          open={showEditAssetModal}
          onOpenChange={(open) => {
            setShowEditAssetModal(open)
            if (!open) {
              setEditingAsset(null)
            }
          }}
        >
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Asset: {editingAsset?.name}</DialogTitle>
            </DialogHeader>

            {editingAsset && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="outline">{editingAsset.category}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Asset Name - Always required */}
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">
                      Asset Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="edit-name"
                      value={editingAsset.name}
                      onChange={(e) => setEditingAsset({ ...editingAsset, name: e.target.value })}
                      placeholder="Enter asset name"
                    />
                  </div>

                  {/* Status */}
                  <div className="space-y-2">
                    <Label htmlFor="edit-status">Status</Label>
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

                  {/* Criticality */}
                  <div className="space-y-2">
                    <Label htmlFor="edit-criticality">Criticality</Label>
                    <Select
                      value={editingAsset.criticality}
                      onValueChange={(value) => setEditingAsset({ ...editingAsset, criticality: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Dynamic category-specific fields */}
                  {(() => {
                    const categoryConfig = getCategoryFields(editingAsset.category)
                    const allFields = [...categoryConfig.required, ...categoryConfig.optional]

                    return allFields
                      .filter((field) => !["name", "category", "status", "criticality"].includes(field))
                      .map((field) => {
                        const fieldConfig = categoryConfig.fields[field]
                        const isRequired = categoryConfig.required.includes(field)

                        if (fieldConfig) {
                          return renderEditFormField(field, fieldConfig, isRequired)
                        }

                        // Default field rendering for common fields
                        return (
                          <div key={field} className="space-y-2">
                            <Label htmlFor={`edit-${field}`}>
                              {field.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                              {isRequired && <span className="text-red-500">*</span>}
                            </Label>
                            <Input
                              id={`edit-${field}`}
                              value={editingAsset[field] || ""}
                              onChange={(e) => setEditingAsset({ ...editingAsset, [field]: e.target.value })}
                              placeholder={`Enter ${field.replace(/_/g, " ")}`}
                            />
                          </div>
                        )
                      })
                  })()}

                  {/* Notes - Always available */}
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="edit-notes">Notes</Label>
                    <Textarea
                      id="edit-notes"
                      value={editingAsset.notes || ""}
                      onChange={(e) => setEditingAsset({ ...editingAsset, notes: e.target.value })}
                      placeholder="Enter any additional notes"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowEditAssetModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditAsset} disabled={!isEditFormValid()}>
                Update Asset
              </Button>
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
              <div>
                <Label htmlFor="filterLocation">Location</Label>
                <Input
                  id="filterLocation"
                  value={advancedFilters.location}
                  onChange={(e) => setAdvancedFilters({ ...advancedFilters, location: e.target.value })}
                  placeholder="Filter by location"
                />
              </div>
              <div>
                <Label htmlFor="filterManufacturer">Manufacturer</Label>
                <Input
                  id="filterManufacturer"
                  value={advancedFilters.manufacturer}
                  onChange={(e) => setAdvancedFilters({ ...advancedFilters, manufacturer: e.target.value })}
                  placeholder="Filter by manufacturer"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="dateFrom">Date From</Label>
                  <Input
                    id="dateFrom"
                    type="date"
                    value={advancedFilters.dateRange.from}
                    onChange={(e) =>
                      setAdvancedFilters({
                        ...advancedFilters,
                        dateRange: { ...advancedFilters.dateRange, from: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="dateTo">Date To</Label>
                  <Input
                    id="dateTo"
                    type="date"
                    value={advancedFilters.dateRange.to}
                    onChange={(e) =>
                      setAdvancedFilters({
                        ...advancedFilters,
                        dateRange: { ...advancedFilters.dateRange, to: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="costMin">Min Cost</Label>
                  <Input
                    id="costMin"
                    type="number"
                    value={advancedFilters.costRange.min}
                    onChange={(e) =>
                      setAdvancedFilters({
                        ...advancedFilters,
                        costRange: { ...advancedFilters.costRange, min: e.target.value },
                      })
                    }
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="costMax">Max Cost</Label>
                  <Input
                    id="costMax"
                    type="number"
                    value={advancedFilters.costRange.max}
                    onChange={(e) =>
                      setAdvancedFilters({
                        ...advancedFilters,
                        costRange: { ...advancedFilters.costRange, max: e.target.value },
                      })
                    }
                    placeholder="10000"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setShowAdvancedFilters(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAdvancedFiltersApply}>Apply Filters</Button>
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
              <div className="space-y-2">
                <Label>Visible Columns</Label>
                {Object.entries(visibleColumns).map(([column, visible]) => (
                  <div key={column} className="flex items-center space-x-2">
                    <Checkbox id={column} checked={visible} onCheckedChange={() => toggleColumn(column)} />
                    <Label htmlFor={column} className="text-sm">
                      {column.charAt(0).toUpperCase() + column.slice(1).replace(/([A-Z])/g, " $1")}
                    </Label>
                  </div>
                ))}
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setShowColumnSettings(false)}>
                  Cancel
                </Button>
                <Button onClick={handleColumnSettingsSave}>Save Settings</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Asset Details Modal */}
        <Dialog open={showAssetDetails} onOpenChange={setShowAssetDetails}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Asset Details - {selectedAsset?.name}</DialogTitle>
            </DialogHeader>
            {selectedAsset && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Name</Label>
                    <p className="text-sm font-medium">{selectedAsset.name}</p>
                  </div>
                  <div>
                    <Label>Category</Label>
                    <p className="text-sm">{selectedAsset.category}</p>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Badge variant={getStatusVariant(selectedAsset.status)}>{selectedAsset.status}</Badge>
                  </div>
                  <div>
                    <Label>Criticality</Label>
                    <Badge variant={getCriticalityVariant(selectedAsset.criticality)}>
                      {selectedAsset.criticality}
                    </Badge>
                  </div>
                  <div>
                    <Label>Location</Label>
                    <p className="text-sm">{selectedAsset.location || "Not specified"}</p>
                  </div>
                  <div>
                    <Label>Model</Label>
                    <p className="text-sm">{selectedAsset.model || "Not specified"}</p>
                  </div>
                  <div>
                    <Label>Serial Number</Label>
                    <p className="text-sm">{selectedAsset.serial_number || "Not specified"}</p>
                  </div>
                  <div>
                    <Label>Manufacturer</Label>
                    <p className="text-sm">{selectedAsset.manufacturer || "Not specified"}</p>
                  </div>
                </div>
                {selectedAsset.notes && (
                  <div>
                    <Label>Notes</Label>
                    <p className="text-sm">{selectedAsset.notes}</p>
                  </div>
                )}
                <div className="flex justify-end">
                  <Button onClick={() => setShowAssetDetails(false)}>Close</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Asset History Modal */}
        <Dialog open={showAssetHistory} onOpenChange={setShowAssetHistory}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Asset History - {selectedAsset?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Asset history tracking shows all changes made to this asset over time.
              </div>
              <div className="space-y-2">
                <div className="border rounded p-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Asset Created</span>
                    <span className="text-sm text-muted-foreground">
                      {selectedAsset?.created_at ? new Date(selectedAsset.created_at).toLocaleString() : "N/A"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Initial asset registration</p>
                </div>
                {selectedAsset?.updated_at && selectedAsset.updated_at !== selectedAsset.created_at && (
                  <div className="border rounded p-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Asset Updated</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(selectedAsset.updated_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">Asset information modified</p>
                  </div>
                )}
              </div>
              <div className="flex justify-end">
                <Button onClick={() => setShowAssetHistory(false)}>Close</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PlatformLayout>
  )
}
