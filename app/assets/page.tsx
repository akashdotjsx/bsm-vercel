"use client"

import { useState } from "react"
import { PlatformLayout } from "@/components/layout/platform-layout"
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
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const assetTypes = [
  { name: "Servers", count: 245, icon: Server, color: "bg-blue-500" },
  { name: "Workstations", count: 1234, icon: Monitor, color: "bg-green-500" },
  { name: "Mobile Devices", count: 567, icon: Smartphone, color: "bg-purple-500" },
  { name: "Cloud Resources", count: 89, icon: Cloud, color: "bg-cyan-500" },
  { name: "Databases", count: 34, icon: Database, color: "bg-orange-500" },
  { name: "Network Equipment", count: 156, icon: Network, color: "bg-red-500" },
  { name: "Storage", count: 78, icon: HardDrive, color: "bg-yellow-500" },
  { name: "Applications", count: 423, icon: Cpu, color: "bg-indigo-500" },
]

const serverAssets = [
  {
    id: "AST-001",
    name: "Web Server 01",
    hostname: "web01.company.com",
    ip: "192.168.1.10",
    os: "Ubuntu 20.04 LTS",
    cpu: "Intel Xeon E5-2680",
    memory: "32 GB",
    status: "Active",
    owner: "IT Operations",
    criticality: "High",
    location: "Data Center A",
    department: "IT",
  },
  {
    id: "AST-002",
    name: "Database Server",
    hostname: "db01.company.com",
    ip: "192.168.1.20",
    os: "Red Hat Enterprise Linux 8",
    cpu: "Intel Xeon Gold 6248",
    memory: "64 GB",
    status: "Active",
    owner: "Database Team",
    criticality: "Critical",
    location: "Data Center A",
    department: "IT",
  },
  {
    id: "AST-003",
    name: "Application Server",
    hostname: "app01.company.com",
    ip: "192.168.1.30",
    os: "Windows Server 2019",
    cpu: "Intel Xeon Silver 4214",
    memory: "16 GB",
    status: "Maintenance",
    owner: "Application Team",
    criticality: "Medium",
    location: "Data Center B",
    department: "Development",
  },
]

const workstationAssets = [
  {
    id: "WS-001",
    name: "Developer Workstation 1",
    hostname: "dev-ws-001",
    ip: "192.168.1.101",
    os: "Windows 11 Pro",
    cpu: "Intel Core i7-12700K",
    memory: "32GB DDR4",
    status: "active",
    owner: "John Smith",
    type: "Workstation",
    location: "Office Floor 2",
    service: "Development",
    criticality: "Medium",
  },
  {
    id: "WS-002",
    name: "Designer Workstation",
    hostname: "design-ws-002",
    ip: "192.168.1.102",
    os: "macOS Ventura",
    cpu: "Apple M2 Pro",
    memory: "64GB Unified",
    status: "active",
    owner: "Sarah Johnson",
    type: "Workstation",
    location: "Office Floor 3",
    service: "Design",
    criticality: "High",
  },
]

const mobileDeviceAssets = [
  {
    id: "MD-001",
    name: "iPhone 14 Pro",
    hostname: "iphone-001",
    ip: "192.168.1.201",
    os: "iOS 16.5",
    cpu: "A16 Bionic",
    memory: "256GB",
    status: "active",
    owner: "Mike Wilson",
    type: "Mobile Device",
    location: "Remote",
    service: "Sales",
    criticality: "Medium",
  },
  {
    id: "MD-002",
    name: "Samsung Galaxy S23",
    hostname: "galaxy-002",
    ip: "192.168.1.202",
    os: "Android 13",
    cpu: "Snapdragon 8 Gen 2",
    memory: "512GB",
    status: "active",
    owner: "Lisa Chen",
    type: "Mobile Device",
    location: "Office Floor 1",
    service: "Marketing",
    criticality: "Low",
  },
]

const cloudResourceAssets = [
  {
    id: "CR-001",
    name: "Production Web Server",
    hostname: "prod-web-01",
    ip: "10.0.1.10",
    os: "Ubuntu 22.04 LTS",
    cpu: "4 vCPUs",
    memory: "16GB",
    status: "active",
    owner: "DevOps Team",
    type: "Cloud Resource",
    location: "AWS us-east-1",
    service: "Web Application",
    criticality: "Critical",
  },
  {
    id: "CR-002",
    name: "Database Cluster",
    hostname: "db-cluster-01",
    ip: "10.0.2.10",
    os: "Amazon RDS",
    cpu: "8 vCPUs",
    memory: "64GB",
    status: "active",
    owner: "Database Team",
    type: "Cloud Resource",
    location: "AWS us-west-2",
    service: "Database",
    criticality: "Critical",
  },
]

const databaseAssets = [
  {
    id: "DB-001",
    name: "Customer Database",
    hostname: "customer-db-01",
    ip: "10.0.3.10",
    os: "PostgreSQL 15",
    cpu: "16 vCPUs",
    memory: "128GB",
    status: "active",
    owner: "Database Admin",
    type: "Database",
    location: "Data Center A",
    service: "Customer Management",
    criticality: "Critical",
  },
  {
    id: "DB-002",
    name: "Analytics Database",
    hostname: "analytics-db-01",
    ip: "10.0.3.11",
    os: "MySQL 8.0",
    cpu: "8 vCPUs",
    memory: "64GB",
    status: "maintenance",
    owner: "Analytics Team",
    type: "Database",
    location: "Data Center B",
    service: "Business Intelligence",
    criticality: "High",
  },
]

const networkEquipmentAssets = [
  {
    id: "NE-001",
    name: "Core Switch 1",
    hostname: "core-sw-01",
    ip: "192.168.0.1",
    os: "Cisco IOS XE",
    cpu: "Dual Core ARM",
    memory: "8GB",
    status: "active",
    owner: "Network Team",
    type: "Network Equipment",
    location: "Server Room A",
    service: "Network Infrastructure",
    criticality: "Critical",
  },
  {
    id: "NE-002",
    name: "Firewall Primary",
    hostname: "fw-primary-01",
    ip: "192.168.0.2",
    os: "FortiOS 7.2",
    cpu: "Intel Xeon",
    memory: "16GB",
    status: "active",
    owner: "Security Team",
    type: "Network Equipment",
    location: "Server Room A",
    service: "Security",
    criticality: "Critical",
  },
]

const storageAssets = [
  {
    id: "ST-001",
    name: "Primary SAN Storage",
    hostname: "san-primary-01",
    ip: "10.0.4.10",
    os: "NetApp ONTAP",
    cpu: "Multi-core Controller",
    memory: "512GB Cache",
    status: "active",
    owner: "Storage Admin",
    type: "Storage",
    location: "Data Center A",
    service: "Primary Storage",
    criticality: "Critical",
  },
  {
    id: "ST-002",
    name: "Backup Storage Array",
    hostname: "backup-array-01",
    ip: "10.0.4.11",
    os: "Dell EMC PowerVault",
    cpu: "Embedded Controller",
    memory: "128GB Cache",
    status: "active",
    owner: "Backup Team",
    type: "Storage",
    location: "Data Center B",
    service: "Backup & Recovery",
    criticality: "High",
  },
]

const applicationAssets = [
  {
    id: "APP-001",
    name: "CRM Application",
    hostname: "crm-app-01",
    ip: "10.0.5.10",
    os: "Red Hat Enterprise Linux",
    cpu: "8 vCPUs",
    memory: "32GB",
    status: "active",
    owner: "Application Team",
    type: "Application",
    location: "Private Cloud",
    service: "Customer Relations",
    criticality: "High",
  },
  {
    id: "APP-002",
    name: "ERP System",
    hostname: "erp-system-01",
    ip: "10.0.5.11",
    os: "Windows Server 2022",
    cpu: "16 vCPUs",
    memory: "64GB",
    status: "active",
    owner: "ERP Team",
    type: "Application",
    location: "Private Cloud",
    service: "Enterprise Resource Planning",
    criticality: "Critical",
  },
]

const getAssetsByCategory = (categoryName: string) => {
  switch (categoryName) {
    case "Servers":
      return serverAssets
    case "Workstations":
      return workstationAssets
    case "Mobile Devices":
      return mobileDeviceAssets
    case "Cloud Resources":
      return cloudResourceAssets
    case "Databases":
      return databaseAssets
    case "Network Equipment":
      return networkEquipmentAssets
    case "Storage":
      return storageAssets
    case "Applications":
      return applicationAssets
    default:
      return serverAssets
  }
}

const recentAssets = [
  {
    id: "AST-001",
    name: "Web Server - Production",
    type: "Server",
    status: "Active",
    owner: "IT Operations",
    location: "Data Center A",
    lastUpdated: "2 hours ago",
    criticality: "High",
    service: "E-commerce Platform",
  },
  {
    id: "AST-002",
    name: "Database Cluster - Primary",
    type: "Database",
    status: "Active",
    owner: "Database Team",
    location: "AWS US-East-1",
    lastUpdated: "4 hours ago",
    criticality: "Critical",
    service: "Customer Management",
  },
  {
    id: "AST-003",
    name: "Load Balancer - Main",
    type: "Network Equipment",
    status: "Active",
    owner: "Network Team",
    location: "Data Center B",
    lastUpdated: "1 day ago",
    criticality: "High",
    service: "Web Services",
  },
  {
    id: "AST-004",
    name: "Backup Storage Array",
    type: "Storage",
    status: "Maintenance",
    owner: "Storage Team",
    location: "Data Center A",
    lastUpdated: "3 days ago",
    criticality: "Medium",
    service: "Backup Services",
  },
]

const serviceMap = [
  {
    name: "E-commerce Platform",
    status: "Healthy",
    assets: 12,
    dependencies: 8,
    criticality: "Critical",
    uptime: "99.9%",
  },
  {
    name: "Customer Management",
    status: "Healthy",
    assets: 8,
    dependencies: 5,
    criticality: "High",
    uptime: "99.8%",
  },
  {
    name: "Analytics Platform",
    status: "Warning",
    assets: 15,
    dependencies: 12,
    criticality: "Medium",
    uptime: "99.5%",
  },
  {
    name: "Backup Services",
    status: "Maintenance",
    assets: 6,
    dependencies: 3,
    criticality: "Low",
    uptime: "98.2%",
  },
]

export default function AssetManagementPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedAssetType, setSelectedAssetType] = useState<string | null>(null)

  const [showAutoDiscoveryModal, setShowAutoDiscoveryModal] = useState(false)
  const [showImportAssetsModal, setShowImportAssetsModal] = useState(false)
  const [showAddAssetModal, setShowAddAssetModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showAssetDetailModal, setShowAssetDetailModal] = useState(false)
  const [showEditAssetModal, setShowEditAssetModal] = useState(false)
  const [showDependenciesModal, setShowDependenciesModal] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<any>(null)

  const [newAsset, setNewAsset] = useState({
    name: "",
    hostname: "",
    ip: "",
    os: "",
    cpu: "",
    memory: "",
    owner: "",
    criticality: "Medium",
    location: "",
    department: "",
    description: "",
  })

  const [discoveryConfig, setDiscoveryConfig] = useState({
    scanType: "network",
    ipRange: "",
    schedule: "daily",
    autoUpdate: true,
    credentials: "",
  })

  const [showServiceMapModal, setShowServiceMapModal] = useState(false)
  const [showDependencyModal, setShowDependencyModal] = useState(false)
  const [showDiscoveryModal, setShowDiscoveryModal] = useState(false)
  const [showImpactAnalysis, setShowImpactAnalysis] = useState(false)
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const [assets, setAssets] = useState(serverAssets)

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
      case "healthy":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "maintenance":
      case "warning":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "inactive":
      case "error":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
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

  const handleAssetAction = (action: string, asset?: any) => {
    setSelectedAsset(asset)
    switch (action) {
      case "view_details":
        setShowAssetDetailModal(true)
        break
      case "edit_asset":
        setNewAsset({
          ...asset,
          // Ensure all fields are properly initialized for editing
          cpu: asset.cpu || "Intel Xeon E5-2680",
          memory: asset.memory || "32GB DDR4",
          department: asset.department || "IT Operations",
        })
        setShowEditAssetModal(true)
        break
      case "view_dependencies":
        setShowDependenciesModal(true)
        break
    }
  }

  const handleExport = (format: string) => {
    console.log(`[v0] Exporting assets in ${format} format`)
    // Simulate export functionality
    const exportData = serverAssets.map((asset) => ({
      "Asset ID": asset.id,
      "Asset Name": asset.name,
      Hostname: asset.hostname,
      "IP Address": asset.ip,
      "Operating System": asset.os,
      CPU: asset.cpu,
      Memory: asset.memory,
      Status: asset.status,
      Owner: asset.owner,
      Criticality: asset.criticality,
    }))

    if (format === "excel") {
      // Simulate Excel export
      alert("Excel export started. File will be downloaded shortly.")
    } else if (format === "pdf") {
      // Simulate PDF export
      alert("PDF export started. File will be downloaded shortly.")
    }
    setShowExportModal(false)
  }

  const handleAddAsset = () => {
    console.log("[v0] Adding new asset:", newAsset)
    // Simulate adding asset to database
    alert("Asset added successfully!")
    setShowAddAssetModal(false)
    setNewAsset({
      name: "",
      hostname: "",
      ip: "",
      os: "",
      cpu: "",
      memory: "",
      owner: "",
      criticality: "Medium",
      location: "",
      department: "",
      description: "",
    })
  }

  const handleAutoDiscovery = () => {
    console.log("[v0] Starting auto discovery with config:", discoveryConfig)
    // Simulate auto discovery process
    alert("Auto discovery started. This process may take several minutes.")
    setShowAutoDiscoveryModal(false)
  }

  const handleImportAssets = (file: File | null) => {
    if (file) {
      console.log("[v0] Importing assets from file:", file.name)
      // Simulate file import
      alert(`Importing assets from ${file.name}. This may take a few minutes.`)
      setShowImportAssetsModal(false)
    }
  }

  const handleAssetTypeClick = (assetTypeName: string) => {
    setSelectedAssetType(assetTypeName)
  }

  const handleBackToOverview = () => {
    setSelectedAssetType(null)
  }

  const handleAssetClick = (assetId: string) => {
    console.log("[v0] Asset clicked:", assetId)
    // Navigate to detailed asset page
  }

  const handleServiceMapAction = (action: string, serviceName?: string) => {
    console.log("[v0] Service Map action:", action, serviceName)
    switch (action) {
      case "view_map":
        setSelectedService(serviceName || null)
        setShowServiceMapModal(true)
        break
      case "view_health":
        alert(`Viewing health dashboard for ${serviceName}`)
        break
      case "map_service":
        setShowServiceMapModal(true)
        break
      case "service_topology":
        alert("Opening Service Topology Viewer...")
        break
    }
  }

  const handleDependencyAction = (action: string, dependency?: string) => {
    console.log("[v0] Dependency action:", action, dependency)
    switch (action) {
      case "impact_analysis":
        setShowImpactAnalysis(true)
        break
      case "launch_viewer":
        setShowDependencyModal(true)
        break
      case "view_dependency":
        alert(`Viewing details for ${dependency}`)
        break
    }
  }

  const handleDiscoveryAction = (action: string, type?: string) => {
    console.log("[v0] Discovery action:", action, type)
    switch (action) {
      case "run_network_scan":
        alert("Starting network scan... This may take several minutes.")
        break
      case "sync_cloud":
        alert("Syncing cloud resources from AWS, Azure, and GCP...")
        break
      case "manage_agents":
        alert("Opening Agent Management Console...")
        break
      case "schedule_discovery":
        setShowDiscoveryModal(true)
        break
      case "add_rule":
        setShowDiscoveryModal(true)
        break
      case "edit_rule":
        alert(`Editing discovery rule: ${type}`)
        break
      case "run_now":
        alert(`Running discovery rule: ${type}`)
        break
    }
  }

  if (selectedAssetType) {
    return (
      <PlatformLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={() => setSelectedAssetType(null)}>
                ← Back to Assets
              </Button>
              <div>
                <h1 className="text-2xl font-semibold text-foreground">{selectedAssetType}</h1>
                <p className="text-sm text-muted-foreground">
                  Detailed listing of all {selectedAssetType.toLowerCase()}
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
                Add {selectedAssetType.slice(0, -1)}
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Search ${selectedAssetType.toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-[13px]"
              />
            </div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-48 text-[13px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="text-[13px] bg-transparent">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>

          {/* Assets Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 text-[13px] font-medium text-gray-600">Asset Name</th>
                  <th className="text-left p-3 text-[13px] font-medium text-gray-600">Hostname</th>
                  <th className="text-left p-3 text-[13px] font-medium text-gray-600">IP Address</th>
                  <th className="text-left p-3 text-[13px] font-medium text-gray-600">Operating System</th>
                  <th className="text-left p-3 text-[13px] font-medium text-gray-600">CPU</th>
                  <th className="text-left p-3 text-[13px] font-medium text-gray-600">Memory</th>
                  <th className="text-left p-3 text-[13px] font-medium text-gray-600">Status</th>
                  <th className="text-left p-3 text-[13px] font-medium text-gray-600">Owner</th>
                  <th className="text-left p-3 text-[13px] font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {getAssetsByCategory(selectedAssetType).map((asset, index) => (
                  <tr
                    key={asset.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleAssetAction("view_details", asset)}
                  >
                    <td className="p-3">
                      <div>
                        <p className="text-[13px] font-medium">{asset.name}</p>
                        <p className="text-[11px] text-gray-500">{asset.id}</p>
                      </div>
                    </td>
                    <td className="p-3 text-[13px]">{asset.hostname}</td>
                    <td className="p-3 text-[13px]">{asset.ip}</td>
                    <td className="p-3 text-[13px]">{asset.os}</td>
                    <td className="p-3 text-[13px]">{asset.cpu}</td>
                    <td className="p-3 text-[13px]">{asset.memory}</td>
                    <td className="p-3">
                      <Badge className={`${getStatusColor(asset.status)} text-[11px]`}>{asset.status}</Badge>
                    </td>
                    <td className="p-3 text-[13px]">{asset.owner}</td>
                    <td className="p-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="text-[13px]">
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
          </div>
        </div>
      </PlatformLayout>
    )
  }

  return (
    <PlatformLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Asset Management</h1>
            <p className="text-sm text-muted-foreground">
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
          {assetTypes.map((type) => {
            const Icon = type.icon
            return (
              <Card
                key={type.name}
                className="hover:shadow-md transition-shadow cursor-pointer border-gray-100"
                onClick={() => setSelectedAssetType(type.name)}
              >
                <CardContent className="p-2 text-center">
                  <div className={`p-1.5 rounded-lg ${type.color} mx-auto mb-1 w-fit`}>
                    <Icon className="h-3 w-3 text-white" />
                  </div>
                  <p className="text-[11px] font-medium mb-1">{type.name}</p>
                  <p className="text-xl font-bold text-foreground">{type.count.toLocaleString()}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="assets" className="space-y-4">
          <TabsList className="bg-transparent border-b border-gray-100 rounded-none p-0 h-auto w-full justify-start space-x-0">
            <TabsTrigger
              value="assets"
              className="text-[13px] font-medium px-4 py-2 bg-transparent border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-500 data-[state=active]:bg-transparent text-gray-500 hover:text-gray-700 rounded-none shadow-none"
            >
              Assets
            </TabsTrigger>
            <TabsTrigger
              value="servicemap"
              className="text-[13px] font-medium px-4 py-2 bg-transparent border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-500 data-[state=active]:bg-transparent text-gray-500 hover:text-gray-700 rounded-none shadow-none"
            >
              ServiceMap
            </TabsTrigger>
            <TabsTrigger
              value="dependencies"
              className="text-[13px] font-medium px-4 py-2 bg-transparent border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-500 data-[state=active]:bg-transparent text-gray-500 hover:text-gray-700 rounded-none shadow-none"
            >
              Dependencies
            </TabsTrigger>
            <TabsTrigger
              value="discovery"
              className="text-[13px] font-medium px-4 py-2 bg-transparent border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-500 data-[state=active]:bg-transparent text-gray-500 hover:text-gray-700 rounded-none shadow-none"
            >
              Discovery
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assets" className="space-y-4">
            {/* Filters */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search assets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 text-[13px]"
                />
              </div>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-48 text-[13px]">
                  <SelectValue placeholder="Asset Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="server">Servers</SelectItem>
                  <SelectItem value="workstation">Workstations</SelectItem>
                  <SelectItem value="mobile">Mobile Devices</SelectItem>
                  <SelectItem value="cloud">Cloud Resources</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-48 text-[13px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="text-[13px] bg-transparent">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </Button>
              <Button variant="outline" size="sm" className="text-[13px] bg-transparent">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>

            <Card className="border-gray-100">
              <CardHeader>
                <CardTitle className="text-[15px]">Configuration Items (CIs)</CardTitle>
                <CardDescription className="text-[13px]">
                  Centralized inventory of all IT assets and their relationships
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 text-[13px] font-medium text-muted-foreground">Asset Name</th>
                        <th className="text-left p-3 text-[13px] font-medium text-muted-foreground">Type</th>
                        <th className="text-left p-3 text-[13px] font-medium text-muted-foreground">Status</th>
                        <th className="text-left p-3 text-[13px] font-medium text-muted-foreground">Owner</th>
                        <th className="text-left p-3 text-[13px] font-medium text-muted-foreground">Location</th>
                        <th className="text-left p-3 text-[13px] font-medium text-muted-foreground">Service</th>
                        <th className="text-left p-3 text-[13px] font-medium text-muted-foreground">Criticality</th>
                        <th className="text-left p-3 text-[13px] font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentAssets.map((asset, index) => (
                        <tr
                          key={asset.id}
                          className={`hover:bg-muted/30 cursor-pointer ${index % 2 === 0 ? "bg-background" : "bg-muted/20"}`}
                          onClick={() => handleAssetClick(asset.id)}
                        >
                          <td className="p-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                <Server className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <p className="text-[13px] font-medium">{asset.name}</p>
                                <p className="text-[11px] text-muted-foreground">{asset.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-[13px]">{asset.type}</td>
                          <td className="p-3">
                            <Badge className={`${getStatusColor(asset.status)} text-[11px]`}>{asset.status}</Badge>
                          </td>
                          <td className="p-3 text-[13px]">{asset.owner}</td>
                          <td className="p-3 text-[13px]">{asset.location}</td>
                          <td className="p-3 text-[13px]">{asset.service}</td>
                          <td className="p-3">
                            <Badge className={`${getCriticalityColor(asset.criticality)} text-[10px]`}>
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
                              <DropdownMenuContent align="end" className="text-[13px]">
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
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="servicemap" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold" style={{ fontFamily: "Inter", fontSize: "18px" }}>
                  Business Service Mapping
                </h2>
                <p className="text-[13px] text-muted-foreground" style={{ fontFamily: "Inter" }}>
                  Visual representation of business services and their supporting assets
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-[13px] bg-transparent"
                  style={{ fontFamily: "Inter" }}
                  onClick={() => handleServiceMapAction("service_topology")}
                >
                  <GitBranch className="h-4 w-4 mr-2" />
                  Service Topology
                </Button>
                <Button
                  size="sm"
                  className="text-[13px]"
                  style={{ fontFamily: "Inter" }}
                  onClick={() => handleServiceMapAction("map_service")}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Map Service
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {serviceMap.map((service) => (
                <Card key={service.name} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-[13px] font-medium">{service.name}</h3>
                      <Badge className={`${getStatusColor(service.status)} text-[11px]`}>{service.status}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-[13px]">
                      <div>
                        <p className="text-muted-foreground text-[11px]">Assets</p>
                        <p className="font-medium">{service.assets}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-[11px]">Dependencies</p>
                        <p className="font-medium">{service.dependencies}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-[11px]">Criticality</p>
                        <Badge className={`${getCriticalityColor(service.criticality)} text-[10px]`}>
                          {service.criticality}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-[11px]">Uptime</p>
                        <p className="font-medium text-green-600 text-[13px]">{service.uptime}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-[11px] flex-1 bg-transparent"
                        style={{ fontFamily: "Inter" }}
                        onClick={() => handleServiceMapAction("view_map", service.name)}
                      >
                        <GitBranch className="h-3 w-3 mr-1" />
                        View Map
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-[11px] flex-1 bg-transparent"
                        style={{ fontFamily: "Inter" }}
                        onClick={() => handleServiceMapAction("view_health", service.name)}
                      >
                        <Activity className="h-3 w-3 mr-1" />
                        Health
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="dependencies" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold" style={{ fontFamily: "Inter", fontSize: "18px" }}>
                  Dependency Mapping
                </h2>
                <p className="text-[13px] text-muted-foreground" style={{ fontFamily: "Inter" }}>
                  Relationship visualization and impact analysis
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-[13px] bg-transparent"
                  style={{ fontFamily: "Inter" }}
                  onClick={() => handleDependencyAction("impact_analysis")}
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Impact Analysis
                </Button>
                <Button
                  size="sm"
                  className="text-[13px]"
                  style={{ fontFamily: "Inter" }}
                  onClick={() => handleDependencyAction("launch_viewer")}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Launch Viewer
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-[15px]" style={{ fontFamily: "Inter" }}>
                    Upstream Dependencies
                  </CardTitle>
                  <CardDescription className="text-[13px]" style={{ fontFamily: "Inter" }}>
                    Services this system depends on
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {["Database Cluster", "Load Balancer", "Authentication Service"].map((dep) => (
                      <div
                        key={dep}
                        className="flex items-center justify-between p-2 border rounded cursor-pointer hover:bg-muted/30"
                        onClick={() => handleDependencyAction("view_dependency", dep)}
                      >
                        <span className="text-[13px]" style={{ fontFamily: "Inter" }}>
                          {dep}
                        </span>
                        <Badge className="bg-green-100 text-green-800 text-[10px]" style={{ fontFamily: "Inter" }}>
                          Healthy
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-[15px]" style={{ fontFamily: "Inter" }}>
                    Downstream Dependencies
                  </CardTitle>
                  <CardDescription className="text-[13px]" style={{ fontFamily: "Inter" }}>
                    Services that depend on this system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {["Web Application", "Mobile API", "Reporting Service"].map((dep) => (
                      <div
                        key={dep}
                        className="flex items-center justify-between p-2 border rounded cursor-pointer hover:bg-muted/30"
                        onClick={() => handleDependencyAction("view_dependency", dep)}
                      >
                        <span className="text-[13px]" style={{ fontFamily: "Inter" }}>
                          {dep}
                        </span>
                        <Badge className="bg-green-100 text-green-800 text-[10px]" style={{ fontFamily: "Inter" }}>
                          Healthy
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="discovery" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold" style={{ fontFamily: "Inter", fontSize: "18px" }}>
                  Asset Discovery
                </h2>
                <p className="text-[13px] text-muted-foreground" style={{ fontFamily: "Inter" }}>
                  Automated discovery and inventory management
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-[13px] bg-transparent"
                  style={{ fontFamily: "Inter" }}
                  onClick={() => handleDiscoveryAction("schedule_discovery")}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Schedule Discovery
                </Button>
                <Button
                  size="sm"
                  className="text-[13px]"
                  style={{ fontFamily: "Inter" }}
                  onClick={() => handleDiscoveryAction("add_rule")}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Discovery Rule
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Network className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-[13px] font-medium">Network Scan</p>
                      <p className="text-[11px] text-muted-foreground">Last: 2 hours ago</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[11px]" style={{ fontFamily: "Inter" }}>
                      <span>Discovered: 245 assets</span>
                      <span className="text-green-600">+12 new</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-[11px] bg-transparent"
                      style={{ fontFamily: "Inter" }}
                      onClick={() => handleDiscoveryAction("run_network_scan")}
                    >
                      Run Network Scan
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Cloud className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-[13px] font-medium">Cloud Discovery</p>
                      <p className="text-[11px] text-muted-foreground">Last: 1 hour ago</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[11px]" style={{ fontFamily: "Inter" }}>
                      <span>AWS, Azure, GCP</span>
                      <span className="text-blue-600">89 resources</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-[11px] bg-transparent"
                      style={{ fontFamily: "Inter" }}
                      onClick={() => handleDiscoveryAction("sync_cloud")}
                    >
                      Sync Cloud Resources
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Database className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-[13px] font-medium">Agent Discovery</p>
                      <p className="text-[11px] text-muted-foreground">Active: 1,234 agents</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[11px]" style={{ fontFamily: "Inter" }}>
                      <span>Online: 1,198</span>
                      <span className="text-red-600">Offline: 36</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-[11px] bg-transparent"
                      style={{ fontFamily: "Inter" }}
                      onClick={() => handleDiscoveryAction("manage_agents")}
                    >
                      Manage Agents
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-[15px]" style={{ fontFamily: "Inter" }}>
                  Discovery Rules
                </CardTitle>
                <CardDescription className="text-[13px]" style={{ fontFamily: "Inter" }}>
                  Configure automated discovery schedules and criteria
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: "Daily Network Scan", schedule: "Every day at 2:00 AM", status: "Active" },
                    { name: "Cloud Resource Sync", schedule: "Every 4 hours", status: "Active" },
                    { name: "Agent Health Check", schedule: "Every 15 minutes", status: "Active" },
                  ].map((rule) => (
                    <div key={rule.name} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="text-[13px] font-medium" style={{ fontFamily: "Inter" }}>
                          {rule.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground" style={{ fontFamily: "Inter" }}>
                          {rule.schedule}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-100 text-green-800 text-[10px]" style={{ fontFamily: "Inter" }}>
                          {rule.status}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="text-[13px]" style={{ fontFamily: "Inter" }}>
                            <DropdownMenuItem onClick={() => handleDiscoveryAction("edit_rule", rule.name)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Rule
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDiscoveryAction("run_now", rule.name)}>
                              <Zap className="h-4 w-4 mr-2" />
                              Run Now
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={showAutoDiscoveryModal} onOpenChange={setShowAutoDiscoveryModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-[18px]">Auto Discovery Configuration</DialogTitle>
              <DialogDescription className="text-[13px]">
                Configure automated asset discovery settings and parameters
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="scan-type" className="text-[13px]">
                    Discovery Type
                  </Label>
                  <Select
                    value={discoveryConfig.scanType}
                    onValueChange={(value) => setDiscoveryConfig({ ...discoveryConfig, scanType: value })}
                  >
                    <SelectTrigger className="text-[13px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="network">Network Scan</SelectItem>
                      <SelectItem value="cloud">Cloud Discovery</SelectItem>
                      <SelectItem value="agent">Agent-based</SelectItem>
                      <SelectItem value="wmi">WMI Discovery</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="schedule" className="text-[13px]">
                    Schedule
                  </Label>
                  <Select
                    value={discoveryConfig.schedule}
                    onValueChange={(value) => setDiscoveryConfig({ ...discoveryConfig, schedule: value })}
                  >
                    <SelectTrigger className="text-[13px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="hourly">Every Hour</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="ip-range" className="text-[13px]">
                  IP Range / Target
                </Label>
                <Input
                  id="ip-range"
                  placeholder="192.168.1.0/24 or specific hostnames"
                  value={discoveryConfig.ipRange}
                  onChange={(e) => setDiscoveryConfig({ ...discoveryConfig, ipRange: e.target.value })}
                  className="text-[13px]"
                />
              </div>
              <div>
                <Label htmlFor="credentials" className="text-[13px]">
                  Credentials (Optional)
                </Label>
                <Input
                  id="credentials"
                  type="password"
                  placeholder="Discovery credentials"
                  value={discoveryConfig.credentials}
                  onChange={(e) => setDiscoveryConfig({ ...discoveryConfig, credentials: e.target.value })}
                  className="text-[13px]"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="auto-update"
                  checked={discoveryConfig.autoUpdate}
                  onCheckedChange={(checked) => setDiscoveryConfig({ ...discoveryConfig, autoUpdate: checked })}
                />
                <Label htmlFor="auto-update" className="text-[13px]">
                  Automatically update existing assets
                </Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAutoDiscoveryModal(false)} className="text-[13px]">
                  Cancel
                </Button>
                <Button onClick={handleAutoDiscovery} className="text-[13px]">
                  Start Discovery
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showImportAssetsModal} onOpenChange={setShowImportAssetsModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-[18px]">Import Assets</DialogTitle>
              <DialogDescription className="text-[13px]">
                Import assets from CSV, Excel, or other supported formats
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="import-file" className="text-[13px]">
                  Select File
                </Label>
                <Input
                  id="import-file"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null
                    if (file) {
                      console.log("[v0] File selected:", file.name)
                    }
                  }}
                  className="text-[13px]"
                />
                <p className="text-[11px] text-gray-500 mt-1">Supported formats: CSV, Excel (.xlsx, .xls)</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-[13px] font-medium mb-2">Required Columns:</h4>
                <ul className="text-[11px] text-gray-600 space-y-1">
                  <li>• Asset Name (required)</li>
                  <li>• Hostname</li>
                  <li>• IP Address</li>
                  <li>• Operating System</li>
                  <li>• Owner</li>
                  <li>• Status</li>
                </ul>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="validate-import" defaultChecked />
                <Label htmlFor="validate-import" className="text-[13px]">
                  Validate data before import
                </Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowImportAssetsModal(false)} className="text-[13px]">
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    const fileInput = document.getElementById("import-file") as HTMLInputElement
                    const file = fileInput?.files?.[0] || null
                    handleImportAssets(file)
                  }}
                  className="text-[13px]"
                >
                  Import Assets
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showAddAssetModal} onOpenChange={setShowAddAssetModal}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-[18px]">Add New Asset</DialogTitle>
              <DialogDescription className="text-[13px]">
                Add a new asset to the configuration management database
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="asset-name" className="text-[13px]">
                    Asset Name *
                  </Label>
                  <Input
                    id="asset-name"
                    placeholder="Enter asset name"
                    value={newAsset.name}
                    onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                    className="text-[13px]"
                  />
                </div>
                <div>
                  <Label htmlFor="hostname" className="text-[13px]">
                    Hostname
                  </Label>
                  <Input
                    id="hostname"
                    placeholder="server.company.com"
                    value={newAsset.hostname}
                    onChange={(e) => setNewAsset({ ...newAsset, hostname: e.target.value })}
                    className="text-[13px]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ip-address" className="text-[13px]">
                    IP Address
                  </Label>
                  <Input
                    id="ip-address"
                    placeholder="192.168.1.100"
                    value={newAsset.ip}
                    onChange={(e) => setNewAsset({ ...newAsset, ip: e.target.value })}
                    className="text-[13px]"
                  />
                </div>
                <div>
                  <Label htmlFor="operating-system" className="text-[13px]">
                    Operating System
                  </Label>
                  <Input
                    id="operating-system"
                    placeholder="Ubuntu 20.04 LTS"
                    value={newAsset.os}
                    onChange={(e) => setNewAsset({ ...newAsset, os: e.target.value })}
                    className="text-[13px]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cpu" className="text-[13px]">
                    CPU
                  </Label>
                  <Input
                    id="cpu"
                    placeholder="Intel Xeon E5-2680"
                    value={newAsset.cpu}
                    onChange={(e) => setNewAsset({ ...newAsset, cpu: e.target.value })}
                    className="text-[13px]"
                  />
                </div>
                <div>
                  <Label htmlFor="memory" className="text-[13px]">
                    Memory
                  </Label>
                  <Input
                    id="memory"
                    placeholder="32 GB"
                    value={newAsset.memory}
                    onChange={(e) => setNewAsset({ ...newAsset, memory: e.target.value })}
                    className="text-[13px]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="owner" className="text-[13px]">
                    Owner
                  </Label>
                  <Input
                    id="owner"
                    placeholder="IT Operations"
                    value={newAsset.owner}
                    onChange={(e) => setNewAsset({ ...newAsset, owner: e.target.value })}
                    className="text-[13px]"
                  />
                </div>
                <div>
                  <Label htmlFor="criticality" className="text-[13px]">
                    Criticality
                  </Label>
                  <Select
                    value={newAsset.criticality}
                    onValueChange={(value) => setNewAsset({ ...newAsset, criticality: value })}
                  >
                    <SelectTrigger className="text-[13px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="location" className="text-[13px]">
                    Location
                  </Label>
                  <Input
                    id="location"
                    placeholder="Data Center A"
                    value={newAsset.location}
                    onChange={(e) => setNewAsset({ ...newAsset, location: e.target.value })}
                    className="text-[13px]"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description" className="text-[13px]">
                  Description
                </Label>
                <Textarea
                  id="description"
                  placeholder="Asset description and notes"
                  value={newAsset.description}
                  onChange={(e) => setNewAsset({ ...newAsset, description: e.target.value })}
                  className="text-[13px]"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddAssetModal(false)} className="text-[13px]">
                  Cancel
                </Button>
                <Button onClick={handleAddAsset} className="text-[13px]">
                  Add Asset
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-[18px]">Export Assets</DialogTitle>
              <DialogDescription className="text-[13px]">
                Choose export format and options for asset data
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-[13px]">Export Format</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <Button
                    variant="outline"
                    className="h-20 flex-col gap-2 bg-transparent"
                    onClick={() => handleExport("excel")}
                  >
                    <FileSpreadsheet className="h-8 w-8 text-green-600" />
                    <span className="text-[13px]">Excel (.xlsx)</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex-col gap-2 bg-transparent"
                    onClick={() => handleExport("pdf")}
                  >
                    <FileText className="h-8 w-8 text-red-600" />
                    <span className="text-[13px]">PDF Report</span>
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[13px]">Export Options</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch id="include-inactive" defaultChecked />
                    <Label htmlFor="include-inactive" className="text-[13px]">
                      Include inactive assets
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="include-dependencies" />
                    <Label htmlFor="include-dependencies" className="text-[13px]">
                      Include dependency information
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="include-metrics" />
                    <Label htmlFor="include-metrics" className="text-[13px]">
                      Include performance metrics
                    </Label>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowExportModal(false)} className="text-[13px]">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showAssetDetailModal} onOpenChange={setShowAssetDetailModal}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="text-[18px]">Asset Details - {selectedAsset?.name}</DialogTitle>
              <DialogDescription className="text-[13px]">
                Comprehensive information about {selectedAsset?.id}
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
                      <p className="text-[11px] text-gray-500 mt-1">Criticality</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Badge className={getStatusColor(selectedAsset.status)}>{selectedAsset.status}</Badge>
                      <p className="text-[11px] text-gray-500 mt-1">Status</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-[13px] font-medium">{selectedAsset.location}</p>
                      <p className="text-[11px] text-gray-500 mt-1">Location</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-[13px] font-medium">{selectedAsset.department}</p>
                      <p className="text-[11px] text-gray-500 mt-1">Department</p>
                    </CardContent>
                  </Card>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-[15px] font-medium mb-3">Technical Specifications</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-[13px] text-gray-600">Hostname:</span>
                        <span className="text-[13px]">{selectedAsset.hostname}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[13px] text-gray-600">IP Address:</span>
                        <span className="text-[13px]">{selectedAsset.ip}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[13px] text-gray-600">Operating System:</span>
                        <span className="text-[13px]">{selectedAsset.os}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[13px] text-gray-600">CPU:</span>
                        <span className="text-[13px]">{selectedAsset.cpu}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[13px] text-gray-600">Memory:</span>
                        <span className="text-[13px]">{selectedAsset.memory}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-[15px] font-medium mb-3">Management Information</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-[13px] text-gray-600">Owner:</span>
                        <span className="text-[13px]">{selectedAsset.owner}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[13px] text-gray-600">Asset ID:</span>
                        <span className="text-[13px]">{selectedAsset.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[13px] text-gray-600">Last Updated:</span>
                        <span className="text-[13px]">2 hours ago</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[13px] text-gray-600">Discovery Method:</span>
                        <span className="text-[13px]">Network Scan</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowAssetDetailModal(false)} className="text-[13px]">
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      setShowAssetDetailModal(false)
                      handleAssetAction("edit_asset", selectedAsset)
                    }}
                    className="text-[13px]"
                  >
                    Edit Asset
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={showEditAssetModal} onOpenChange={setShowEditAssetModal}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-[18px]">Edit Asset</DialogTitle>
              <DialogDescription className="text-[13px]">Update asset information and configuration</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-asset-name" className="text-[13px]">
                    Asset Name *
                  </Label>
                  <Input
                    id="edit-asset-name"
                    value={newAsset.name}
                    onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                    className="text-[13px]"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-hostname" className="text-[13px]">
                    Hostname
                  </Label>
                  <Input
                    id="edit-hostname"
                    value={newAsset.hostname}
                    onChange={(e) => setNewAsset({ ...newAsset, hostname: e.target.value })}
                    className="text-[13px]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-ip" className="text-[13px]">
                    IP Address
                  </Label>
                  <Input
                    id="edit-ip"
                    value={newAsset.ip}
                    onChange={(e) => setNewAsset({ ...newAsset, ip: e.target.value })}
                    className="text-[13px]"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-os" className="text-[13px]">
                    Operating System
                  </Label>
                  <Input
                    id="edit-os"
                    value={newAsset.os}
                    onChange={(e) => setNewAsset({ ...newAsset, os: e.target.value })}
                    className="text-[13px]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-cpu" className="text-[13px]">
                    CPU
                  </Label>
                  <Input
                    id="edit-cpu"
                    value={newAsset.cpu}
                    onChange={(e) => setNewAsset({ ...newAsset, cpu: e.target.value })}
                    className="text-[13px]"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-memory" className="text-[13px]">
                    Memory
                  </Label>
                  <Input
                    id="edit-memory"
                    value={newAsset.memory}
                    onChange={(e) => setNewAsset({ ...newAsset, memory: e.target.value })}
                    className="text-[13px]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit-owner" className="text-[13px]">
                    Owner
                  </Label>
                  <Input
                    id="edit-owner"
                    value={newAsset.owner}
                    onChange={(e) => setNewAsset({ ...newAsset, owner: e.target.value })}
                    className="text-[13px]"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-criticality" className="text-[13px]">
                    Criticality
                  </Label>
                  <Select
                    value={newAsset.criticality}
                    onValueChange={(value) => setNewAsset({ ...newAsset, criticality: value })}
                  >
                    <SelectTrigger className="text-[13px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-location" className="text-[13px]">
                    Location
                  </Label>
                  <Input
                    id="edit-location"
                    value={newAsset.location}
                    onChange={(e) => setNewAsset({ ...newAsset, location: e.target.value })}
                    className="text-[13px]"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-department" className="text-[13px]">
                  Department
                </Label>
                <Select
                  value={newAsset.department}
                  onValueChange={(value) => setNewAsset({ ...newAsset, department: value })}
                >
                  <SelectTrigger className="text-[13px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IT Operations">IT Operations</SelectItem>
                    <SelectItem value="Development">Development</SelectItem>
                    <SelectItem value="Security">Security</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="HR">HR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowEditAssetModal(false)} className="text-[13px]">
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    console.log("[v0] Updating asset:", newAsset)

                    // Update the asset in the assets array
                    setAssets((prevAssets) =>
                      prevAssets.map((asset) => (asset.id === newAsset.id ? { ...asset, ...newAsset } : asset)),
                    )

                    // Update selected asset if it's the same one
                    if (selectedAsset?.id === newAsset.id) {
                      setSelectedAsset({ ...selectedAsset, ...newAsset })
                    }

                    setShowEditAssetModal(false)

                    // Show success notification
                    setTimeout(() => {
                      alert(`Asset "${newAsset.name}" has been updated successfully!`)
                    }, 100)
                  }}
                  className="text-[13px]"
                >
                  Update Asset
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showDependenciesModal} onOpenChange={setShowDependenciesModal}>
          <DialogContent className="max-w-5xl">
            <DialogHeader>
              <DialogTitle className="text-[18px]">Asset Dependencies - {selectedAsset?.name}</DialogTitle>
              <DialogDescription className="text-[13px]">
                View and manage asset dependencies and relationships
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-[15px] flex items-center gap-2">
                      <ArrowUp className="h-4 w-4" />
                      Upstream Dependencies
                    </CardTitle>
                    <CardDescription className="text-[13px]">Assets this system depends on</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { name: "Load Balancer", id: "AST-005", status: "Healthy", criticality: "High" },
                        { name: "Database Server", id: "AST-012", status: "Warning", criticality: "Critical" },
                        { name: "Storage Array", id: "AST-018", status: "Healthy", criticality: "Medium" },
                      ].map((dep) => (
                        <div key={dep.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[13px] font-medium">{dep.name}</span>
                              <Badge variant="outline" className="text-[10px]">
                                {dep.id}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                className={
                                  dep.status === "Healthy"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }
                                className="text-[10px]"
                              >
                                {dep.status}
                              </Badge>
                              <Badge className={getCriticalityColor(dep.criticality)} className="text-[10px]">
                                {dep.criticality}
                              </Badge>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="text-[11px]">
                            View
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-[15px] flex items-center gap-2">
                      <ArrowDown className="h-4 w-4" />
                      Downstream Dependencies
                    </CardTitle>
                    <CardDescription className="text-[13px]">Assets that depend on this system</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { name: "Web Application", id: "AST-025", status: "Healthy", criticality: "High" },
                        { name: "Mobile API", id: "AST-031", status: "Healthy", criticality: "Medium" },
                        { name: "Reporting Service", id: "AST-042", status: "Healthy", criticality: "Low" },
                      ].map((dep) => (
                        <div key={dep.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[13px] font-medium">{dep.name}</span>
                              <Badge variant="outline" className="text-[10px]">
                                {dep.id}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className="bg-green-100 text-green-800 text-[10px]">{dep.status}</Badge>
                              <Badge className={getCriticalityColor(dep.criticality)} className="text-[10px]">
                                {dep.criticality}
                              </Badge>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="text-[11px]">
                            View
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-[15px]">Dependency Impact Analysis</CardTitle>
                  <CardDescription className="text-[13px]">
                    Potential impact if this asset becomes unavailable
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-[20px] font-bold text-red-600">3</div>
                      <div className="text-[13px] text-red-700">Critical Services</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-[20px] font-bold text-yellow-600">150</div>
                      <div className="text-[13px] text-yellow-700">Affected Users</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-[20px] font-bold text-blue-600">$2.5K</div>
                      <div className="text-[13px] text-blue-700">Hourly Cost Impact</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowDependenciesModal(false)} className="text-[13px]">
                  Close
                </Button>
                <Button className="text-[13px]">Export Dependencies</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PlatformLayout>
  )
}
