import { type NextRequest, NextResponse } from "next/server"
import { ticketsServiceServer } from "@/modules/tickets/application/service"

export async function POST(request: NextRequest) {
  try {
    const ticketData = await request.json()
    console.log("[v0] API: Received ticket creation request:", ticketData)

    const newTicket = await ticketsServiceServer.createTicket(ticketData)

    console.log("[v0] API: Ticket created successfully:", newTicket)
    return NextResponse.json({ success: true, ticket: newTicket })
  } catch (error) {
    console.error("[v0] API: Error creating ticket:", error)
    return NextResponse.json({ success: false, error: "Failed to create ticket" }, { status: 500 })
  }
}
