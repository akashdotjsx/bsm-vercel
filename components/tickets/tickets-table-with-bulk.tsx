"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  MoreHorizontal,
  Edit,
  Copy,
  Trash2,
  Plus,
  ArrowUpDown,
  RefreshCw,
  MessageSquare,
  Tag,
  Maximize2,
  Download,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MultiAssigneeAvatars } from "@/components/tickets/multi-assignee-avatars"
import { CustomColumnCell } from "@/components/tickets/custom-column-cell"
import { useCustomColumnsGraphQL } from "@/hooks/queries/use-custom-columns-graphql"
import { useAuth } from "@/lib/contexts/auth-context"
import { format } from "date-fns"
import { useUsers } from "@/hooks/use-users"
import { useUpdateTicketDetailsGraphQL } from "@/hooks/queries/use-ticket-details-graphql"
import { useToast } from "@/hooks/use-toast"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

interface TicketsTableProps {
  tickets: any[]
  loading?: boolean
  error?: string | null
  groupBy?: string
  groupedTickets?: Record<string, any[]>
  onTicketClick?: (ticket: any) => void
  onEditTicket?: (ticket: any) => void
  onDuplicateTicket?: (ticket: any) => void
  onDeleteTicket?: (ticket: any) => void
  onUpdateTicket?: (ticketId: string, updates: any) => Promise<void>
  onOpenCustomColumns?: () => void
  onBulkDelete?: (ticketIds: string[]) => Promise<void>
  onBulkUpdate?: (ticketIds: string[], updates: any) => Promise<void>
  customColumnsButtonRef?: React.RefObject<HTMLButtonElement>
}

export function TicketsTable({
  tickets,
  loading = false,
  error = null,
  groupBy = "none",
  groupedTickets = {},
  onTicketClick,
  onEditTicket,
  onDuplicateTicket,
  onDeleteTicket,
  onUpdateTicket,
  onOpenCustomColumns,
  onBulkDelete,
  onBulkUpdate,
  customColumnsButtonRef,
}: TicketsTableProps) {
  const { organizationId } = useAuth()
  const { columns: customColumns } = useCustomColumnsGraphQL(organizationId || '')
  const { users } = useUsers()
  const { toast } = useToast()
  const [updatingTickets, setUpdatingTickets] = useState<Set<string>>(new Set())
  const updateTicketMutation = useUpdateTicketDetailsGraphQL()
  const { user } = useAuth()
  
  // Filter custom columns to only show visible ones
  const visibleCustomColumns = customColumns.filter(column => column.visible !== false)
  
  // Bulk selection state
  const [selectedTickets, setSelectedTickets] = useState<string[]>([])
  const [isAllSelected, setIsAllSelected] = useState(false)
  
  // Reset selection when tickets change
  useEffect(() => {
    setSelectedTickets([])
    setIsAllSelected(false)
  }, [tickets])
  
  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    console.log('Select all:', checked)
    if (checked) {
      const allTicketIds = tickets.map(ticket => ticket.dbId || ticket.id)
      setSelectedTickets(allTicketIds)
      setIsAllSelected(true)
      console.log('Selected all tickets:', allTicketIds)
    } else {
      setSelectedTickets([])
      setIsAllSelected(false)
      console.log('Deselected all tickets')
    }
  }
  
  // Handle individual ticket selection
  const handleSelectTicket = (ticketId: string, checked: boolean) => {
    console.log('Selecting ticket:', ticketId, 'checked:', checked)
    if (checked) {
      const newSelected = [...selectedTickets, ticketId]
      setSelectedTickets(newSelected)
      setIsAllSelected(newSelected.length === tickets.length)
      console.log('Selected tickets:', newSelected)
    } else {
      const newSelected = selectedTickets.filter(id => id !== ticketId)
      setSelectedTickets(newSelected)
      setIsAllSelected(false)
      console.log('Selected tickets:', newSelected)
    }
  }
  
  // Check if a ticket is selected
  const isTicketSelected = (ticketId: string) => {
    return selectedTickets.includes(ticketId)
  }
  
  // Bulk action handlers
  const handleBulkDelete = async () => {
    if (selectedTickets.length === 0 || !onBulkDelete) return
    
    // Call parent handler which will show proper confirmation dialog
    await onBulkDelete(selectedTickets)
    // Clear selection after delete
    setSelectedTickets([])
    setIsAllSelected(false)
  }
  
  const handleBulkRefresh = () => {
    // Implement refresh logic
    console.log('Refresh selected tickets:', selectedTickets)
  }
  
  const handleBulkComment = () => {
    console.log('Add comment to selected tickets:', selectedTickets)
  }
  
  const handleBulkTag = () => {
    console.log('Add tag to selected tickets:', selectedTickets)
  }
  
  const handleBulkDownload = () => {
    console.log('Download selected tickets:', selectedTickets)
  }

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-[#6E72FF]/10 text-[#6E72FF]"
      case "in_progress":
        return "bg-yellow-100 text-yellow-800"
      case "review":
        return "bg-purple-100 text-purple-800"
      case "pending":
        return "bg-gray-100 text-gray-800"
      case "open":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "new":
        return "New"
      case "in_progress":
        return "In Progress"
      case "review":
        return "Review"
      case "pending":
        return "Pending"
      case "open":
        return "Open"
      default:
        return status
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
      case "critical":
        return "bg-red-100 text-red-800"
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-orange-100 text-orange-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTypeColor = (type: string) => {
    return "bg-amber-100 text-amber-800"
  }

  // Status update handler
  const handleStatusUpdate = async (ticketId: string, newStatus: string) => {
    try {
      console.log('🔍 Bulk Status Update Debug:', {
        ticketId,
        newStatus,
        ticketIdType: typeof ticketId,
        isUUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ticketId)
      })
      setUpdatingTickets(prev => new Set(prev).add(ticketId))
      
      console.log('🔍 About to call updateTicketMutation with:', { ticketId, status: newStatus })
      await updateTicketMutation.mutateAsync({ 
        id: ticketId, 
        updates: { status: newStatus }, 
        actorId: user?.id 
      })
      console.log('🔍 updateTicketMutation completed successfully')
      
      // Call the parent update handler if provided
      if (onUpdateTicket) {
        await onUpdateTicket(ticketId, { status: newStatus })
      }
      
      toast({
        title: "Status updated",
        description: `Ticket status changed to ${getStatusText(newStatus)}`,
      })
    } catch (error) {
      console.error('Error updating ticket status:', error)
      toast({
        title: "Error updating status",
        description: "Failed to update ticket status. Please try again.",
        variant: "destructive"
      })
    } finally {
      setUpdatingTickets(prev => {
        const newSet = new Set(prev)
        newSet.delete(ticketId)
        return newSet
      })
    }
  }

  // Assignee update handler
  const handleAssigneeUpdate = async (ticketId: string, newAssigneeIds: string[]) => {
    try {
      console.log('🔍 Bulk Assignee Update Debug:', {
        ticketId,
        newAssigneeIds,
        ticketIdType: typeof ticketId,
        isUUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ticketId)
      })
      setUpdatingTickets(prev => new Set(prev).add(ticketId))
      
      const updateData: any = {
        assignee_ids: newAssigneeIds
      }
      
      // Set the first assignee as the primary assignee for backward compatibility
      if (newAssigneeIds.length > 0) {
        updateData.assignee_id = newAssigneeIds[0]
      } else {
        updateData.assignee_id = null
      }
      
      await updateTicketMutation.mutateAsync({ 
        id: ticketId, 
        updates: updateData, 
        actorId: user?.id 
      })
      
      // Call the parent update handler if provided
      if (onUpdateTicket) {
        await onUpdateTicket(ticketId, updateData)
      }
      
      toast({
        title: "Assignee updated",
        description: `Ticket assignees updated successfully`,
      })
    } catch (error) {
      console.error('Error updating ticket assignees:', error)
      toast({
        title: "Error updating assignees",
        description: "Failed to update ticket assignees. Please try again.",
        variant: "destructive"
      })
    } finally {
      setUpdatingTickets(prev => {
        const newSet = new Set(prev)
        newSet.delete(ticketId)
        return newSet
      })
    }
  }

         // Loading skeleton
         if (loading) {
           return (
             <div className="h-full flex flex-col w-full max-w-full overflow-hidden">
               <div className="bg-background border border-border rounded-lg overflow-hidden flex-1 flex flex-col w-full max-w-full">
                 <div className="overflow-auto flex-1 w-full max-w-full">
                   <table className="w-full border-collapse min-w-[1200px]">
             <thead>
               <tr className="bg-muted/50 border-b border-border">
                         <th className="px-6 py-4 text-center w-12">
                           <div className="h-4 w-4 bg-muted animate-pulse rounded mx-auto border border-[#C4C4C4]" />
                         </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-foreground whitespace-nowrap w-24" style={{ fontSize: '12px', fontWeight: 600 }}>
                  Ticket
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-foreground whitespace-nowrap w-48" style={{ fontSize: '12px', fontWeight: 600 }}>
                  Title
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-foreground whitespace-nowrap w-24" style={{ fontSize: '12px', fontWeight: 600 }}>
                  Status
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-foreground whitespace-nowrap w-28" style={{ fontSize: '12px', fontWeight: 600 }}>
                  Reported By
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-foreground whitespace-nowrap w-24" style={{ fontSize: '12px', fontWeight: 600 }}>
                  Assignee
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-foreground whitespace-nowrap w-32" style={{ fontSize: '12px', fontWeight: 600 }}>
                  Reported Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-foreground whitespace-nowrap w-24" style={{ fontSize: '12px', fontWeight: 600 }}>
                  Due Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-foreground whitespace-nowrap w-20" style={{ fontSize: '12px', fontWeight: 600 }}>
                  Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-foreground whitespace-nowrap w-20" style={{ fontSize: '12px', fontWeight: 600 }}>
                  Priority
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-foreground whitespace-nowrap w-32" style={{ fontSize: '12px', fontWeight: 600 }}>
                  Notes
                </th>
                {visibleCustomColumns.map((column) => (
                  <th
                    key={column.id}
                    className="px-6 py-4 text-left text-xs font-semibold text-foreground whitespace-nowrap w-32"
                  >
                    {column.title}
                  </th>
                ))}
                <th className="px-6 py-4 text-center">
                  <Button
                    ref={customColumnsButtonRef}
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={onOpenCustomColumns}
                    title="Manage custom columns"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </th>
              </tr>
            </thead>
             <tbody className="divide-y divide-border">
               {Array.from({ length: 8 }).map((_, index) => (
                 <tr key={`skeleton-${index}`} className="hover:bg-muted/50">
                           <td className="px-6 py-4 text-center">
                             <div className="h-4 w-4 bg-muted animate-pulse rounded mx-auto border border-[#C4C4C4]" />
                           </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-muted dark:bg-muted animate-pulse rounded w-16" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-muted dark:bg-muted animate-pulse rounded w-3/4" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-5 bg-muted dark:bg-muted animate-pulse rounded-full w-16" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-6 w-6 bg-muted dark:bg-muted animate-pulse rounded-full" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-6 w-6 bg-muted dark:bg-muted animate-pulse rounded-full" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-3 bg-muted dark:bg-muted animate-pulse rounded w-20" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-3 bg-muted dark:bg-muted animate-pulse rounded w-20" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-5 bg-muted dark:bg-muted animate-pulse rounded-full w-14" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-5 bg-muted dark:bg-muted animate-pulse rounded-full w-12" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-muted dark:bg-muted animate-pulse rounded w-24" />
                  </td>
                  <td className="px-6 py-4"></td>
                  <td className="px-6 py-4">
                    <div className="h-6 w-6 bg-muted dark:bg-muted animate-pulse rounded" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
                </div>
              </div>
            </div>
          )
        }

   // Error state
   if (error) {
     return (
       <div className="h-full flex flex-col w-full max-w-full overflow-hidden">
         <div className="bg-background border border-border rounded-lg overflow-hidden flex-1 flex flex-col w-full max-w-full">
           <div className="flex-1 flex items-center justify-center">
             <div className="text-destructive">Error loading tickets: {error}</div>
           </div>
         </div>
       </div>
     )
   }

   // Empty state
   if (!tickets || tickets.length === 0) {
     return (
       <div className="h-full flex flex-col w-full max-w-full overflow-hidden">
         <div className="bg-background border border-border rounded-lg overflow-hidden flex-1 flex flex-col w-full max-w-full">
           <div className="flex-1 flex items-center justify-center">
             <div className="text-muted-foreground">No tickets found.</div>
           </div>
         </div>
       </div>
     )
   }

   // Main table
   return (
     <div className="relative h-full flex flex-col w-full max-w-full overflow-hidden">
       <div className="bg-background border border-border rounded-lg overflow-hidden flex-1 flex flex-col w-full max-w-full">
         <div className="overflow-auto flex-1 w-full max-w-full">
           <table className="w-full border-collapse min-w-[1200px]">
             <thead>
               <tr className="bg-muted/50 border-b border-border">
                       {/* Checkbox column */}
                       <th className="px-6 py-4 text-center w-12">
                         <Checkbox
                           checked={isAllSelected}
                           onCheckedChange={handleSelectAll}
                           className="w-4 h-4 border-[#C4C4C4] data-[state=checked]:bg-[#6E72FF] data-[state=checked]:border-[#6E72FF]"
                         />
                       </th>
                 <th className="px-6 py-4 text-left text-xs font-semibold text-foreground whitespace-nowrap w-24" style={{ fontSize: '12px', fontWeight: 600 }}>
                   Ticket
                 </th>
                 <th className="px-6 py-4 text-left text-xs font-semibold text-foreground whitespace-nowrap w-48" style={{ fontSize: '12px', fontWeight: 600 }}>
                   Title
                 </th>
                 <th className="px-6 py-4 text-left text-xs font-semibold text-foreground whitespace-nowrap w-24" style={{ fontSize: '12px', fontWeight: 600 }}>
                   Status
                 </th>
                 <th className="px-6 py-4 text-center text-xs font-semibold text-foreground whitespace-nowrap w-28" style={{ fontSize: '12px', fontWeight: 600 }}>
                   Reported By
                 </th>
                 <th className="px-6 py-4 text-center text-xs font-semibold text-foreground whitespace-nowrap w-24" style={{ fontSize: '12px', fontWeight: 600 }}>
                   Assignee
                 </th>
                 <th className="px-6 py-4 text-left text-xs font-semibold text-foreground whitespace-nowrap w-32" style={{ fontSize: '12px', fontWeight: 600 }}>
                   Reported Date
                 </th>
                 <th className="px-6 py-4 text-left text-xs font-semibold text-foreground whitespace-nowrap w-24" style={{ fontSize: '12px', fontWeight: 600 }}>
                   Due Date
                 </th>
                 <th className="px-6 py-4 text-left text-xs font-semibold text-foreground whitespace-nowrap w-20" style={{ fontSize: '12px', fontWeight: 600 }}>
                   Type
                 </th>
                 <th className="px-6 py-4 text-left text-xs font-semibold text-foreground whitespace-nowrap w-20" style={{ fontSize: '12px', fontWeight: 600 }}>
                   Priority
                 </th>
                 <th className="px-6 py-4 text-left text-xs font-semibold text-foreground whitespace-nowrap w-32" style={{ fontSize: '12px', fontWeight: 600 }}>
                   Notes
                 </th>
                {/* Custom columns headers */}
                {visibleCustomColumns.map((column) => (
                  <th
                    key={column.id}
                    className="px-6 py-4 text-left text-xs font-semibold text-foreground whitespace-nowrap w-32"
                    style={{ fontSize: '12px', fontWeight: 600 }}
                  >
                    {column.title}
                  </th>
                ))}
                {/* Add column button */}
                <th className="px-6 py-4 text-center">
                  <Button
                    ref={customColumnsButtonRef}
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={onOpenCustomColumns}
                    title="Manage custom columns"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </th>
                {/* Actions column - RIGHTMOST - Just icon, no text */}
                 <th className="px-6 py-4 text-center w-12">
                   <MoreHorizontal className="h-4 w-4 mx-auto text-foreground" />
                 </th>
              </tr>
            </thead>
             <tbody className="divide-y divide-border">
              {groupBy !== "none" ? (
                // Grouped view
                Object.entries(groupedTickets).map(([groupName, groupTickets]) => (
                  <>
                    <tr key={`group-${groupName}`} className="bg-muted/50 border-b border-border">
                      <td colSpan={10 + customColumns.length + 2} className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">{groupName}</span>
                          <span className="text-sm text-muted-foreground">
                            ({groupTickets.length} tickets)
                          </span>
                        </div>
                      </td>
                    </tr>
                    {groupTickets.map((ticket) => (
                      <TicketRow
                        key={ticket.id}
                        ticket={ticket}
                        customColumns={visibleCustomColumns}
                        isSelected={isTicketSelected(ticket.dbId || ticket.id)}
                        onSelectTicket={(checked: boolean) => handleSelectTicket(ticket.dbId || ticket.id, checked)}
                        onTicketClick={onTicketClick}
                        onEditTicket={onEditTicket}
                        onDuplicateTicket={onDuplicateTicket}
                        onDeleteTicket={onDeleteTicket}
                        onUpdateTicket={onUpdateTicket}
                        onStatusUpdate={handleStatusUpdate}
                        onAssigneeUpdate={handleAssigneeUpdate}
                        getStatusColor={getStatusColor}
                        getStatusText={getStatusText}
                        getPriorityColor={getPriorityColor}
                        getTypeColor={getTypeColor}
                        users={users}
                        updatingTickets={updatingTickets}
                      />
                    ))}
                  </>
                ))
              ) : (
                // Ungrouped view
                tickets.map((ticket) => (
                  <TicketRow
                    key={ticket.id}
                    ticket={ticket}
                    customColumns={visibleCustomColumns}
                    isSelected={isTicketSelected(ticket.dbId || ticket.id)}
                    onSelectTicket={(checked: boolean) => handleSelectTicket(ticket.dbId || ticket.id, checked)}
                    onTicketClick={onTicketClick}
                    onEditTicket={onEditTicket}
                    onDuplicateTicket={onDuplicateTicket}
                    onDeleteTicket={onDeleteTicket}
                    onUpdateTicket={onUpdateTicket}
                    onStatusUpdate={handleStatusUpdate}
                    onAssigneeUpdate={handleAssigneeUpdate}
                    getStatusColor={getStatusColor}
                    getStatusText={getStatusText}
                    getPriorityColor={getPriorityColor}
                    getTypeColor={getTypeColor}
                    users={users}
                    updatingTickets={updatingTickets}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
       {/* Bulk Action Toolbar - Fixed at bottom */}
       {selectedTickets.length > 0 && (
         <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50">
           <div className="bg-background border border-border rounded-lg shadow-lg px-4 py-3 flex items-center gap-4">
             <span className="text-sm font-medium text-foreground">
               {selectedTickets.length} Task{selectedTickets.length > 1 ? 's' : ''} selected
             </span>
            
            <div className="flex items-center gap-1 border-l border-border pl-4">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handleBulkRefresh}
                title="Sort"
              >
                <ArrowUpDown className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => onBulkUpdate && onBulkUpdate(selectedTickets, {})}
                title="Edit"
              >
                <Edit className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handleBulkRefresh}
                title="Refresh"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handleBulkComment}
                title="Comment"
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handleBulkTag}
                title="Tag"
              >
                <Tag className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleBulkDelete}
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                title="Add"
              >
                <Plus className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                title="Copy"
              >
                <Copy className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                title="Expand"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handleBulkDownload}
                title="Download"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Ticket row component
function TicketRow({
  ticket,
  customColumns,
  isSelected,
  onSelectTicket,
  onTicketClick,
  onEditTicket,
  onDuplicateTicket,
  onDeleteTicket,
  onUpdateTicket,
  onStatusUpdate,
  onAssigneeUpdate,
  getStatusColor,
  getStatusText,
  getPriorityColor,
  getTypeColor,
  users,
  updatingTickets,
}: any) {
  const [statusOpen, setStatusOpen] = useState(false)
  const [assigneeOpen, setAssigneeOpen] = useState(false)
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>(
    ticket.assignee_ids || (ticket.assignee_id ? [ticket.assignee_id] : [])
  )

  // Debug ticket object structure
  const actualTicketId = ticket.dbId || ticket.id
  console.log('🔍 Bulk TicketRow Debug:', {
    ticketId: ticket.id,
    dbId: ticket.dbId,
    actualTicketId,
    ticketNumber: ticket.ticket_number,
    title: ticket.title,
    status: ticket.status,
    assigneeIds: ticket.assignee_ids,
    assigneeId: ticket.assignee_id,
    isIdUUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(actualTicketId),
    allKeys: Object.keys(ticket),
    fullTicket: ticket
  })
   return (
     <tr className={`hover:bg-muted/50 last:border-b-0 ${
       isSelected ? 'bg-[#6E72FF]/5' : ''
     }`}>
             {/* Checkbox column */}
             <td className="px-6 py-4 text-center">
               <Checkbox
                 checked={isSelected}
                 onCheckedChange={onSelectTicket}
                 className="w-4 h-4 border-[#C4C4C4] data-[state=checked]:bg-[#6E72FF] data-[state=checked]:border-[#6E72FF]"
               />
             </td>
      
      {/* Ticket column */}
      <td className="px-6 py-4 text-foreground whitespace-nowrap" style={{ fontSize: '12px', fontWeight: 400 }}>
        <button 
          className="text-left hover:text-[#6E72FF] hover:underline cursor-pointer transition-colors"
          onClick={() => {
            if (onTicketClick) {
              onTicketClick(ticket)
            }
          }}
        >
          {ticket.ticket_number || ticket.id}
        </button>
      </td>

       {/* Title column */}
       <td className="px-6 py-4 text-foreground whitespace-nowrap max-w-xs truncate" title={ticket.title} style={{ fontSize: '12px', fontWeight: 400 }}>
         {ticket.title}
       </td>

      {/* Status */}
      <td className="px-6 py-4 whitespace-nowrap">
        <Select
          value={ticket.status}
          onValueChange={(value) => onStatusUpdate(ticket.dbId || ticket.id, value)}
          disabled={updatingTickets.has(ticket.dbId || ticket.id)}
        >
          <SelectTrigger className="w-auto h-auto p-0 border-0 bg-transparent hover:bg-muted/50 rounded-full">
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              ticket.status === 'new' ? 'bg-[#DDDEFF] text-[#6E72FF]' :
              ticket.status === 'waiting_on_you' ? 'bg-[#FFF8CB] text-[#BF6D0A]' :
              ticket.status === 'waiting_on_customer' ? 'bg-[#F6E3FF] text-[#8913BB]' :
              'bg-gray-100 text-gray-600'
            } cursor-pointer`}>
              {getStatusText(ticket.status)}
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="on_hold">On Hold</SelectItem>
          </SelectContent>
        </Select>
      </td>

      {/* Reported By */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center justify-center w-full">
          <div className="w-6 h-6 rounded-full bg-[#6E72FF] border border-[#6E72FF] flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-medium">
              {ticket.requester ? 
                ((ticket.requester.first_name?.[0] || "") + (ticket.requester.last_name?.[0] || "")) :
                ticket.reportedBy?.charAt(0) || '?'
              }
            </span>
          </div>
        </div>
      </td>

      {/* Assignee */}
      <td className="px-6 py-4 whitespace-nowrap">
        <Popover open={assigneeOpen} onOpenChange={setAssigneeOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              role="combobox"
              aria-expanded={assigneeOpen}
              className="w-auto h-auto p-0 hover:bg-muted/50"
              disabled={updatingTickets.has(ticket.dbId || ticket.id)}
            >
              <MultiAssigneeAvatars 
                assignees={ticket.assignees || []} 
                maxDisplay={3}
                size="sm"
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <Command>
              <CommandInput placeholder="Search users..." />
              <CommandList>
                <CommandEmpty>No users found.</CommandEmpty>
                <CommandGroup>
                  {users.map((user) => (
                    <CommandItem
                      key={user.id}
                      value={user.display_name || user.email}
                      onSelect={() => {
                        const isSelected = selectedAssigneeIds.includes(user.id)
                        let newAssigneeIds: string[]
                        
                        if (isSelected) {
                          newAssigneeIds = selectedAssigneeIds.filter(id => id !== user.id)
                        } else {
                          newAssigneeIds = [...selectedAssigneeIds, user.id]
                        }
                        
                        setSelectedAssigneeIds(newAssigneeIds)
                        onAssigneeUpdate(ticket.dbId || ticket.id, newAssigneeIds)
                        setAssigneeOpen(false)
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedAssigneeIds.includes(user.id) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex items-center space-x-2">
                        <div className="h-6 w-6 rounded-full bg-[#6E72FF] flex items-center justify-center text-white text-xs font-medium">
                          {(user.first_name?.[0] || "") + (user.last_name?.[0] || "")}
                        </div>
                        <div>
                          <div className="font-medium">{user.display_name || user.email}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </td>

       {/* Reported Date */}
       <td className="px-6 py-4 text-foreground whitespace-nowrap" style={{ fontSize: '12px', fontWeight: 400 }}>
         {ticket.created_at
           ? format(new Date(ticket.created_at), "MMM dd, yyyy")
           : ticket.reportedDate || "-"}
       </td>

       {/* Due Date */}
       <td className="px-6 py-4 text-foreground whitespace-nowrap" style={{ fontSize: '12px', fontWeight: 400 }}>
         {ticket.due_date
           ? format(new Date(ticket.due_date), "MMM dd, yyyy")
           : ticket.dueDate || "-"}
       </td>

      {/* Type */}
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-[#FFF9E7] text-[#CEA500]">
          {ticket.displayType || ticket.type}
        </span>
      </td>

      {/* Priority */}
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          ticket.priority === 'urgent' ? 'bg-[#FFEDE8] text-[#E67926]' :
          ticket.priority === 'high' ? 'bg-[#FFEDE8] text-[#E67926]' :
          ticket.priority === 'medium' ? 'bg-[#FFEDE8] text-[#E67926]' :
          'bg-[#FFEDE8] text-[#E67926]'
        }`}>
          {ticket.priority
            ? ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)
            : "Unknown"}
        </span>
      </td>

       {/* Notes */}
       <td className="px-6 py-4 text-foreground whitespace-nowrap max-w-xs truncate" title={ticket.custom_fields?.notes || ticket.notes || ticket.metadata?.notes || "Customer reported via email"} style={{ fontSize: '12px', fontWeight: 400 }}>
         {ticket.custom_fields?.notes || ticket.notes || ticket.metadata?.notes || "Customer reported via email"}
       </td>

      {/* Custom column cells */}
      {customColumns.map((column: any) => (
        <td key={column.id} className="px-6 py-4 whitespace-nowrap" style={{ fontSize: '12px', fontWeight: 400 }}>
          <CustomColumnCell column={column} ticketId={ticket.dbId || ticket.id} editable={false} />
        </td>
      ))}

      {/* Empty cell for the + button column */}
      <td className="px-6 py-4 whitespace-nowrap"></td>

      {/* Actions column - RIGHTMOST */}
      <td className="px-6 py-4 text-center whitespace-nowrap">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => {
                if (onEditTicket) {
                  onEditTicket(ticket)
                }
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Ticket
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                if (onDuplicateTicket) {
                  onDuplicateTicket(ticket)
                }
              }}
            >
              <Copy className="h-4 w-4 mr-2" />
              Duplicate Ticket
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => {
                if (onDeleteTicket) {
                  onDeleteTicket(ticket)
                }
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Ticket
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  )
}
