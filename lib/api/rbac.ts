import { createClient } from '@/lib/supabase/client'
import type { 
  Role, 
  Permission, 
  UserRole, 
  UserPermission,
  RolePermission,
  UserPermissionsResponse,
  RoleEditFormData
} from '@/lib/types/rbac'

export class RBACApi {
  private supabase = createClient()

  // ===== PERMISSIONS =====
  async getPermissions(): Promise<Permission[]> {
    const { data, error } = await this.supabase
      .from('permissions')
      .select('*')
      .order('module', { ascending: true })
      .order('action', { ascending: true })

    if (error) throw error
    return data || []
  }

  async getPermissionsByModule(): Promise<Record<string, Permission[]>> {
    const permissions = await this.getPermissions()
    return permissions.reduce((acc, permission) => {
      if (!acc[permission.module]) {
        acc[permission.module] = []
      }
      acc[permission.module].push(permission)
      return acc
    }, {} as Record<string, Permission[]>)
  }

  // ===== ROLES =====
  async getRoles(): Promise<Role[]> {
    const { data, error } = await this.supabase
      .from('roles')
      .select(`
        *,
        permissions:role_permissions(
          *,
          permission:permissions(*)
        )
      `)
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  }

  async getRole(roleId: string): Promise<Role | null> {
    const { data, error } = await this.supabase
      .from('roles')
      .select(`
        *,
        permissions:role_permissions(
          *,
          permission:permissions(*)
        )
      `)
      .eq('id', roleId)
      .single()

    if (error) throw error
    return data
  }

  async createRole(roleData: {
    name: string
    description?: string
    permissionIds: string[]
  }): Promise<Role> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Get user's organization
    const { data: profile } = await this.supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!profile) throw new Error('Profile not found')

    // Create role
    const { data: role, error: roleError } = await this.supabase
      .from('roles')
      .insert({
        organization_id: profile.organization_id,
        name: roleData.name,
        description: roleData.description,
        created_by: user.id,
        is_system_role: false
      })
      .select()
      .single()

    if (roleError) throw roleError

    // Assign permissions to role
    if (roleData.permissionIds.length > 0) {
      const rolePermissions = roleData.permissionIds.map(permissionId => ({
        role_id: role.id,
        permission_id: permissionId,
        granted: true
      }))

      const { error: permError } = await this.supabase
        .from('role_permissions')
        .insert(rolePermissions)

      if (permError) throw permError
    }

    return role
  }

  async updateRole(roleId: string, updates: {
    name?: string
    description?: string
    permissionIds?: string[]
  }): Promise<Role> {
    // Update role basic info
    if (updates.name || updates.description) {
      const { error } = await this.supabase
        .from('roles')
        .update({
          name: updates.name,
          description: updates.description,
          updated_at: new Date().toISOString()
        })
        .eq('id', roleId)

      if (error) throw error
    }

    // Update permissions if provided
    if (updates.permissionIds) {
      // Remove existing permissions
      await this.supabase
        .from('role_permissions')
        .delete()
        .eq('role_id', roleId)

      // Add new permissions
      if (updates.permissionIds.length > 0) {
        const rolePermissions = updates.permissionIds.map(permissionId => ({
          role_id: roleId,
          permission_id: permissionId,
          granted: true
        }))

        const { error } = await this.supabase
          .from('role_permissions')
          .insert(rolePermissions)

        if (error) throw error
      }
    }

    // Return updated role
    const updatedRole = await this.getRole(roleId)
    if (!updatedRole) throw new Error('Role not found after update')
    return updatedRole
  }

  async deleteRole(roleId: string): Promise<void> {
    // Check if it's a system role
    const { data: role } = await this.supabase
      .from('roles')
      .select('is_system_role')
      .eq('id', roleId)
      .single()

    if (role?.is_system_role) {
      throw new Error('Cannot delete system roles')
    }

    // Soft delete by setting inactive
    const { error } = await this.supabase
      .from('roles')
      .update({ is_active: false })
      .eq('id', roleId)

    if (error) throw error
  }

  // ===== USER ROLES =====
  async getUserRoles(userId: string): Promise<UserRole[]> {
    const { data, error } = await this.supabase
      .from('user_roles')
      .select(`
        *,
        role:roles(*)
      `)
      .eq('user_id', userId)
      .eq('is_active', true)

    if (error) throw error
    return data || []
  }

  async assignRoleToUser(userId: string, roleId: string): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await this.supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role_id: roleId,
        assigned_by: user.id,
        is_active: true
      })

    if (error) throw error
  }

  async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
    const { error } = await this.supabase
      .from('user_roles')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('role_id', roleId)

    if (error) throw error
  }

  // ===== USER PERMISSIONS =====
  async getUserPermissions(userId: string): Promise<UserPermissionsResponse[]> {
    const { data, error } = await this.supabase
      .rpc('get_user_permissions', { user_uuid: userId })

    if (error) throw error
    return data || []
  }

  async getUserDirectPermissions(userId: string): Promise<UserPermission[]> {
    const { data, error } = await this.supabase
      .from('user_permissions')
      .select(`
        *,
        permission:permissions(*)
      `)
      .eq('user_id', userId)

    if (error) throw error
    return data || []
  }

  async grantPermissionToUser(
    userId: string, 
    permissionId: string, 
    reason?: string
  ): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await this.supabase
      .from('user_permissions')
      .upsert({
        user_id: userId,
        permission_id: permissionId,
        granted: true,
        assigned_by: user.id,
        reason
      })

    if (error) throw error
  }

  async revokePermissionFromUser(
    userId: string, 
    permissionId: string, 
    reason?: string
  ): Promise<void> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await this.supabase
      .from('user_permissions')
      .upsert({
        user_id: userId,
        permission_id: permissionId,
        granted: false,
        assigned_by: user.id,
        reason
      })

    if (error) throw error
  }

  async removeUserPermissionOverride(userId: string, permissionId: string): Promise<void> {
    const { error } = await this.supabase
      .from('user_permissions')
      .delete()
      .eq('user_id', userId)
      .eq('permission_id', permissionId)

    if (error) throw error
  }

  // ===== PERMISSION CHECKING =====
  async hasPermission(userId: string, permissionName: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .rpc('user_has_permission', { 
        user_uuid: userId, 
        permission_name: permissionName 
      })

    if (error) throw error
    return data || false
  }

  async getCurrentUserPermissions(): Promise<UserPermissionsResponse[]> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    return this.getUserPermissions(user.id)
  }

  async currentUserHasPermission(permissionName: string): Promise<boolean> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    return this.hasPermission(user.id, permissionName)
  }

  // ===== HELPER METHODS =====
  
  /**
   * Convert form data with permission levels to actual permission IDs
   */
  async convertFormDataToPermissions(
    formData: RoleEditFormData,
    allPermissions: Permission[]
  ): Promise<string[]> {
    const permissionIds: string[] = []

    Object.entries(formData.permissions).forEach(([module, level]) => {
      if (!level) return

      // Find permissions for this module and level
      const modulePermissions = allPermissions.filter(p => 
        p.module === module && p.resource_pattern === 'all'
      )

      if (level === 'view') {
        const viewPerm = modulePermissions.find(p => p.action === 'view')
        if (viewPerm) permissionIds.push(viewPerm.id)
      } else if (level === 'edit') {
        const viewPerm = modulePermissions.find(p => p.action === 'view')
        const editPerm = modulePermissions.find(p => p.action === 'edit')
        if (viewPerm) permissionIds.push(viewPerm.id)
        if (editPerm) permissionIds.push(editPerm.id)
      } else if (level === 'full_edit') {
        const viewPerm = modulePermissions.find(p => p.action === 'view')
        const editPerm = modulePermissions.find(p => p.action === 'edit')
        const fullEditPerm = modulePermissions.find(p => p.action === 'full_edit')
        if (viewPerm) permissionIds.push(viewPerm.id)
        if (editPerm) permissionIds.push(editPerm.id)
        if (fullEditPerm) permissionIds.push(fullEditPerm.id)
      }
    })

    return permissionIds
  }

  /**
   * Convert role permissions to form data format
   */
  convertRoleToFormData(role: Role): RoleEditFormData {
    const formData: RoleEditFormData = {
      name: role.name,
      description: role.description || '',
      permissions: {}
    }

    if (!role.permissions) return formData

    // Group permissions by module
    const modulePerms: Record<string, string[]> = {}
    role.permissions.forEach(rp => {
      if (rp.granted && rp.permission) {
        const module = rp.permission.module
        if (!modulePerms[module]) modulePerms[module] = []
        modulePerms[module].push(rp.permission.action)
      }
    })

    // Determine permission level for each module
    Object.entries(modulePerms).forEach(([module, actions]) => {
      if (actions.includes('full_edit')) {
        formData.permissions[module] = 'full_edit'
      } else if (actions.includes('edit')) {
        formData.permissions[module] = 'edit'
      } else if (actions.includes('view')) {
        formData.permissions[module] = 'view'
      }
    })

    return formData
  }
}

export const rbacApi = new RBACApi()