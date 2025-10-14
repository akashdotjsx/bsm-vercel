import { PlatformLayout } from "@/components/layout/platform-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Users, Key, Lock, AlertTriangle, CheckCircle, Plus, Settings } from "lucide-react"

export default function SecurityAccessPage() {
  console.log("[v0] Security & Access page loading")

  const roles = [
    { name: "System Administrator", users: 3, permissions: 45, level: "Full Access", color: "destructive" },
    { name: "Department Manager", users: 12, permissions: 28, level: "High Access", color: "default" },
    { name: "Team Lead", users: 24, permissions: 18, level: "Medium Access", color: "secondary" },
    { name: "Employee", users: 156, permissions: 8, level: "Basic Access", color: "outline" },
  ]

  const accessRequests = [
    { id: 1, user: "John Smith", role: "Team Lead", department: "IT", status: "pending", requestedAt: "2 hours ago" },
    {
      id: 2,
      user: "Sarah Johnson",
      role: "Department Manager",
      department: "HR",
      status: "approved",
      requestedAt: "1 day ago",
    },
    {
      id: 3,
      user: "Mike Wilson",
      role: "Employee",
      department: "Finance",
      status: "pending",
      requestedAt: "3 hours ago",
    },
    {
      id: 4,
      user: "Lisa Brown",
      role: "System Administrator",
      department: "IT",
      status: "rejected",
      requestedAt: "2 days ago",
    },
  ]

  const securityPolicies = [
    { name: "Password Policy", description: "Minimum 12 characters, special characters required", status: "active" },
    { name: "Session Timeout", description: "Auto-logout after 30 minutes of inactivity", status: "active" },
    { name: "Two-Factor Authentication", description: "Required for admin and manager roles", status: "active" },
    { name: "IP Restrictions", description: "Limit access to corporate network ranges", status: "inactive" },
  ]

  return (
    <PlatformLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[13px] font-semibold text-foreground dark:text-gray-100">Security & Access Control</h1>
            <p className="text-[10px] text-muted-foreground dark:text-muted-foreground mt-1">
              Manage user roles, permissions, and security policies
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="flex items-center gap-2 bg-transparent">
              <Settings className="h-4 w-4" />
              Security Settings
            </Button>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Role
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground dark:text-muted-foreground">Total Users</p>
                  <p className="text-[13px] font-semibold text-foreground dark:text-gray-100">195</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground dark:text-muted-foreground">Active Roles</p>
                  <p className="text-[13px] font-semibold text-foreground dark:text-gray-100">8</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground dark:text-muted-foreground">Pending Requests</p>
                  <p className="text-[13px] font-semibold text-foreground dark:text-gray-100">7</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <Lock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground dark:text-muted-foreground">Security Score</p>
                  <p className="text-[13px] font-semibold text-foreground dark:text-gray-100">87%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Roles & Permissions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Roles & Permissions
              </CardTitle>
              <CardDescription>Manage user roles and their associated permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {roles.map((role, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border border-border dark:border-gray-800 rounded-lg"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-foreground dark:text-gray-100">{role.name}</h4>
                        <Badge variant={role.color as any} className="text-[10px]">
                          {role.level}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground dark:text-muted-foreground">
                        {role.users} users • {role.permissions} permissions
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Access Requests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Access Requests
              </CardTitle>
              <CardDescription>Review and approve user access requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {accessRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-3 border border-border dark:border-gray-800 rounded-lg"
                  >
                    <div className="space-y-1">
                      <h4 className="font-medium text-[11px] text-foreground dark:text-gray-100">{request.user}</h4>
                      <p className="text-[10px] text-muted-foreground dark:text-muted-foreground">
                        {request.role} • {request.department} • {request.requestedAt}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          request.status === "approved"
                            ? "default"
                            : request.status === "rejected"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {request.status}
                      </Badge>
                      {request.status === "pending" && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline">
                            <CheckCircle className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <AlertTriangle className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Security Policies */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Policies
            </CardTitle>
            <CardDescription>Configure and manage security policies and compliance rules</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {securityPolicies.map((policy, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border border-border dark:border-gray-800 rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-foreground dark:text-gray-100">{policy.name}</h4>
                      <Badge variant={policy.status === "active" ? "default" : "secondary"}>{policy.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground dark:text-muted-foreground">{policy.description}</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </PlatformLayout>
  )
}
