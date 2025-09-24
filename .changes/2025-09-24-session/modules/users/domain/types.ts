export interface UserProfile {
  id: string
  email: string
  first_name: string
  last_name: string
  display_name?: string
  role?: string
  department?: string
  is_active?: boolean
  avatar_url?: string
  phone?: string
  timezone?: string
  created_at?: string
  updated_at?: string
}
