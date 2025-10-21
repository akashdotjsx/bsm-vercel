"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { KanbanTicketCard } from "./kanban-ticket-card"
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

interface KanbanColumnProps {
  column: {
    id: string
    title: string
    color: string
    count?: number
  }
  tickets: Array<Ticket>
  dragOverColumn?: string | null
  draggedTicket?: Ticket
  onDragOver: (e: React.DragEvent) => void
  onDragEnter: (e: React.DragEvent, columnId: string) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, columnId: string) => void
  onTicketClick: (ticket: Ticket) => void
  onDragStart: (e: React.DragEvent, ticket: Ticket) => void
  onAddTicket: (columnId: string) => void
  onCheckboxChange?: (ticketId: string, checked: boolean) => void
  onDateChange?: (ticketId: string, date: Date | null) => void
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
  tickets,
  dragOverColumn,
  draggedTicket,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDrop,
  onTicketClick,
  onDragStart,
  onAddTicket,
  onCheckboxChange,
  onDateChange,
}) => {
  const { theme } = useTheme()
  const isDropTarget = dragOverColumn === column.id
  const isDark = theme === 'dark'

  // Map border-t color classes to actual background colors
  const getColorFromClass = (colorClass: string): string => {
    const colorMap: { [key: string]: string } = {
      'border-t-blue-500': '#3B82F6',
      'border-t-red-400': '#F87171',
      'border-t-red-600': '#DC2626',
      'border-t-orange-400': '#FB923C',
      'border-t-green-400': '#4ADE80',
      'border-t-green-500': '#22C55E',
      'border-t-yellow-400': '#FACC15',
      'border-t-yellow-500': '#EAB308',
      'border-t-purple-400': '#C084FC',
      'border-t-purple-500': '#A855F7',
    }
    return colorMap[colorClass] || '#3B82F6' // default to blue
  }

  return (
    <div
      className={`flex flex-col transition-all duration-200 ${
        isDropTarget ? "ring-2 ring-blue-400 ring-offset-2" : ""
      }`}
      onDragOver={onDragOver}
      onDragEnter={(e) => onDragEnter(e, column.id)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, column.id)}
    >
      {/* Column Container with grey background */}
      <div 
        className="rounded-xl p-5 min-h-[400px] flex flex-col min-w-[320px]"
        style={{
          backgroundColor: isDark ? '#282a2f' : '#F8F8F8',
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: isDark ? '#2d2f34' : '#EEEEEE'
        }}
      >
        {/* Column Header */}
        <div className="mb-4">
          <div className="flex items-center gap-2.5">
            {/* Colored dot indicator */}
            <div 
              className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
              style={{ backgroundColor: getColorFromClass(column.color) }}
            ></div>
            <h3 className="font-semibold text-lg text-foreground">
              {column.title}
            </h3>
            <span className="text-sm text-muted-foreground font-medium">
              ({tickets.length})
            </span>
          </div>
          
          {/* Drop indicator */}
          {isDropTarget && draggedTicket && (
            <div className="mt-2 text-xs text-blue-600 dark:text-blue-400 font-medium">
              Drop ticket here
            </div>
          )}
        </div>

        {/* Tickets Container */}
        <div className="space-y-3 flex-1">
          {tickets.map((ticket) => (
            <KanbanTicketCard
              key={ticket.id}
              ticket={ticket}
              isDragging={draggedTicket?.id === ticket.id}
              onTicketClick={onTicketClick}
              onDragStart={onDragStart}
              onCheckboxChange={onCheckboxChange}
              onDateChange={onDateChange}
            />
          ))}

           {/* Add Ticket Button */}
           <Button
             variant="ghost"
             size="sm"
             className="w-full h-9 text-xs font-semibold text-[#6E72FF] hover:bg-[#6E72FF]/5 dark:text-[#6E72FF] dark:hover:bg-[#6E72FF]/10 rounded-[5px] mt-2 font-[Inter]"
             style={{
               backgroundColor: isDark ? '#1e2024' : '#ffffff'
             }}
             onClick={() => onAddTicket(column.id)}
           >
             + Add Ticket
           </Button>
        </div>
      </div>
    </div>
  )
}
