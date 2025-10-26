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
import { createClient } from "@/lib/supabase/client"
import { useQueryClient } from "@tanstack/react-query"
import { useTicketTypes } from "@/hooks/use-ticket-types"
import { format } from "date-fns"
import { parseImportFile, validateFile, ImportResult, ImportProgress } from "@/lib/utils/file-import"
import { Skeleton } from "@/components/ui/skeleton"
import { MultiAssigneeAvatars } from "@/components/tickets/multi-assignee-avatars"
import { CustomColumnsDropdown } from "@/components/tickets/custom-columns-dropdown"
import { CustomColumnCell } from "@/components/tickets/custom-column-cell"
import { useCustomColumnsStore } from "@/lib/stores/custom-columns-store"
import { TicketsTable } from "@/components/tickets/tickets-table-with-bulk"
import { AIAssistantModal } from "@/components/ai/ai-assistant-modal"
import { useDebounce } from "@/hooks/use-debounce"
import { EnhancedKanbanBoard } from "@/components/tickets/enhanced-kanban-board"
import { FilterDialog } from "@/components/tickets/filter-dialog"


const TicketDrawer = dynamic(
  () => import("@/components/tickets/ticket-drawer"),
  {
    loading: () => null, // No spinner, drawer opens fast enough
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
  const { user, organization, isAdmin } = useAuth()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const searchParams = useSearchParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  
  // Debug: Track if tickets page mounts when it shouldn't
  useEffect(() => {
    console.log('🎫 TicketsPage mounted')
    console.log('📍 URL:', window.location.pathname)
    console.log('📍 Title:', document.title)
    document.title = 'Tickets | Kroolo BSM'
    return () => {
      console.log('❌ TicketsPage unmounted')
    }
  }, [])
  
  // State for filters
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState("all")
  const [selectedPriority, setSelectedPriority] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedTicketView, setSelectedTicketView] = useState("all-tickets")
  
  // ✅ FIX: Debounce search to prevent excessive re-renders
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  
  // Use real data from API
  // Memoize the params to prevent unnecessary re-renders
  const ticketsParams = useMemo(() => {
    const params: any = {
      page: 1,
      // Remove limit to fetch all tickets
      status: selectedStatus === "all" ? undefined : selectedStatus,
      priority: selectedPriority === "all" ? undefined : selectedPriority,
      type: selectedType === "all" ? undefined : selectedType,
      search: debouncedSearchTerm || undefined, // ✅ Use debounced search
      organization_id: organization?.id, // Add organization filter
    }

    // Apply filters based on selectedTicketView dropdown
    if (selectedTicketView === "my-tickets") {
      params.requester_id = user?.id
    } else if (selectedTicketView === "assigned-to-me") {
      params.assignee_id = user?.id
    } else if (selectedTicketView === "recent") {
      // Filter for tickets created in the last 7 days
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      params.created_at_gte = sevenDaysAgo.toISOString()
    }
    // If "all-tickets" is selected, no specific filter is applied (shows all tickets)
    
    return params
  }, [selectedStatus, selectedPriority, selectedType, debouncedSearchTerm, user?.id, selectedTicketView, organization?.id])

  // GraphQL + React Query for reads (CACHED! No refetch on navigation)
  const { 
    data: ticketsData, 
    isLoading,        // Only true on FIRST load (no cached data)
    isFetching,       // True when fetching (including background refetch)
    error: queryError, 
    refetch 
  } = useTicketsGraphQLQuery(ticketsParams)
  
  // Smart loading: only show spinner if NO cached data exists
  const loading = isLoading && !ticketsData
  
  console.log('🔍 GraphQL Query Status:', {
    loading,
    error: queryError,
    hasData: !!ticketsData,
    ticketsCount: ticketsData?.tickets?.length || 0,
    totalCount: ticketsData?.total || 0,
    params: ticketsParams
  })
  
  // Debug the actual ticket data structure
  if (ticketsData?.tickets?.length && ticketsData.tickets.length > 0) {
    const firstTicket = ticketsData.tickets[0]
    console.log('🔍 FIRST TICKET DATA (RAW):', {
      id: firstTicket.id,
      ticket_number: firstTicket.ticket_number,
      title: firstTicket.title,
      assignee_id: firstTicket.assignee_id,
      assignee_ids: firstTicket.assignee_ids,
      requester_id: firstTicket.requester_id,
      assignee: firstTicket.assignee,
      requester: firstTicket.requester,
      fullTicket: firstTicket
    })
  }
  
  const tickets = ticketsData?.tickets || []
  
  const pagination = {
    page: 1, // Single page since we fetch all tickets
    limit: ticketsData?.total || 0, // Total tickets available
    total: ticketsData?.total || 0,
    hasNextPage: false, // No pagination since we fetch all
    hasPreviousPage: false, // No pagination since we fetch all
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

  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  
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
      // Keep original date fields for Kanban view
      created_at: ticket.created_at,
      due_date: ticket.due_date,
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
    
    // Check if any tickets have assignee data
    const ticketsWithAssignees = baseTickets.filter((t: any) => t.assignee_id || (t.assignee_ids && t.assignee_ids.length > 0))
    const ticketsWithRequesters = baseTickets.filter((t: any) => t.requester_id)
    
    console.log('🔍 Filtering tickets:', {
      totalTickets: baseTickets.length,
      ticketsWithAssignees: ticketsWithAssignees.length,
      ticketsWithRequesters: ticketsWithRequesters.length,
      activeFilters: filterConditions.activeFilters,
      currentView,
      sampleTicket: baseTickets[0] ? {
        id: baseTickets[0].id,
        title: baseTickets[0].title,
        assignee_id: baseTickets[0].assignee_id,
        assignee_ids: baseTickets[0].assignee_ids,
        requester_id: baseTickets[0].requester_id,
        assignee: baseTickets[0].assignee,
        requester: baseTickets[0].requester,
        fullTicket: baseTickets[0] // Show complete ticket object
      } : null
    })
    
    // Debug the transformation issue
    console.log('🔍 DATA TRANSFORMATION DEBUG:', {
      rawTicketsCount: tickets.length,
      transformedTicketsCount: transformedTickets.length,
      localTicketsCount: localTickets.length,
      currentView,
      usingTickets: currentView === "kanban" ? "localTickets" : "transformedTickets"
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
          
          console.log('🔍 Assignee filter check:', {
            ticketId: ticket.id,
            ticketTitle: ticket.title,
            filterAssigneeIds: filterConditions.activeFilters.assignee,
            ticketAssigneeIds: allAssigneeIds,
            ticketAssigneeId: singleAssigneeId,
            ticketAssigneeIdsArray: assigneeIds,
            matches: filterConditions.activeFilters.assignee.some(assigneeId => 
              allAssigneeIds.includes(assigneeId)
            )
          })
          
          // If ticket has no assignee data, it won't match any assignee filter
          if (allAssigneeIds.length === 0) {
            console.log('⚠️ Ticket has no assignee data:', ticket.id, ticket.title)
            return false
          }
          
          if (!filterConditions.activeFilters.assignee.some(assigneeId => 
            allAssigneeIds.includes(assigneeId)
          )) return false
        }
        
        // Reported By filter (from active filters) - check requester_id
        if (filterConditions.activeFilters.reportedBy.length > 0) {
          const requesterId = ticket.requester_id
          
          console.log('🔍 Reported By filter check:', {
            ticketId: ticket.id,
            ticketTitle: ticket.title,
            filterRequesterIds: filterConditions.activeFilters.reportedBy,
            ticketRequesterId: requesterId,
            matches: requesterId && filterConditions.activeFilters.reportedBy.includes(requesterId)
          })
          
          // If ticket has no requester data, it won't match any requester filter
          if (!requesterId) {
            console.log('⚠️ Ticket has no requester data:', ticket.id, ticket.title)
            return false
          }
          
          if (!filterConditions.activeFilters.reportedBy.includes(requesterId)) return false
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
      
      // Initialize Supabase client for profile lookup
      const supabase = createClient()
      
      // Pre-fetch all profiles for assignee lookup
      let profilesMap: Record<string, string> = {}
      try {
        const profilesResult = await supabase
          .from('profiles')
          .select('id, display_name, first_name, last_name, email')
        
        if (profilesResult.data) {
          profilesMap = profilesResult.data.reduce((map, profile) => {
            // Map by display_name (primary)
            if (profile.display_name) {
              map[profile.display_name.toLowerCase().trim()] = profile.id
            }
            // Also map by "first_name last_name" format
            if (profile.first_name && profile.last_name) {
              map[`${profile.first_name} ${profile.last_name}`.toLowerCase().trim()] = profile.id
            }
            // Also map by email
            if (profile.email) {
              map[profile.email.toLowerCase().trim()] = profile.id
            }
            return map
          }, {} as Record<string, string>)
        }
        
        console.log('👥 Loaded assignee profiles:', Object.keys(profilesMap).length)
      } catch (profileError) {
        console.warn('⚠️ Could not load profiles for assignee lookup:', profileError)
      }

      for (let i = 0; i < parseResult.tickets.length; i++) {
        const ticket = parseResult.tickets[i]
        
        try {
          // Map the ticket data to match the API expectations
          const customFields: any = {}
          
          // Store estimated_hours in custom_fields if available
          if (ticket.estimated_hours) {
            customFields.estimated_hours = ticket.estimated_hours
          }
          
          // Store reporter information in custom_fields if available
          if (ticket.reporter) {
            customFields.reporter = ticket.reporter
          }
          
          // Initialize meta tags for storing extra data
          const metaTags: string[] = []
          
          // Look up assignee ID if assignee name is provided
          let assigneeId = null
          let assigneeIds: string[] = []
          
          if (ticket.assignee && profilesMap) {
            const assigneeName = ticket.assignee.toLowerCase().trim()
            const foundAssigneeId = profilesMap[assigneeName]
            
            if (foundAssigneeId) {
              assigneeId = foundAssigneeId
              assigneeIds = [foundAssigneeId]
            } else {
              // Add as metadata tag for reference
              metaTags.push(`assignee-name:${ticket.assignee}`)
            }
          }

          // Look up reporter/requester ID from CSV reporter field
          let requesterId = user?.id // Fallback to logged-in user
          
          if (ticket.reporter && profilesMap) {
            const reporterName = ticket.reporter.toLowerCase().trim()
            const foundReporterId = profilesMap[reporterName]
            
            if (foundReporterId) {
              requesterId = foundReporterId
            } else {
              // Add as metadata tag for reference
              metaTags.push(`reporter-name:${ticket.reporter}`)
            }
          }

          const ticketData: any = {
            title: ticket.title,
            description: ticket.description || '',
            priority: ticket.priority,
            type: ticket.type,
            status: ticket.status || 'new',
            impact: 'medium', // Default value
            urgency: 'medium', // Default value
            tags: ticket.tags || [],
            // Required fields - use mapped reporter as requester
            requester_id: requesterId,
            organization_id: organization?.id,
            // Assignee fields - now with actual UUID lookup
            assignee_id: assigneeId,
            assignee_ids: assigneeIds,
          }
          
          // Add optional fields if they exist
          if (ticket.category) {
            ticketData.category = ticket.category
          }
          if (ticket.due_date) {
            // Format due_date as ISO timestamp like the drawer does
            ticketData.due_date = new Date(ticket.due_date).toISOString()
          }
          
          // Add additional standard database fields
          if (ticket.subcategory) {
            ticketData.subcategory = ticket.subcategory
          }
          
          // Add additional metadata to tags
          if (ticket.estimated_hours) {
            metaTags.push(`hours:${ticket.estimated_hours}`)
          }
          if (ticket.reporter) {
            metaTags.push(`reporter:${ticket.reporter}`)
          }
          
          // Merge meta tags with regular tags
          if (metaTags.length > 0) {
            ticketData.tags = [...(ticketData.tags || []), ...metaTags]
          }
          
          // TEMPORARILY DISABLED: custom_fields causing GraphQL JSON serialization issues
          // The GraphQL schema might not be properly configured for JSONB
          // TODO: Investigate GraphQL JSONB scalar type configuration
          
          // Clean up data similar to how the drawer does it
          const cleanedData: any = {}
          Object.keys(ticketData).forEach(key => {
            const value = ticketData[key]
            // Only include non-empty values (skip empty strings, null, undefined)
            if (value !== '' && value !== null && value !== undefined) {
              cleanedData[key] = value
            } else if (key === 'assignee_id' && value === null) {
              // Allow null for assignee_id (no assignee)
              cleanedData[key] = null
            } else if (key === 'tags' && Array.isArray(value)) {
              // Include tags array (empty arrays are OK for tags)
              cleanedData[key] = value.length > 0 ? value : null
            } else if (key === 'assignee_ids' && Array.isArray(value)) {
              // Re-enabled: Include assignee_ids array (empty arrays should work like tags)
              cleanedData[key] = value
            }
          })
          
          await createTicket(cleanedData)
          successCount++
          
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
            onReset={handleClearAllFilters}
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
        onCheckboxChange={async (ticketId, checked) => {
          console.log("[KANBAN CHECKBOX] Ticket:", ticketId, "Checked:", checked)
          try {
            const supabase = createClient()
            
            // Get current ticket data to preserve existing custom_fields
            const { data: currentTicket, error: fetchError } = await supabase
              .from('tickets')
              .select('custom_fields')
              .eq('id', ticketId)
              .single()
            
            if (fetchError) {
              console.error('Error fetching ticket data:', fetchError)
              toast.error('Failed to fetch ticket data')
              return
            }
            
            // Update the custom_fields with the completion status
            const updatedCustomFields = {
              ...(currentTicket.custom_fields || {}),
              completed: checked
            }
            
            console.log("[KANBAN CHECKBOX] Updated custom fields:", updatedCustomFields)
            
            // Update the ticket's completion status in Supabase
            const { data, error } = await supabase
              .from('tickets')
              .update({ 
                custom_fields: updatedCustomFields,
                updated_at: new Date().toISOString()
              })
              .eq('id', ticketId)
              .select()
            
            console.log("[KANBAN CHECKBOX] Supabase response:", { data, error })
            
            if (error) {
              console.error('Error updating ticket completion status:', error)
              toast.error('Failed to update completion status')
            } else {
              console.log('Successfully updated ticket completion status')
              toast.success(checked ? 'Ticket marked as completed' : 'Ticket marked as incomplete')
              
              // Invalidate and refetch tickets data to reflect the change
              await queryClient.invalidateQueries({ queryKey: ['tickets'] })
            }
          } catch (error) {
            console.error('Error updating ticket completion status:', error)
            toast.error('Failed to update completion status')
          }
        }}
        onDateChange={async (ticketId, date) => {
          console.log("[KANBAN DATE] Ticket:", ticketId, "Date:", date)
          console.log("[KANBAN DATE] Date ISO String:", date ? date.toISOString() : null)
          try {
            const supabase = createClient()
            console.log("[KANBAN DATE] Supabase client created")
            
            // Update the ticket's due_date in Supabase
            const { data, error } = await supabase
              .from('tickets')
              .update({ 
                due_date: date ? date.toISOString() : null,
                updated_at: new Date().toISOString()
              })
              .eq('id', ticketId)
              .select()
            
            console.log("[KANBAN DATE] Supabase response:", { data, error })
            
            if (error) {
              console.error('Error updating ticket due date:', error)
              toast.error('Failed to update due date: ' + error.message)
            } else {
              console.log('Successfully updated ticket due date')
              toast.success('Due date updated successfully')
              
              // Invalidate and refetch tickets data to reflect the change
              await queryClient.invalidateQueries({ queryKey: ['tickets'] })
            }
          } catch (error) {
            console.error('Error updating ticket due date:', error)
            toast.error('Failed to update due date')
          }
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
                     {isAdmin ? "All Tickets" : "My Tickets"}
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
                   Manage all support tickets and track customer issues effortlessly.
                 </p>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="relative inline-block">
                  <Button
                    onClick={() => setShowAIPanel(true)}
                    className="bg-gradient-to-r from-[#6E72FF] to-[#FF2CB9] hover:from-[#6E72FF]/90 hover:to-[#FF2CB9]/90 text-white transition-all relative z-10 flex items-center justify-center"
                    style={{ 
                      fontSize: '13px', 
                      fontWeight: 500, 
                      width: '80px',
                      height: '37px',
                      padding: '0',
                      borderRadius: '5px',
                      gap: '6px'
                    }}
                  >
                    <svg width="14" height="13" viewBox="0 0 14 13" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                      <path d="M8.86499 4.24871L9.55886 6.01401C9.81605 6.66739 10.3326 7.18505 10.986 7.44114L12.7513 8.13501C13.0829 8.26525 13.0829 8.73475 12.7513 8.86499L10.986 9.55886C10.3326 9.81604 9.81605 10.3326 9.55886 10.986L8.86499 12.7513C8.73475 13.0829 8.26525 13.0829 8.13501 12.7513L7.44114 10.986C7.18395 10.3326 6.66739 9.81495 6.01402 9.55886L4.24871 8.86499C3.9171 8.73475 3.9171 8.26525 4.24871 8.13501L6.01402 7.44114C6.66739 7.18395 7.18505 6.66739 7.44114 6.01401L8.13501 4.24871C8.26525 3.9171 8.73366 3.9171 8.86499 4.24871Z" fill="white"/>
                      <path d="M3.24333 0.165805L3.70591 1.34268C3.87737 1.77826 4.22174 2.12337 4.65732 2.2941L5.83419 2.75667C6.05527 2.8435 6.05527 3.1565 5.83419 3.24333L4.65732 3.7059C4.22174 3.87736 3.87737 4.22174 3.70591 4.65732L3.24333 5.83419C3.1565 6.05527 2.8435 6.05527 2.75667 5.83419L2.2941 4.65732C2.12264 4.22174 1.77826 3.87663 1.34268 3.7059L0.165805 3.24333C-0.0552684 3.1565 -0.0552684 2.8435 0.165805 2.75667L1.34268 2.2941C1.77826 2.12264 2.12336 1.77826 2.2941 1.34268L2.75667 0.165805C2.8435 -0.0552684 3.15577 -0.0552684 3.24333 0.165805Z" fill="white"/>
                      <path d="M12.6217 2.0829L12.853 2.67134C12.9387 2.88913 13.1109 3.06168 13.3287 3.14705L13.9171 3.37834C14.0276 3.42175 14.0276 3.57825 13.9171 3.62166L13.3287 3.85295C13.1109 3.93868 12.9387 4.11087 12.853 4.32866L12.6217 4.9171C12.5783 5.02763 12.4217 5.02763 12.3783 4.9171L12.147 4.32866C12.0613 4.11087 11.8891 3.93832 11.6713 3.85295L11.0829 3.62166C10.9724 3.57825 10.9724 3.42175 11.0829 3.37834L11.6713 3.14705C11.8891 3.06132 12.0617 2.88913 12.147 2.67134L12.3783 2.0829C12.4217 1.97237 12.5779 1.97237 12.6217 2.0829Z" fill="white"/>
                    </svg>
                    <span>Ask AI</span>
                  </Button>
                  <svg 
                    className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
                    style={{ top: '14px', opacity: 0.78 }}
                    width="101" 
                    height="37" 
                    viewBox="0 0 101 37" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <g opacity="0.78" filter="url(#filter0_f_2_112)">
                      <path d="M26.6957 14.0001L74.3043 14L87 23H14L26.6957 14.0001Z" fill="url(#paint0_linear_2_112)"/>
                    </g>
                    <defs>
                      <filter id="filter0_f_2_112" x="0" y="0" width="101" height="37" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                        <feFlood floodOpacity="0" result="BackgroundImageFix"/>
                        <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
                        <feGaussianBlur stdDeviation="7" result="effect1_foregroundBlur_2_112"/>
                      </filter>
                      <linearGradient id="paint0_linear_2_112" x1="17.7029" y1="16.7166" x2="83.2971" y2="16.7166" gradientUnits="userSpaceOnUse">
                        <stop offset="0.0576923" stopColor="#006AFF"/>
                        <stop offset="0.35" stopColor="#4400FE"/>
                        <stop offset="0.65" stopColor="#B300FF"/>
                        <stop offset="1" stopColor="#FF0078"/>
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <Button
                  variant="outline"
                  className="bg-white dark:bg-background text-[#6E72FF] border border-[#DDDEFF] hover:bg-[#6E72FF]/5 hover:text-[#6E72FF] transition-all flex items-center justify-center"
                  onClick={() => setShowImportDialog(true)}
                  style={{ 
                    fontSize: '13px', 
                    fontWeight: 500,
                    width: '91px',
                    height: '37px',
                    padding: '0',
                    borderRadius: '5px',
                    gap: '6px'
                  }}
                >
                  <svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                    <path d="M9.5 9.49999V15.0417M9.5 15.0417L7.71875 13.1945M9.5 15.0417L11.2813 13.1945M5.225 14.118C3.65099 14.118 2.375 12.8184 2.375 11.2153C2.375 9.89424 3.24138 8.77934 4.42698 8.42784C4.47737 8.41288 4.5125 8.36593 4.5125 8.31249C4.5125 5.90775 6.42648 3.95833 8.7875 3.95833C11.1485 3.95833 13.0625 5.90775 13.0625 8.31249C13.0625 8.35857 13.1049 8.39277 13.1491 8.38272C13.3505 8.33672 13.56 8.31249 13.775 8.31249C15.349 8.31249 16.625 9.61209 16.625 11.2153C16.625 12.8184 15.349 14.118 13.775 14.118" stroke="#6E72FF" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Import</span>
                </Button>
                <Button 
                  className="bg-[#6E72FF] hover:bg-[#6E72FF]/90 text-white transition-all flex items-center justify-center"
                  onClick={() => {
                    console.log("[CREATE] Opening drawer for new ticket")
                    setSelectedTicket(null) // No ticket = CREATE mode
                    setShowTicketTray(true)
                  }}
                  style={{ 
                    fontSize: '13px', 
                    fontWeight: 500,
                    width: '117px',
                    height: '37px',
                    padding: '0',
                    borderRadius: '5px'
                  }}
                >
                  + Create Ticket
                </Button>
              </div>
            </div>

             <div className="space-y-4 w-full max-w-full overflow-hidden">
               <div className="flex items-center justify-between border-b border-[#EEEEEE] bg-[#F8F8F8] dark:bg-[#282a2f] dark:border-gray-600 w-full max-w-full rounded-[10px]" style={{ 
                 borderColor: isDark ? '#374151' : '#EEEEEE', 
                 backgroundColor: isDark ? '#282a2f' : '#F8F8F8',
                 width: '1617px',
                 height: '42px'
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
                 
                 {/* All Tickets Dropdown - Rightmost position */}
                 <div className="flex items-center mr-2">
                   <Select value={selectedTicketView} onValueChange={setSelectedTicketView}>
                     <SelectTrigger 
                       className="w-[126px] h-[31px] border border-[#E4E4E4] bg-white dark:bg-[#1e2024] dark:border-gray-600 text-sm font-medium rounded-[5px] shadow-none"
                       style={{ 
                         backgroundColor: isDark ? '#1e2024' : '#FFFFFF', 
                         borderColor: isDark ? '#374151' : '#E4E4E4',
                         color: '#8e8e8e',
                         fontSize: '11px',
                         fontWeight: 400
                       }}
                     >
                       <SelectValue placeholder="All Tickets" />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="all-tickets">All Tickets</SelectItem>
                       <SelectItem value="my-tickets">My Tickets</SelectItem>
                       <SelectItem value="assigned-to-me">Assigned to Me</SelectItem>
                       <SelectItem value="recent">Recent</SelectItem>
                     </SelectContent>
                   </Select>
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

       <Dialog open={showImportDialog} onOpenChange={(open) => {
         if (!open) {
           resetImportState()
         }
         setShowImportDialog(open)
       }}>
         <DialogContent className="max-w-[675px] w-full mx-4 sm:w-[675px] max-h-[90vh] p-0 bg-background dark:bg-background rounded-[20px] border border-border shadow-lg overflow-hidden" showCloseButton={false}>
           {/* Header with Cloud Icon and Close Button */}
           <div className="flex items-center justify-between p-4 sm:p-6 pb-0">
             <div className="flex items-center gap-3">
               <Cloud className="h-5 w-5 sm:h-6 sm:w-6 text-foreground" />
               <h2 className="text-sm sm:text-base font-semibold text-foreground">
                 Import Tickets
               </h2>
             </div>
             <Button
               variant="ghost"
               size="sm"
               onClick={() => setShowImportDialog(false)}
               className="h-8 w-8 p-0 hover:bg-muted rounded-md"
             >
               <svg className="h-5 w-5 text-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                 <line x1="18" y1="6" x2="6" y2="18"></line>
                 <line x1="6" y1="6" x2="18" y2="18"></line>
               </svg>
             </Button>
           </div>

           <div className="px-4 sm:px-6 pb-4 sm:pb-6 flex-1 overflow-y-auto">
             {/* File Selection */}
             {!importProgress && !importResult && (
               <div className="space-y-4">
                 <div>
                   <label className="text-sm sm:text-base font-semibold text-foreground mb-4 block">
                     Select file to import
                   </label>
                   <div className="border-2 border-dashed border-border rounded-lg p-4 sm:p-6 text-center">
                     {!importFile ? (
                       <div className="flex flex-col items-center gap-4">
                         <Cloud className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                         <div className="space-y-2">
                           <Button 
                             className="bg-[#6E72FF] hover:bg-[#6E72FF]/90 text-white border-0 rounded-md px-4 py-2 text-xs sm:text-sm font-medium"
                             onClick={() => document.getElementById('file-input')?.click()}
                           >
                             Choose File
                           </Button>
                           <Input
                             id="file-input"
                             type="file"
                             accept=".csv,.xlsx,.xls"
                             onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                             className="hidden"
                             disabled={isImporting}
                           />
                         </div>
                         <p className="text-xs text-muted-foreground">
                           Supported formats: CSV, Excel (.xlsx, .xls)
                         </p>
                       </div>
                     ) : (
                       <div className="flex flex-col items-center gap-4">
                         <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg w-full max-w-md">
                           <div className="flex-shrink-0">
                             <div className="h-10 w-10 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
                               {importFile.name.endsWith('.csv') ? (
                                 <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                   <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" clipRule="evenodd" />
                                   <path d="M8 6h4v1H8V6zM8 8h4v1H8V8zM8 10h4v1H8v-1zM8 12h4v1H8v-1z" />
                                 </svg>
                               ) : (
                                 <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                   <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" clipRule="evenodd" />
                                   <path d="M7 6h6v1H7V6zM7 8h6v1H7V8zM7 10h6v1H7v-1zM7 12h3v1H7v-1z" />
                                 </svg>
                               )}
                             </div>
                           </div>
                           <div className="flex-1 min-w-0">
                             <p className="text-sm font-medium text-green-800 dark:text-green-200 truncate">
                               {importFile.name}
                             </p>
                             <p className="text-xs text-green-600 dark:text-green-400">
                               {(importFile.size / 1024 / 1024).toFixed(2)} MB • {importFile.type || 'File'}
                             </p>
                           </div>
                           <button
                             onClick={() => setImportFile(null)}
                             className="flex-shrink-0 h-8 w-8 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-colors"
                             title="Remove file"
                           >
                             <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                             </svg>
                           </button>
                         </div>
                         <div className="space-y-2">
                           <Button 
                             variant="outline"
                             size="sm"
                             onClick={() => document.getElementById('file-input')?.click()}
                             className="text-xs"
                           >
                             Change File
                           </Button>
                           <Input
                             id="file-input"
                             type="file"
                             accept=".csv,.xlsx,.xls"
                             onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                             className="hidden"
                             disabled={isImporting}
                           />
                         </div>
                         <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                           <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                           </svg>
                           File loaded successfully
                         </div>
                       </div>
                     )}
                   </div>
                 </div>

                 <div className="bg-muted/50 dark:bg-muted/30 p-4 rounded-lg">
                   <h4 className="text-xs sm:text-sm font-medium text-muted-foreground mb-2">
                     Import Requirements:
                   </h4>
                   <div className="text-xs sm:text-sm text-foreground space-y-1">
                     <div>• <strong>Required columns:</strong> Title, Priority, Type</div>
                     <div>• <strong>Optional columns:</strong> Description, Assignee, Due Date, Status</div>
                     <div>• <strong>Priority values:</strong> low, medium, high, urgent, critical</div>
                     <div>• <strong>Type values:</strong> incident, request, problem, change, general-query</div>
                     <div>• <strong>Status values:</strong> new, open, in-progress, pending, resolved, closed</div>
                     <div>• <strong>Maximum file size:</strong> 10MB</div>
                     <div>• <strong>Supported formats:</strong> CSV, Excel (.xlsx, .xls)</div>
                   </div>
                 </div>

                 <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4 pt-4">
                   <Button 
                     variant="outline" 
                     onClick={() => setShowImportDialog(false)} 
                     className="w-full sm:w-auto border-border rounded-md px-4 py-2 text-xs sm:text-sm font-medium"
                   >
                     Cancel
                   </Button>
                   <Button 
                     onClick={handleImportTickets} 
                     disabled={!importFile || isImporting}
                     className="w-full sm:w-auto bg-[#6E72FF] hover:bg-[#6E72FF]/90 text-white rounded-md px-4 py-2 text-xs sm:text-sm font-medium"
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
                  <span className="text-sm font-medium text-foreground">
                    {importProgress.message}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {importProgress.current}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      importProgress.status === 'error' ? 'bg-destructive' : 
                      importProgress.status === 'completed' ? 'bg-green-500' : 'bg-[#6E72FF]'
                    }`}
                    style={{ width: `${importProgress.current}%` }}
                  />
                </div>
                {importProgress.status === 'parsing' && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                    <div className="h-4 w-4 bg-[#6E72FF]/20 animate-pulse rounded" />
                    Parsing file...
                  </div>
                )}
                {importProgress.status === 'importing' && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                    <div className="h-4 w-4 bg-[#6E72FF]/20 animate-pulse rounded" />
                    Creating tickets...
                  </div>
                )}
              </div>
            )}

            {/* Results */}
            {importResult && (
              <div className="space-y-4">
                <div className={`p-4 rounded-lg ${
                  importResult.success ? 'bg-green-50 dark:bg-green-950/20' : 'bg-destructive/10'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`h-2 w-2 rounded-full ${
                      importResult.success ? 'bg-green-500' : 'bg-destructive'
                    }`} />
                    <h4 className={`text-sm font-medium ${
                      importResult.success ? 'text-green-700 dark:text-green-400' : 'text-destructive'
                    }`}>
                      {importResult.success ? 'Import Successful!' : 'Import Completed with Errors'}
                    </h4>
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground space-y-1">
                    <div>• Total rows processed: {importResult.totalRows}</div>
                    <div>• Valid tickets found: {importResult.validRows}</div>
                    <div>• Successfully imported: {importResult.successfullyImportedCount}</div>
                    <div>• Failed to import: {importResult.failedImportCount}</div>
                  </div>
                </div>

                {importResult.errors.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-xs sm:text-sm font-medium text-destructive">Errors:</h5>
                    <div className="max-h-32 overflow-y-auto bg-destructive/10 p-3 rounded-lg">
                      <div className="text-xs text-destructive space-y-1">
                        {importResult.parsingErrors.length > 0 && (
                          <div className="font-medium">Parsing Errors:</div>
                        )}
                        {importResult.parsingErrors.slice(0, 5).map((error, index) => (
                          <div key={`parse-${index}`}>• {error}</div>
                        ))}
                        
                        {importResult.validationErrors.length > 0 && (
                          <div className="font-medium mt-2">Validation Errors:</div>
                        )}
                        {importResult.validationErrors.slice(0, 5).map((error, index) => (
                          <div key={`validation-${index}`}>• {error}</div>
                        ))}
                        
                        {importResult.importErrors.length > 0 && (
                          <div className="font-medium mt-2">Import Errors:</div>
                        )}
                        {importResult.importErrors.slice(0, 5).map((error, index) => (
                          <div key={`import-${index}`}>• {error}</div>
                        ))}
                        
                        {importResult.errors.length > 15 && (
                          <div className="mt-2">• ... and {importResult.errors.length - 15} more errors</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      resetImportState()
                      setShowImportDialog(false)
                    }}
                    className="w-full sm:w-auto border-border rounded-md px-4 py-2 text-xs sm:text-sm font-medium"
                  >
                    Close
                  </Button>
                  {importResult.validRows > 0 && (
                    <Button 
                      onClick={() => {
                        resetImportState()
                        setShowImportDialog(false)
                      }}
                      className="w-full sm:w-auto bg-[#6E72FF] hover:bg-[#6E72FF]/90 text-white rounded-md px-4 py-2 text-xs sm:text-sm font-medium"
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


      <Suspense fallback={null}>
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
        title={bulkDeleteTicketIds.length === 1 ? "Delete Ticket" : "Delete Multiple Tickets"}
        description={bulkDeleteTicketIds.length === 1 
          ? `Do you want to delete this ticket?`
          : `Do you want to delete ${bulkDeleteTicketIds.length} tickets?`
        }
        itemName={bulkDeleteTicketIds.length === 1 
          ? (() => {
              const ticket = tickets.find(t => t.id === bulkDeleteTicketIds[0])
              return ticket ? ticket.title : undefined
            })()
          : undefined
        }
        requireCheckbox={true}
        checkboxLabel="I understand this action cannot be undone"
        isDeleting={isBulkDeleting}
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
