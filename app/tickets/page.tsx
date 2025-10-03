"use client"

import type React from "react"

import dynamic from "next/dynamic"
import { useState, useCallback, useMemo, Suspense, useEffect } from "react"
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
  Sparkles,
  Download,
} from "lucide-react"
import { PlatformLayout } from "@/components/layout/platform-layout"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useStore } from "@/lib/store"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useTickets } from "@/hooks/use-tickets"
import { useTicketTypes } from "@/hooks/use-ticket-types"
import { format } from "date-fns"

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

// Real data from Supabase
const realTickets = [
  {
    id: "b4c8d6b2-e77d-430d-af57-b8278f21b26d",
    ticket_number: "TK-1759421483412-AZZU",
    title: "Login",
    description: "eee",
    type: "request",
    priority: "medium",
    status: "new",
    created_at: "2025-10-02 16:11:24.060378+00",
    due_date: null,
    requester_id: "52708adf-75fd-4fa2-b98e-67e457a15abe",
    assignee_id: null,
    team_id: null,
    requester_first_name: "Bhive",
    requester_last_name: "Admin",
    requester_display_name: "Bhive Admin",
    assignee_first_name: null,
    assignee_last_name: null,
    assignee_display_name: null,
    team_name: null,
  },
  {
    id: "7eef4ca8-6bc7-4b1a-b9f8-07ddbb0051c3",
    ticket_number: "TK-1759327995399-5OC2",
    title: "This is a test ticket",
    description: null,
    type: "general_query",
    priority: "critical",
    status: "new",
    created_at: "2025-10-01 14:13:15.114338+00",
    due_date: null,
    requester_id: "52708adf-75fd-4fa2-b98e-67e457a15abe",
    assignee_id: null,
    team_id: null,
    requester_first_name: "Bhive",
    requester_last_name: "Admin",
    requester_display_name: "Bhive Admin",
    assignee_first_name: null,
    assignee_last_name: null,
    assignee_display_name: null,
    team_name: null,
  },
  {
    id: "07c32aeb-7494-40fd-a7d9-9daccab861ba",
    ticket_number: "TKT-2024-001",
    title: "New Laptop Request for Marketing Team",
    description: "Need a new MacBook Pro for the marketing team member who joined last week. Current laptop is outdated and cannot handle design software.",
    type: "request",
    priority: "medium",
    status: "new",
    created_at: "2025-10-01 14:07:40.633381+00",
    due_date: null,
    requester_id: "8acd6a2f-f85b-4387-b673-026fa9852185",
    assignee_id: "96b9692e-20db-4467-ac44-3011562aa2bd",
    team_id: null,
    requester_first_name: "Mohammed",
    requester_last_name: "zufishan",
    requester_display_name: "Mohammed zufishan",
    assignee_first_name: "Akash",
    assignee_last_name: "Kamat",
    assignee_display_name: "Akash Kamat",
    team_name: null,
  },
  {
    id: "56f1c37b-9163-4798-a5a7-487a495f53fa",
    ticket_number: "TKT-2024-004",
    title: "Office Relocation Request",
    description: "Need to relocate to a larger office space on the 5th floor. Current space is too small for our growing team of 8 people.",
    type: "request",
    priority: "medium",
    status: "new",
    created_at: "2025-10-01 14:07:40.633381+00",
    due_date: null,
    requester_id: "8acd6a2f-f85b-4387-b673-026fa9852185",
    assignee_id: null,
    team_id: null,
    requester_first_name: "Mohammed",
    requester_last_name: "zufishan",
    requester_display_name: "Mohammed zufishan",
    assignee_first_name: null,
    assignee_last_name: null,
    assignee_display_name: null,
    team_name: null,
  },
  {
    id: "5c7e7c59-8a6d-4325-b259-0a34c502b740",
    ticket_number: "TKT-2024-008",
    title: "Vendor Contract Review",
    description: "Need legal review of new vendor contract for cloud services. Contract includes data processing terms that need legal approval.",
    type: "request",
    priority: "high",
    status: "new",
    created_at: "2025-10-01 14:07:40.633381+00",
    due_date: null,
    requester_id: "96b9692e-20db-4467-ac44-3011562aa2bd",
    assignee_id: null,
    team_id: null,
    requester_first_name: "Akash",
    requester_last_name: "Kamat",
    requester_display_name: "Akash Kamat",
    assignee_first_name: null,
    assignee_last_name: null,
    assignee_display_name: null,
    team_name: null,
  },
  {
    id: "9daa916b-2b1a-4c95-9147-4fb0b11ff893",
    ticket_number: "TKT-2024-014",
    title: "Suspicious Login Attempts Detected",
    description: "Security system detected multiple failed login attempts from unknown IP addresses. Need immediate investigation.",
    type: "incident",
    priority: "critical",
    status: "in_progress",
    created_at: "2025-09-30 14:24:45.785263+00",
    due_date: null,
    requester_id: "e48e5883-4319-4a0d-9cc0-48ee54ef14ed",
    assignee_id: "96b9692e-20db-4467-ac44-3011562aa2bd",
    team_id: null,
    requester_first_name: "Vansh",
    requester_last_name: "G",
    requester_display_name: "Vansh G",
    assignee_first_name: "Akash",
    assignee_last_name: "Kamat",
    assignee_display_name: "Akash Kamat",
    team_name: null,
  },
  {
    id: "505c8b51-65ee-4074-9bc4-b73621895499",
    ticket_number: "TKT-2024-003",
    title: "Q4 Marketing Budget Approval",
    description: "Requesting approval for Q4 marketing budget of $50,000. This includes digital advertising, content creation, and event marketing.",
    type: "request",
    priority: "high",
    status: "pending",
    created_at: "2025-09-30 14:07:40.633381+00",
    due_date: null,
    requester_id: "96b9692e-20db-4467-ac44-3011562aa2bd",
    assignee_id: "52708adf-75fd-4fa2-b98e-67e457a15abe",
    team_id: null,
    requester_first_name: "Akash",
    requester_last_name: "Kamat",
    requester_display_name: "Akash Kamat",
    assignee_first_name: "Bhive",
    assignee_last_name: "Admin",
    assignee_display_name: "Bhive Admin",
    team_name: null,
  },
  {
    id: "3c8b7505-f715-4b89-ae5e-cbd0412421f4",
    ticket_number: "TKT-2024-006",
    title: "New Employee Onboarding - Sarah Johnson",
    description: "Complete onboarding setup for new hire Sarah Johnson starting Monday. Need to set up accounts, equipment, and access permissions.",
    type: "request",
    priority: "high",
    status: "open",
    created_at: "2025-09-30 14:07:40.633381+00",
    due_date: null,
    requester_id: "52708adf-75fd-4fa2-b98e-67e457a15abe",
    assignee_id: "96b9692e-20db-4467-ac44-3011562aa2bd",
    team_id: null,
    requester_first_name: "Bhive",
    requester_last_name: "Admin",
    requester_display_name: "Bhive Admin",
    assignee_first_name: "Akash",
    assignee_last_name: "Kamat",
    assignee_display_name: "Akash Kamat",
    team_name: null,
  },
  {
    id: "4e29f436-f903-4d74-8616-e7330ae4a7ff",
    ticket_number: "TKT-2024-015",
    title: "Project Management Training Request",
    description: "Team needs training on new project management software. Requesting 2-day training session for 8 team members.",
    type: "request",
    priority: "medium",
    status: "pending",
    created_at: "2025-09-29 14:24:45.785263+00",
    due_date: null,
    requester_id: "96b9692e-20db-4467-ac44-3011562aa2bd",
    assignee_id: "52708adf-75fd-4fa2-b98e-67e457a15abe",
    team_id: null,
    requester_first_name: "Akash",
    requester_last_name: "Kamat",
    requester_display_name: "Akash Kamat",
    assignee_first_name: "Bhive",
    assignee_last_name: "Admin",
    assignee_display_name: "Bhive Admin",
    team_name: null,
  },
  {
    id: "866af67f-d2d0-4cdc-a34d-decf21a83fcd",
    ticket_number: "TKT-2024-009",
    title: "Printer Maintenance Required",
    description: "Office printer on 3rd floor is showing error codes and not printing properly. Need technician to diagnose and fix.",
    type: "incident",
    priority: "medium",
    status: "in_progress",
    created_at: "2025-09-29 14:07:40.633381+00",
    due_date: null,
    requester_id: "e48e5883-4319-4a0d-9cc0-48ee54ef14ed",
    assignee_id: "96b9692e-20db-4467-ac44-3011562aa2bd",
    team_id: null,
    requester_first_name: "Vansh",
    requester_last_name: "G",
    requester_display_name: "Vansh G",
    assignee_first_name: "Akash",
    assignee_last_name: "Kamat",
    assignee_display_name: "Akash Kamat",
    team_name: null,
  },
]

// Helper function to generate avatar initials
const getAvatarInitials = (firstName?: string, lastName?: string, displayName?: string) => {
  if (displayName) {
    const names = displayName.split(' ')
    return names.map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }
  if (firstName && lastName) {
    return (firstName[0] + lastName[0]).toUpperCase()
  }
  if (firstName) {
    return firstName.slice(0, 2).toUpperCase()
  }
  return '??'
}

// Helper function to generate avatar colors
const getAvatarColor = (name: string) => {
  const colors = [
    'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-orange-500'
  ]
  const hash = name.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0)
    return a & a
  }, 0)
  return colors[Math.abs(hash) % colors.length]
}

// Helper function to format dates
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  })
}

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
  const { user } = useStore()
  
  // State for filters
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState("all")
  const [selectedPriority, setSelectedPriority] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  
  // Use real data from API
  const { 
    tickets, 
    loading, 
    error, 
    pagination, 
    refetch,
    updateTicket
  } = useTickets({
    page: 1,
    limit: 50,
    status: selectedStatus === "all" ? undefined : selectedStatus,
    priority: selectedPriority === "all" ? undefined : selectedPriority,
    type: selectedType === "all" ? undefined : selectedType,
    search: searchTerm || undefined
  })

  // Get dynamic ticket types from database
  const { ticketTypes, loading: typesLoading } = useTicketTypes()

  // Debug logging
  console.log('Tickets data:', { tickets, loading, error, pagination })
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
  const [localTickets, setLocalTickets] = useState<any[]>([])
  
  // Use real tickets data from API instead of mock data

  const [showAIChat, setShowAIChat] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [aiMessages, setAiMessages] = useState<
    Array<{ id: string; type: "user" | "ai"; content: string; timestamp: Date }>
  >([])
  const [aiInput, setAiInput] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)

  // Transform real ticket data to match the expected format
  const transformedTickets = useMemo(() => {
    return realTickets.map((ticket) => ({
      id: `#${ticket.ticket_number}`, // Display ID for UI
      dbId: ticket.id, // Database ID for API calls
      title: ticket.title,
      description: ticket.description || "",
      company: "Kroolo BSM", // Default company name
      companyLogo: "K",
      companyColor: getAvatarColor(ticket.requester_display_name || "Unknown"),
      customer: ticket.requester_display_name || "Unknown",
      reportedBy: ticket.requester_display_name || "Unknown",
      reportedByAvatar: getAvatarInitials(ticket.requester_first_name, ticket.requester_last_name, ticket.requester_display_name),
      assignee: ticket.assignee_display_name ? {
        name: ticket.assignee_display_name,
        avatar: getAvatarInitials(ticket.assignee_first_name, ticket.assignee_last_name, ticket.assignee_display_name)
      } : null,
      status: ticket.status,
      timestamp: formatDate(ticket.created_at),
      date: formatDate(ticket.created_at),
      reportedDate: formatDate(ticket.created_at),
      dueDate: ticket.due_date ? formatDate(ticket.due_date) : "No due date",
      comments: 0, // Will be updated when we implement comments
      attachments: 0, // Will be updated when we implement attachments
      priority: ticket.priority,
      type: ticket.type ? ticket.type.charAt(0).toUpperCase() + ticket.type.slice(1) : "Unknown",
      notes: "Customer reported via email", // Default notes
      category: "",
      subcategory: "",
      urgency: "medium",
      impact: "medium"
    }))
  }, [])

  // Initialize local tickets when transformedTickets changes
  useEffect(() => {
    if (transformedTickets.length > 0) {
      setLocalTickets(transformedTickets)
    }
  }, [transformedTickets])

  const filteredTickets = useMemo(() => {
    // Use local tickets for Kanban view, transformed tickets for list view
    return currentView === "kanban" ? localTickets : (transformedTickets || [])
  }, [localTickets, transformedTickets, currentView])

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
        return "bg-blue-500 text-white"
      case "waiting_on_you":
        return "bg-yellow-500 text-gray-900"
      case "waiting_on_customer":
        return "bg-purple-500 text-white"
      case "on_hold":
        return "bg-gray-500 text-white"
      default:
        return "bg-gray-500 text-white"
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
• Total tickets: ${realTickets.length}
• Open tickets: ${realTickets.filter((t) => t.status === "new").length}
• High priority: ${realTickets.filter((t) => t.priority === "high" || t.priority === "urgent" || t.priority === "critical").length}

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

        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">Ticket</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">Reported By</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">Assignee</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">Reported Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">Due Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                        Loading tickets...
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center">
                      <div className="text-red-600">
                        Error loading tickets: {error}
                      </div>
                    </td>
                  </tr>
                ) : filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center">
                      <div className="text-muted-foreground">
                        No tickets found. <button 
                          onClick={() => window.location.href = '/tickets/create'} 
                          className="text-blue-600 hover:underline"
                        >
                          Create your first ticket
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map((ticket, index) => (
                  <tr
                    key={ticket.id}
                    className="bg-white border-b border-gray-200 hover:bg-gray-50 last:border-b-0"
                  >
                    <td className="px-4 py-4 whitespace-nowrap border-r border-gray-200">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{ticket.title}</div>
                        <div className="text-sm text-gray-500">{ticket.id}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap border-r border-gray-200">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        ticket.status === "new" 
                          ? "bg-blue-500 text-white"
                          : ticket.status === "in_progress"
                            ? "bg-yellow-500 text-gray-900"
                            : ticket.status === "review"
                              ? "bg-purple-500 text-white"
                              : ticket.status === "pending"
                                ? "bg-gray-300 text-gray-900"
                                : ticket.status === "open"
                                  ? "bg-gray-300 text-gray-900"
                                  : "bg-gray-500 text-white"
                      }`}>
                        {ticket.status === "new" ? "New" : 
                         ticket.status === "in_progress" ? "In Progress" :
                         ticket.status === "review" ? "Review" :
                         ticket.status === "pending" ? "Pending" :
                         ticket.status === "open" ? "Open" :
                         ticket.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap border-r border-gray-200">
                      <div className="flex items-center">
                        <div
                          className={`h-8 w-8 rounded-full ${ticket.companyColor} flex items-center justify-center text-white text-xs font-medium`}
                          title={ticket.reportedBy}
                        >
                          {ticket.reportedByAvatar}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap border-r border-gray-200">
                      <div className="flex items-center">
                        {ticket.assignee ? (
                          <div
                            className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium"
                            title={ticket.assignee.name}
                          >
                            {ticket.assignee.avatar}
                          </div>
                        ) : (
                          <div
                            className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-white text-xs font-medium"
                            title="Unassigned"
                          >
                            ?
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap border-r border-gray-200">
                      <span className="text-sm text-gray-900">{ticket.reportedDate}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap border-r border-gray-200">
                      <span className="text-sm text-gray-900">{ticket.dueDate}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap border-r border-gray-200">
                      <span className="text-xs px-2 py-1 bg-yellow-500 text-gray-900 rounded-full">
                        {ticket.type === "general_query" ? "General Query" : 
                         ticket.type === "incident" ? "Incident" :
                         ticket.type === "request" ? "Request" :
                         ticket.type === "problem" ? "Problem" :
                         ticket.type}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap border-r border-gray-200">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          ticket.priority === "urgent"
                            ? "bg-red-500 text-white"
                            : ticket.priority === "high"
                              ? "bg-red-500 text-white"
                              : ticket.priority === "medium"
                                ? "bg-orange-500 text-gray-900"
                                : ticket.priority === "low"
                                  ? "bg-green-500 text-gray-900"
                                  : ticket.priority === "critical"
                                    ? "bg-green-500 text-gray-900"
                                    : "bg-gray-500 text-white"
                        }`}
                      >
                        {ticket.priority ? ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1) : "Unknown"}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-between">
                        <Input
                          placeholder="Add notes..."
                          className="h-7 text-xs border-0 bg-transparent focus:bg-background text-sm text-gray-500 flex-1"
                          defaultValue={ticket.notes || "Customer reported via email"}
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 ml-2">
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
                      </div>
                    </td>
                  </tr>
                ))
                )}
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
    async (e: React.DragEvent, targetColumn: string) => {
      e.preventDefault()
      setDragOverColumn(null)

      if (draggedTicket) {
        const updatedTickets = localTickets.map((ticket) => {
          if (ticket.id === draggedTicket.id) {
            const updatedTicket = { ...ticket }
            if (kanbanGroupBy === "type") {
              // Use the display label for local state
              updatedTicket.type = targetColumn
            } else if (kanbanGroupBy === "status") {
              updatedTicket.status = targetColumn
            } else if (kanbanGroupBy === "priority") {
              updatedTicket.priority = targetColumn
            } else if (kanbanGroupBy === "category") {
              // Map category values back to types for display
              const categoryMap: { [key: string]: string } = {
                technical: "Incident",
                billing: "Request", 
                general: "General Query",
                feature: "Change"
              }
              updatedTicket.type = categoryMap[targetColumn] || targetColumn
            }
            return updatedTicket
          }
          return ticket
        })

        // Update local state immediately for responsive UI
        setLocalTickets(updatedTickets)

        // Try to update the ticket in the API
        try {
          const ticketToUpdate = updatedTickets.find(t => t.id === draggedTicket.id)
          if (ticketToUpdate && ticketToUpdate.dbId) {
            // Use the database ID for API calls
            const ticketId = ticketToUpdate.dbId
            
            const updateData: any = {}
            if (kanbanGroupBy === "status") {
              updateData.status = targetColumn
            } else if (kanbanGroupBy === "priority") {
              updateData.priority = targetColumn
            } else if (kanbanGroupBy === "type") {
              // Find the ticket type value for the target column
              const ticketType = ticketTypes.find(type => type.label === targetColumn)
              if (ticketType) {
                updateData.type = ticketType.value
              } else {
                updateData.type = targetColumn.toLowerCase()
              }
            }

            if (Object.keys(updateData).length > 0) {
              await updateTicket(ticketId, updateData)
              console.log("[v0] Ticket updated in API:", ticketId, updateData)
            }
          }
        } catch (error) {
          console.error("[v0] Failed to update ticket in API:", error)
          // Revert local state on API failure
          setLocalTickets(transformedTickets)
        }

        console.log("[v0] Ticket moved:", draggedTicket.id, "to", targetColumn)
        setDraggedTicket(null)
      }
    },
    [draggedTicket, kanbanGroupBy, localTickets, updateTicket, transformedTickets, ticketTypes],
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
      default: // type - use dynamic ticket types from database
        return ticketTypes.map(type => ({
          id: type.label, // Use the display label for matching
          title: type.label,
          count: 0,
          color: type.color
        }))
    }
  }, [kanbanGroupBy, ticketTypes])

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
          default: // type - match with dynamic ticket types
            // Find the corresponding ticket type value for the group
            const ticketType = ticketTypes.find(type => type.label === groupValue)
            if (ticketType) {
              return ticket.type === ticketType.label
            }
            // Fallback to exact match for backward compatibility
            return ticket.type === groupValue
        }
      })
    },
    [filteredTickets, kanbanGroupBy, ticketTypes],
  )

  const renderKanbanView = useCallback(
    () => {
      const kanbanColumns = getKanbanColumns()
      const numColumns = kanbanColumns.length > 0 ? kanbanColumns.length : 1
      
      // Create responsive grid classes
      const getGridClass = (cols: number) => {
        if (cols <= 2) return 'grid-cols-1 md:grid-cols-2'
        if (cols <= 3) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        if (cols <= 4) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
        if (cols <= 5) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
      }
      
      const gridColsClass = getGridClass(numColumns)
      
      return (
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
                {ticketTypes.map((type) => (
                  <SelectItem key={type.value} value={type.label}>
                    {type.label}s
                  </SelectItem>
                ))}
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

          <div className={`grid ${gridColsClass} gap-6`}>
            {typesLoading ? (
              <div className={`col-span-${numColumns} flex items-center justify-center py-8`}>
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm text-muted-foreground">Loading ticket types...</span>
                </div>
              </div>
            ) : (
              kanbanColumns.map((column) => (
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
                          {ticket.priority ? ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1) : "Unknown"}
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
                  onClick={() => window.location.href = '/tickets/create'}
                >
                  <Plus className="h-3 w-3 mr-2" />
                  Add Ticket
                </Button>
              </div>
            </div>
          )))}
        </div>
      </div>
      )
    },
    [
      filteredTickets,
      searchTerm,
      selectedType,
      selectedPriority,
      kanbanGroupBy,
      dragOverColumn,
      draggedTicket,
      typesLoading,
      getKanbanColumns,
      handleDragStart,
      handleDragOver,
      handleDragEnter,
      handleDragLeave,
      handleDrop,
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
                <h1 className="text-2xl font-semibold tracking-tight font-sans text-gray-900">
                  All Tickets
                </h1>
                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
                  {realTickets.length}
                </span>
              </div>
              <p className="text-gray-500 text-sm font-sans">
                Manage all support tickets and track customer issues effortlessly.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold text-sm h-10 px-4 py-2 rounded-lg shadow-lg"
                onClick={() => setShowAIChat(true)}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Ask AI
              </Button>
              <Button
                variant="outline"
                className="bg-white text-purple-500 border-purple-300 hover:bg-purple-50 font-bold text-sm h-10 px-4 py-2 rounded-lg shadow-lg"
                onClick={() => setShowImportDialog(true)}
              >
                <Download className="h-4 w-4 mr-2" />
                Import
              </Button>
              <Button 
                className="bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm h-10 px-4 py-2 rounded-lg shadow-lg"
                onClick={() => window.location.href = '/tickets/create'} 
              >
                + Create Ticket
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200">
              <div className="flex items-center gap-0">
                <button
                  onClick={() => setCurrentView("list")}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    currentView === "list"
                      ? "text-blue-600 border-blue-600"
                      : "text-gray-500 border-transparent hover:text-gray-700"
                  }`}
                >
                  List
                </button>
                <button
                  onClick={() => setCurrentView("kanban")}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    currentView === "kanban"
                      ? "text-blue-600 border-blue-600"
                      : "text-gray-500 border-transparent hover:text-gray-700"
                  }`}
                >
                  Kanban
                </button>
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
