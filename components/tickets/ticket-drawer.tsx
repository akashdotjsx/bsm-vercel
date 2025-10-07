"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useTicket } from "@/hooks/use-tickets"
import { useServiceCategories } from "@/lib/hooks/use-service-categories"
import { DateTimePicker } from "@/components/ui/date-time-picker"
import { format } from "date-fns"
import { X } from "lucide-react"

interface TicketDrawerProps {
  isOpen: boolean
  onClose: () => void
  ticket?: any // expects at least { dbId: string }
}

export default function TicketDrawer({ isOpen, onClose, ticket }: TicketDrawerProps) {
  const ticketId = ticket?.dbId || ""
  const { ticket: dbTicket, loading, error, updateTicket } = useTicket(ticketId)
  const { categories: supabaseCategories } = useServiceCategories()

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
  const [saving, setSaving] = useState(false)

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
      onClose()
    } finally {
      setSaving(false)
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
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
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

            <div className="space-y-2">
              <label className="text-sm font-medium">Reported by</label>
              <Input value={requesterName} disabled />
              <p className="text-[11px] text-muted-foreground">This field is not editable.</p>
            </div>

            {form.tags.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {form.tags.map((t) => (
                    <Badge key={t} variant="secondary">{t}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="border-t p-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={handleSave} disabled={saving || loading}>{saving ? "Saving..." : "Save changes"}</Button>
        </div>
      </div>
    </div>
  )
}
