"use client"

import { useState } from "react"
import { PageContent } from "@/components/layout/page-content"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Filter, Clock, Calendar, Tag, SortAsc, Eye, MessageSquare, Paperclip, List, Table } from "lucide-react"

// Mock data for tickets
const mockTickets = [
  {
    id: "INC-2024-001",
    title: "Email server down - users cannot access emails",
    account: "Acme Corp",
    type: "Incident",
    category: "IT Services",
    subcategory: "Email & Communication",
    item: "Exchange Server",
    impact: "High",
    urgency: "High",
    priority: "Critical",
    status: "In Progress",
    assignee: "John Smith",
    requester: "Sarah Johnson",
    created: "2024-01-15T10:30:00Z",
    updated: "2024-01-15T14:20:00Z",
    sla: "2h remaining",
    comments: 8,
    attachments: 3,
    daysRemaining: 0,
  },
  {
    id: "REQ-2024-045",
    title: "New laptop request for marketing team",
    account: "TechStart Inc",
    type: "Request",
    category: "Hardware",
    subcategory: "Computers & Laptops",
    item: "MacBook Pro",
    impact: "Medium",
    urgency: "Low",
    priority: "Medium",
    status: "Pending Approval",
    assignee: "Mike Wilson",
    requester: "David Chen",
    created: "2024-01-14T09:15:00Z",
    updated: "2024-01-15T11:45:00Z",
    sla: "1d 4h remaining",
    comments: 2,
    attachments: 1,
    daysRemaining: 1,
  },
  {
    id: "PRB-2024-012",
    title: "Recurring network connectivity issues in Building A",
    account: "Global Systems",
    type: "Problem",
    category: "Infrastructure",
    subcategory: "Network",
    item: "WiFi Access Points",
    impact: "High",
    urgency: "Medium",
    priority: "High",
    status: "Under Investigation",
    assignee: "Lisa Anderson",
    requester: "IT Operations",
    created: "2024-01-13T16:20:00Z",
    updated: "2024-01-15T13:10:00Z",
    sla: "6h remaining",
    comments: 15,
    attachments: 5,
    daysRemaining: 0,
  },
  {
    id: "CHG-2024-008",
    title: "Database server maintenance window",
    account: "DataFlow Ltd",
    type: "Change",
    category: "Infrastructure",
    subcategory: "Database",
    item: "SQL Server",
    impact: "High",
    urgency: "Low",
    priority: "Medium",
    status: "Scheduled",
    assignee: "Robert Taylor",
    requester: "Database Team",
    created: "2024-01-12T14:30:00Z",
    updated: "2024-01-15T09:20:00Z",
    sla: "3d 2h remaining",
    comments: 4,
    attachments: 2,
    daysRemaining: 3,
  },
  {
    id: "GEN-2024-156",
    title: "How to reset password for company portal?",
    account: "StartupHub",
    type: "General Query",
    category: "User Support",
    subcategory: "Account Management",
    item: "Password Reset",
    impact: "Low",
    urgency: "Low",
    priority: "Low",
    status: "Resolved",
    assignee: "Emma Davis",
    requester: "Mark Thompson",
    created: "2024-01-15T08:45:00Z",
    updated: "2024-01-15T10:15:00Z",
    sla: "Completed",
    comments: 3,
    attachments: 0,
    daysRemaining: -1,
  },
]

const getPriorityColor = (priority: string) => {
  switch (priority.toLowerCase()) {
    case "critical":
      return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
    case "high":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
    case "medium":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
    case "low":
      return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
  }
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "in progress":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
    case "pending approval":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400"
    case "under investigation":
      return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400"
    case "scheduled":
      return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-400"
    case "resolved":
      return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
  }
}

const getAssigneeInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

const getDaysRemainingColor = (days: number) => {
  if (days < 0) return "text-gray-500"
  if (days === 0) return "text-red-600"
  if (days === 1) return "text-orange-600"
  return "text-green-600"
}

export default function InboxPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState("all")
  const [selectedPriority, setSelectedPriority] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [viewMode, setViewMode] = useState("list")
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [showTaskTray, setShowTaskTray] = useState(false)

  const filteredTickets = mockTickets.filter((ticket) => {
    const matchesSearch =
      ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedType === "all" || ticket.type === selectedType
    const matchesPriority = selectedPriority === "all" || ticket.priority === selectedPriority
    const matchesStatus = selectedStatus === "all" || ticket.status === selectedStatus

    return matchesSearch && matchesType && matchesPriority && matchesStatus
  })

  const handleViewTicket = (ticket) => {
    setSelectedTicket(ticket)
    setShowTaskTray(true)
  }

  return (
    <PageContent>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[13px] font-semibold text-foreground">Tasks</h1>
            <p className="text-sm text-muted-foreground">Manage your assigned tickets and requests</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <SortAsc className="h-4 w-4 mr-2" />
              Sort
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}>
              <Filter className="h-4 w-4 mr-2" />
              Advanced Filters
            </Button>
          </div>
        </div>

        {/* Search and Quick Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-[13px]"
            />
          </div>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Type" />
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
          <Select value={selectedPriority} onValueChange={setSelectedPriority}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="Critical">Critical</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Pending Approval">Pending Approval</SelectItem>
              <SelectItem value="Under Investigation">Under Investigation</SelectItem>
              <SelectItem value="Scheduled">Scheduled</SelectItem>
              <SelectItem value="Resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <Card>
            <CardHeader>
              <CardTitle className="text-[11px]">Advanced Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Category</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="it-services">IT Services</SelectItem>
                      <SelectItem value="hardware">Hardware</SelectItem>
                      <SelectItem value="infrastructure">Infrastructure</SelectItem>
                      <SelectItem value="user-support">User Support</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Impact</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select impact" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Urgency</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select urgency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Assignee</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select assignee" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="john-smith">John Smith</SelectItem>
                      <SelectItem value="mike-wilson">Mike Wilson</SelectItem>
                      <SelectItem value="lisa-anderson">Lisa Anderson</SelectItem>
                      <SelectItem value="robert-taylor">Robert Taylor</SelectItem>
                      <SelectItem value="emma-davis">Emma Davis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" size="sm">
                  Clear Filters
                </Button>
                <Button size="sm">Apply Filters</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={viewMode} onValueChange={setViewMode} className="w-full">
          <TabsList className="grid w-fit grid-cols-3">
            <TabsTrigger value="list" className="text-xs">
              <List className="h-4 w-4 mr-2" />
              List
            </TabsTrigger>
            <TabsTrigger value="table" className="text-xs">
              <Table className="h-4 w-4 mr-2" />
              Table
            </TabsTrigger>
            <TabsTrigger value="kanban" className="text-xs">
              <div className="h-4 w-4 mr-2 grid grid-cols-3 gap-0.5">
                <div className="bg-current rounded-sm"></div>
                <div className="bg-current rounded-sm"></div>
                <div className="bg-current rounded-sm"></div>
                <div className="bg-current rounded-sm"></div>
                <div className="bg-current rounded-sm"></div>
                <div className="bg-current rounded-sm"></div>
              </div>
              Kanban
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {filteredTickets.length} of {mockTickets.length} tickets
              </p>
            </div>

            {filteredTickets.map((ticket) => (
              <Card key={ticket.id} className="hover:bg-highlight transition-colors cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-normal text-foreground text-[13px]">{ticket.title}</h3>
                        <Badge variant="outline" className="text-xs">
                          {ticket.id}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-[13px] text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          {ticket.type}
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                            {getAssigneeInitials(ticket.assignee)}
                          </div>
                          {ticket.assignee}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(ticket.created)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {ticket.sla}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs text-muted-foreground">Category:</span>
                        <span className="text-xs">
                          {ticket.category} → {ticket.subcategory} → {ticket.item}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge className={getPriorityColor(ticket.priority)}>{ticket.priority}</Badge>
                        <Badge className={getStatusColor(ticket.status)}>{ticket.status}</Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <span>Impact: {ticket.impact}</span>
                          <span>•</span>
                          <span>Urgency: {ticket.urgency}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {ticket.comments > 0 && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MessageSquare className="h-3 w-3" />
                          {ticket.comments}
                        </div>
                      )}
                      {ticket.attachments > 0 && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Paperclip className="h-3 w-3" />
                          {ticket.attachments}
                        </div>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => handleViewTicket(ticket)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="table" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {filteredTickets.length} of {mockTickets.length} tickets
              </p>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full border-collapse">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 text-[13px] font-medium border-r border-b">Ticket Name</th>
                    <th className="text-left p-3 text-[13px] font-medium border-r border-b">Account</th>
                    <th className="text-left p-3 text-[13px] font-medium border-r border-b">Priority</th>
                    <th className="text-left p-3 text-[13px] font-medium border-r border-b">Status</th>
                    <th className="text-left p-3 text-[13px] font-medium border-r border-b">Type</th>
                    <th className="text-left p-3 text-[13px] font-medium border-r border-b">Category</th>
                    <th className="text-left p-3 text-[13px] font-medium border-r border-b">Assignee</th>
                    <th className="text-left p-3 text-[13px] font-medium border-r border-b">Assigned Date</th>
                    <th className="text-left p-3 text-[13px] font-medium border-r border-b">Days Remaining</th>
                    <th className="text-left p-3 text-[13px] font-medium border-b">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-muted/30">
                      <td className="p-3 text-[13px] font-normal border-r border-b">{ticket.title}</td>
                      <td className="p-3 text-[13px] border-r border-b">{ticket.account}</td>
                      <td className="p-3 border-r border-b">
                        <Badge className={getPriorityColor(ticket.priority)} size="sm">
                          {ticket.priority}
                        </Badge>
                      </td>
                      <td className="p-3 border-r border-b">
                        <Badge className={getStatusColor(ticket.status)} size="sm">
                          {ticket.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-[13px] border-r border-b">{ticket.type}</td>
                      <td className="p-3 text-[13px] border-r border-b">{ticket.category}</td>
                      <td className="p-3 border-r border-b">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                            {getAssigneeInitials(ticket.assignee)}
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-[13px] border-r border-b">{formatDate(ticket.created)}</td>
                      <td
                        className={`p-3 text-[13px] font-medium border-r border-b ${getDaysRemainingColor(ticket.daysRemaining)}`}
                      >
                        {ticket.daysRemaining < 0
                          ? "Overdue"
                          : ticket.daysRemaining === 0
                            ? "Due Today"
                            : `${ticket.daysRemaining} days`}
                      </td>
                      <td className="p-3 border-b">
                        <Button variant="ghost" size="sm" onClick={() => handleViewTicket(ticket)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="kanban" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {filteredTickets.length} of {mockTickets.length} tickets
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {["In Progress", "Pending Approval", "Under Investigation", "Resolved"].map((status) => {
                const statusTickets = filteredTickets.filter((ticket) => ticket.status === status)
                return (
                  <div key={status} className="bg-muted/20 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-[13px]">{status}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {statusTickets.length}
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      {statusTickets.map((ticket) => (
                        <Card key={ticket.id} className="cursor-pointer hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              <div>
                                <h4 className="font-normal text-[13px] line-clamp-2">{ticket.title}</h4>
                                <p className="text-xs text-muted-foreground mt-1">{ticket.id}</p>
                              </div>

                              <div className="flex items-center justify-between">
                                <Badge className={getPriorityColor(ticket.priority)} size="sm">
                                  {ticket.priority}
                                </Badge>
                                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                                  {getAssigneeInitials(ticket.assignee)}
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{ticket.account}</span>
                                <span className={getDaysRemainingColor(ticket.daysRemaining)}>
                                  {ticket.daysRemaining < 0
                                    ? "Overdue"
                                    : ticket.daysRemaining === 0
                                      ? "Due Today"
                                      : `${ticket.daysRemaining}d`}
                                </span>
                              </div>

                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">{ticket.type}</span>
                                <Button variant="ghost" size="sm" onClick={() => handleViewTicket(ticket)}>
                                  <Eye className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </TabsContent>
        </Tabs>

        {showTaskTray && selectedTicket && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-[11px] font-semibold">Task Details</h2>
                  <Button variant="ghost" size="sm" onClick={() => setShowTaskTray(false)}>
                    ×
                  </Button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Ticket ID</label>
                    <p className="text-[13px]">{selectedTicket.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Account</label>
                    <p className="text-[13px]">{selectedTicket.account}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Title</label>
                    <p className="text-[13px]">{selectedTicket.title}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Type</label>
                    <p className="text-[13px]">{selectedTicket.type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Priority</label>
                    <Badge className={getPriorityColor(selectedTicket.priority)} size="sm">
                      {selectedTicket.priority}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <Badge className={getStatusColor(selectedTicket.status)} size="sm">
                      {selectedTicket.status}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Assignee</label>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                        {getAssigneeInitials(selectedTicket.assignee)}
                      </div>
                      <span className="text-[13px]">{selectedTicket.assignee}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Created Date</label>
                    <p className="text-[13px]">{formatDate(selectedTicket.created)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Category</label>
                    <p className="text-[13px]">{selectedTicket.category}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Impact</label>
                    <p className="text-[13px]">{selectedTicket.impact}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContent>
  )
}
