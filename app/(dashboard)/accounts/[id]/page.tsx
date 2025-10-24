"use client"

import { PageContent } from "@/components/layout/page-content"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"
import {
  ArrowLeft,
  Building,
  Globe,
  Mail,
  FileText,
  Plus,
  Filter,
  MoreHorizontal,
  Upload,
  Download,
  Trash2,
  Edit,
  Eye,
  X,
  Calendar,
} from "lucide-react"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useOrganizationsGQL } from "@/hooks/use-workflows-organizations-gql"

// This will be replaced with real data from Supabase

const sampleTickets = [
  {
    id: 1,
    title: "Login Issues",
    priority: "High",
    status: "Open",
    createdAt: "2025-01-10",
    requester: "John Smith",
    assignee: "Support Team",
  },
  {
    id: 2,
    title: "Feature Request - Dashboard",
    priority: "Medium",
    status: "In Progress",
    createdAt: "2025-01-08",
    requester: "John Smith",
    assignee: "Dev Team",
  },
]

const sampleTasks = [
  {
    id: 1,
    title: "Setup new user accounts",
    status: "Not Started",
    assignee: "John Smith",
    dueDate: "2025-01-20",
  },
  {
    id: 2,
    title: "Configure SSO integration",
    status: "In Progress",
    assignee: "Tech Team",
    dueDate: "2025-01-25",
  },
]

const sampleContacts = [
  {
    id: 1,
    name: "John Smith",
    email: "john.smith@acme.com",
    role: "IT Manager",
    department: "Information Technology",
    phone: "+1-555-0123",
  },
  {
    id: 2,
    name: "Jane Doe",
    email: "jane.doe@acme.com",
    role: "Admin",
    department: "Administration",
    phone: "+1-555-0124",
  },
]

const sampleActivity = [
  {
    id: 1,
    type: "ticket",
    action: "Ticket #1 created",
    user: "John Smith",
    timestamp: "2025-01-10T14:30:00Z",
  },
  {
    id: 2,
    type: "account",
    action: "Account updated",
    user: "System",
    timestamp: "2025-01-09T10:15:00Z",
  },
]

const sampleFiles = [
  {
    id: 1,
    name: "Contract_2025.pdf",
    size: "2.4 MB",
    uploadedBy: "John Smith",
    uploadedAt: "2025-01-05",
  },
  {
    id: 2,
    name: "Requirements_Doc.docx",
    size: "1.8 MB",
    uploadedBy: "Jane Doe",
    uploadedAt: "2025-01-03",
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

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const getStatusChip = (status: string) => {
  const statusConfig = {
    Active: { color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", variant: "default" as const },
    Inactive: { color: "bg-muted text-foreground dark:bg-gray-900/30 dark:text-muted-foreground", variant: "secondary" as const },
    Open: { color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", variant: "destructive" as const },
    "In Progress": { color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", variant: "default" as const },
    Closed: { color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", variant: "default" as const },
    "Not Started": { color: "bg-muted text-foreground dark:bg-gray-900/30 dark:text-muted-foreground", variant: "secondary" as const },
    Completed: { color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", variant: "default" as const },
  }

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.Active

  return (
    <Badge variant={config.variant} className={`text-sm ${config.color} hover:${config.color}`}>
      {status}
    </Badge>
  )
}

const getPriorityChip = (priority: string) => {
  const priorityConfig = {
    High: { color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", variant: "destructive" as const },
    Medium: { color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400", variant: "default" as const },
    Low: { color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", variant: "default" as const },
  }

  const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.Medium

  return (
    <Badge variant={config.variant} className={`text-sm ${config.color} hover:${config.color}`}>
      {priority}
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

export default function AccountDetailPage() {
  const params = useParams()
  const router = useRouter()
  const accountId = params.id as string
  const { organizations, loading, error } = useOrganizationsGQL()
  const [account, setAccount] = useState<any>(null)

  useEffect(() => {
    if (organizations.length > 0 && accountId) {
      const foundAccount = organizations.find(org => org.id === accountId)
      if (foundAccount) {
        setAccount(foundAccount)
      }
    }
  }, [organizations, accountId])

  const [activeTab, setActiveTab] = useState("overview")
  const [contacts, setContacts] = useState(sampleContacts)
  const [showContactTray, setShowContactTray] = useState(false)
  const [editingContact, setEditingContact] = useState<any>(null)
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    role: "",
    department: "",
    phone: "",
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [countryCode, setCountryCode] = useState("+1")

  const countryCodes = [
    { code: "+1", country: "US/CA", flag: "🇺🇸" },
    { code: "+44", country: "UK", flag: "🇬🇧" },
    { code: "+91", country: "India", flag: "🇮🇳" },
    { code: "+86", country: "China", flag: "🇨🇳" },
    { code: "+49", country: "Germany", flag: "🇩🇪" },
    { code: "+33", country: "France", flag: "🇫🇷" },
    { code: "+81", country: "Japan", flag: "🇯🇵" },
    { code: "+61", country: "Australia", flag: "🇦🇺" },
    { code: "+55", country: "Brazil", flag: "🇧🇷" },
    { code: "+7", country: "Russia", flag: "🇷🇺" },
  ]

  const handleAddContact = () => {
    setEditingContact(null)
    setContactForm({ name: "", email: "", role: "", department: "", phone: "" })
    setCountryCode("+1")
    setShowContactTray(true)
  }

  const handleEditContact = (contact: any) => {
    setEditingContact(contact)
    const phoneMatch = contact.phone.match(/^(\+\d+)-?(.*)$/)
    const extractedCountryCode = phoneMatch ? phoneMatch[1] : "+1"
    const phoneNumber = phoneMatch ? phoneMatch[2] : contact.phone

    setContactForm({
      name: contact.name,
      email: contact.email,
      role: contact.role,
      department: contact.department,
      phone: phoneNumber,
    })
    setCountryCode(extractedCountryCode)
    setShowContactTray(true)
  }

  const handleDeleteContact = (contactId: number) => {
    if (confirm("Are you sure you want to delete this contact?")) {
      setContacts(contacts.filter((c) => c.id !== contactId))
    }
  }

  const handleSaveContact = () => {
    const fullPhone = contactForm.phone ? `${countryCode}-${contactForm.phone}` : ""

    if (editingContact) {
      setContacts(contacts.map((c) => (c.id === editingContact.id ? { ...c, ...contactForm, phone: fullPhone } : c)))
    } else {
      const newContact = {
        id: Math.max(...contacts.map((c) => c.id)) + 1,
        ...contactForm,
        phone: fullPhone,
      }
      setContacts([...contacts, newContact])
    }
    setShowContactTray(false)
    setContactForm({ name: "", email: "", role: "", department: "", phone: "" })
    setCountryCode("+1")
    setEditingContact(null)
  }

  const handleCancelContact = () => {
    setShowContactTray(false)
    setContactForm({ name: "", email: "", role: "", department: "", phone: "" })
    setEditingContact(null)
  }

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.department.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return (
      <PageContent title="Loading..." description="Loading account details">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-4">Loading account details...</p>
        </div>
      </PageContent>
    )
  }

  if (error) {
    return (
      <PageContent title="Error" description="Failed to load account">
        <div className="text-center py-12">
          <h2 className="text-sm font-semibold mb-4 text-red-600">Error Loading Account</h2>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => router.push("/accounts")} className="text-sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Accounts
          </Button>
        </div>
      </PageContent>
    )
  }

  if (!account) {
    return (
      <PageContent title="Account Not Found" description="The requested account could not be found">
        <div className="text-center py-12">
          <h2 className="text-sm font-semibold mb-4">Account Not Found</h2>
          <p className="text-sm text-muted-foreground mb-4">The account you're looking for doesn't exist or has been deleted.</p>
          <Button onClick={() => router.push("/accounts")} className="text-sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Accounts
          </Button>
        </div>
      </PageContent>
    )
  }

  return (
    <PageContent
      title={account.name}
      description="Account management and details"
      breadcrumb={[
        { label: "Service Management", href: "/dashboard" },
        { label: "Accounts", href: "/accounts" },
        { label: account.name, href: `/accounts/${account.id}` },
      ]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => router.push("/accounts")} className="text-sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Accounts
            </Button>
            <div className="text-sm text-muted-foreground">/</div>
            <h1 className="text-sm font-semibold">{account.name}</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" className="text-sm bg-transparent">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="text-sm bg-transparent">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="text-sm">
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem className="text-sm">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Account
                </DropdownMenuItem>
                <DropdownMenuItem className="text-sm text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Account
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview" className="text-sm">
              Overview
            </TabsTrigger>
            <TabsTrigger value="tickets" className="text-sm">
              Tickets
            </TabsTrigger>
            <TabsTrigger value="tasks" className="text-sm">
              Tasks
            </TabsTrigger>
            <TabsTrigger value="contacts" className="text-sm">
              Contacts
            </TabsTrigger>
            <TabsTrigger value="activity" className="text-sm">
              Activity
            </TabsTrigger>
            <TabsTrigger value="files" className="text-sm">
              Files
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-sm">
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Account Details */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Account Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Account Name</label>
                        <p className="text-sm text-muted-foreground">{account.name}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Tier</label>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            account.tier === 'enterprise' 
                              ? 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-400 border-purple-200 dark:border-purple-800' 
                              : account.tier === 'premium'
                              ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                              : 'bg-gray-100 dark:bg-gray-950 text-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-800'
                          }`}
                        >
                          {account.tier}
                        </Badge>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Domain</label>
                        <p className="text-sm text-muted-foreground">{account.domain || 'No domain set'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Health Score</label>
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                account.health_score >= 90 ? 'bg-green-500' :
                                account.health_score >= 70 ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${account.health_score}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-medium">{account.health_score}%</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Created At</label>
                        <p className="text-sm text-muted-foreground">{formatDate(account.created_at)}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Status</label>
                        {getStatusChip(account.status)}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {sampleActivity.map((activity) => (
                        <div key={activity.id} className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{activity.action}</p>
                            <p className="text-sm text-muted-foreground">
                              by {activity.user} • {formatDateTime(activity.timestamp)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Quick Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Quick Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Open Tickets</span>
                      <span className="text-sm font-medium">2</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Active Tasks</span>
                      <span className="text-sm font-medium">1</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Contacts</span>
                      <span className="text-sm font-medium">2</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Files Uploaded</span>
                      <span className="text-sm font-medium">2</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Organization Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Organization Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{account.domain || 'No domain configured'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Organization ID: {account.id}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Created: {formatDate(account.created_at)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Tickets Tab */}
          <TabsContent value="tickets" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-medium">Tickets</h3>
              <Button size="sm" className="text-sm">
                <Plus className="mr-2 h-4 w-4" />
                New Ticket
              </Button>
            </div>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-muted/50 border-b">
                        <th className="text-left py-3 px-4 font-medium text-xs">ID</th>
                        <th className="text-left py-3 px-4 font-medium text-xs">Title</th>
                        <th className="text-left py-3 px-4 font-medium text-xs">Priority</th>
                        <th className="text-left py-3 px-4 font-medium text-xs">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-xs">Created</th>
                        <th className="text-left py-3 px-4 font-medium text-xs">Assignee</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sampleTickets.map((ticket) => (
                        <tr key={ticket.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4 text-sm">#{ticket.id}</td>
                          <td className="py-3 px-4 text-sm font-medium">{ticket.title}</td>
                          <td className="py-3 px-4">{getPriorityChip(ticket.priority)}</td>
                          <td className="py-3 px-4">{getStatusChip(ticket.status)}</td>
                          <td className="py-3 px-4 text-sm">{formatDate(ticket.createdAt)}</td>
                          <td className="py-3 px-4 text-sm">{ticket.assignee}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-medium">Tasks</h3>
              <Button size="sm" className="text-sm">
                <Plus className="mr-2 h-4 w-4" />
                New Task
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Not Started (1)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {sampleTasks
                    .filter((task) => task.status === "Not Started")
                    .map((task) => (
                      <div key={task.id} className="p-3 border rounded-lg">
                        <h4 className="text-sm font-medium">{task.title}</h4>
                        <p className="text-sm text-muted-foreground">Due: {formatDate(task.dueDate)}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <div
                            className={`w-5 h-5 ${getChipColor(task.assignee)} rounded-full flex items-center justify-center text-white text-xs`}
                          >
                            {getInitials(task.assignee)}
                          </div>
                        </div>
                      </div>
                    ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">In Progress (1)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {sampleTasks
                    .filter((task) => task.status === "In Progress")
                    .map((task) => (
                      <div key={task.id} className="p-3 border rounded-lg">
                        <h4 className="text-sm font-medium">{task.title}</h4>
                        <p className="text-sm text-muted-foreground">Due: {formatDate(task.dueDate)}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <div
                            className={`w-5 h-5 ${getChipColor(task.assignee)} rounded-full flex items-center justify-center text-white text-xs`}
                          >
                            {getInitials(task.assignee)}
                          </div>
                        </div>
                      </div>
                    ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Completed (0)</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">No completed tasks</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Contacts Tab */}
          <TabsContent value="contacts" className="space-y-4">
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-semibold">Contacts</CardTitle>
                      <CardDescription className="text-sm text-muted-foreground">
                        Manage account contacts and their information
                      </CardDescription>
                    </div>
                    <Button onClick={handleAddContact} className="text-sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Contact
                    </Button>
                  </div>
                  <div className="mt-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search contacts..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 text-sm"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-muted/50 border-b">
                          <th className="text-left py-3 px-4 font-medium text-xs border-r">Name</th>
                          <th className="text-left py-3 px-4 font-medium text-xs border-r">Email</th>
                          <th className="text-left py-3 px-4 font-medium text-xs border-r">Role</th>
                          <th className="text-left py-3 px-4 font-medium text-xs border-r">Department</th>
                          <th className="text-left py-3 px-4 font-medium text-xs border-r">Phone</th>
                          <th className="text-left py-3 px-4 font-medium text-xs">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredContacts.map((contact) => (
                          <tr key={contact.id} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-4 border-r">
                              <div className="flex items-center space-x-2">
                                <div
                                  className={`w-6 h-6 ${getChipColor(contact.name)} rounded-full flex items-center justify-center text-white text-xs font-medium`}
                                  title={contact.name}
                                >
                                  {getInitials(contact.name)}
                                </div>
                                <span className="text-sm font-medium">{contact.name}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-sm border-r">{contact.email}</td>
                            <td className="py-3 px-4 text-sm border-r">{contact.role}</td>
                            <td className="py-3 px-4 text-sm border-r">{contact.department}</td>
                            <td className="py-3 px-4 text-sm border-r">{contact.phone}</td>
                            <td className="py-3 px-4">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem className="text-sm" onClick={() => handleEditContact(contact)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Contact
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-sm text-destructive"
                                    onClick={() => handleDeleteContact(contact.id)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Contact
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}
                        {filteredContacts.length === 0 && (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-muted-foreground text-sm">
                              {searchTerm ? "No contacts found matching your search." : "No contacts added yet."}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-medium">Activity Timeline</h3>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" className="text-sm bg-transparent">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
              </div>
            </div>
            <Card>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {sampleActivity.map((activity, index) => (
                    <div key={activity.id} className="flex items-start space-x-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        {index < sampleActivity.length - 1 && <div className="w-px h-12 bg-muted mt-2"></div>}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">{activity.action}</span>
                          <Badge variant="outline" className="text-sm">
                            {activity.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          by {activity.user} • {formatDateTime(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-medium">Files</h3>
              <Button size="sm" className="text-sm">
                <Upload className="mr-2 h-4 w-4" />
                Upload File
              </Button>
            </div>
            <Card>
              <CardContent className="p-6">
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center mb-6">
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground mb-2">Upload a file or drag and drop it here</p>
                  <p className="text-sm text-muted-foreground">Max file size: 25 MB</p>
                  <Button variant="outline" size="sm" className="mt-4 text-sm bg-transparent">
                    Choose File
                  </Button>
                </div>
                <div className="space-y-3">
                  {sampleFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-8 w-8 text-blue-500" />
                        <div>
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {file.size} • Uploaded by {file.uploadedBy} on {formatDate(file.uploadedAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <h3 className="text-base font-medium">Account Settings</h3>
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">General Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Account Status</label>
                    <div className="flex items-center space-x-4">
                      {getStatusChip(account.status)}
                      <Button variant="outline" size="sm" className="text-sm bg-transparent">
                        Change Status
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Notifications</label>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked className="rounded" />
                        <span className="text-sm">Email notifications for new tickets</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked className="rounded" />
                        <span className="text-sm">SMS notifications for urgent issues</span>
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-destructive">Danger Zone</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Disable Account</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Disable account and remove from external channels to stop syncing conversations.
                    </p>
                    <Button variant="outline" size="sm" className="text-sm bg-transparent">
                      Disable Account
                    </Button>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Delete Account</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Permanently delete this account and all associated data. This action cannot be undone.
                    </p>
                    <Button variant="destructive" size="sm" className="text-sm">
                      Delete Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Contact Management Tray */}
        {showContactTray && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-end">
            <div className="0 h-full w-96 shadow-xl overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold">{editingContact ? "Edit Contact" : "Add Contact"}</h3>
                  <Button variant="ghost" size="sm" onClick={handleCancelContact}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <Label htmlFor="name" className="text-sm font-medium">
                    Name *
                  </Label>
                  <Input
                    id="name"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    placeholder="Enter full name"
                    className="mt-1 text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    placeholder="Enter email address"
                    className="mt-1 text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="role" className="text-sm font-medium">
                    Role
                  </Label>
                  <Select
                    value={contactForm.role}
                    onValueChange={(value) => setContactForm({ ...contactForm, role: value })}
                  >
                    <SelectTrigger className="mt-1 text-sm">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IT Manager" className="text-sm">
                        IT Manager
                      </SelectItem>
                      <SelectItem value="Admin" className="text-sm">
                        Admin
                      </SelectItem>
                      <SelectItem value="Developer" className="text-sm">
                        Developer
                      </SelectItem>
                      <SelectItem value="Support" className="text-sm">
                        Support
                      </SelectItem>
                      <SelectItem value="Manager" className="text-sm">
                        Manager
                      </SelectItem>
                      <SelectItem value="Director" className="text-sm">
                        Director
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="department" className="text-sm font-medium">
                    Department
                  </Label>
                  <Select
                    value={contactForm.department}
                    onValueChange={(value) => setContactForm({ ...contactForm, department: value })}
                  >
                    <SelectTrigger className="mt-1 text-sm">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Information Technology" className="text-sm">
                        Information Technology
                      </SelectItem>
                      <SelectItem value="Administration" className="text-sm">
                        Administration
                      </SelectItem>
                      <SelectItem value="Human Resources" className="text-sm">
                        Human Resources
                      </SelectItem>
                      <SelectItem value="Finance" className="text-sm">
                        Finance
                      </SelectItem>
                      <SelectItem value="Operations" className="text-sm">
                        Operations
                      </SelectItem>
                      <SelectItem value="Sales" className="text-sm">
                        Sales
                      </SelectItem>
                      <SelectItem value="Marketing" className="text-sm">
                        Marketing
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="phone" className="text-sm font-medium">
                    Phone
                  </Label>
                  <div className="flex mt-1">
                    <Select value={countryCode} onValueChange={setCountryCode}>
                      <SelectTrigger className="w-32 text-sm rounded-r-none border-r-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {countryCodes.map((country) => (
                          <SelectItem key={country.code} value={country.code} className="text-sm">
                            <span className="flex items-center space-x-2">
                              <span>{country.flag}</span>
                              <span>{country.code}</span>
                              <span className="text-muted-foreground">({country.country})</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      id="phone"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                      placeholder="Enter phone number"
                      className="text-sm rounded-l-none flex-1"
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 border-t bg-muted/50 flex justify-end space-x-3">
                <Button variant="outline" onClick={handleCancelContact} className="text-sm bg-transparent">
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveContact}
                  className="text-sm"
                  disabled={!contactForm.name || !contactForm.email}
                >
                  {editingContact ? "Update Contact" : "Add Contact"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContent>
  )
}
