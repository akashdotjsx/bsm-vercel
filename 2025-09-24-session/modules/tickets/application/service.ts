"use server"

import type { Ticket, TicketChannel } from "../domain/types"
import { ticketsRepoServer } from "../infra/repository.server"

const VALID_CHANNELS: TicketChannel[] = [
  "web",
  "email",
  "phone",
  "chat",
  "api",
  "portal",
  "mobile",
]

export class TicketsServiceServer {
  async getNextTicketNumber(): Promise<number> {
    return ticketsRepoServer.getNextTicketNumber()
  }

  async createTicket(input: Omit<Ticket, "ticket_number" | "status" | "priority" | "type"> & {
    title: string
    status?: Ticket["status"]
    priority?: Ticket["priority"]
    type?: string
    channel?: string
  }): Promise<Ticket> {
    const nextNumber = await this.getNextTicketNumber()
    const ticket_number = `TK-${nextNumber.toString().padStart(4, "0")}`

    const channel = (input.channel?.toLowerCase() as TicketChannel) || "web"
    const finalChannel = VALID_CHANNELS.includes(channel) ? channel : "web"

    const now = new Date().toISOString()

    const ticket: Ticket = {
      ticket_number,
      title: input.title,
      description: input.description || "",
      status: (input.status as Ticket["status"]) || "Open",
      priority: (input.priority as Ticket["priority"]) || "Medium",
      type: input.type || "Task",
      category: input.category || "",
      subcategory: input.subcategory || "",
      urgency: input.urgency || "Medium",
      impact: input.impact || "Medium",
      severity: input.severity || "Medium",
      channel: finalChannel,
      requester_id: input.requester_id || null,
      assignee_id: input.assignee_id || null,
      organization_id: input.organization_id || null,
      due_date: input.due_date || null,
      created_at: now,
      updated_at: now,
    }

    return ticketsRepoServer.createTicket(ticket)
  }
}

export const ticketsServiceServer = new TicketsServiceServer()
