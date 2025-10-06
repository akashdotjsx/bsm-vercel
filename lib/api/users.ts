import { createClient } from "@/lib/supabase/client"

type Profile = {
  id: string
  organization_id: string
  email: string
  first_name?: string
  last_name?: string
  display_name?: string
  role: 'admin' | 'manager' | 'agent' | 'user'
  department?: string
  manager_id?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

type ProfileInsert = Omit<Profile, 'created_at' | 'updated_at'>
type ProfileUpdate = Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>

type UserInviteData = {
  email: string
  first_name: string
  last_name: string
  role: 'admin' | 'manager' | 'agent' | 'user'
  department?: string
  manager_id?: string
}

export class UserManagementAPI {
  private supabase = createClient()

  // Get all users in the current organization
  async getUsers() {
    try {
      console.log('🔄 Fetching users from Supabase...')
      console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
      console.log('Supabase Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      
      // Always fetch all users first, then filter by organization if possible
      const { data: profiles, error } = await this.supabase
        .from('profiles')
        .select(`
          *,
          organization:organizations(id, name),
          manager:profiles!manager_id(id, display_name)
        `)
        .order('created_at', { ascending: false })

      console.log('📊 Profiles query result:', { 
        dataCount: profiles?.length || 0, 
        error: error?.message || 'None',
        hasData: !!profiles
      })
      
      if (error) {
        console.error('❌ Supabase error:', error)
        // Don't throw error, return empty array instead
        return []
      }
      
      console.log('✅ Successfully fetched users:', profiles?.length || 0)
      return profiles || []
    } catch (error) {
      console.error('❌ Error fetching users:', error)
      // Return empty array instead of throwing to prevent UI crashes
      return []
    }
  }

  // Get current user's organization ID
  async getCurrentUserOrgId() {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: profile, error } = await this.supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (error) throw error
      return profile.organization_id
    } catch (error) {
      console.error('Error getting user org ID:', error)
      throw error
    }
  }

  // Invite a new user - creates user via server endpoint
  async inviteUser(userData: UserInviteData) {
    try {
      // Get the organization ID
      const orgId = await this.getCurrentUserOrgId()
      
      // Check if user already exists with this email
      const { data: existingUsers } = await this.supabase
        .from('profiles')
        .select('email')
        .eq('email', userData.email)
        .eq('organization_id', orgId)

      if (existingUsers && existingUsers.length > 0) {
        throw new Error('A user with this email already exists in your organization')
      }

      // Try the API endpoint first
      try {
        const response = await fetch('/api/create-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...userData,
            organization_id: orgId
          }),
        })

        if (response.ok) {
          const result = await response.json()
          return {
            success: true,
            message: `User ${userData.email} has been invited successfully. They will receive an email to set up their account.`,
            user: result.profile
          }
        }
      } catch (apiError) {
        console.log('API endpoint not available, falling back to demonstration mode')
      }

      // If API endpoint is not available, throw an error
      throw new Error('User creation API endpoint is not available. Please implement the /api/create-user endpoint to create new users.')
    } catch (error) {
      console.error('Error inviting user:', error)
      throw error
    }
  }

  // Generate a secure temporary password
  private generateTempPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let result = ''
    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  // Update user profile
  async updateUser(userId: string, updates: ProfileUpdate) {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating user:', error)
      throw error
    }
  }

  // Deactivate user (soft delete)
  async deactivateUser(userId: string) {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .update({ is_active: false })
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error deactivating user:', error)
      throw error
    }
  }

  // Reactivate user
  async reactivateUser(userId: string) {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .update({ is_active: true })
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error reactivating user:', error)
      throw error
    }
  }

  // Reset user password
  async resetUserPassword(email: string) {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Error resetting password:', error)
      throw error
    }
  }

  // Get teams
  async getTeams() {
    try {
      console.log('🔄 Fetching teams from Supabase...')
      
      // Always fetch all teams first
      const { data: teams, error } = await this.supabase
        .from('teams')
        .select(`
          *,
          lead:profiles!lead_id(id, display_name),
          organization:organizations(id, name),
          team_members(
            id,
            role,
            user:profiles(id, display_name, email)
          )
        `)
        .order('name', { ascending: true })

      console.log('📊 Teams query result:', { 
        dataCount: teams?.length || 0, 
        error: error?.message || 'None',
        hasData: !!teams
      })
      
      if (error) {
        console.error('❌ Supabase teams error:', error)
        // Don't throw error, return empty array instead
        return []
      }
      
      console.log('✅ Successfully fetched teams:', teams?.length || 0)
      return teams || []
    } catch (error) {
      console.error('❌ Error fetching teams:', error)
      // Return empty array instead of throwing to prevent UI crashes
      return []
    }
  }

  // Create team
  async createTeam(teamData: {
    name: string
    description?: string
    department?: string
    lead_id?: string
  }) {
    try {
      const orgId = await this.getCurrentUserOrgId()

      const { data, error } = await this.supabase
        .from('teams')
        .insert({
          ...teamData,
          organization_id: orgId,
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating team:', error)
      throw error
    }
  }

  // Update team
  async updateTeam(teamId: string, updates: {
    name?: string
    description?: string
    department?: string
    lead_id?: string
  }) {
    try {
      const { data, error } = await this.supabase
        .from('teams')
        .update(updates)
        .eq('id', teamId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating team:', error)
      throw error
    }
  }

  // Delete team (soft delete by setting inactive)
  async deleteTeam(teamId: string) {
    try {
      const { data, error } = await this.supabase
        .from('teams')
        .update({ is_active: false })
        .eq('id', teamId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error deleting team:', error)
      throw error
    }
  }

  // Add user to team
  async addUserToTeam(teamId: string, userId: string, role: string = 'member') {
    try {
      const { data, error } = await this.supabase
        .from('team_members')
        .insert({
          team_id: teamId,
          user_id: userId,
          role,
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error adding user to team:', error)
      throw error
    }
  }

  // Remove user from team
  async removeUserFromTeam(teamId: string, userId: string) {
    try {
      const { error } = await this.supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', userId)

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Error removing user from team:', error)
      throw error
    }
  }
}

export const userAPI = new UserManagementAPI()