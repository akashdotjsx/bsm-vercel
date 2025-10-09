"use client"

import { useState } from "react"
import { PageContent } from "@/components/layout/page-content"
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
} from "lucide-react"

export default function SecurityAccessPage() {
  const [showAddProviderModal, setShowAddProviderModal] = useState(false)
  const [showAddRoleModal, setShowAddRoleModal] = useState(false)
  const [showEditProviderModal, setShowEditProviderModal] = useState(false)
  const [showEditRoleModal, setShowEditRoleModal] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<any>(null)
  const [selectedRole, setSelectedRole] = useState<any>(null)

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

  const [roles, setRoles] = useState([
    {
      id: 1,
      name: "System Administrator",
      users: 3,
      permissions: ["Full Access"],
      color: "red",
      description: "Complete system access and management",
    },
    {
      id: 2,
      name: "IT Manager",
      users: 8,
      permissions: ["IT Services", "Users", "Assets"],
      color: "blue",
      description: "Manage IT services and user accounts",
    },
    {
      id: 3,
      name: "HR Manager",
      users: 5,
      permissions: ["HR Services", "Reports", "Users"],
      color: "green",
      description: "Human resources management and reporting",
    },
    {
      id: 4,
      name: "Service Agent",
      users: 45,
      permissions: ["Tickets", "Knowledge Base", "Services"],
      color: "yellow",
      description: "Handle service requests and tickets",
    },
    {
      id: 5,
      name: "End User",
      users: 186,
      permissions: ["Submit Requests", "View Status"],
      color: "gray",
      description: "Basic user access for submitting requests",
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

  const handleAddRole = (roleData: any) => {
    const newRole = {
      id: roles.length + 1,
      ...roleData,
      users: 0,
      color: "blue",
    }
    setRoles([...roles, newRole])
    setShowAddRoleModal(false)
  }

  const handleEditRole = (roleData: any) => {
    setRoles(roles.map((r) => (r.id === selectedRole.id ? { ...r, ...roleData } : r)))
    setShowEditRoleModal(false)
    setSelectedRole(null)
  }

  const handleDeleteRole = (roleId: number) => {
    setRoles(roles.filter((r) => r.id !== roleId))
  }

  return (
    <PageContent
      title="Security & Access"
      description="Manage user roles, permissions, and security policies"
      breadcrumb={[
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
                  <p className="text-[13px] font-bold">247</p>
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
                  <p className="text-[13px] font-bold">12</p>
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
                  <p className="text-[13px] font-bold">8</p>
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
                  <p className="text-[13px] font-bold">1,234</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-[11px] font-semibold">Single Sign-On (SSO)</CardTitle>
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
                    <div className="text-[13px]">{provider.icon}</div>
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
                <CardTitle className="text-[11px] font-semibold">User Roles & Permissions</CardTitle>
                <CardDescription className="text-[13px]">
                  Manage user roles and their associated permissions
                </CardDescription>
              </div>
              <Dialog open={showAddRoleModal} onOpenChange={setShowAddRoleModal}>
                <DialogTrigger asChild>
                  <Button size="sm" className="text-[13px]">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Role
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
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
                    <div className="space-y-2">
                      <Label className="text-[13px]">Permissions</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          "Tickets",
                          "Knowledge Base",
                          "Services",
                          "Assets",
                          "Users",
                          "Reports",
                          "Analytics",
                          "Integrations",
                          "Security",
                          "Administration",
                        ].map((permission) => (
                          <div key={permission} className="flex items-center space-x-2">
                            <input type="checkbox" id={permission} className="rounded" />
                            <Label htmlFor={permission} className="text-[13px]">
                              {permission}
                            </Label>
                          </div>
                        ))}
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
                          name: "New Role",
                          permissions: ["Tickets"],
                          description: "New role description",
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
            <div className="space-y-4">
              {roles.map((role) => (
                <div key={role.id} className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <Shield className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-[13px]">{role.name}</p>
                      <p className="text-[13px] text-gray-500">{role.permissions.join(", ")}</p>
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
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedRole(role)
                            setShowEditRoleModal(true)
                          }}
                          className="text-[13px]"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Role
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-[13px]">
                          <Users className="h-4 w-4 mr-2" />
                          Manage Users
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteRole(role.id)}
                          className="text-red-600 text-[13px]"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Role
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
                <CardTitle className="text-[11px] font-semibold">Security Policies</CardTitle>
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
          <DialogContent className="max-w-2xl">
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
                  <Input id="edit-role-name" defaultValue={selectedRole.name} className="text-[13px]" />
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
                <div className="space-y-2">
                  <Label className="text-[13px]">Permissions</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      "Tickets",
                      "Knowledge Base",
                      "Services",
                      "Assets",
                      "Users",
                      "Reports",
                      "Analytics",
                      "Integrations",
                      "Security",
                      "Administration",
                    ].map((permission) => (
                      <div key={permission} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`edit-${permission}`}
                          defaultChecked={selectedRole.permissions.includes(permission)}
                          className="rounded"
                        />
                        <Label htmlFor={`edit-${permission}`} className="text-[13px]">
                          {permission}
                        </Label>
                      </div>
                    ))}
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
                    name: selectedRole?.name,
                    description: selectedRole?.description,
                    permissions: selectedRole?.permissions,
                  })
                }
                className="text-[13px]"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageContent>
  )
}
