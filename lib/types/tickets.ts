// Ticket type definitions
// Extracted from lib/api/tickets.ts for clean separation of types from API implementation

export interface Ticket {
  id: string
  ticket_number: string
  title: string
  description?: string
  type: 'request' | 'incident' | 'problem' | 'change' | 'task'
  category?: string
  subcategory?: string
  priority: 'low' | 'medium' | 'high' | 'critical' | 'urgent'
  urgency: 'low' | 'medium' | 'high' | 'critical'
  impact: 'low' | 'medium' | 'high' | 'critical'
  status: 'new' | 'open' | 'in_progress' | 'resolved' | 'closed' | 'on_hold'
  requester_id?: string
  assignee_id?: string
  team_id?: string
  sla_policy_id?: string
  due_date?: string
  first_response_at?: string
  resolved_at?: string
  closed_at?: string
  sla_breached: boolean
  channel: 'web' | 'email' | 'phone' | 'chat'
  source_reference?: string
  escalation_level: number
  ai_sentiment?: string
  ai_confidence?: number
  auto_assigned: boolean
  custom_fields: Record<string, any>
  tags: string[]
  created_at: string
  updated_at: string
  requester?: {
    id: string
    first_name: string
    last_name: string
    display_name: string
    email: string
    avatar_url?: string
  }
  assignee?: {
    id: string
    first_name: string
    last_name: string
    display_name: string
    email: string
    avatar_url?: string
  }
  team?: {
    id: string
    name: string
    description?: string
  }
  sla_policy?: {
    id: string
    name: string
    first_response_time_hours: number
    resolution_time_hours: number
  }
  comments?: TicketComment[]
  attachments?: TicketAttachment[]
  history?: TicketHistory[]
}

export interface TicketComment {
  id: string
  content: string
  is_internal: boolean
  is_system: boolean
  metadata: Record<string, any>
  created_at: string
  author?: {
    id: string
    first_name: string
    last_name: string
    display_name: string
    email: string
    avatar_url?: string
  }
}

export interface TicketAttachment {
  id: string
  filename: string
  file_size: number
  mime_type: string
  storage_path: string
  is_public: boolean
  created_at: string
  uploaded_by?: {
    id: string
    first_name: string
    last_name: string
    display_name: string
    email: string
  }
}

export interface TicketHistory {
  id: string
  field_name: string
  old_value?: string
  new_value?: string
  change_reason?: string
  created_at: string
  changed_by?: {
    id: string
    first_name: string
    last_name: string
    display_name: string
    email: string
  }
}

export interface ChecklistItem {
  id: string
  text: string
  completed: boolean
  due_date?: string
  created_at: string
  updated_at: string
  assignee?: {
    id: string
    first_name: string
    last_name: string
    display_name: string
    email: string
    avatar_url?: string
  }
  created_by?: {
    id: string
    first_name: string
    last_name: string
    display_name: string
    email: string
  }
}

export interface CreateTicketData {
  title: string
  description?: string
  type?: 'request' | 'incident' | 'problem' | 'change' | 'task'
  category?: string
  subcategory?: string
  priority?: 'low' | 'medium' | 'high' | 'critical' | 'urgent'
  urgency?: 'low' | 'medium' | 'high' | 'critical'
  impact?: 'low' | 'medium' | 'high' | 'critical'
  assignee_id?: string
  team_id?: string
  due_date?: string
  tags?: string[]
  custom_fields?: Record<string, any>
  // New: allow creating initial related records in one request
  initial_comments?: Array<{
    content: string
    is_internal?: boolean
  }>
  initial_checklist?: Array<{
    text: string
    completed?: boolean
    assignee_id?: string
    due_date?: string
  }>
}

export interface UpdateTicketData extends Partial<CreateTicketData> {
  status?: 'new' | 'open' | 'in_progress' | 'resolved' | 'closed' | 'on_hold'
}

// Additional types for ticket operations
export interface TicketsParams {
  page?: number
  limit?: number
  status?: string
  priority?: string
  type?: string
  assignee_id?: string
  search?: string
  organization_id?: string
}

export interface TicketsPaginatedResponse {
  tickets: Ticket[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}
