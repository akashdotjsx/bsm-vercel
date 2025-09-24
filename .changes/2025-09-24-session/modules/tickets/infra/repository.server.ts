import { ServerDatabaseOperations } from "@/lib/database-operations-server"
import type { Ticket } from "../domain/types"

export class TicketsRepositoryServer {
  private db = ServerDatabaseOperations.getInstance()

  async getNextTicketNumber(): Promise<number> {
    return this.db.getNextTicketNumber()
  }

  async createTicket(ticket: Ticket): Promise<Ticket> {
    const { ticket_number, ...rest } = ticket
    const created = await this.db.createTicket({ ...rest, ticket_number })
    return created as Ticket
  }
}

export const ticketsRepoServer = new TicketsRepositoryServer()
