import type { TicketStatus } from "./types"

const transitions: Record<TicketStatus, TicketStatus[]> = {
  Open: ["In Progress", "On Hold", "Canceled"],
  "In Progress": ["Resolved", "On Hold", "Canceled"],
  Resolved: ["Closed", "In Progress"],
  Closed: [],
  "On Hold": ["In Progress", "Canceled"],
  Canceled: [],
}

export function canTransition(from: TicketStatus, to: TicketStatus): boolean {
  return transitions[from]?.includes(to) ?? false
}

export function nextStatuses(from: TicketStatus): TicketStatus[] {
  return transitions[from] ?? []
}
