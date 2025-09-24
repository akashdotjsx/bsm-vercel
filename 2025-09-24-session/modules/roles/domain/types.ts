export interface RoleRow {
  id: string
  name: string
  description?: string
  permissions?: Record<string, string>
  created_at?: string
  updated_at?: string
}
