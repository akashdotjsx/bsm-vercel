"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Calendar, Square, User } from "lucide-react"
import { format } from "date-fns"

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

interface KanbanTicketCardProps {
  ticket: Ticket
  isDragging?: boolean
  onTicketClick: (ticket: Ticket) => void
  onDragStart: (e: React.DragEvent, ticket: Ticket) => void
}

export const KanbanTicketCard: React.FC<KanbanTicketCardProps> = ({
  ticket,
  isDragging,
  onTicketClick,
  onDragStart,
}) => {
  const getPriorityBadgeColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "urgent":
        return "bg-red-500/10 text-red-700 dark:bg-red-500/20 dark:text-red-400"
      case "high":
        return "bg-orange-500/10 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400"
      case "medium":
        return "bg-yellow-500/10 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400"
      case "low":
        return "bg-green-500/10 text-green-700 dark:bg-green-500/20 dark:text-green-400"
      default:
        return "bg-gray-500/10 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400"
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "new":
        return "bg-blue-500/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400"
      case "in_progress":
      case "waiting_on_you":
        return "bg-yellow-500/10 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400"
      case "waiting_on_customer":
      case "review":
        return "bg-purple-500/10 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400"
      case "resolved":
      case "done":
      case "on_hold":
        return "bg-green-500/10 text-green-700 dark:bg-green-500/20 dark:text-green-400"
      default:
        return "bg-gray-500/10 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400"
    }
  }

  const getStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case "new":
        return "New"
      case "waiting_on_you":
        return "In Progress"
      case "waiting_on_customer":
        return "Review"
      case "on_hold":
        return "Done"
      default:
        return status
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return null
    try {
      return format(new Date(dateString), "MMM dd, yyyy")
    } catch {
      return null
    }
  }

  const getAvatarInitials = (name?: string) => {
    if (!name) return "?"
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
  }

  const getProgressFromStatus = (status: string) => {
    switch (status?.toLowerCase()) {
      case "new":
        return 0
      case "waiting_on_you":
      case "in_progress":
        return 50
      case "waiting_on_customer":
      case "review":
        return 75
      case "on_hold":
      case "resolved":
      case "done":
        return 100
      default:
        return 0
    }
  }

  return (
    <Card
      className={`hover:shadow-sm transition-all cursor-move border bg-card rounded-xl ${
        isDragging ? "opacity-50 scale-95 rotate-2" : ""
      }`}
      draggable
      onDragStart={(e) => onDragStart(e, ticket)}
      onClick={() => onTicketClick(ticket)}
    >
      <CardContent className="px-4 py-0 space-y-3">
        {/* Header with badges and checkbox */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge 
              variant="secondary" 
              className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusBadgeColor(ticket.status)}`}
            >
              {getStatusText(ticket.status)}
            </Badge>
            <Badge 
              variant="outline" 
              className={`text-xs font-medium px-2 py-1 rounded-full ${getPriorityBadgeColor(ticket.priority)}`}
            >
              {ticket.priority?.charAt(0).toUpperCase() + ticket.priority?.slice(1)}
            </Badge>
          </div>
          <Square className="h-4 w-4 text-muted-foreground stroke-2" />
        </div>

        {/* Title */}
        <div>
          <h4 className="font-medium text-sm text-foreground leading-tight line-clamp-2">
            {ticket.title}
          </h4>
        </div>

        {/* Progress section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">
              Progress
            </span>
            <span className="text-xs text-foreground font-semibold">
              {ticket.progress ?? getProgressFromStatus(ticket.status)}%
            </span>
          </div>
          <Progress 
            value={ticket.progress ?? getProgressFromStatus(ticket.status)} 
            className="h-2"
          />
        </div>

        {/* Footer with avatars and date */}
        <div className="flex items-center justify-between">
          {/* Avatars */}
          <div className="flex items-center">
            {ticket.assignees && ticket.assignees.length > 0 ? (
              <div className="flex -space-x-1">
                {ticket.assignees.slice(0, 2).map((assignee) => (
                  <Avatar key={assignee.id} className="h-6 w-6 border-2 border-background">
                    <AvatarImage src={assignee.avatar_url} />
                    <AvatarFallback className="text-xs">
                      {getAvatarInitials(assignee.display_name || assignee.name)}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {ticket.assignees.length > 2 && (
                  <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                    <span className="text-xs text-muted-foreground font-medium">
                      +{ticket.assignees.length - 2}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                <User className="h-3 w-3 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Date */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span className="font-medium">
              {formatDate(ticket.due_date) || formatDate(ticket.created_at) || 'No date'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )}
