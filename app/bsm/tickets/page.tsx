"use client"

import type React from "react"
import { useEffect, useState, useCallback, useMemo } from "react"
import { PlatformLayout } from "@/components/layout/platform-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  Search,
  Filter,
  MessageSquare,
  List,
  User,
  MoreHorizontal,
  Edit,
  Copy,
  Trash2,
  Upload,
  LayoutGrid,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useStore } from "@/lib/store"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { format, formatDistanceToNow } from "date-fns"
import DatabaseOperations from "@/lib/database-operations"
import dynamic from "next/dynamic"
import { TicketTray } from "@/components/tickets/ticket-tray"

const AIAssistantPanel = dynamic(
  () => import("@/components/ai/ai-assistant-panel").then((mod) => ({ default: mod.AIAssistantPanel })),
  {
    loading: () => <LoadingSpinner size="md" />,
    ssr: false,
  },
)

const columns = [
  { id: "Incident", title: "Incident", count: 0, color: "border-t-red-400" },
  { id: "Request", title: "Request", count: 0, color: "border-t-blue-400" },
  { id: "Problem", title: "Problem", count: 0, color: "border-t-orange-400" },
  { id: "Change", title: "Change", count: 0, color: "border-t-green-400" },
  { id: "General Query", title: "General Query", count: 0, color: "border-t-purple-400" },
]

export default function TicketsPage() {
  const { user } = useStore()

  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState("all")
  const [selectedPriority, setSelectedPriority] = useState("all")
  const [showAIPanel, setShowAIPanel] = useState(false)
  const [currentView, setCurrentView] = useState<"list" | "kanban">("list")
  const [showTicketTray, setShowTicketTray] = useState(false)
  const [groupBy, setGroupBy] = useState("none")
  const [showCustomColumns, setShowCustomColumns] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [kanbanGroupBy, setKanbanGroupBy] = useState<"type" | "status" | "priority" | "category">("type")
  const [draggedTicket, setDraggedTicket] = useState<any>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
  const [aiMessages, setAiMessages] = useState<
    Array<{ id: string; type: "user" | "ai"; content: string; timestamp: Date }>
  >([])
  const [aiInput, setAiInput] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [showAIChat, setShowAIChat] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importText, setImportText] = useState("")

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoading(true)
        setError(null)

        const dbOps = DatabaseOperations.getInstance()
        const ticketsData = await dbOps.getTickets({
          limit: 50,
          orderBy: "created_at",
          orderDirection: "desc",
        })

        setTickets(ticketsData)
      } catch (err) {
        console.error("[v0] Error fetching tickets:", err)
        setError("Failed to load tickets")
      } finally {
        setLoading(false)
      }
    }

    fetchTickets()
  }, [])

  const transformedTickets = useMemo(() => {
    if (!tickets) return []

    return tickets.map((ticket: any) => ({
      id: ticket.ticket_number,
      title: ticket.title,
      description: ticket.description,
      company: ticket.organization?.name || "Unknown",
      companyLogo: ticket.organization?.name?.charAt(0) || "U",
      companyColor: "bg-blue-500",
      customer: ticket.requester ? `${ticket.requester.first_name} ${ticket.requester.last_name}` : "Unknown",
      reportedBy: ticket.requester ? `${ticket.requester.first_name} ${ticket.requester.last_name}` : "Unknown",
      reportedByAvatar: ticket.requester
        ? `${ticket.requester.first_name?.charAt(0)}${ticket.requester.last_name?.charAt(0)}`
        : "U",
      assignee: ticket.assignee
        ? {
            name: `${ticket.assignee.first_name} ${ticket.assignee.last_name}`,
            avatar: `${ticket.assignee.first_name?.charAt(0)}${ticket.assignee.last_name?.charAt(0)}`,
          }
        : null,
      status: ticket.status,
      timestamp: formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true }),
      date: format(new Date(ticket.created_at), "MMM dd, yyyy"),
      reportedDate: format(new Date(ticket.created_at), "MMM dd, yyyy"),
      dueDate: ticket.due_date ? format(new Date(ticket.due_date), "MMM dd, yyyy") : null,
      comments: 0, // Would need to count from ticket_comments table
      attachments: 0, // Would need to count from ticket_attachments table
      priority: ticket.priority,
      type:
        ticket.type === "general_query" ? "General Query" : ticket.type.charAt(0).toUpperCase() + ticket.type.slice(1),
      notes: `Reported via ${ticket.channel}`,
      category: ticket.category,
      subcategory: ticket.subcategory,
      urgency: ticket.urgency,
      impact: ticket.impact,
      severity: ticket.severity,
      createdAt: format(new Date(ticket.created_at), "MMM dd, yyyy"),
    }))
  }, [tickets])

  const filteredTickets = useMemo(() => {
    const ticketsToFilter = transformedTickets

    return ticketsToFilter.filter((ticket) => {
      const matchesSearch =
        ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.customer.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = selectedType === "all" || ticket.type === selectedType
      const matchesPriority = selectedPriority === "all" || ticket.priority === selectedPriority

      return matchesSearch && matchesType && matchesPriority
    })
  }, [searchTerm, selectedType, selectedPriority, transformedTickets])

  const getTicketsByStatus = useCallback(
    (status: string) => {
      return filteredTickets.filter((ticket) => ticket.status === status)
    },
    [filteredTickets],
  )

  const getTicketsByType = useCallback(
    (type: string) => {
      return filteredTickets.filter((ticket) => ticket.type === type)
    },
    [filteredTickets],
  )

  const getTypeColor = useCallback((type: string) => {
    switch (type) {
      case "Task":
        return "text-blue-500"
      case "Incident":
        return "text-red-500"
      case "Request":
        return "text-green-500"
      case "Problem":
        return "text-orange-500"
      default:
        return "text-gray-500"
    }
  }, [])

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
      case "waiting_on_you":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
      case "waiting_on_customer":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
      case "on_hold":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-300"
    }
  }, [])

  const getStatusText = useCallback((status: string) => {
    switch (status) {
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
  }, [])

  const handleTicketClick = useCallback((ticket: any) => {
    console.log("[v0] Opening ticket tray for:", ticket.id)
    setSelectedTicket(ticket)
    setShowTicketTray(true)
  }, [])

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value)
  }, [])

  const handleSendAIMessage = useCallback(async () => {
    if (!aiInput.trim()) return

    const userMessage = {
      id: Date.now().toString(),
      type: "user" as const,
      content: aiInput.trim(),
      timestamp: new Date(),
    }

    setAiMessages((prev) => [...prev, userMessage])
    setAiInput("")
    setAiLoading(true)

    try {
      // Simulate AI response - in real implementation, this would call Gemini 2.5 API
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        type: "ai" as const,
        content: `Based on your tickets data, here's what I found regarding "${userMessage.content}":

Current ticket statistics:
• Total tickets: ${filteredTickets.length}
• Open tickets: ${filteredTickets.filter((t) => t.status === "new").length}
• High priority: ${filteredTickets.filter((t) => t.priority === "high" || t.priority === "urgent").length}

I can help you analyze ticket trends, suggest prioritization, or provide insights about your support workflow. Feel free to ask follow-up questions!`,
        timestamp: new Date(),
      }

      setAiMessages((prev) => [...prev, aiMessage])
    } catch (error) {
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        type: "ai" as const,
        content: "Sorry, I encountered an error while processing your question. Please try again.",
        timestamp: new Date(),
      }
      setAiMessages((prev) => [...prev, errorMessage])
    } finally {
      setAiLoading(false)
    }
  }, [aiInput, filteredTickets])

  const handleImportTickets = useCallback(() => {
    if (!importFile) return

    // Simulate file processing
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        // In real implementation, parse CSV/Excel file and add tickets
        console.log("[v0] Processing import file:", importFile.name)
        alert(`Successfully imported tickets from ${importFile.name}`)
        setShowImportDialog(false)
        setImportFile(null)
      } catch (error) {
        alert("Error processing import file. Please check the format and try again.")
      }
    }
    reader.readAsText(importFile)
  }, [importFile])

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendAIMessage()
    }
  }

  const clearAIChat = () => {
    setAiMessages([])
    setAiInput("")
  }

  const renderListView = useCallback(
    () => (
      <div className="space-y-4 font-sans">
        <div className="flex items-center gap-4 py-2">
          <Select value={groupBy} onValueChange={setGroupBy}>
            <SelectTrigger className="w-48 h-9 text-sm bg-transparent">
              <List className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Group By: None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Group By: None</SelectItem>
              <SelectItem value="status">Group By: Status</SelectItem>
              <SelectItem value="priority">Group By: Priority</SelectItem>
              <SelectItem value="type">Group By: Type</SelectItem>
              <SelectItem value="dueDate">Group By: Due Date</SelectItem>
              <SelectItem value="reportedBy">Group By: Reported By</SelectItem>
              <SelectItem value="assignee">Group By: Assignee</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-9 text-sm bg-transparent">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search items"
              className="pl-10 h-9"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
        </div>

        <div className="border border-border rounded-lg bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground border-r border-border">
                    Ticket
                  </th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground border-r border-border">
                    Status
                  </th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground border-r border-border">
                    Reported By
                  </th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground border-r border-border">
                    Assignee
                  </th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground border-r border-border">
                    Reported Date
                  </th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground border-r border-border">
                    Due Date
                  </th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground border-r border-border">
                    Type
                  </th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground border-r border-border">
                    Priority
                  </th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground border-r border-border">
                    Notes
                  </th>
                  <th className="text-center p-3 text-xs font-medium text-muted-foreground w-12">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => setShowCustomColumns(!showCustomColumns)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </th>
                  <th className="text-center p-3 text-xs font-medium text-muted-foreground w-12"></th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((ticket, index) => (
                  <tr
                    key={ticket.id}
                    className={`border-b border-border hover:bg-muted/50 ${index % 2 === 0 ? "bg-background" : "bg-muted/20"}`}
                  >
                    <td className="p-3 border-r border-border">
                      <div className="space-y-1">
                        <div
                          className="text-[13px] font-normal cursor-pointer hover:text-blue-600 hover:underline"
                          onClick={() => handleTicketClick(ticket)}
                        >
                          {ticket.title}
                        </div>
                        <div className="text-xs text-muted-foreground">{ticket.id}</div>
                      </div>
                    </td>
                    <td className="p-3 border-r border-border">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                        {getStatusText(ticket.status)}
                      </span>
                    </td>
                    <td className="p-3 border-r border-border">
                      <div className="flex items-center justify-center">
                        <div
                          className={`w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium`}
                          title={ticket.reportedBy}
                        >
                          {ticket.reportedByAvatar}
                        </div>
                      </div>
                    </td>
                    <td className="p-3 border-r border-border">
                      <div className="flex items-center justify-center">
                        <div
                          className={`w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium`}
                          title={ticket.assignee.name}
                        >
                          {ticket.assignee.avatar}
                        </div>
                      </div>
                    </td>
                    <td className="p-3 border-r border-border">
                      <span className="text-[13px]">{ticket.reportedDate}</span>
                    </td>
                    <td className="p-3 border-r border-border">
                      <span className="text-[13px]">{ticket.dueDate}</span>
                    </td>
                    <td className="p-3 border-r border-border">
                      <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 rounded-full">
                        {ticket.type}
                      </span>
                    </td>
                    <td className="p-3 border-r border-border">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          ticket.priority === "urgent"
                            ? "bg-red-200 text-red-900 dark:bg-red-900/50 dark:text-red-200"
                            : ticket.priority === "high"
                              ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                              : ticket.priority === "medium"
                                ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
                                : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                        }`}
                      >
                        {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                      </span>
                    </td>
                    <td className="p-3 border-r border-border">
                      <Input
                        placeholder="Add notes..."
                        className="h-7 text-xs border-0 bg-transparent focus:bg-background"
                        defaultValue={ticket.notes}
                      />
                    </td>
                    <td className="p-3 border-r border-border text-center">
                      {showCustomColumns && (
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <Plus className="h-3 w-3" />
                        </Button>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Ticket
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate Ticket
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Ticket
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    ),
    [filteredTickets, groupBy, showCustomColumns, searchTerm, handleTicketClick],
  )

  const handleDragStart = useCallback((e: React.DragEvent, ticket: any) => {
    setDraggedTicket(ticket)
    e.dataTransfer.effectAllowed = "move"
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }, [])

  const handleDragEnter = useCallback((e: React.DragEvent, columnId: string) => {
    e.preventDefault()
    setDragOverColumn(columnId)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverColumn(null)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent, targetColumn: string) => {
      e.preventDefault()
      setDragOverColumn(null)

      if (draggedTicket) {
        setTickets((prevTickets) => {
          return prevTickets.map((ticket) => {
            if (ticket.id === draggedTicket.id) {
              const updatedTicket = { ...ticket }
              if (kanbanGroupBy === "type") {
                updatedTicket.type = targetColumn
              } else if (kanbanGroupBy === "status") {
                updatedTicket.status = targetColumn
              } else if (kanbanGroupBy === "priority") {
                updatedTicket.priority = targetColumn
              }
              return updatedTicket
            }
            return ticket
          })
        })

        console.log("[v0] Ticket moved:", draggedTicket.id, "to", targetColumn)
        setDraggedTicket(null)
      }
    },
    [draggedTicket, kanbanGroupBy],
  )

  const getKanbanColumns = useCallback(() => {
    switch (kanbanGroupBy) {
      case "status":
        return [
          { id: "new", title: "New", count: 0, color: "border-t-blue-400" },
          { id: "waiting_on_you", title: "In Progress", count: 0, color: "border-t-yellow-400" },
          { id: "waiting_on_customer", title: "Review", count: 0, color: "border-t-purple-400" },
          { id: "on_hold", title: "Done", count: 0, color: "border-t-green-400" },
        ]
      case "priority":
        return [
          { id: "urgent", title: "Urgent", count: 0, color: "border-t-red-600" },
          { id: "high", title: "High", count: 0, color: "border-t-red-400" },
          { id: "medium", title: "Medium", count: 0, color: "border-t-yellow-400" },
          { id: "low", title: "Low", count: 0, color: "border-t-green-400" },
        ]
      case "category":
        return [
          { id: "technical", title: "Technical", count: 0, color: "border-t-blue-400" },
          { id: "billing", title: "Billing", count: 0, color: "border-t-green-400" },
          { id: "general", title: "General", count: 0, color: "border-t-purple-400" },
          { id: "feature", title: "Feature Request", count: 0, color: "border-t-orange-400" },
        ]
      default: // type
        return [
          { id: "Incident", title: "Incident", count: 0, color: "border-t-red-400" },
          { id: "Request", title: "Request", count: 0, color: "border-t-blue-400" },
          { id: "Problem", title: "Problem", count: 0, color: "border-t-orange-400" },
          { id: "Change", title: "Change", count: 0, color: "border-t-green-400" },
          { id: "General Query", title: "General Query", count: 0, color: "border-t-purple-400" },
        ]
    }
  }, [kanbanGroupBy])

  const getTicketsByGroup = useCallback(
    (groupValue: string) => {
      return filteredTickets.filter((ticket) => {
        switch (kanbanGroupBy) {
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
          default: // type
            return ticket.type === groupValue
        }
      })
    },
    [filteredTickets, kanbanGroupBy],
  )

  const kanbanColumns = useMemo(() => {
    const kanbanColumns = getKanbanColumns().map((column) => {
      return {
        ...column,
        count: transformedTickets.filter((ticket) => {
          switch (kanbanGroupBy) {
            case "status":
              return ticket.status === column.id
            case "priority":
              return ticket.priority === column.id
            case "category":
              const categoryMap: { [key: string]: string } = {
                Incident: "technical",
                Problem: "technical",
                Request: "general",
                Change: "feature",
                "General Query": "general",
              }
              return categoryMap[ticket.type] === column.id
            default: // type
              return ticket.type === column.id
          }
        }).length,
      }
    })
    return kanbanColumns
  }, [transformedTickets, kanbanGroupBy])

  const renderKanbanView = useCallback(
    () => (
      <div className="space-y-6 font-sans">
        <div className="flex items-center gap-4 py-2 border-b border-border">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-10 h-9 w-48 border-0 bg-muted/50 text-[13px]"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>

          <Select
            value={kanbanGroupBy}
            onValueChange={(value: "type" | "status" | "priority" | "category") => setKanbanGroupBy(value)}
          >
            <SelectTrigger className="w-48 h-9 text-[13px]">
              <SelectValue placeholder="Group By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="type">Group By: Type</SelectItem>
              <SelectItem value="status">Group By: Status</SelectItem>
              <SelectItem value="priority">Group By: Priority</SelectItem>
              <SelectItem value="category">Group By: Category</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-32 h-9 text-[13px]">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Incident">Incidents</SelectItem>
              <SelectItem value="Request">Requests</SelectItem>
              <SelectItem value="Problem">Problems</SelectItem>
              <SelectItem value="Change">Changes</SelectItem>
              <SelectItem value="General Query">General Queries</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" className="h-9 text-[13px] bg-transparent font-sans">
            Date Range
          </Button>

          <Select value={selectedPriority} onValueChange={setSelectedPriority}>
            <SelectTrigger className="w-40 h-9 text-[13px]">
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

          <Button variant="outline" size="sm" className="h-9 text-[13px] bg-transparent font-sans">
            <Filter className="h-4 w-4 mr-2" />
            Add filter
          </Button>
        </div>

        <div className="grid grid-cols-5 gap-6">
          {kanbanColumns.map((column) => (
            <div
              key={column.id}
              className={`space-y-4 transition-all duration-200 ${
                dragOverColumn === column.id ? "bg-blue-50 dark:bg-blue-950/20 rounded-lg p-2" : ""
              }`}
              onDragOver={handleDragOver}
              onDragEnter={(e) => handleDragEnter(e, column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div
                className={`border-t-4 ${column.color} bg-card rounded-t-lg ${
                  dragOverColumn === column.id ? "shadow-lg border-2 border-blue-300 border-dashed" : ""
                }`}
              >
                <div className="p-4 pb-2">
                  <h3 className="font-medium text-[13px] mb-2 leading-tight font-sans text-foreground">
                    {column.title} <span className="text-muted-foreground">{column.count}</span>
                  </h3>
                  {dragOverColumn === column.id && draggedTicket && (
                    <div className="text-xs text-blue-600 font-medium">Drop ticket here</div>
                  )}
                </div>
              </div>

              <div className="space-y-3 px-4">
                {getTicketsByGroup(column.id).map((ticket) => (
                  <Card
                    key={ticket.id}
                    className={`hover:shadow-md transition-all cursor-move border border-border bg-card ${
                      draggedTicket?.id === ticket.id ? "opacity-50 scale-95" : ""
                    }`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, ticket)}
                    onClick={() => handleTicketClick(ticket)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-2 mb-3">
                        <div className="flex-1">
                          <h4 className="font-normal text-[13px] mb-2 leading-tight font-sans">{ticket.title}</h4>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                          {getStatusText(ticket.status)}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            ticket.priority === "urgent"
                              ? "bg-red-200 text-red-900 dark:bg-red-900/50 dark:text-red-200"
                              : ticket.priority === "high"
                                ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                                : ticket.priority === "medium"
                                  ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
                                  : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                          }`}
                        >
                          {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                        </span>
                        <div className="w-4 h-4 rounded border border-muted-foreground/30"></div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                            <User className="h-3 w-3" />
                          </div>
                          <span className="text-xs text-red-500">{ticket.timestamp}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          {ticket.comments > 0 && (
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              <span>{ticket.comments}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-8 text-xs text-muted-foreground border-dashed border border-muted-foreground/30 hover:border-muted-foreground/50"
                  onClick={() => setShowTicketTray(true)}
                >
                  <Plus className="h-3 w-3 mr-2" />
                  Add Ticket
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    [
      filteredTickets,
      searchTerm,
      selectedType,
      selectedPriority,
      kanbanGroupBy,
      dragOverColumn,
      draggedTicket,
      handleDragStart,
      handleDragOver,
      handleDragEnter,
      handleDragLeave,
      handleDrop,
      kanbanColumns,
      getTicketsByGroup,
      handleTicketClick,
    ],
  )

  const refreshTickets = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const dbOps = DatabaseOperations.getInstance()
      const ticketsData = await dbOps.getTickets({
        limit: 50,
        orderBy: "created_at",
        orderDirection: "desc",
      })

      setTickets(ticketsData)
    } catch (err) {
      console.error("[v0] Error fetching tickets:", err)
      setError("Failed to load tickets")
    } finally {
      setLoading(false)
    }
  }, [])

  const handleRefreshTickets = async () => {
    await refreshTickets()
  }

  if (loading) {
    return (
      <PlatformLayout breadcrumb={[{ label: "Tickets" }]}>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </PlatformLayout>
    )
  }

  return (
    <PlatformLayout breadcrumb={[{ label: "Tickets" }]}>
      <div className="space-y-6 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Tickets</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {filteredTickets.length} {filteredTickets.length === 1 ? "ticket" : "tickets"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="h-9 bg-transparent font-sans text-[13px]"
              onClick={() => setShowImportDialog(true)}
            >
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button onClick={() => setShowTicketTray(true)} className="h-9 font-sans text-[13px]">
              <Plus className="h-4 w-4 mr-2" />
              Create Ticket
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4 py-4 border-b border-border">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tickets..."
              className="pl-10 h-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-40 h-9">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Task">Task</SelectItem>
              <SelectItem value="Incident">Incident</SelectItem>
              <SelectItem value="Request">Request</SelectItem>
              <SelectItem value="Problem">Problem</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedPriority} onValueChange={setSelectedPriority}>
            <SelectTrigger className="w-40 h-9">
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

          <div className="flex items-center gap-0 border border-border rounded-md">
            <button
              onClick={() => setCurrentView("list")}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                currentView === "list"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentView("kanban")}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                currentView === "kanban"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        {currentView === "list" ? (
          <div className="border border-border rounded-lg bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr className="border-b border-border">
                    <th className="text-left p-4 font-medium text-sm">Ticket</th>
                    <th className="text-left p-4 font-medium text-sm">Status</th>
                    <th className="text-left p-4 font-medium text-sm">Priority</th>
                    <th className="text-left p-4 font-medium text-sm">Type</th>
                    <th className="text-left p-4 font-medium text-sm">Assignee</th>
                    <th className="text-left p-4 font-medium text-sm">Customer</th>
                    <th className="text-left p-4 font-medium text-sm">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-muted-foreground">
                        No tickets found. Create your first ticket to get started.
                      </td>
                    </tr>
                  ) : (
                    filteredTickets.map((ticket) => (
                      <tr key={ticket.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                        <td className="p-4">
                          <div>
                            <div className="font-medium text-sm">{ticket.title}</div>
                            <div className="text-xs text-muted-foreground">{ticket.id}</div>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant="secondary" className={getStatusColor(ticket.status)}>
                            {ticket.status}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Badge variant="secondary" className={getTypeColor(ticket.priority)}>
                            {ticket.priority}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline" className={getTypeColor(ticket.type)}>
                            {ticket.type}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">
                              {ticket.assignee?.name?.charAt(0) || "U"}
                            </div>
                            <span className="text-sm">{ticket.assignee?.name || "Unassigned"}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-sm">{ticket.customer}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-muted-foreground">{ticket.createdAt}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-5 gap-6">
              {kanbanColumns.map((column) => (
                <div key={column.id} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-sm text-gray-900 dark:text-white">{column.title}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {getTicketsByStatus(column.id).length}
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    {getTicketsByStatus(column.id).map((ticket) => (
                      <Card key={ticket.id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <h4 className="font-medium text-sm line-clamp-2">{ticket.title}</h4>
                              <Badge variant="outline" className={getTypeColor(ticket.priority)}>
                                {ticket.priority}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{ticket.id}</span>
                              <span>{ticket.createdAt}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">
                                {ticket.assignee?.name?.charAt(0) || "U"}
                              </div>
                              <span className="text-xs">{ticket.assignee?.name || "Unassigned"}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ticket Tray */}
        <TicketTray isOpen={showTicketTray} onClose={() => setShowTicketTray(false)} onSave={refreshTickets} />

        {/* Import Dialog */}
        <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Import Tickets</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                placeholder="Paste ticket data here..."
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                className="min-h-[120px]"
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setShowImportDialog(false)}>Import</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PlatformLayout>
  )
}
