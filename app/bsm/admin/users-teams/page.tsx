"use client"

import { useState, useEffect } from "react"
import { PlatformLayout } from "@/components/layout/platform-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Plus,
  Search,
  MoreHorizontal,
  Users,
  UserPlus,
  Edit,
  Trash2,
  Key,
  UserX,
  Mail,
  Calendar,
  Building,
} from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"

interface User {
  id: string
  name: string
  email: string
  role: string
  department: string
  status: "Active" | "Inactive"
  lastLogin: string
  avatar?: string
}

interface Team {
  id: string
  name: string
  description: string
  members: number
  lead: string
  department: string
  created: string
}

interface Department {
  id: string
  name: string
  description: string
}

interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
  is_active: boolean
}

export default function UsersTeamsPage() {
  const [activeTab, setActiveTab] = useState<"users" | "teams">("users")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [showAddTeamModal, setShowAddTeamModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)

  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
  const [showManageMembersModal, setShowManageMembersModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [availableUsers, setAvailableUsers] = useState<string[]>([])
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])

  const [departments, setDepartments] = useState<Department[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)

  const [users, setUsers] = useState<User[]>([
    {
      id: "1",
      name: "John Smith",
      email: "john.smith@kroolo.com",
      role: "IT Administrator",
      department: "Information Technology",
      status: "Active",
      lastLogin: "2024-01-15",
    },
    {
      id: "2",
      name: "Sarah Johnson",
      email: "sarah.johnson@kroolo.com",
      role: "HR Manager",
      department: "Human Resources",
      status: "Active",
      lastLogin: "2024-01-14",
    },
    {
      id: "3",
      name: "Mike Chen",
      email: "mike.chen@kroolo.com",
      role: "Finance Analyst",
      department: "Finance",
      status: "Active",
      lastLogin: "2024-01-13",
    },
    {
      id: "4",
      name: "Emily Davis",
      email: "emily.davis@kroolo.com",
      role: "Service Agent",
      department: "Customer Support",
      status: "Inactive",
      lastLogin: "2024-01-10",
    },
  ])

  const [teams, setTeams] = useState<Team[]>([
    {
      id: "1",
      name: "IT Operations",
      description: "Manages infrastructure and system operations",
      members: 8,
      lead: "John Smith",
      department: "Information Technology",
      created: "2023-12-01",
    },
    {
      id: "2",
      name: "Customer Success",
      description: "Handles customer support and success initiatives",
      members: 12,
      lead: "Emily Davis",
      department: "Customer Support",
      created: "2023-11-15",
    },
    {
      id: "3",
      name: "Finance Team",
      description: "Financial planning and analysis",
      members: 5,
      lead: "Mike Chen",
      department: "Finance",
      created: "2023-10-20",
    },
  ])

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "",
    department: "",
    phone: "",
    status: "Active",
  })

  const [newTeam, setNewTeam] = useState({
    name: "",
    description: "",
    department: "",
    lead: "",
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("[v0] Fetching departments and roles from database")

        // Fetch departments
        const { data: departmentsData, error: deptError } = await supabase.from("departments").select("*").order("name")

        if (deptError) {
          console.error("[v0] Error fetching departments:", deptError)
        } else {
          console.log("[v0] Departments fetched:", departmentsData)
          setDepartments(departmentsData || [])
        }

        // Fetch roles
        const { data: rolesData, error: rolesError } = await supabase
          .from("roles")
          .select("*")
          .eq("is_active", true)
          .order("name")

        if (rolesError) {
          console.error("[v0] Error fetching roles:", rolesError)
        } else {
          console.log("[v0] Roles fetched:", rolesData)
          setRoles(rolesData || [])
        }
      } catch (error) {
        console.error("[v0] Error in fetchData:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleResetPassword = (user: User) => {
    setSelectedUser(user)
    setNewPassword("")
    setConfirmPassword("")
    setShowResetPasswordModal(true)
  }

  const handleSaveNewPassword = () => {
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match!")
      return
    }
    if (newPassword.length < 8) {
      alert("Password must be at least 8 characters long!")
      return
    }

    // In a real app, this would make an API call to reset the password
    alert(`Password reset successfully for ${selectedUser?.name}. New password has been sent via email.`)
    setShowResetPasswordModal(false)
    setSelectedUser(null)
    setNewPassword("")
    setConfirmPassword("")
  }

  const handleToggleUserStatus = (user: User) => {
    const newStatus = user.status === "Active" ? "Inactive" : "Active"
    const action = newStatus === "Active" ? "activate" : "deactivate"

    if (confirm(`Are you sure you want to ${action} ${user.name}?`)) {
      setUsers(users.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u)))
      alert(`${user.name} has been ${action}d successfully.`)
    }
  }

  const handleManageMembers = (team: Team) => {
    setSelectedTeam(team)
    setAvailableUsers(users.filter((u) => u.status === "Active").map((u) => u.name))
    setSelectedMembers([]) // In a real app, this would load existing team members
    setShowManageMembersModal(true)
  }

  const handleToggleMember = (userName: string) => {
    setSelectedMembers((prev) =>
      prev.includes(userName) ? prev.filter((name) => name !== userName) : [...prev, userName],
    )
  }

  const handleSaveTeamMembers = () => {
    if (selectedTeam) {
      setTeams(teams.map((team) => (team.id === selectedTeam.id ? { ...team, members: selectedMembers.length } : team)))
      alert(`Team members updated successfully for ${selectedTeam.name}. ${selectedMembers.length} members assigned.`)
    }
    setShowManageMembersModal(false)
    setSelectedTeam(null)
    setSelectedMembers([])
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || user.status === statusFilter
    const matchesDepartment = departmentFilter === "all" || user.department === departmentFilter

    return matchesSearch && matchesStatus && matchesDepartment
  })

  const handleAddUser = () => {
    const user: User = {
      id: Date.now().toString(),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      department: newUser.department,
      status: newUser.status as "Active" | "Inactive",
      lastLogin: new Date().toISOString().split("T")[0],
    }
    setUsers([...users, user])
    setNewUser({ name: "", email: "", role: "", department: "", phone: "", status: "Active" })
    setShowAddUserModal(false)
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setNewUser({
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      phone: "",
      status: user.status,
    })
  }

  const handleUpdateUser = () => {
    if (editingUser) {
      setUsers(
        users.map((user) =>
          user.id === editingUser.id
            ? {
                ...user,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                department: newUser.department,
                status: newUser.status as "Active" | "Inactive",
              }
            : user,
        ),
      )
      setEditingUser(null)
      setNewUser({ name: "", email: "", role: "", department: "", phone: "", status: "Active" })
    }
  }

  const handleDeleteUser = (userId: string) => {
    setUsers(users.filter((user) => user.id !== userId))
  }

  const handleAddTeam = () => {
    const team: Team = {
      id: Date.now().toString(),
      name: newTeam.name,
      description: newTeam.description,
      department: newTeam.department,
      lead: newTeam.lead,
      members: 0,
      created: new Date().toISOString().split("T")[0],
    }
    setTeams([...teams, team])
    setNewTeam({ name: "", description: "", department: "", lead: "" })
    setShowAddTeamModal(false)
  }

  const handleEditTeam = (team: Team) => {
    setEditingTeam(team)
    setNewTeam({
      name: team.name,
      description: team.description,
      department: team.department,
      lead: team.lead,
    })
  }

  const handleUpdateTeam = () => {
    if (editingTeam) {
      setTeams(
        teams.map((team) =>
          team.id === editingTeam.id
            ? {
                ...team,
                name: newTeam.name,
                description: newTeam.description,
                department: newTeam.department,
                lead: newTeam.lead,
              }
            : team,
        ),
      )
      setEditingTeam(null)
      setNewTeam({ name: "", description: "", department: "", lead: "" })
    }
  }

  const handleDeleteTeam = (teamId: string) => {
    setTeams(teams.filter((team) => team.id !== teamId))
  }

  if (loading) {
    return (
      <PlatformLayout title="Users & Teams">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading departments and roles...</p>
          </div>
        </div>
      </PlatformLayout>
    )
  }

  return (
    <PlatformLayout title="Users & Teams">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Users & Teams</h1>
            <p className="text-sm text-gray-600 mt-1">Manage user accounts, permissions, and team organization</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-100">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("users")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "users"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Users className="w-4 h-4 inline-block mr-2" />
              Users
            </button>
            <button
              onClick={() => setActiveTab("teams")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "teams"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Building className="w-4 h-4 inline-block mr-2" />
              Teams
            </button>
          </nav>
        </div>

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="space-y-4">
            {/* Users Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Users</h2>
                <p className="text-sm text-gray-600">Manage user accounts and permissions</p>
              </div>
              <Dialog open={showAddUserModal} onOpenChange={setShowAddUserModal}>
                <DialogTrigger asChild>
                  <Button className="bg-black text-white hover:bg-gray-800">
                    <Plus className="w-4 h-4 mr-2" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{editingUser ? "Edit User" : "Add New User"}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={newUser.name}
                        onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                        placeholder="Enter full name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        placeholder="Enter email address"
                      />
                    </div>
                    <div>
                      <Label htmlFor="role">Role</Label>
                      <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.id} value={role.name}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="department">Department</Label>
                      <Select
                        value={newUser.department}
                        onValueChange={(value) => setNewUser({ ...newUser, department: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.name}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={newUser.phone}
                        onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={newUser.status}
                        onValueChange={(value) => setNewUser({ ...newUser, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowAddUserModal(false)
                          setEditingUser(null)
                          setNewUser({ name: "", email: "", role: "", department: "", phone: "", status: "Active" })
                        }}
                      >
                        Cancel
                      </Button>
                      <Button onClick={editingUser ? handleUpdateUser : handleAddUser}>
                        {editingUser ? "Update User" : "Add User"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Search and Filters */}
            <div className="flex items-center space-x-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.name}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <Mail className="w-3 h-3 mr-1" />
                            {user.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.role}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.department}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={user.status === "Active" ? "default" : "secondary"}>{user.status}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.lastLogin}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditUser(user)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleResetPassword(user)}>
                              <Key className="w-4 h-4 mr-2" />
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleUserStatus(user)}>
                              <UserX className="w-4 h-4 mr-2" />
                              {user.status === "Active" ? "Deactivate" : "Activate"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteUser(user.id)} className="text-red-600">
                              <Trash2 className="w-4 h-4 mr-2" />
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
          </div>
        )}

        {/* Teams Tab */}
        {activeTab === "teams" && (
          <div className="space-y-4">
            {/* Teams Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Teams</h2>
                <p className="text-sm text-gray-600">Manage team organization and structure</p>
              </div>
              <Dialog open={showAddTeamModal} onOpenChange={setShowAddTeamModal}>
                <DialogTrigger asChild>
                  <Button className="bg-black text-white hover:bg-gray-800">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Team
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{editingTeam ? "Edit Team" : "Add New Team"}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="teamName">Team Name</Label>
                      <Input
                        id="teamName"
                        value={newTeam.name}
                        onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                        placeholder="Enter team name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="teamDescription">Description</Label>
                      <Textarea
                        id="teamDescription"
                        value={newTeam.description}
                        onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                        placeholder="Enter team description"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="teamDepartment">Department</Label>
                      <Select
                        value={newTeam.department}
                        onValueChange={(value) => setNewTeam({ ...newTeam, department: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.name}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="teamLead">Team Lead</Label>
                      <Select value={newTeam.lead} onValueChange={(value) => setNewTeam({ ...newTeam, lead: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select team lead" />
                        </SelectTrigger>
                        <SelectContent>
                          {users
                            .filter((user) => user.status === "Active")
                            .map((user) => (
                              <SelectItem key={user.id} value={user.name}>
                                {user.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowAddTeamModal(false)
                          setEditingTeam(null)
                          setNewTeam({ name: "", description: "", department: "", lead: "" })
                        }}
                      >
                        Cancel
                      </Button>
                      <Button onClick={editingTeam ? handleUpdateTeam : handleAddTeam}>
                        {editingTeam ? "Update Team" : "Add Team"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Teams Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.map((team) => (
                <div key={team.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{team.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{team.description}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditTeam(team)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Team
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleManageMembers(team)}>
                          <Users className="w-4 h-4 mr-2" />
                          Manage Members
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteTeam(team.id)} className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Team
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="w-4 h-4 mr-2" />
                      {team.members} members
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Lead: {team.lead}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Building className="w-4 h-4 mr-2" />
                      {team.department}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      Created: {team.created}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reset Password Modal */}
        <Dialog open={showResetPasswordModal} onOpenChange={setShowResetPasswordModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Reset Password - {selectedUser?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>
              <div className="text-sm text-gray-600">
                Password must be at least 8 characters long and contain a mix of letters, numbers, and symbols.
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setShowResetPasswordModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveNewPassword}>Reset Password</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Manage Team Members Modal */}
        <Dialog open={showManageMembersModal} onOpenChange={setShowManageMembersModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Manage Members - {selectedTeam?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Select Team Members</Label>
                <div className="max-h-60 overflow-y-auto space-y-2 mt-2">
                  {availableUsers.map((userName) => (
                    <div key={userName} className="flex items-center space-x-2">
                      <Checkbox
                        id={userName}
                        checked={selectedMembers.includes(userName)}
                        onCheckedChange={() => handleToggleMember(userName)}
                      />
                      <Label htmlFor={userName} className="text-sm">
                        {userName}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-sm text-gray-600">Selected: {selectedMembers.length} members</div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setShowManageMembersModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveTeamMembers}>Save Members</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PlatformLayout>
  )
}
