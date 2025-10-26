// User and Team type definitions
// Extracted from lib/api/users.ts for clean separation of types from API implementation

export interface Profile {
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
  avatar_url?: string
  created_at: string
  updated_at: string
}

export type ProfileInsert = Omit<Profile, 'created_at' | 'updated_at'>
export type ProfileUpdate = Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>

export interface UserInviteData {
  email: string
  first_name: string
  last_name: string
  role: 'admin' | 'manager' | 'agent' | 'user'
  department?: string
  manager_id?: string
}

export interface Team {
  id: string
  organization_id: string
  name: string
  description?: string
  department?: string
  lead_id?: string
  is_active: boolean
  created_at: string
  updated_at: string
  // Joined fields
  lead?: {
    id: string
    display_name: string
  }
  organization?: {
    id: string
    name: string
  }
  team_members?: TeamMember[]
}

export interface TeamMember {
  id: string
  team_id: string
  user_id: string
  role: string
  created_at: string
  updated_at: string
  // Joined fields
  user?: {
    id: string
    display_name: string
    email: string
  }
}

export interface CreateTeamData {
  name: string
  description?: string
  department?: string
  lead_id?: string
}

export interface UpdateTeamData {
  name?: string
  description?: string
  department?: string
  lead_id?: string
}

// For backward compatibility with existing code
export type User = Profile

// RBAC Types
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
}

export interface Permission {
  id: string
  name: string
  display_name: string
  description?: string
  module: string
  action: string
  resource_pattern?: string
  is_system_permission: boolean
  created_at: string
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

export interface UserWithRole extends Profile {
  user_roles?: UserRole[]
}
