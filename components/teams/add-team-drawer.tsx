"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { UserSelector } from "@/components/users/user-selector"
import { X, Users as UsersIcon } from "lucide-react"

interface User {
  id: string
  first_name?: string
  last_name?: string
  display_name?: string
  email: string
  role: string
  department?: string
  is_active: boolean
}

interface AddTeamDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (teamData: {
    name: string
    lead_id: string
    description: string
    department: string
  }) => Promise<any> | any
  users: User[]
  departments: string[]
  loading?: boolean
}

export default function AddTeamDrawer({ 
  isOpen, 
  onClose, 
  onSubmit, 
  users, 
  departments,
  loading = false 
}: AddTeamDrawerProps) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: "",
    lead_id: "",
    description: "",
    department: ""
  })

  // Prevent background scroll when drawer is open
  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isOpen])

  // Reset form when drawer closes
  useEffect(() => {
    if (!isOpen) {
      setForm({
        name: "",
        lead_id: "",
        description: "",
        department: ""
      })
    }
  }, [isOpen])

  const handleSave = async () => {
    // Validate required fields
    if (!form.name.trim()) {
      return
    }

    setSaving(true)
    try {
      await onSubmit(form)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
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
            <h2 className="text-sm md:text-[13px] font-semibold text-foreground mb-1">Add New Team</h2>
            <p className="text-[10px] md:text-[11px] text-muted-foreground">
              Create a new team to organize users and improve collaboration
            </p>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {/* Team Name */}
          <div className="space-y-2">
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Team Name <span className="text-red-500">*</span>
            </label>
            <Input 
              value={form.name} 
              onChange={(e) => setForm({ ...form, name: e.target.value })} 
              className="text-[11px] h-8"
              placeholder="e.g., Engineering Team"
            />
          </div>

          {/* Team Lead */}
          <div className="space-y-2">
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Team Lead
            </label>
            <UserSelector
              users={users}
              value={form.lead_id}
              onValueChange={(value) => setForm({ ...form, lead_id: value })}
              placeholder="Select team lead..."
              className="h-8"
              disabled={loading}
              showOnlyActive
              filterByRole={["admin", "manager", "agent"]}
            />
            <p className="text-[9px] text-muted-foreground">
              Only admins, managers, and agents can be team leads
            </p>
          </div>

          {/* Department */}
          <div className="space-y-2">
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Department
            </label>
            <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v })}>
              <SelectTrigger className="h-8">
                <SelectValue className="text-[11px]" placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept} className="text-[11px]">
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Description
            </label>
            <Textarea 
              rows={4} 
              value={form.description} 
              onChange={(e) => setForm({ ...form, description: e.target.value })} 
              className="text-[11px] resize-none"
              placeholder="Describe the team's purpose and responsibilities..."
            />
          </div>

          {/* Info Message */}
          <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/30 rounded-lg">
            <p className="text-[10px] text-blue-700 dark:text-blue-400">
              <strong>Note:</strong> After creating the team, you can add members from the team management section.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-3 md:p-4 flex justify-end gap-2 flex-shrink-0 bg-background">
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="text-[11px] h-8 px-3" 
            disabled={saving}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving || !form.name.trim()} 
            className="text-[11px] h-8 px-3 bg-[#6E72FF] hover:bg-[#6E72FF]/90"
          >
            {saving ? (
              <>
                <LoadingSpinner className="h-3 w-3 mr-2" />
                Creating Team...
              </>
            ) : (
              <>
                <UsersIcon className="h-3 w-3 mr-2" />
                Create Team
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
