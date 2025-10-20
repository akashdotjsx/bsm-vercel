"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Clock, 
  User, 
  MessageSquare, 
  Paperclip, 
  Edit, 
  Save, 
  X, 
  Plus, 
  CheckSquare, 
  Square, 
  Trash2, 
  Send, 
  Upload, 
  FileText, 
  Users, 
  Tag, 
  Calendar,
  AlertCircle,
  CheckCircle,
  Circle,
  History
} from "lucide-react"
import { PageContent } from "@/components/layout/page-content"
import { 
  useTicketDetailsGraphQL,
  useUpdateTicketDetailsGraphQL,
  useAddCommentGraphQL,
  useUpdateCommentGraphQL,
  useDeleteCommentGraphQL,
  useAddChecklistItemGraphQL,
  useUpdateChecklistItemGraphQL,
  useDeleteChecklistItemGraphQL
} from "@/hooks/queries/use-ticket-details-graphql"
import { UserSelector } from "@/components/users/user-selector"
import { useUsers } from "@/hooks/use-users"
import { useServiceCategories } from "@/lib/hooks/use-service-categories"
import { useAuth } from "@/lib/contexts/auth-context"
import { format } from "date-fns"
import { toast } from "@/lib/toast"
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog"

interface TicketDetailPageProps {
  params: {
    id: string
  }
}

export default function TicketDetailPage({ params }: TicketDetailPageProps) {
  // State for editing
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editStatus, setEditStatus] = useState("")
  const [editPriority, setEditPriority] = useState("")
  const [editAssignee, setEditAssignee] = useState("")
  
  // State for comments
  const [newComment, setNewComment] = useState("")
  const [isInternalComment, setIsInternalComment] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editCommentContent, setEditCommentContent] = useState("")
  
  // State for checklist
  const [newChecklistItem, setNewChecklistItem] = useState("")
  
  // Hooks for GraphQL data - Single query fetches everything!
  const { data: ticket, isLoading: ticketLoading, error } = useTicketDetailsGraphQL(params.id)
  const updateTicketMutation = useUpdateTicketDetailsGraphQL()
  const addCommentMutation = useAddCommentGraphQL(params.id)
  const updateCommentMutation = useUpdateCommentGraphQL(params.id)
  const deleteCommentMutation = useDeleteCommentGraphQL(params.id)
  const addChecklistItemMutation = useAddChecklistItemGraphQL(params.id)
  const updateChecklistItemMutation = useUpdateChecklistItemGraphQL(params.id)
  const deleteChecklistItemMutation = useDeleteChecklistItemGraphQL(params.id)
  const { users, loading: usersLoading } = useUsers()
  const { categories: serviceCategories } = useServiceCategories()
  const { user: currentUser } = useAuth()
  
  // Extract nested data from ticket
  const comments = ticket?.comments || []
  const attachments = ticket?.attachments || []
  const checklist = ticket?.checklist || []
  const history = (ticket as any)?.history || []
  const effectiveHistory = history.length ? history : [
    {
      id: `created-${ticket?.id}`,
      field_name: 'created',
      old_value: null,
      new_value: null,
      change_reason: 'Created ticket',
      created_at: ticket?.created_at,
      changed_by: ticket?.requester || null,
    }
  ]

  // Helpers to format history values into human-friendly labels
  const profileNameById = (id?: string) => {
    if (!id) return null
    const u = users.find((x: any) => x.id === id)
    return u?.display_name || u?.email || null
  }
  const categoryNameById = (id?: string) => {
    if (!id) return null
    const c = serviceCategories.find((x: any) => x.id === id)
    return c?.name || null
  }
  const formatValueForHistory = (field: string, raw: any): string => {
    if (raw === null || raw === undefined) return ""
    // Try to parse JSON arrays/objects represented as strings
    let value: any = raw
    if (typeof raw === "string") {
      const s = raw.trim()
      if ((s.startsWith("[") && s.endsWith("]")) || (s.startsWith("{") && s.endsWith("}"))) {
        try { value = JSON.parse(s) } catch { value = raw }
      }
    }

    // Map well-known fields
    if (field === "assignee_id") {
      return profileNameById(typeof value === "string" ? value : String(value)) || String(raw)
    }
    if (field === "assignee_ids") {
      const arr = Array.isArray(value) ? value : []
      const names = arr.map((id: string) => profileNameById(id) || id)
      return names.join(", ") || String(raw)
    }
    if (field === "category") {
      return categoryNameById(String(value)) || String(raw)
    }
    if (field === "status" || field === "priority" || field === "type") {
      return String(value).replace(/_/g, " ").toLowerCase().replace(/^(.|\s)(.*)$/,(m)=>m.toUpperCase())
    }
    // Fallback: stringify
    if (Array.isArray(value) || typeof value === "object") {
      try { return JSON.stringify(value) } catch { return String(raw) }
    }
    return String(value)
  }

  // Initialize edit values when ticket loads
  useEffect(() => {
    if (ticket) {
      setEditTitle(ticket.title)
      setEditDescription(ticket.description || "")
      setEditStatus(ticket.status)
      setEditPriority(ticket.priority)
      setEditAssignee(ticket.assignee?.id || "")
    }
  }, [ticket])

  const handleSave = async () => {
    if (!ticket) return
    
    try {
      await updateTicketMutation.mutateAsync({
        id: ticket.id,
        updates: {
          title: editTitle,
          description: editDescription,
          status: editStatus as any,
          priority: editPriority as any,
          assignee_id: editAssignee || undefined,
        },
        actorId: currentUser?.id
      })
      setIsEditing(false)
      toast.success("Ticket updated successfully!")
    } catch (error) {
      console.error("Error updating ticket:", error)
      toast.error("Failed to update ticket")
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return
    
    try {
      await addCommentMutation.mutateAsync({
        content: newComment.trim(),
        isInternal: isInternalComment
      })
      setNewComment("")
      toast.success("Comment added successfully!")
    } catch (error) {
      console.error("Error adding comment:", error)
      toast.error("Failed to add comment")
    }
  }

  const handleEditComment = (comment: any) => {
    setEditingCommentId(comment.id)
    setEditCommentContent(comment.content)
  }

  const handleSaveEditComment = async () => {
    if (!editingCommentId || !editCommentContent.trim()) return
    
    try {
      await updateCommentMutation.mutateAsync({
        commentId: editingCommentId,
        content: editCommentContent.trim(),
        actorId: currentUser?.id
      })
      setEditingCommentId(null)
      setEditCommentContent("")
      toast.success("Comment updated successfully!")
    } catch (error) {
      console.error("Error updating comment:", error)
      toast.error("Failed to update comment")
    }
  }

  const handleCancelEditComment = () => {
    setEditingCommentId(null)
    setEditCommentContent("")
  }

  const handleDeleteComment = async (commentId: string) => {
    setCommentToDelete(commentId)
    setShowDeleteCommentDialog(true)
  }

  const [showDeleteCommentDialog, setShowDeleteCommentDialog] = useState(false)
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null)

  const confirmDeleteComment = async () => {
    if (!commentToDelete) return
    try {
      await deleteCommentMutation.mutateAsync({ commentId: commentToDelete, actorId: currentUser?.id })
      toast.success("Comment deleted successfully!")
      setShowDeleteCommentDialog(false)
      setCommentToDelete(null)
    } catch (error) {
      console.error("Error deleting comment:", error)
      toast.error("Failed to delete comment")
    }
  }

  const handleAddChecklistItem = async () => {
    if (!newChecklistItem.trim()) return
    
    try {
      await addChecklistItemMutation.mutateAsync({
        text: newChecklistItem.trim()
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

  const handleDeleteChecklistItem = async (itemId: string) => {
    try {
      await deleteChecklistItemMutation.mutateAsync(itemId)
      toast.error("Checklist item deleted", "The item has been removed")
    } catch (error) {
      console.error("Error deleting checklist item:", error)
      toast.error("Failed to delete checklist item")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
      case "open":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
      case "in_progress":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
      case "resolved":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
      case "closed":
        return "bg-muted text-foreground dark:bg-gray-900/30 dark:text-gray-300"
      default:
        return "bg-muted text-foreground dark:bg-gray-900/30 dark:text-gray-300"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-200 text-red-900 dark:bg-red-900/50 dark:text-red-200"
      case "urgent":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
      case "high":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
      default:
        return "bg-muted text-foreground dark:bg-gray-900/30 dark:text-gray-300"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "task":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
      case "incident":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
      case "request":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
      case "problem":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
      case "change":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
      default:
        return "bg-muted text-foreground dark:bg-gray-900/30 dark:text-gray-300"
    }
  }

  if (ticketLoading) {
    return (
      <PageContent breadcrumb={[{ label: "Tickets", href: "/tickets" }, { label: "Loading..." }]}>
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-7 w-96" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          <Card>
            <CardContent className="p-6 space-y-6">
              <Skeleton className="h-4 w-32" />
              <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContent>
    )
  }

  if (!ticket) {
    return (
      <PageContent breadcrumb={[{ label: "Tickets", href: "/tickets" }, { label: "Not Found" }]}>
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-[13px] font-semibold mb-2">Ticket Not Found</h2>
          <p className="text-muted-foreground">The ticket you're looking for doesn't exist or has been deleted.</p>
        </div>
      </PageContent>
    )
  }

  return (
    <PageContent breadcrumb={[{ label: "Tickets", href: "/tickets" }, { label: `#${ticket.ticket_number}` }]}>
      <DeleteConfirmationDialog
        open={showDeleteCommentDialog}
        onOpenChange={setShowDeleteCommentDialog}
        onConfirm={confirmDeleteComment}
        title="Delete Comment"
        description="Do you want to delete this comment?"
        isDeleting={deleteCommentMutation.isPending}
      />
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-[13px] font-semibold tracking-tight">
              {isEditing ? (
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="text-[13px] font-semibold border-0 px-0 focus-visible:ring-0 bg-transparent"
                />
              ) : (
                ticket.title
              )}
            </h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>#{ticket.ticket_number}</span>
              <Calendar className="h-4 w-4" />
              <span>Created on {format(new Date(ticket.created_at), "MMM d, yyyy")}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Ticket
              </Button>
            )}
          </div>
        </div>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <Tabs defaultValue="details" className="w-full">
              <div className="border-b">
                <TabsList className="h-12 bg-transparent border-0 rounded-none w-full justify-start px-6">
                  <TabsTrigger
                    value="details"
className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none bg-transparent text-13"
                  >
                    Details
                  </TabsTrigger>
                  <TabsTrigger
                    value="accounts"
                    className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none bg-transparent text-[13px]"
                  >
                    Accounts
                    {/* Hide badge when no accounts - will be dynamic later */}
                  </TabsTrigger>
                  <TabsTrigger
                    value="checklist"
                    className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none bg-transparent text-[13px]"
                  >
                    Checklist
                    {checklist.length > 0 && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {checklist.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="comments"
                    className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none bg-transparent text-[13px]"
                  >
                    Comments
                    {comments.length > 0 && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {comments.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="files"
                    className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none bg-transparent text-[13px]"
                  >
                    Files
                    {attachments.length > 0 && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {attachments.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="history"
                    className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none bg-transparent text-[13px]"
                  >
                    {`History${effectiveHistory.length ? ` (${effectiveHistory.length})` : ""}`}
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="details" className="p-6 space-y-6 mt-0">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-muted-foreground">Description</label>
<Button size="sm" className="h-7 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-[var(--primary-foreground)] text-xs">
                      Write description
                    </Button>
                  </div>

                  <div className="border rounded-lg">
                    <div className="flex items-center gap-1 p-2 border-b bg-muted">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <div className="w-px h-4 bg-border mx-1" />
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <div className="w-px h-4 bg-border mx-1" />
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                    {isEditing ? (
                      <Textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="min-h-24 border-0 rounded-t-none focus-visible:ring-0"
                        placeholder="Add Description"
                      />
                    ) : (
                      <div className="min-h-24 p-3 text-sm">
                        {ticket.description || "No description provided"}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-muted-foreground w-24">Type</label>
                    <div className="flex items-center gap-2">
                      <Badge className={getTypeColor(ticket.type)}>
                        {ticket.type.charAt(0).toUpperCase() + ticket.type.slice(1)}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-muted-foreground w-24">Status</label>
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <Select value={editStatus} onValueChange={setEditStatus}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge className={getStatusColor(ticket.status)}>
                          {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1).replace('_', ' ')}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-muted-foreground w-24">Priority</label>
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <Select value={editPriority} onValueChange={setEditPriority}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge className={getPriorityColor(ticket.priority)}>
                          {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-muted-foreground w-24">Assignee</label>
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <UserSelector
                          users={users}
                          value={editAssignee}
                          onValueChange={setEditAssignee}
                          placeholder="Select assignee..."
                          className="w-48"
                          disabled={usersLoading}
                          filterByRole={["admin", "manager", "agent"]}
                        />
                      ) : (
                        ticket.assignee ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium">
                              {ticket.assignee.first_name?.[0]}{ticket.assignee.last_name?.[0]}
                            </div>
                            <span className="text-sm">{ticket.assignee.display_name}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Unassigned</span>
                        )
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-muted-foreground w-24">Organization</label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Acme Corp</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-muted-foreground w-24">Department</label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{ticket.category || "IT Security"}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-muted-foreground w-24">Category</label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{ticket.category || "Security"}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-muted-foreground w-24">Due Date</label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">
                        {ticket.due_date ? format(new Date(ticket.due_date), "dd-MM-yyyy") : "dd-mm-yyyy"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-muted-foreground w-24">Reported By</label>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-muted-foreground flex items-center justify-center text-white text-xs font-medium">
                        M
                      </div>
                      <span className="text-sm">Estimated Hours</span>
                      <span className="text-sm">8</span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="accounts" className="p-6">
                <div className="text-center py-8">
                  <div className="mb-4">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-[11px] font-semibold mb-2">No Linked Accounts</h3>
                    <p className="text-muted-foreground mb-4">
                      Link customer accounts or contacts related to this ticket
                    </p>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Link Account
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="checklist" className="p-6 space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[11px] font-semibold">Task Checklist</h3>
                  <span className="text-sm text-muted-foreground">
                    {checklist.filter(item => item.completed).length} of {checklist.length} completed
                  </span>
                </div>
                
                <div className="flex gap-2">
                  <Input
                    placeholder="Add checklist item..."
                    value={newChecklistItem}
                    onChange={(e) => setNewChecklistItem(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddChecklistItem()}
                  />
                  <Button onClick={handleAddChecklistItem} disabled={!newChecklistItem.trim()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>

                <div className="space-y-2">
                  {checklist.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No checklist items yet</p>
                      <p className="text-sm">Add tasks above to track progress</p>
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
                          <span className={`block ${item.completed ? "line-through text-muted-foreground" : ""}`}>
                            {item.text}
                          </span>
                          {item.assignee && (
                            <div className="flex items-center gap-1 mt-1">
                              <User className="h-3 w-3" />
                              <span className="text-xs text-muted-foreground">
                                {item.assignee.display_name}
                              </span>
                            </div>
                          )}
                          {item.due_date && (
                            <div className="flex items-center gap-1 mt-1">
                              <Calendar className="h-3 w-3" />
                              <span className="text-xs text-muted-foreground">
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
                  <h3 className="text-[11px] font-semibold">Comments & Updates</h3>
                  <Button variant="outline" size="sm">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Internal Note
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {comments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No comments yet</p>
                      <p className="text-sm">Start the conversation below</p>
                    </div>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="border rounded-lg p-4 group">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium shrink-0">
                            {comment.author?.first_name?.[0] || 'U'}{comment.author?.last_name?.[0] || ''}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">{comment.author?.display_name || 'Unknown User'}</span>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(comment.created_at), "MMM d, h:mm a")}
                                </span>
                                {comment.is_internal && (
                                  <Badge variant="outline" className="text-xs">
                                    Internal Note
                                  </Badge>
                                )}
                                {comment.is_system && (
                                  <Badge variant="secondary" className="text-xs">
                                    System
                                  </Badge>
                                )}
                              </div>
                              {/* Edit and Delete buttons - only show for comments authored by current user */}
                              {currentUser && comment.author_id === currentUser.id && !comment.is_system && (
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditComment(comment)}
                                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteComment(comment.id)}
                                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                            {editingCommentId === comment.id ? (
                              <div className="space-y-2">
                                <Textarea
                                  value={editCommentContent}
                                  onChange={(e) => setEditCommentContent(e.target.value)}
                                  className="min-h-20 resize-none"
                                  placeholder="Edit your comment..."
                                />
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    onClick={handleSaveEditComment}
                                    disabled={!editCommentContent.trim()}
                                  >
                                    <Save className="h-3 w-3 mr-1" />
                                    Save
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCancelEditComment}
                                  >
                                    <X className="h-3 w-3 mr-1" />
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="text-sm whitespace-pre-wrap">{comment.content}</div>
                            )}
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
                        <Label htmlFor="internal-comment" className="text-sm">
                          Internal Note
                        </Label>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Use @ to mention team members</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Add a comment... Use @ to mention team members"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="min-h-20 resize-none"
                      />
                      <div className="flex flex-col gap-2">
                        <Button 
                          onClick={handleAddComment} 
                          disabled={!newComment.trim()}
                          className="h-10"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Paperclip className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Button variant="ghost" size="sm" className="h-8 px-2">
                        <Upload className="h-3 w-3 mr-1" />
                        Attach
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 px-2">
                        <User className="h-3 w-3 mr-1" />
                        Mention
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="files" className="p-6 space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[11px] font-semibold">Attachments</h3>
                  <Button>
                    <Upload className="h-4 w-4 mr-2" />
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
                            <p className="text-sm font-medium truncate">{attachment.filename}</p>
                            <Badge variant="secondary" className="text-xs">
                              {((attachment.file_size || 0) / (1024 * 1024)).toFixed(1)} MB
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
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
                      <h3 className="font-medium mb-2">Drag and drop files here, or click to browse</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Allowed types: PDF, Excel, Word, PowerPoint, PNG, JPG
                      </p>
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        id="file-upload"
                        accept=".pdf,.xlsx,.xls,.docx,.doc,.pptx,.ppt,.png,.jpg,.jpeg"
                      />
                      <Button asChild variant="outline">
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
                  <h3 className="text-[11px] font-semibold">History</h3>
                </div>
                <div className="space-y-3">
                  {effectiveHistory.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">No history yet</div>
                  ) : (
                    effectiveHistory.map((h: any) => {
                      const name = h.changed_by?.display_name || h.changed_by?.email || "System"
                      const initials = (h.changed_by?.first_name?.[0] || name?.[0] || "S") + (h.changed_by?.last_name?.[0] || "")
                      const when = format(new Date(h.created_at), "dd MMM yyyy 'at' h:mm a")
                      const summary = h.field_name === 'created'
                        ? `${name} created the ticket`
                        : h.change_reason && h.field_name === 'checklist'
                        ? `${name} ${h.change_reason}`
                        : (h.field_name ? `${name} ${h.old_value !== undefined ? 'changed' : 'updated'} the ${h.field_name}` : `${name} made an update`)
                      const details = h.field_name === 'created'
                        ? ''
                        : h.field_name === 'checklist'
                        ? ''
                        : (h.field_name ? `${h.old_value ? `${formatValueForHistory(h.field_name, h.old_value)} → ` : ''}${formatValueForHistory(h.field_name, h.new_value)}` : h.change_reason || '')
                      return (
                        <div key={h.id} className="flex gap-3 items-start">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium shrink-0">
                            {initials}
                          </div>
                          <div className="flex-1">
                            <div className="rounded-lg p-3 bg-[#FAFAFA]">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-semibold">{summary}</span>
                                <span className="text-xs text-muted-foreground">{when}</span>
                              </div>
                              {details && (
                                <p className="text-sm text-foreground">{details}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </PageContent>
  )
}
