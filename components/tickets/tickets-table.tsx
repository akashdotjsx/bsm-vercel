"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  MoreHorizontal,
  Edit,
  Copy,
  Trash2,
  Plus,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MultiAssigneeAvatars } from "@/components/tickets/multi-assignee-avatars"
import { CustomColumnCell } from "@/components/tickets/custom-column-cell"
import { useCustomColumnsGraphQL } from "@/hooks/queries/use-custom-columns-graphql"
import { useAuth } from "@/lib/contexts/auth-context"
import { format } from "date-fns"

interface TicketsTableProps {
  tickets: any[]
  loading?: boolean
  error?: string | null
  groupBy?: string
  groupedTickets?: Record<string, any[]>
  onTicketClick?: (ticket: any) => void
  onEditTicket?: (ticket: any) => void
  onDuplicateTicket?: (ticket: any) => void
  onDeleteTicket?: (ticket: any) => void
  onUpdateTicket?: (ticketId: string, updates: any) => Promise<void>
  onOpenCustomColumns?: () => void
}

export function TicketsTable({
  tickets,
  loading = false,
  error = null,
  groupBy = "none",
  groupedTickets = {},
  onTicketClick,
  onEditTicket,
  onDuplicateTicket,
  onDeleteTicket,
  onUpdateTicket,
  onOpenCustomColumns,
}: TicketsTableProps) {
  const { organizationId } = useAuth()
  const { columns: customColumns } = useCustomColumnsGraphQL(organizationId || '')
  
  // Filter custom columns to only show visible ones
  const visibleCustomColumns = customColumns.filter(column => column.visible !== false)

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-[#6E72FF]/10 text-[#6E72FF]"
      case "in_progress":
        return "bg-yellow-100 text-yellow-800"
      case "review":
        return "bg-purple-100 text-purple-800"
      case "pending":
        return "bg-gray-100 text-gray-800"
      case "open":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "new":
        return "New"
      case "in_progress":
        return "In Progress"
      case "review":
        return "Review"
      case "pending":
        return "Pending"
      case "open":
        return "Open"
      default:
        return status
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
      case "critical":
        return "bg-red-100 text-red-800"
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-orange-100 text-orange-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTypeColor = (type: string) => {
    return "bg-amber-100 text-amber-800"
  }

  // Loading skeleton
  if (loading) {
    return (
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider border-r border-border w-12">
                  Actions
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider border-r border-border">
                  Ticket
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider border-r border-border">
                  Status
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider border-r border-border">
                  Reported By
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider border-r border-border">
                  Assignee
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider border-r border-border">
                  Reported Date
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider border-r border-border">
                  Due Date
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider border-r border-border">
                  Type
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider border-r border-border">
                  Priority
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider border-r border-border">
                  Notes
                </th>
                {visibleCustomColumns.map((column) => (
                  <th
                    key={column.id}
                    className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider border-r border-border"
                  >
                    {column.title}
                  </th>
                ))}
                <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={onOpenCustomColumns}
                    title="Manage custom columns"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 8 }).map((_, index) => (
                <tr key={`skeleton-${index}`} className="border-b border-border">
                  <td className="px-3 py-2.5 border-r border-border">
                    <div className="space-y-2">
                      <div className="h-4 bg-muted dark:bg-muted animate-pulse rounded w-3/4" />
                      <div className="h-3 bg-muted dark:bg-muted animate-pulse rounded w-1/2" />
                    </div>
                  </td>
                  <td className="px-3 py-2.5 border-r border-border">
                    <div className="h-5 bg-muted dark:bg-muted animate-pulse rounded-full w-16" />
                  </td>
                  <td className="px-3 py-2.5 border-r border-border">
                    <div className="h-6 w-6 bg-muted dark:bg-muted animate-pulse rounded-full" />
                  </td>
                  <td className="px-3 py-2.5 border-r border-border">
                    <div className="h-6 w-6 bg-muted dark:bg-muted animate-pulse rounded-full" />
                  </td>
                  <td className="px-3 py-2.5 border-r border-border">
                    <div className="h-3 bg-muted dark:bg-muted animate-pulse rounded w-20" />
                  </td>
                  <td className="px-3 py-2.5 border-r border-border">
                    <div className="h-3 bg-muted dark:bg-muted animate-pulse rounded w-20" />
                  </td>
                  <td className="px-3 py-2.5 border-r border-border">
                    <div className="h-5 bg-muted dark:bg-muted animate-pulse rounded-full w-14" />
                  </td>
                  <td className="px-3 py-2.5 border-r border-border">
                    <div className="h-5 bg-muted dark:bg-muted animate-pulse rounded-full w-12" />
                  </td>
                  <td className="px-3 py-2.5 border-r border-border">
                    <div className="h-4 bg-muted dark:bg-muted animate-pulse rounded w-24" />
                  </td>
                  <td className="px-3 py-2.5 border-r border-border"></td>
                  <td className="px-3 py-2.5 border-r border-border">
                    <div className="h-6 w-6 bg-muted dark:bg-muted animate-pulse rounded" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="p-8 text-center">
          <div className="text-red-600">Error loading tickets: {error}</div>
        </div>
      </div>
    )
  }

  // Empty state
  if (!tickets || tickets.length === 0) {
    return (
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="p-8 text-center">
          <div className="text-muted-foreground">No tickets found.</div>
        </div>
      </div>
    )
  }

  // Main table
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider border-r border-border">
                Ticket
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider border-r border-border">
                Status
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider border-r border-border">
                Reported By
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider border-r border-border">
                Assignee
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider border-r border-border">
                Reported Date
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider border-r border-border">
                Due Date
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider border-r border-border">
                Type
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider border-r border-border">
                Priority
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider border-r border-border">
                Notes
              </th>
              {/* Custom columns headers */}
              {customColumns.map((column) => (
                <th
                  key={column.id}
                  className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider border-r border-border"
                >
                  {column.title}
                </th>
              ))}
              {/* Add column button */}
              <th className="px-3 py-2 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider border-r border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={onOpenCustomColumns}
                  title="Manage custom columns"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </th>
              {/* Actions column - RIGHTMOST - Just icon, no text */}
              <th className="px-3 py-2 text-center border-r border-border w-12">
                <MoreHorizontal className="h-4 w-4 mx-auto text-muted-foreground" />
              </th>
            </tr>
          </thead>
          <tbody>
            {groupBy !== "none" ? (
              // Grouped view
              Object.entries(groupedTickets).map(([groupName, groupTickets]) => (
                <>
                  <tr key={`group-${groupName}`} className="bg-muted/30 border-b border-border">
                    <td colSpan={9 + customColumns.length + 2} className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{groupName}</span>
                        <span className="text-sm text-muted-foreground">
                          ({groupTickets.length} tickets)
                        </span>
                      </div>
                    </td>
                  </tr>
                  {groupTickets.map((ticket) => (
                    <TicketRow
                      key={ticket.id}
                      ticket={ticket}
                      customColumns={customColumns}
                      onTicketClick={onTicketClick}
                      onEditTicket={onEditTicket}
                      onDuplicateTicket={onDuplicateTicket}
                      onDeleteTicket={onDeleteTicket}
                      onUpdateTicket={onUpdateTicket}
                      getStatusColor={getStatusColor}
                      getStatusText={getStatusText}
                      getPriorityColor={getPriorityColor}
                      getTypeColor={getTypeColor}
                    />
                  ))}
                </>
              ))
            ) : (
              // Ungrouped view
              tickets.map((ticket) => (
                <TicketRow
                  key={ticket.id}
                  ticket={ticket}
                  customColumns={customColumns}
                  onTicketClick={onTicketClick}
                  onEditTicket={onEditTicket}
                  onDuplicateTicket={onDuplicateTicket}
                  onDeleteTicket={onDeleteTicket}
                  onUpdateTicket={onUpdateTicket}
                  getStatusColor={getStatusColor}
                  getStatusText={getStatusText}
                  getPriorityColor={getPriorityColor}
                  getTypeColor={getTypeColor}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Ticket row component
function TicketRow({
  ticket,
  customColumns,
  onTicketClick,
  onEditTicket,
  onDuplicateTicket,
  onDeleteTicket,
  onUpdateTicket,
  getStatusColor,
  getStatusText,
  getPriorityColor,
  getTypeColor,
}: any) {
  return (
    <tr className="border-b border-border hover:bg-muted/50 last:border-b-0">
      {/* Ticket title and ID */}
      <td className="px-3 py-2.5 whitespace-nowrap border-r border-border">
        <div>
          <button
            onClick={() => onTicketClick && onTicketClick(ticket)}
            className="text-sm font-medium text-foreground hover:text-[#6E72FF] hover:underline cursor-pointer"
          >
            {ticket.title}
          </button>
          <div className="text-xs text-muted-foreground">
            {ticket.ticket_number || ticket.id}
          </div>
        </div>
      </td>

      {/* Status */}
      <td className="px-3 py-2.5 whitespace-nowrap border-r border-border">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
          {getStatusText(ticket.status)}
        </span>
      </td>

      {/* Reported By */}
      <td className="px-3 py-2.5 whitespace-nowrap border-r border-border">
        <div className="flex items-center">
          {ticket.requester ? (
            <div
              className="h-6 w-6 rounded-full bg-red-500 flex items-center justify-center text-white text-[9px] font-medium"
              title={ticket.requester.display_name || ticket.requester.email}
            >
              {(ticket.requester.first_name?.[0] || "") +
                (ticket.requester.last_name?.[0] || "")}
            </div>
          ) : ticket.reportedByAvatar ? (
            <div
              className={`h-6 w-6 rounded-full ${ticket.companyColor || "bg-gray-500"} flex items-center justify-center text-white text-[9px] font-medium`}
              title={ticket.reportedBy}
            >
              {ticket.reportedByAvatar}
            </div>
          ) : (
            <div className="h-6 w-6 rounded-full bg-gray-400 flex items-center justify-center text-white text-[9px] font-medium">
              ?
            </div>
          )}
        </div>
      </td>

      {/* Assignee */}
      <td className="px-3 py-2.5 whitespace-nowrap border-r border-border">
        <div className="flex items-center">
          <MultiAssigneeAvatars
            assignees={ticket.assignees || []}
            maxDisplay={3}
            size="sm"
          />
        </div>
      </td>

      {/* Reported Date */}
      <td className="px-3 py-2.5 whitespace-nowrap border-r border-border">
        <span className="text-sm text-foreground">
          {ticket.created_at
            ? format(new Date(ticket.created_at), "MMM dd, yyyy")
            : ticket.reportedDate || "-"}
        </span>
      </td>

      {/* Due Date */}
      <td className="px-3 py-2.5 whitespace-nowrap border-r border-border">
        <span className="text-sm text-foreground">
          {ticket.due_date
            ? format(new Date(ticket.due_date), "MMM dd, yyyy")
            : ticket.dueDate || "-"}
        </span>
      </td>

      {/* Type */}
      <td className="px-3 py-2.5 whitespace-nowrap border-r border-border">
        <span className={`text-xs px-2 py-1 rounded-full ${getTypeColor(ticket.type)}`}>
          {ticket.displayType || ticket.type}
        </span>
      </td>

      {/* Priority */}
      <td className="px-3 py-2.5 whitespace-nowrap border-r border-border">
        <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(ticket.priority)}`}>
          {ticket.priority
            ? ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)
            : "Unknown"}
        </span>
      </td>

      {/* Notes */}
      <td className="px-3 py-2.5 whitespace-nowrap border-r border-border">
        <Input
          placeholder="Add notes..."
          className="h-6 text-xs border-0 bg-transparent focus:bg-background text-muted-foreground"
          defaultValue={ticket.custom_fields?.notes || ticket.notes || ticket.metadata?.notes || ""}
          onBlur={async (e) => {
            const newNotes = e.target.value
            const currentNotes =
              ticket.custom_fields?.notes || ticket.notes || ticket.metadata?.notes || ""
            if (newNotes !== currentNotes && onUpdateTicket) {
              try {
                await onUpdateTicket(ticket.dbId || ticket.id, {
                  custom_fields: {
                    ...ticket.custom_fields,
                    notes: newNotes,
                  },
                })
              } catch (error) {
                console.error("Failed to save notes:", error)
              }
            }
          }}
        />
      </td>

      {/* Custom column cells */}
      {visibleCustomColumns.map((column: any) => (
        <td key={column.id} className="px-3 py-2.5 whitespace-nowrap border-r border-border">
          <CustomColumnCell column={column} ticketId={ticket.dbId || ticket.id} />
        </td>
      ))}

      {/* Empty cell for the + button column */}
      <td className="px-3 py-2.5 whitespace-nowrap border-r border-border"></td>

      {/* Actions column - RIGHTMOST */}
      <td className="px-3 py-2.5 border-r border-border text-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                if (onEditTicket) {
                  onEditTicket(ticket)
                }
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Ticket
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                if (onDuplicateTicket) {
                  onDuplicateTicket(ticket)
                }
              }}
            >
              <Copy className="h-4 w-4 mr-2" />
              Duplicate Ticket
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => {
                if (onDeleteTicket) {
                  onDeleteTicket(ticket)
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Ticket
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  )
}
