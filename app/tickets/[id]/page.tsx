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
import { PlatformLayout } from "@/components/layout/platform-layout"
import { useTicket, useTicketComments, useTicketAttachments, useTicketChecklist } from "@/hooks/use-tickets"
import { UserSelector } from "@/components/users/user-selector"
import { useUsers } from "@/hooks/use-users"
import { format } from "date-fns"

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
  
  // State for checklist
  const [newChecklistItem, setNewChecklistItem] = useState("")
  
  // Hooks for real data
  const { ticket, loading: ticketLoading, updateTicket } = useTicket(params.id)
  const { comments, addComment } = useTicketComments(params.id)
  const { attachments, uploadAttachment } = useTicketAttachments(params.id)
  const { checklist, addChecklistItem, updateChecklistItem, deleteChecklistItem } = useTicketChecklist(params.id)
  const { users, loading: usersLoading } = useUsers()

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
      await updateTicket({
        title: editTitle,
        description: editDescription,
        status: editStatus as any,
        priority: editPriority as any,
        assignee_id: editAssignee || undefined,
      })
      setIsEditing(false)
    } catch (error) {
      console.error("Error updating ticket:", error)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return
    
    try {
      await addComment(newComment.trim(), isInternalComment)
      setNewComment("")
    } catch (error) {
      console.error("Error adding comment:", error)
    }
  }

  const handleAddChecklistItem = async () => {
    if (!newChecklistItem.trim()) return
    
    try {
      await addChecklistItem(newChecklistItem.trim())
      setNewChecklistItem("")
    } catch (error) {
      console.error("Error adding checklist item:", error)
    }
  }

  const handleToggleChecklistItem = async (itemId: string, completed: boolean) => {
    try {
      await updateChecklistItem(itemId, { completed })
    } catch (error) {
      console.error("Error updating checklist item:", error)
    }
  }

  const handleDeleteChecklistItem = async (itemId: string) => {
    try {
      await deleteChecklistItem(itemId)
    } catch (error) {
      console.error("Error deleting checklist item:", error)
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
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
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
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
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
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
    }
  }

  if (ticketLoading) {
    return (
      <PlatformLayout breadcrumb={[{ label: "Tickets", href: "/tickets" }, { label: "Loading..." }]}>
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
      </PlatformLayout>
    )
  }

  if (!ticket) {
    return (
      <PlatformLayout breadcrumb={[{ label: "Tickets", href: "/tickets" }, { label: "Not Found" }]}>
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-[13px] font-semibold mb-2">Ticket Not Found</h2>
          <p className="text-muted-foreground">The ticket you're looking for doesn't exist or has been deleted.</p>
        </div>
      </PlatformLayout>
    )
  }

  return (
    <PlatformLayout breadcrumb={[{ label: "Tickets", href: "/tickets" }, { label: `#${ticket.ticket_number}` }]}>
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
                    History
                    <Badge variant="secondary" className="ml-2 text-xs">
                      5
                    </Badge>
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
                      <div key={comment.id} className="border rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium shrink-0">
                            {comment.author?.first_name?.[0] || 'U'}{comment.author?.last_name?.[0] || ''}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
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
                            <div className="text-sm whitespace-pre-wrap">{comment.content}</div>
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
                  {/* Sample history entries - these would come from ticket_history table */}
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium shrink-0">
                      S
                    </div>
                    <div className="flex-1">
                      <div className="bg-muted/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">System</span>
                          <span className="text-xs text-muted-foreground">45 minutes ago</span>
                        </div>
                        <p className="text-sm text-muted-foreground">Status changed from 'New' to 'In Progress'</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium shrink-0">
                      JS
                    </div>
                    <div className="flex-1">
                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">John Smith</span>
                          <span className="text-xs text-muted-foreground">1 hour ago</span>
                        </div>
                        <p className="text-sm text-muted-foreground">Thanks for reporting this. I've reproduced the issue and confirmed it's a stored XSS vulnerability. Escalating to high priority.</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-medium shrink-0">
                      RJ
                    </div>
                    <div className="flex-1">
                      <div className="bg-green-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">Richard Jeffries</span>
                          <span className="text-xs text-muted-foreground">2 hours ago</span>
                        </div>
                        <p className="text-sm text-muted-foreground">I've identified this XSS vulnerability in the user profile section. It allows malicious scripts to be executed when viewing other users' profiles.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </PlatformLayout>
  )
}
