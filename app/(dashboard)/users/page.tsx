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
import { useProfilesGQL, useTeamsGQL, inviteUserViaAPI, updateProfileGQL, deleteUserViaAPI, createTeamGQL, updateTeamGQL, deleteTeamGQL, addTeamMemberGQL, removeTeamMemberGQL } from "@/hooks/use-users-gql"
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
import { AddUserButton } from "@/components/users/add-user-button"

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
      avatar_url?: string
    }
  }>
  members?: Array<{
    id: string
    role: string
    user: {
      id: string
      display_name: string
      email: string
      avatar_url?: string
    }
  }>
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
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
  
  // API call wrappers (non-hooks)
  const inviteUser = async (userData: any) => {
    const result = await inviteUserViaAPI({
      first_name: userData.first_name,
      last_name: userData.last_name,
      email: userData.email,
      role: userData.role,
      department: userData.department
    })
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
    // Add organization_id if available and not already set
    if (!teamData.organization_id && profile?.organization_id) {
      teamData.organization_id = profile.organization_id
    }
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
      const result = await inviteUser({
        ...userData,
        display_name: `${userData.first_name} ${userData.last_name}`.trim()
      })
      toast({
        title: "User invited successfully",
        description: result.message || `${userData.first_name} ${userData.last_name} has been invited`,
      })
      setShowAddUser(false)
    } catch (error) {
      console.error('Error inviting user:', error)
      toast({
        title: "Error inviting user",
        description: error instanceof Error ? error.message : 'Failed to invite user',
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
      
      console.log('🔄 Updating user:', selectedUser.id, 'with data:', {
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        display_name: `${newUser.first_name} ${newUser.last_name}`,
        role: newUser.role,
        department: newUser.department,
      })
      
      const result = await updateUser(selectedUser.id, {
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        display_name: `${newUser.first_name} ${newUser.last_name}`,
        role: newUser.role,
        department: newUser.department,
      })
      
      console.log('✅ User update result:', result)
      
      toast({
        title: "User updated successfully",
        description: `${newUser.first_name} ${newUser.last_name}'s information has been updated`,
      })
      
      setShowEditUser(false)
      setSelectedUser(null)
      setNewUser({ first_name: "", last_name: "", email: "", role: "user", department: "", status: "Active" })
    } catch (error) {
      console.error('❌ Error updating user:', error)
      toast({
        title: "Error updating user",
        description: error instanceof Error ? error.message : 'Failed to update user',
        variant: "destructive"
      })
    }
  }

  const handleDeleteUser = (userId: string) => {
    const user = users.find(u => u.id === userId)
    if (user) {
      setUserToDelete(user)
      setShowDeleteConfirm(true)
    }
  }

  const confirmDeleteUser = async () => {
    if (!userToDelete) return
    
    try {
      const userName = userToDelete.display_name || userToDelete.email || 'User'
      
      await deleteUserViaAPI(userToDelete.id)
      refetchUsers()
      toast({
        title: "User deleted successfully",
        description: `${userName} has been permanently deleted from the system`,
      })
      setShowDeleteConfirm(false)
      setUserToDelete(null)
    } catch (error) {
      console.error('Error deleting user:', error)
      toast({
        title: "Error deleting user",
        description: error instanceof Error ? error.message : 'Failed to delete user',
        variant: "destructive"
      })
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
      // Check if user has permission to create teams
      if (!profile?.role || !['admin', 'manager'].includes(profile.role)) {
        toast({
          title: "Permission Denied",
          description: "Only administrators and managers can create teams",
          variant: "destructive"
        })
        return
      }
      
      await createTeam(newTeam)
      setNewTeam({ name: "", lead_id: "", description: "", department: "" })
      setShowAddTeam(false)
      toast({
        title: "Team created successfully",
        description: `Team "${newTeam.name}" has been created`,
      })
    } catch (error) {
      console.error('Error creating team:', error)
      let errorMessage = 'Failed to create team'
      
      // Handle specific GraphQL/RLS errors
      if (error instanceof Error) {
        if (error.message.includes('row-level security policy')) {
          errorMessage = 'You do not have permission to create teams. Only administrators and managers can create teams.'
        } else {
          errorMessage = error.message
        }
      }
      
      toast({
        title: "Error creating team",
        description: errorMessage,
        variant: "destructive"
      })
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
      const user = users.find(u => u.id === userId)
      await addUserToTeam(selectedTeamForMembers.id, userId, role)
      setShowAddMember(false)
      toast({
        title: "Member added successfully",
        description: `${user?.display_name || user?.email} has been added to ${selectedTeamForMembers.name}`,
      })
    } catch (error) {
      console.error('Error adding member to team:', error)
      toast({
        title: "Error adding member",
        description: error instanceof Error ? error.message : 'Failed to add member to team',
        variant: "destructive"
      })
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
      title=""
      description=""
      breadcrumb={[]}
    >
       <div className="space-y-6 font-sans bg-background">

         {/* Main Heading */}
         <div>
           <h1 className="text-base font-semibold tracking-tight font-sans text-foreground" style={{ fontSize: '16px', fontWeight: 600 }}>Utilization Report</h1>
           <p className="text-xs font-sans text-muted-foreground" style={{ fontSize: '12px', fontWeight: 400, marginTop: '8px' }}>Track and analyze team member utilization across projects and time periods</p>
         </div>

         {/* Filter Controls Row */}
         <div className="flex items-center justify-between w-full" style={{ marginTop: '16px' }}>
           <div className="flex items-center" style={{ gap: '0px' }}>
             {/* Search Input */}
             <div className="relative" style={{ width: '185px', height: '32px' }}>
               <div className="absolute left-2.5 top-1/2 transform -translate-y-1/2" style={{ width: '12.04px', height: '12.04px' }}>
                 <Search className="w-full h-full text-muted-foreground" />
               </div>
              <Input
                placeholder="Search users..."
                 className="w-full h-full pl-7 pr-3 text-xs rounded-[5px] border border-border bg-background"
                 style={{ fontFamily: 'Inter', fontWeight: '500', fontSize: '12px', lineHeight: '1.2102272510528564em' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
             
             {/* All Departments Dropdown */}
             <div className="ml-4" style={{ width: '144px', height: '32px' }}>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                 <SelectTrigger className="w-full h-full text-xs rounded-[5px] border border-border pl-2.5 pr-8 bg-background">
                   <SelectValue placeholder="All Departments" style={{ fontFamily: 'Inter', fontWeight: '500', fontSize: '12px', lineHeight: '1.2102272510528564em' }} />
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
             
             {/* Filter Button */}
             <div className="ml-4" style={{ width: '113px', height: '32px' }}>
               <Button variant="outline" className="w-full h-full text-xs rounded-[5px] border border-border pl-6 pr-3 bg-background">
                 <Filter className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                 <span style={{ fontFamily: 'Inter', fontWeight: '500', fontSize: '12px', lineHeight: '1.2102272510528564em' }}>Filter</span>
            </Button>
          </div>
             
             {/* Manage Departments Button */}
             <div className="ml-4" style={{ width: '161px', height: '32px' }}>
               <Button variant="outline" onClick={() => setShowManageDepartments(true)} className="w-full h-full text-xs rounded-[5px] border border-border pl-6 pr-3 bg-background">
                 <Settings className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                 <span style={{ fontFamily: 'Inter', fontWeight: '500', fontSize: '12px', lineHeight: '1.2102272510528564em' }}>Manage Departments</span>
               </Button>
             </div>
           </div>
           
           {/* Add User Button - Positioned on the right */}
           <AddUserButton
             onClick={() => setShowAddUser(true)}
             className="w-24 h-9"
           />
        </div>

         {/* Stats Cards */}
         <div className="flex gap-4 bg-muted" style={{ marginTop: '24px', padding: '16px', borderRadius: '10px' }}>
            {/* Total Users Card */}
            <div className="border border-border rounded-[10px] flex items-center justify-between bg-card" style={{ width: '290px', height: '70px', paddingLeft: '13px', paddingRight: '13px' }}>
             <div className="flex flex-col">
               <p className="text-muted-foreground mb-1" style={{ fontFamily: 'Inter', fontWeight: '400', fontSize: '12px', lineHeight: '1.2102272510528564em', textAlign: 'left', margin: '0px', padding: '0px' }}>Total Users</p>
               <p className="text-foreground" style={{ fontFamily: 'Inter', fontWeight: '600', fontSize: '18px', lineHeight: '1.2102272245619032em', textAlign: 'left', margin: '0px', padding: '0px' }}>{users.length}</p>
                 </div>
             <div style={{ width: '44px', height: '44px' }}>
               <img src="/users.svg" alt="Total Users" className="w-full h-full" />
                 </div>
               </div>

            {/* Active Users Card */}
            <div className="border border-border rounded-[10px] flex items-center justify-between bg-card" style={{ width: '290px', height: '70px', paddingLeft: '13px', paddingRight: '13px' }}>
             <div className="flex flex-col">
               <p className="text-muted-foreground mb-1" style={{ fontFamily: 'Inter', fontWeight: '400', fontSize: '12px', lineHeight: '1.2102272510528564em', textAlign: 'left', margin: '0px', padding: '0px' }}>Active Users</p>
               <p className="text-foreground" style={{ fontFamily: 'Inter', fontWeight: '600', fontSize: '18px', lineHeight: '1.2102272245619032em', textAlign: 'left', margin: '0px', padding: '0px' }}>{users.filter((u) => u.is_active).length}</p>
                 </div>
             <div style={{ width: '44px', height: '44px' }}>
               <img src="/active users.svg" alt="Active Users" className="w-full h-full" />
                 </div>
               </div>

            {/* Teams Card */}
            <div className="border border-border rounded-[10px] flex items-center justify-between bg-card" style={{ width: '290px', height: '70px', paddingLeft: '13px', paddingRight: '13px' }}>
             <div className="flex flex-col">
               <p className="text-muted-foreground mb-1" style={{ fontFamily: 'Inter', fontWeight: '400', fontSize: '12px', lineHeight: '1.2102272510528564em', textAlign: 'left', margin: '0px', padding: '0px' }}>Teams</p>
               <p className="text-foreground" style={{ fontFamily: 'Inter', fontWeight: '600', fontSize: '18px', lineHeight: '1.2102272245619032em', textAlign: 'left', margin: '0px', padding: '0px' }}>{teams.length}</p>
                 </div>
             <div style={{ width: '44px', height: '44px' }}>
               <img src="/teams.svg" alt="Teams" className="w-full h-full" />
                 </div>
               </div>

            {/* New This Month Card */}
            <div className="border border-border rounded-[10px] flex items-center justify-between bg-card" style={{ width: '290px', height: '70px', paddingLeft: '13px', paddingRight: '13px' }}>
             <div className="flex flex-col">
               <p className="text-muted-foreground mb-1" style={{ fontFamily: 'Inter', fontWeight: '400', fontSize: '12px', lineHeight: '1.2102272510528564em', textAlign: 'left', margin: '0px', padding: '0px' }}>New This Month</p>
               <p className="text-foreground" style={{ fontFamily: 'Inter', fontWeight: '600', fontSize: '18px', lineHeight: '1.2102272245619032em', textAlign: 'left', margin: '0px', padding: '0px' }}>{users.filter((u) => {
                     const createdDate = new Date(u.created_at)
                     const now = new Date()
                     const thisMonth = now.getMonth()
                     const thisYear = now.getFullYear()
                     return createdDate.getMonth() === thisMonth && createdDate.getFullYear() === thisYear
                   }).length}</p>
                 </div>
             <div style={{ width: '44px', height: '44px' }}>
               <img src="/new this month.svg" alt="New This Month" className="w-full h-full" />
               </div>
           </div>
         </div>

         {/* Users Section */}
          <div className="border border-border rounded-[10px] w-full bg-card">
           {/* Header Section */}
           <div className="p-6 pb-4">
             <h2 className="text-base font-semibold tracking-tight font-sans text-foreground" style={{ fontSize: '16px', fontWeight: 600 }}>Users</h2>
             <p className="text-xs font-sans text-muted-foreground" style={{ fontSize: '12px', fontWeight: 400, marginTop: '8px' }}>Manage user accounts and permissions</p>
            </div>
           
           {/* Table Section */}
           <div className="px-6 pb-6">
            <div className="overflow-x-auto">
               <table className="w-full table-fixed">
                <thead>
                   <tr className="border-b border-border bg-card">
                     <th className="text-left py-3 px-2 font-semibold text-sm text-foreground" style={{ fontFamily: 'Inter', fontWeight: '600', fontSize: '12px', lineHeight: '1.2102272510528564em', width: '30%' }}>User</th>
                     <th className="text-left py-3 px-2 font-semibold text-sm text-foreground" style={{ fontFamily: 'Inter', fontWeight: '600', fontSize: '12px', lineHeight: '1.2102272510528564em', width: '15%' }}>Role</th>
                     <th className="text-left py-3 px-2 font-semibold text-sm text-foreground" style={{ fontFamily: 'Inter', fontWeight: '600', fontSize: '12px', lineHeight: '1.2102272510528564em', width: '15%' }}>Department</th>
                     <th className="text-left py-3 px-2 font-semibold text-sm text-foreground" style={{ fontFamily: 'Inter', fontWeight: '600', fontSize: '12px', lineHeight: '1.2102272510528564em', width: '15%' }}>Status</th>
                     <th className="text-left py-3 px-2 font-semibold text-sm text-foreground" style={{ fontFamily: 'Inter', fontWeight: '600', fontSize: '12px', lineHeight: '1.2102272510528564em', width: '15%' }}>Created On</th>
                     <th className="text-left py-3 px-2 font-semibold text-sm text-foreground" style={{ fontFamily: 'Inter', fontWeight: '600', fontSize: '12px', lineHeight: '1.2102272510528564em', width: '10%' }}>Actions</th>
                  </tr>
                </thead>
                 <tbody className="divide-y divide-border">
                  {filteredUsers.map((user) => (
                     <tr key={user.id} className="hover:bg-muted/50 bg-card">
                       <td className="py-3 px-2">
                         <div className="flex flex-col">
                           <span className="text-sm text-foreground truncate" style={{ fontFamily: 'Inter', fontWeight: '500', fontSize: '12px', lineHeight: '1.2102272510528564em' }}>
                             {user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email}
                           </span>
                           <span className="text-xs text-muted-foreground truncate" style={{ fontFamily: 'Inter', fontWeight: '400', fontSize: '10px', lineHeight: '1.2102272510528564em' }}>
                             {user.email}
                           </span>
                         </div>
                      </td>
                       <td className="py-3 px-2 text-sm text-foreground truncate" style={{ fontFamily: 'Inter', fontWeight: '400', fontSize: '12px', lineHeight: '1.2102272510528564em' }}>{user.role || 'N/A'}</td>
                       <td className="py-3 px-2 text-sm text-foreground truncate" style={{ fontFamily: 'Inter', fontWeight: '400', fontSize: '12px', lineHeight: '1.2102272510528564em' }}>{user.department || 'N/A'}</td>
                       <td className="py-3 px-2">
                        {user.is_active ? (
                           <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#EDFFDE', color: '#47AF47', fontFamily: 'Inter', fontWeight: '500', fontSize: '12px', lineHeight: '1.2102272510528564em' }}>Active</span>
                        ) : (
                           <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" style={{ fontFamily: 'Inter', fontWeight: '500', fontSize: '12px', lineHeight: '1.2102272510528564em' }}>Inactive</span>
                        )}
                      </td>
                       <td className="py-3 px-2 text-sm text-foreground truncate" style={{ fontFamily: 'Inter', fontWeight: '400', fontSize: '12px', lineHeight: '1.2102272510528564em' }}>{formatDate(user.created_at)}</td>
                       <td className="py-3 px-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                             <Button variant="ghost" size="sm" className="px-1 text-muted-foreground hover:bg-gray-50">
                               <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="font-sans">
                             <DropdownMenuItem onClick={() => handleEditUser(user)} className="text-sm">
                              <Edit className="mr-2 h-4 w-4" />
                              Edit User
                            </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => handleEditUserRole(user)} className="text-sm">
                              <ShieldCheck className="mr-2 h-4 w-4" />
                              Manage Role
                            </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => handleResetPassword(user)} className="text-sm">
                              <Key className="mr-2 h-4 w-4" />
                              Reset Password
                            </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => handleDeactivateUser(user.id, user.is_active)} className="text-sm">
                              <UserX className="mr-2 h-4 w-4" />
                              {user.is_active ? "Deactivate" : "Activate"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteUser(user.id)}
                               className="text-red-600 text-sm"
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
           </div>
         </div>

         {/* Teams Section */}
         <div className="w-full bg-card" style={{ marginTop: '24px' }}>
          <div className="p-6 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold tracking-tight font-sans text-foreground" style={{ fontSize: '16px', fontWeight: 600 }}>Teams</h2>
                <p className="text-xs font-sans text-muted-foreground" style={{ fontSize: '12px', fontWeight: 400, marginTop: '8px' }}>Organize users into teams for better collaboration</p>
              </div>
              <Dialog open={showAddTeam} onOpenChange={setShowAddTeam}>
                <DialogTrigger asChild>
                  <Button className="bg-[#6E72FF] hover:bg-[#5b4cf2] text-white rounded-[5px] flex items-center justify-center" style={{ 
                    width: '96px', 
                    height: '36px', 
                    fontFamily: 'Inter', 
                    fontWeight: '600', 
                    fontSize: '12px', 
                    lineHeight: '1.2102272510528564em',
                    padding: '0px'
                  }}>
                    + Add Team
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
          </div>
          
          <div className="px-6 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.map((team) => {
                const teamData = team as any
                // Use the nested lead object from GraphQL, not lead_id lookup
                const leadUser = teamData.lead || null
                // Get members from the nested GraphQL structure
                const teamMembers = teamData.members?.edges?.map((edge: any) => edge.node) || []
                
                return (
                  <div
                    key={team.id}
                     className="border border-border rounded-[10px] bg-card"
                     style={{ padding: '16px' }}
                  >
                    <div className="flex flex-col gap-4">
                      {/* Team Info */}
                      <div className="flex flex-col gap-2">
                        <h3 className="text-foreground" style={{ fontFamily: 'Inter', fontWeight: '600', fontSize: '14px', lineHeight: '1.2102272510528564em', textAlign: 'left' }}>{team.name}</h3>
                        <p className="text-muted-foreground" style={{ fontFamily: 'Inter', fontWeight: '400', fontSize: '12px', lineHeight: '1.2102272510528564em', textAlign: 'left' }}>
                          {team.description || 'No description provided'}
                        </p>
                      </div>

                      {/* Team Lead and Members Count */}
                      <div className="flex items-center justify-between">
                        {/* Team Lead */}
                        <div className="flex items-center" style={{ width: '157px', height: '24px' }}>
                          <svg width="24" height="24" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
                            <path d="M19.2 22.9H4.80001C3.92001 22.9 3.20001 22.18 3.20001 21.3C3.20001 18.18 5.68001 15.7 8.80001 15.7H15.2C18.32 15.7 20.8 18.18 20.8 21.3C20.8 22.18 20.08 22.9 19.2 22.9Z" fill="#6C3DB7" stroke="#6C3DB7" strokeWidth="1.6" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M12 12.5C14.651 12.5 16.8 10.351 16.8 7.70002C16.8 5.04906 14.651 2.90002 12 2.90002C9.34905 2.90002 7.20001 5.04906 7.20001 7.70002C7.20001 10.351 9.34905 12.5 12 12.5Z" fill="#6EBAFF" stroke="#6EBAFF" strokeWidth="1.6" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <div className="flex flex-col">
                            <span className="text-muted-foreground" style={{ fontFamily: 'Inter', fontWeight: '400', fontSize: '14px', lineHeight: '1.2102272851126534em', textAlign: 'left' }}>Lead:</span>
                            <span className="text-foreground" style={{ fontFamily: 'Inter', fontWeight: '500', fontSize: '14px', lineHeight: '1.2102272851126534em', textAlign: 'left' }}>
                              {leadUser ? (leadUser.display_name || leadUser.email) : 'No lead assigned'}
                            </span>
                          </div>
                        </div>

                        {/* Members Count Badge */}
                         <div className="border border-border rounded-[5px] flex items-center justify-center bg-card" style={{ padding: '5px 10px' }}>
                          <span className="text-foreground" style={{ fontFamily: 'Inter', fontWeight: '500', fontSize: '12px', lineHeight: '1.2102272510528564em', textAlign: 'center' }}>
                            {teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleManageMembers(team)}
                          className="text-[11px] px-3 py-1"
                        >
                          Manage Members
                        </Button>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditTeam(team)}
                            className="text-[11px] px-2 py-1"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTeam(team.id)}
                            className="text-[11px] px-2 py-1 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

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
                  <div key={dept} className="flex items-center justify-between p-2 rounded bg-card">
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

        {/* Delete User Confirmation Modal */}
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent className="font-sans">
            <DialogHeader>
              <DialogTitle className="text-[15px] font-semibold flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                Delete User
              </DialogTitle>
              <DialogDescription className="text-[13px] pt-2">
                This action cannot be undone. This will permanently delete the user account.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <p className="text-[13px] font-medium text-foreground mb-2">
                  You are about to delete:
                </p>
                <div className="space-y-1">
                  <p className="text-[13px] font-semibold">
                    {userToDelete?.display_name || `${userToDelete?.first_name || ''} ${userToDelete?.last_name || ''}`.trim() || 'User'}
                  </p>
                  <p className="text-[12px] text-muted-foreground">
                    {userToDelete?.email}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[13px] text-muted-foreground">
                  • The user will be removed from Supabase Auth
                </p>
                <p className="text-[13px] text-muted-foreground">
                  • All user data and profile information will be deleted
                </p>
                <p className="text-[13px] text-muted-foreground">
                  • The user will no longer be able to log in
                </p>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setUserToDelete(null)
                }} 
                className="text-[13px]"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteUser}
                className="text-[13px] bg-destructive hover:bg-destructive/90"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete User
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
                  <h3 className="text-sm font-medium">Team Members ({(selectedTeamForMembers as any)?.members?.edges?.length || 0})</h3>
                  <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
                    <DialogTrigger asChild>
                      <Button className="bg-[#6E72FF] hover:bg-[#5b4cf2] text-white text-[12px] px-4 py-2 rounded-md">
                        <UserPlus className="mr-2 h-4 w-4" />
                        Add Member
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle className="text-[15px] font-semibold">Add Team Member</DialogTitle>
                        <DialogDescription className="text-[13px] text-muted-foreground">
                          Add a new member to <span className="font-medium text-foreground">{selectedTeamForMembers?.name}</span> team
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-6 py-4">
                        <div className="space-y-2">
                          <Label className="text-[13px] font-medium">Select User</Label>
                          <UserSelector
                            users={users.filter(user => user.is_active && !((selectedTeamForMembers as any)?.members?.edges?.some((edge: any) => edge.node.user.id === user.id)))}
                            value={selectedUserToAdd}
                            onValueChange={setSelectedUserToAdd}
                            placeholder="Search and select a user..."
                            className="w-full"
                            showOnlyActive={true}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[13px] font-medium">Team Role</Label>
                          <Select value={selectedUserRole} onValueChange={setSelectedUserRole}>
                            <SelectTrigger className="text-[13px] h-10">
                              <SelectValue placeholder="Select role for team member" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="member" className="text-[13px]">
                                <div className="flex flex-col">
                                  <span className="font-medium">Member</span>
                                  <span className="text-xs text-muted-foreground">Standard team member</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="lead" className="text-[13px]">
                                <div className="flex flex-col">
                                  <span className="font-medium">Team Lead</span>
                                  <span className="text-xs text-muted-foreground">Can manage team members</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="admin" className="text-[13px]">
                                <div className="flex flex-col">
                                  <span className="font-medium">Admin</span>
                                  <span className="text-xs text-muted-foreground">Full team administration</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter className="gap-2 pt-6">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setShowAddMember(false)
                            setSelectedUserToAdd('')
                            setSelectedUserRole('member')
                          }} 
                          className="text-[13px] px-4"
                        >
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
                          className="bg-[#6E72FF] hover:bg-[#5b4cf2] text-white text-[13px] px-6"
                        >
                          <UserPlus className="mr-2 h-4 w-4" />
                          Add to Team
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Current Members List */}
              <div className="space-y-2">
                {((selectedTeamForMembers as any)?.members?.edges?.length || 0) === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="mx-auto h-12 w-12 mb-2 opacity-50" />
                    <p className="text-[13px]">No team members yet</p>
                    <p className="text-[12px] mt-1">Add members to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {((selectedTeamForMembers as any)?.members?.edges || []).map((edge: any) => {
                      const member = edge.node
                      return (
                      <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded-full flex items-center justify-center bg-card">
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
                      )
                    })}
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
