"use client"

import { useState } from "react"
import { PlatformLayout } from "@/components/layout/platform-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Users,
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
} from "lucide-react"

const availableRoles = [
  "IT Administrator",
  "HR Manager",
  "Finance Analyst",
  "Service Agent",
  "Project Manager",
  "Developer",
  "Support Specialist",
  "Team Lead",
]

const availableDepartments = [
  "Information Technology",
  "Human Resources",
  "Finance",
  "Customer Support",
  "Marketing",
  "Operations",
  "Sales",
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
  const [users, setUsers] = useState(initialUsers)
  const [teams, setTeams] = useState(initialTeams)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [showAddUser, setShowAddUser] = useState(false)
  const [showEditUser, setShowEditUser] = useState(false)
  const [showAddTeam, setShowAddTeam] = useState(false)
  const [showEditTeam, setShowEditTeam] = useState(false)
  const [showManageDepartments, setShowManageDepartments] = useState(false)
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [departments, setDepartments] = useState(availableDepartments)
  const [newDepartment, setNewDepartment] = useState("")
  const [selectedUser, setSelectedUser] = useState(null)
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "",
    department: "",
    status: "Active",
  })
  const [newTeam, setNewTeam] = useState({
    name: "",
    lead: "",
    description: "",
  })

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || user.status.toLowerCase() === statusFilter.toLowerCase()
    const matchesDepartment = departmentFilter === "all" || user.department === departmentFilter
    return matchesSearch && matchesStatus && matchesDepartment
  })

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    })
  }

  const handleAddUser = () => {
    const user = {
      id: users.length + 1,
      ...newUser,
      createdOn: new Date().toISOString().split("T")[0],
      permissions: [],
    }
    setUsers([...users, user])
    setNewUser({ name: "", email: "", role: "", department: "", status: "Active" })
    setShowAddUser(false)
  }

  const handleEditUser = (user) => {
    setSelectedUser(user)
    setNewUser(user)
    setShowEditUser(true)
  }

  const handleUpdateUser = () => {
    setUsers(users.map((user) => (user.id === selectedUser.id ? { ...user, ...newUser } : user)))
    setShowEditUser(false)
    setSelectedUser(null)
    setNewUser({ name: "", email: "", role: "", department: "", status: "Active" })
  }

  const handleDeleteUser = (userId) => {
    setUsers(users.filter((user) => user.id !== userId))
  }

  const handleResetPassword = (user) => {
    setSelectedUser(user)
    setShowResetPassword(true)
  }

  const handleDeactivateUser = (userId) => {
    setUsers(
      users.map((user) =>
        user.id === userId ? { ...user, status: user.status === "Active" ? "Inactive" : "Active" } : user,
      ),
    )
  }

  const handleAddTeam = () => {
    const team = {
      id: teams.length + 1,
      ...newTeam,
    }
    setTeams([...teams, team])
    setNewTeam({ name: "", lead: "", description: "" })
    setShowAddTeam(false)
  }

  const handleEditTeam = (team) => {
    setSelectedTeam(team)
    setNewTeam(team)
    setShowEditTeam(true)
  }

  const handleUpdateTeam = () => {
    setTeams(teams.map((team) => (team.id === selectedTeam.id ? { ...team, ...newTeam } : team)))
    setShowEditTeam(false)
    setSelectedTeam(null)
    setNewTeam({ name: "", lead: "", description: "" })
  }

  const handleDeleteTeam = (teamId) => {
    setTeams(teams.filter((team) => team.id !== teamId))
  }

  const handleAddDepartment = () => {
    if (newDepartment && !departments.includes(newDepartment)) {
      setDepartments([...departments, newDepartment])
      setNewDepartment("")
    }
  }

  const handleDeleteDepartment = (dept) => {
    setDepartments(departments.filter((d) => d !== dept))
  }

  return (
    <PlatformLayout
      title="Users & Teams"
      description="Manage users, teams, and access permissions"
      breadcrumbs={[
        { label: "Service Management", href: "/dashboard" },
        { label: "Users & Teams", href: "/users" },
      ]}
    >
      <div className="space-y-6 font-sans text-[13px]">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Users & Teams</h1>
          <p className="text-muted-foreground">
            Manage user accounts, teams, and access permissions across your organization
          </p>
        </div>

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
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Status" />
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
              <Button className="text-[13px]">
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
                  <Label htmlFor="name" className="text-right text-[13px]">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
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
                        <SelectItem key={role} value={role}>
                          {role}
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
                <Users className="h-8 w-8 text-blue-600" />
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
                <Shield className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-[13px] font-medium text-muted-foreground">Active Users</p>
                  <p className="text-2xl font-bold">{users.filter((u) => u.status === "Active").length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-purple-600" />
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
                <Calendar className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-[13px] font-medium text-muted-foreground">New This Month</p>
                  <p className="text-2xl font-bold">4</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[13px]">Users</CardTitle>
            <CardDescription className="text-[13px]">Manage user accounts and permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-[13px]">User</th>
                    <th className="text-left py-3 px-4 font-medium text-[13px]">Role</th>
                    <th className="text-left py-3 px-4 font-medium text-[13px]">Department</th>
                    <th className="text-left py-3 px-4 font-medium text-[13px]">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-[13px]">Created On</th>
                    <th className="text-left py-3 px-4 font-medium text-[13px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-[13px]">{user.name}</div>
                          <div className="text-[13px] text-muted-foreground flex items-center">
                            <Mail className="mr-1 h-3 w-3" />
                            {user.email}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[13px]">{user.role}</td>
                      <td className="py-3 px-4 text-[13px]">{user.department}</td>
                      <td className="py-3 px-4">
                        <Badge variant={user.status === "Active" ? "default" : "secondary"} className="text-[13px]">
                          {user.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-[13px]">{formatDate(user.createdOn)}</td>
                      <td className="py-3 px-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="font-sans">
                            <DropdownMenuItem onClick={() => handleEditUser(user)} className="text-[13px]">
                              <Edit className="mr-2 h-4 w-4" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleResetPassword(user)} className="text-[13px]">
                              <Key className="mr-2 h-4 w-4" />
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeactivateUser(user.id)} className="text-[13px]">
                              <UserX className="mr-2 h-4 w-4" />
                              {user.status === "Active" ? "Deactivate" : "Activate"}
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
                <CardTitle className="text-[13px]">Teams</CardTitle>
                <CardDescription className="text-[13px]">
                  Organize users into teams for better collaboration
                </CardDescription>
              </div>
              <Dialog open={showAddTeam} onOpenChange={setShowAddTeam}>
                <DialogTrigger asChild>
                  <Button className="text-[13px]">
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
                      <Select value={newTeam.lead} onValueChange={(value) => setNewTeam({ ...newTeam, lead: value })}>
                        <SelectTrigger className="col-span-3 text-[13px]">
                          <SelectValue placeholder="Select team lead" />
                        </SelectTrigger>
                        <SelectContent>
                          {users
                            .filter((u) => u.status === "Active")
                            .map((user) => (
                              <SelectItem key={user.id} value={user.name}>
                                {user.name}
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
                <Card key={team.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-[13px]">{team.name}</h3>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-[13px]">
                          {team.members} members
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
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
                    <p className="text-[13px] text-muted-foreground mb-3">{team.description}</p>
                    <div className="flex items-center text-[13px]">
                      <Users className="mr-1 h-3 w-3" />
                      <span className="text-muted-foreground">Lead: </span>
                      <span className="ml-1 font-medium">{team.lead}</span>
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
                <Label htmlFor="edit-name" className="text-right text-[13px]">
                  Name
                </Label>
                <Input
                  id="edit-name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
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
                      <SelectItem key={role} value={role}>
                        {role}
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
                <Select value={newUser.status} onValueChange={(value) => setNewUser({ ...newUser, status: value })}>
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
                <Select value={newTeam.lead} onValueChange={(value) => setNewTeam({ ...newTeam, lead: value })}>
                  <SelectTrigger className="col-span-3 text-[13px]">
                    <SelectValue placeholder="Select team lead" />
                  </SelectTrigger>
                  <SelectContent>
                    {users
                      .filter((u) => u.status === "Active")
                      .map((user) => (
                        <SelectItem key={user.id} value={user.name}>
                          {user.name}
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
                  <div key={dept} className="flex items-center justify-between p-2 bg-gray-50 rounded">
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
                Reset password for {selectedUser?.name}. A temporary password will be sent to their email.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-[13px] text-muted-foreground">
                This will generate a new temporary password and send it to {selectedUser?.email}. The user will be
                required to change their password on next login.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowResetPassword(false)} className="text-[13px]">
                Cancel
              </Button>
              <Button
                onClick={() => {
                  // Reset password logic would go here
                  alert(`Password reset email sent to ${selectedUser?.email}`)
                  setShowResetPassword(false)
                }}
                className="text-[13px]"
              >
                Send Reset Email
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PlatformLayout>
  )
}
