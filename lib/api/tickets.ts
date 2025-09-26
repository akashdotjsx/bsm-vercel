import { createClient } from '@/lib/supabase/client'

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
}

export interface UpdateTicketData extends Partial<CreateTicketData> {
  status?: 'new' | 'open' | 'in_progress' | 'resolved' | 'closed' | 'on_hold'
}

export class TicketAPI {
  private supabase = createClient()

  // Get tickets with pagination and filters
  async getTickets(params: {
    page?: number
    limit?: number
    status?: string
    priority?: string
    type?: string
    assignee_id?: string
    search?: string
  } = {}) {
    const searchParams = new URLSearchParams()
    
    if (params.page) searchParams.set('page', params.page.toString())
    if (params.limit) searchParams.set('limit', params.limit.toString())
    if (params.status) searchParams.set('status', params.status)
    if (params.priority) searchParams.set('priority', params.priority)
    if (params.type) searchParams.set('type', params.type)
    if (params.assignee_id) searchParams.set('assignee_id', params.assignee_id)
    if (params.search) searchParams.set('search', params.search)

    const response = await fetch(`/api/tickets?${searchParams.toString()}`)
    if (!response.ok) {
      throw new Error('Failed to fetch tickets')
    }
    return response.json()
  }

  // Get single ticket
  async getTicket(id: string): Promise<Ticket> {
    const response = await fetch(`/api/tickets/${id}`)
    if (!response.ok) {
      throw new Error('Failed to fetch ticket')
    }
    const data = await response.json()
    return data.ticket
  }

  // Create ticket
  async createTicket(data: CreateTicketData): Promise<Ticket> {
    const response = await fetch('/api/tickets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create ticket')
    }

    const result = await response.json()
    return result.ticket
  }

  // Update ticket
  async updateTicket(id: string, data: UpdateTicketData): Promise<Ticket> {
    const response = await fetch(`/api/tickets/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update ticket')
    }

    const result = await response.json()
    return result.ticket
  }

  // Delete ticket
  async deleteTicket(id: string): Promise<void> {
    const response = await fetch(`/api/tickets/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete ticket')
    }
  }

  // Get ticket comments
  async getComments(ticketId: string): Promise<TicketComment[]> {
    const response = await fetch(`/api/tickets/${ticketId}/comments`)
    if (!response.ok) {
      throw new Error('Failed to fetch comments')
    }
    const data = await response.json()
    return data.comments
  }

  // Add comment
  async addComment(ticketId: string, content: string, isInternal = false): Promise<TicketComment> {
    const response = await fetch(`/api/tickets/${ticketId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content, is_internal: isInternal }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to add comment')
    }

    const result = await response.json()
    return result.comment
  }

  // Get ticket attachments
  async getAttachments(ticketId: string): Promise<TicketAttachment[]> {
    const response = await fetch(`/api/tickets/${ticketId}/attachments`)
    if (!response.ok) {
      throw new Error('Failed to fetch attachments')
    }
    const data = await response.json()
    return data.attachments
  }

  // Upload attachment
  async uploadAttachment(ticketId: string, file: File, isPublic = false): Promise<TicketAttachment> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('is_public', isPublic.toString())

    const response = await fetch(`/api/tickets/${ticketId}/attachments`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to upload attachment')
    }

    const result = await response.json()
    return result.attachment
  }

  // Download attachment
  async downloadAttachment(ticketId: string, attachmentId: string): Promise<Blob> {
    const response = await fetch(`/api/tickets/${ticketId}/attachments/${attachmentId}/download`)
    if (!response.ok) {
      throw new Error('Failed to download attachment')
    }
    return response.blob()
  }

  // Get ticket checklist
  async getChecklist(ticketId: string): Promise<ChecklistItem[]> {
    const response = await fetch(`/api/tickets/${ticketId}/checklist`)
    if (!response.ok) {
      throw new Error('Failed to fetch checklist')
    }
    const data = await response.json()
    return data.checklist
  }

  // Add checklist item
  async addChecklistItem(ticketId: string, text: string, assigneeId?: string, dueDate?: string): Promise<ChecklistItem> {
    const response = await fetch(`/api/tickets/${ticketId}/checklist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, assignee_id: assigneeId, due_date: dueDate }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to add checklist item')
    }

    const result = await response.json()
    return result.checklistItem
  }

  // Update checklist item
  async updateChecklistItem(ticketId: string, itemId: string, updates: {
    text?: string
    completed?: boolean
    assignee_id?: string
    due_date?: string
  }): Promise<ChecklistItem> {
    const response = await fetch(`/api/tickets/${ticketId}/checklist/${itemId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update checklist item')
    }

    const result = await response.json()
    return result.checklistItem
  }

  // Delete checklist item
  async deleteChecklistItem(ticketId: string, itemId: string): Promise<void> {
    const response = await fetch(`/api/tickets/${ticketId}/checklist/${itemId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete checklist item')
    }
  }

  // Get linked accounts
  async getLinkedAccounts(ticketId: string) {
    const response = await fetch(`/api/tickets/${ticketId}/accounts`)
    if (!response.ok) {
      throw new Error('Failed to fetch linked accounts')
    }
    const data = await response.json()
    return data.accounts
  }

  // Link account
  async linkAccount(ticketId: string, accountId: string) {
    const response = await fetch(`/api/tickets/${ticketId}/accounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ account_id: accountId }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to link account')
    }

    const result = await response.json()
    return result.account
  }

  // Search profiles for account linking
  async searchProfiles(query: string, department?: string, role?: string) {
    const searchParams = new URLSearchParams()
    searchParams.set('search', query)
    if (department) searchParams.set('department', department)
    if (role) searchParams.set('role', role)

    const response = await fetch(`/api/profiles?${searchParams.toString()}`)
    if (!response.ok) {
      throw new Error('Failed to search profiles')
    }
    const data = await response.json()
    return data.profiles
  }
}

export const ticketAPI = new TicketAPI()
