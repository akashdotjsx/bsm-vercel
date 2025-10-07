import { useState, useEffect } from 'react'
import { userAPI } from '@/lib/api/users'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'

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
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('🔄 Loading users...')
      const userData = await userAPI.getUsers()
      console.log('📊 Users loaded:', userData?.length || 0, 'users')
      
      setUsers(userData || [])
      
      if (!userData || userData.length === 0) {
        console.log('⚠️ No users found - this might be normal if no users exist yet')
      }
    } catch (err) {
      console.error('❌ Error loading users:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      // Don't show toast for empty data, only for actual errors
      if (errorMessage !== 'Unknown error') {
        toast({
          title: "Error loading users",
          description: errorMessage,
          variant: "destructive"
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const loadTeams = async () => {
    try {
      console.log('🔄 Loading teams...')
      const teamData = await userAPI.getTeams()
      console.log('📊 Teams loaded:', teamData?.length || 0, 'teams')
      setTeams(teamData || [])
      
      if (!teamData || teamData.length === 0) {
        console.log('⚠️ No teams found - this might be normal if no teams exist yet')
      }
    } catch (err) {
      console.error('❌ Error loading teams:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      // Don't show toast for empty data, only for actual errors
      if (errorMessage !== 'Unknown error') {
        toast({
          title: "Error loading teams",
          description: errorMessage,
          variant: "destructive"
        })
      }
    }
  }

  const inviteUser = async (userData: any) => {
    try {
      const result = await userAPI.inviteUser(userData)
      // Add the new user to the local state
      if (result.user) {
        setUsers(prev => [result.user, ...prev])
      }
      toast({
        title: "User invited successfully",
        description: result.message,
      })
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      toast({
        title: "Error inviting user",
        description: errorMessage,
        variant: "destructive"
      })
      throw err
    }
  }

  const updateUser = async (userId: string, updates: any) => {
    try {
      const updatedUser = await userAPI.updateUser(userId, updates)
      setUsers(users.map(user => user.id === userId ? updatedUser : user))
      toast({
        title: "User updated",
        description: "User profile has been updated successfully",
      })
      return updatedUser
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      toast({
        title: "Error updating user",
        description: errorMessage,
        variant: "destructive"
      })
      throw err
    }
  }

  const deactivateUser = async (userId: string) => {
    try {
      const updatedUser = await userAPI.deactivateUser(userId)
      setUsers(users.map(user => user.id === userId ? updatedUser : user))
      toast({
        title: "User deactivated",
        description: "User has been deactivated successfully",
      })
      return updatedUser
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      toast({
        title: "Error deactivating user",
        description: errorMessage,
        variant: "destructive"
      })
      throw err
    }
  }

  const reactivateUser = async (userId: string) => {
    try {
      const updatedUser = await userAPI.reactivateUser(userId)
      setUsers(users.map(user => user.id === userId ? updatedUser : user))
      toast({
        title: "User reactivated",
        description: "User has been reactivated successfully",
      })
      return updatedUser
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      toast({
        title: "Error reactivating user",
        description: errorMessage,
        variant: "destructive"
      })
      throw err
    }
  }

  const resetUserPassword = async (email: string) => {
    try {
      const result = await userAPI.resetUserPassword(email)
      const extra = result?.action_link ? ` — Recovery link: ${result.action_link}` : ''
      toast({
        title: "Password reset initiated",
        description: `If email delivery is disabled, use the recovery link.${extra}`,
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      toast({
        title: "Error resetting password",
        description: errorMessage,
        variant: "destructive"
      })
      throw err
    }
  }

  const createTeam = async (teamData: any) => {
    try {
      const newTeam = await userAPI.createTeam(teamData)
      setTeams([...teams, newTeam])
      toast({
        title: "Team created",
        description: `Team "${teamData.name}" has been created successfully`,
      })
      return newTeam
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      toast({
        title: "Error creating team",
        description: errorMessage,
        variant: "destructive"
      })
      throw err
    }
  }

  const updateTeam = async (teamId: string, updates: any) => {
    try {
      const updatedTeam = await userAPI.updateTeam(teamId, updates)
      setTeams(teams.map(team => team.id === teamId ? updatedTeam : team))
      toast({
        title: "Team updated",
        description: "Team has been updated successfully",
      })
      return updatedTeam
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      toast({
        title: "Error updating team",
        description: errorMessage,
        variant: "destructive"
      })
      throw err
    }
  }

  const deleteTeam = async (teamId: string) => {
    try {
      await userAPI.deleteTeam(teamId)
      setTeams(teams.filter(team => team.id !== teamId))
      toast({
        title: "Team deleted",
        description: "Team has been deleted successfully",
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      toast({
        title: "Error deleting team",
        description: errorMessage,
        variant: "destructive"
      })
      throw err
    }
  }

  const addUserToTeam = async (teamId: string, userId: string, role: string = 'member') => {
    try {
      await userAPI.addUserToTeam(teamId, userId, role)
      await loadTeams() // Refresh teams
      toast({
        title: "User added to team",
        description: "User has been added to the team successfully",
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      toast({
        title: "Error adding user to team",
        description: errorMessage,
        variant: "destructive"
      })
      throw err
    }
  }

  const removeUserFromTeam = async (teamId: string, userId: string) => {
    try {
      await userAPI.removeUserFromTeam(teamId, userId)
      await loadTeams() // Refresh teams
      toast({
        title: "User removed from team",
        description: "User has been removed from the team successfully",
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      toast({
        title: "Error removing user from team",
        description: errorMessage,
        variant: "destructive"
      })
      throw err
    }
  }

  const updateTeamMemberRole = async (teamId: string, userId: string, newRole: string) => {
    try {
      // Remove the user and add back with new role
      await userAPI.removeUserFromTeam(teamId, userId)
      await userAPI.addUserToTeam(teamId, userId, newRole)
      await loadTeams() // Refresh teams
      toast({
        title: "Member role updated",
        description: "Team member role has been updated successfully",
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      toast({
        title: "Error updating member role",
        description: errorMessage,
        variant: "destructive"
      })
      throw err
    }
  }

  useEffect(() => {
    // Load data immediately
    loadUsers()
    loadTeams()

    // Retry loading after a short delay in case of initial failure
    const retryTimeout = setTimeout(() => {
      if (users.length === 0 && teams.length === 0) {
        console.log('🔄 Retrying data load...')
        loadUsers()
        loadTeams()
      }
    }, 2000)

    // Realtime subscriptions to keep Users & Teams up to date
    const supabase = createClient()
    const profilesChannel = supabase
      .channel('realtime-profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        console.log('🔄 Profiles changed, reloading...')
        loadUsers()
      })
      .subscribe()

    const teamsChannel = supabase
      .channel('realtime-teams')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => {
        console.log('🔄 Teams changed, reloading...')
        loadTeams()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members' }, () => {
        console.log('🔄 Team members changed, reloading...')
        loadTeams()
      })
      .subscribe()

    return () => {
      clearTimeout(retryTimeout)
      try { supabase.removeChannel(profilesChannel) } catch {}
      try { supabase.removeChannel(teamsChannel) } catch {}
    }
  }, [])

  return {
    users,
    teams,
    loading,
    error,
    loadUsers,
    loadTeams,
    inviteUser,
    updateUser,
    deactivateUser,
    reactivateUser,
    resetUserPassword,
    createTeam,
    updateTeam,
    deleteTeam,
    addUserToTeam,
    removeUserFromTeam,
    updateTeamMemberRole
  }
}