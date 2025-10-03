"use client"

import { useState } from "react"
import { PlatformLayout } from "@/components/layout/platform-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Plus,
  MoreHorizontal,
  Search,
  Filter,
  Sparkles,
  Upload,
  ChevronDown,
  List,
  Eye,
  User,
  Settings,
  Briefcase,
  Cog,
  Book,
  BarChart3,
  Bell,
  Zap,
  CheckCircle,
  Clock,
  Triangle,
  FileText,
  Users2,
} from "lucide-react"

interface Ticket {
  id: string
  title: string
  ticketNumber: string
  status: "New" | "In Progress" | "Review" | "Resolved" | "Closed"
  reportedBy: {
  name: string
    initials: string
    color: string
}
  assignee: {
  name: string
    initials: string
  color: string
  }
  reportedDate: string
  dueDate: string
  type: "Incident" | "Request" | "General Query" | "Problem"
  priority: "Low" | "Medium" | "High" | "Urgent"
  notes: string
}

export default function AllTicketsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("List")
  const [groupBy, setGroupBy] = useState("None")

  // Sample tickets data matching the image
  const tickets: Ticket[] = [
    {
      id: "1",
      title: "Inability to Save Changes in Profile Settings",
      ticketNumber: "#5081",
      status: "New",
      reportedBy: { name: "RJ", initials: "RJ", color: "bg-red-500" },
      assignee: { name: "JS", initials: "JS", color: "bg-blue-500" },
      reportedDate: "Aug 28, 2025",
      dueDate: "Sep 05, 2025",
      type: "Incident",
      priority: "Medium",
      notes: "Customer reported via email"
    },
    {
      id: "2",
      title: "Upcoming subscription renewal discussion",
      ticketNumber: "#5079",
      status: "New",
      reportedBy: { name: "RE", initials: "RE", color: "bg-blue-500" },
      assignee: { name: "SW", initials: "SW", color: "bg-blue-500" },
      reportedDate: "Aug 28, 2025",
      dueDate: "Sep 03, 2025",
      type: "Request",
      priority: "Low",
      notes: "Customer contacted via phone"
    },
    {
      id: "3",
      title: "Dark Mode for the Dashboard",
      ticketNumber: "#5083",
      status: "In Progress",
      reportedBy: { name: "LJ", initials: "LJ", color: "bg-purple-500" },
      assignee: { name: "MC", initials: "MC", color: "bg-blue-500" },
      reportedDate: "Aug 29, 2025",
      dueDate: "Sep 10, 2025",
      type: "Request",
      priority: "Medium",
      notes: "Customer suggested on social media"
    },
    {
      id: "4",
      title: "Cancellation of Zendesk Subscription",
      ticketNumber: "#5077",
      status: "In Progress",
      reportedBy: { name: "RJ", initials: "RJ", color: "bg-green-500" },
      assignee: { name: "LA", initials: "LA", color: "bg-blue-500" },
      reportedDate: "Aug 28, 2025",
      dueDate: "Sep 01, 2025",
      type: "General Query",
      priority: "Urgent",
      notes: "Customer requested via email"
    },
    {
      id: "5",
      title: "When is the Salesforce integration released?",
      ticketNumber: "#5072",
      status: "Review",
      reportedBy: { name: "BC", initials: "BC", color: "bg-orange-500" },
      assignee: { name: "RT", initials: "RT", color: "bg-blue-500" },
      reportedDate: "Aug 27, 2025",
      dueDate: "Sep 08, 2025",
      type: "Problem",
      priority: "High",
      notes: "Customer reported via support form"
    },
    {
      id: "6",
      title: "Issues with article publishing",
      ticketNumber: "#5080",
      status: "Review",
      reportedBy: { name: "TN", initials: "TN", color: "bg-purple-500" },
      assignee: { name: "ED", initials: "ED", color: "bg-blue-500" },
      reportedDate: "Aug 28, 2025",
      dueDate: "Sep 06, 2025",
      type: "Incident",
      priority: "High",
      notes: "Customer reported via chat"
    }
  ]

  const filteredTickets = tickets.filter((ticket) => {
    if (searchTerm) {
      return (
        ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.notes.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    return true
  })

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "New":
        return "bg-blue-500 text-white"
      case "In Progress":
        return "bg-yellow-500 text-gray-900"
      case "Review":
        return "bg-purple-500 text-white"
      case "Resolved":
        return "bg-green-500 text-white"
      case "Closed":
        return "bg-gray-500 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case "Low":
        return "bg-green-500 text-gray-900"
      case "Medium":
        return "bg-orange-500 text-gray-900"
      case "High":
        return "bg-red-500 text-white"
      case "Urgent":
        return "bg-red-500 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  const getTypeBadgeColor = (type: string) => {
    return "bg-yellow-500 text-gray-900"
  }

  return (
    <PlatformLayout
      title="All Tickets"
      description="Manage all support tickets and track customer issues effortlessly."
    >
      <div className="space-y-6 font-sans text-[13px]">
        {/* Header with title, description, and action buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
          <div>
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900">All Tickets</h1>
              <p className="text-[13px] text-gray-500">Manage all support tickets and track customer issues effortlessly.</p>
            </div>
            <div className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
              {tickets.length}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button className="bg-purple-600 hover:bg-purple-700 text-white text-sm">
              <Sparkles className="h-4 w-4 mr-2" />
              Ask AI
            </Button>
            <Button variant="outline" className="text-gray-600 border-gray-300 text-sm">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white text-sm">
            <Plus className="h-4 w-4 mr-2" />
              + Create Ticket
          </Button>
        </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("List")}
            className={`pb-2 text-sm font-medium ${
              activeTab === "List" 
                ? "text-blue-600 border-b-2 border-blue-600" 
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            List
          </button>
          <button
            onClick={() => setActiveTab("Kanban")}
            className={`pb-2 text-sm font-medium ${
              activeTab === "Kanban" 
                ? "text-blue-600 border-b-2 border-blue-600" 
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Kanban
          </button>
        </div>

        {/* Search and Filter Controls */}
        <div className="flex items-center gap-4">
          <Select defaultValue="all-tickets">
            <SelectTrigger className="w-40 text-sm">
              <SelectValue />
              <ChevronDown className="h-4 w-4" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-tickets">All Tickets</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
              placeholder="Search Ticket"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-sm"
          />
        </div>

          <Button variant="outline" className="text-gray-600 border-gray-300">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
                </div>

        {/* Table Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Select value={groupBy} onValueChange={setGroupBy}>
              <SelectTrigger className="w-40 text-sm">
                <List className="h-4 w-4 mr-2" />
                <SelectValue />
                <ChevronDown className="h-4 w-4" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="None">Group By: None</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" className="text-gray-600 border-gray-300">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
              </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search items"
              className="pl-10 w-64 text-sm"
            />
                </div>
              </div>

        {/* Tickets Table */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reported By</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reported Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <Plus className="h-4 w-4" />
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                <div>
                        <div className="text-sm font-medium text-gray-900">{ticket.title}</div>
                        <div className="text-sm text-gray-500">{ticket.ticketNumber}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <Badge className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeColor(ticket.status)}`}>
                        {ticket.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`h-8 w-8 rounded-full ${ticket.reportedBy.color} flex items-center justify-center text-white text-xs font-medium`}>
                          {ticket.reportedBy.initials}
                </div>
              </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`h-8 w-8 rounded-full ${ticket.assignee.color} flex items-center justify-center text-white text-xs font-medium`}>
                          {ticket.assignee.initials}
                </div>
              </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {ticket.reportedDate}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {ticket.dueDate}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <Badge className={`text-xs px-2 py-1 rounded-full ${getTypeBadgeColor(ticket.type)}`}>
                        {ticket.type}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <Badge className={`text-xs px-2 py-1 rounded-full ${getPriorityBadgeColor(ticket.priority)}`}>
                        {ticket.priority}
                          </Badge>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ticket.notes}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem>Delete</DropdownMenuItem>
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
    </PlatformLayout>
  )
}
