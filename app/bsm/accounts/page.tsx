"use client"

import { PlatformLayout } from "@/components/layout/platform-layout"
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
  Edit,
  Trash2,
  Eye,
  X,
} from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/hooks/use-toast"
import { Combobox } from "@/components/ui/combobox"
import { createBrowserClient } from "@supabase/ssr"

const countries = [
  { value: "united_states", label: "United States" },
  { value: "canada", label: "Canada" },
  { value: "united_kingdom", label: "United Kingdom" },
  { value: "germany", label: "Germany" },
  { value: "france", label: "France" },
  { value: "italy", label: "Italy" },
  { value: "spain", label: "Spain" },
  { value: "netherlands", label: "Netherlands" },
  { value: "belgium", label: "Belgium" },
  { value: "switzerland", label: "Switzerland" },
  { value: "austria", label: "Austria" },
  { value: "sweden", label: "Sweden" },
  { value: "norway", label: "Norway" },
  { value: "denmark", label: "Denmark" },
  { value: "finland", label: "Finland" },
  { value: "poland", label: "Poland" },
  { value: "czech_republic", label: "Czech Republic" },
  { value: "hungary", label: "Hungary" },
  { value: "portugal", label: "Portugal" },
  { value: "greece", label: "Greece" },
  { value: "ireland", label: "Ireland" },
  { value: "australia", label: "Australia" },
  { value: "new_zealand", label: "New Zealand" },
  { value: "japan", label: "Japan" },
  { value: "south_korea", label: "South Korea" },
  { value: "china", label: "China" },
  { value: "india", label: "India" },
  { value: "singapore", label: "Singapore" },
  { value: "hong_kong", label: "Hong Kong" },
  { value: "taiwan", label: "Taiwan" },
  { value: "thailand", label: "Thailand" },
  { value: "malaysia", label: "Malaysia" },
  { value: "indonesia", label: "Indonesia" },
  { value: "philippines", label: "Philippines" },
  { value: "vietnam", label: "Vietnam" },
  { value: "brazil", label: "Brazil" },
  { value: "mexico", label: "Mexico" },
  { value: "argentina", label: "Argentina" },
  { value: "chile", label: "Chile" },
  { value: "colombia", label: "Colombia" },
  { value: "peru", label: "Peru" },
  { value: "south_africa", label: "South Africa" },
  { value: "egypt", label: "Egypt" },
  { value: "israel", label: "Israel" },
  { value: "uae", label: "United Arab Emirates" },
  { value: "saudi_arabia", label: "Saudi Arabia" },
  { value: "turkey", label: "Turkey" },
  { value: "russia", label: "Russia" },
  { value: "ukraine", label: "Ukraine" },
]

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
      className={`text-[13px] ${isActive ? "bg-green-100 text-green-800 hover:bg-green-100" : "bg-gray-100 text-gray-800 hover:bg-gray-100"}`}
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

const initialFormData = {
  name: "",
  country: "",
  website: "",
  supportChannel: "Email",
  contactPerson: "",
  email: "",
  address: "",
}

export default function AccountsPage() {
  const [showAddModal, setShowAddModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showCustomColumns, setShowCustomColumns] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<any>(null)
  const [deleteConfirmed, setDeleteConfirmed] = useState(false)
  const [users, setUsers] = useState<Array<{ value: string; label: string }>>([])
  const [formData, setFormData] = useState(initialFormData)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [accountsList, setAccountsList] = useState(accounts)
  const router = useRouter()

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        )

        const { data, error } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, email")
          .eq("is_active", true)
          .order("first_name")

        if (error) {
          console.error("Error fetching users:", error)
          return
        }

        const userOptions =
          data?.map((user) => ({
            value: user.id,
            label: `${user.first_name} ${user.last_name} (${user.email})`,
          })) || []

        setUsers(userOptions)
      } catch (error) {
        console.error("Error fetching users:", error)
      }
    }

    fetchUsers()
  }, [])

  const filteredAccounts = useMemo(() => {
    return accountsList.filter((account) => {
      const matchesSearch =
        account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.email.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === "All" || account.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [accountsList, searchTerm, statusFilter])

  const handleCreateAccount = () => {
    console.log("Creating account:", formData)
    const newAccount = {
      id: Math.max(...accountsList.map((a) => a.id)) + 1,
      ...formData,
      status: "Active",
      createdAt: new Date().toISOString().split("T")[0],
    }
    setAccountsList([...accountsList, newAccount])

    toast({
      title: "Account Created",
      description: `${formData.name} has been successfully created.`,
    })
    setShowAddModal(false)
    setFormData(initialFormData)
  }

  const handleViewAccount = (account: any) => {
    router.push(`/bsm/accounts/${account.id}`)
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
    setDeleteConfirmed(false)
    setShowDeleteModal(true)
  }

  const confirmDelete = () => {
    if (!deleteConfirmed) return

    console.log("Deleting account:", selectedAccount?.id)
    setAccountsList(accountsList.filter((account) => account.id !== selectedAccount?.id))

    toast({
      title: "Account Deleted",
      description: `${selectedAccount?.name} has been successfully deleted.`,
    })
    setShowDeleteModal(false)
    setSelectedAccount(null)
    setDeleteConfirmed(false)
  }

  const handleUpdateAccount = () => {
    console.log("Updating account:", selectedAccount?.id, formData)
    setAccountsList(
      accountsList.map((account) => (account.id === selectedAccount?.id ? { ...account, ...formData } : account)),
    )

    toast({
      title: "Account Updated",
      description: `${formData.name} has been successfully updated.`,
    })
    setShowEditModal(false)
    setSelectedAccount(null)
  }

  const handleAddAccountClick = () => {
    setFormData(initialFormData)
    setShowAddModal(true)
  }

  return (
    <PlatformLayout
      title="Accounts"
      description="Manage customer accounts and business relationships"
      breadcrumbs={[
        { label: "Service Management", href: "/bsm/dashboard" },
        { label: "Accounts", href: "/bsm/accounts" },
      ]}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Accounts</h1>
        </div>

        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search accounts..."
                className="pl-10 w-80 text-[13px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="text-[13px] bg-transparent">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter {statusFilter !== "All" && `(${statusFilter})`}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem className="text-[13px]" onClick={() => setStatusFilter("All")}>
                  All Accounts
                </DropdownMenuItem>
                <DropdownMenuItem className="text-[13px]" onClick={() => setStatusFilter("Active")}>
                  Active Only
                </DropdownMenuItem>
                <DropdownMenuItem className="text-[13px]" onClick={() => setStatusFilter("Inactive")}>
                  Inactive Only
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Button onClick={handleAddAccountClick} className="text-[13px]">
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
                  <p className="text-sm font-medium text-muted-foreground">Total Accounts</p>
                  <p className="text-2xl font-bold">{accountsList.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Building className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Active Accounts</p>
                  <p className="text-2xl font-bold">{accountsList.filter((a) => a.status === "Active").length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Mail className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Email Support</p>
                  <p className="text-2xl font-bold">
                    {accountsList.filter((a) => a.supportChannel === "Email").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <MessageSquare className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Slack Support</p>
                  <p className="text-2xl font-bold">
                    {accountsList.filter((a) => a.supportChannel === "Slack").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Accounts Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[13px]">Accounts</CardTitle>
            <CardDescription className="text-[13px]">Manage customer accounts and contact information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-100">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left py-3 px-4 font-medium text-xs border border-gray-100">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-xs border border-gray-100">Country</th>
                    <th className="text-left py-3 px-4 font-medium text-xs border border-gray-100">Support Channel</th>
                    <th className="text-left py-3 px-4 font-medium text-xs border border-gray-100">Account Owner</th>
                    <th className="text-left py-3 px-4 font-medium text-xs border border-gray-100">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-xs border border-gray-100">Created At</th>
                    <th className="text-left py-3 px-4 font-medium text-xs border border-gray-100">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAccounts.map((account) => (
                    <tr key={account.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 border border-gray-100">
                        <div>
                          <button
                            onClick={() => router.push(`/bsm/accounts/${account.id}`)}
                            className="font-medium text-[13px] text-blue-600 hover:text-blue-800 hover:underline text-left"
                          >
                            {account.name}
                          </button>
                          <div className="text-[13px] text-muted-foreground flex items-center">
                            <Globe className="mr-1 h-3 w-3" />
                            {account.website}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[13px] border border-gray-100">{account.country}</td>
                      <td className="py-3 px-4 border border-gray-100">
                        <div className="flex items-center text-[13px]">
                          {account.supportChannel === "Email" && <Mail className="mr-1 h-3 w-3" />}
                          {account.supportChannel === "Slack" && <MessageSquare className="mr-1 h-3 w-3" />}
                          {account.supportChannel === "Phone" && <Phone className="mr-1 h-3 w-3" />}
                          {account.supportChannel}
                        </div>
                      </td>
                      <td className="py-3 px-4 border border-gray-100">
                        <div className="flex items-center">
                          <div
                            className={`w-8 h-8 ${getChipColor(account.contactPerson)} rounded-full flex items-center justify-center text-white text-xs font-medium cursor-pointer`}
                            title={account.contactPerson}
                          >
                            {getInitials(account.contactPerson)}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 border border-gray-100">{getStatusChip(account.status)}</td>
                      <td className="py-3 px-4 text-[13px] border border-gray-100">{formatDate(account.createdAt)}</td>
                      <td className="py-3 px-4 border border-gray-100">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem className="text-[13px]" onClick={() => handleViewAccount(account)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-[13px]" onClick={() => handleEditAccount(account)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Account
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-[13px] text-red-600"
                              onClick={() => handleDeleteAccount(account)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Account
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

        {filteredAccounts.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">No accounts found matching your search criteria.</div>
        )}

        {/* Add Account Modal */}
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Account</DialogTitle>
              <DialogDescription>Create a new customer account in the system.</DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div>
                <label className="block text-sm font-medium mb-2">Account Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter account name"
                  className="text-[13px]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Country</label>
                <Combobox
                  options={countries}
                  value={formData.country}
                  onValueChange={(value) => setFormData({ ...formData, country: value })}
                  placeholder="Select country..."
                  searchPlaceholder="Search countries..."
                  emptyText="No country found."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Website</label>
                <Input
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://example.com"
                  className="text-[13px]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Support Channel</label>
                <select
                  value={formData.supportChannel}
                  onChange={(e) => setFormData({ ...formData, supportChannel: e.target.value })}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-[13px]"
                >
                  <option value="Email">Email</option>
                  <option value="Slack">Slack</option>
                  <option value="Phone">Phone</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Account Owner</label>
                <Combobox
                  options={users}
                  value={formData.contactPerson}
                  onValueChange={(value) => setFormData({ ...formData, contactPerson: value })}
                  placeholder="Select account owner..."
                  searchPlaceholder="Search users..."
                  emptyText="No user found."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <Input
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@example.com"
                  type="email"
                  className="text-[13px]"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Address</label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter full address"
                  className="text-[13px]"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddModal(false)} className="text-[13px]">
                Cancel
              </Button>
              <Button onClick={handleCreateAccount} className="text-[13px]">
                Create Account
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-semibold">Delete Account</DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground mt-1">
                    Do you want to delete this account?
                  </DialogDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-4 top-4 h-6 w-6 p-0"
                  onClick={() => setShowDeleteModal(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DialogHeader>

            <div className="py-4">
              <div className="flex items-center space-x-2">
                <Checkbox id="delete-confirm" checked={deleteConfirmed} onCheckedChange={setDeleteConfirmed} />
                <label
                  htmlFor="delete-confirm"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Click to Agree
                </label>
              </div>
            </div>

            <DialogFooter className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDeleteModal(false)} className="text-[13px]">
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={!deleteConfirmed}
                className="text-[13px] bg-red-500 hover:bg-red-600"
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Account Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Account</DialogTitle>
              <DialogDescription>Update the account information below.</DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div>
                <label className="block text-sm font-medium mb-2">Account Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter account name"
                  className="text-[13px]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Country</label>
                <Combobox
                  options={countries}
                  value={formData.country}
                  onValueChange={(value) => setFormData({ ...formData, country: value })}
                  placeholder="Select country..."
                  searchPlaceholder="Search countries..."
                  emptyText="No country found."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Website</label>
                <Input
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://example.com"
                  className="text-[13px]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Support Channel</label>
                <select
                  value={formData.supportChannel}
                  onChange={(e) => setFormData({ ...formData, supportChannel: e.target.value })}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-[13px]"
                >
                  <option value="Email">Email</option>
                  <option value="Slack">Slack</option>
                  <option value="Phone">Phone</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Account Owner</label>
                <Combobox
                  options={users}
                  value={formData.contactPerson}
                  onValueChange={(value) => setFormData({ ...formData, contactPerson: value })}
                  placeholder="Select account owner..."
                  searchPlaceholder="Search users..."
                  emptyText="No user found."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <Input
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@example.com"
                  type="email"
                  className="text-[13px]"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Address</label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter full address"
                  className="text-[13px]"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditModal(false)} className="text-[13px]">
                Cancel
              </Button>
              <Button onClick={handleUpdateAccount} className="text-[13px]">
                Update Account
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PlatformLayout>
  )
}
