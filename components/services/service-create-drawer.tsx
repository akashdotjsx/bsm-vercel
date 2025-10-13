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
    estimated_delivery_days: initial?.estimated_delivery_days || "",
    popularity_score: initial?.popularity_score || 3,
    category_id: initial?.category_id || "",
    // Set default values for required fields
    is_requestable: true,
    requires_approval: false,
    status: 'active'
  })

  // Update form when drawer opens - prioritize isOpen to ensure fresh form on new service
  useEffect(() => {
    if (!isOpen) return // Don't do anything when drawer is closed
    
    if (initial) {
      // Editing mode - populate with existing data
      // Extract number from SLA if it's a string with text
      let slaValue = initial.estimated_delivery_days || ""
      if (typeof slaValue === 'string' && slaValue.includes('days')) {
        const slaMatch = slaValue.match(/(\d+)/)
        slaValue = slaMatch ? slaMatch[1] : ""
      }
      
      setForm({
        name: initial.name || "",
        description: initial.description || "",
        estimated_delivery_days: slaValue,
        popularity_score: initial.popularity_score || 3,
        category_id: initial.category_id || "",
        is_requestable: true,
        requires_approval: false,
        status: 'active'
      })
    } else {
      // Creating new service - reset form to empty state
      setForm({
        name: "",
        description: "",
        estimated_delivery_days: "",
        popularity_score: 3,
        category_id: "",
        is_requestable: true,
        requires_approval: false,
        status: 'active'
      })
    }
  }, [isOpen, initial])

  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [isOpen])

  const handleSave = async () => {
    if (!form.name.trim() || !form.description.trim()) return
    setSaving(true)
    try {
      const payload = { ...form }
      // Convert SLA to number (already validated as positive integer)
      payload.estimated_delivery_days = Number(payload.estimated_delivery_days) || 1
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

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {/* Service Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Service Name</label>
            <Input 
              value={form.name} 
              onChange={(e) => setForm({ ...form, name: e.target.value })} 
              placeholder="Enter service name"
              className="h-10" 
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Description</label>
            <Textarea 
              rows={4} 
              value={form.description} 
              onChange={(e) => setForm({ ...form, description: e.target.value })} 
              placeholder="Brief description of the service"
              className="resize-none" 
            />
          </div>

          {/* SLA and Popularity in a row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">SLA (Days)</label>
              <Input 
                type="number" 
                value={form.estimated_delivery_days} 
                onChange={(e) => {
                  const value = e.target.value
                  // Only allow positive numbers
                  if (value === '' || (Number(value) > 0 && Number.isInteger(Number(value)))) {
                    setForm({ ...form, estimated_delivery_days: value })
                  }
                }} 
                placeholder="e.g., 3"
                min="1"
                step="1"
                className="h-10" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Popularity (1-5)</label>
              <Select 
                value={String(form.popularity_score)} 
                onValueChange={(value) => setForm({ ...form, popularity_score: Number(value) })}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select popularity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Star</SelectItem>
                  <SelectItem value="2">2 Stars</SelectItem>
                  <SelectItem value="3">3 Stars</SelectItem>
                  <SelectItem value="4">4 Stars</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="border-t p-3 md:p-4 flex justify-end gap-2 flex-shrink-0 bg-background">
          <Button variant="outline" onClick={onClose} className="text-[11px] h-8 px-3" disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !form.name.trim() || !form.description.trim()} className="text-[11px] h-8 px-3 bg-[#6E72FF] hover:bg-[#6E72FF]/90">
            {saving ? (<><LoadingSpinner className="h-3 w-3 mr-2" />Saving...</>) : (<><Save className="h-3 w-3 mr-2" />Save</>)}
          </Button>
        </div>
      </div>
    </div>
  )
}
