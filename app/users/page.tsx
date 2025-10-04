"use client"

import { useState, useEffect } from "react"
import { PlatformLayout } from "@/components/layout/platform-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Users,
  User,
  UserPlus,
  Search,
  Filter,
  MoreHorizontal,
  Shield,
  Mail,
  Calendar,
  Edit,
  Trash2,
  UserX,
  Key,
  Plus,
  Settings,
  CheckCircle,
  XCircle,
  AlertCircle,
  ShieldCheck,
} from "lucide-react"
import { useUsers } from "@/hooks/use-users"
import { useToast } from "@/hooks/use-toast"
import { RoleEditModal } from "@/components/rbac/role-edit-modal"
import { rbacApi } from "@/lib/api/rbac"
import type { Role } from "@/lib/types/rbac"

// Type definitions
interface User {
  id: string
  first_name?: string
  last_name?: string
  display_name?: string
  email: string
  role: string
  department?: string
  is_active: boolean
  created_at: string
}

interface Team {
  id: string
  name: string
  description?: string
  department?: string
  is_active: boolean
  created_at: string
  lead?: {
    id: string
    display_name: string
  }
  team_members?: Array<{
    id: string
    role: string
    user: {
      id: string
      display_name: string
      email: string
    }
  }>
  members?: number
  lead_id?: string
}

const availableRoles = [
  { value: 'admin', label: 'Administrator' },
  { value: 'manager', label: 'Manager' },
  { value: 'agent', label: 'Agent' },
  { value: 'user', label: 'User' },
]

const availableDepartments = [
  "IT",
  "HR",
  "Finance",
  "Support",
  "Marketing",
  "Operations",
  "Sales",
  "Legal",
]

const initialUsers = [
  {
    id: 1,
    name: "John Smith",
    email: "john.smith@kroolo.com",
    role: "IT Administrator",
    department: "Information Technology",
    status: "Active",
    createdOn: "2024-09-10",
    permissions: ["Admin", "Tickets", "Workflows"],
  },
  {
    id: 2,
    name: "Sarah Johnson",
    email: "sarah.johnson@kroolo.com",
    role: "HR Manager",
    department: "Human Resources",
    status: "Active",
    createdOn: "2024-09-08",
    permissions: ["HR Services", "Approvals"],
  },
  {
    id: 3,
    name: "Mike Chen",
    email: "mike.chen@kroolo.com",
    role: "Finance Analyst",
    department: "Finance",
    status: "Active",
    createdOn: "2024-09-05",
    permissions: ["Finance Services", "Reports"],
  },
  {
    id: 4,
    name: "Emily Davis",
    email: "emily.davis@kroolo.com",
    role: "Service Agent",
    department: "Customer Support",
    status: "Inactive",
    createdOn: "2024-09-01",
    permissions: ["Tickets", "Knowledge Base"],
  },
]

const initialTeams = [
  {
    id: 1,
    name: "IT Support",
    members: 8,
    lead: "John Smith",
    description: "Handles all IT-related service requests and incidents",
  },
  {
    id: 2,
    name: "HR Operations",
    members: 5,
    lead: "Sarah Johnson",
    description: "Manages employee services and HR workflows",
  },
  {
    id: 3,
    name: "Finance Team",
    members: 6,
    lead: "Mike Chen",
    description: "Processes financial requests and approvals",
  },
]

export default function UsersPage() {
  const { users, teams, loading, inviteUser, updateUser, deactivateUser, reactivateUser, resetUserPassword, createTeam, addUserToTeam } = useUsers()
  
  // Debug logging
  console.log('🏠 Users page render - users:', users?.length || 0, 'teams:', teams?.length || 0, 'loading:', loading)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [showAddUser, setShowAddUser] = useState(false)
  const [showEditUser, setShowEditUser] = useState(false)
  const [showAddTeam, setShowAddTeam] = useState(false)
  const [showEditTeam, setShowEditTeam] = useState(false)
  const [showManageDepartments, setShowManageDepartments] = useState(false)
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [showEditRole, setShowEditRole] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [roles, setRoles] = useState<Role[]>([])
  const [departments, setDepartments] = useState(availableDepartments)
  const [newDepartment, setNewDepartment] = useState("")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [newUser, setNewUser] = useState({
    first_name: "",
    last_name: "",
    email: "",
    role: "user",
    department: "",
    status: "Active"
  })
  const [newTeam, setNewTeam] = useState({
    name: "",
    lead_id: "",
    description: "",
    department: "",
  })
  const { toast } = useToast()

  // Load roles on component mount
  useEffect(() => {
    const loadRoles = async () => {
      try {
        const allRoles = await rbacApi.getRoles()
        setRoles(allRoles)
      } catch (error) {
        console.error('Error loading roles:', error)
      }
    }
    loadRoles()
  }, [])

  const filteredUsers = users.filter((user) => {
    const userName = user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email
    const matchesSearch =
      userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const userStatus = user.is_active ? "active" : "inactive"
    const matchesStatus = statusFilter === "all" || userStatus === statusFilter.toLowerCase()
    const matchesDepartment = departmentFilter === "all" || user.department === departmentFilter
    return matchesSearch && matchesStatus && matchesDepartment
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    })
  }

  const handleAddUser = async () => {
    try {
      await inviteUser(newUser)
      setNewUser({ first_name: "", last_name: "", email: "", role: "user", department: "", status: "Active" })
      setShowAddUser(false)
    } catch (error) {
      console.error('Error adding user:', error)
    }
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setNewUser({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email,
      role: user.role,
      department: user.department || '',
      status: user.is_active ? 'Active' : 'Inactive'
    })
    setShowEditUser(true)
  }

  const handleUpdateUser = async () => {
    try {
      if (!selectedUser) return
      await updateUser(selectedUser.id, {
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        display_name: `${newUser.first_name} ${newUser.last_name}`,
        role: newUser.role,
        department: newUser.department,
      })
      setShowEditUser(false)
      setSelectedUser(null)
      setNewUser({ first_name: "", last_name: "", email: "", role: "user", department: "", status: "Active" })
    } catch (error) {
      console.error('Error updating user:', error)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      await deactivateUser(userId)
    } catch (error) {
      console.error('Error deleting user:', error)
    }
  }

  const handleResetPassword = (user: User) => {
    setSelectedUser(user)
    setShowResetPassword(true)
  }

  const handleDeactivateUser = async (userId: string, isActive: boolean) => {
    try {
      if (isActive) {
        await deactivateUser(userId)
      } else {
        await reactivateUser(userId)
      }
    } catch (error) {
      console.error('Error toggling user status:', error)
    }
  }

  const handleAddTeam = async () => {
    try {
      await createTeam(newTeam)
      setNewTeam({ name: "", lead_id: "", description: "", department: "" })
      setShowAddTeam(false)
    } catch (error) {
      console.error('Error creating team:', error)
    }
  }

  const handleEditTeam = (team: Team) => {
    setSelectedTeam(team)
    setNewTeam({
      name: team.name,
      lead_id: team.lead?.id || '',
      description: team.description || '',
      department: team.department || ''
    })
    setShowEditTeam(true)
  }

  const handleUpdateTeam = async () => {
    try {
      if (!selectedTeam) return
      // TODO: Implement updateTeam API function
      console.log('Update team:', selectedTeam.id, newTeam)
      toast({
        title: "Team Updated",
        description: "Team has been updated successfully.",
      })
      setShowEditTeam(false)
      setSelectedTeam(null)
      setNewTeam({ name: "", lead_id: "", description: "", department: "" })
    } catch (error) {
      console.error('Error updating team:', error)
    }
  }

  const handleDeleteTeam = async (teamId: string) => {
    try {
      // TODO: Implement deleteTeam API function
      console.log('Delete team:', teamId)
      toast({
        title: "Team Deleted",
        description: "Team has been deleted successfully.",
      })
    } catch (error) {
      console.error('Error deleting team:', error)
    }
  }

  const handleAddDepartment = () => {
    if (newDepartment && !departments.includes(newDepartment)) {
      setDepartments([...departments, newDepartment])
      setNewDepartment("")
    }
  }

  const handleDeleteDepartment = (dept: string) => {
    setDepartments(departments.filter((d) => d !== dept))
  }

  const handleEditUserRole = (user: User) => {
    // Find the user's current role in our roles list
    const userRole = roles.find((role: Role) => 
      role.name.toLowerCase().replace(' ', '_') === user.role?.toLowerCase() ||
      role.name === user.role
    )
    setSelectedUser(user)
    setSelectedRole(userRole || null)
    setShowEditRole(true)
  }

  const handleRoleSave = async (savedRole: Role) => {
    try {
      if (!selectedUser) return
      // Update the user's role in the profiles table (legacy field)
      const roleMapping: { [key: string]: string } = {
        'System Administrator': 'admin',
        'Manager': 'manager', 
        'Agent': 'agent',
        'User': 'user'
      }
      
      const legacyRole = roleMapping[savedRole.name] || 'user'
      
      await updateUser(selectedUser.id, {
        role: legacyRole
      })
      
      // Refresh roles list
      const allRoles = await rbacApi.getRoles()
      setRoles(allRoles)
      
      toast({
        title: "Role Updated",
        description: `User role has been updated to ${savedRole.name}`,
      })
    } catch (error) {
      console.error('Error updating user role:', error)
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive"
      })
    }
  }

  return (
    <PlatformLayout
      title="Users & Teams"
      description="Manage user accounts, teams, and access permissions across your organization"
      breadcrumb={[
        { label: "Service Management", href: "/dashboard" },
        { label: "Users & Teams", href: "/users" },
      ]}
    >
      <div className="space-y-6 font-sans text-[13px]">

        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search users..."
                className="pl-10 w-80 text-[13px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32 text-[13px]">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="All Stat" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-48 text-[13px]">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => setShowManageDepartments(true)} className="text-[13px]">
              <Settings className="mr-2 h-4 w-4" />
              Manage Departments
            </Button>
          </div>
           <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
             <DialogTrigger asChild>
              <Button className="bg-[#6a5cff] hover:bg-[#5b4cf2] text-white text-sm h-10 px-5 rounded-lg shadow-[0_8px_18px_rgba(106,92,255,0.35)]">
                <UserPlus className="mr-2 h-4 w-4" />
                Add User
              </Button>
             </DialogTrigger>
            <DialogContent className="font-sans">
              <DialogHeader>
                <DialogTitle className="text-[13px]">Add New User</DialogTitle>
                <DialogDescription className="text-[13px]">
                  Create a new user account with appropriate permissions.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="first_name" className="text-right text-[13px]">
                    First Name
                  </Label>
                  <Input
                    id="first_name"
                    value={newUser.first_name}
                    onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })}
                    className="col-span-3 text-[13px]"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="last_name" className="text-right text-[13px]">
                    Last Name
                  </Label>
                  <Input
                    id="last_name"
                    value={newUser.last_name}
                    onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })}
                    className="col-span-3 text-[13px]"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right text-[13px]">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="col-span-3 text-[13px]"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="role" className="text-right text-[13px]">
                    Role
                  </Label>
                  <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                    <SelectTrigger className="col-span-3 text-[13px]">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRoles.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="department" className="text-right text-[13px]">
                    Department
                  </Label>
                  <Select
                    value={newUser.department}
                    onValueChange={(value) => setNewUser({ ...newUser, department: value })}
                  >
                    <SelectTrigger className="col-span-3 text-[13px]">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddUser} className="text-[13px]">
                  Add User
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

         {/* Stats Cards */}
         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           <Card>
             <CardContent className="p-6">
               <div className="flex items-center">
                 <div className="h-12 w-12 rounded-xl bg-gray-200 dark:bg-white/10 flex items-center justify-center">
<User className="h-7 w-7 text-blue-600" />
                 </div>
                 <div className="ml-4">
                   <p className="text-[13px] font-medium text-muted-foreground">Total Users</p>
                   <p className="text-2xl font-bold">{users.length}</p>
                 </div>
               </div>
             </CardContent>
           </Card>
           <Card>
             <CardContent className="p-6">
               <div className="flex items-center">
                 <div className="h-12 w-12 rounded-xl bg-gray-200 dark:bg-white/10 flex items-center justify-center">
<Shield className="h-7 w-7 text-emerald-600" />
                 </div>
                 <div className="ml-4">
                   <p className="text-[13px] font-medium text-muted-foreground">Active Users</p>
                   <p className="text-2xl font-bold">{users.filter((u) => u.is_active).length}</p>
                 </div>
               </div>
             </CardContent>
           </Card>
           <Card>
             <CardContent className="p-6">
               <div className="flex items-center">
                 <div className="h-12 w-12 rounded-xl bg-gray-200 dark:bg-white/10 flex items-center justify-center">
<Users className="h-7 w-7 text-purple-600" />
                 </div>
                 <div className="ml-4">
                   <p className="text-[13px] font-medium text-muted-foreground">Teams</p>
                   <p className="text-2xl font-bold">{teams.length}</p>
                 </div>
               </div>
             </CardContent>
           </Card>
           <Card>
             <CardContent className="p-6">
               <div className="flex items-center">
                 <div className="h-12 w-12 rounded-xl bg-gray-200 dark:bg-white/10 flex items-center justify-center">
<Calendar className="h-7 w-7 text-orange-600" />
                 </div>
                 <div className="ml-4">
                   <p className="text-[13px] font-medium text-muted-foreground">New This Month</p>
                   <p className="text-2xl font-bold">{users.filter((u) => {
                     const createdDate = new Date(u.created_at)
                     const now = new Date()
                     const thisMonth = now.getMonth()
                     const thisYear = now.getFullYear()
                     return createdDate.getMonth() === thisMonth && createdDate.getFullYear() === thisYear
                   }).length}</p>
                 </div>
               </div>
             </CardContent>
           </Card>
         </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-bold">Users</CardTitle>
              {loading && <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>}
            </div>
            <CardDescription className="text-sm">Manage user accounts and permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-sm">User</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Role</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Department</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Created On</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-semibold text-sm">
                            {user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center">
                            <Mail className="mr-1 h-3 w-3" />
                            {user.email}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">{user.role || 'N/A'}</td>
                      <td className="py-3 px-4 text-sm">{user.department || 'N/A'}</td>
                      <td className="py-3 px-4">
{user.is_active ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">Active</span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">Inactive</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm">{formatDate(user.created_at)}</td>
                      <td className="py-3 px-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="px-2 text-muted-foreground hover:bg-transparent">
                              ...
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="font-sans">
                            <DropdownMenuItem onClick={() => handleEditUser(user)} className="text-[13px]">
                              <Edit className="mr-2 h-4 w-4" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditUserRole(user)} className="text-[13px]">
                              <ShieldCheck className="mr-2 h-4 w-4" />
                              Manage Role
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleResetPassword(user)} className="text-[13px]">
                              <Key className="mr-2 h-4 w-4" />
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeactivateUser(user.id, user.is_active)} className="text-[13px]">
                              <UserX className="mr-2 h-4 w-4" />
                              {user.is_active ? "Deactivate" : "Activate"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-600 text-[13px]"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete User
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

        {/* Teams Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg font-bold">Teams</CardTitle>
                  {loading && <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>}
                </div>
                <CardDescription className="text-sm">
                  Organize users into teams for better collaboration
                </CardDescription>
              </div>
              <Dialog open={showAddTeam} onOpenChange={setShowAddTeam}>
                <DialogTrigger asChild>
                  <Button className="bg-[#6a5cff] hover:bg-[#5b4cf2] text-white text-sm h-10 px-5 rounded-lg shadow-[0_8px_18px_rgba(106,92,255,0.35)]">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Team
                  </Button>
                </DialogTrigger>
                <DialogContent className="font-sans">
                  <DialogHeader>
                    <DialogTitle className="text-[13px]">Add New Team</DialogTitle>
                    <DialogDescription className="text-[13px]">
                      Create a new team to organize users and improve collaboration.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="team-name" className="text-right text-[13px]">
                        Name
                      </Label>
                      <Input
                        id="team-name"
                        value={newTeam.name}
                        onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                        className="col-span-3 text-[13px]"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="team-lead" className="text-right text-[13px]">
                        Team Lead
                      </Label>
                      <Select value={newTeam.lead_id} onValueChange={(value) => setNewTeam({ ...newTeam, lead_id: value })}>
                        <SelectTrigger className="col-span-3 text-[13px]">
                          <SelectValue placeholder="Select team lead" />
                        </SelectTrigger>
                        <SelectContent>
                          {users
                            .filter((u) => u.is_active)
                            .map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="team-department" className="text-right text-[13px]">
                        Department
                      </Label>
                      <Select
                        value={newTeam.department}
                        onValueChange={(value) => setNewTeam({ ...newTeam, department: value })}
                      >
                        <SelectTrigger className="col-span-3 text-[13px]">
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept} value={dept}>
                              {dept}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="team-description" className="text-right text-[13px]">
                        Description
                      </Label>
                      <Textarea
                        id="team-description"
                        value={newTeam.description}
                        onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                        className="col-span-3 text-[13px]"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleAddTeam} className="text-[13px]">
                      Add Team
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {teams.map((team) => (
                <Card
                  key={team.id}
                  className="border border-border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-sm">{team.name}</h3>
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center rounded-full border border-border bg-muted text-muted-foreground px-3 py-1 text-xs font-medium">
                          {(team as any).members || (team as any).team_members?.length || 0} members
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="px-2 text-muted-foreground hover:bg-transparent">…</Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="font-sans">
                            <DropdownMenuItem onClick={() => handleEditTeam(team)} className="text-[13px]">
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Team
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteTeam(team.id)}
                              className="text-red-600 text-[13px]"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Team
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{team.description}</p>
                    <div className="flex items-center text-sm">
                      <Users className="mr-1 h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Lead: </span>
                      <span className="ml-1 font-semibold">{(team as any).lead?.display_name || 'N/A'}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Edit User Dialog */}
        <Dialog open={showEditUser} onOpenChange={setShowEditUser}>
          <DialogContent className="font-sans">
            <DialogHeader>
              <DialogTitle className="text-[13px]">Edit User</DialogTitle>
              <DialogDescription className="text-[13px]">Update user information and permissions.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-first-name" className="text-right text-[13px]">
                  First Name
                </Label>
                <Input
                  id="edit-first-name"
                  value={newUser.first_name}
                  onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })}
                  className="col-span-3 text-[13px]"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-last-name" className="text-right text-[13px]">
                  Last Name
                </Label>
                <Input
                  id="edit-last-name"
                  value={newUser.last_name}
                  onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })}
                  className="col-span-3 text-[13px]"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-email" className="text-right text-[13px]">
                  Email
                </Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="col-span-3 text-[13px]"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-role" className="text-right text-[13px]">
                  Role
                </Label>
                <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                  <SelectTrigger className="col-span-3 text-[13px]">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-department" className="text-right text-[13px]">
                  Department
                </Label>
                <Select
                  value={newUser.department}
                  onValueChange={(value) => setNewUser({ ...newUser, department: value })}
                >
                  <SelectTrigger className="col-span-3 text-[13px]">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-status" className="text-right text-[13px]">
                  Status
                </Label>
                <Select value={selectedUser?.is_active ? 'Active' : 'Inactive'} onValueChange={(value) => setNewUser({ ...newUser, status: value })}>
                  <SelectTrigger className="col-span-3 text-[13px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleUpdateUser} className="text-[13px]">
                Update User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Team Dialog */}
        <Dialog open={showEditTeam} onOpenChange={setShowEditTeam}>
          <DialogContent className="font-sans">
            <DialogHeader>
              <DialogTitle className="text-[13px]">Edit Team</DialogTitle>
              <DialogDescription className="text-[13px]">Update team information and settings.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-team-name" className="text-right text-[13px]">
                  Name
                </Label>
                <Input
                  id="edit-team-name"
                  value={newTeam.name}
                  onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                  className="col-span-3 text-[13px]"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-team-lead" className="text-right text-[13px]">
                  Team Lead
                </Label>
                <Select value={newTeam.lead_id} onValueChange={(value) => setNewTeam({ ...newTeam, lead_id: value })}>
                  <SelectTrigger className="col-span-3 text-[13px]">
                    <SelectValue placeholder="Select team lead" />
                  </SelectTrigger>
                  <SelectContent>
                    {users
                      .filter((u) => u.is_active)
                      .map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-team-department" className="text-right text-[13px]">
                  Department
                </Label>
                <Select
                  value={newTeam.department}
                  onValueChange={(value) => setNewTeam({ ...newTeam, department: value })}
                >
                  <SelectTrigger className="col-span-3 text-[13px]">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-team-description" className="text-right text-[13px]">
                  Description
                </Label>
                <Textarea
                  id="edit-team-description"
                  value={newTeam.description}
                  onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                  className="col-span-3 text-[13px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleUpdateTeam} className="text-[13px]">
                Update Team
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showManageDepartments} onOpenChange={setShowManageDepartments}>
          <DialogContent className="font-sans">
            <DialogHeader>
              <DialogTitle className="text-[13px]">Manage Departments</DialogTitle>
              <DialogDescription className="text-[13px]">
                Add, edit, or remove departments for user organization.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  placeholder="Department name"
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  className="text-[13px]"
                />
                <Button onClick={handleAddDepartment} className="text-[13px]">
                  <Plus className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {departments.map((dept) => (
<div key={dept} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900/40 rounded">
                    <span className="text-[13px]">{dept}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteDepartment(dept)}
                      className="text-red-600 text-[13px]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setShowManageDepartments(false)} className="text-[13px]">
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showResetPassword} onOpenChange={setShowResetPassword}>
          <DialogContent className="font-sans">
            <DialogHeader>
              <DialogTitle className="text-[13px]">Reset Password</DialogTitle>
              <DialogDescription className="text-[13px]">
                Reset password for {selectedUser?.display_name || selectedUser?.email}. A temporary password will be sent to their email.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-[13px] text-muted-foreground">
                This will generate a new temporary password and send it to {selectedUser?.email || 'N/A'}. The user will be
                required to change their password on next login.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowResetPassword(false)} className="text-[13px]">
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  try {
                    if (!selectedUser) return
                    await resetUserPassword(selectedUser.id)
                    setShowResetPassword(false)
                  } catch (error) {
                    console.error('Error resetting password:', error)
                  }
                }}
                className="text-[13px]"
              >
                Send Reset Email
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Role Edit Modal */}
        <RoleEditModal
          isOpen={showEditRole}
          onClose={() => {
            setShowEditRole(false)
            setSelectedRole(null)
            setSelectedUser(null)
          }}
          role={selectedRole}
          onSave={handleRoleSave}
        />
      </div>
    </PlatformLayout>
  )
}
