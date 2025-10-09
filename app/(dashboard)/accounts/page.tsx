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
} from "lucide-react"
import { useState } from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"

const accounts = [
  {
    id: 1,
    name: "Acme Corporation",
    country: "United States",
    website: "https://acme.com",
    supportChannel: "Email",
    contactPerson: "John Smith",
    email: "john.smith@acme.com",
    address: "123 Business Ave, New York, NY 10001",
    status: "Active",
    createdAt: "2024-01-15",
  },
  {
    id: 2,
    name: "TechFlow Solutions",
    country: "Canada",
    website: "https://techflow.ca",
    supportChannel: "Slack",
    contactPerson: "Sarah Johnson",
    email: "sarah@techflow.ca",
    address: "456 Tech Street, Toronto, ON M5V 3A8",
    status: "Active",
    createdAt: "2024-01-10",
  },
  {
    id: 3,
    name: "Global Dynamics",
    country: "United Kingdom",
    website: "https://globaldynamics.co.uk",
    supportChannel: "Phone",
    contactPerson: "Michael Brown",
    email: "m.brown@globaldynamics.co.uk",
    address: "789 Corporate Blvd, London, EC1A 1BB",
    status: "Inactive",
    createdAt: "2024-01-05",
  },
]

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
      className={`text-[10px] ${isActive ? "bg-green-100 text-green-800 hover:bg-green-100" : "bg-gray-100 text-gray-800 hover:bg-gray-100"}`}
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
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showCustomColumns, setShowCustomColumns] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<any>(null)
  
  // Simulate data loading
  useState(() => {
    setTimeout(() => setLoading(false), 500)
  })
  const [formData, setFormData] = useState({
    name: "",
    country: "",
    website: "",
    supportChannel: "Email",
    contactPerson: "",
    email: "",
    address: "",
  })
  const router = useRouter()

  const handleCreateAccount = () => {
    console.log("Creating account:", formData)
    setShowCreateForm(false)
    setFormData({
      name: "",
      country: "",
      website: "",
      supportChannel: "Email",
      contactPerson: "",
      email: "",
      address: "",
    })
  }

  const handleViewAccount = (account: any) => {
    router.push(`/accounts/${account.id}`)
  }

  const handleEditAccount = (account: any) => {
    setSelectedAccount(account)
    setFormData({
      name: account.name,
      country: account.country,
      website: account.website,
      supportChannel: account.supportChannel,
      contactPerson: account.contactPerson,
      email: account.email,
      address: account.address,
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
          <h1 className="text-[13px] font-bold text-foreground">Accounts</h1>
        </div>

        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
<Input placeholder="Search accounts..." className="pl-10 w-80 text-[11px]" />
            </div>
<Button variant="outline" size="sm" className="text-[11px] bg-transparent">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>
<Button onClick={() => setShowCreateForm(true)} className="text-[11px]">
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
                  <p className="text-[10px] font-medium text-muted-foreground">Total Accounts</p>
                  <p className="text-[13px] font-bold">3</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Building className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-[10px] font-medium text-muted-foreground">Active Accounts</p>
                  <p className="text-[13px] font-bold">2</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Mail className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-[10px] font-medium text-muted-foreground">Email Support</p>
                  <p className="text-[13px] font-bold">1</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <MessageSquare className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-[10px] font-medium text-muted-foreground">Slack Support</p>
                  <p className="text-[13px] font-bold">1</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Accounts Table */}
        <Card>
          <CardHeader>
<CardTitle className="text-[12px]">Accounts</CardTitle>
<CardDescription className="text-[10px]">Manage customer accounts and contact information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-100">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left py-3 px-4 font-medium text-[10px] border border-gray-100">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-[10px] border border-gray-100">Country</th>
                    <th className="text-left py-3 px-4 font-medium text-[10px] border border-gray-100">Support Channel</th>
                    <th className="text-left py-3 px-4 font-medium text-[10px] border border-gray-100">Account Owner</th>
                    <th className="text-left py-3 px-4 font-medium text-[10px] border border-gray-100">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-[10px] border border-gray-100">Created At</th>
                    <th className="text-left py-3 px-4 font-medium text-[10px] border border-gray-100">Actions</th>
                    <th className="text-center py-3 px-4 font-medium text-[10px] border border-gray-100 w-12">
                      <DropdownMenu open={showCustomColumns} onOpenChange={setShowCustomColumns}>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-64">
                          <div className="p-2">
<Input placeholder="Search field types" className="text-[11px] mb-2" />
                          </div>
                          <DropdownMenuItem className="text-[11px]">
                            <Search className="mr-2 h-4 w-4" />
                            Add existing field
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-[11px]">
                            <Type className="mr-2 h-4 w-4" />
                            Text
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-[11px]">
                            <Hash className="mr-2 h-4 w-4" />
                            Number
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-[11px]">
                            <CheckSquare className="mr-2 h-4 w-4" />
                            Select
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-[11px]">
                            <List className="mr-2 h-4 w-4" />
                            Multi-select
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-[11px]">
                            <Calendar className="mr-2 h-4 w-4" />
                            Date
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-[11px]">
                            <Clock className="mr-2 h-4 w-4" />
                            Datetime
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-[11px]">
                            <ToggleLeft className="mr-2 h-4 w-4" />
                            True/False
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-[11px]">
                            <User className="mr-2 h-4 w-4" />
                            User
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-[11px]">
                            <Link className="mr-2 h-4 w-4" />
                            URL
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((account) => (
                    <tr key={account.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 border border-gray-100">
                        <div>
                          <button
                            onClick={() => router.push(`/accounts/${account.id}`)}
className="font-medium text-[11px] text-blue-600 hover:text-blue-800 hover:underline text-left"
                          >
                            {account.name}
                          </button>
<div className="text-[10px] text-muted-foreground flex items-center">
                            <Globe className="mr-1 h-3 w-3" />
                            {account.website}
                          </div>
                        </div>
                      </td>
<td className="py-3 px-4 text-[11px] border border-gray-100">{account.country}</td>
                      <td className="py-3 px-4 border border-gray-100">
<div className="flex items-center text-[11px]">
                          {account.supportChannel === "Email" && <Mail className="mr-1 h-3 w-3" />}
                          {account.supportChannel === "Slack" && <MessageSquare className="mr-1 h-3 w-3" />}
                          {account.supportChannel === "Phone" && <Phone className="mr-1 h-3 w-3" />}
                          {account.supportChannel}
                        </div>
                      </td>
                      <td className="py-3 px-4 border border-gray-100">
                        <div className="flex items-center">
                          <div
                            className={`w-8 h-8 ${getChipColor(account.contactPerson)} rounded-full flex items-center justify-center text-white text-[9px] font-medium cursor-pointer`}
                            title={account.contactPerson}
                          >
                            {getInitials(account.contactPerson)}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 border border-gray-100">{getStatusChip(account.status)}</td>
<td className="py-3 px-4 text-[11px] border border-gray-100">{formatDate(account.createdAt)}</td>
                      <td className="py-3 px-4 border border-gray-100">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
<DropdownMenuItem className="text-[11px]" onClick={() => handleViewAccount(account)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
<DropdownMenuItem className="text-[11px]" onClick={() => handleEditAccount(account)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Account
                            </DropdownMenuItem>
                            <DropdownMenuItem
className="text-[11px] text-red-600"
                              onClick={() => handleDeleteAccount(account)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Account
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                      <td className="py-3 px-4 border border-gray-100"></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Create Account Form */}
        {showCreateForm && (
          <Card>
            <CardHeader>
<CardTitle className="text-[12px]">Create New Account</CardTitle>
<CardDescription className="text-[10px]">Add a new customer account to the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium mb-2">Account Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter account name"
className="text-[11px]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium mb-2">Country</label>
                  <Input
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="Enter country"
                    className="text-[11px]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium mb-2">Website</label>
                  <Input
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://example.com"
                    className="text-[11px]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium mb-2">Support Channel</label>
                  <select
                    value={formData.supportChannel}
                    onChange={(e) => setFormData({ ...formData, supportChannel: e.target.value })}
className="w-full px-3 py-2 border border-input bg-background rounded-md text-[11px]"
                  >
                    <option value="Email">Email</option>
                    <option value="Slack">Slack</option>
                    <option value="Phone">Phone</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-medium mb-2">Account Owner</label>
                  <Input
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="Enter account owner name"
                    className="text-[11px]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium mb-2">Email</label>
                  <Input
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contact@example.com"
                    type="email"
                    className="text-[11px]"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[12px] font-medium mb-2">Address</label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Enter full address"
                    className="text-[11px]"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
<Button variant="outline" onClick={() => setShowCreateForm(false)} className="text-[11px]">
                  Cancel
                </Button>
<Button onClick={handleCreateAccount} className="text-[11px]">
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
