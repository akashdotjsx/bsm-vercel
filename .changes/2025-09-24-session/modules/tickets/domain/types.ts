export type TicketPriority = "Low" | "Medium" | "High" | "Critical"
export type TicketStatus = "Open" | "In Progress" | "Resolved" | "Closed" | "On Hold" | "Canceled"
export type TicketChannel = "web" | "email" | "phone" | "chat" | "api" | "portal" | "mobile"

export interface Ticket {
  id?: string
  ticket_number?: string
  title: string
  description?: string
  status: TicketStatus
  priority: TicketPriority
  type: string
  category?: string
  subcategory?: string
  urgency?: string
  impact?: string
  severity?: string
  channel?: TicketChannel
  requester_id?: string | null
  assignee_id?: string | null
  organization_id?: string | null
  due_date?: string | null
  created_at?: string
  updated_at?: string
}
