"use client"

import React from "react"
import type { FC } from "react"

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
  Cloud,
} from "lucide-react"
import { PlatformLayout } from "@/components/layout/platform-layout"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useStore } from "@/lib/store"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useTickets } from "@/hooks/use-tickets"
import { useTicketTypes } from "@/hooks/use-ticket-types"
import { format } from "date-fns"
import { parseImportFile, validateFile, ImportResult, ImportProgress } from "@/lib/utils/file-import"

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



export default function TicketsPage() {
  const { user } = useStore()
  
  // State for filters
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState("all")
  const [selectedPriority, setSelectedPriority] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  
  // Use real data from API
  // Memoize the params to prevent unnecessary re-renders
  const ticketsParams = useMemo(() => ({
    page: 1,
    limit: 50,
    status: selectedStatus === "all" ? undefined : selectedStatus,
    priority: selectedPriority === "all" ? undefined : selectedPriority,
    type: selectedType === "all" ? undefined : selectedType,
    search: searchTerm || undefined
  }), [selectedStatus, selectedPriority, selectedType, searchTerm])

  const {
    tickets, 
    loading, 
    error, 
    pagination, 
    refetch,
    createTicket,
    updateTicket
  } = useTickets(ticketsParams)

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

  // Check for new ticket creation notification
  useEffect(() => {
    const checkForNewTicket = () => {
      const newTicketData = localStorage.getItem('newTicketCreated')
      if (newTicketData) {
        try {
          const ticketInfo = JSON.parse(newTicketData)
          // Check if the ticket was created recently (within last 10 seconds)
          if (Date.now() - ticketInfo.timestamp < 10000) {
            toast.success(`Ticket #${ticketInfo.ticketNumber} created successfully!`, {
              description: `"${ticketInfo.title}"`,
              duration: 5000,
            })
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
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  
  // Filter dialog state
  const [showFilterDialog, setShowFilterDialog] = useState(false)
  const [activeFilters, setActiveFilters] = useState<{
    type: string[]
    priority: string[]
    status: string[]
    assignee: string[]
    dateRange: { from: string; to: string }
  }>({
    type: [],
    priority: [],
    status: [],
    assignee: [],
    dateRange: { from: '', to: '' }
  })

  // Transform API ticket data to match the expected format
  const transformedTickets = useMemo(() => {
    if (!tickets || tickets.length === 0) return []
    
    console.log('🔄 Transforming tickets:', tickets)
    
    return tickets.map((ticket) => {
      console.log('🎫 Processing ticket:', ticket.title)
      console.log('🎫 Requester data:', ticket.requester)
      console.log('🎫 Requester display_name:', ticket.requester?.display_name)
      console.log('🎫 Requester first_name:', ticket.requester?.first_name)
      console.log('🎫 Requester last_name:', ticket.requester?.last_name)
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
      assignee: ticket.assignee?.display_name ? {
        name: ticket.assignee.display_name,
        avatar: getAvatarInitials(ticket.assignee.first_name, ticket.assignee.last_name, ticket.assignee.display_name)
      } : null,
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

  const filteredTickets = useMemo(() => {
    // Use local tickets for Kanban view, transformed tickets for list view
    const baseTickets = currentView === "kanban" ? localTickets : (transformedTickets || [])
    
    // Apply client-side filtering for list view (API already handles some filtering)
    if (currentView === "list") {
      return baseTickets.filter(ticket => {
        // Search filter
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase()
          const matchesSearch = 
            ticket.title.toLowerCase().includes(searchLower) ||
            ticket.description.toLowerCase().includes(searchLower) ||
            ticket.id.toLowerCase().includes(searchLower) ||
            ticket.reportedBy.toLowerCase().includes(searchLower) ||
            (ticket.assignee?.name || '').toLowerCase().includes(searchLower)
          
          if (!matchesSearch) return false
        }
        
        // Type filter (from active filters)
        if (activeFilters.type.length > 0) {
          const ticketType = ticket.type?.toLowerCase() || ''
          if (!activeFilters.type.some(type => type.toLowerCase() === ticketType)) return false
        } else if (selectedType !== "all") {
          const ticketType = ticket.type?.toLowerCase() || ''
          const selectedTypeLower = selectedType.toLowerCase()
          if (ticketType !== selectedTypeLower) return false
        }
        
        // Priority filter (from active filters)
        if (activeFilters.priority.length > 0) {
          const ticketPriority = ticket.priority?.toLowerCase() || ''
          if (!activeFilters.priority.some(priority => priority.toLowerCase() === ticketPriority)) return false
        } else if (selectedPriority !== "all") {
          const ticketPriority = ticket.priority?.toLowerCase() || ''
          const selectedPriorityLower = selectedPriority.toLowerCase()
          if (ticketPriority !== selectedPriorityLower) return false
        }
        
        // Status filter (from active filters)
        if (activeFilters.status.length > 0) {
          const ticketStatus = ticket.status?.toLowerCase() || ''
          if (!activeFilters.status.some(status => status.toLowerCase() === ticketStatus)) return false
        } else if (selectedStatus !== "all") {
          const ticketStatus = ticket.status?.toLowerCase() || ''
          const selectedStatusLower = selectedStatus.toLowerCase()
          if (ticketStatus !== selectedStatusLower) return false
        }
        
        // Date range filter
        if (activeFilters.dateRange.from || activeFilters.dateRange.to) {
          const ticketDate = new Date(ticket.created_at || ticket.date)
          const fromDate = activeFilters.dateRange.from ? new Date(activeFilters.dateRange.from) : null
          const toDate = activeFilters.dateRange.to ? new Date(activeFilters.dateRange.to) : null
          
          if (fromDate && ticketDate < fromDate) return false
          if (toDate && ticketDate > toDate) return false
        }
        
        return true
      })
    }
    
    return baseTickets
  }, [localTickets, transformedTickets, currentView, searchTerm, selectedType, selectedPriority, selectedStatus, activeFilters])

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

  // Group tickets by the selected grouping option
  const groupedTickets = useMemo(() => {
    if (groupBy === "none") {
      return { "All Tickets": filteredTickets }
    }

    const groups: { [key: string]: any[] } = {}
    
    filteredTickets.forEach(ticket => {
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
• Total tickets: ${tickets?.length || 0}
• Open tickets: ${tickets?.filter((t) => t.status === "new").length || 0}
• High priority: ${tickets?.filter((t) => t.priority === "high" || t.priority === "urgent" || t.priority === "critical").length || 0}

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
          <Button 
            variant="outline" 
            size="sm" 
            className="h-9 text-sm bg-transparent"
            onClick={() => setShowFilterDialog(true)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filter
            {(activeFilters.type.length > 0 || activeFilters.priority.length > 0 || activeFilters.status.length > 0 || activeFilters.assignee.length > 0) && (
              <span className="ml-1 bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5">
                {activeFilters.type.length + activeFilters.priority.length + activeFilters.status.length + activeFilters.assignee.length}
              </span>
            )}
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

         <div className="bg-card border border-border rounded-lg overflow-hidden">
           <div className="overflow-x-auto">
             <table className="w-full border-collapse">
               <thead>
                 <tr className="bg-muted/50 border-b border-border">
                   <th className="px-3 py-2 text-left text-[10px] font-medium text-muted-foreground uppercase tracking-wider border-r border-border">Ticket</th>
                   <th className="px-3 py-2 text-left text-[10px] font-medium text-muted-foreground uppercase tracking-wider border-r border-border">Status</th>
                   <th className="px-3 py-2 text-left text-[10px] font-medium text-muted-foreground uppercase tracking-wider border-r border-border">Reported By</th>
                   <th className="px-3 py-2 text-left text-[10px] font-medium text-muted-foreground uppercase tracking-wider border-r border-border">Assignee</th>
                   <th className="px-3 py-2 text-left text-[10px] font-medium text-muted-foreground uppercase tracking-wider border-r border-border">Reported Date</th>
                   <th className="px-3 py-2 text-left text-[10px] font-medium text-muted-foreground uppercase tracking-wider border-r border-border">Due Date</th>
                   <th className="px-3 py-2 text-left text-[10px] font-medium text-muted-foreground uppercase tracking-wider border-r border-border">Type</th>
                   <th className="px-3 py-2 text-left text-[10px] font-medium text-muted-foreground uppercase tracking-wider border-r border-border">Priority</th>
                   <th className="px-3 py-2 text-left text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Notes</th>
                 </tr>
               </thead>
               <tbody className="bg-card">
                {(() => {
                  console.log('⚙️ Rendering tickets table with:', { 
                    currentLoading: loading, 
                    currentTicketsCount: tickets?.length || 0,
                    hasTickets: !!tickets,
                    shouldShowLoading: loading || !tickets
                  });
                  return loading || !tickets;
                })() ? (
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
                  Object.entries(groupedTickets).map(([groupName, groupTickets]) => (
                    <React.Fragment key={groupName}>
                       {groupBy !== "none" && (
                         <tr className="bg-muted/30 border-b border-border">
                           <td colSpan={9} className="px-4 py-3">
                             <div className="flex items-center gap-2">
                               <span className="font-semibold text-foreground">{groupName}</span>
                               <span className="text-sm text-muted-foreground">({groupTickets.length} tickets)</span>
                             </div>
                           </td>
                         </tr>
                       )}
                       {groupTickets.map((ticket, index) => (
                   <tr
                     key={ticket.id}
                           className="bg-card border-b border-border hover:bg-muted/50 last:border-b-0"
                   >
                    <td className="px-3 py-2.5 whitespace-nowrap border-r border-border">
                      <div>
                        <div className="text-[11px] font-medium text-foreground">{ticket.title}</div>
                        <div className="text-[10px] text-muted-foreground">{ticket.id}</div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap border-r border-border">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-medium
                        ticket.status === "new" 
                          ? "bg-blue-100 text-blue-800"
                          : ticket.status === "in_progress"
                            ? "bg-yellow-100 text-yellow-800"
                            : ticket.status === "review"
                              ? "bg-purple-100 text-purple-800"
                              : ticket.status === "pending"
                                ? "bg-gray-100 text-gray-800"
                                : ticket.status === "open"
                                  ? "bg-gray-100 text-gray-800"
                                  : "bg-gray-100 text-gray-800"
                      }`}>
                        {ticket.status === "new" ? "New" : 
                         ticket.status === "in_progress" ? "In Progress" :
                         ticket.status === "review" ? "Review" :
                         ticket.status === "pending" ? "Pending" :
                         ticket.status === "open" ? "Open" :
                         ticket.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap border-r border-border">
                      <div className="flex items-center">
                        <div
                          className={`h-6 w-6 rounded-full ${ticket.companyColor} flex items-center justify-center text-white text-[9px] font-medium`}
                          title={ticket.reportedBy}
                        >
                          {ticket.reportedByAvatar}
                        </div>
                      </div>
                    </td>
 <td className="px-3 py-2.5 whitespace-nowrap border-r border-border">
                       <div className="flex items-center">
                         {ticket.assignee ? (
                           <div
                             className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-[9px] font-medium"
                             title={ticket.assignee.name}
                           >
                             {ticket.assignee.avatar}
                           </div>
                         ) : (
                           <div
                             className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-[9px] font-medium"
                             title="Unassigned"
                           >
                             ?
                           </div>
                         )}
                       </div>
                     </td>
 <td className="px-3 py-2.5 whitespace-nowrap border-r border-border">
                       <span className="text-[11px] text-foreground">{ticket.reportedDate}</span>
                     </td>
 <td className="px-3 py-2.5 whitespace-nowrap border-r border-border">
                       <span className="text-[11px] text-foreground">{ticket.dueDate}</span>
                     </td>
 <td className="px-3 py-2.5 whitespace-nowrap border-r border-border">
  <span className="text-[10px] px-2 py-1 rounded-full bg-amber-100 text-amber-800">
                         {ticket.displayType}
                       </span>
                     </td>
 <td className="px-3 py-2.5 whitespace-nowrap border-r border-border">
                      <span
                        className={`text-[10px] px-2 py-1 rounded-full
                          ticket.priority === "urgent"
                            ? "bg-red-100 text-red-800"
                            : ticket.priority === "high"
                              ? "bg-red-100 text-red-800"
                              : ticket.priority === "medium"
                                ? "bg-orange-100 text-orange-800"
                                : ticket.priority === "low"
                                  ? "bg-green-100 text-green-800"
                                  : ticket.priority === "critical"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {ticket.priority ? ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1) : "Unknown"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <div className="flex items-center justify-between">
                        <Input
                          placeholder="Add notes..."
                          className="h-6 text-[10px] border-0 bg-transparent focus:bg-background text-muted-foreground flex-1"
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
                      ))}
                    </React.Fragment>
                ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    ),
    [groupedTickets, groupBy, showCustomColumns, searchTerm, handleTicketClick],
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
      default: // type - use hardcoded ticket types to ensure consistency
        return [
          { id: "incident", title: "Incident", count: 0, color: "border-t-red-400" },
          { id: "request", title: "Request", count: 0, color: "border-t-blue-400" },
          { id: "problem", title: "Problem", count: 0, color: "border-t-orange-400" },
          { id: "change", title: "Change", count: 0, color: "border-t-green-400" },
          { id: "general_query", title: "General Query", count: 0, color: "border-t-purple-400" },
        ]
    }
  }, [kanbanGroupBy])

  const getTicketsByGroup = useCallback(
    (groupValue: string) => {
      console.log('🎯 getTicketsByGroup called with groupValue:', groupValue, 'kanbanGroupBy:', kanbanGroupBy)
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
                className="pl-10 h-9 w-48 border-0 bg-muted/50 text-13"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>

            <Select
              value={kanbanGroupBy}
              onValueChange={(value: "type" | "status" | "priority" | "category") => setKanbanGroupBy(value)}
            >
<SelectTrigger className="w-48 h-9 text-13">
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
<SelectTrigger className="w-32 h-9 text-13">
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

<Button variant="outline" size="sm" className="h-9 text-13 bg-transparent font-sans">
              Date Range
            </Button>

            <Select value={selectedPriority} onValueChange={setSelectedPriority}>
<SelectTrigger className="w-40 h-9 text-13">
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

<Button variant="outline" size="sm" className="h-9 text-13 bg-transparent font-sans">
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
<h3 className="font-medium text-13 mb-2 leading-tight font-sans text-foreground">
                    {column.title} <span className="text-muted-foreground">{getTicketsByGroup(column.id).length}</span>
                  </h3>
                  {dragOverColumn === column.id && draggedTicket && (
                    <div className="text-xs text-blue-600 font-medium">Drop ticket here</div>
                  )}
                </div>
              </div>

              <div className="space-y-3 px-4">
                {(() => {
                  const ticketsInGroup = getTicketsByGroup(column.id)
                  console.log(`🎯 Column ${column.title} (${column.id}) has ${ticketsInGroup.length} tickets:`, ticketsInGroup.map(t => ({ id: t.id, title: t.title, type: t.type })))
                  return ticketsInGroup
                })().map((ticket) => (
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
    <PlatformLayout>
      <div className="flex gap-6 font-sans text-[13px]">
        <div className="flex-1 space-y-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
               <div className="flex items-center gap-2">
                 <h1 className="text-lg font-semibold tracking-tight font-sans text-foreground">
                   All Tickets
                 </h1>
                 <span className="bg-muted text-muted-foreground px-2 py-1 rounded-full text-[10px] font-medium">
                   {tickets?.length || 0}
                 </span>
               </div>
               <p className="text-muted-foreground text-[12px] font-sans">
                 Manage all support tickets and track customer issues effortlessly.
               </p>
            </div>

            <div className="flex items-center gap-3">
<Button
className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] text-[11px] h-8 px-4 rounded-lg shadow-xs"
                onClick={() => setShowAIChat(true)}
              >
                <Sparkles className="h-3 w-3 mr-2" />
                Ask AI
              </Button>
<Button
                variant="outline"
className="bg-background text-[var(--primary)] border-[var(--primary)] hover:bg-[var(--menu-hover)] text-[11px] h-8 px-4 rounded-lg"
                onClick={() => setShowImportDialog(true)}
              >
                <Cloud className="h-3 w-3 mr-2" />
                Import
              </Button>
<Button 
className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] text-[11px] h-8 px-4 rounded-lg shadow-xs"
                onClick={() => window.location.href = '/tickets/create'} 
              >
                + Create Ticket
              </Button>
            </div>
          </div>

           <div className="space-y-4">
             <div className="flex items-center justify-between border-b border-border">
               <div className="flex items-center gap-0">
                 <button
                   onClick={() => setCurrentView("list")}
                   className={`px-3 py-2 text-[11px] font-medium border-b-2 transition-colors ${
                     currentView === "list"
                       ? "text-blue-600 border-blue-600 dark:text-blue-400 dark:border-blue-400"
                       : "text-muted-foreground border-transparent hover:text-foreground"
                   }`}
                 >
                   List
                 </button>
                 <button
                   onClick={() => setCurrentView("kanban")}
                   className={`px-3 py-2 text-[11px] font-medium border-b-2 transition-colors ${
                     currentView === "kanban"
                       ? "text-blue-600 border-blue-600 dark:text-blue-400 dark:border-blue-400"
                       : "text-muted-foreground border-transparent hover:text-foreground"
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
<span className="font-sans text-base">Ask AI about Tickets</span>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
<Cloud className="h-5 w-5 text-[var(--primary)]" />
              Import Tickets
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* File Selection */}
            {!importProgress && !importResult && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Select file to import</label>
              <Input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="cursor-pointer"
                    disabled={isImporting}
              />
              <p className="text-xs text-muted-foreground mt-1">Supported formats: CSV, Excel (.xlsx, .xls)</p>
            </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">Import Requirements:</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• <strong>Required columns:</strong> Title, Priority, Type</li>
                    <li>• <strong>Optional columns:</strong> Description, Assignee, Due Date, Status</li>
                    <li>• <strong>Priority values:</strong> low, medium, high, urgent, critical</li>
                    <li>• <strong>Type values:</strong> incident, request, problem, change, general_query</li>
                    <li>• <strong>Status values:</strong> new, open, in_progress, pending, resolved, closed</li>
                    <li>• <strong>Maximum file size:</strong> 10MB</li>
                    <li>• <strong>Supported formats:</strong> CSV, Excel (.xlsx, .xls)</li>
              </ul>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                Cancel
              </Button>
                  <Button 
                    onClick={handleImportTickets} 
                    disabled={!importFile || isImporting}
                    className="bg-[#6a5cff] hover:bg-[#5b4cf2] text-white"
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
                  <span className="text-sm font-medium">{importProgress.message}</span>
                  <span className="text-sm text-muted-foreground">
                    {importProgress.current}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      importProgress.status === 'error' ? 'bg-red-500' : 
                      importProgress.status === 'completed' ? 'bg-green-500' : 'bg-[#6a5cff]'
                    }`}
                    style={{ width: `${importProgress.current}%` }}
                  />
                </div>
                {importProgress.status === 'parsing' && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#6a5cff]"></div>
                    Parsing file...
                  </div>
                )}
                {importProgress.status === 'importing' && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#6a5cff]"></div>
                    Creating tickets...
                  </div>
                )}
              </div>
            )}

            {/* Results */}
            {importResult && (
              <div className="space-y-4">
                <div className={`p-4 rounded-lg ${
                  importResult.success ? 'bg-green-50 dark:bg-green-950/20' : 'bg-red-50 dark:bg-red-950/20'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`h-2 w-2 rounded-full ${
                      importResult.success ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <h4 className={`font-medium text-sm ${
                      importResult.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
                    }`}>
                      {importResult.success ? 'Import Successful!' : 'Import Completed with Errors'}
                    </h4>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>• Total rows processed: {importResult.totalRows}</p>
                    <p>• Valid tickets found: {importResult.validRows}</p>
                    <p>• Successfully imported: {importResult.successfullyImportedCount}</p>
                    <p>• Failed to import: {importResult.failedImportCount}</p>
                  </div>
                </div>

                {importResult.errors.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-red-800 dark:text-red-200">Errors:</h5>
                    <div className="max-h-32 overflow-y-auto bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">
                      <ul className="text-xs text-red-700 dark:text-red-300 space-y-1">
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

                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      resetImportState()
                      setShowImportDialog(false)
                    }}
                  >
                    Close
                  </Button>
                  {importResult.validRows > 0 && (
                    <Button 
                      onClick={() => {
                        resetImportState()
                        setShowImportDialog(false)
                      }}
                      className="bg-[#6a5cff] hover:bg-[#5b4cf2] text-white"
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

      {/* Filter Dialog */}
      <Dialog open={showFilterDialog} onOpenChange={setShowFilterDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Filter Tickets</DialogTitle>
          </DialogHeader>
           <div className="space-y-6">
             {/* Type Filter */}
             <div>
               <label className="text-sm font-medium text-foreground mb-2 block">Type</label>
              <div className="flex flex-wrap gap-2">
                {['incident', 'request', 'problem', 'change', 'general_query'].map((type) => (
                  <Button
                    key={type}
                    variant={activeFilters.type.includes(type) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setActiveFilters(prev => ({
                        ...prev,
                        type: prev.type.includes(type) 
                          ? prev.type.filter(t => t !== type)
                          : [...prev.type, type]
                      }))
                    }}
                    className="text-xs"
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}
                  </Button>
                ))}
              </div>
            </div>

             {/* Priority Filter */}
             <div>
               <label className="text-sm font-medium text-foreground mb-2 block">Priority</label>
              <div className="flex flex-wrap gap-2">
                {['low', 'medium', 'high', 'critical', 'urgent'].map((priority) => (
                  <Button
                    key={priority}
                    variant={activeFilters.priority.includes(priority) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setActiveFilters(prev => ({
                        ...prev,
                        priority: prev.priority.includes(priority) 
                          ? prev.priority.filter(p => p !== priority)
                          : [...prev.priority, priority]
                      }))
                    }}
                    className="text-xs"
                  >
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

             {/* Status Filter */}
             <div>
               <label className="text-sm font-medium text-foreground mb-2 block">Status</label>
              <div className="flex flex-wrap gap-2">
                {['new', 'in_progress', 'pending', 'resolved', 'closed'].map((status) => (
                  <Button
                    key={status}
                    variant={activeFilters.status.includes(status) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setActiveFilters(prev => ({
                        ...prev,
                        status: prev.status.includes(status) 
                          ? prev.status.filter(s => s !== status)
                          : [...prev.status, status]
                      }))
                    }}
                    className="text-xs"
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                  </Button>
                ))}
              </div>
            </div>

             {/* Date Range Filter */}
             <div>
               <label className="text-sm font-medium text-foreground mb-2 block">Date Range</label>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="text-xs text-muted-foreground mb-1 block">From</label>
                  <Input
                    type="date"
                    value={activeFilters.dateRange.from}
                    onChange={(e) => setActiveFilters(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, from: e.target.value }
                    }))}
                    className="text-sm"
                  />
                </div>
                 <div>
                   <label className="text-xs text-muted-foreground mb-1 block">To</label>
                  <Input
                    type="date"
                    value={activeFilters.dateRange.to}
                    onChange={(e) => setActiveFilters(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, to: e.target.value }
                    }))}
                    className="text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => {
                setActiveFilters({
                  type: [],
                  priority: [],
                  status: [],
                  assignee: [],
                  dateRange: { from: '', to: '' }
                })
              }}
            >
              Clear All
            </Button>
            <Button 
              onClick={() => setShowFilterDialog(false)}
              className="bg-[#6a5cff] hover:bg-[#5b4cf2] text-white"
            >
              Apply Filters
            </Button>
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
