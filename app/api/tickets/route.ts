import { type NextRequest, NextResponse } from "next/server"
import { ServerDatabaseOperations } from "@/lib/database-operations-server"

export async function POST(request: NextRequest) {
  try {
    const ticketData = await request.json()
    console.log("[v0] API: Received ticket creation request:", ticketData)

    const dbOps = ServerDatabaseOperations.getInstance()

    // Generate ticket number
    const nextNumber = await dbOps.getNextTicketNumber()
    const ticketNumber = `TK-${nextNumber.toString().padStart(4, "0")}`

    const validChannels = ["web", "email", "phone", "chat", "api", "portal", "mobile"]
    const channelValue = ticketData.channel?.toLowerCase() || "web"
    const finalChannel = validChannels.includes(channelValue) ? channelValue : "web"

    console.log(
      "[v0] Channel processing - Original:",
      ticketData.channel,
      "Lowercase:",
      channelValue,
      "Final:",
      finalChannel,
    )

    // Prepare ticket data for database
    const dbTicketData = {
      ticket_number: ticketNumber,
      title: ticketData.title,
      description: ticketData.description || "",
      status: ticketData.status || "Open",
      priority: ticketData.priority || "Medium",
      type: ticketData.type || "Task",
      category: ticketData.category || "",
      subcategory: ticketData.subcategory || "",
      urgency: ticketData.urgency || "Medium",
      impact: ticketData.impact || "Medium",
      severity: ticketData.severity || "Medium",
      channel: finalChannel, // Use validated channel value
      requester_id: ticketData.requester_id || null,
      assignee_id: ticketData.assignee_id || null,
      organization_id: ticketData.organization_id || null,
      due_date: ticketData.due_date || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    console.log("[v0] Creating ticket with data:", dbTicketData)
    const newTicket = await dbOps.createTicket(dbTicketData)

    console.log("[v0] API: Ticket created successfully:", newTicket)
    return NextResponse.json({ success: true, ticket: newTicket })
  } catch (error) {
    console.error("[v0] API: Error creating ticket:", error)
    return NextResponse.json({ success: false, error: "Failed to create ticket" }, { status: 500 })
  }
}
