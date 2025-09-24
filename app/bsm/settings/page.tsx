"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { PlatformLayout } from "@/components/layout/platform-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import DatabaseOperations from "@/lib/database-operations"

const IconPlaceholder = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center justify-center w-4 h-4 text-xs font-medium bg-gray-200 rounded text-gray-600">
    {children}
  </span>
)

export default function SettingsPage() {
  console.log("[v0] Settings page loading with database integration...")

  const [roles, setRoles] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingRole, setEditingRole] = useState<any>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isManageUsersDialogOpen, setIsManageUsersDialogOpen] = useState(false)
  const [selectedRoleForUsers, setSelectedRoleForUsers] = useState<any>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const dbOps = DatabaseOperations.getInstance()

        // Load roles from database
        const rolesData = await dbOps.getRoles()
        setRoles(rolesData)

        // Load users from database
        const usersData = await dbOps.getUsers({ limit: 50 })
        setUsers(usersData)

        console.log("[v0] Settings data loaded from database:", { roles: rolesData.length, users: usersData.length })
      } catch (error) {
        console.error("[v0] Error loading settings data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const modules = [
    { key: "tickets", label: "Tickets", icon: () => <IconPlaceholder>T</IconPlaceholder> },
    { key: "services", label: "Services", icon: () => <IconPlaceholder>S</IconPlaceholder> },
    { key: "users", label: "Users", icon: () => <IconPlaceholder>U</IconPlaceholder> },
    { key: "analytics", label: "Analytics", icon: () => <IconPlaceholder>A</IconPlaceholder> },
    { key: "security", label: "Security", icon: () => <IconPlaceholder>🛡</IconPlaceholder> },
    { key: "knowledgeBase", label: "Knowledge Base", icon: () => <IconPlaceholder>K</IconPlaceholder> },
    { key: "assets", label: "Assets", icon: () => <IconPlaceholder>📦</IconPlaceholder> },
    { key: "reports", label: "Reports", icon: () => <IconPlaceholder>R</IconPlaceholder> },
    { key: "integrations", label: "Integrations", icon: () => <IconPlaceholder>I</IconPlaceholder> },
    { key: "administration", label: "Administration", icon: () => <IconPlaceholder>⚙</IconPlaceholder> },
  ]

  const permissionLevels = ["Full Access", "Can Edit", "Can View"]

  const handleEditRole = (role: any) => {
    console.log("[v0] Editing role:", role.name)
    setEditingRole({ ...role })
    setIsEditDialogOpen(true)
  }

  const handleSaveRole = async () => {
    if (editingRole) {
      try {
        console.log("[v0] Saving role changes:", editingRole.name)
        const dbOps = DatabaseOperations.getInstance()
        await dbOps.updateRole(editingRole.id, {
          name: editingRole.name,
          description: editingRole.description,
          permissions: editingRole.permissions,
        })

        // Update local state
        setRoles(roles.map((role) => (role.id === editingRole.id ? editingRole : role)))
        setIsEditDialogOpen(false)
        setEditingRole(null)
      } catch (error) {
        console.error("[v0] Error saving role:", error)
      }
    }
  }

  const handlePermissionChange = (module: string, level: string) => {
    console.log("[v0] Permission changed:", module, "->", level)
    if (editingRole) {
      setEditingRole({
        ...editingRole,
        permissions: {
          ...editingRole.permissions,
          [module]: level,
        },
      })
    }
  }

  const handleManageUsers = (role: any) => {
    console.log("[v0] Managing users for role:", role.name)
    setSelectedRoleForUsers(role)
    setIsManageUsersDialogOpen(true)
  }

  const getPermissionBadgeColor = (permission: string) => {
    switch (permission) {
      case "Full Access":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      case "Can Edit":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
      case "Can View":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    }
  }

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const getUsersForRole = (roleName: string) => {
    return users.filter((user) => user.role?.name === roleName)
  }

  const getUsersNotInRole = (roleName: string) => {
    return users.filter((user) => user.role?.name !== roleName)
  }

  if (loading) {
    return (
      <PlatformLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-muted-foreground">Loading settings...</span>
        </div>
      </PlatformLayout>
    )
  }

  return (
    <PlatformLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your organization settings and configurations.</p>
        </div>

        <Tabs defaultValue="roles" className="space-y-4">
          <TabsList>
            <TabsTrigger value="roles">User Roles & Permissions</TabsTrigger>
            <TabsTrigger value="general">General Settings</TabsTrigger>
            <TabsTrigger value="security">Security Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="roles" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>User Roles & Permissions</CardTitle>
                    <CardDescription>
                      Manage user roles and their access permissions across different modules.
                    </CardDescription>
                  </div>
                  <Button>
                    <span className="mr-2">+</span>
                    Add Role
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {roles.map((role) => (
                    <div key={role.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{role.name}</h3>
                            <Badge variant="secondary" className="text-xs">
                              {getUsersForRole(role.name).length} users
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{role.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleManageUsers(role)}>
                            <span className="mr-1">👥</span>
                            Manage Users
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleEditRole(role)}>
                            <span className="mr-1">✏️</span>
                            Edit
                          </Button>
                          <Button variant="outline" size="sm">
                            🗑️
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                        {modules.slice(0, 10).map((module) => {
                          const permission = role.permissions?.[module.key] || "Can View"
                          return (
                            <div key={module.key} className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">{module.label}:</span>
                              <Badge variant="secondary" className={`text-xs ${getPermissionBadgeColor(permission)}`}>
                                {permission}
                              </Badge>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Configure general application settings and preferences.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="org-name">Organization Name</Label>
                  <Input id="org-name" defaultValue="Kroolo" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select defaultValue="utc">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="utc">UTC</SelectItem>
                      <SelectItem value="est">Eastern Time</SelectItem>
                      <SelectItem value="pst">Pacific Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Configure security policies and authentication settings.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">Require 2FA for all users</p>
                  </div>
                  <Switch />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Session Timeout</Label>
                    <p className="text-sm text-muted-foreground">Auto-logout after inactivity</p>
                  </div>
                  <Select defaultValue="30">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Role Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit User Role</DialogTitle>
              <DialogDescription>Update the permissions for {editingRole?.name}</DialogDescription>
            </DialogHeader>

            {editingRole && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="role-name">Role Name</Label>
                    <Input
                      id="role-name"
                      value={editingRole.name}
                      onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role-description">Description</Label>
                    <Input
                      id="role-description"
                      value={editingRole.description}
                      onChange={(e) => setEditingRole({ ...editingRole, description: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Permissions</h3>
                  <div className="grid gap-4">
                    {modules.map((module) => {
                      const IconComponent = module.icon
                      const currentPermission = editingRole.permissions?.[module.key] || "Can View"

                      return (
                        <div key={module.key} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <IconComponent />
                            <div>
                              <Label className="font-medium">{module.label}</Label>
                              <p className="text-sm text-muted-foreground">
                                Access to {module.label.toLowerCase()} module
                              </p>
                            </div>
                          </div>
                          <Select
                            value={currentPermission}
                            onValueChange={(value) => handlePermissionChange(module.key, value)}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {permissionLevels.map((level) => (
                                <SelectItem key={level} value={level}>
                                  {level}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveRole}>Save Changes</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Manage Users Dialog */}
        <Dialog open={isManageUsersDialogOpen} onOpenChange={setIsManageUsersDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Manage Users - {selectedRoleForUsers?.name}</DialogTitle>
              <DialogDescription>Assign or remove users from this role</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-medium">
                  Current Users ({getUsersForRole(selectedRoleForUsers?.name || "").length})
                </h4>
                <div className="space-y-2">
                  {getUsersForRole(selectedRoleForUsers?.name || "").map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {getUserInitials(`${user.first_name} ${user.last_name}`)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {user.first_name} {user.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-medium">Available Users</h4>
                <div className="space-y-2">
                  {getUsersNotInRole(selectedRoleForUsers?.name || "")
                    .slice(0, 10)
                    .map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {getUserInitials(`${user.first_name} ${user.last_name}`)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {user.first_name} {user.last_name}
                            </p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                            <Badge variant="outline" className="text-xs">
                              Current: {user.role?.name || "No Role"}
                            </Badge>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          Assign
                        </Button>
                      </div>
                    ))}
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setIsManageUsersDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PlatformLayout>
  )
}
