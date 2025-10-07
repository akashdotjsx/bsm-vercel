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
import { useTicket, useTicketComments, useTicketAttachments, useTicketChecklist } from "@/hooks/use-tickets"
import { useServiceCategories } from "@/lib/hooks/use-service-categories"
import { DateTimePicker } from "@/components/ui/date-time-picker"
import { format } from "date-fns"
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
  const { ticket: dbTicket, loading, error, updateTicket } = useTicket(ticketId)
  const { comments, addComment } = useTicketComments(ticketId)
  const { attachments, uploadAttachment } = useTicketAttachments(ticketId)
  const { checklist, addChecklistItem, updateChecklistItem, deleteChecklistItem } = useTicketChecklist(ticketId)
  const { categories: supabaseCategories } = useServiceCategories()

  // State for editing
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // State for comments
  const [newComment, setNewComment] = useState("")
  const [isInternalComment, setIsInternalComment] = useState(false)
  
  // State for checklist
  const [newChecklistItem, setNewChecklistItem] = useState("")

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
    assignee_id: "",
    team_id: "",
    due_date: "",
    tags: [] as string[],
  })
  const selectedCategory = supabaseCategories.find((c) => c.id === form.category)
  const availableServices = selectedCategory?.services || []

  useEffect(() => {
    if (!dbTicket) return
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
      assignee_id: dbTicket.assignee_id || "",
      team_id: dbTicket.team_id || "",
      due_date: dbTicket.due_date || "",
      tags: Array.isArray(dbTicket.tags) ? dbTicket.tags : [],
    })
  }, [dbTicket])

  const requesterName = useMemo(() => {
    if (!dbTicket?.requester) return ""
    return dbTicket.requester.display_name || dbTicket.requester.email || ""
  }, [dbTicket])

  const handleSave = async () => {
    if (!ticketId) return
    setSaving(true)
    try {
      const payload: any = { ...form }
      // Normalize due_date to ISO if present
      if (payload.due_date) {
        payload.due_date = new Date(payload.due_date).toISOString()
      }
      await updateTicket(payload)
      setIsEditing(false)
    } finally {
      setSaving(false)
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-transparent" onClick={onClose} />
      <div className="ml-auto w-[40vw] min-w-[700px] max-w-[900px] bg-background shadow-2xl flex flex-col h-full relative z-10">
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-[14px] font-semibold">{dbTicket?.title || "Ticket"}</h2>
            {dbTicket?.ticket_number && (
              <p className="text-[11px] text-muted-foreground">#{dbTicket.ticket_number} • Created {dbTicket?.created_at ? format(new Date(dbTicket.created_at), "MMM d, y h:mm a") : ""}</p>
            )}
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <div className="p-6 text-red-600 text-sm">{String(error)}</div>
        ) : (
          <Tabs defaultValue="details" className="flex-1 flex flex-col">
            <div className="border-b px-6">
              <TabsList className="bg-transparent border-0 rounded-none w-full justify-start px-0">
                <TabsTrigger
                  value="details"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none bg-transparent text-[13px]"
                >
                  Details
                </TabsTrigger>
                <TabsTrigger
                  value="accounts"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none bg-transparent text-[13px]"
                >
                  Accounts
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

            <div className="flex-1 overflow-y-auto">
              <TabsContent value="details" className="p-6 space-y-6 mt-0">
                {isEditing ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Title</label>
                      <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Description</label>
                      <Textarea rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Type</label>
                        <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="request">Request</SelectItem>
                            <SelectItem value="incident">Incident</SelectItem>
                            <SelectItem value="problem">Problem</SelectItem>
                            <SelectItem value="change">Change</SelectItem>
                            <SelectItem value="task">Task</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Priority</label>
                        <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                          <SelectTrigger>
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
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Status</label>
                        <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                            <SelectItem value="on_hold">On Hold</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Due date</label>
                        <DateTimePicker
                          value={form.due_date ? new Date(form.due_date) : undefined}
                          onChange={(d) => setForm({ ...form, due_date: d ? d.toISOString() : "" })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Category</label>
                        <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v, subcategory: "" })}>
                          <SelectTrigger>
                            <SelectValue placeholder={supabaseCategories.length ? "Select category" : "Loading..."} />
                          </SelectTrigger>
                          <SelectContent>
                            {supabaseCategories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Subcategory</label>
                        <Select value={form.subcategory} onValueChange={(v) => setForm({ ...form, subcategory: v })} disabled={!form.category}>
                          <SelectTrigger>
                            <SelectValue placeholder={!form.category ? "Select category first" : (availableServices.length ? "Select service" : "No services") } />
                          </SelectTrigger>
                          <SelectContent>
                            {availableServices.map((s: any) => (
                              <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Urgency</label>
                        <Select value={form.urgency} onValueChange={(v) => setForm({ ...form, urgency: v })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Impact</label>
                        <Select value={form.impact} onValueChange={(v) => setForm({ ...form, impact: v })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Ticket Details</h3>
                      <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Title</label>
                        <p className="text-sm">{dbTicket?.title}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Status</label>
                        <p className="text-sm">{dbTicket?.status}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Priority</label>
                        <p className="text-sm">{dbTicket?.priority}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Type</label>
                        <p className="text-sm">{dbTicket?.type}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Urgency</label>
                        <p className="text-sm">{dbTicket?.urgency}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Impact</label>
                        <p className="text-sm">{dbTicket?.impact}</p>
                      </div>
                      <div className="col-span-2">
                        <label className="text-sm font-medium text-muted-foreground">Description</label>
                        <p className="text-sm whitespace-pre-wrap">{dbTicket?.description || "No description provided"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Reported by</label>
                        <p className="text-sm">{requesterName}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Due Date</label>
                        <p className="text-sm">
                          {dbTicket?.due_date ? format(new Date(dbTicket.due_date), "MMM d, yyyy h:mm a") : "Not set"}
                        </p>
                      </div>
                    </div>

                    {form.tags.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Tags</label>
                        <div className="flex flex-wrap gap-2">
                          {form.tags.map((t) => (
                            <Badge key={t} variant="secondary">{t}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="accounts" className="p-6">
                <div className="text-center py-8">
                  <div className="mb-4">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Linked Accounts</h3>
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
                  <h3 className="text-lg font-semibold">Task Checklist</h3>
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
                  <h3 className="text-lg font-semibold">Comments & Updates</h3>
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
                  <h3 className="text-lg font-semibold">Attachments</h3>
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
                  <h3 className="text-lg font-semibold">History</h3>
                </div>
                
                <div className="space-y-3">
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
            </div>
          </Tabs>
        )}

        {isEditing && (
          <div className="border-t p-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || loading}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
