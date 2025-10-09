"use client"

import { useState } from "react"
import { PageContent } from "@/components/layout/page-content"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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

export default function UsersTeamsPage() {
  const [activeTab, setActiveTab] = useState<"users" | "teams">("users")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [showAddTeamModal, setShowAddTeamModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)

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

  const departments = [
    "Information Technology",
    "Human Resources",
    "Finance",
    "Customer Support",
    "Marketing",
    "Sales",
    "Operations",
  ]

  const roles = [
    "System Administrator",
    "IT Administrator",
    "HR Manager",
    "Finance Analyst",
    "Service Agent",
    "Marketing Manager",
    "Sales Representative",
    "Operations Manager",
  ]

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

  return (
    <PageContent title="Users & Teams">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[13px] font-semibold text-foreground">Users & Teams</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage user accounts, permissions, and team organization</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-border">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("users")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "users"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
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
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
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
                <h2 className="text-[11px] font-medium text-foreground">Users</h2>
                <p className="text-sm text-muted-foreground">Manage user accounts and permissions</p>
              </div>
              <Dialog open={showAddUserModal} onOpenChange={setShowAddUserModal}>
                <DialogTrigger asChild>
                  <Button>
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
                            <SelectItem key={role} value={role}>
                              {role}
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
                            <SelectItem key={dept} value={dept}>
                              {dept}
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
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
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
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Users Table */}
            <div className="0 rounded-lg shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="0 divide-y divide-border">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-foreground">{user.name}</div>
                          <div className="text-sm text-muted-foreground flex items-center">
                            <Mail className="w-3 h-3 mr-1" />
                            {user.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{user.role}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{user.department}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge 
                          variant="outline"
                          className={user.status === "Active" 
                            ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400" 
                            : "border-border bg-muted text-muted-foreground"
                          }
                        >
                          {user.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{user.lastLogin}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
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
                            <DropdownMenuItem onClick={() => alert("Reset password functionality")}>
                              <Key className="w-4 h-4 mr-2" />
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => alert("Deactivate user functionality")}>
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
                <h2 className="text-[11px] font-medium text-foreground">Teams</h2>
                <p className="text-sm text-muted-foreground">Manage team organization and structure</p>
              </div>
              <Dialog open={showAddTeamModal} onOpenChange={setShowAddTeamModal}>
                <DialogTrigger asChild>
                  <Button>
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
                            <SelectItem key={dept} value={dept}>
                              {dept}
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
                <div key={team.id} className="0 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-[11px] font-medium text-foreground">{team.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{team.description}</p>
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
                        <DropdownMenuItem onClick={() => alert("Manage members functionality")}>
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
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="w-4 h-4 mr-2" />
                      {team.members} members
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Lead: {team.lead}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Building className="w-4 h-4 mr-2" />
                      {team.department}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4 mr-2" />
                      Created: {team.created}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageContent>
  )
}
