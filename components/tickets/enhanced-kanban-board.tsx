"use client"

import React, { useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Search, Filter } from "lucide-react"
import { KanbanColumn } from "./kanban-column"
import { useTheme } from "next-themes"

interface Ticket {
  id: string
  dbId: string
  title: string
  description?: string
  status: string
  priority: string
  type: string
  assignees: Array<{
    id: string
    name: string
    avatar?: string
    avatar_url?: string
    display_name?: string
  }>
  created_at?: string
  due_date?: string
  progress?: number
  ticket_number?: string
}

interface EnhancedKanbanBoardProps {
  tickets: Array<Ticket>
  loading?: boolean
  groupBy: "type" | "status" | "priority" | "category"
  searchTerm: string
  selectedType: string
  selectedPriority: string
  ticketTypes: Array<{ value: string; label: string }>
  draggedTicket: Ticket | null
  dragOverColumn: string | null
  onSearchChange: (value: string) => void
  onGroupByChange: (value: "type" | "status" | "priority" | "category") => void
  onTypeFilterChange: (value: string) => void
  onPriorityFilterChange: (value: string) => void
  onTicketClick: (ticket: Ticket) => void
  onDragStart: (e: React.DragEvent, ticket: Ticket) => void
  onDragOver: (e: React.DragEvent) => void
  onDragEnter: (e: React.DragEvent, columnId: string) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, columnId: string) => void
  onAddTicket: (columnType?: string) => void
}

export const EnhancedKanbanBoard: React.FC<EnhancedKanbanBoardProps> = ({
  tickets,
  loading = false,
  groupBy,
  searchTerm,
  selectedType,
  selectedPriority,
  ticketTypes,
  draggedTicket,
  dragOverColumn,
  onSearchChange,
  onGroupByChange,
  onTypeFilterChange,
  onPriorityFilterChange,
  onTicketClick,
  onDragStart,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDrop,
  onAddTicket,
}) => {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const getKanbanColumns = useCallback(() => {
    switch (groupBy) {
      case "status":
        return [
          { id: "new", title: "New", color: "border-t-blue-500" },
          { id: "waiting_on_you", title: "In Progress", color: "border-t-yellow-500" },
          { id: "waiting_on_customer", title: "Review", color: "border-t-purple-500" },
          { id: "on_hold", title: "Done", color: "border-t-green-500" },
        ]
      case "priority":
        return [
          { id: "urgent", title: "Urgent", color: "border-t-red-600" },
          { id: "high", title: "High", color: "border-t-red-400" },
          { id: "medium", title: "Medium", color: "border-t-yellow-400" },
          { id: "low", title: "Low", color: "border-t-green-400" },
        ]
      case "category":
        return [
          { id: "technical", title: "Technical", color: "border-t-blue-500" },
          { id: "billing", title: "Billing", color: "border-t-green-400" },
          { id: "general", title: "General", color: "border-t-purple-400" },
          { id: "feature", title: "Feature Request", color: "border-t-orange-400" },
        ]
      default: // type
        return [
          { id: "incident", title: "Incident", color: "border-t-red-400" },
          { id: "request", title: "Request", color: "border-t-blue-500" },
          { id: "problem", title: "Problem", color: "border-t-orange-400" },
          { id: "change", title: "Change", color: "border-t-green-400" },
          { id: "general_query", title: "General Query", color: "border-t-purple-400" },
        ]
    }
  }, [groupBy])

  const getTicketsByGroup = useCallback(
    (groupValue: string) => {
      return tickets.filter((ticket: Ticket) => {
        switch (groupBy) {
          case "status":
            return ticket.status === groupValue
          case "priority":
            return ticket.priority === groupValue
          case "category":
            const categoryMap: { [key: string]: string } = {
              Incident: "technical",
              Problem: "technical",
              Request: "general",
              Change: "feature",
              "General Query": "general",
            }
            return categoryMap[ticket.type] === groupValue
          case "type":
            return ticket.type === groupValue
          default:
            return ticket.type === groupValue
        }
      })
    },
    [tickets, groupBy],
  )

  const kanbanColumns = getKanbanColumns()

  return (
    <div className="space-y-6">
      {/* Filters Header */}
      <div className="flex items-center gap-4 py-2 border-b border-border flex-wrap overflow-x-auto">
        <div className="relative flex-shrink-0">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search items"
            className="pl-10 h-9 w-48 border-0 bg-muted/50 text-sm"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <Select value={groupBy} onValueChange={onGroupByChange}>
          <SelectTrigger className="w-48 h-9 text-sm">
            <SelectValue placeholder="Group By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="type">Group By: Type</SelectItem>
            <SelectItem value="status">Group By: Status</SelectItem>
            <SelectItem value="priority">Group By: Priority</SelectItem>
            <SelectItem value="category">Group By: Category</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedType} onValueChange={onTypeFilterChange}>
          <SelectTrigger className="w-32 h-9 text-sm">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {ticketTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" className="h-9 text-sm">
          Date Range
        </Button>

        <Select value={selectedPriority} onValueChange={onPriorityFilterChange}>
          <SelectTrigger className="w-40 h-9 text-sm">
            <SelectValue placeholder="All Priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" className="h-9 text-sm">
          <Filter className="h-4 w-4 mr-2" />
          Add filter
        </Button>
      </div>

      {/* Kanban Board Grid */}
      <div className="pb-6 overflow-x-auto">
        <div className="flex gap-6 min-w-min">
          {loading ? (
            // Loading skeleton
            Array.from({ length: 5 }).map((_, i) => (
              <div 
                key={`loading-column-${i}`} 
                className="rounded-xl p-5 min-h-[400px] flex flex-col min-w-[320px]"
                style={{
                  backgroundColor: isDark ? '#282a2f' : '#F8F8F8',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: isDark ? '#2d2f34' : '#EEEEEE'
                }}
              >
                {/* Column header skeleton */}
                <div className="mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-muted/50 animate-pulse"></div>
                    <div className="h-6 w-24 bg-muted/50 animate-pulse rounded"></div>
                    <div className="h-4 w-8 bg-muted/50 animate-pulse rounded"></div>
                  </div>
                </div>
                
                {/* Ticket cards skeleton */}
                <div className="space-y-3 flex-1">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div
                      key={`loading-card-${i}-${j}`}
                      className="bg-card/50 rounded-xl px-4 py-3 space-y-3"
                    >
                      {/* Badges skeleton */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex gap-2">
                          <div className="h-5 w-16 bg-muted/50 animate-pulse rounded-full"></div>
                          <div className="h-5 w-14 bg-muted/50 animate-pulse rounded-full"></div>
                        </div>
                        <div className="h-4 w-4 bg-muted/50 animate-pulse rounded"></div>
                      </div>
                      
                      {/* Title skeleton */}
                      <div className="h-4 w-4/5 bg-muted/50 animate-pulse rounded"></div>
                      
                      {/* Progress skeleton */}
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <div className="h-3 w-16 bg-muted/50 animate-pulse rounded"></div>
                          <div className="h-3 w-8 bg-muted/50 animate-pulse rounded"></div>
                        </div>
                        <div className="h-2 w-full bg-muted/50 animate-pulse rounded-full"></div>
                      </div>
                      
                      {/* Footer skeleton */}
                      <div className="flex items-center justify-between">
                        <div className="flex -space-x-1">
                          <div className="h-6 w-6 bg-muted/50 animate-pulse rounded-full border-2 border-background"></div>
                          <div className="h-6 w-6 bg-muted/50 animate-pulse rounded-full border-2 border-background"></div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="h-3.5 w-3.5 bg-muted/50 animate-pulse rounded"></div>
                          <div className="h-3 w-20 bg-muted/50 animate-pulse rounded"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Add button skeleton */}
                  <div className="h-10 w-full bg-muted/30 animate-pulse rounded-lg border border-dashed"></div>
                </div>
              </div>
            ))
          ) : (
            kanbanColumns.map((column) => {
              const columnTickets = getTicketsByGroup(column.id)
              return (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  tickets={columnTickets}
                  dragOverColumn={dragOverColumn}
                  draggedTicket={draggedTicket}
                  onDragOver={onDragOver}
                  onDragEnter={onDragEnter}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  onTicketClick={onTicketClick}
                  onDragStart={onDragStart}
                  onAddTicket={onAddTicket}
                />
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}