export interface Organization {
  id: string
  name: string
  created_at?: string
  updated_at?: string
}

export interface OrgMembership {
  id: string
  organization_id: string
  user_id: string
  role: string
  created_at?: string
}
