import { createClient } from "@supabase/supabase-js"

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

class ServerDatabaseOperations {
  private static instance: ServerDatabaseOperations
  private supabase: any

  private constructor() {
    this.supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }

  public static getInstance(): ServerDatabaseOperations {
    if (!ServerDatabaseOperations.instance) {
      ServerDatabaseOperations.instance = new ServerDatabaseOperations()
    }
    return ServerDatabaseOperations.instance
  }

  async createTicket(ticketData: TicketData): Promise<any> {
    try {
      console.log("[v0] Creating ticket with service role key:", ticketData)

      const { data, error } = await this.supabase.from("tickets").insert([ticketData]).select().single()

      if (error) {
        console.error("[v0] Error creating ticket:", error)
        throw error
      }

      console.log("[v0] Ticket created successfully:", data)
      return data
    } catch (error) {
      console.error("[v0] Database error in createTicket:", error)
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
        return 1
      }

      if (!data || data.length === 0) {
        return 1
      }

      // Extract number from ticket_number (format: TK-0001)
      const lastTicketNumber = data[0].ticket_number
      const numberMatch = lastTicketNumber.match(/TK-(\d+)/)

      if (numberMatch) {
        const lastNumber = Number.parseInt(numberMatch[1], 10)
        return lastNumber + 1
      }

      return 1
    } catch (error) {
      console.error("[v0] Database error in getNextTicketNumber:", error)
      return 1
    }
  }
}

export default ServerDatabaseOperations
export { ServerDatabaseOperations }
