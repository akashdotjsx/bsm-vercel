"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { X, Save } from "lucide-react"

interface ServiceCreateDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<any> | any
  initial?: any
  title?: string
  categories: Array<{ id: string; name: string }>
}

export default function ServiceCreateDrawer({ isOpen, onClose, onSubmit, initial, title = "Create Service", categories }: ServiceCreateDrawerProps) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<any>({
    name: initial?.name || "",
    description: initial?.description || "",
    short_description: initial?.short_description || "",
    category_id: initial?.category_id || "",
    is_requestable: initial?.is_requestable ?? true,
    requires_approval: initial?.requires_approval ?? false,
    estimated_delivery_days: initial?.estimated_delivery_days || 3,
    popularity_score: initial?.popularity_score || 3,
    status: initial?.status || 'active'
  })

  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [isOpen])

  const handleSave = async () => {
    if (!form.name.trim() || !form.category_id) return
    setSaving(true)
    try {
      const payload = { ...form }
      payload.estimated_delivery_days = Number(payload.estimated_delivery_days) || 3
      payload.popularity_score = Number(payload.popularity_score) || 3
      await onSubmit(payload)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex" style={{ top: 'var(--header-height, 56px)' }}>
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="ml-auto w-[90vw] sm:w-[70vw] md:w-[60vw] lg:w-[50vw] xl:w-[40vw] min-w-[320px] max-w-[900px] bg-background shadow-2xl flex flex-col relative z-10 overflow-hidden border-l" style={{ height: 'calc(100vh - var(--header-height, 56px))' }}>
        <div className="p-4 md:p-6 bg-background flex items-center justify-between flex-shrink-0 border-b">
          <h2 className="text-sm md:text-[13px] font-semibold text-foreground">{title}</h2>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Name</label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="text-[11px] h-8" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Short Description</label>
            <Input value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })} className="text-[11px] h-8" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Description</label>
            <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="text-[11px] resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Category</label>
              <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                <SelectTrigger className="h-8">
                  <SelectValue className="text-[11px]" placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-[11px]">{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">SLA (days)</label>
                <Input type="number" min={1} value={form.estimated_delivery_days} onChange={(e) => setForm({ ...form, estimated_delivery_days: e.target.value })} className="text-[11px] h-8" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Popularity</label>
                <Input type="number" min={1} max={5} value={form.popularity_score} onChange={(e) => setForm({ ...form, popularity_score: e.target.value })} className="text-[11px] h-8" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Requestable</label>
              <Select value={String(form.is_requestable)} onValueChange={(v) => setForm({ ...form, is_requestable: v === 'true' })}>
                <SelectTrigger className="h-8">
                  <SelectValue className="text-[11px]" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true" className="text-[11px]">Yes</SelectItem>
                  <SelectItem value="false" className="text-[11px]">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Requires Approval</label>
              <Select value={String(form.requires_approval)} onValueChange={(v) => setForm({ ...form, requires_approval: v === 'true' })}>
                <SelectTrigger className="h-8">
                  <SelectValue className="text-[11px]" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true" className="text-[11px]">Yes</SelectItem>
                  <SelectItem value="false" className="text-[11px]">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="border-t p-3 md:p-4 flex justify-end gap-2 flex-shrink-0 bg-background">
          <Button variant="outline" onClick={onClose} className="text-[11px] h-8 px-3" disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !form.name.trim() || !form.category_id} className="text-[11px] h-8 px-3 bg-[#6E72FF] hover:bg-[#6E72FF]/90">
            {saving ? (<><LoadingSpinner className="h-3 w-3 mr-2" />Saving...</>) : (<><Save className="h-3 w-3 mr-2" />Save</>)}
          </Button>
        </div>
      </div>
    </div>
  )
}
