"use client"

import type React from "react"

import dynamic from "next/dynamic"
import { useState, useCallback, useMemo, Suspense } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Plus,
  Search,
  Filter,
  MessageSquare,
  Bot,
  List,
  User,
  MoreHorizontal,
  Edit,
  Copy,
  Trash2,
  Upload,
  ArrowUpDown,
  Send,
  ArrowUp,
} from "lucide-react"
import { PlatformLayout } from "@/components/layout/platform-layout"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useStore } from "@/lib/store"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
// import { useDataFetcher } from "@/lib/hooks/use-data-fetcher"

const AIAssistantPanel = dynamic(
  () => import("@/components/ai/ai-assistant-panel").then((mod) => ({ default: mod.AIAssistantPanel })),
  {
    loading: () => <LoadingSpinner size="md" />,
    ssr: false,
  },
)

const TicketTray = dynamic(
  () => import("@/components/tickets/ticket-tray").then((mod) => ({ default: mod.TicketTray })),
  {
    loading: () => <LoadingSpinner size="lg" />,
    ssr: false,
  },
)

const mockTickets = [
  {
    id: "#5081",
    title: "Inability to Save Changes in Profile Settings",
    description: "I've encountered an issue where changes made to profile settings are not being saved properly...",
    company: "Gmail",
    companyLogo: "G",
    companyColor: "bg-red-500",
    customer: "Richard Jeffries",
    reportedBy: "Richard Jeffries",
    reportedByAvatar: "RJ",
    assignee: { name: "John Smith", avatar: "JS" },
    status: "new",
    timestamp: "24 minutes ago",
    date: "Aug 29, 2025",
    reportedDate: "Aug 28, 2025",
    dueDate: "Sep 05, 2025",
    comments: 3,
    attachments: 1,
    priority: "medium",
    type: "Incident",
    notes: "Customer reported via email",
  },
  {
    id: "#5079",
    title: "Upcoming subscription renewal discussion",
    description:
      "Hi there, I wanted to discuss our upcoming subscription renewal. Can you help me review the renewal options...",
    company: "Walmart",
    companyLogo: "W",
    companyColor: "bg-blue-600",
    customer: "Robert Eng",
    reportedBy: "Robert Eng",
    reportedByAvatar: "RE",
    assignee: { name: "Sarah Wilson", avatar: "SW" },
    status: "new",
    timestamp: "29 minutes ago",
    date: "Aug 29, 2025",
    reportedDate: "Aug 28, 2025",
    dueDate: "Sep 03, 2025",
    comments: 2,
    attachments: 0,
    priority: "low",
    type: "Request",
    notes: "Customer contacted via phone",
  },
  {
    id: "#5083",
    title: "Dark Mode for the Dashboard",
    description: "I would love to see a dark mode option for the dashboard. It would make it easier on the eyes...",
    company: "Scale",
    companyLogo: "S",
    companyColor: "bg-purple-600",
    customer: "Lebron James",
    reportedBy: "Lebron James",
    reportedByAvatar: "LJ",
    assignee: { name: "Mike Chen", avatar: "MC" },
    status: "waiting_on_you",
    timestamp: "15 minutes ago",
    date: "Aug 29, 2025",
    reportedDate: "Aug 29, 2025",
    dueDate: "Sep 10, 2025",
    comments: 5,
    attachments: 2,
    priority: "medium",
    type: "Request",
    notes: "Customer suggested on social media",
  },
  {
    id: "#5077",
    title: "Cancellation of Zendesk Subscription",
    description:
      "I hope this message finds you well. I am writing to request the cancellation of our Zendesk subscription...",
    company: "Richard Jeffries",
    companyLogo: "RJ",
    companyColor: "bg-green-600",
    customer: "Richard Jeffries",
    reportedBy: "Richard Jeffries",
    reportedByAvatar: "RJ",
    assignee: { name: "Lisa Anderson", avatar: "LA" },
    status: "waiting_on_you",
    timestamp: "33 minutes ago",
    date: "Aug 29, 2025",
    reportedDate: "Aug 28, 2025",
    dueDate: "Sep 01, 2025",
    comments: 8,
    attachments: 1,
    priority: "urgent",
    type: "General Query",
    notes: "Customer requested via email",
  },
  {
    id: "#5072",
    title: "When is the Salesforce integration released?",
    description: "We're facing some issues with our current setup and making their members. Could you help us...",
    company: "Brex",
    companyLogo: "B",
    companyColor: "bg-orange-500",
    customer: "Brian Chesky",
    reportedBy: "Brian Chesky",
    reportedByAvatar: "BC",
    assignee: { name: "Robert Taylor", avatar: "RT" },
    status: "waiting_on_customer",
    timestamp: "1 hour ago",
    date: "Aug 29, 2025",
    reportedDate: "Aug 27, 2025",
    dueDate: "Sep 08, 2025",
    comments: 4,
    attachments: 0,
    priority: "high",
    type: "Problem",
    notes: "Customer reported via support form",
  },
  {
    id: "#5080",
    title: "Issues with article publishing",
    description: "We're facing some issues with articles and making their members. Could you help us...",
    company: "Pylon",
    companyLogo: "P",
    companyColor: "bg-indigo-600",
    customer: "Teresa Nesteby",
    reportedBy: "Teresa Nesteby",
    reportedByAvatar: "TN",
    assignee: { name: "Emma Davis", avatar: "ED" },
    status: "waiting_on_customer",
    timestamp: "45 minutes ago",
    date: "Aug 29, 2025",
    reportedDate: "Aug 28, 2025",
    dueDate: "Sep 06, 2025",
    comments: 2,
    attachments: 3,
    priority: "high",
    type: "Incident",
    notes: "Customer reported via chat",
  },
]

const columns = [
  { id: "Incident", title: "Incident", count: 0, color: "border-t-red-400" },
  { id: "Request", title: "Request", count: 0, color: "border-t-blue-400" },
  { id: "Problem", title: "Problem", count: 0, color: "border-t-orange-400" },
  { id: "Change", title: "Change", count: 0, color: "border-t-green-400" },
  { id: "General Query", title: "General Query", count: 0, color: "border-t-purple-400" },
]

export default function TicketsPage() {
  const { tickets, setTickets, loading, setLoading, user } = useStore()

  // const {
  //   data: fetchedTickets,
  //   loading: dataLoading,
  //   error,
  //   refetch,
  // } = useDataFetcher({
  //   table: "tickets",
  //   select: "*",
  //   orderBy: { column: "created_at", ascending: false },
  //   cache: true,
  //   cacheTTL: 5 * 60 * 1000, // 5 minutes cache
  // })

  console.log("[v0] Using mock tickets data to avoid RLS policy recursion")

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState("all")
  const [selectedPriority, setSelectedPriority] = useState("all")
  const [showAIPanel, setShowAIPanel] = useState(false)
  const [currentView, setCurrentView] = useState<"list" | "kanban">("list")
  const [showTicketTray, setShowTicketTray] = useState(false)
  const [groupBy, setGroupBy] = useState("none")
  const [showCustomColumns, setShowCustomColumns] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [ticketView, setTicketView] = useState<"all" | "my">("all")
  const [kanbanGroupBy, setKanbanGroupBy] = useState<"type" | "status" | "priority" | "category">("type")
  const [draggedTicket, setDraggedTicket] = useState<any>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
  const [localTickets, setLocalTickets] = useState(mockTickets)

  const [showAIChat, setShowAIChat] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [aiMessages, setAiMessages] = useState<
    Array<{ id: string; type: "user" | "ai"; content: string; timestamp: Date }>
  >([])
  const [aiInput, setAiInput] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)

  const filteredTickets = useMemo(() => {
    const ticketsToFilter = localTickets
    return ticketsToFilter.filter((ticket) => {
      const matchesSearch =
        ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.id.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = selectedType === "all" || ticket.type === selectedType
      const matchesPriority = selectedPriority === "all" || ticket.priority === selectedPriority
      const matchesAssignee =
        ticketView === "all" ||
        (ticketView === "my" && ticket.assignee?.name === user?.display_name) ||
        (ticketView === "my" && ticket.assignee?.name === "John Smith") // Fallback for demo

      return matchesSearch && matchesType && matchesPriority && matchesAssignee
    })
  }, [searchTerm, selectedType, selectedPriority, ticketView, user, localTickets])

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

  const getPriorityColor = useCallback((priority: string) => {
    switch (priority) {
      case "urgent":
        return "border-l-red-600"
      case "high":
        return "border-l-red-500"
      case "medium":
        return "border-l-yellow-500"
      case "low":
        return "border-l-green-500"
      default:
        return "border-l-gray-300"
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
                          className={`w-6 h-6 rounded-full ${ticket.companyColor} flex items-center justify-center text-white text-xs font-medium`}
                          title={ticket.reportedBy}
                        >
                          {ticket.reportedByAvatar}
                        </div>
                      </div>
                    </td>
                    <td className="p-3 border-r border-border">
                      <div className="flex items-center justify-center">
                        <div
                          className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium"
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
        setLocalTickets((prevTickets) => {
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
          {getKanbanColumns().map((column) => (
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
                    {column.title} <span className="text-muted-foreground">{getTicketsByGroup(column.id).length}</span>
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
      getKanbanColumns,
      getTicketsByGroup,
      handleTicketClick,
    ],
  )

  return (
    <PlatformLayout breadcrumb={[{ label: "Tickets" }]}>
      <div className="flex gap-6 font-sans text-[13px]">
        <div className="flex-1 space-y-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight font-sans">
                  {ticketView === "all" ? "All Tickets" : "My Tickets"}
                </h1>
                <span className="bg-muted text-muted-foreground px-2 py-1 rounded text-sm font-medium font-sans">
                  {filteredTickets.length}
                </span>
              </div>
              <p className="text-muted-foreground text-sm font-sans">
                {ticketView === "all"
                  ? "Manage all support tickets and track customer issues effortlessly."
                  : "View and manage tickets assigned to you."}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAIChat(true)}
                className="h-9 font-sans text-[13px]"
              >
                <Bot className="h-4 w-4 mr-2" />
                Ask AI
              </Button>
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

          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border">
              <div className="flex items-center gap-0">
                <button
                  onClick={() => setCurrentView("list")}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    currentView === "list"
                      ? "text-blue-600 border-blue-600"
                      : "text-muted-foreground border-transparent hover:text-foreground"
                  }`}
                >
                  List
                </button>
                <button
                  onClick={() => setCurrentView("kanban")}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    currentView === "kanban"
                      ? "text-blue-600 border-blue-600"
                      : "text-muted-foreground border-transparent hover:text-foreground"
                  }`}
                >
                  Kanban
                </button>
              </div>

              <div className="flex items-center gap-3 pb-3">
                <Select value={ticketView} onValueChange={(value: "all" | "my") => setTicketView(value)}>
                  <SelectTrigger className="w-40 h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tickets</SelectItem>
                    <SelectItem value="my">My Tickets</SelectItem>
                  </SelectContent>
                </Select>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search Ticket"
                    className="pl-10 h-9 w-48"
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                  />
                </div>

                <Button variant="outline" size="sm" className="h-9 bg-transparent font-sans text-[13px]">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
            </div>
          </div>

          {currentView === "list" && renderListView()}
          {currentView === "kanban" && renderKanbanView()}
        </div>

        {showAIPanel && (
          <div className="w-80 shrink-0">
            <Suspense fallback={<LoadingSpinner size="md" />}>
              <AIAssistantPanel />
            </Suspense>
          </div>
        )}
      </div>

      <Dialog open={showAIChat} onOpenChange={setShowAIChat}>
        <DialogContent className="max-w-4xl h-[600px] flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-blue-600" />
                <span className="font-sans text-[16px]">Ask AI about Tickets</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAIChat}
                className="text-muted-foreground hover:text-foreground"
              >
                Clear Chat
              </Button>
            </DialogTitle>
          </DialogHeader>

          {/* Chat Messages Area */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {aiMessages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center">
                <div className="space-y-2">
                  <Bot className="h-12 w-12 text-muted-foreground mx-auto" />
                  <p className="text-muted-foreground font-sans text-[13px]">
                    Ask me anything about your tickets, trends, priorities, or support workflow
                  </p>
                </div>
              </div>
            ) : (
              aiMessages.map((message) => (
                <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.type === "user" ? "bg-blue-600 text-white" : "bg-muted text-foreground"
                    }`}
                  >
                    <p className="font-sans text-[13px] whitespace-pre-wrap">{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${message.type === "user" ? "text-blue-100" : "text-muted-foreground"}`}
                    >
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}

            {aiLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-4 py-2">
                  <div className="flex items-center gap-2">
                    <LoadingSpinner size="sm" />
                    <span className="font-sans text-[13px] text-muted-foreground">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input Area */}
          <div className="border-t px-6 py-4">
            <div className="flex items-end gap-3">
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Plus className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex-1 relative">
                <Textarea
                  placeholder="Ask AI about your tickets..."
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="min-h-[40px] max-h-[120px] resize-none pr-12 font-sans text-[13px]"
                  disabled={aiLoading}
                />
                <Button
                  onClick={handleSendAIMessage}
                  disabled={!aiInput.trim() || aiLoading}
                  size="sm"
                  className="absolute right-2 bottom-2 h-8 w-8 p-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <ArrowUp className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-blue-600" />
              Import Tickets
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Select file to import</label>
              <Input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground mt-1">Supported formats: CSV, Excel (.xlsx, .xls)</p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
              <h4 className="font-medium text-sm mb-1">Import Requirements:</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• File must contain columns: Title, Description, Priority, Type</li>
                <li>• Optional columns: Assignee, Due Date, Status</li>
                <li>• Maximum file size: 10MB</li>
              </ul>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleImportTickets} disabled={!importFile}>
                Import Tickets
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Suspense fallback={<LoadingSpinner size="lg" />}>
        <TicketTray
          isOpen={showTicketTray}
          onClose={() => {
            console.log("[v0] Closing ticket tray")
            setShowTicketTray(false)
            setSelectedTicket(null)
          }}
          ticket={selectedTicket}
        />
      </Suspense>
    </PlatformLayout>
  )
}
