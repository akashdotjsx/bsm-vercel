"use client"

import { useState, useEffect } from "react"
import { PageContent } from "@/components/layout/page-content"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { UsersPageSkeleton } from "@/components/ui/skeleton-components"
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
import { useProfilesGQL, useTeamsGQL, createProfileGQL, updateProfileGQL, deleteProfileGQL, createTeamGQL, updateTeamGQL, deleteTeamGQL, addTeamMemberGQL, removeTeamMemberGQL } from "@/hooks/use-users-gql"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/contexts/auth-context"
import { RoleEditModal } from "@/components/rbac/role-edit-modal"
import { rbacApi } from "@/lib/api/rbac"
import type { Role } from "@/lib/types/rbac"
import { UserAvatar } from "@/components/users/user-avatar"
import { UserSelector } from "@/components/users/user-selector"
import { TeamSelector } from "@/components/users/team-selector"
import { departmentAPI } from "@/lib/api/departments"
import AddUserDrawer from "@/components/users/add-user-drawer"

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

// Initial department suggestions - these will be supplemented by actual departments from users
const initialDepartments = [
  "IT",
  "HR", 
  "Finance",
  "Support",
  "Marketing",
  "Operations",
  "Sales",
  "Legal",
]

// All data is now fetched from the database via useUsers hook

export default function UsersPage() {
  const { user: authUser, profile, loading: authLoading } = useAuth()
  
  // GraphQL hooks for data fetching
  const { profiles: users, loading: usersLoading, refetch: refetchUsers } = useProfilesGQL()
  const { teams, loading: teamsLoading, refetch: refetchTeams } = useTeamsGQL()
  const loading = usersLoading || teamsLoading
  
  // All useState hooks MUST be called before any conditional returns
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
  const [departments, setDepartments] = useState(initialDepartments)
  const [newDepartment, setNewDepartment] = useState("")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [showManageMembers, setShowManageMembers] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)
  const [selectedTeamForMembers, setSelectedTeamForMembers] = useState<Team | null>(null)
  const [selectedUserToAdd, setSelectedUserToAdd] = useState('')
  const [selectedUserRole, setSelectedUserRole] = useState('member')
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
  
  // Load roles and departments on component mount
  useEffect(() => {
    const loadRoles = async () => {
      try {
        const allRoles = await rbacApi.getRoles()
        setRoles(allRoles)
      } catch (error) {
        console.error('Error loading roles:', error)
      }
    }
    
    const loadDepartments = async () => {
      try {
        const allDepartments = await departmentAPI.getAllDepartments()
        // Combine with initial departments
        const combined = [...initialDepartments, ...allDepartments]
          .filter((dept, index, arr) => arr.indexOf(dept) === index)
          .sort()
        setDepartments(combined)
      } catch (error) {
        console.error('Error loading departments:', error)
      }
    }
    
    loadRoles()
    loadDepartments()
  }, [])

  // Update departments when users change - with null safety
  useEffect(() => {
    if (users.length > 0) {
      const userDepartments = users
        .map(user => user.department)
        .filter((dept): dept is string => {
          return dept !== null && dept !== undefined && typeof dept === 'string' && dept.trim() !== ''
        })
        .filter((dept, index, arr) => arr.indexOf(dept) === index) // Remove duplicates
      
      const allDepartments = [...initialDepartments, ...userDepartments]
        .filter((dept, index, arr) => arr.indexOf(dept) === index) // Remove duplicates
        .sort()
      
      setDepartments(allDepartments)
    }
  }, [users])

  // Update selectedTeamForMembers when teams data changes
  useEffect(() => {
    if (selectedTeamForMembers && teams.length > 0) {
      const updatedTeam = teams.find(t => t.id === selectedTeamForMembers.id)
      if (updatedTeam) {
        setSelectedTeamForMembers(updatedTeam)
      }
    }
  }, [teams, selectedTeamForMembers])
  
  // GraphQL mutation wrappers (non-hooks)
  const inviteUser = async (userData: any) => {
    const result = await createProfileGQL(userData)
    refetchUsers()
    return result
  }
  
  const updateUser = async (userId: string, updates: any) => {
    const result = await updateProfileGQL(userId, updates)
    refetchUsers()
    return result
  }
  
  const deactivateUser = async (userId: string) => {
    return updateUser(userId, { is_active: false })
  }
  
  const reactivateUser = async (userId: string) => {
    return updateUser(userId, { is_active: true })
  }
  
  const resetUserPassword = async (email: string) => {
    // This still needs to use Supabase auth API
    console.log('Password reset for:', email)
  }
  
  const createTeam = async (teamData: any) => {
    const result = await createTeamGQL(teamData)
    refetchTeams()
    return result
  }
  
  const updateTeam = async (teamId: string, updates: any) => {
    const result = await updateTeamGQL(teamId, updates)
    refetchTeams()
    return result
  }
  
  const deleteTeam = async (teamId: string) => {
    await deleteTeamGQL(teamId)
    refetchTeams()
  }
  
  const addUserToTeam = async (teamId: string, userId: string, role: string = 'member') => {
    const result = await addTeamMemberGQL(teamId, userId, role)
    refetchTeams()
    return result
  }
  
  const removeUserFromTeam = async (teamId: string, userId: string) => {
    await removeTeamMemberGQL(teamId, userId)
    refetchTeams()
  }
  
  const updateTeamMemberRole = async (teamId: string, userId: string, role: string) => {
    await removeTeamMemberGQL(teamId, userId)
    await addTeamMemberGQL(teamId, userId, role)
    refetchTeams()
  }
  
  // Debug logging
  console.log('🏠 Users page render - users:', users?.length || 0, 'teams:', teams?.length || 0, 'loading:', loading)
  console.log('🔐 Auth status - user:', !!authUser, 'profile:', !!profile, 'authLoading:', authLoading)
  console.log('👤 Auth user ID:', authUser?.id, 'Email:', authUser?.email)
  console.log('🏢 Teams data structure:', teams?.slice(0, 1)) // Log first team to see structure

  // If not authenticated, show login prompt
  if (!authLoading && !authUser) {
    return (
      <PageContent
        title="Users & Teams"
        description="Manage user accounts, teams, and access permissions across your organization"
        breadcrumb={[
          { label: "Service Management", href: "/dashboard" },
          { label: "Users & Teams", href: "/users" },
        ]}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-lg font-semibold mb-2">Authentication Required</h2>
            <p className="text-muted-foreground mb-4">Please log in to access user management</p>
            <a 
              href="/auth/login" 
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Go to Login
            </a>
          </div>
        </div>
      </PageContent>
    )
  }

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

  const handleAddUser = async (userData: { first_name: string; last_name: string; email: string; role: string; department: string }) => {
    try {
      await inviteUser({
        ...userData,
        display_name: `${userData.first_name} ${userData.last_name}`.trim()
      })
      toast({
        title: "User added successfully",
        description: `${userData.first_name} ${userData.last_name} has been invited`,
      })
      setShowAddUser(false)
    } catch (error) {
      console.error('Error adding user:', error)
      toast({
        title: "Error adding user",
        description: error instanceof Error ? error.message : 'Failed to add user',
        variant: "destructive"
      })
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
    const teamData = team as any
    setNewTeam({
      name: team.name,
      lead_id: teamData.lead?.id || teamData.lead_id || '',
      description: team.description || '',
      department: team.department || ''
    })
    setShowEditTeam(true)
  }

  const handleUpdateTeam = async () => {
    try {
      if (!selectedTeam) return
      await updateTeam(selectedTeam.id, {
        name: newTeam.name,
        description: newTeam.description,
        department: newTeam.department,
        lead_id: newTeam.lead_id
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
      await deleteTeam(teamId)
    } catch (error) {
      console.error('Error deleting team:', error)
    }
  }

  const handleAddDepartment = async () => {
    if (newDepartment.trim() && !departments.includes(newDepartment.trim())) {
      try {
        await departmentAPI.addDepartment(newDepartment.trim())
        const updatedDepartments = await departmentAPI.getAllDepartments()
        setDepartments(updatedDepartments)
        setNewDepartment("")
        toast({
          title: "Department Added",
          description: `Department "${newDepartment.trim()}" has been added successfully`,
        })
      } catch (error) {
        console.error('Error adding department:', error)
        toast({
          title: "Error",
          description: "Failed to add department",
          variant: "destructive"
        })
      }
    }
  }

  const handleDeleteDepartment = async (dept: string) => {
    try {
      await departmentAPI.removeDepartment(dept)
      const updatedDepartments = await departmentAPI.getAllDepartments()
      setDepartments(updatedDepartments)
      toast({
        title: "Department Removed",
        description: `Department "${dept}" has been removed`,
      })
    } catch (error) {
      console.error('Error removing department:', error)
      toast({
        title: "Error",
        description: "Failed to remove department",
        variant: "destructive"
      })
    }
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

  const handleManageMembers = (team: Team) => {
    // Find the most up-to-date version of this team with member data
    const currentTeam = teams.find(t => t.id === team.id) || team
    setSelectedTeamForMembers(currentTeam)
    setShowManageMembers(true)
  }

  const handleAddMemberToTeam = async (userId: string, role: string = 'member') => {
    if (!selectedTeamForMembers) return
    try {
      await addUserToTeam(selectedTeamForMembers.id, userId, role)
      setShowAddMember(false)
    } catch (error) {
      console.error('Error adding member to team:', error)
    }
  }

  const handleRemoveMemberFromTeam = async (userId: string) => {
    if (!selectedTeamForMembers) return
    try {
      await removeUserFromTeam(selectedTeamForMembers.id, userId)
    } catch (error) {
      console.error('Error removing member from team:', error)
    }
  }

  const handleUpdateMemberRole = async (userId: string, newRole: string) => {
    if (!selectedTeamForMembers) return
    try {
      await updateTeamMemberRole(selectedTeamForMembers.id, userId, newRole)
    } catch (error) {
      console.error('Error updating member role:', error)
    }
  }

  // If loading and no data, show skeleton
  if (loading && users.length === 0) {
    return (
      <PageContent
        title="Users & Teams"
        description="Manage user accounts, teams, and access permissions across your organization"
        breadcrumb={[
          { label: "Service Management", href: "/dashboard" },
          { label: "Users & Teams", href: "/users" },
        ]}
      >
        <UsersPageSkeleton />
      </PageContent>
    )
  }

  return (
    <PageContent
      title="Users & Teams"
      description="Manage user accounts, teams, and access permissions across your organization"
      breadcrumb={[
        { label: "Service Management", href: "/dashboard" },
        { label: "Users & Teams", href: "/users" },
      ]}
    >
      <div className="space-y-6 font-sans text-[11px]">

        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search users..."
                className="pl-10 w-80 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32 text-sm">
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
              <SelectTrigger className="w-48 text-sm">
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
            <Button variant="outline" onClick={() => setShowManageDepartments(true)} className="text-sm">
              <Settings className="mr-2 h-4 w-4" />
              Manage Departments
            </Button>
          </div>
          <Button 
            onClick={() => setShowAddUser(true)}
            className="bg-[#6a5cff] hover:bg-[#5b4cf2] text-white text-sm h-10 px-5 rounded-lg shadow-[0_8px_18px_rgba(106,92,255,0.35)]"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>

         {/* Stats Cards */}
         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
           <Card>
             <CardContent className="p-6">
               <div className="flex items-center">
                 <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
                   <User className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                 </div>
                 <div className="ml-4">
                   <p className="text-xs font-medium text-muted-foreground">Total Users</p>
                   <p className="text-2xl font-bold">{users.length}</p>
                 </div>
               </div>
             </CardContent>
           </Card>
           <Card>
             <CardContent className="p-6">
               <div className="flex items-center">
                 <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
                   <Shield className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                 </div>
                 <div className="ml-4">
                   <p className="text-xs font-medium text-muted-foreground">Active Users</p>
                   <p className="text-2xl font-bold">{users.filter((u) => u.is_active).length}</p>
                 </div>
               </div>
             </CardContent>
           </Card>
           <Card>
             <CardContent className="p-6">
               <div className="flex items-center">
                 <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
                   <Users className="h-7 w-7 text-purple-600 dark:text-purple-400" />
                 </div>
                 <div className="ml-4">
                   <p className="text-xs font-medium text-muted-foreground">Teams</p>
                   <p className="text-2xl font-bold">{teams.length}</p>
                 </div>
               </div>
             </CardContent>
           </Card>
           <Card>
             <CardContent className="p-6">
               <div className="flex items-center">
                 <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
                   <Calendar className="h-7 w-7 text-orange-600 dark:text-orange-400" />
                 </div>
                 <div className="ml-4">
                   <p className="text-xs font-medium text-muted-foreground">New This Month</p>
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
                        <UserAvatar 
                          user={user} 
                          size="md" 
                          showName 
                          showRole={false}
                          showStatus
                          className="min-w-0"
                        />
                      </td>
                      <td className="py-3 px-4 text-sm">{user.role || 'N/A'}</td>
                      <td className="py-3 px-4 text-sm">{user.department || 'N/A'}</td>
                      <td className="py-3 px-4">
                        {user.is_active ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">Active</span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/30">Inactive</span>
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
                              className="text-destructive text-sm"
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
                      <UserSelector
                        users={users}
                        value={newTeam.lead_id}
                        onValueChange={(value) => setNewTeam({ ...newTeam, lead_id: value })}
                        placeholder="Select team lead..."
                        className="col-span-3"
                        disabled={loading}
                        showOnlyActive
                        filterByRole={["admin", "manager", "agent"]}
                      />
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.map((team) => {
                const teamData = team as any
                const leadUser = teamData.lead_id ? users.find(u => u.id === teamData.lead_id) : null
                const teamMembers = teamData.team_members || []
                
                return (
                  <Card
                    key={team.id}
                    className="border bg-gradient-to-br from-card via-card to-muted/30 dark:from-card dark:via-card dark:to-muted/10 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 flex items-center justify-center shadow-lg">
                          <Users className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-foreground text-base mb-1">{team.name}</h3>
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{team.description || 'No description provided'}</p>
                          <div className="flex items-center gap-2 mb-3">
                            <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-accent/50 border-accent">
                              {teamMembers.length} {teamMembers.length === 1 ? 'member' : 'members'}
                            </Badge>
                            {team.department && (
                              <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-muted/50 border-muted">
                                {team.department}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground hover:bg-accent/50">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="font-sans">
                            <DropdownMenuItem onClick={() => handleManageMembers(team)} className="text-[11px]">
                              <Users className="mr-2 h-3 w-3" />
                              Manage Members
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditTeam(team)} className="text-[11px]">
                              <Edit className="mr-2 h-3 w-3" />
                              Edit Team
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteTeam(team.id)}
                              className="text-destructive text-[11px]"
                            >
                              <Trash2 className="mr-2 h-3 w-3" />
                              Delete Team
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Team Lead */}
                      {leadUser && (
                        <div className="flex items-center gap-2 mb-4 p-2 bg-accent/30 dark:bg-accent/20 rounded-lg">
                          <UserAvatar 
                            user={leadUser}
                            size="sm"
                            showStatus
                          />
                          <div className="min-w-0">
                            <p className="text-[9px] text-muted-foreground">Team Lead</p>
                            <p className="font-medium text-xs text-foreground truncate">
                              {leadUser.display_name || `${leadUser.first_name || ''} ${leadUser.last_name || ''}`.trim() || leadUser.email}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Team Members */}
                      {teamMembers.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-[9px] text-muted-foreground font-medium">Team Members</p>
                          <div className="flex -space-x-2">
                            {teamMembers.slice(0, 6).map((member: any, index: number) => (
                              <UserAvatar 
                                key={member.user?.id || index}
                                user={member.user}
                                size="sm"
                                className="ring-2 ring-background hover:z-10 hover:scale-110 transition-transform"
                                showStatus
                              />
                            ))}
                            {teamMembers.length > 6 && (
                              <div className="w-6 h-6 rounded-full ring-2 ring-background bg-muted dark:bg-muted/70 flex items-center justify-center text-[7px] font-bold text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors">
                                +{teamMembers.length - 6}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4 border-2 border-dashed border-muted rounded-lg">
                          <Users className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                          <p className="text-[9px] text-muted-foreground">No members added yet</p>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleManageMembers(team)}
                            className="text-[9px] h-6 mt-1"
                          >
                            Add Members
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
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
                <Select
                  value={newUser.status}
                  onValueChange={async (value) => {
                    setNewUser({ ...newUser, status: value })
                    if (selectedUser) {
                      try {
                        if (value === 'Inactive') {
                          await deactivateUser(selectedUser.id)
                        } else if (value === 'Active') {
                          await reactivateUser(selectedUser.id)
                        }
                      } catch (e) {
                        console.error('Error toggling user active state:', e)
                      }
                    }
                  }}
                >
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
                <UserSelector
                  users={users}
                  value={newTeam.lead_id}
                  onValueChange={(value) => setNewTeam({ ...newTeam, lead_id: value })}
                  placeholder="Select team lead..."
                  className="col-span-3"
                  disabled={loading}
                  showOnlyActive
                  filterByRole={["admin", "manager", "agent"]}
                />
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
                  <div key={dept} className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-sm">{dept}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteDepartment(dept)}
                      className="text-destructive text-sm"
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

        {/* Team Members Management Modal */}
        <Dialog open={showManageMembers} onOpenChange={setShowManageMembers}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-[13px] font-semibold">
                Manage Team Members - {selectedTeamForMembers?.name}
              </DialogTitle>
              <DialogDescription className="text-[13px]">
                Add or remove members from this team and manage their roles
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto space-y-6">
              {/* Add Member Section */}
              <div className="border-b pb-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-medium">Team Members ({(selectedTeamForMembers as any)?.team_members?.length || 0})</h3>
                  <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="text-[12px]">
                        <UserPlus className="mr-2 h-3 w-3" />
                        Add Member
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle className="text-[13px]">Add Team Member</DialogTitle>
                        <DialogDescription className="text-[12px]">
                          Select a user to add to {selectedTeamForMembers?.name}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label className="text-[12px] font-medium">Select User</Label>
                          <Select value={selectedUserToAdd} onValueChange={setSelectedUserToAdd}>
                            <SelectTrigger className="text-[12px]">
                              <SelectValue placeholder="Choose a user to add" />
                            </SelectTrigger>
                            <SelectContent>
                              {users
                                .filter(user => user.is_active && 
                                  !((selectedTeamForMembers as any)?.team_members?.some((member: any) => member.user.id === user.id)))
                                .map((user) => (
                                  <SelectItem key={user.id} value={user.id} className="text-[12px]">
                                    {user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-[12px] font-medium">Role</Label>
                          <Select value={selectedUserRole} onValueChange={setSelectedUserRole}>
                            <SelectTrigger className="text-[12px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="member" className="text-[12px]">Member</SelectItem>
                              <SelectItem value="lead" className="text-[12px]">Lead</SelectItem>
                              <SelectItem value="admin" className="text-[12px]">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => {
                          setShowAddMember(false)
                          setSelectedUserToAdd('')
                          setSelectedUserRole('member')
                        }} className="text-[12px]">
                          Cancel
                        </Button>
                        <Button 
                          onClick={() => {
                            if (selectedUserToAdd) {
                              handleAddMemberToTeam(selectedUserToAdd, selectedUserRole)
                              setSelectedUserToAdd('')
                              setSelectedUserRole('member')
                            }
                          }}
                          disabled={!selectedUserToAdd}
                          className="text-[12px]"
                        >
                          Add Member
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Current Members List */}
              <div className="space-y-2">
                {(selectedTeamForMembers as any)?.team_members?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="mx-auto h-12 w-12 mb-2 opacity-50" />
                    <p className="text-[13px]">No team members yet</p>
                    <p className="text-[12px] mt-1">Add members to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {((selectedTeamForMembers as any)?.team_members || []).map((member: any) => (
                      <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center">
                            <span className="text-xs font-semibold text-muted-foreground">
                              {member.user.display_name?.split(' ').map((n: string) => n[0]).join('') || 
                               member.user.email.substring(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="text-[13px] font-medium">{member.user.display_name || member.user.email}</div>
                            <div className="text-[11px] text-muted-foreground">{member.user.email}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Select 
                            value={member.role} 
                            onValueChange={(value) => handleUpdateMemberRole(member.user.id, value)}
                          >
                            <SelectTrigger className="w-24 h-7 text-[11px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="member" className="text-[11px]">Member</SelectItem>
                              <SelectItem value="lead" className="text-[11px]">Lead</SelectItem>
                              <SelectItem value="admin" className="text-[11px]">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMemberFromTeam(member.user.id)}
                            className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <DialogFooter className="border-t pt-4">
              <Button onClick={() => setShowManageMembers(false)} className="text-[13px]">
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add User Drawer */}
        <AddUserDrawer
          isOpen={showAddUser}
          onClose={() => setShowAddUser(false)}
          onSubmit={handleAddUser}
          departments={departments}
        />
      </div>
    </PageContent>
  )
}
