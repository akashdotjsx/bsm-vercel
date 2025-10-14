"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { 
  useTicketDetailsGraphQL,
  useUpdateTicketDetailsGraphQL,
  useAddCommentGraphQL,
  useAddChecklistItemGraphQL,
  useUpdateChecklistItemGraphQL,
  useDeleteChecklistItemGraphQL
} from "@/hooks/queries/use-ticket-details-graphql"
import { useCreateTicketGraphQL } from "@/hooks/queries/use-tickets-graphql-query"
import { useAuth } from "@/lib/contexts/auth-context"
import { useServiceCategories } from "@/lib/hooks/use-service-categories"
import { useUsers } from "@/hooks/use-users"
import { TeamSelector } from "@/components/users/team-selector"
import { DateTimePicker } from "@/components/ui/date-time-picker"
import { format } from "date-fns"
import { toast } from "@/lib/toast"
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog"
import { createGraphQLClient } from "@/lib/graphql/client"
import { gql } from "graphql-request"
import { 
  X, 
  Save, 
  Edit,
  User, 
  MessageSquare, 
  Paperclip, 
  Plus, 
  CheckSquare, 
  Square, 
  Trash2, 
  Send, 
  Upload, 
  FileText, 
  Users, 
  Calendar,
  History
} from "lucide-react"

interface TicketDrawerProps {
  isOpen: boolean
  onClose: () => void
  ticket?: any // expects at least { dbId: string }
}

export default function TicketDrawer({ isOpen, onClose, ticket }: TicketDrawerProps) {
  const ticketId = ticket?.dbId || ""
  const isCreateMode = !ticketId // CREATE mode when no ticket ID
  
  // Auth context for organization and user
  const { user, organization } = useAuth()
  
  // GraphQL hooks - Single query fetches everything!
  const { data: dbTicket, isLoading: loading, error, refetch: refetchTicket } = useTicketDetailsGraphQL(ticketId)
  const createTicketMutation = useCreateTicketGraphQL()
  const updateTicketMutation = useUpdateTicketDetailsGraphQL()
  const addCommentMutation = useAddCommentGraphQL(ticketId)
  const addChecklistItemMutation = useAddChecklistItemGraphQL(ticketId)
  const updateChecklistItemMutation = useUpdateChecklistItemGraphQL(ticketId)
  const deleteChecklistItemMutation = useDeleteChecklistItemGraphQL(ticketId)
  
  const { categories: supabaseCategories } = useServiceCategories()
  const { users, teams } = useUsers()
  
  // Extract nested data from ticket
  const comments = dbTicket?.comments || []
  const attachments = dbTicket?.attachments || []
  const checklist = dbTicket?.checklist || []

  // Prevent background scroll when drawer is open
  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isOpen])

  // Edit mode toggle - for existing tickets, start in view mode
  const [isEditMode, setIsEditMode] = useState(isCreateMode)
  const [saving, setSaving] = useState(false)
  
  // State for comments
  const [newComment, setNewComment] = useState("")
  const [isInternalComment, setIsInternalComment] = useState(false)
  
  // State for checklist
  const [newChecklistItem, setNewChecklistItem] = useState("")
  // Staged checklist items for create mode
  const [draftChecklist, setDraftChecklist] = useState<string[]>([])
  
  // State for delete confirmation
  const [showDeleteChecklistDialog, setShowDeleteChecklistDialog] = useState(false)
  const [checklistItemToDelete, setChecklistItemToDelete] = useState<string | null>(null)

  // Local editable form
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "request",
    priority: "medium",
    status: "new",
    impact: "medium",
    urgency: "medium",
    category: "",
    subcategory: "",
    assignee_ids: [] as string[], // Changed to array to support teams
    due_date: "",
    tags: [] as string[],
  })
  const selectedCategory = supabaseCategories.find((c) => c.id === form.category)
  const availableServices = selectedCategory?.services || []

  // Initialize form for CREATE mode or populate from existing ticket
  useEffect(() => {
    if (isCreateMode) {
      // CREATE mode - set defaults and enable edit mode
      setIsEditMode(true)
      setForm({
        title: "",
        description: "",
        type: "request",
        priority: "medium",
        status: "new",
        impact: "medium",
        urgency: "medium",
        category: "",
        subcategory: "",
        assignee_ids: [],
        due_date: "",
        tags: [],
      })
      // Clear comment/checklist state for new tickets
      setNewComment("")
      setDraftChecklist([])
      setIsInternalComment(false)
    } else if (dbTicket) {
      // EDIT mode - start in view mode for existing tickets
      setIsEditMode(false)
      // EDIT mode - populate from ticket
      const assigneeIds = dbTicket.assignee_ids || (dbTicket.assignee_id ? [dbTicket.assignee_id] : [])
      setForm({
        title: dbTicket.title || "",
        description: dbTicket.description || "",
        type: dbTicket.type || "request",
        priority: dbTicket.priority || "medium",
        status: dbTicket.status || "new",
        impact: dbTicket.impact || "medium",
        urgency: dbTicket.urgency || "medium",
        category: dbTicket.category || "",
        subcategory: dbTicket.subcategory || "",
        assignee_ids: assigneeIds,
        due_date: dbTicket.due_date || "",
        tags: Array.isArray(dbTicket.tags) ? dbTicket.tags : [],
      })
      // Clear create-mode state when editing existing tickets
      setNewComment("")
      setDraftChecklist([])
      setIsInternalComment(false)
    }
  }, [dbTicket, isCreateMode, ticketId])

  const requesterName = useMemo(() => {
    if (!dbTicket?.requester) return ""
    return dbTicket.requester.display_name || dbTicket.requester.email || ""
  }, [dbTicket])

  const handleSave = async () => {
    setSaving(true)
    try {
      // Prepare ticket data
      const ticketData: any = { ...form }
      
      // Keep assignee_ids as array for multiple assignees
      // Also update single assignee_id for backward compatibility
      if (form.assignee_ids.length > 0) {
        ticketData.assignee_id = form.assignee_ids[0]
        ticketData.assignee_ids = form.assignee_ids
      } else {
        ticketData.assignee_id = null
        ticketData.assignee_ids = []
      }
      
      // Normalize due_date to ISO if present
      if (ticketData.due_date) {
        ticketData.due_date = new Date(ticketData.due_date).toISOString()
      }
      
      if (isCreateMode) {
        // CREATE MODE - Create new ticket
        console.log("[CREATE] Creating new ticket:", ticketData)
        
        // Validate required fields
        if (!ticketData.title || !ticketData.title.trim()) {
          toast.error("Title is required")
          setSaving(false)
          return
        }
        
        // Add required fields for creation
        ticketData.requester_id = user?.id
        ticketData.organization_id = organization?.id
        
        const newTicket = await createTicketMutation.mutateAsync(ticketData)
        console.log("[CREATE] Ticket created:", newTicket)
        
        // After create, insert initial comment and checklist via GraphQL if provided
        try {
          const client = await createGraphQLClient()

          // Initial comment
          if (newComment && newComment.trim().length > 0) {
            const addCommentMutation = gql`
              mutation AddComment($input: ticket_commentsInsertInput!) {
                insertIntoticket_commentsCollection(objects: [$input]) { records { id } }
              }
            `
            await client.request(addCommentMutation, {
              input: {
                ticket_id: newTicket.id,
                author_id: user?.id,
                content: newComment.trim(),
                is_internal: isInternalComment,
                is_system: false,
              },
            })
          }

          // Checklist items (staged)
          if (draftChecklist.length > 0) {
            const addChecklistMutation = gql`
              mutation AddChecklist($objects: [ticket_checklistInsertInput!]!) {
                insertIntoticket_checklistCollection(objects: $objects) { affectedCount }
              }
            `
            const objects = draftChecklist.map((text) => ({
              ticket_id: newTicket.id,
              created_by: user?.id,
              text,
              completed: false,
            }))
            if (objects.length > 0) {
              await client.request(addChecklistMutation, { objects })
            }
          }
        } catch (postErr) {
          console.error("Error adding initial comment/checklist:", postErr)
        }
        
        toast.success("Ticket created successfully!", {
          description: `Ticket #${newTicket.ticket_number} has been created.`
        })
        
        // Close drawer after creation
        onClose()
      } else {
        // UPDATE MODE - Update existing ticket
        console.log("[UPDATE] Updating ticket:", ticketId, ticketData)
        
        // Clean up: remove empty strings and null values for optional fields
        const cleanedData: any = {}
        Object.keys(ticketData).forEach(key => {
          const value = ticketData[key]
          // Only include non-empty values (skip empty strings and null for optional fields)
          if (value !== '' && value !== null && value !== undefined) {
            cleanedData[key] = value
          } else if (key === 'assignee_id' && value === null) {
            // Allow null for assignee_id (unassigning)
            cleanedData[key] = null
          }
        })
        
        console.log("[UPDATE] Cleaned data:", cleanedData)
        const updatedTicket = await updateTicketMutation.mutateAsync({ id: ticketId, updates: cleanedData })
        
        // Update form with the returned data to stay in sync
        // Cache invalidation already happened in the mutation hook
        if (updatedTicket) {
          setForm({
            title: updatedTicket.title || form.title,
            description: updatedTicket.description || form.description,
            type: updatedTicket.type || form.type,
            priority: updatedTicket.priority || form.priority,
            status: updatedTicket.status || form.status,
            impact: updatedTicket.impact || form.impact,
            urgency: updatedTicket.urgency || form.urgency,
            category: updatedTicket.category || form.category,
            subcategory: updatedTicket.subcategory || form.subcategory,
            assignee_ids: updatedTicket.assignee_ids || (updatedTicket.assignee_id ? [updatedTicket.assignee_id] : []),
            due_date: updatedTicket.due_date || form.due_date,
            tags: updatedTicket.tags || form.tags,
          })
        }
        
        // Exit edit mode after successful update
        setIsEditMode(false)
        toast.success("Ticket updated successfully!")
      }
    } catch (error) {
      console.error(`Error ${isCreateMode ? 'creating' : 'updating'} ticket:`, error)
      toast.error(`Failed to ${isCreateMode ? 'create' : 'update'} ticket`)
    } finally {
      setSaving(false)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return
    if (isCreateMode) {
      // In create mode, comment is staged and added after ticket creation
      return
    }
    
    try {
      await addCommentMutation.mutateAsync({
        content: newComment.trim(),
        isInternal: isInternalComment,
        authorId: user?.id
      })
      setNewComment("")
      setIsInternalComment(false)
      toast.success("Comment added successfully!")
    } catch (error) {
      console.error("Error adding comment:", error)
      toast.error("Failed to add comment")
    }
  }

  const handleAddChecklistItem = async () => {
    if (!newChecklistItem.trim()) return
    if (isCreateMode) {
      // In create mode, staged locally and added after ticket creation
      return
    }
    
    try {
      await addChecklistItemMutation.mutateAsync({
        text: newChecklistItem.trim(),
        createdBy: user?.id
      })
      setNewChecklistItem("")
      toast.success("Checklist item added!")
    } catch (error) {
      console.error("Error adding checklist item:", error)
      toast.error("Failed to add checklist item")
    }
  }

  const handleToggleChecklistItem = async (itemId: string, completed: boolean) => {
    try {
      await updateChecklistItemMutation.mutateAsync({
        itemId,
        updates: { completed }
      })
    } catch (error) {
      console.error("Error updating checklist item:", error)
      toast.error("Failed to update checklist item")
    }
  }

  const handleDeleteChecklistItem = (itemId: string) => {
    setChecklistItemToDelete(itemId)
    setShowDeleteChecklistDialog(true)
  }

  const confirmDeleteChecklistItem = async () => {
    if (!checklistItemToDelete) return
    try {
      await deleteChecklistItemMutation.mutateAsync(checklistItemToDelete)
      toast.error("Checklist item deleted", "The item has been removed")
      setShowDeleteChecklistDialog(false)
      setChecklistItemToDelete(null)
    } catch (error) {
      console.error("Error deleting checklist item:", error)
      toast.error("Failed to delete checklist item")
    }
  }

  if (!isOpen) return null

  return (
    <>
      <DeleteConfirmationDialog
        open={showDeleteChecklistDialog}
        onOpenChange={setShowDeleteChecklistDialog}
        onConfirm={confirmDeleteChecklistItem}
        title="Delete Checklist Item"
        description="Do you want to delete this checklist item?"
        isDeleting={deleteChecklistItemMutation.isPending}
      />

      {/* Drawer overlay - starts below navbar */}
      <div className="fixed inset-0 z-50 flex" style={{ top: 'var(--header-height, 56px)' }}>
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
        
        {/* Drawer panel */}
        <div 
          className="ml-auto w-[90vw] sm:w-[70vw] md:w-[60vw] lg:w-[50vw] xl:w-[40vw] min-w-[320px] max-w-[900px] bg-background shadow-2xl flex flex-col relative z-10 overflow-hidden border-l"
          style={{ height: 'calc(100vh - var(--header-height, 56px))' }}
        >
          {/* Header */}
          <div className="p-4 md:p-6 bg-background flex items-center justify-between flex-shrink-0 border-b">
            <div className="flex-1 min-w-0 mr-4">
              <h2 className="text-sm md:text-[13px] font-semibold text-foreground mb-1 truncate">
                {isCreateMode ? "Create New Ticket" : (dbTicket?.title || ticket?.title || "Loading...")}
              </h2>
              {!isCreateMode && (dbTicket?.ticket_number || ticket?.id) && (
                <p className="text-[10px] md:text-[11px] text-muted-foreground">
                  #{dbTicket?.ticket_number || ticket?.id}
                  {dbTicket?.created_at && (
                    <>
                      <span className="mx-1">•</span>
                      <span>Created {format(new Date(dbTicket.created_at), "MMM d, y h:mm a")}</span>
                    </>
                  )}
                </p>
              )}
              {isCreateMode && (
                <p className="text-[10px] md:text-[11px] text-muted-foreground">
                  Fill in the details below to create a new ticket
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!isCreateMode && !loading && (
                <Button 
                  variant={isEditMode ? "default" : "outline"}
                  size="sm" 
                  className="h-8 px-3 text-[11px]" 
                  onClick={() => setIsEditMode(!isEditMode)}
                >
                  <Edit className="h-3 w-3 mr-2" />
                  {isEditMode ? "View Mode" : "Edit"}
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 shrink-0" 
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Error state - only for EDIT mode */}
          {!isCreateMode && error ? (
            <div className="p-4 md:p-6">
              <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950 p-4">
                <p className="text-sm text-red-600 dark:text-red-400">Failed to load ticket details</p>
                <p className="text-xs text-red-500 dark:text-red-500 mt-1">{String(error)}</p>
              </div>
            </div>
          ) : !isCreateMode && loading ? (
            // Skeleton loader while fetching ticket
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
              {/* Title skeleton */}
              <div className="space-y-2">
                <div className="h-3 w-16 bg-muted animate-pulse rounded" />
                <div className="h-10 bg-muted animate-pulse rounded" />
              </div>
              
              {/* Description skeleton */}
              <div className="space-y-2">
                <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                <div className="h-32 bg-muted animate-pulse rounded" />
              </div>
              
              {/* Fields grid skeleton */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="h-3 w-12 bg-muted animate-pulse rounded" />
                  <div className="h-10 bg-muted animate-pulse rounded" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-16 bg-muted animate-pulse rounded" />
                  <div className="h-10 bg-muted animate-pulse rounded" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-14 bg-muted animate-pulse rounded" />
                  <div className="h-10 bg-muted animate-pulse rounded" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                  <div className="h-10 bg-muted animate-pulse rounded" />
                </div>
              </div>
              
              {/* More fields skeleton */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="h-3 w-18 bg-muted animate-pulse rounded" />
                  <div className="h-10 bg-muted animate-pulse rounded" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-16 bg-muted animate-pulse rounded" />
                  <div className="h-10 bg-muted animate-pulse rounded" />
                </div>
              </div>
            </div>
          ) : (
            <Tabs defaultValue="details" className="flex-1 flex flex-col min-h-0">
              {/* Hide tabs in CREATE mode - only show Details */}
              {!isCreateMode && (
              <div className="px-4 md:px-6 bg-muted/30 flex-shrink-0">
              <TabsList className="bg-transparent rounded-none w-full justify-start px-0 border-0">
                <TabsTrigger
                  value="details"
                  className="data-[state=active]:bg-background data-[state=active]:text-[#6E72FF] data-[state=active]:shadow-sm rounded-md bg-transparent text-[11px] font-medium px-4 py-2 transition-all"
                >
                  Details
                </TabsTrigger>
                <TabsTrigger
                  value="accounts"
                  className="data-[state=active]:bg-background data-[state=active]:text-[#6E72FF] data-[state=active]:shadow-sm rounded-md bg-transparent text-[11px] font-medium px-4 py-2 transition-all"
                >
                  Accounts
                </TabsTrigger>
                <TabsTrigger
                  value="checklist"
                  className="data-[state=active]:bg-background data-[state=active]:text-[#6E72FF] data-[state=active]:shadow-sm rounded-md bg-transparent text-[11px] font-medium px-4 py-2 transition-all"
                >
                  Checklist
                  {checklist.length > 0 && (
                    <Badge variant="secondary" className="ml-2 text-[10px] h-4 px-1.5">
                      {checklist.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="comments"
                  className="data-[state=active]:bg-background data-[state=active]:text-[#6E72FF] data-[state=active]:shadow-sm rounded-md bg-transparent text-[11px] font-medium px-4 py-2 transition-all"
                >
                  Comments
                  {comments.length > 0 && (
                    <Badge variant="secondary" className="ml-2 text-[10px] h-4 px-1.5">
                      {comments.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="files"
                  className="data-[state=active]:bg-background data-[state=active]:text-[#6E72FF] data-[state=active]:shadow-sm rounded-md bg-transparent text-[11px] font-medium px-4 py-2 transition-all"
                >
                  Files
                  {attachments.length > 0 && (
                    <Badge variant="secondary" className="ml-2 text-[10px] h-4 px-1.5">
                      {attachments.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="data-[state=active]:bg-background data-[state=active]:text-[#6E72FF] data-[state=active]:shadow-sm rounded-md bg-transparent text-[11px] font-medium px-4 py-2 transition-all"
                >
                  History
                  <Badge variant="secondary" className="ml-2 text-[10px] h-4 px-1.5">
                    5
                  </Badge>
                </TabsTrigger>
              </TabsList>
              </div>
              )}

              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
              <TabsContent value="details" className="p-6 space-y-6 mt-0">
                {/* Edit/View mode based on isEditMode state */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Title</label>
                      {isEditMode ? (
                        <Input 
                          value={form.title} 
                          onChange={(e) => setForm({ ...form, title: e.target.value })} 
                          className="text-[11px] h-8"
                        />
                      ) : (
                        <div className="text-[11px] p-2 border rounded bg-muted/30">{form.title || "—"}</div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Description</label>
                      {isEditMode ? (
                        <Textarea 
                          rows={4} 
                          value={form.description} 
                          onChange={(e) => setForm({ ...form, description: e.target.value })} 
                          className="text-[11px] resize-none"
                          placeholder="Describe the issue or request in detail..."
                        />
                      ) : (
                        <div className="text-[11px] p-2 border rounded bg-muted/30 whitespace-pre-wrap min-h-[100px]">{form.description || "—"}</div>
                      )}
                    </div>

                    {/* Row 1: Type and Priority */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Type</label>
                        {isEditMode ? (
                          <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                            <SelectTrigger className="h-8">
                              <SelectValue className="text-[11px]" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="request" className="text-[11px]">Request</SelectItem>
                              <SelectItem value="incident" className="text-[11px]">Incident</SelectItem>
                              <SelectItem value="problem" className="text-[11px]">Problem</SelectItem>
                              <SelectItem value="change" className="text-[11px]">Change</SelectItem>
                              <SelectItem value="task" className="text-[11px]">Task</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="text-[11px] p-2 border rounded bg-muted/30 capitalize">{form.type || "—"}</div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Priority</label>
                        {isEditMode ? (
                          <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                            <SelectTrigger className="h-8">
                              <SelectValue className="text-[11px]" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low" className="text-[11px]">Low</SelectItem>
                              <SelectItem value="medium" className="text-[11px]">Medium</SelectItem>
                              <SelectItem value="high" className="text-[11px]">High</SelectItem>
                              <SelectItem value="critical" className="text-[11px]">Critical</SelectItem>
                              <SelectItem value="urgent" className="text-[11px]">Urgent</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="text-[11px] p-2 border rounded bg-muted/30 capitalize">{form.priority || "—"}</div>
                        )}
                      </div>
                    </div>

                    {/* Row 2: Category and Services (renamed from Subcategory) */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Category</label>
                        {isEditMode ? (
                          <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v, subcategory: "" })}>
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder={supabaseCategories.length ? "Select category" : "Loading..."} className="text-[11px]" />
                            </SelectTrigger>
                            <SelectContent>
                              {supabaseCategories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id} className="text-[11px]">{cat.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="text-[11px] p-2 border rounded bg-muted/30">{selectedCategory?.name || "—"}</div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Services</label>
                        {isEditMode ? (
                          <Select value={form.subcategory} onValueChange={(v) => setForm({ ...form, subcategory: v })} disabled={!form.category}>
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder={!form.category ? "Select category first" : (availableServices.length ? "Select service" : "No services")} className="text-[11px]" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableServices.map((s: any) => (
                                <SelectItem key={s.name} value={s.name} className="text-[11px]">{s.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="text-[11px] p-2 border rounded bg-muted/30">{form.subcategory || "—"}</div>
                        )}
                      </div>
                    </div>

                    {/* Assignee - full width for better UX */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Assignee</label>
                      {isEditMode ? (
                        <TeamSelector
                          teams={teams}
                          users={users}
                          selectedUserIds={form.assignee_ids}
                          onUsersChange={(userIds) => setForm({ ...form, assignee_ids: userIds })}
                          placeholder="Assign to user or team..."
                          className="h-9 text-[11px]"
                        />
                      ) : (
                        <div className="text-[11px] p-2 border rounded bg-muted/30">
                          {form.assignee_ids.length > 0 ? (
                            form.assignee_ids.map((id) => {
                              const user = users.find((u) => u.id === id)
                              return user?.display_name || user?.email || id
                            }).join(", ")
                          ) : "—"}
                        </div>
                      )}
                    </div>

                    {/* Row 3: Due date and Urgency (Impact removed) */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Due date</label>
                        {isEditMode ? (
                          <DateTimePicker
                            value={form.due_date ? new Date(form.due_date) : undefined}
                            onChange={(d) => setForm({ ...form, due_date: d ? d.toISOString() : "" })}
                          />
                        ) : (
                          <div className="text-[11px] p-2 border rounded bg-muted/30">
                            {form.due_date ? format(new Date(form.due_date), "MMM d, y h:mm a") : "—"}
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Urgency</label>
                        {isEditMode ? (
                          <Select value={form.urgency} onValueChange={(v) => setForm({ ...form, urgency: v })}>
                            <SelectTrigger className="h-8">
                              <SelectValue className="text-[11px]" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low" className="text-[11px]">Low</SelectItem>
                              <SelectItem value="medium" className="text-[11px]">Medium</SelectItem>
                              <SelectItem value="high" className="text-[11px]">High</SelectItem>
                              <SelectItem value="critical" className="text-[11px]">Critical</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="text-[11px] p-2 border rounded bg-muted/30 capitalize">{form.urgency || "—"}</div>
                        )}
                      </div>
                    </div>

                    {/* In CREATE mode, surface Checklist, Comment, and Attachments inline */}
                    {isCreateMode && (
                      <div className="space-y-8 pt-4">
                        {/* Checklist */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="text-[11px] font-semibold text-foreground">Checklist</h3>
                          </div>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Add checklist item..."
                              value={newChecklistItem}
                              onChange={(e) => setNewChecklistItem(e.target.value)}
                              onKeyPress={(e) => e.key === "Enter" && newChecklistItem.trim() && setDraftChecklist((prev) => { const next=[...prev, newChecklistItem.trim()]; setNewChecklistItem(""); return next })}
                              className="text-[11px] h-8"
                            />
                            <Button 
                              onClick={() => {
                                if (!newChecklistItem.trim()) return
                                setDraftChecklist((prev) => [...prev, newChecklistItem.trim()])
                                setNewChecklistItem("")
                              }} 
                              disabled={!newChecklistItem.trim()} 
                              className="text-[10px] h-8 px-3"
                            >
                              <Plus className="h-3 w-3 mr-2" />
                              Add
                            </Button>
                          </div>
                          {draftChecklist.length > 0 && (
                            <div className="space-y-2">
                              {draftChecklist.map((text, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 border rounded">
                                  <span className="text-[11px]">{text}</span>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setDraftChecklist((prev) => prev.filter((_, i) => i !== idx))}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Initial Comment */}
                        <div className="space-y-3">
                          <h3 className="text-[11px] font-semibold text-foreground">Initial Comment</h3>
                          <div className="flex items-center gap-2">
                            <Switch id="internal-comment-create" checked={isInternalComment} onCheckedChange={setIsInternalComment} />
                            <Label htmlFor="internal-comment-create" className="text-[11px]">Internal Note</Label>
                          </div>
                          <div className="flex gap-2">
                            <Textarea
                              placeholder="Add a comment..."
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              className="min-h-20 resize-none text-[11px]"
                            />
                            <Button onClick={() => { /* staged; saved on ticket creation */ }} disabled={!newComment.trim()} className="h-10 text-[10px]" title="This comment will be added when you create the ticket">
                              <Send className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Attachments */}
                        <div className="space-y-3">
                          <h3 className="text-[11px] font-semibold text-foreground">Attachments</h3>
                          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                            <p className="text-[10px] text-muted-foreground mb-2">Upload files after the ticket is created</p>
                            <Button variant="outline" size="sm" className="text-[10px] h-8 px-3">
                              <Upload className="h-3 w-3 mr-2" />
                              Choose Files
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
              </TabsContent>

              <TabsContent value="accounts" className="p-6">
                <div className="text-center py-8">
                  <div className="mb-4">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-[11px] font-semibold mb-2 text-foreground">No Linked Accounts</h3>
                    <p className="text-[10px] text-muted-foreground mb-4">
                      Link customer accounts or contacts related to this ticket
                    </p>
                    <Button className="text-[10px] h-7 px-3">
                      <Plus className="h-3 w-3 mr-2" />
                      Link Account
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="checklist" className="p-6 space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[11px] font-semibold text-foreground">Task Checklist</h3>
                  <span className="text-[10px] text-muted-foreground">
                    {checklist.filter(item => item.completed).length} of {checklist.length} completed
                  </span>
                </div>
                
                <div className="flex gap-2">
                  <Input
                    placeholder="Add checklist item..."
                    value={newChecklistItem}
                    onChange={(e) => setNewChecklistItem(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddChecklistItem()}
                    className="text-[11px] h-8"
                  />
                  <Button onClick={handleAddChecklistItem} disabled={!newChecklistItem.trim()} className="text-[10px] h-8 px-3">
                    <Plus className="h-3 w-3 mr-2" />
                    Add
                  </Button>
                </div>

                <div className="space-y-2">
                  {checklist.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-[11px]">No checklist items yet</p>
                      <p className="text-[10px]">Add tasks above to track progress</p>
                    </div>
                  ) : (
                    checklist.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleChecklistItem(item.id, !item.completed)}
                          className="h-6 w-6 p-0 shrink-0"
                        >
                          {item.completed ? (
                            <CheckSquare className="h-4 w-4 text-green-600" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </Button>
                        <div className="flex-1 min-w-0">
                          <span className={`block text-[11px] text-foreground ${item.completed ? "line-through text-muted-foreground" : ""}`}>
                            {item.text}
                          </span>
                          {item.assignee && (
                            <div className="flex items-center gap-1 mt-1">
                              <User className="h-3 w-3" />
                              <span className="text-[10px] text-muted-foreground">
                                {item.assignee.display_name}
                              </span>
                            </div>
                          )}
                          {item.due_date && (
                            <div className="flex items-center gap-1 mt-1">
                              <Calendar className="h-3 w-3" />
                              <span className="text-[10px] text-muted-foreground">
                                {format(new Date(item.due_date), "MMM d, yyyy")}
                              </span>
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteChecklistItem(item.id)}
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700 shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="comments" className="p-6 space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[11px] font-semibold text-foreground">Comments & Updates</h3>
                  <Button variant="outline" size="sm" className="text-[10px] h-7 px-3">
                    <MessageSquare className="h-3 w-3 mr-2" />
                    Internal Note
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {comments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-[11px]">No comments yet</p>
                      <p className="text-[10px]">Start the conversation below</p>
                    </div>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="border rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#6E72FF] flex items-center justify-center text-white text-[10px] font-medium shrink-0">
                            {comment.author?.first_name?.[0] || 'U'}{comment.author?.last_name?.[0] || ''}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-[11px] text-foreground">{comment.author?.display_name || 'Unknown User'}</span>
                              <span className="text-[10px] text-muted-foreground">
                                {format(new Date(comment.created_at), "MMM d, h:mm a")}
                              </span>
                              {comment.is_internal && (
                                <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                                  Internal Note
                                </Badge>
                              )}
                              {comment.is_system && (
                                <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                                  System
                                </Badge>
                              )}
                            </div>
                            <div className="text-[11px] text-foreground whitespace-pre-wrap">{comment.content}</div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                <div className="border-t pt-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Switch
                          id="internal-comment"
                          checked={isInternalComment}
                          onCheckedChange={setIsInternalComment}
                        />
                        <Label htmlFor="internal-comment" className="text-[11px] text-foreground">
                          Internal Note
                        </Label>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span>Use @ to mention team members</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Add a comment... Use @ to mention team members"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="min-h-20 resize-none text-[11px]"
                      />
                      <div className="flex flex-col gap-2">
                        <Button 
                          onClick={handleAddComment} 
                          disabled={!newComment.trim()}
                          className="h-10 text-[10px]"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                          <Paperclip className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <Button variant="ghost" size="sm" className="h-8 px-2 text-[10px]">
                        <Upload className="h-3 w-3 mr-1" />
                        Attach
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 px-2 text-[10px]">
                        <User className="h-3 w-3 mr-1" />
                        Mention
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="files" className="p-6 space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[11px] font-semibold text-foreground">Attachments</h3>
                  <Button className="text-[10px] h-8 px-3">
                    <Upload className="h-3 w-3 mr-2" />
                    Upload File
                  </Button>
                </div>
                
                {attachments.length > 0 ? (
                  <div className="space-y-3">
                    {attachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-red-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-[11px] font-medium truncate text-foreground">{attachment.filename}</p>
                            <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                              {((attachment.file_size || 0) / (1024 * 1024)).toFixed(1)} MB
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-[10px] text-muted-foreground">
                            <span>Uploaded by {attachment.uploaded_by?.display_name || 'Unknown'}</span>
                            <span>{format(new Date(attachment.created_at), "MMM d, h:mm a")}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Upload className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                        <Upload className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <h3 className="font-medium mb-2 text-[11px] text-foreground">Drag and drop files here, or click to browse</h3>
                      <p className="text-[10px] text-muted-foreground mb-4">
                        Allowed types: PDF, Excel, Word, PowerPoint, PNG, JPG
                      </p>
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        id="file-upload"
                        accept=".pdf,.xlsx,.xls,.docx,.doc,.pptx,.ppt,.png,.jpg,.jpeg"
                      />
                      <Button asChild variant="outline" className="text-[10px] h-8 px-3">
                        <label htmlFor="file-upload" className="cursor-pointer">
                          Choose Files
                        </label>
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="history" className="p-6 space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[11px] font-semibold text-foreground">History</h3>
                </div>
                
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium shrink-0">
                      S
                    </div>
                    <div className="flex-1">
                      <div className="bg-muted/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[11px] font-medium text-foreground">System</span>
                          <span className="text-[10px] text-muted-foreground">45 minutes ago</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">Status changed from 'New' to 'In Progress'</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#6E72FF] flex items-center justify-center text-white text-[10px] font-medium shrink-0">
                      JS
                    </div>
                    <div className="flex-1">
                      <div className="bg-[#6E72FF]/10 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[11px] font-medium text-foreground">John Smith</span>
                          <span className="text-[10px] text-muted-foreground">1 hour ago</span>
                        </div>
                        <p className="text-[11px] text-foreground">Thanks for reporting this. I've reproduced the issue and confirmed it's a stored XSS vulnerability. Escalating to high priority.</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-[10px] font-medium shrink-0">
                      RJ
                    </div>
                    <div className="flex-1">
                      <div className="bg-green-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[11px] font-medium text-foreground">Richard Jeffries</span>
                          <span className="text-[10px] text-muted-foreground">2 hours ago</span>
                        </div>
                        <p className="text-[11px] text-foreground">I've identified this XSS vulnerability in the user profile section. It allows malicious scripts to be executed when viewing other users' profiles.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              </div>
            </Tabs>
          )}

          {/* Footer - show save button only in edit mode or create mode */}
          {(isCreateMode || isEditMode) && (
            <div className="border-t p-3 md:p-4 flex justify-end gap-2 flex-shrink-0 bg-background">
              <Button 
                variant="outline" 
                onClick={() => {
                  if (isCreateMode) {
                    onClose()
                  } else {
                    setIsEditMode(false)
                  }
                }}
                className="text-[11px] h-8 px-3"
                disabled={saving}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={saving || (!isCreateMode && loading)} 
                className="text-[11px] h-8 px-3 bg-[#6E72FF] hover:bg-[#6E72FF]/90"
              >
                {saving ? (
                  <>
                    <LoadingSpinner className="h-3 w-3 mr-2" />
                    {isCreateMode ? "Creating..." : "Saving..."}
                  </>
                ) : (
                  <>
                    <Save className="h-3 w-3 mr-2" />
                    {isCreateMode ? "Create Ticket" : "Save Changes"}
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
