// RBAC Type definitions
export type PermissionAction = 'view' | 'edit' | 'full_edit' | 'create' | 'delete' | 'manage'

export type ResourceModule = 
  | 'tickets' 
  | 'services' 
  | 'users' 
  | 'analytics' 
  | 'security'
  | 'knowledge_base' 
  | 'assets' 
  | 'reports' 
  | 'integrations'
  | 'administration' 
  | 'workflows' 
  | 'sla_policies' 
  | 'teams'

export type ResourcePattern = 'all' | 'own' | 'team' | null

export interface Permission {
  id: string
  name: string // e.g., 'tickets.full_edit'
  display_name: string // e.g., 'Full Edit Tickets'
  description?: string
  module: ResourceModule
  action: PermissionAction
  resource_pattern?: ResourcePattern
  is_system_permission: boolean
  created_at: string
}

export interface Role {
  id: string
  organization_id: string
  name: string
  description?: string
  is_system_role: boolean
  is_active: boolean
  created_by?: string
  created_at: string
  updated_at: string
  permissions?: RolePermission[]
}

export interface RolePermission {
  id: string
  role_id: string
  permission_id: string
  granted: boolean
  created_at: string
  permission?: Permission
}

export interface UserRole {
  id: string
  user_id: string
  role_id: string
  assigned_by?: string
  assigned_at: string
  expires_at?: string
  is_active: boolean
  role?: Role
}

export interface UserPermission {
  id: string
  user_id: string
  permission_id: string
  granted: boolean
  assigned_by?: string
  assigned_at: string
  expires_at?: string
  reason?: string
  permission?: Permission
}

// Helper types for the UI
export interface ModulePermissions {
  module: ResourceModule
  displayName: string
  permissions: {
    permission: Permission
    granted: boolean
    level: 'view' | 'edit' | 'full_edit'
  }[]
}

export interface PermissionLevel {
  value: 'view' | 'edit' | 'full_edit'
  label: string
  description: string
}

export const PERMISSION_LEVELS: PermissionLevel[] = [
  {
    value: 'view',
    label: 'View only',
    description: 'Read-only. Can\'t edit or delete.'
  },
  {
    value: 'edit',
    label: 'Edit',
    description: 'Can edit but can\'t delete'
  },
  {
    value: 'full_edit',
    label: 'Full Edit',
    description: 'Can edit and delete'
  }
]

export const MODULE_DISPLAY_NAMES: Record<ResourceModule, string> = {
  tickets: 'Tickets',
  services: 'Services',
  users: 'Users',
  analytics: 'Analytics',
  security: 'Security',
  knowledge_base: 'Knowledge Base',
  assets: 'Assets',
  reports: 'Reports',
  integrations: 'Integrations',
  administration: 'Administration',
  workflows: 'Workflows',
  sla_policies: 'SLA Policies',
  teams: 'Teams'
}

// API response types
export interface UserPermissionsResponse {
  permission_name: string
  granted: boolean
  source: string // 'role:RoleName' or 'user_override'
}

export interface RoleEditFormData {
  name: string
  description: string
  permissions: Record<string, PermissionAction | null> // module -> action level
}