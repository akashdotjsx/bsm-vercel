import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/database/types"

type Tables = Database["public"]["Tables"]
type Ticket = Tables["tickets"]["Row"]
type Profile = Tables["profiles"]["Row"]
type Asset = Tables["assets"]["Row"]
type ServiceRequest = Tables["service_requests"]["Row"]
type KnowledgeBaseArticle = Tables["knowledge_base_articles"]["Row"]

export class DatabaseOperations {
  private supabase = createClient()

  // Ticket Operations
  async getTickets(filters?: {
    status?: string
    priority?: string
    assignee_id?: string
    organization_id?: string
    limit?: number
    offset?: number
  }) {
    let query = this.supabase
      .from("tickets")
      .select(`
        *,
        requester:profiles!tickets_requester_id_fkey(id, first_name, last_name, email, avatar_url),
        assignee:profiles!tickets_assignee_id_fkey(id, first_name, last_name, email, avatar_url),
        organization:organizations(id, name),
        comments:ticket_comments(count),
        attachments:ticket_attachments(count)
      `)
      .order("created_at", { ascending: false })

    if (filters?.status) query = query.eq("status", filters.status)
    if (filters?.priority) query = query.eq("priority", filters.priority)
    if (filters?.assignee_id) query = query.eq("assignee_id", filters.assignee_id)
    if (filters?.organization_id) query = query.eq("organization_id", filters.organization_id)
    if (filters?.limit) query = query.limit(filters.limit)
    if (filters?.offset) query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)

    const { data, error } = await query
    if (error) throw error
    return data
  }

  async createTicket(ticket: Omit<Ticket, "id" | "created_at" | "updated_at" | "ticket_number">) {
    // Generate ticket number
    const ticketNumber = await this.generateTicketNumber(ticket.type || "incident")

    const { data, error } = await this.supabase
      .from("tickets")
      .insert({ ...ticket, ticket_number: ticketNumber })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateTicket(id: string, updates: Partial<Ticket>) {
    const { data, error } = await this.supabase.from("tickets").update(updates).eq("id", id).select().single()

    if (error) throw error
    return data
  }

  private async generateTicketNumber(type: string): Promise<string> {
    const prefix = type.toUpperCase().substring(0, 3)
    const year = new Date().getFullYear()

    // Get the last ticket number for this type and year
    const { data } = await this.supabase
      .from("tickets")
      .select("ticket_number")
      .like("ticket_number", `${prefix}-${year}-%`)
      .order("ticket_number", { ascending: false })
      .limit(1)

    let nextNumber = 1
    if (data && data.length > 0) {
      const lastNumber = Number.parseInt(data[0].ticket_number.split("-")[2])
      nextNumber = lastNumber + 1
    }

    return `${prefix}-${year}-${nextNumber.toString().padStart(3, "0")}`
  }

  // User Operations
  async getUsers(filters?: {
    organization_id?: string
    department?: string
    role?: string
    is_active?: boolean
  }) {
    let query = this.supabase
      .from("profiles")
      .select(`
        *,
        organization:organizations(id, name)
      `)
      .order("first_name", { ascending: true })

    if (filters?.organization_id) query = query.eq("organization_id", filters.organization_id)
    if (filters?.department) query = query.eq("department", filters.department)
    if (filters?.role) query = query.eq("role", filters.role)
    if (filters?.is_active !== undefined) query = query.eq("is_active", filters.is_active)

    const { data, error } = await query
    if (error) throw error
    return data
  }

  async createUser(user: Omit<Profile, "id" | "created_at" | "updated_at">) {
    const { data, error } = await this.supabase.from("profiles").insert(user).select().single()

    if (error) throw error
    return data
  }

  // Asset Operations
  async getAssets(filters?: {
    category?: string
    status?: string
    owner_id?: string
    organization_id?: string
  }) {
    let query = this.supabase
      .from("assets")
      .select(`
        *,
        owner:profiles!assets_owner_id_fkey(id, first_name, last_name, email, department)
      `)
      .order("name", { ascending: true })

    if (filters?.category) query = query.eq("category", filters.category)
    if (filters?.status) query = query.eq("status", filters.status)
    if (filters?.owner_id) query = query.eq("owner_id", filters.owner_id)
    if (filters?.organization_id) query = query.eq("organization_id", filters.organization_id)

    const { data, error } = await query
    if (error) throw error
    return data
  }

  async createAsset(asset: Omit<Asset, "id" | "created_at" | "updated_at" | "asset_id">) {
    // Generate asset ID
    const assetId = await this.generateAssetId(asset.category)

    const { data, error } = await this.supabase
      .from("assets")
      .insert({ ...asset, asset_id: assetId })
      .select()
      .single()

    if (error) throw error
    return data
  }

  private async generateAssetId(category: string): Promise<string> {
    const prefix = category.toUpperCase().substring(0, 3)

    // Get the last asset ID for this category
    const { data } = await this.supabase
      .from("assets")
      .select("asset_id")
      .like("asset_id", `${prefix}-%`)
      .order("asset_id", { ascending: false })
      .limit(1)

    let nextNumber = 1
    if (data && data.length > 0) {
      const lastNumber = Number.parseInt(data[0].asset_id.split("-")[1])
      nextNumber = lastNumber + 1
    }

    return `${prefix}-${nextNumber.toString().padStart(3, "0")}`
  }

  // Service Request Operations
  async getServiceRequests(filters?: {
    status?: string
    requestor_id?: string
    organization_id?: string
  }) {
    let query = this.supabase
      .from("service_requests")
      .select(`
        *,
        requestor:profiles!service_requests_requestor_id_fkey(id, first_name, last_name, email, department)
      `)
      .order("created_at", { ascending: false })

    if (filters?.status) query = query.eq("status", filters.status)
    if (filters?.requestor_id) query = query.eq("requestor_id", filters.requestor_id)
    if (filters?.organization_id) query = query.eq("organization_id", filters.organization_id)

    const { data, error } = await query
    if (error) throw error
    return data
  }

  // Knowledge Base Operations
  async getKnowledgeBaseArticles(filters?: {
    category_id?: string
    status?: string
    organization_id?: string
  }) {
    let query = this.supabase
      .from("knowledge_base_articles")
      .select(`
        *,
        category:knowledge_base_categories(id, name, slug),
        author:profiles!knowledge_base_articles_author_id_fkey(id, first_name, last_name)
      `)
      .order("created_at", { ascending: false })

    if (filters?.category_id) query = query.eq("category_id", filters.category_id)
    if (filters?.status) query = query.eq("status", filters.status)
    if (filters?.organization_id) query = query.eq("organization_id", filters.organization_id)

    const { data, error } = await query
    if (error) throw error

    return data
  }

  // Dashboard Analytics
  async getDashboardStats(organization_id?: string) {
    const filters = organization_id ? { organization_id } : {}

    const [tickets, assets, serviceRequests, users] = await Promise.all([
      this.getTicketStats(filters),
      this.getAssetStats(filters),
      this.getServiceRequestStats(filters),
      this.getUserStats(filters),
    ])

    return {
      tickets,
      assets,
      serviceRequests,
      users,
    }
  }

  private async getTicketStats(filters: { organization_id?: string }) {
    let query = this.supabase.from("tickets").select("status, priority, created_at")

    if (filters.organization_id) query = query.eq("organization_id", filters.organization_id)

    const { data, error } = await query
    if (error) throw error

    const stats = {
      total: data.length,
      open: data.filter((t) => ["new", "open", "in_progress"].includes(t.status)).length,
      resolved: data.filter((t) => t.status === "resolved").length,
      critical: data.filter((t) => t.priority === "critical").length,
      overdue: 0, // Would need SLA calculation
    }

    return stats
  }

  private async getAssetStats(filters: { organization_id?: string }) {
    let query = this.supabase.from("assets").select("status, category")

    if (filters.organization_id) query = query.eq("organization_id", filters.organization_id)

    const { data, error } = await query
    if (error) throw error

    const stats = {
      total: data.length,
      active: data.filter((a) => a.status === "active").length,
      maintenance: data.filter((a) => a.status === "maintenance").length,
      retired: data.filter((a) => a.status === "retired").length,
    }

    return stats
  }

  private async getServiceRequestStats(filters: { organization_id?: string }) {
    let query = this.supabase.from("service_requests").select("status")

    if (filters.organization_id) query = query.eq("organization_id", filters.organization_id)

    const { data, error } = await query
    if (error) throw error

    const stats = {
      total: data.length,
      pending: data.filter((r) => r.status === "pending").length,
      approved: data.filter((r) => r.status === "approved").length,
      completed: data.filter((r) => r.status === "completed").length,
    }

    return stats
  }

  private async getUserStats(filters: { organization_id?: string }) {
    let query = this.supabase.from("profiles").select("is_active, role")

    if (filters.organization_id) query = query.eq("organization_id", filters.organization_id)

    const { data, error } = await query
    if (error) throw error

    const stats = {
      total: data.length,
      active: data.filter((u) => u.is_active).length,
      admins: data.filter((u) => u.role === "admin").length,
      agents: data.filter((u) => u.role === "agent").length,
    }

    return stats
  }
}

export const db = new DatabaseOperations()
