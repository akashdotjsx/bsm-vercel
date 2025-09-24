"use client"

import { useState, useEffect } from "react"
import { PlatformLayout } from "@/components/layout/platform-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Shield,
  Users,
  Key,
  Eye,
  Settings,
  Plus,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Copy,
  RefreshCw,
  BarChart3,
  Building2,
  Ticket,
  Workflow,
  HardDrive,
  BookOpen,
  PieChart,
  Clock,
  Zap,
  Settings2,
  Mail,
  Loader2,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function SecurityPage() {
  const [activeTab, setActiveTab] = useState("roles")
  const [showAddRoleModal, setShowAddRoleModal] = useState(false)
  const [showEditRoleModal, setShowEditRoleModal] = useState(false)
  const [showManageUsersModal, setShowManageUsersModal] = useState(false)
  const [selectedRole, setSelectedRole] = useState<any>(null)
  const [newRolePermissionsInternal, setNewRolePermissionsInternal] = useState<any>({})
  const [editRolePermissionsInternal, setEditRolePermissionsInternal] = useState<any>({})
  const [userSearchQuery, setUserSearchQuery] = useState("")
  const [showAddProviderModal, setShowAddProviderModal] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<any>(null)
  const [showEditProviderModal, setShowEditProviderModal] = useState(false)

  const [allUsers, setAllUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")

  const [roles, setRoles] = useState<any[]>([])
  const [rolesLoading, setRolesLoading] = useState(true)

  const fetchRoles = async () => {
    try {
      const supabase = createClient()
      const { data: rolesData, error } = await supabase.from("roles").select("*").order("name")

      if (error) throw error

      // Transform database roles to match UI format
      const transformedRoles =
        rolesData?.map((role) => ({
          id: role.id,
          name: role.name,
          users: 0, // This would need to be calculated from user assignments
          permissions: role.permissions || {},
          color: role.color || "blue",
          description: role.description || "",
        })) || []

      setRoles(transformedRoles)
    } catch (error) {
      console.error("Error fetching roles:", error)
    } finally {
      setRolesLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const supabase = createClient()
      const { data: users, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email, department, avatar_url")
        .order("first_name")

      if (error) throw error

      setAllUsers(
        users?.map((user) => {
          const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim() || "Unknown User"
          return {
            id: user.id,
            name: fullName,
            email: user.email,
            department: user.department || "Not specified",
            status: "Active",
            avatar:
              user.avatar_url ||
              fullName
                .split(" ")
                .map((n: string) => n[0])
                .join("")
                .toUpperCase() ||
              "U",
          }
        }) || [],
      )
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }

  const inviteUser = async () => {
    if (!inviteEmail.trim()) return

    setLoading(true)
    try {
      // Send invitation email logic would go here
      // For now, we'll just show a success message
      alert(`Invitation sent to ${inviteEmail}`)
      setInviteEmail("")
    } catch (error) {
      console.error("Error inviting user:", error)
      alert("Failed to send invitation")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
    fetchRoles()
  }, [])

  const [userRoleAssignments, setUserRoleAssignments] = useState<any>({
    1: [1, 2], // System Admin and IT Manager roles
    2: [3], // HR Manager role
    3: [2], // IT Manager role
    4: [4], // Service Agent role
    5: [5], // End User role
    6: [5], // End User role
    7: [4], // Service Agent role
    8: [3], // HR Manager role
  })

  const platformServices = [
    {
      key: "dashboard",
      label: "Dashboard",
      icon: BarChart3,
      description: "Main dashboard and overview",
    },
    {
      key: "service_catalog",
      label: "Service Catalog",
      icon: Building2,
      description: "Browse and request services",
    },
    {
      key: "incident_management",
      label: "Incident Management",
      icon: Ticket,
      description: "Manage tickets and incidents",
    },
    {
      key: "change_management",
      label: "Change Management",
      icon: Workflow,
      description: "Handle change requests and workflows",
    },
    {
      key: "asset_management",
      label: "Asset Management",
      icon: HardDrive,
      description: "Track and manage IT assets",
    },
    {
      key: "knowledge_base",
      label: "Knowledge Base",
      icon: BookOpen,
      description: "Access articles and documentation",
    },
    {
      key: "analytics_reports",
      label: "Analytics & Reports",
      icon: PieChart,
      description: "View performance metrics and reports",
    },
    {
      key: "user_management",
      label: "User Management",
      icon: Users,
      description: "Manage users and teams",
    },
    {
      key: "workflow_builder",
      label: "Workflow Builder",
      icon: Workflow,
      description: "Create and manage workflows",
    },
    {
      key: "sla_management",
      label: "SLA Management",
      icon: Clock,
      description: "Configure service level agreements",
    },
    {
      key: "integrations",
      label: "Integrations",
      icon: Zap,
      description: "Manage third-party integrations",
    },
    {
      key: "security_access",
      label: "Security & Access",
      icon: Shield,
      description: "Configure security and permissions",
    },
    {
      key: "system_settings",
      label: "System Settings",
      icon: Settings2,
      description: "System configuration and settings",
    },
  ]

  const [providers, setProviders] = useState([
    {
      id: 1,
      name: "Microsoft Azure AD",
      type: "SAML 2.0",
      status: "Active",
      users: 156,
      lastSync: "2 hours ago",
      icon: "🔷",
      clientId: "azure-client-123",
      domain: "company.onmicrosoft.com",
    },
    {
      id: 2,
      name: "Google Workspace",
      type: "OAuth 2.0",
      status: "Active",
      users: 89,
      lastSync: "1 hour ago",
      icon: "🔴",
      clientId: "google-client-456",
      domain: "company.com",
    },
    {
      id: 3,
      name: "Okta",
      type: "SAML 2.0",
      status: "Configured",
      users: 0,
      lastSync: "Never",
      icon: "🔵",
      clientId: "okta-client-789",
      domain: "company.okta.com",
    },
    {
      id: 4,
      name: "Auth0",
      type: "OpenID Connect",
      status: "Inactive",
      users: 0,
      lastSync: "Never",
      icon: "🟠",
      clientId: "auth0-client-012",
      domain: "company.auth0.com",
    },
  ])

  const handleAddProvider = (providerData: any) => {
    const newProvider = {
      id: providers.length + 1,
      ...providerData,
      users: 0,
      lastSync: "Never",
      status: "Configured",
    }
    setProviders([...providers, newProvider])
    setShowAddProviderModal(false)
  }

  const handleEditProvider = (providerData: any) => {
    setProviders(providers.map((p) => (p.id === selectedProvider.id ? { ...p, ...providerData } : p)))
    setShowEditProviderModal(false)
    setSelectedProvider(null)
  }

  const handleDeleteProvider = (providerId: number) => {
    setProviders(providers.filter((p) => p.id !== providerId))
  }

  const handleSyncProvider = (providerId: number) => {
    setProviders(providers.map((p) => (p.id === providerId ? { ...p, lastSync: "Just now", status: "Active" } : p)))
  }

  const handleAddRole = async (roleData: any) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("roles")
        .insert([
          {
            name: roleData.name,
            description: roleData.description,
            permissions: newRolePermissionsInternal,
            color: roleData.color || "blue",
          },
        ])
        .select()

      if (error) throw error

      // Refresh roles list
      await fetchRoles()
      setShowAddRoleModal(false)
      setNewRolePermissionsInternal({})
    } catch (error) {
      console.error("Error adding role:", error)
      alert("Failed to add role")
    }
  }

  const handleEditRole = async (roleData: any) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("roles")
        .update({
          name: roleData.name,
          description: roleData.description,
          permissions: editRolePermissionsInternal,
          color: roleData.color,
        })
        .eq("id", selectedRole.id)

      if (error) throw error

      // Refresh roles list
      await fetchRoles()
      setShowEditRoleModal(false)
      setSelectedRole(null)
      setEditRolePermissionsInternal({})
    } catch (error) {
      console.error("Error updating role:", error)
      alert("Failed to update role")
    }
  }

  const handleDeleteRole = async (roleId: number) => {
    const role = roles.find((r) => r.id === roleId)
    if (role?.name === "System Administrator") {
      alert("Cannot delete System Administrator role")
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase.from("roles").delete().eq("id", roleId)

      if (error) throw error

      // Refresh roles list
      await fetchRoles()
    } catch (error) {
      console.error("Error deleting role:", error)
      alert("Failed to delete role")
    }
  }

  const openAddRoleModal = () => {
    const defaultPermissions: Record<string, string> = {}
    platformServices.forEach((service) => {
      defaultPermissions[service.key] = "Can View"
    })
    setNewRolePermissionsInternal(defaultPermissions)
    setShowAddRoleModal(true)
  }

  const openEditRoleModal = (role: any) => {
    setSelectedRole(role)
    setEditRolePermissionsInternal(role.permissions || {})
    setShowEditRoleModal(true)
  }

  const openManageUsersModal = (role: any) => {
    setSelectedRole(role)
    setShowManageUsersModal(true)
    setUserSearchQuery("")
  }

  const getUsersForRole = (roleId: number) => {
    return allUsers.filter((user) => userRoleAssignments[user.id]?.includes(roleId))
  }

  const toggleUserRole = (userId: number, roleId: number) => {
    setUserRoleAssignments((prev) => {
      const userRoles = prev[userId] || []
      const hasRole = userRoles.includes(roleId)

      if (hasRole) {
        return {
          ...prev,
          [userId]: userRoles.filter((id: number) => id !== roleId),
        }
      } else {
        return {
          ...prev,
          [userId]: [...userRoles, roleId],
        }
      }
    })
  }

  const filteredUsers = allUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      user.department.toLowerCase().includes(userSearchQuery.toLowerCase()),
  )

  const getPermissionSummary = (permissions: Record<string, string>) => {
    const fullAccess = Object.values(permissions).filter((p) => p === "Full Access").length
    const canEdit = Object.values(permissions).filter((p) => p === "Can Edit").length
    const canView = Object.values(permissions).filter((p) => p === "Can View").length

    if (fullAccess === platformServices.length) return "Full Access to all modules"
    if (fullAccess > 0) return `Full Access (${fullAccess}), Edit (${canEdit}), View (${canView})`
    if (canEdit > 0) return `Edit (${canEdit}), View (${canView})`
    return `View (${canView})`
  }

  return (
    <PlatformLayout
      title="Security & Access"
      description="Manage user roles, permissions, and security policies"
      breadcrumbs={[
        { label: "Administration", href: "/admin" },
        { label: "Security & Access", href: "/admin/security" },
      ]}
    >
      <div className="space-y-6 text-[13px]">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-[13px] font-medium">Active Users</p>
                  <p className="text-2xl font-bold">247</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-[13px] font-medium">Security Policies</p>
                  <p className="text-2xl font-bold">12</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Key className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-[13px] font-medium">API Keys</p>
                  <p className="text-2xl font-bold">8</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Eye className="h-4 w-4 text-purple-500" />
                <div>
                  <p className="text-[13px] font-medium">Audit Logs</p>
                  <p className="text-2xl font-bold">1,234</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">Single Sign-On (SSO)</CardTitle>
                <CardDescription className="text-[13px]">
                  Configure SSO providers and authentication settings
                </CardDescription>
              </div>
              <Dialog open={showAddProviderModal} onOpenChange={setShowAddProviderModal}>
                <DialogTrigger asChild>
                  <Button size="sm" className="text-[13px]">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Provider
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add SSO Provider</DialogTitle>
                    <DialogDescription className="text-[13px]">
                      Configure a new SSO provider for your organization
                    </DialogDescription>
                  </DialogHeader>
                  <Tabs defaultValue="basic" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="basic" className="text-[13px]">
                        Basic Info
                      </TabsTrigger>
                      <TabsTrigger value="config" className="text-[13px]">
                        Configuration
                      </TabsTrigger>
                      <TabsTrigger value="mapping" className="text-[13px]">
                        User Mapping
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="basic" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="provider-name" className="text-[13px]">
                            Provider Name
                          </Label>
                          <Input id="provider-name" placeholder="e.g., Microsoft Azure AD" className="text-[13px]" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="provider-type" className="text-[13px]">
                            Protocol Type
                          </Label>
                          <Select>
                            <SelectTrigger className="text-[13px]">
                              <SelectValue placeholder="Select protocol" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="saml" className="text-[13px]">
                                SAML 2.0
                              </SelectItem>
                              <SelectItem value="oauth" className="text-[13px]">
                                OAuth 2.0
                              </SelectItem>
                              <SelectItem value="oidc" className="text-[13px]">
                                OpenID Connect
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="provider-domain" className="text-[13px]">
                          Domain
                        </Label>
                        <Input
                          id="provider-domain"
                          placeholder="e.g., company.onmicrosoft.com"
                          className="text-[13px]"
                        />
                      </div>
                    </TabsContent>
                    <TabsContent value="config" className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="client-id" className="text-[13px]">
                          Client ID
                        </Label>
                        <Input id="client-id" placeholder="Enter client ID" className="text-[13px]" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="client-secret" className="text-[13px]">
                          Client Secret
                        </Label>
                        <Input
                          id="client-secret"
                          type="password"
                          placeholder="Enter client secret"
                          className="text-[13px]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="redirect-url" className="text-[13px]">
                          Redirect URL
                        </Label>
                        <Input
                          id="redirect-url"
                          placeholder="https://your-app.com/auth/callback"
                          className="text-[13px]"
                        />
                      </div>
                    </TabsContent>
                    <TabsContent value="mapping" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="email-attr" className="text-[13px]">
                            Email Attribute
                          </Label>
                          <Input id="email-attr" placeholder="email" className="text-[13px]" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="name-attr" className="text-[13px]">
                            Name Attribute
                          </Label>
                          <Input id="name-attr" placeholder="displayName" className="text-[13px]" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="default-role" className="text-[13px]">
                          Default Role
                        </Label>
                        <Select>
                          <SelectTrigger className="text-[13px]">
                            <SelectValue placeholder="Select default role" />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map((role) => (
                              <SelectItem key={role.id} value={role.id.toString()} className="text-[13px]">
                                {role.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </TabsContent>
                  </Tabs>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAddProviderModal(false)} className="text-[13px]">
                      Cancel
                    </Button>
                    <Button
                      onClick={() =>
                        handleAddProvider({
                          name: "New Provider",
                          type: "SAML 2.0",
                          icon: "🔵",
                          clientId: "new-client-id",
                          domain: "new-domain.com",
                        })
                      }
                      className="text-[13px]"
                    >
                      Add Provider
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {providers.map((provider) => (
                <div key={provider.id} className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl">{provider.icon}</div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-[13px]">{provider.name}</p>
                        <Badge variant="outline" className="text-[11px]">
                          {provider.type}
                        </Badge>
                      </div>
                      <p className="text-[13px] text-gray-500">
                        {provider.users} users • Last sync: {provider.lastSync}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      {provider.status === "Active" ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : provider.status === "Configured" ? (
                        <Settings className="h-4 w-4 text-blue-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-400" />
                      )}
                      <Badge
                        variant={
                          provider.status === "Active"
                            ? "default"
                            : provider.status === "Configured"
                              ? "secondary"
                              : "outline"
                        }
                        className="text-[11px]"
                      >
                        {provider.status}
                      </Badge>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedProvider(provider)
                            setShowEditProviderModal(true)
                          }}
                          className="text-[13px]"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Configuration
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSyncProvider(provider.id)} className="text-[13px]">
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Sync Users
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => navigator.clipboard.writeText(provider.clientId)}
                          className="text-[13px]"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Client ID
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteProvider(provider.id)}
                          className="text-red-600 text-[13px]"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Provider
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">User Roles & Permissions</CardTitle>
                <CardDescription className="text-[13px]">
                  Manage user roles and their associated permissions
                </CardDescription>
              </div>
              <Dialog open={showAddRoleModal} onOpenChange={setShowAddRoleModal}>
                <DialogTrigger asChild>
                  <Button size="sm" className="text-[13px]" onClick={openAddRoleModal}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Role
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Add User Role</DialogTitle>
                    <DialogDescription className="text-[13px]">
                      Create a new user role with specific permissions
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="role-name" className="text-[13px]">
                          Role Name
                        </Label>
                        <Input id="role-name" placeholder="e.g., Service Manager" className="text-[13px]" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role-color" className="text-[13px]">
                          Color
                        </Label>
                        <Select>
                          <SelectTrigger className="text-[13px]">
                            <SelectValue placeholder="Select color" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="red" className="text-[13px]">
                              Red
                            </SelectItem>
                            <SelectItem value="blue" className="text-[13px]">
                              Blue
                            </SelectItem>
                            <SelectItem value="green" className="text-[13px]">
                              Green
                            </SelectItem>
                            <SelectItem value="yellow" className="text-[13px]">
                              Yellow
                            </SelectItem>
                            <SelectItem value="purple" className="text-[13px]">
                              Purple
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role-description" className="text-[13px]">
                        Description
                      </Label>
                      <Textarea
                        id="role-description"
                        placeholder="Describe the role responsibilities"
                        className="text-[13px]"
                      />
                    </div>
                    <div className="space-y-4">
                      <Label className="text-[13px] font-medium">Services and Permissions</Label>
                      <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
                        <div className="space-y-3">
                          {platformServices.map((service) => {
                            const Icon = service.icon
                            return (
                              <div
                                key={service.key}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                              >
                                <div className="flex items-center space-x-3">
                                  <Icon className="h-5 w-5 text-gray-600" />
                                  <div>
                                    <Label className="text-[13px] font-medium">{service.label}</Label>
                                    <p className="text-[12px] text-gray-500">{service.description}</p>
                                  </div>
                                </div>
                                <Select
                                  value={newRolePermissionsInternal[service.key] || "Can View"}
                                  onValueChange={(value) =>
                                    setNewRolePermissionsInternal((prev) => ({ ...prev, [service.key]: value }))
                                  }
                                >
                                  <SelectTrigger className="w-32 text-[13px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Full Access" className="text-[13px]">
                                      Full Access
                                    </SelectItem>
                                    <SelectItem value="Can Edit" className="text-[13px]">
                                      Can Edit
                                    </SelectItem>
                                    <SelectItem value="Can View" className="text-[13px]">
                                      Can View
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAddRoleModal(false)} className="text-[13px]">
                      Cancel
                    </Button>
                    <Button
                      onClick={() =>
                        handleAddRole({
                          name: (document.getElementById("role-name") as HTMLInputElement)?.value || "New Role",
                          description:
                            (document.getElementById("role-description") as HTMLTextAreaElement)?.value ||
                            "New role description",
                        })
                      }
                      className="text-[13px]"
                    >
                      Add Role
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {rolesLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2 text-sm text-gray-500">Loading roles...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {roles.map((role) => (
                  <div key={role.id} className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <Shield className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-[13px]">{role.name}</p>
                        <p className="text-[13px] text-gray-500">{getPermissionSummary(role.permissions)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge variant="secondary" className="text-[11px]">
                        {role.users} users
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditRoleModal(role)} className="text-[13px]">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Role
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openManageUsersModal(role)} className="text-[13px]">
                            <Users className="h-4 w-4 mr-2" />
                            Manage Users
                          </DropdownMenuItem>
                          {role.name !== "System Administrator" && (
                            <DropdownMenuItem
                              onClick={() => handleDeleteRole(role.id)}
                              className="text-red-600 text-[13px]"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Role
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">Security Policies</CardTitle>
                <CardDescription className="text-[13px]">
                  Configure security settings and access controls
                </CardDescription>
              </div>
              <Button size="sm" className="text-[13px]">
                <Settings className="h-4 w-4 mr-2" />
                Configure
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  name: "Password Policy",
                  status: "Active",
                  description: "Minimum 8 characters, special chars required",
                },
                {
                  name: "Session Timeout",
                  status: "Active",
                  description: "Auto logout after 30 minutes of inactivity",
                },
                {
                  name: "Two-Factor Authentication",
                  status: "Optional",
                  description: "TOTP-based 2FA for enhanced security",
                },
                {
                  name: "IP Allowlist",
                  status: "Disabled",
                  description: "Restrict access to specific IP ranges",
                },
                {
                  name: "SSO Enforcement",
                  status: "Active",
                  description: "Require SSO authentication for all users",
                },
                {
                  name: "Just-in-Time Provisioning",
                  status: "Active",
                  description: "Auto-create users from SSO providers",
                },
              ].map((policy) => (
                <div key={policy.name} className="p-4 rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-[13px]">{policy.name}</h4>
                    <Badge
                      variant={
                        policy.status === "Active" ? "default" : policy.status === "Optional" ? "secondary" : "outline"
                      }
                      className="text-[11px]"
                    >
                      {policy.status}
                    </Badge>
                  </div>
                  <p className="text-[13px] text-gray-500">{policy.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Dialog open={showEditProviderModal} onOpenChange={setShowEditProviderModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit SSO Provider</DialogTitle>
              <DialogDescription className="text-[13px]">
                Update the configuration for {selectedProvider?.name}
              </DialogDescription>
            </DialogHeader>
            {selectedProvider && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-provider-name" className="text-[13px]">
                      Provider Name
                    </Label>
                    <Input id="edit-provider-name" defaultValue={selectedProvider.name} className="text-[13px]" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-provider-status" className="text-[13px]">
                      Status
                    </Label>
                    <Select defaultValue={selectedProvider.status.toLowerCase()}>
                      <SelectTrigger className="text-[13px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active" className="text-[13px]">
                          Active
                        </SelectItem>
                        <SelectItem value="configured" className="text-[13px]">
                          Configured
                        </SelectItem>
                        <SelectItem value="inactive" className="text-[13px]">
                          Inactive
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-provider-domain" className="text-[13px]">
                    Domain
                  </Label>
                  <Input id="edit-provider-domain" defaultValue={selectedProvider.domain} className="text-[13px]" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-client-id" className="text-[13px]">
                    Client ID
                  </Label>
                  <Input id="edit-client-id" defaultValue={selectedProvider.clientId} className="text-[13px]" />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditProviderModal(false)} className="text-[13px]">
                Cancel
              </Button>
              <Button
                onClick={() =>
                  handleEditProvider({
                    name: selectedProvider?.name,
                    domain: selectedProvider?.domain,
                    status: "Active",
                  })
                }
                className="text-[13px]"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showEditRoleModal} onOpenChange={setShowEditRoleModal}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Edit User Role</DialogTitle>
              <DialogDescription className="text-[13px]">
                Update the permissions for {selectedRole?.name}
              </DialogDescription>
            </DialogHeader>
            {selectedRole && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-role-name" className="text-[13px]">
                    Role Name
                  </Label>
                  <Input
                    id="edit-role-name"
                    defaultValue={selectedRole.name}
                    className="text-[13px]"
                    disabled={selectedRole.name === "System Administrator"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-role-description" className="text-[13px]">
                    Description
                  </Label>
                  <Textarea
                    id="edit-role-description"
                    defaultValue={selectedRole.description}
                    className="text-[13px]"
                  />
                </div>
                <div className="space-y-4">
                  <Label className="text-[13px] font-medium">Services and Permissions</Label>
                  <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
                    <div className="space-y-3">
                      {platformServices.map((service) => {
                        const Icon = service.icon
                        return (
                          <div
                            key={service.key}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center space-x-3">
                              <Icon className="h-5 w-5 text-gray-600" />
                              <div>
                                <Label className="text-[13px] font-medium">{service.label}</Label>
                                <p className="text-[12px] text-gray-500">{service.description}</p>
                              </div>
                            </div>
                            <Select
                              value={
                                editRolePermissionsInternal[service.key] ||
                                selectedRole.permissions?.[service.key] ||
                                "Can View"
                              }
                              onValueChange={(value) =>
                                setEditRolePermissionsInternal((prev) => ({ ...prev, [service.key]: value }))
                              }
                              disabled={selectedRole.name === "System Administrator"}
                            >
                              <SelectTrigger className="w-32 text-[13px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Full Access" className="text-[13px]">
                                  Full Access
                                </SelectItem>
                                <SelectItem value="Can Edit" className="text-[13px]">
                                  Can Edit
                                </SelectItem>
                                <SelectItem value="Can View" className="text-[13px]">
                                  Can View
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditRoleModal(false)} className="text-[13px]">
                Cancel
              </Button>
              <Button
                onClick={() =>
                  handleEditRole({
                    name: (document.getElementById("edit-role-name") as HTMLInputElement)?.value || selectedRole?.name,
                    description:
                      (document.getElementById("edit-role-description") as HTMLTextAreaElement)?.value ||
                      selectedRole?.description,
                  })
                }
                className="text-[13px]"
                disabled={selectedRole?.name === "System Administrator"}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showManageUsersModal} onOpenChange={setShowManageUsersModal}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Manage Users - {selectedRole?.name}</DialogTitle>
              <DialogDescription className="text-[13px]">
                View current users and invite new users to this role
              </DialogDescription>
            </DialogHeader>

            {selectedRole && (
              <div className="space-y-6">
                {/* Current Users in Role */}
                <div>
                  <h4 className="text-[13px] font-medium mb-3">
                    Current Users ({getUsersForRole(selectedRole.id).length})
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {getUsersForRole(selectedRole.id).map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          {user.avatar?.startsWith("http") ? (
                            <img
                              src={user.avatar || "/placeholder.svg"}
                              alt={user.name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-[11px] font-medium">
                              {user.avatar}
                            </div>
                          )}
                          <div>
                            <p className="text-[13px] font-medium">{user.name}</p>
                            <p className="text-[11px] text-gray-500">
                              {user.email} • {user.department}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleUserRole(user.id, selectedRole.id)}
                          className="text-[11px] h-7"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    {getUsersForRole(selectedRole.id).length === 0 && (
                      <p className="text-[12px] text-gray-500 text-center py-8">No users assigned to this role</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-[13px] font-medium mb-3">Invite User to Role</h4>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Enter email address to invite..."
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="text-[13px] flex-1"
                      type="email"
                    />
                    <Button onClick={inviteUser} disabled={!inviteEmail.trim() || loading} className="text-[13px]">
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4 mr-2" />
                          Send Invite
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-2">
                    An invitation email will be sent to the user with instructions to join this role.
                  </p>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowManageUsersModal(false)} className="text-[13px]">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PlatformLayout>
  )
}
