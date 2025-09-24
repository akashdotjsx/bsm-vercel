"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Filter, Search, ExternalLink } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"

interface Ticket {
  id: string
  title: string
  description: string
  type: string
  priority: string
  status: string
  department: string
  created_at: string
  resolved_at?: string
  assignee?: string
}

interface DetailedReportProps {
  title: string
  category: string
  item: string
  onBack: () => void
}

const COLORS = {
  departments: {
    IT: "#3b82f6",
    HR: "#10b981",
    Finance: "#f59e0b",
    Legal: "#7073fc",
    Facilities: "#f97316",
    Security: "#ef4444",
  },
  types: {
    Incident: "#ef4444",
    Request: "#3b82f6",
    Change: "#f59e0b",
    Problem: "#10b981",
  },
  status: {
    Open: "#f59e0b",
    "In Progress": "#3b82f6",
    Resolved: "#10b981",
    Closed: "#6b7280",
  },
  priority: {
    Critical: "#dc2626",
    High: "#f97316",
    Medium: "#eab308",
    Low: "#22c55e",
  },
}

const DetailedReport = ({ title, category, item, onBack }: DetailedReportProps) => {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")

  useEffect(() => {
    fetchTicketData()
  }, [category, item])

  useEffect(() => {
    applyFilters()
  }, [tickets, searchTerm, departmentFilter, typeFilter, statusFilter, priorityFilter])

  const fetchTicketData = async () => {
    try {
      setLoading(true)
      const mockTickets = generateMockTickets(category, item)
      setTickets(mockTickets)
    } catch (error) {
      console.error("Error fetching ticket data:", error)
    } finally {
      setLoading(false)
    }
  }

  const generateMockTickets = (category: string, item: string): Ticket[] => {
    const tickets: Ticket[] = []
    const ticketCount = Math.floor(Math.random() * 50) + 20 // 20-70 tickets

    for (let i = 1; i <= ticketCount; i++) {
      const ticket: Ticket = {
        id: `TKT-${String(i).padStart(4, "0")}`,
        title: generateTicketTitle(category, item),
        description: generateTicketDescription(category, item),
        type: category === "type" ? item : getRandomValue(["Incident", "Request", "Change", "Problem"]),
        priority: category === "priority" ? item : getRandomValue(["Critical", "High", "Medium", "Low"]),
        status: category === "status" ? item : getRandomValue(["Open", "In Progress", "Resolved", "Closed"]),
        department:
          category === "department" ? item : getRandomValue(["IT", "HR", "Finance", "Legal", "Facilities", "Security"]),
        created_at: generateRandomDate(),
        resolved_at: Math.random() > 0.3 ? generateRandomDate() : undefined,
        assignee: getRandomValue(["John Smith", "Sarah Johnson", "Mike Chen", "Emily Davis", "Alex Wilson"]),
      }
      tickets.push(ticket)
    }

    return tickets
  }

  const generateTicketTitle = (category: string, item: string): string => {
    const titles = {
      IT: ["Network connectivity issue", "Software installation request", "Hardware malfunction", "Password reset"],
      HR: ["Employee onboarding", "Benefits inquiry", "Policy clarification", "Training request"],
      Finance: ["Invoice processing", "Budget approval", "Expense reimbursement", "Financial report"],
      Legal: ["Contract review", "Compliance audit", "Legal consultation", "Document approval"],
      Facilities: ["Office maintenance", "Equipment request", "Space allocation", "Security access"],
      Security: ["Access control", "Security incident", "Badge replacement", "System vulnerability"],
    }

    if (category === "department" && titles[item as keyof typeof titles]) {
      return getRandomValue(titles[item as keyof typeof titles])
    }

    return `${item} related issue - ${getRandomValue(["System", "User", "Process", "Configuration"])} problem`
  }

  const generateTicketDescription = (category: string, item: string): string => {
    return `This is a ${item} ticket that requires attention. The issue has been reported and needs to be addressed according to our standard procedures.`
  }

  const generateRandomDate = (): string => {
    const start = new Date(2024, 0, 1)
    const end = new Date()
    const randomDate = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
    return randomDate.toISOString()
  }

  const getRandomValue = (array: string[]): string => {
    return array[Math.floor(Math.random() * array.length)]
  }

  const applyFilters = () => {
    let filtered = tickets

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (ticket) =>
          ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ticket.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ticket.description.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Department filter
    if (departmentFilter !== "all") {
      filtered = filtered.filter((ticket) => ticket.department === departmentFilter)
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((ticket) => ticket.type === typeFilter)
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((ticket) => ticket.status === statusFilter)
    }

    // Priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter((ticket) => ticket.priority === priorityFilter)
    }

    setFilteredTickets(filtered)
  }

  const getChipColor = (type: string, value: string): string => {
    const colorMap = COLORS[type as keyof typeof COLORS] as Record<string, string>
    return colorMap?.[value] || "#6b7280"
  }

  const formatDate = (dateString: string): string => {
    return format(new Date(dateString), "MMM dd, yyyy")
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">{title}</h1>
        <Badge variant="secondary">{filteredTickets.length} tickets</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="IT">IT</SelectItem>
                <SelectItem value="HR">HR</SelectItem>
                <SelectItem value="Finance">Finance</SelectItem>
                <SelectItem value="Legal">Legal</SelectItem>
                <SelectItem value="Facilities">Facilities</SelectItem>
                <SelectItem value="Security">Security</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Incident">Incident</SelectItem>
                <SelectItem value="Request">Request</SelectItem>
                <SelectItem value="Change">Change</SelectItem>
                <SelectItem value="Problem">Problem</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Resolved">Resolved</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ticket Details</CardTitle>
          <CardDescription>
            Showing {filteredTickets.length} of {tickets.length} tickets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Assignee</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell>
                    <Link
                      href={`/tickets/${ticket.id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                    >
                      {ticket.id}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{ticket.title}</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      style={{
                        backgroundColor: `${getChipColor("departments", ticket.department)}20`,
                        color: getChipColor("departments", ticket.department),
                        borderColor: getChipColor("departments", ticket.department),
                      }}
                    >
                      {ticket.department}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      style={{
                        backgroundColor: `${getChipColor("types", ticket.type)}20`,
                        color: getChipColor("types", ticket.type),
                        borderColor: getChipColor("types", ticket.type),
                      }}
                    >
                      {ticket.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      style={{
                        backgroundColor: `${getChipColor("priority", ticket.priority)}20`,
                        color: getChipColor("priority", ticket.priority),
                        borderColor: getChipColor("priority", ticket.priority),
                      }}
                    >
                      {ticket.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      style={{
                        backgroundColor: `${getChipColor("status", ticket.status)}20`,
                        color: getChipColor("status", ticket.status),
                        borderColor: getChipColor("status", ticket.status),
                      }}
                    >
                      {ticket.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(ticket.created_at)}</TableCell>
                  <TableCell>{ticket.assignee || "Unassigned"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default DetailedReport
