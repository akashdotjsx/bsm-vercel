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
import { useUsers } from "@/hooks/use-users"
import { TeamSelector } from "@/components/users/team-selector"
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
  const { users, teams } = useUsers()

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
    assignee_ids: [] as string[], // Changed to array to support teams
    due_date: "",
    tags: [] as string[],
  })
  const selectedCategory = supabaseCategories.find((c) => c.id === form.category)
  const availableServices = selectedCategory?.services || []

  useEffect(() => {
    if (!dbTicket) return
    // Convert single assignee to array format for compatibility
    const assigneeIds = dbTicket.assignee_id ? [dbTicket.assignee_id] : []
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
      // Convert assignee_ids array back to single assignee_id for API
      if (form.assignee_ids.length > 0) {
        payload.assignee_id = form.assignee_ids[0] // Use first assignee for now
      } else {
        payload.assignee_id = null
      }
      delete payload.assignee_ids // Remove the array field
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
    <div className="fixed inset-0 z-50 flex" style={{ top: '60px' }}>
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="ml-auto w-[40vw] min-w-[700px] max-w-[900px] bg-background shadow-2xl flex flex-col h-full relative z-10">
        <div className="p-6 bg-background flex items-center justify-between">
          <div>
            <h2 className="text-[16px] font-semibold text-foreground mb-1">{dbTicket?.title || ticket?.title || "Loading..."}</h2>
            {(dbTicket?.ticket_number || ticket?.id) && (
              <p className="text-[11px] text-muted-foreground">#{dbTicket?.ticket_number || ticket?.id} • Created {dbTicket?.created_at ? format(new Date(dbTicket.created_at), "MMM d, y h:mm a") : ""}</p>
            )}
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {error ? (
          <div className="p-6 text-red-600 text-[11px]">{String(error)}</div>
        ) : (
          <Tabs defaultValue="details" className="flex-1 flex flex-col">
            <div className="px-6 bg-muted/30">
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

            <div className="flex-1 overflow-y-auto">
              <TabsContent value="details" className="p-6 space-y-6 mt-0">
                {isEditing ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Title</label>
                      <Input 
                        value={form.title} 
                        onChange={(e) => setForm({ ...form, title: e.target.value })} 
                        className="text-[11px] h-8"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Description</label>
                      <Textarea 
                        rows={4} 
                        value={form.description} 
                        onChange={(e) => setForm({ ...form, description: e.target.value })} 
                        className="text-[11px] resize-none"
                        placeholder="Describe the issue or request in detail..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Type</label>
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
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Priority</label>
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
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Status</label>
                        <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                          <SelectTrigger className="h-8">
                            <SelectValue className="text-[11px]" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new" className="text-[11px]">New</SelectItem>
                            <SelectItem value="open" className="text-[11px]">Open</SelectItem>
                            <SelectItem value="in_progress" className="text-[11px]">In Progress</SelectItem>
                            <SelectItem value="resolved" className="text-[11px]">Resolved</SelectItem>
                            <SelectItem value="closed" className="text-[11px]">Closed</SelectItem>
                            <SelectItem value="on_hold" className="text-[11px]">On Hold</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Assignee</label>
                        <TeamSelector
                          teams={teams}
                          users={users}
                          selectedUserIds={form.assignee_ids}
                          onUsersChange={(userIds) => setForm({ ...form, assignee_ids: userIds })}
                          placeholder="Assign to user or team..."
                          className="h-8 text-[11px]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Due date</label>
                        <DateTimePicker
                          value={form.due_date ? new Date(form.due_date) : undefined}
                          onChange={(d) => setForm({ ...form, due_date: d ? d.toISOString() : "" })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Category</label>
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
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Subcategory</label>
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
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Urgency</label>
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
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Impact</label>
                        <Select value={form.impact} onValueChange={(v) => setForm({ ...form, impact: v })}>
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
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-[14px] font-semibold text-foreground">Ticket Details</h3>
                          <Button variant="outline" size="sm" className="text-[11px] h-8 px-4" onClick={() => setIsEditing(true)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Title</label>
                            {dbTicket?.title || ticket?.title ? (
                              <p className="text-[11px] text-foreground mt-1">{dbTicket?.title || ticket?.title}</p>
                            ) : (
                              <div className="h-4 bg-muted animate-pulse rounded mt-1 w-3/4" />
                            )}
                          </div>
                          <div>
                            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Status</label>
                            {dbTicket?.status || ticket?.status ? (
                              <p className="text-[11px] text-foreground mt-1 capitalize">{dbTicket?.status || ticket?.status}</p>
                            ) : (
                              <div className="h-4 bg-muted animate-pulse rounded mt-1 w-16" />
                            )}
                          </div>
                          <div>
                            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Priority</label>
                            {dbTicket?.priority || ticket?.priority ? (
                              <p className="text-[11px] text-foreground mt-1 capitalize">{dbTicket?.priority || ticket?.priority}</p>
                            ) : (
                              <div className="h-4 bg-muted animate-pulse rounded mt-1 w-12" />
                            )}
                          </div>
                          <div>
                            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Type</label>
                            {dbTicket?.type || ticket?.type || ticket?.displayType ? (
                              <p className="text-[11px] text-foreground mt-1 capitalize">{dbTicket?.type || ticket?.type || ticket?.displayType}</p>
                            ) : (
                              <div className="h-4 bg-muted animate-pulse rounded mt-1 w-14" />
                            )}
                          </div>
                          <div>
                            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Assignee</label>
                            {(() => {
                              // Get assignee information
                              const assigneeId = dbTicket?.assignee_id || ticket?.assignee?.id
                              const assigneeName = dbTicket?.assignee?.display_name || ticket?.assignee?.name
                              
                              if (assigneeId && assigneeName) {
                                return <p className="text-[11px] text-foreground mt-1">{assigneeName}</p>
                              } else if (assigneeName) {
                                return <p className="text-[11px] text-foreground mt-1">{assigneeName}</p>
                              } else if (assigneeId) {
                                // Find user in the users array
                                const assignedUser = users.find(u => u.id === assigneeId)
                                return (
                                  <p className="text-[11px] text-foreground mt-1">
                                    {assignedUser?.display_name || assignedUser?.first_name || assignedUser?.email || 'Assigned User'}
                                  </p>
                                )
                              } else {
                                return <p className="text-[11px] text-muted-foreground mt-1">Unassigned</p>
                              }
                            })()}
                          </div>
                          <div>
                            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Reported by</label>
                            {requesterName || ticket?.reportedBy ? (
                              <p className="text-[11px] text-foreground mt-1">{requesterName || ticket?.reportedBy}</p>
                            ) : (
                              <div className="h-4 bg-muted animate-pulse rounded mt-1 w-20" />
                            )}
                          </div>
                          <div>
                            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Due Date</label>
                            {dbTicket?.due_date || ticket?.dueDate ? (
                              <p className="text-[11px] text-foreground mt-1">
                                {dbTicket?.due_date ? format(new Date(dbTicket.due_date), "MMM d, yyyy h:mm a") : ticket?.dueDate || "Not set"}
                              </p>
                            ) : (
                              <div className="h-4 bg-muted animate-pulse rounded mt-1 w-24" />
                            )}
                          </div>
                          <div>
                            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Urgency</label>
                            {dbTicket?.urgency || ticket?.urgency ? (
                              <p className="text-[11px] text-foreground mt-1 capitalize">{dbTicket?.urgency || ticket?.urgency}</p>
                            ) : (
                              <div className="h-4 bg-muted animate-pulse rounded mt-1 w-12" />
                            )}
                          </div>
                          <div>
                            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Impact</label>
                            {dbTicket?.impact || ticket?.impact ? (
                              <p className="text-[11px] text-foreground mt-1 capitalize">{dbTicket?.impact || ticket?.impact}</p>
                            ) : (
                              <div className="h-4 bg-muted animate-pulse rounded mt-1 w-12" />
                            )}
                          </div>
                          <div className="col-span-2">
                            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Description</label>
                            {dbTicket?.description || ticket?.description ? (
                              <p className="text-[11px] text-foreground whitespace-pre-wrap mt-1 leading-relaxed">{dbTicket?.description || ticket?.description}</p>
                            ) : (
                              <div className="mt-1 space-y-2">
                                <div className="h-4 bg-muted animate-pulse rounded w-full" />
                                <div className="h-4 bg-muted animate-pulse rounded w-5/6" />
                                <div className="h-4 bg-muted animate-pulse rounded w-4/6" />
                              </div>
                            )}
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

        {isEditing && (
          <div className="border-t p-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)} className="text-[11px] h-8 px-3">Cancel</Button>
            <Button onClick={handleSave} disabled={saving || loading} className="text-[11px] h-8 px-3">
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
