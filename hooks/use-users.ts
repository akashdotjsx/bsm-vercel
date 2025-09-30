import { useState, useEffect } from 'react'
import { userAPI } from '@/lib/api/users'
import { useToast } from '@/hooks/use-toast'

export function useUsers() {
  const [users, setUsers] = useState([])
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { toast } = useToast()

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const userData = await userAPI.getUsers()
      
      setUsers(userData)
    } catch (err) {
      setError(err.message)
      toast({
        title: "Error loading users",
        description: err.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const loadTeams = async () => {
    try {
      const teamData = await userAPI.getTeams()
      setTeams(teamData)
    } catch (err) {
      console.error('Error loading teams:', err)
      toast({
        title: "Error loading teams",
        description: err.message,
        variant: "destructive"
      })
    }
  }

  const inviteUser = async (userData) => {
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
      toast({
        title: "Error inviting user",
        description: err.message,
        variant: "destructive"
      })
      throw err
    }
  }

  const updateUser = async (userId, updates) => {
    try {
      const updatedUser = await userAPI.updateUser(userId, updates)
      setUsers(users.map(user => user.id === userId ? updatedUser : user))
      toast({
        title: "User updated",
        description: "User profile has been updated successfully",
      })
      return updatedUser
    } catch (err) {
      toast({
        title: "Error updating user",
        description: err.message,
        variant: "destructive"
      })
      throw err
    }
  }

  const deactivateUser = async (userId) => {
    try {
      const updatedUser = await userAPI.deactivateUser(userId)
      setUsers(users.map(user => user.id === userId ? updatedUser : user))
      toast({
        title: "User deactivated",
        description: "User has been deactivated successfully",
      })
      return updatedUser
    } catch (err) {
      toast({
        title: "Error deactivating user",
        description: err.message,
        variant: "destructive"
      })
      throw err
    }
  }

  const reactivateUser = async (userId) => {
    try {
      const updatedUser = await userAPI.reactivateUser(userId)
      setUsers(users.map(user => user.id === userId ? updatedUser : user))
      toast({
        title: "User reactivated",
        description: "User has been reactivated successfully",
      })
      return updatedUser
    } catch (err) {
      toast({
        title: "Error reactivating user",
        description: err.message,
        variant: "destructive"
      })
      throw err
    }
  }

  const resetUserPassword = async (email) => {
    try {
      await userAPI.resetUserPassword(email)
      toast({
        title: "Password reset sent",
        description: `Password reset email sent to ${email}`,
      })
    } catch (err) {
      toast({
        title: "Error resetting password",
        description: err.message,
        variant: "destructive"
      })
      throw err
    }
  }

  const createTeam = async (teamData) => {
    try {
      const newTeam = await userAPI.createTeam(teamData)
      setTeams([...teams, newTeam])
      toast({
        title: "Team created",
        description: `Team "${teamData.name}" has been created successfully`,
      })
      return newTeam
    } catch (err) {
      toast({
        title: "Error creating team",
        description: err.message,
        variant: "destructive"
      })
      throw err
    }
  }

  const addUserToTeam = async (teamId, userId, role = 'member') => {
    try {
      await userAPI.addUserToTeam(teamId, userId, role)
      await loadTeams() // Refresh teams
      toast({
        title: "User added to team",
        description: "User has been added to the team successfully",
      })
    } catch (err) {
      toast({
        title: "Error adding user to team",
        description: err.message,
        variant: "destructive"
      })
      throw err
    }
  }

  useEffect(() => {
    loadUsers()
    loadTeams()
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
    addUserToTeam
  }
}