"use client"

import { PageContent } from "@/components/layout/page-content"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import {
  Building,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Mail,
  Phone,
  Globe,
  MessageSquare,
  User,
  Edit,
  Trash2,
  Eye,
  Hash,
  Type,
  CheckSquare,
  List,
  Calendar,
  Clock,
  ToggleLeft,
  Link,
  AlertTriangle,
} from "lucide-react"
import { useState } from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { useOrganizationsGQL } from "@/hooks/use-workflows-organizations-gql"


const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  })
}

const getStatusChip = (status: string) => {
  const isActive = status === "Active"
  return (
    <Badge
      variant={isActive ? "default" : "secondary"}
      className={`text-xs ${isActive ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-900" : "bg-muted text-foreground hover:bg-muted"}`}
    >
      {status}
    </Badge>
  )
}

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

const getChipColor = (name: string) => {
  const colors = [
    "bg-red-500",
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-orange-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-teal-500",
  ]
  const index = name.length % colors.length
  return colors[index]
}

export default function AccountsPage() {
  const { organizations, loading, error } = useOrganizationsGQL()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showCustomColumns, setShowCustomColumns] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<any>(null)
  
  const [formData, setFormData] = useState({
    name: "",
    domain: "",
    tier: "basic",
    status: "active",
  })
  const router = useRouter()
  
  // Calculate stats from real data
  const stats = {
    total: organizations.length,
    active: organizations.filter((org: any) => org.status === 'active').length,
    enterprise: organizations.filter((org: any) => org.tier === 'enterprise').length,
    premium: organizations.filter((org: any) => org.tier === 'premium').length,
  }

  const handleCreateAccount = () => {
    console.log("Creating account:", formData)
    // TODO: Call createOrganizationGQL mutation
    setShowCreateForm(false)
    setFormData({
      name: "",
      domain: "",
      tier: "basic",
      status: "active",
    })
  }

  const handleViewAccount = (account: any) => {
    router.push(`/accounts/${account.id}`)
  }

  const handleEditAccount = (account: any) => {
    setSelectedAccount(account)
    setFormData({
      name: account.name,
      domain: account.domain,
      tier: account.tier,
      status: account.status,
    })
    setShowEditModal(true)
  }

  const handleDeleteAccount = (account: any) => {
    setSelectedAccount(account)
    setShowDeleteModal(true)
  }

  const confirmDelete = () => {
    console.log("Deleting account:", selectedAccount?.id)
    setShowDeleteModal(false)
    setSelectedAccount(null)
  }

  const handleUpdateAccount = () => {
    console.log("Updating account:", selectedAccount?.id, formData)
    // TODO: Call updateOrganizationGQL mutation
    setShowEditModal(false)
    setSelectedAccount(null)
  }

  return (
    <PageContent
      title="Accounts"
      description="Manage customer accounts and business relationships"
      breadcrumb={[
        { label: "Service Management", href: "/dashboard" },
        { label: "Accounts", href: "/accounts" },
      ]}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-base font-bold text-foreground">Accounts</h1>
        </div>

        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
<Input placeholder="Search accounts..." className="pl-10 w-80 text-sm" />
            </div>
<Button variant="outline" size="sm" className="text-sm bg-transparent">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>
<Button onClick={() => setShowCreateForm(true)} className="text-sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Account
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Building className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-xs font-medium text-muted-foreground">Total Accounts</p>
                  <p className="text-base font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Building className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-xs font-medium text-muted-foreground">Active Accounts</p>
                  <p className="text-base font-bold">{stats.active}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Mail className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-xs font-medium text-muted-foreground">Enterprise Tier</p>
                  <p className="text-base font-bold">{stats.enterprise}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <MessageSquare className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-xs font-medium text-muted-foreground">Premium Tier</p>
                  <p className="text-base font-bold">{stats.premium}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Error State */}
        {error && (
          <Card className="border-red-200 dark:border-red-800">
            <CardContent className="p-6">
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Failed to load accounts</h3>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Accounts Table */}
        {!error && (
        <Card>
          <CardHeader>
<CardTitle className="text-sm">Accounts</CardTitle>
<CardDescription className="text-xs">Manage customer accounts and contact information</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : organizations.length === 0 ? (
              <div className="text-center py-12">
                <Building className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No accounts yet</h3>
                <p className="text-sm text-muted-foreground mb-4">Create your first account to get started</p>
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Account
                </Button>
              </div>
            ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-border">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left py-3 px-4 font-medium text-xs border border-border">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-xs border border-border">Domain</th>
                    <th className="text-left py-3 px-4 font-medium text-xs border border-border">Tier</th>
                    <th className="text-left py-3 px-4 font-medium text-xs border border-border">Health Score</th>
                    <th className="text-left py-3 px-4 font-medium text-xs border border-border">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-xs border border-border">Created At</th>
                    <th className="text-left py-3 px-4 font-medium text-xs border border-border">Actions</th>
                    <th className="text-center py-3 px-4 font-medium text-xs border border-border w-12">
                      <DropdownMenu open={showCustomColumns} onOpenChange={setShowCustomColumns}>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-64">
                          <div className="p-2">
<Input placeholder="Search field types" className="text-sm mb-2" />
                          </div>
                          <DropdownMenuItem className="text-sm">
                            <Search className="mr-2 h-4 w-4" />
                            Add existing field
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-sm">
                            <Type className="mr-2 h-4 w-4" />
                            Text
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-sm">
                            <Hash className="mr-2 h-4 w-4" />
                            Number
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-sm">
                            <CheckSquare className="mr-2 h-4 w-4" />
                            Select
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-sm">
                            <List className="mr-2 h-4 w-4" />
                            Multi-select
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-sm">
                            <Calendar className="mr-2 h-4 w-4" />
                            Date
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-sm">
                            <Clock className="mr-2 h-4 w-4" />
                            Datetime
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-sm">
                            <ToggleLeft className="mr-2 h-4 w-4" />
                            True/False
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-sm">
                            <User className="mr-2 h-4 w-4" />
                            User
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-sm">
                            <Link className="mr-2 h-4 w-4" />
                            URL
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {organizations.map((org: any) => (
                    <tr key={org.id} className="hover:bg-muted/50">
                      <td className="py-3 px-4 border border-border">
                        <div>
                          <button
                            onClick={() => router.push(`/accounts/${org.id}`)}
 className="font-medium text-sm text-blue-600 hover:text-blue-800 hover:underline text-left dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            {org.name}
                          </button>
                        </div>
                      </td>
<td className="py-3 px-4 text-sm border border-border">
                        {org.domain ? (
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Globe className="mr-1 h-3 w-3" />
                            {org.domain}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 border border-border">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            org.tier === 'enterprise' 
                              ? 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-400 border-purple-200 dark:border-purple-800' 
                              : org.tier === 'premium'
                              ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                              : 'bg-gray-100 dark:bg-gray-950 text-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-800'
                          }`}
                        >
                          {org.tier}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 border border-border">
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                org.health_score >= 90 ? 'bg-green-500' :
                                org.health_score >= 70 ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${org.health_score}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-medium">{org.health_score}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 border border-border">{getStatusChip(org.status)}</td>
<td className="py-3 px-4 text-sm border border-border">{formatDate(org.created_at)}</td>
                      <td className="py-3 px-4 border border-border">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
<DropdownMenuItem className="text-sm" onClick={() => handleViewAccount(org)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
<DropdownMenuItem className="text-sm" onClick={() => handleEditAccount(org)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Account
                            </DropdownMenuItem>
                            <DropdownMenuItem
 className="text-sm text-red-600 dark:text-red-400"
                              onClick={() => handleDeleteAccount(org)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Account
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                      <td className="py-3 px-4 border border-border"></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
          </CardContent>
        </Card>
        )}

        {/* Create Account Form */}
        {showCreateForm && (
          <Card>
            <CardHeader>
<CardTitle className="text-sm">Create New Account</CardTitle>
<CardDescription className="text-xs">Add a new customer account to the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Organization Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter organization name"
 className="text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Domain</label>
                  <Input
                    value={formData.domain}
                    onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                    placeholder="example.com"
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Tier</label>
                  <select
                    value={formData.tier}
                    onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
 className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                  >
                    <option value="basic">Basic</option>
                    <option value="premium">Premium</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
 className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
<Button variant="outline" onClick={() => setShowCreateForm(false)} className="text-sm">
                  Cancel
                </Button>
<Button onClick={handleCreateAccount} className="text-sm">
                  Create Account
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageContent>
  )
}
