"use client"

import { useState, useEffect } from "react"
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
  ChevronDown,
  MoreHorizontal,
  Edit,
  Copy,
  Trash2,
  Loader2,
} from "lucide-react"
import { PageContent } from "@/components/layout/page-content"
import { AIAssistantPanel } from "@/components/ai/ai-assistant-panel"
import TicketDrawer from "@/components/tickets/ticket-drawer"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useTicketsGQL } from "@/hooks/use-tickets-gql"
import { useAuth } from "@/lib/contexts/auth-context"
import { format } from "date-fns"
import { MultiAssigneeAvatars } from "@/components/tickets/multi-assignee-avatars"
import { CustomColumnsDialog } from "@/components/tickets/custom-columns-dialog"
import { CustomColumnCell } from "@/components/tickets/custom-column-cell"
import { useCustomColumnsStore } from "@/lib/stores/custom-columns-store"

const mockTickets_UNUSED = [
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
    id: "#5083",
    title: "Dark Mode for the Dashboard",
    description: "I would love to see a dark mode option for the dashboard. It would make it easier on the eyes...",
    company: "Scale",
    companyLogo: "S",
    companyColor: "bg-purple-600",
    customer: "Lebron James",
    reportedBy: "Lebron James",
    reportedByAvatar: "LJ",
    assignee: { name: "John Smith", avatar: "JS" },
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
    id: "#5072",
    title: "When is the Salesforce integration released?",
    description: "We're facing some issues with our current setup and making their members. Could you help us...",
    company: "Brex",
    companyLogo: "B",
    companyColor: "bg-orange-500",
    customer: "Brian Chesky",
    reportedBy: "Brian Chesky",
    reportedByAvatar: "BC",
    assignee: { name: "John Smith", avatar: "JS" },
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
]

const columns = [
  { id: "Incident", title: "Incident", count: 0, color: "border-t-red-400" },
  { id: "Request", title: "Request", count: 0, color: "border-t-blue-400" },
  { id: "Problem", title: "Problem", count: 0, color: "border-t-orange-400" },
  { id: "Change", title: "Change", count: 0, color: "border-t-green-400" },
  { id: "General Query", title: "General Query", count: 0, color: "border-t-purple-400" },
]

export default function MyTicketsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState("all")
  const [selectedPriority, setSelectedPriority] = useState("all")
  const [showAIPanel, setShowAIPanel] = useState(false)
  const [currentView, setCurrentView] = useState<"list" | "kanban">("list")
  const [showTicketTray, setShowTicketTray] = useState(false)
  const [groupBy, setGroupBy] = useState("none")
  const [showCustomColumns, setShowCustomColumns] = useState(false)
  const [showCustomColumnsDialog, setShowCustomColumnsDialog] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState(null)
  
  // Custom columns store
  const { columns: customColumns } = useCustomColumnsStore()

  const { user } = useAuth()
  
  // Fetch tickets assigned to current user
  const { tickets: allTickets, loading, error } = useTicketsGQL({
    assignee_id: user?.id,
    limit: 100
  })

  const myTickets = allTickets || []

  const filteredTickets = myTickets.filter((ticket) => {
    const matchesSearch =
      ticket.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.ticket_number?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedType === "all" || ticket.type === selectedType
    const matchesPriority = selectedPriority === "all" || ticket.priority === selectedPriority
    return matchesSearch && matchesType && matchesPriority
  })

  // Show loading state
  if (loading) {
    return (
      <PageContent breadcrumb={[{ label: "My Tickets" }]}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageContent>
    )
  }

  // Show error state
  if (error) {
    return (
      <PageContent breadcrumb={[{ label: "My Tickets" }]}>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-red-500">Error loading tickets: {error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </PageContent>
    )
  }

  const getTicketsByStatus = (status: string) => {
    return filteredTickets.filter((ticket) => ticket.status === status)
  }

  const getPriorityColor = (priority: string) => {
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
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
      case "waiting_on_you":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
      case "waiting_on_customer":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
      case "on_hold":
        return "bg-muted text-foreground dark:bg-gray-800/30 dark:text-gray-300"
      default:
        return "bg-muted text-foreground dark:bg-gray-800/30 dark:text-gray-300"
    }
  }

  const getStatusText = (status: string) => {
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
  }

  const getTicketsByType = (type: string) => {
    return filteredTickets.filter((ticket) => ticket.type === type)
  }

  const handleTicketClick = (ticket: any) => {
    console.log("[v0] Opening ticket drawer for:", ticket.ticket_number)
    setSelectedTicket({ dbId: ticket.id, ...ticket })
    setShowTicketTray(true)
  }

  const renderListView = () => (
    <div className="space-y-4">
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
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search items"
            className="pl-10 h-9 w-48"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="border border-border rounded-lg 0 overflow-hidden">
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
                <th className="text-left p-3 text-xs font-medium text-muted-foreground border-r border-border">Type</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground border-r border-border">
                  Priority
                </th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground border-r border-border">
                  Notes
                </th>
                {/* Custom columns headers */}
                {customColumns.map((column) => (
                  <th key={column.id} className="text-left p-3 text-xs font-medium text-muted-foreground border-r border-border">
                    {column.title}
                  </th>
                ))}
                {/* Add column button */}
                <th className="text-center p-3 text-xs font-medium text-muted-foreground w-12">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => setShowCustomColumnsDialog(true)}
                    title="Manage custom columns"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </th>
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
                      <div className="text-xs text-muted-foreground">{ticket.ticket_number}</div>
                    </div>
                  </td>
                  <td className="p-3 border-r border-border">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                      {getStatusText(ticket.status)}
                    </span>
                  </td>
                  <td className="p-3 border-r border-border">
                    <div className="flex items-center justify-center">
                      {ticket.requester ? (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-medium"
                            title={ticket.requester.display_name || ticket.requester.email}
                          >
                            {(ticket.requester.first_name?.[0] || '') + (ticket.requester.last_name?.[0] || '')}
                          </div>
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-medium">
                          ?
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-3 border-r border-border">
                    <div className="flex items-center justify-center">
                      <MultiAssigneeAvatars
                        assignees={ticket.assignee ? [{
                          id: ticket.assignee_id || ticket.assignee.id,
                          name: ticket.assignee.display_name || ticket.assignee.email,
                          avatar: (ticket.assignee.first_name?.[0] || '') + (ticket.assignee.last_name?.[0] || ''),
                          display_name: ticket.assignee.display_name,
                          first_name: ticket.assignee.first_name,
                          last_name: ticket.assignee.last_name,
                          avatar_url: ticket.assignee.avatar_url
                        }] : []}
                        maxDisplay={3}
                        size="sm"
                      />
                    </div>
                  </td>
                  <td className="p-3 border-r border-border">
                    <span className="text-[13px]">
                      {ticket.created_at ? format(new Date(ticket.created_at), 'MMM dd, yyyy') : '-'}
                    </span>
                  </td>
                  <td className="p-3 border-r border-border">
                    <span className="text-[13px]">
                      {ticket.due_date ? format(new Date(ticket.due_date), 'MMM dd, yyyy') : '-'}
                    </span>
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
                      defaultValue={ticket.metadata?.notes || ''}
                    />
                  </td>
                  {/* Custom column cells */}
                  {customColumns.map((column) => (
                    <td key={column.id} className="p-3 border-r border-border">
                      <CustomColumnCell column={column} ticketId={ticket.id} />
                    </td>
                  ))}
                  {/* Empty cell for the + button column */}
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
  )

  const renderKanbanView = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4 py-2 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search items"
            className="pl-10 h-9 w-48 border-0 bg-muted/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-32 h-9 text-sm">
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

        <Button variant="outline" size="sm" className="h-9 text-sm bg-transparent">
          Date Range
        </Button>

        <Select value={selectedPriority} onValueChange={setSelectedPriority}>
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

        <Button variant="outline" size="sm" className="h-9 text-sm bg-transparent">
          <Filter className="h-4 w-4 mr-2" />
          Add filter
        </Button>
      </div>

      <div className="grid grid-cols-5 gap-6">
        {columns.map((column) => (
          <div key={column.id} className="space-y-4">
            <div className={`border-t-4 ${column.color} 0 rounded-t-lg`}>
              <div className="p-4 pb-2">
                <h3 className="font-medium text-sm text-foreground">
                  {column.title} <span className="text-muted-foreground">{getTicketsByType(column.id).length}</span>
                </h3>
              </div>
            </div>

            <div className="space-y-3 px-4">
              {getTicketsByType(column.id).map((ticket) => (
                <Card
                  key={ticket.id}
                  className="hover:shadow-md transition-all cursor-pointer border border-border 0"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-2 mb-3">
                      <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 mt-1"></div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm mb-2 leading-tight">{ticket.title}</h4>
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
              >
                <Plus className="h-3 w-3 mr-2" />
                Add Task
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <PageContent breadcrumb={[{ label: "My Tickets" }]}>
      <div className="flex gap-6">
        <div className="flex-1 space-y-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-[13px] font-semibold tracking-tight">My Tickets</h1>
                <span className="bg-muted text-muted-foreground px-2 py-1 rounded text-sm font-medium">
                  {filteredTickets.length}
                </span>
              </div>
              <p className="text-muted-foreground text-sm">View and manage tickets assigned to you.</p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAIPanel(!showAIPanel)}
                className={`h-9 ${showAIPanel ? "bg-[#7073fc] text-white hover:bg-[#5a5dfc]" : ""}`}
              >
                <Bot className="h-4 w-4 mr-2" />
                Ask AI
              </Button>
              <Button variant="outline" size="sm" className="h-9 bg-transparent">
                Import
              </Button>
              <Button onClick={() => setShowTicketTray(true)} className="h-9">
                <Plus className="h-4 w-4 mr-2" />
                Create Ticket
                <ChevronDown className="h-4 w-4 ml-2" />
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
                <Select value="active" onValueChange={() => {}}>
                  <SelectTrigger className="w-40 h-9 text-sm">
                    <SelectValue placeholder="Show By: Active" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Show By: Active</SelectItem>
                    <SelectItem value="all">Show By: All</SelectItem>
                    <SelectItem value="closed">Show By: Closed</SelectItem>
                  </SelectContent>
                </Select>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search Ticket"
                    className="pl-10 h-9 w-48"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <Button variant="outline" size="sm" className="h-9 bg-transparent">
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
            <AIAssistantPanel />
          </div>
        )}
      </div>

      <TicketDrawer
        isOpen={showTicketTray}
        onClose={() => {
          console.log("[v0] Closing ticket drawer")
          setShowTicketTray(false)
          setSelectedTicket(null)
        }}
        ticket={selectedTicket}
      />

      {/* Custom Columns Dialog */}
      <CustomColumnsDialog
        open={showCustomColumnsDialog}
        onOpenChange={setShowCustomColumnsDialog}
      />
    </PageContent>
  )
}
