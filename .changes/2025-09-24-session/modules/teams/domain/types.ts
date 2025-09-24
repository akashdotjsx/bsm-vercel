export interface Team {
  id: string
  name: string
  description?: string
  created_at?: string
}

export interface TeamMember {
  id: string
  team_id: string
  user_id: string
  role?: string
  created_at?: string
}
