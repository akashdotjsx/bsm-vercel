"use client"

import React from "react"
import type { FC } from "react"

import dynamic from "next/dynamic"
import { useState, useCallback, useMemo, Suspense, useEffect, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
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
  Cloud,
} from "lucide-react"
import { PageContent } from "@/components/layout/page-content"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useStore } from "@/lib/store"
import { useAuth } from "@/lib/contexts/auth-context"
import { toast } from "@/lib/toast"
import { useTheme } from "next-themes"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog"
import { 
  useTicketsGraphQLQuery, 
  useCreateTicketGraphQL, 
  useUpdateTicketGraphQL, 
  useDeleteTicketGraphQL 
} from "@/hooks/queries/use-tickets-graphql-query"
import { useTicketTypes } from "@/hooks/use-ticket-types"
import { format } from "date-fns"
import { parseImportFile, validateFile, ImportResult, ImportProgress } from "@/lib/utils/file-import"
import { EnhancedKanbanBoard } from "@/components/tickets/enhanced-kanban-board"
import { FilterDialog } from "@/components/tickets/filter-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { MultiAssigneeAvatars } from "@/components/tickets/multi-assignee-avatars"
import { CustomColumnsDialog } from "@/components/tickets/custom-columns-dialog"
import { CustomColumnCell } from "@/components/tickets/custom-column-cell"
import { useCustomColumnsStore } from "@/lib/stores/custom-columns-store"
import { TicketsTable } from "@/components/tickets/tickets-table-with-bulk"
import { AIAssistantModal } from "@/components/ai/ai-assistant-modal"
import { useDebounce } from "@/hooks/use-debounce"
import { CustomColumnsDropdown } from "@/components/tickets/custom-columns-dropdown"


const TicketDrawer = dynamic(
  () => import("@/components/tickets/ticket-drawer"),
  {
    loading: () => <LoadingSpinner size="lg" />,
    ssr: false,
  },
)


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
    'bg-red-500', 'bg-[#6E72FF]', 'bg-green-500', 'bg-yellow-500', 
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



export default function TicketsPage() {
  const { user } = useStore()
  const { organization } = useAuth()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // State for filters
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState("all")
  const [selectedPriority, setSelectedPriority] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  
  // ✅ FIX: Debounce search to prevent excessive re-renders
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  
  // Use real data from API
  // Memoize the params to prevent unnecessary re-renders
  const ticketsParams = useMemo(() => {
    const params: any = {
      page: 1,
      limit: 50,
      status: selectedStatus === "all" ? undefined : selectedStatus,
      priority: selectedPriority === "all" ? undefined : selectedPriority,
      type: selectedType === "all" ? undefined : selectedType,
      search: debouncedSearchTerm || undefined, // ✅ Use debounced search
      requester_id: user?.id // Always filter by current user for My Tickets
    }
    
    return params
  }, [selectedStatus, selectedPriority, selectedType, debouncedSearchTerm, user?.id])

  // GraphQL + React Query for reads (CACHED! No refetch on navigation)
  const { 
    data: ticketsData, 
    isLoading: loading, 
    error: queryError, 
    refetch 
  } = useTicketsGraphQLQuery(ticketsParams)
  
  const tickets = ticketsData?.tickets || []
  
  const pagination = {
    page: ticketsParams.page || 1,
    limit: ticketsParams.limit || 50,
    total: ticketsData?.total || 0,
    hasNextPage: ticketsData?.hasNextPage || false,
    hasPreviousPage: ticketsData?.hasPreviousPage || false,
  }
  const error = queryError ? String(queryError) : null

  // GraphQL mutations with automatic cache invalidation
  const createTicketMutation = useCreateTicketGraphQL()
  const updateTicketMutation = useUpdateTicketGraphQL()
  const deleteTicketMutation = useDeleteTicketGraphQL()
  
  const createTicket = async (data: any) => {
    const result = await createTicketMutation.mutateAsync(data)
    toast.success('Ticket created successfully!')
    return result
  }
  
  const updateTicket = async (id: string, updates: any) => {
    const result = await updateTicketMutation.mutateAsync({ id, updates })
    toast.success('Ticket updated successfully!')
    return result
  }
  
  const deleteTicket = async (id: string) => {
    await deleteTicketMutation.mutateAsync(id)
    toast.error('Ticket deleted', 'The ticket has been removed')
  }

  // Get dynamic ticket types from database
  const { ticketTypes, loading: typesLoading } = useTicketTypes()

  // Debug logging
  console.log('🏠 Tickets page render:', { 
    ticketsCount: tickets?.length || 0, 
    loading, 
    error, 
    pagination,
    hasTickets: tickets && tickets.length > 0
  })

  // Force re-render when loading state changes
  useEffect(() => {
    console.log('🔄 Loading state changed:', loading)
  }, [loading])

  useEffect(() => {
    console.log('📊 Tickets state changed:', tickets?.length || 0, 'tickets')
  }, [tickets])

  // Check for URL parameters to open specific ticket
  useEffect(() => {
    const viewTicketId = searchParams?.get('view')
    if (viewTicketId && tickets && tickets.length > 0) {
      const ticketToView = tickets.find((ticket: any) => ticket.id === viewTicketId)
      if (ticketToView) {
        setSelectedTicket(ticketToView)
        setShowTicketTray(true)
        console.log('🔍 Opening ticket from search:', ticketToView.title)
      }
    }
  }, [tickets, searchParams])

  // Check for new ticket creation notification
  useEffect(() => {
    const checkForNewTicket = () => {
      const newTicketData = localStorage.getItem('newTicketCreated')
      if (newTicketData) {
        try {
          const ticketInfo = JSON.parse(newTicketData)
          // Check if the ticket was created recently (within last 10 seconds)
          if (Date.now() - ticketInfo.timestamp < 10000) {
            toast.success(
              `Ticket #${ticketInfo.ticketNumber} created successfully!`,
              `"${ticketInfo.title}"`
            )
          }
          // Clear the notification
          localStorage.removeItem('newTicketCreated')
        } catch (error) {
          console.error('Error parsing new ticket data:', error)
          localStorage.removeItem('newTicketCreated')
        }
      }
    }

    // Check immediately when component mounts
    checkForNewTicket()
    
    // Also check when tickets are loaded (in case of page refresh)
    if (tickets && tickets.length > 0) {
      checkForNewTicket()
    }
  }, [tickets])
  const [showAIPanel, setShowAIPanel] = useState(false)
  const [currentView, setCurrentView] = useState<"list" | "kanban">("list")
  const [showTicketTray, setShowTicketTray] = useState(false)
  const [groupBy, setGroupBy] = useState("none")
  const [showCustomColumns, setShowCustomColumns] = useState(false)
  const [showCustomColumnsDialog, setShowCustomColumnsDialog] = useState(false)
  const [showCustomColumnsDropdown, setShowCustomColumnsDropdown] = useState(false)
  const customColumnsButtonRef = useRef<HTMLButtonElement>(null)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false)
  const [bulkDeleteTicketIds, setBulkDeleteTicketIds] = useState<string[]>([])
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  
  // Custom columns store
  const { columns: customColumns } = useCustomColumnsStore()
  
  // Ticket action states
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [ticketToEdit, setTicketToEdit] = useState<any>(null)
  const [ticketToDelete, setTicketToDelete] = useState<any>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    type: '',
    priority: '',
    status: ''
  })
  const [kanbanGroupBy, setKanbanGroupBy] = useState<"type" | "status" | "priority" | "category">("type")
  const [draggedTicket, setDraggedTicket] = useState<any>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
  const [localTickets, setLocalTickets] = useState<any[]>([])
  const [preSelectedTicketType, setPreSelectedTicketType] = useState<string | null>(null)
  
  // Use real tickets data from API instead of mock data

  const [showAIChat, setShowAIChat] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [aiMessages, setAiMessages] = useState<
    Array<{ id: string; type: "user" | "ai"; content: string; timestamp: Date }>
  >([])
  const [aiInput, setAiInput] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  
  // Filter dialog state
  const [activeFilters, setActiveFilters] = useState<{
    type: string[]
    priority: string[]
    status: string[]
    assignee: string[]
    reportedBy: string[]
    dateRange: { from: string; to: string }
  }>({
    type: [],
    priority: [],
    status: [],
    assignee: [],
    reportedBy: [],
    dateRange: { from: '', to: '' }
  })

  // Transform API ticket data to match the expected format
  const transformedTickets = useMemo(() => {
    if (!tickets || tickets.length === 0) return []
    
    return tickets.map((ticket: any) => {
      // Multi-assignees from GraphQL assignees array
      const assigneesList = (ticket.assignees || []).map((assignee: any) => ({
        id: assignee.id,
        name: assignee.name || assignee.display_name || assignee.email,
        avatar: getAvatarInitials(assignee.first_name, assignee.last_name, assignee.display_name),
        display_name: assignee.display_name,
        first_name: assignee.first_name,
        last_name: assignee.last_name,
        avatar_url: assignee.avatar_url,
        email: assignee.email,
      }))
      
      return {
      id: `#${ticket.ticket_number}`, // Display ID for UI
      dbId: ticket.id, // Database ID for API calls
      title: ticket.title,
      description: ticket.description || "",
      company: "Kroolo BSM", // Default company name
      companyLogo: "K",
      companyColor: getAvatarColor(ticket.requester?.display_name || ticket.requester?.email || "Unknown"),
      customer: ticket.requester?.display_name || ticket.requester?.email || "Unknown",
      reportedBy: ticket.requester?.display_name || ticket.requester?.email || "Unknown",
      reportedByAvatar: getAvatarInitials(ticket.requester?.first_name, ticket.requester?.last_name, ticket.requester?.display_name) || "??",
      // Multi-assignee array from GraphQL
      assignees: assigneesList,
      // Single assignee (backward compatibility) - use first assignee
      assignee: assigneesList.length > 0 ? assigneesList[0] : (ticket.assignee?.display_name ? {
        id: ticket.assignee_id,
        name: ticket.assignee.display_name,
        avatar: getAvatarInitials(ticket.assignee.first_name, ticket.assignee.last_name, ticket.assignee.display_name)
      } : null),
      // ✅ FIX: Preserve raw ID fields for filtering
      assignee_id: ticket.assignee_id,
      assignee_ids: ticket.assignee_ids,
      requester_id: ticket.requester_id,
      status: ticket.status,
      timestamp: formatDate(ticket.created_at),
      date: formatDate(ticket.created_at),
      reportedDate: formatDate(ticket.created_at),
      dueDate: ticket.due_date ? formatDate(ticket.due_date) : "No due date",
      comments: 0, // Will be updated when we implement comments
      attachments: 0, // Will be updated when we implement attachments
      priority: ticket.priority,
      type: ticket.type || "Unknown", // Keep original type for grouping
      displayType: ticket.type ? ticket.type.charAt(0).toUpperCase() + ticket.type.slice(1) : "Unknown", // For display
      notes: "Customer reported via email", // Default notes
      category: "",
      subcategory: "",
      urgency: "medium",
      impact: "medium"
      }
    })
  }, [tickets])

  // Initialize local tickets when transformedTickets changes
  useEffect(() => {
    if (transformedTickets.length > 0) {
      setLocalTickets(transformedTickets)
    }
  }, [transformedTickets])

  // ✅ FIX: Memoize filter conditions separately to reduce dependencies
  const filterConditions = useMemo(() => ({
    search: debouncedSearchTerm,
    type: selectedType,
    priority: selectedPriority,
    status: selectedStatus,
    activeFilters
  }), [debouncedSearchTerm, selectedType, selectedPriority, selectedStatus, activeFilters])
  
  // ✅ FIX: Optimize filtering with reduced dependencies
  const filteredTickets = useMemo(() => {
    // Use local tickets for Kanban view, transformed tickets for list view
    const baseTickets = currentView === "kanban" ? localTickets : transformedTickets
    
    console.log('🔍 My Tickets - Filtering tickets:', {
      totalTickets: baseTickets.length,
      activeFilters: filterConditions.activeFilters,
      currentView,
      sampleTicket: baseTickets[0] ? {
        id: baseTickets[0].id,
        title: baseTickets[0].title,
        assignee_id: baseTickets[0].assignee_id,
        assignee_ids: baseTickets[0].assignee_ids,
        requester_id: baseTickets[0].requester_id,
        assignee: baseTickets[0].assignee,
        requester: baseTickets[0].requester
      } : null
    })
    
    // Note: Server-side filtering is now applied via GraphQL query for My Tickets and Assigned to Me
    // No need to filter client-side for these views
    
    // Apply client-side filtering for list view (API already handles some filtering)
    if (currentView === "list") {
      return baseTickets.filter((ticket: any) => {
        // Search filter
        if (filterConditions.search) {
          const searchLower = filterConditions.search.toLowerCase()
          const matchesSearch = 
            ticket.title.toLowerCase().includes(searchLower) ||
            ticket.description.toLowerCase().includes(searchLower) ||
            ticket.id.toLowerCase().includes(searchLower) ||
            ticket.reportedBy.toLowerCase().includes(searchLower) ||
            (ticket.assignee?.name || '').toLowerCase().includes(searchLower)
          
          if (!matchesSearch) return false
        }
        
        // Type filter (from active filters)
        if (filterConditions.activeFilters.type.length > 0) {
          const ticketType = ticket.type?.toLowerCase() || ''
          if (!filterConditions.activeFilters.type.some(type => type.toLowerCase() === ticketType)) return false
        } else if (filterConditions.type !== "all") {
          const ticketType = ticket.type?.toLowerCase() || ''
          const selectedTypeLower = filterConditions.type.toLowerCase()
          if (ticketType !== selectedTypeLower) return false
        }
        
        // Priority filter (from active filters)
        if (filterConditions.activeFilters.priority.length > 0) {
          const ticketPriority = ticket.priority?.toLowerCase() || ''
          if (!filterConditions.activeFilters.priority.some(priority => priority.toLowerCase() === ticketPriority)) return false
        } else if (filterConditions.priority !== "all") {
          const ticketPriority = ticket.priority?.toLowerCase() || ''
          const selectedPriorityLower = filterConditions.priority.toLowerCase()
          if (ticketPriority !== selectedPriorityLower) return false
        }
        
        // Status filter (from active filters)
        if (filterConditions.activeFilters.status.length > 0) {
          const ticketStatus = ticket.status?.toLowerCase() || ''
          if (!filterConditions.activeFilters.status.some(status => status.toLowerCase() === ticketStatus)) return false
        } else if (filterConditions.status !== "all") {
          const ticketStatus = ticket.status?.toLowerCase() || ''
          const selectedStatusLower = filterConditions.status.toLowerCase()
          if (ticketStatus !== selectedStatusLower) return false
        }
        
        // Assignee filter (from active filters) - check both single assignee and multi-assignees
        if (filterConditions.activeFilters.assignee.length > 0) {
          const assigneeIds = ticket.assignee_ids || []
          const singleAssigneeId = ticket.assignee_id
          const allAssigneeIds = [...assigneeIds, ...(singleAssigneeId ? [singleAssigneeId] : [])]
          
          console.log('🔍 My Tickets - Assignee filter check:', {
            ticketId: ticket.id,
            ticketTitle: ticket.title,
            filterAssigneeIds: filterConditions.activeFilters.assignee,
            ticketAssigneeIds: allAssigneeIds,
            matches: filterConditions.activeFilters.assignee.some(assigneeId => 
              allAssigneeIds.includes(assigneeId)
            )
          })
          
          if (!filterConditions.activeFilters.assignee.some(assigneeId => 
            allAssigneeIds.includes(assigneeId)
          )) return false
        }
        
        // Reported By filter (from active filters) - check requester_id
        if (filterConditions.activeFilters.reportedBy.length > 0) {
          const requesterId = ticket.requester_id
          
          console.log('🔍 My Tickets - Reported By filter check:', {
            ticketId: ticket.id,
            ticketTitle: ticket.title,
            filterRequesterIds: filterConditions.activeFilters.reportedBy,
            ticketRequesterId: requesterId,
            matches: requesterId && filterConditions.activeFilters.reportedBy.includes(requesterId)
          })
          
          if (!requesterId || !filterConditions.activeFilters.reportedBy.includes(requesterId)) return false
        }
        
        // Date range filter
        if (filterConditions.activeFilters.dateRange.from || filterConditions.activeFilters.dateRange.to) {
          const ticketDate = new Date(ticket.created_at || ticket.date)
          const fromDate = filterConditions.activeFilters.dateRange.from ? new Date(filterConditions.activeFilters.dateRange.from) : null
          const toDate = filterConditions.activeFilters.dateRange.to ? new Date(filterConditions.activeFilters.dateRange.to) : null
          
          if (fromDate && ticketDate < fromDate) return false
          if (toDate && ticketDate > toDate) return false
        }
        
        return true
      })
    }
    
    return baseTickets
  }, [localTickets, transformedTickets, currentView, filterConditions])

  const getTicketsByStatus = useCallback(
    (status: string) => {
      return filteredTickets.filter((ticket: any) => ticket.status === status)
    },
    [filteredTickets],
  )

  const getTicketsByType = useCallback(
    (type: string) => {
      return filteredTickets.filter((ticket: any) => ticket.type === type)
    },
    [filteredTickets],
  )

  // Group tickets by the selected grouping option
  const groupedTickets = useMemo(() => {
    if (groupBy === "none") {
      return { "All Tickets": filteredTickets }
    }

    const groups: { [key: string]: any[] } = {}
    
    filteredTickets.forEach((ticket: any) => {
      let groupKey = "Unassigned"
      
      switch (groupBy) {
        case "status":
          groupKey = ticket.status || "Unknown"
          break
        case "priority":
          groupKey = ticket.priority || "Unknown"
          break
        case "type":
          groupKey = ticket.type || "Unknown"
          break
        case "dueDate":
          groupKey = ticket.dueDate || "No Due Date"
          break
        case "reportedBy":
          groupKey = ticket.reportedBy || "Unknown"
          break
        case "assignee":
          groupKey = ticket.assignee?.name || "Unassigned"
          break
        default:
          groupKey = "All Tickets"
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = []
      }
      groups[groupKey].push(ticket)
    })
    
    return groups
  }, [filteredTickets, groupBy])

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
        return "bg-[#6E72FF] text-white"
      case "waiting_on_you":
        return "bg-yellow-500 text-gray-900"
      case "waiting_on_customer":
        return "bg-purple-500 text-white"
      case "on_hold":
        return "bg-muted/500 text-white"
      default:
        return "bg-muted/500 text-white"
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
    console.log("[TICKET CLICK] Opening drawer for:", ticket.id, "dbId:", ticket.dbId)
    // Ensure dbId is set for EDIT mode to work
    const ticketWithDbId = {
      ...ticket,
      dbId: ticket.dbId || ticket.id // Use dbId if available, otherwise use id
    }
    setSelectedTicket(ticketWithDbId)
    setShowTicketTray(true)
  }, [])

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value)
  }, [])

  const handleClearAllFilters = useCallback(() => {
    setActiveFilters({
      type: [],
      priority: [],
      status: [],
      assignee: [],
      reportedBy: [],
      dateRange: { from: '', to: '' }
    })
    setSearchTerm("")
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
• Total tickets: ${tickets?.length || 0}
• Open tickets: ${tickets?.filter((t: any) => t.status === "new").length || 0}
• High priority: ${tickets?.filter((t: any) => t.priority === "high" || t.priority === "urgent" || t.priority === "critical").length || 0}

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

  const handleImportTickets = useCallback(async () => {
    if (!importFile) {
      console.error('❌ No file selected')
      return
    }

    console.log('🚀 Starting import process for file:', importFile.name)
    setIsImporting(true)
    
    // Reset previous results
    setImportResult(null)
    setImportProgress({
      current: 0,
      total: 100,
      status: 'parsing',
      message: 'Starting import...'
    })

    try {
      // Step 1: Validate file
      console.log('🔍 Step 1: Validating file...')
      setImportProgress({
        current: 10,
        total: 100,
        status: 'parsing',
        message: 'Validating file...'
      })

      const fileValidation = validateFile(importFile)
      console.log('🔍 File validation result:', fileValidation)
      
      if (!fileValidation.valid) {
        console.error('❌ File validation failed:', fileValidation.error)
        const errorResult: ImportResult = {
          success: false,
          tickets: [],
          errors: [fileValidation.error || 'Invalid file'],
          totalRows: 0,
          validRows: 0,
          successfullyImportedCount: 0,
          failedImportCount: 0,
          parsingErrors: [fileValidation.error || 'Invalid file'],
          validationErrors: [],
          importErrors: []
        }
        setImportResult(errorResult)
        setImportProgress({
          current: 100,
          total: 100,
          status: 'error',
          message: 'File validation failed'
        })
        return
      }

      // Step 2: Parse file
      console.log('📄 Step 2: Parsing file...')
      setImportProgress({
        current: 25,
        total: 100,
        status: 'parsing',
        message: 'Parsing file...'
      })

      const parseResult = await parseImportFile(importFile)
      console.log('📊 Parse result:', parseResult)

      // Check if parsing was successful
      if (parseResult.parsingErrors.length > 0) {
        console.error('❌ Parsing failed:', parseResult.parsingErrors)
        setImportResult(parseResult)
        setImportProgress({
          current: 100,
          total: 100,
          status: 'error',
          message: 'File parsing failed'
        })
        return
      }

      // Check if we have any valid tickets
      if (parseResult.tickets.length === 0) {
        console.error('❌ No valid tickets found after parsing')
        const noTicketsResult: ImportResult = {
          ...parseResult,
          success: false,
          errors: [...parseResult.errors, 'No valid tickets found in file'],
          parsingErrors: [...parseResult.parsingErrors, 'No valid tickets found in file']
        }
        setImportResult(noTicketsResult)
        setImportProgress({
          current: 100,
          total: 100,
          status: 'error',
          message: 'No valid tickets found'
        })
        return
      }

      console.log(`✅ Parsing successful: ${parseResult.tickets.length} valid tickets found`)

      // Step 3: Import tickets
      console.log('📤 Step 3: Importing tickets...')
      setImportProgress({
        current: 50,
        total: 100,
        status: 'importing',
        message: `Importing ${parseResult.tickets.length} tickets...`
      })

      let successCount = 0
      const importErrors: string[] = []

      for (let i = 0; i < parseResult.tickets.length; i++) {
        const ticket = parseResult.tickets[i]
        
        try {
          // Map the ticket data to match the API expectations
          const ticketData = {
            title: ticket.title,
            description: ticket.description || '',
            priority: ticket.priority,
            type: ticket.type,
            // Don't include assignee_id since we only have names, not UUIDs
            // The system will auto-assign or leave unassigned
            due_date: ticket.due_date || undefined,
            tags: [], // Provide empty array for tags
          }
          
          // Remove undefined values to avoid API issues
          Object.keys(ticketData).forEach(key => {
            if (ticketData[key as keyof typeof ticketData] === undefined) {
              delete ticketData[key as keyof typeof ticketData]
            }
          })
          
          console.log(`📝 Creating ticket ${i + 1}/${parseResult.tickets.length}:`, ticketData.title)
          await createTicket(ticketData)
          successCount++
          console.log(`✅ Ticket ${i + 1} created successfully`)
          
      } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          console.error(`❌ Error creating ticket ${i + 1}:`, errorMessage)
          importErrors.push(`Row ${i + 1} (${ticket.title}): ${errorMessage}`)
        }

        // Update progress
        const progress = 50 + ((i + 1) / parseResult.tickets.length) * 40
        setImportProgress({
          current: Math.round(progress),
          total: 100,
          status: 'importing',
          message: `Imported ${i + 1} of ${parseResult.tickets.length} tickets...`
        })
      }

      // Step 4: Finalize results
      console.log('📊 Step 4: Finalizing results...')
      const finalResult: ImportResult = {
        success: importErrors.length === 0 && successCount > 0,
        tickets: parseResult.tickets,
        errors: [...parseResult.errors, ...importErrors],
        totalRows: parseResult.totalRows,
        validRows: parseResult.validRows,
        successfullyImportedCount: successCount,
        failedImportCount: importErrors.length,
        parsingErrors: parseResult.parsingErrors,
        validationErrors: parseResult.validationErrors,
        importErrors: importErrors
      }

      console.log('📊 Final import result:', finalResult)
      setImportResult(finalResult)
      
      setImportProgress({
        current: 100,
        total: 100,
        status: finalResult.success ? 'completed' : 'error',
        message: finalResult.success 
          ? `Import completed successfully! ${successCount} tickets imported.`
          : `Import completed with errors. ${successCount} succeeded, ${importErrors.length} failed.`
      })

      // Refresh tickets list if any were successfully imported
      if (successCount > 0) {
        console.log('🔄 Refreshing tickets list...')
        refetch()
      }

    } catch (error) {
      console.error('❌ Unexpected error during import:', error)
      const errorResult: ImportResult = {
        success: false,
        tickets: [],
        errors: [`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        totalRows: 0,
        validRows: 0,
        successfullyImportedCount: 0,
        failedImportCount: 0,
        parsingErrors: [`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        validationErrors: [],
        importErrors: []
      }
      setImportResult(errorResult)
      setImportProgress({
        current: 100,
        total: 100,
        status: 'error',
        message: 'Unexpected error occurred'
      })
    } finally {
      console.log('🏁 Import process completed')
      setIsImporting(false)
    }
  }, [importFile, createTicket, refetch])

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendAIMessage()
    }
  }

  // Ticket action handlers
  const handleEditTicket = (ticket: any) => {
    setTicketToEdit(ticket)
    setEditForm({
      title: ticket.title,
      description: ticket.description || '',
      type: ticket.type,
      priority: ticket.priority,
      status: ticket.status
    })
    setShowEditModal(true)
  }

  const handleDuplicateTicket = async (ticket: any) => {
    try {
      console.log('[DUPLICATE] Creating duplicate of ticket:', ticket.id)
      
      // Build duplicate data - only include non-null/non-empty values
      const duplicateData: any = {
        title: `${ticket.title} (Copy)`,
        type: ticket.type || 'request',
        priority: ticket.priority || 'medium',
        status: 'new',
        urgency: ticket.urgency || 'medium',
        impact: ticket.impact || 'medium',
        // Required fields
        requester_id: user?.id,
        organization_id: ticket.organization_id || organization?.id
      }
      
      // Only add optional fields if they have values
      if (ticket.description) duplicateData.description = ticket.description
      if (ticket.assignee_id) duplicateData.assignee_id = ticket.assignee_id
      if (ticket.team_id) duplicateData.team_id = ticket.team_id
      if (ticket.due_date) duplicateData.due_date = ticket.due_date
      if (ticket.category) duplicateData.category = ticket.category
      if (ticket.subcategory) duplicateData.subcategory = ticket.subcategory
      if (ticket.tags && ticket.tags.length > 0) duplicateData.tags = ticket.tags
      if (ticket.custom_fields && Object.keys(ticket.custom_fields).length > 0) {
        duplicateData.custom_fields = ticket.custom_fields
      }

      console.log('[DUPLICATE] Duplicate data:', duplicateData)
      const newTicket = await createTicket(duplicateData)
      console.log('[DUPLICATE] Successfully created:', newTicket.ticket_number)
      
      toast.success(
        'Ticket duplicated successfully!',
        `"${newTicket.title}" has been created as #${newTicket.ticket_number}`
      )
    } catch (error) {
      console.error('[DUPLICATE] Error duplicating ticket:', error)
      toast.error(
        'Failed to duplicate ticket',
        error instanceof Error ? error.message : 'Unknown error occurred'
      )
    }
  }

  const handleDeleteTicket = (ticket: any) => {
    setTicketToDelete(ticket)
    setShowDeleteModal(true)
  }

  const confirmDeleteTicket = async () => {
    if (!ticketToDelete) return

    console.log('🗑️ DELETE CONFIRMED - Ticket to delete:', {
      displayId: ticketToDelete.id,
      dbId: ticketToDelete.dbId,
      title: ticketToDelete.title
    })

    setIsDeleting(true)
    try {
      console.log('🗑️ Calling deleteTicket with dbId:', ticketToDelete.dbId)
      await deleteTicket(ticketToDelete.dbId)
      console.log('✅ deleteTicket completed successfully')
      toast.error('Ticket deleted', `Ticket #${ticketToDelete.id} has been removed`)
      setShowDeleteModal(false)
      setTicketToDelete(null)
    } catch (error) {
      console.error('❌ Error deleting ticket:', error)
      toast.error('Failed to delete ticket')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleUpdateTicket = async () => {
    if (!ticketToEdit) return

    setIsUpdating(true)
    try {
      const updateData = {
        title: editForm.title,
        description: editForm.description,
        type: editForm.type,
        priority: editForm.priority,
        status: editForm.status
      }

      await updateTicket(ticketToEdit.dbId, updateData)
      toast.success(
        'Ticket updated successfully!',
        `Ticket #${ticketToEdit.id} has been updated`
      )
      setShowEditModal(false)
      setTicketToEdit(null)
    } catch (error) {
      console.error('Error updating ticket:', error)
      toast.error('Failed to update ticket')
    } finally {
      setIsUpdating(false)
    }
  }

  // Bulk operation handlers
  const handleBulkDeleteRequest = async (ticketIds: string[]): Promise<void> => {
    console.log('🗑️ Bulk delete requested for tickets:', ticketIds)
    setBulkDeleteTicketIds(ticketIds)
    setShowBulkDeleteDialog(true)
  }

  const confirmBulkDelete = async () => {
    if (bulkDeleteTicketIds.length === 0) return
    
    console.log('🗑️ Confirming bulk delete for:', bulkDeleteTicketIds)
    setIsBulkDeleting(true)
    
    try {
      // Delete all selected tickets using GraphQL mutation
      for (const id of bulkDeleteTicketIds) {
        await deleteTicketMutation.mutateAsync(id)
      }
      
      toast.success(
        `${bulkDeleteTicketIds.length} ticket${bulkDeleteTicketIds.length > 1 ? 's' : ''} deleted successfully`,
        'The selected tickets have been removed'
      )
      
      // Close dialog and reset state
      setShowBulkDeleteDialog(false)
      setBulkDeleteTicketIds([])
    } catch (error) {
      console.error('Error in bulk delete:', error)
      toast.error('Failed to delete some tickets')
    } finally {
      setIsBulkDeleting(false)
    }
  }

  const handleBulkUpdate = async (ticketIds: string[], updates: any) => {
    console.log('✏️ Bulk updating tickets:', ticketIds, updates)
    
    try {
      // Update all selected tickets using GraphQL mutation
      for (const id of ticketIds) {
        await updateTicketMutation.mutateAsync({ id, updates })
      }
      
      toast.success(
        `${ticketIds.length} ticket${ticketIds.length > 1 ? 's' : ''} updated successfully`,
        'The selected tickets have been updated'
      )
    } catch (error) {
      console.error('Error in bulk update:', error)
      toast.error('Failed to update some tickets')
    }
  }

  const clearAIChat = () => {
    setAiMessages([])
    setAiInput("")
  }

  const resetImportState = () => {
    setImportFile(null)
    setImportProgress(null)
    setImportResult(null)
    setIsImporting(false)
  }

  const renderListView = useCallback(
    () => (
      <div className="flex flex-col h-full font-sans w-full max-w-full overflow-hidden">
        {/* Fixed Filter Bar */}
        <div className="flex-shrink-0 flex items-center gap-4 py-2 mb-4 w-full max-w-full overflow-hidden">
          <Select value={groupBy} onValueChange={setGroupBy}>
            <SelectTrigger 
              className="w-48 h-[31px] border border-[#E4E4E4] bg-white dark:bg-[#1e2024] dark:border-gray-600 dark:text-white text-sm rounded-[5px]"
              style={{ 
                backgroundColor: isDark ? '#1e2024' : '#FFFFFF', 
                borderColor: isDark ? '#374151' : '#E4E4E4',
                color: '#8e8e8e',
                fontSize: '11px'
              }}
            >
              <List className="h-3 w-3 mr-2" style={{ color: '#8e8e8e' }} />
              <SelectValue placeholder="Group by: None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Group by: None</SelectItem>
              <SelectItem value="status">Group by: Status</SelectItem>
              <SelectItem value="priority">Group by: Priority</SelectItem>
              <SelectItem value="type">Group by: Type</SelectItem>
              <SelectItem value="dueDate">Group by: Due Date</SelectItem>
              <SelectItem value="reportedBy">Group by: Reported By</SelectItem>
              <SelectItem value="assignee">Group by: Assignee</SelectItem>
            </SelectContent>
          </Select>
          <FilterDialog
            onApply={(filters) => {
              setActiveFilters({
                type: filters.type,
                priority: filters.priority,
                status: filters.status,
                assignee: filters.assignee,
                reportedBy: filters.reportedBy,
                dateRange: {
                  from: filters.dateRange.from?.toISOString().split('T')[0] || '',
                  to: filters.dateRange.to?.toISOString().split('T')[0] || ''
                }
              })
            }}
            onReset={() => {
              setActiveFilters({
                type: [],
                priority: [],
                status: [],
                assignee: [],
                reportedBy: [],
                dateRange: { from: '', to: '' }
              })
            }}
            initialFilters={{
              type: activeFilters.type,
              priority: activeFilters.priority,
              status: activeFilters.status,
              assignee: activeFilters.assignee,
              reportedBy: activeFilters.reportedBy,
              dateRange: {
                from: activeFilters.dateRange.from ? new Date(activeFilters.dateRange.from) : undefined,
                to: activeFilters.dateRange.to ? new Date(activeFilters.dateRange.to) : undefined
              }
            }}
          >
            <Button 
              variant="outline" 
              size="sm" 
              className="h-[31px] border border-[#E4E4E4] bg-white dark:bg-[#1e2024] dark:border-gray-600 dark:text-white rounded-[5px]"
              style={{ 
                backgroundColor: isDark ? '#1e2024' : '#FFFFFF', 
                borderColor: isDark ? '#374151' : '#E4E4E4',
                color: '#8e8e8e',
                fontSize: '11px'
              }}
            >
              <Filter className="h-3 w-3 mr-2" style={{ color: '#8e8e8e' }} />
              Filter
              {(activeFilters.type.length > 0 || activeFilters.priority.length > 0 || activeFilters.status.length > 0 || activeFilters.assignee.length > 0 || activeFilters.reportedBy.length > 0) && (
                <span className="ml-1 bg-[#6E72FF] text-white text-xs rounded-full px-1.5 py-0.5">
                  {activeFilters.type.length + activeFilters.priority.length + activeFilters.status.length + activeFilters.assignee.length + activeFilters.reportedBy.length}
                </span>
              )}
            </Button>
          </FilterDialog>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" style={{ color: '#8e8e8e' }} />
            <Input
              placeholder="Search items"
              className="pl-10 h-[31px] w-48 border border-[#E4E4E4] bg-white dark:bg-[#1e2024] dark:border-gray-600 dark:text-white rounded-[5px]"
              style={{ 
                backgroundColor: isDark ? '#1e2024' : '#FFFFFF', 
                borderColor: isDark ? '#374151' : '#E4E4E4',
                color: '#8e8e8e',
                fontSize: '11px'
              }}
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
        </div>

        {/* Scrollable Table Container */}
        <div className="flex-1 overflow-hidden w-full max-w-full">
          <TicketsTable
            tickets={filteredTickets}
            loading={loading}
            error={error}
            groupBy={groupBy}
            groupedTickets={groupedTickets}
            onTicketClick={handleTicketClick}
            onEditTicket={(ticket) => {
              const ticketWithDbId = {
                ...ticket,
                dbId: ticket.dbId || ticket.id
              }
              setSelectedTicket(ticketWithDbId)
              setShowTicketTray(true)
            }}
            onDuplicateTicket={handleDuplicateTicket}
            onDeleteTicket={handleDeleteTicket}
            onUpdateTicket={updateTicket}
            onOpenCustomColumns={() => setShowCustomColumnsDropdown(true)}
            onBulkDelete={handleBulkDeleteRequest}
            onBulkUpdate={handleBulkUpdate}
            customColumnsButtonRef={customColumnsButtonRef}
          />
        </div>
      </div>
    ),
    [groupedTickets, groupBy, filteredTickets, loading, error, handleTicketClick, handleDuplicateTicket, handleDeleteTicket, updateTicket],
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
    console.log('🎯 getKanbanColumns called with kanbanGroupBy:', kanbanGroupBy)
    switch (kanbanGroupBy) {
      case "status":
        return [
          { id: "new", title: "New", count: 0, color: "border-t-[#6E72FF]" },
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
          { id: "technical", title: "Technical", count: 0, color: "border-t-[#6E72FF]" },
          { id: "billing", title: "Billing", count: 0, color: "border-t-green-400" },
          { id: "general", title: "General", count: 0, color: "border-t-purple-400" },
          { id: "feature", title: "Feature Request", count: 0, color: "border-t-orange-400" },
        ]
      default: // type - use hardcoded ticket types to ensure consistency
        return [
          { id: "incident", title: "Incident", count: 0, color: "border-t-red-400" },
          { id: "request", title: "Request", count: 0, color: "border-t-[#6E72FF]" },
          { id: "problem", title: "Problem", count: 0, color: "border-t-orange-400" },
          { id: "change", title: "Change", count: 0, color: "border-t-green-400" },
          { id: "general_query", title: "General Query", count: 0, color: "border-t-purple-400" },
        ]
    }
  }, [kanbanGroupBy])

  const getTicketsByGroup = useCallback(
    (groupValue: string) => {
      console.log('🎯 getTicketsByGroup called with groupValue:', groupValue, 'kanbanGroupBy:', kanbanGroupBy)
      return filteredTickets.filter((ticket: any) => {
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
          case "type":
            // Direct type matching for Kanban view
            return ticket.type === groupValue
          default:
            // Fallback to exact match for backward compatibility
            return ticket.type === groupValue
        }
      })
    },
    [filteredTickets, kanbanGroupBy],
  )

  const renderKanbanView = useCallback(() => {
    return (
      <EnhancedKanbanBoard
        tickets={filteredTickets}
        loading={loading}
        groupBy={kanbanGroupBy}
        searchTerm={searchTerm}
        selectedType={selectedType}
        selectedPriority={selectedPriority}
        ticketTypes={ticketTypes}
        draggedTicket={draggedTicket}
        dragOverColumn={dragOverColumn}
        onSearchChange={handleSearchChange}
        onGroupByChange={setKanbanGroupBy}
        onTypeFilterChange={setSelectedType}
        onPriorityFilterChange={setSelectedPriority}
        onTicketClick={handleTicketClick}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onAddTicket={(columnType) => {
          console.log("[KANBAN ADD TICKET] Opening drawer for new ticket with type:", columnType)
          setPreSelectedTicketType(columnType || null)
          setSelectedTicket(null)
          setShowTicketTray(true)
        }}
      />
    )
  }, [
    filteredTickets,
    loading,
    kanbanGroupBy,
    searchTerm,
    selectedType,
    selectedPriority,
    ticketTypes,
    draggedTicket,
    dragOverColumn,
    handleSearchChange,
    handleTicketClick,
    handleDragStart,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
  ])

  return (
    <PageContent>
      <div className="font-sans text-sm h-full w-full max-w-full overflow-hidden" style={{ width: '100%', maxWidth: '100%', position: 'relative' }}>
        <div className="flex-1 flex flex-col h-full min-w-0">
          {/* Fixed Header Section */}
          <div className="flex-shrink-0 space-y-6 w-full max-w-full overflow-hidden">
            <div className="flex items-start justify-between w-full max-w-full">
              <div className="space-y-1">
                 <div className="flex items-center gap-2">
                   <h1 className="text-base font-semibold tracking-tight font-sans text-foreground" style={{ fontSize: '16px', fontWeight: 600 }}>
                     My Tickets
                   </h1>
                   <span 
                     className="inline-flex items-center justify-center px-2 py-0.5 rounded-full font-medium text-foreground bg-muted"
                     style={{ 
                       fontSize: '12px', 
                       fontWeight: 500, 
                       borderRadius: '12px',
                       minWidth: '24px',
                       height: '20px'
                     }}
                   >
                     {loading ? (
                       <Skeleton className="h-3 w-10 inline-block align-middle" />
                     ) : (
                       <>
                         {filteredTickets?.length || 0}
                         {tickets && filteredTickets && tickets.length !== filteredTickets.length && (
                           <span className="text-muted-foreground"> of {tickets.length}</span>
                         )}
                       </>
                     )}
                   </span>
                 </div>
                 <p className="text-xs font-sans text-muted-foreground" style={{ fontSize: '12px', fontWeight: 400 }}>
                   Manage your support tickets and track customer issues effortlessly.
                 </p>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
<Button
className="bg-gradient-to-r from-[#6E72FF] to-[var(--primary-pink)] hover:from-[#6E72FF]/90 hover:to-[var(--primary-pink)] text-white text-sm h-8 px-4 rounded-lg shadow-xs"
                >
                  <Sparkles className="h-3 w-3 mr-2" />
                  Ask AI
                </Button>
<Button
                  variant="outline"
className="bg-background text-[#6E72FF] border-[#6E72FF]/20 hover:bg-[#6E72FF]/5 text-sm h-8 px-4 rounded-lg"
                  onClick={() => setShowImportDialog(true)}
                >
                  <Download className="h-3 w-3 mr-2" />
                  Import
                </Button>
<Button 
className="bg-[#6E72FF] hover:bg-[#6E72FF]/90 text-white text-sm h-8 px-4 rounded-lg shadow-xs"
                  onClick={() => {
                    console.log("[CREATE] Opening drawer for new ticket")
                    setSelectedTicket(null) // No ticket = CREATE mode
                    setShowTicketTray(true)
                  }} 
                >
                  + Create Ticket
                </Button>
              </div>
            </div>

             <div className="space-y-4 w-full max-w-full overflow-hidden">
               <div className="flex items-center justify-between border-b border-[#EEEEEE] bg-[#F8F8F8] dark:bg-[#282a2f] dark:border-gray-600 w-full max-w-full rounded-[10px]" style={{ 
                 borderColor: isDark ? '#374151' : '#EEEEEE', 
                 backgroundColor: isDark ? '#282a2f' : '#F8F8F8' 
               }}>
                 <div className="flex items-center gap-0">
                   <button
                     onClick={() => setCurrentView("list")}
                     className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                       currentView === "list"
                         ? "text-[#6E72FF] border-[#6E72FF] dark:text-[#6E72FF] dark:border-[#6E72FF]"
                         : "text-black dark:text-gray-300 border-transparent hover:text-foreground dark:hover:text-white"
                     }`}
                     style={{ 
                       color: currentView === "list" ? "#6E72FF" : (isDark ? "#D1D5DB" : "#000000")
                     }}
                   >
                     List
                   </button>
                   <button
                     onClick={() => setCurrentView("kanban")}
                     className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                       currentView === "kanban"
                         ? "text-[#6E72FF] border-[#6E72FF] dark:text-[#6E72FF] dark:border-[#6E72FF]"
                         : "text-black dark:text-gray-300 border-transparent hover:text-foreground dark:hover:text-white"
                     }`}
                     style={{ 
                       color: currentView === "kanban" ? "#6E72FF" : (isDark ? "#D1D5DB" : "#000000")
                     }}
                   >
                     Kanban
                   </button>
                 </div>
               </div>
             </div>
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-hidden w-full max-w-full">
            {currentView === "list" && renderListView()}
            {currentView === "kanban" && renderKanbanView()}
          </div>
        </div>

      </div>

      {/* AI Assistant Modal - Outside main content to prevent layout shifts */}
      <AIAssistantModal
        isOpen={showAIPanel}
        onClose={() => setShowAIPanel(false)}
      />

      <Dialog open={showAIChat} onOpenChange={setShowAIChat}>
        <DialogContent className="max-w-4xl h-[600px] flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-[#6E72FF]" />
<span className="font-sans text-sm">Ask AI about My Tickets</span>
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
<p className="text-muted-foreground font-sans text-13">
                    Ask me anything about your tickets, trends, priorities, or support workflow
                  </p>
                </div>
              </div>
            ) : (
              aiMessages.map((message) => (
                <div key={message.id} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.type === "user" ? "bg-[#6E72FF] text-white" : "bg-muted text-foreground"
                    }`}
                  >
                    <p className="font-sans text-sm whitespace-pre-wrap">{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${message.type === "user" ? "text-[#6E72FF]/70" : "text-muted-foreground"}`}
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
<span className="font-sans text-13 text-muted-foreground">AI is thinking...</span>
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
className="min-h-[40px] max-h-[120px] resize-none pr-12 font-sans text-13"
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

      <Dialog open={showImportDialog} onOpenChange={(open) => {
        if (!open) {
          resetImportState()
        }
        setShowImportDialog(open)
      }}>
        <DialogContent className="max-w-[675px] w-[675px] h-[600px] p-0 bg-white rounded-[20px] border-0 shadow-[0px_0px_15px_0px_rgba(19,43,76,0.1)]">
          {/* Header with Cloud Icon and Close Button */}
          <div className="flex items-center justify-between p-6 pb-0">
            <div className="flex items-center gap-3">
              <Cloud className="h-6 w-6 text-[#2D2F34]" />
              <h2 className="text-[16px] font-semibold text-[#2D2F34]" style={{ fontFamily: 'Inter', fontWeight: 600, lineHeight: '1.21em' }}>
                Import Tickets
              </h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowImportDialog(false)}
              className="h-6 w-6 p-0 hover:bg-transparent"
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </Button>
          </div>

          <div className="px-6 pb-6 flex-1 overflow-y-auto">
            {/* File Selection */}
            {!importProgress && !importResult && (
              <div className="space-y-6">
                <div>
                  <label 
                    className="text-[16px] font-semibold text-[#202020] mb-4 block" 
                    style={{ fontFamily: 'Inter', fontWeight: 600, lineHeight: '1.21em' }}
                  >
                    Select file to import
                  </label>
                  <div 
                    className="border-2 border-dashed border-[#A0A8C2] rounded-[10px] p-6 text-center"
                    style={{ borderStyle: 'dashed' }}
                  >
                    <Cloud className="h-6 w-6 text-[#2D2F34] mx-auto mb-4" />
                    <Button
                      onClick={() => document.getElementById('file-input')?.click()}
                      className="bg-[#3B43D6] hover:bg-[#3B43D6]/90 text-white border-0 rounded-[5px] px-4 py-2 h-9"
                      style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: '12px', lineHeight: '1.21em' }}
                    >
                      Choose File
                    </Button>
                    <input
                      id="file-input"
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                      className="hidden"
                      disabled={isImporting}
                    />
                    <p 
                      className="text-[12px] text-[#595959] mt-2" 
                      style={{ fontFamily: 'Inter', fontWeight: 500, lineHeight: '1.21em' }}
                    >
                      Supported formats: CSV, Excel (.xlsx, .xls)
                    </p>
                  </div>
                </div>

                {/* Import Requirements */}
                <div className="bg-[#F3F4FF] p-4 rounded-[5px]">
                  <h4 
                    className="text-[12px] font-medium text-[#8e8e8e] mb-2" 
                    style={{ fontFamily: 'Inter', fontWeight: 500, lineHeight: '1.21em' }}
                  >
                    Import Requirements:
                  </h4>
                  <ul 
                    className="text-[12px] text-[#2D2F34] leading-8" 
                    style={{ fontFamily: 'Inter', fontWeight: 400, lineHeight: '2em' }}
                  >
                    <li>• <strong>Required columns:</strong> Title, Priority, Type</li>
                    <li>• <strong>Optional columns:</strong> Description, Assignee, Due Date, Status</li>
                    <li>• <strong>Priority values:</strong> low, medium, high, urgent, critical</li>
                    <li>• <strong>Type values:</strong> incident, request, problem, change, general_query</li>
                    <li>• <strong>Status values:</strong> new, open, in_progress, pending, resolved, closed</li>
                    <li>• <strong>Maximum file size:</strong> 10MB</li>
                    <li>• <strong>Supported formats:</strong> CSV, Excel (.xlsx, .xls)</li>
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-[15px]">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowImportDialog(false)}
                    className="border border-black rounded-[5px] px-4 py-2 h-9"
                    style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: '12px', lineHeight: '1.21em', color: '#000000' }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleImportTickets} 
                    disabled={!importFile || isImporting}
                    className="bg-[#6E72FF] hover:bg-[#6E72FF]/90 text-white rounded-[5px] px-4 py-2 h-9"
                    style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: '12px', lineHeight: '1.21em' }}
                  >
                    Import Tickets
                  </Button>
                </div>
              </div>
            )}

            {/* Progress */}
            {importProgress && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span 
                    className="text-[14px] font-medium text-[#2D2F34]" 
                    style={{ fontFamily: 'Inter', fontWeight: 500, lineHeight: '1.21em' }}
                  >
                    {importProgress.message}
                  </span>
                  <span 
                    className="text-[14px] text-[#6A707C]" 
                    style={{ fontFamily: 'Inter', fontWeight: 400, lineHeight: '1.21em' }}
                  >
                    {importProgress.current}%
                  </span>
                </div>
                <div className="w-full bg-[#E6E6E6] rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      importProgress.status === 'error' ? 'bg-red-500' : 
                      importProgress.status === 'completed' ? 'bg-green-500' : 'bg-[#6E72FF]'
                    }`}
                    style={{ width: `${importProgress.current}%` }}
                  />
                </div>
                {importProgress.status === 'parsing' && (
                  <div 
                    className="flex items-center gap-2 text-[12px] text-[#6A707C]" 
                    style={{ fontFamily: 'Inter', fontWeight: 400, lineHeight: '1.21em' }}
                  >
                    <div className="h-4 w-4 bg-[#6E72FF]/20 animate-pulse rounded" />
                    Parsing file...
                  </div>
                )}
                {importProgress.status === 'importing' && (
                  <div 
                    className="flex items-center gap-2 text-[12px] text-[#6A707C]" 
                    style={{ fontFamily: 'Inter', fontWeight: 400, lineHeight: '1.21em' }}
                  >
                    <div className="h-4 w-4 bg-[#6E72FF]/20 animate-pulse rounded" />
                    Creating tickets...
                  </div>
                )}
              </div>
            )}

            {/* Results */}
            {importResult && (
              <div className="space-y-4">
                <div className={`p-4 rounded-[5px] ${
                  importResult.success ? 'bg-green-50' : 'bg-red-50'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`h-2 w-2 rounded-full ${
                      importResult.success ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <h4 
                      className={`text-[14px] font-medium ${
                        importResult.success ? 'text-green-800' : 'text-red-800'
                      }`}
                      style={{ fontFamily: 'Inter', fontWeight: 500, lineHeight: '1.21em' }}
                    >
                      {importResult.success ? 'Import Successful!' : 'Import Completed with Errors'}
                    </h4>
                  </div>
                  <div 
                    className="text-[12px] text-[#6A707C]" 
                    style={{ fontFamily: 'Inter', fontWeight: 400, lineHeight: '1.21em' }}
                  >
                    <p>• Total rows processed: {importResult.totalRows}</p>
                    <p>• Valid tickets found: {importResult.validRows}</p>
                    <p>• Successfully imported: {importResult.successfullyImportedCount}</p>
                    <p>• Failed to import: {importResult.failedImportCount}</p>
                  </div>
                </div>

                {importResult.errors.length > 0 && (
                  <div className="space-y-2">
                    <h5 
                      className="text-[12px] font-medium text-red-800" 
                      style={{ fontFamily: 'Inter', fontWeight: 500, lineHeight: '1.21em' }}
                    >
                      Errors:
                    </h5>
                    <div className="max-h-32 overflow-y-auto bg-red-50 p-3 rounded-[5px]">
                      <ul 
                        className="text-[11px] text-red-700 space-y-1" 
                        style={{ fontFamily: 'Inter', fontWeight: 400, lineHeight: '1.21em' }}
                      >
                        {importResult.parsingErrors.length > 0 && (
                          <li className="font-medium">Parsing Errors:</li>
                        )}
                        {importResult.parsingErrors.slice(0, 5).map((error, index) => (
                          <li key={`parse-${index}`}>• {error}</li>
                        ))}
                        
                        {importResult.validationErrors.length > 0 && (
                          <li className="font-medium mt-2">Validation Errors:</li>
                        )}
                        {importResult.validationErrors.slice(0, 5).map((error, index) => (
                          <li key={`validation-${index}`}>• {error}</li>
                        ))}
                        
                        {importResult.importErrors.length > 0 && (
                          <li className="font-medium mt-2">Import Errors:</li>
                        )}
                        {importResult.importErrors.slice(0, 5).map((error, index) => (
                          <li key={`import-${index}`}>• {error}</li>
                        ))}
                        
                        {importResult.errors.length > 15 && (
                          <li className="mt-2">• ... and {importResult.errors.length - 15} more errors</li>
                        )}
                      </ul>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-[15px]">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      resetImportState()
                      setShowImportDialog(false)
                    }}
                    className="border border-black rounded-[5px] px-4 py-2 h-9"
                    style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: '12px', lineHeight: '1.21em', color: '#000000' }}
                  >
                    Close
                  </Button>
                  {importResult.successfullyImportedCount > 0 && (
                    <Button 
                      onClick={() => {
                        resetImportState()
                        setShowImportDialog(false)
                      }}
                      className="bg-[#6E72FF] hover:bg-[#6E72FF]/90 text-white rounded-[5px] px-4 py-2 h-9"
                      style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: '12px', lineHeight: '1.21em' }}
                    >
                      View Tickets
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>


      <Suspense fallback={<LoadingSpinner size="lg" />}>
        <TicketDrawer
          isOpen={showTicketTray}
          onClose={() => {
            setShowTicketTray(false)
            setSelectedTicket(null)
            setPreSelectedTicketType(null)
          }}
          ticket={selectedTicket}
          preSelectedType={preSelectedTicketType}
        />
      </Suspense>

      {/* Edit Ticket Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold text-foreground">Edit Ticket</DialogTitle>
          </DialogHeader>
          {ticketToEdit && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Title</label>
                <Input
                  value={editForm.title}
                  onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                  className="mt-1 text-sm h-8"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</label>
                <Textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  className="mt-1 text-sm resize-none"
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</label>
                  <Select 
                    value={editForm.type} 
                    onValueChange={(value) => setEditForm(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger className="mt-1 h-8">
                      <SelectValue className="text-sm" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="request" className="text-sm">Request</SelectItem>
                      <SelectItem value="incident" className="text-sm">Incident</SelectItem>
                      <SelectItem value="problem" className="text-sm">Problem</SelectItem>
                      <SelectItem value="change" className="text-sm">Change</SelectItem>
                      <SelectItem value="task" className="text-sm">Task</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Priority</label>
                  <Select 
                    value={editForm.priority} 
                    onValueChange={(value) => setEditForm(prev => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger className="mt-1 h-8">
                      <SelectValue className="text-sm" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low" className="text-sm">Low</SelectItem>
                      <SelectItem value="medium" className="text-sm">Medium</SelectItem>
                      <SelectItem value="high" className="text-sm">High</SelectItem>
                      <SelectItem value="critical" className="text-sm">Critical</SelectItem>
                      <SelectItem value="urgent" className="text-sm">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</label>
                  <Select 
                    value={editForm.status} 
                    onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger className="mt-1 h-8">
                      <SelectValue className="text-sm" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new" className="text-sm">New</SelectItem>
                      <SelectItem value="in_progress" className="text-sm">In Progress</SelectItem>
                      <SelectItem value="resolved" className="text-sm">Resolved</SelectItem>
                      <SelectItem value="closed" className="text-sm">Closed</SelectItem>
                      <SelectItem value="on_hold" className="text-sm">On Hold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowEditModal(false)} className="text-sm h-8 px-3">Cancel</Button>
                <Button onClick={handleUpdateTicket} disabled={isUpdating} className="text-sm h-8 px-3">
                  {isUpdating ? 'Updating...' : 'Update Ticket'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Ticket Modal */}
      <DeleteConfirmationDialog
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        onConfirm={confirmDeleteTicket}
        title="Delete Ticket"
        description="Do you want to delete ticket"
        itemName={ticketToDelete ? `#${ticketToDelete.id} - ${ticketToDelete.title}` : undefined}
        isDeleting={deleteTicketMutation.isPending}
      />

      {/* Bulk Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={showBulkDeleteDialog}
        onOpenChange={setShowBulkDeleteDialog}
        onConfirm={confirmBulkDelete}
        title="Delete Multiple Tickets"
        description={`Do you want to delete ${bulkDeleteTicketIds.length} ticket${bulkDeleteTicketIds.length > 1 ? 's' : ''}`}
        itemName={undefined}
        requireCheckbox={true}
        checkboxLabel="I understand this action cannot be undone"
        isDeleting={isBulkDeleting}
      />

      {/* Custom Columns Dialog */}
      <CustomColumnsDialog
        open={showCustomColumnsDialog}
        onOpenChange={setShowCustomColumnsDialog}
      />

      {/* Custom Columns Dropdown */}
      <CustomColumnsDropdown
        open={showCustomColumnsDropdown}
        onOpenChange={setShowCustomColumnsDropdown}
        triggerRef={customColumnsButtonRef}
      />

    </PageContent>
  )
}
