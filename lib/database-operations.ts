import { createBrowserClient } from "@supabase/ssr"

interface QueryOptions {
  limit?: number
  offset?: number
  orderBy?: string
  orderDirection?: "asc" | "desc"
  search?: string
  filters?: Record<string, any>
}

interface TicketData {
  id?: string
  ticket_number?: string
  title: string
  description?: string
  status: string
  priority: string
  type: string
  category?: string
  subcategory?: string
  urgency?: string
  impact?: string
  severity?: string
  channel?: string
  requester_id?: string
  assignee_id?: string
  organization_id?: string
  due_date?: string
  created_at?: string
  updated_at?: string
}

interface UserData {
  id?: string
  first_name: string
  last_name: string
  email: string
  role_id?: string
  department_id?: string
  status?: string
  created_at?: string
  updated_at?: string
}

interface AssetData {
  id?: string
  name: string
  asset_tag: string
  category: string
  status: string
  location?: string
  assigned_to_id?: string
  purchase_date?: string
  warranty_expiry?: string
  created_at?: string
  updated_at?: string
}

interface KnowledgeArticleData {
  id?: string
  title: string
  content: string
  summary?: string
  category_id?: string
  author_id?: string
  status: string
  view_count?: number
  created_at?: string
  updated_at?: string
}

interface RoleData {
  id?: string
  name: string
  description?: string
  permissions?: Record<string, string>
  created_at?: string
  updated_at?: string
}

class DatabaseOperations {
  private static instance: DatabaseOperations
  private supabase: any

  private constructor() {
    this.supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
  }

  public static getInstance(): DatabaseOperations {
    if (!DatabaseOperations.instance) {
      DatabaseOperations.instance = new DatabaseOperations()
    }
    return DatabaseOperations.instance
  }

  // Ticket Operations
  async getTickets(options: QueryOptions = {}): Promise<any[]> {
    try {
      let query = this.supabase.from("tickets").select(`
          *,
          requester:profiles!tickets_requester_id_fkey(id, first_name, last_name, email, department),
          assignee:profiles!tickets_assignee_id_fkey(id, first_name, last_name, email, department),
          organization:organizations(id, name)
        `)

      if (options.search) {
        query = query.or(
          `title.ilike.%${options.search}%,description.ilike.%${options.search}%,ticket_number.ilike.%${options.search}%`,
        )
      }

      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value)
          }
        })
      }

      if (options.orderBy) {
        query = query.order(options.orderBy, { ascending: options.orderDirection === "asc" })
      } else {
        query = query.order("created_at", { ascending: false })
      }

      if (options.limit) {
        query = query.limit(options.limit)
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
      }

      const { data, error } = await query

      if (error) {
        console.error("[v0] Error fetching tickets:", error)
        return []
      }

      return data || []
    } catch (error) {
      console.error("[v0] Database error in getTickets:", error)
      return []
    }
  }

  async createTicket(ticketData: TicketData): Promise<any> {
    try {
      const { data, error } = await this.supabase.from("tickets").insert([ticketData]).select().single()

      if (error) {
        console.error("[v0] Error creating ticket:", error)
        throw error
      }

      return data
    } catch (error) {
      console.error("[v0] Database error in createTicket:", error)
      throw error
    }
  }

  async updateTicket(id: string, updates: Partial<TicketData>): Promise<any> {
    try {
      const { data, error } = await this.supabase.from("tickets").update(updates).eq("id", id).select().single()

      if (error) {
        console.error("[v0] Error updating ticket:", error)
        throw error
      }

      return data
    } catch (error) {
      console.error("[v0] Database error in updateTicket:", error)
      throw error
    }
  }

  async getNextTicketNumber(): Promise<number> {
    try {
      // Get the highest ticket number from existing tickets
      const { data, error } = await this.supabase
        .from("tickets")
        .select("ticket_number")
        .order("created_at", { ascending: false })
        .limit(1)

      if (error) {
        console.error("[v0] Error getting next ticket number:", error)
        // If there's an error, start from 1
        return 1
      }

      if (!data || data.length === 0) {
        // No tickets exist yet, start from 1
        return 1
      }

      // Extract number from ticket_number (format: TK-0001)
      const lastTicketNumber = data[0].ticket_number
      const numberMatch = lastTicketNumber.match(/TK-(\d+)/)

      if (numberMatch) {
        const lastNumber = Number.parseInt(numberMatch[1], 10)
        return lastNumber + 1
      }

      // If format doesn't match, start from 1
      return 1
    } catch (error) {
      console.error("[v0] Database error in getNextTicketNumber:", error)
      // If there's any error, start from 1
      return 1
    }
  }

  // User Operations
  async getUsers(options: QueryOptions = {}): Promise<any[]> {
    try {
      let query = this.supabase.from("profiles").select(`
          id,
          first_name,
          last_name,
          email,
          role,
          department,
          is_active,
          avatar_url,
          phone,
          timezone,
          display_name,
          created_at,
          updated_at
        `)

      if (options.search) {
        query = query.or(
          `first_name.ilike.%${options.search}%,last_name.ilike.%${options.search}%,email.ilike.%${options.search}%`,
        )
      }

      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value)
          }
        })
      }

      if (options.orderBy) {
        query = query.order(options.orderBy, { ascending: options.orderDirection === "asc" })
      } else {
        query = query.order("created_at", { ascending: false })
      }

      if (options.limit) {
        query = query.limit(options.limit)
      }

      const { data, error } = await query

      if (error) {
        console.error("[v0] Error fetching users:", error)
        return []
      }

      return data || []
    } catch (error) {
      console.error("[v0] Database error in getUsers:", error)
      return []
    }
  }

  async createUser(userData: UserData): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from("profiles")
        .insert([
          {
            first_name: userData.first_name,
            last_name: userData.last_name,
            email: userData.email,
            role: userData.role_id || "user",
            department: userData.department_id || "General",
            is_active: true,
            display_name: `${userData.first_name} ${userData.last_name}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single()

      if (error) {
        console.error("[v0] Error creating user:", error)
        throw error
      }

      return data
    } catch (error) {
      console.error("[v0] Database error in createUser:", error)
      throw error
    }
  }

  // Asset Operations
  async getAssets(options: QueryOptions = {}): Promise<any[]> {
    try {
      let query = this.supabase.from("assets").select(`
          *,
          assigned_to:profiles!assigned_to_id(id, first_name, last_name, email, department),
          asset_category:asset_categories(id, name)
        `)

      if (options.search) {
        query = query.or(
          `name.ilike.%${options.search}%,asset_tag.ilike.%${options.search}%,category.ilike.%${options.search}%`,
        )
      }

      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value)
          }
        })
      }

      if (options.orderBy) {
        query = query.order(options.orderBy, { ascending: options.orderDirection === "asc" })
      } else {
        query = query.order("created_at", { ascending: false })
      }

      if (options.limit) {
        query = query.limit(options.limit)
      }

      const { data, error } = await query

      if (error) {
        console.error("[v0] Error fetching assets:", error)
        return []
      }

      return data || []
    } catch (error) {
      console.error("[v0] Database error in getAssets:", error)
      return []
    }
  }

  async createAsset(assetData: AssetData): Promise<any> {
    try {
      const { data, error } = await this.supabase.from("assets").insert([assetData]).select().single()

      if (error) {
        console.error("[v0] Error creating asset:", error)
        throw error
      }

      return data
    } catch (error) {
      console.error("[v0] Database error in createAsset:", error)
      throw error
    }
  }

  // Knowledge Base Operations
  async getKnowledgeArticles(options: QueryOptions = {}): Promise<any[]> {
    try {
      let query = this.supabase.from("knowledge_articles").select(`
          *,
          author:profiles!knowledge_articles_author_id_fkey(id, first_name, last_name, email),
          category:knowledge_categories(id, name)
        `)

      if (options.search) {
        query = query.or(
          `title.ilike.%${options.search}%,content.ilike.%${options.search}%,summary.ilike.%${options.search}%`,
        )
      }

      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value)
          }
        })
      }

      if (options.orderBy) {
        query = query.order(options.orderBy, { ascending: options.orderDirection === "asc" })
      } else {
        query = query.order("created_at", { ascending: false })
      }

      if (options.limit) {
        query = query.limit(options.limit)
      }

      const { data, error } = await query

      if (error) {
        console.error("[v0] Error fetching knowledge articles:", error)
        return []
      }

      return data || []
    } catch (error) {
      console.error("[v0] Database error in getKnowledgeArticles:", error)
      return []
    }
  }

  async createKnowledgeArticle(articleData: KnowledgeArticleData): Promise<any> {
    try {
      const { data, error } = await this.supabase.from("knowledge_articles").insert([articleData]).select().single()

      if (error) {
        console.error("[v0] Error creating knowledge article:", error)
        throw error
      }

      return data
    } catch (error) {
      console.error("[v0] Database error in createKnowledgeArticle:", error)
      throw error
    }
  }

  // Role Operations
  async getRoles(options: QueryOptions = {}): Promise<any[]> {
    try {
      let query = this.supabase.from("roles").select("*")

      if (options.search) {
        query = query.or(`name.ilike.%${options.search}%,description.ilike.%${options.search}%`)
      }

      if (options.orderBy) {
        query = query.order(options.orderBy, { ascending: options.orderDirection === "asc" })
      } else {
        query = query.order("name", { ascending: true })
      }

      if (options.limit) {
        query = query.limit(options.limit)
      }

      const { data, error } = await query

      if (error) {
        console.error("[v0] Error fetching roles:", error)
        return []
      }

      return data || []
    } catch (error) {
      console.error("[v0] Database error in getRoles:", error)
      return []
    }
  }

  async updateRole(id: string, updates: Partial<RoleData>): Promise<any> {
    try {
      const { data, error } = await this.supabase.from("roles").update(updates).eq("id", id).select().single()

      if (error) {
        console.error("[v0] Error updating role:", error)
        throw error
      }

      return data
    } catch (error) {
      console.error("[v0] Database error in updateRole:", error)
      throw error
    }
  }

  // Analytics Operations
  async getTicketAnalytics(
    options: {
      startDate?: string
      endDate?: string
      department?: string
    } = {},
  ): Promise<any> {
    try {
      let query = this.supabase.from("tickets").select(`
          *,
          requester:profiles!tickets_requester_id_fkey(id, first_name, last_name, email, department),
          assignee:profiles!tickets_assignee_id_fkey(id, first_name, last_name, email, department),
          organization:organizations(id, name)
        `)

      if (options.startDate) {
        query = query.gte("created_at", options.startDate)
      }

      if (options.endDate) {
        query = query.lte("created_at", options.endDate)
      }

      if (options.department) {
        query = query.eq("assignee.department", options.department)
      }

      const { data, error } = await query

      if (error) {
        console.error("[v0] Error fetching ticket analytics:", error)
        return null
      }

      return data || []
    } catch (error) {
      console.error("[v0] Database error in getTicketAnalytics:", error)
      return null
    }
  }

  // Service Request Operations
  async getServiceRequests(options: QueryOptions = {}): Promise<any[]> {
    try {
      let query = this.supabase.from("service_requests").select(`
          *,
          requester:profiles!service_requests_requester_id_fkey(id, first_name, last_name, email, department),
          assignee:profiles!service_requests_assignee_id_fkey(id, first_name, last_name, email, department),
          service:services(id, name, category)
        `)

      if (options.search) {
        query = query.or(`title.ilike.%${options.search}%,description.ilike.%${options.search}%`)
      }

      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value)
          }
        })
      }

      if (options.orderBy) {
        query = query.order(options.orderBy, { ascending: options.orderDirection === "asc" })
      } else {
        query = query.order("created_at", { ascending: false })
      }

      if (options.limit) {
        query = query.limit(options.limit)
      }

      const { data, error } = await query

      if (error) {
        console.error("[v0] Error fetching service requests:", error)
        return []
      }

      return data || []
    } catch (error) {
      console.error("[v0] Database error in getServiceRequests:", error)
      return []
    }
  }

  // Utility method for raw queries
  async executeQuery(query: string, params: any[] = []): Promise<any> {
    try {
      const { data, error } = await this.supabase.rpc("execute_sql", {
        query_text: query,
        params: params,
      })

      if (error) {
        console.error("[v0] Error executing query:", error)
        throw error
      }

      return data
    } catch (error) {
      console.error("[v0] Database error in executeQuery:", error)
      throw error
    }
  }
}

export default DatabaseOperations
export { DatabaseOperations }
