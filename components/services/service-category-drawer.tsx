"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { X, Save, Settings } from "lucide-react"

interface ServiceCategoryDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { name: string; description?: string; color?: string; icon?: string }) => Promise<any> | any
  initial?: { name?: string; description?: string; color?: string; icon?: string }
  title?: string
}

const COLORS = [
  { value: "bg-blue-500", label: "Blue" },
  { value: "bg-green-500", label: "Green" },
  { value: "bg-purple-500", label: "Purple" },
  { value: "bg-orange-500", label: "Orange" },
  { value: "bg-red-500", label: "Red" },
]

export default function ServiceCategoryDrawer({ isOpen, onClose, onSubmit, initial, title = "Create Category" }: ServiceCategoryDrawerProps) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: initial?.name || "",
    description: initial?.description || "",
    color: initial?.color || "bg-blue-500",
    icon: initial?.icon || "Settings",
  })

  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [isOpen])

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      await onSubmit({ ...form })
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
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Description</label>
            <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="text-[11px] resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Color</label>
              <Select value={form.color} onValueChange={(v) => setForm({ ...form, color: v })}>
                <SelectTrigger className="h-8">
                  <SelectValue className="text-[11px]" />
                </SelectTrigger>
                <SelectContent>
                  {COLORS.map(c => (
                    <SelectItem key={c.value} value={c.value} className="text-[11px]">{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Icon</label>
              <Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} className="text-[11px] h-8" placeholder="Settings" />
            </div>
          </div>
        </div>

        <div className="border-t p-3 md:p-4 flex justify-end gap-2 flex-shrink-0 bg-background">
          <Button variant="outline" onClick={onClose} className="text-[11px] h-8 px-3" disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !form.name.trim()} className="text-[11px] h-8 px-3 bg-[#6E72FF] hover:bg-[#6E72FF]/90">
            {saving ? (<><LoadingSpinner className="h-3 w-3 mr-2" />Saving...</>) : (<><Save className="h-3 w-3 mr-2" />Save</>)}
          </Button>
        </div>
      </div>
    </div>
  )
}
