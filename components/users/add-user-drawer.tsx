"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { X, Save, UserPlus } from "lucide-react"

interface AddUserDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (userData: {
    first_name: string
    last_name: string
    email: string
    role: string
    department: string
  }) => Promise<any> | any
  departments: string[]
}

const availableRoles = [
  { value: 'admin', label: 'Administrator' },
  { value: 'manager', label: 'Manager' },
  { value: 'agent', label: 'Agent' },
  { value: 'user', label: 'User' },
]

export default function AddUserDrawer({ isOpen, onClose, onSubmit, departments }: AddUserDrawerProps) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    role: "user",
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
        first_name: "",
        last_name: "",
        email: "",
        role: "user",
        department: ""
      })
    }
  }, [isOpen])

  const handleSave = async () => {
    // Validate required fields
    if (!form.first_name.trim() || !form.last_name.trim() || !form.email.trim()) {
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
            <h2 className="text-sm md:text-[13px] font-semibold text-foreground mb-1">Add New User</h2>
            <p className="text-[10px] md:text-[11px] text-muted-foreground">
              Create a new user account with appropriate permissions
            </p>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {/* First Name & Last Name */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                First Name <span className="text-red-500">*</span>
              </label>
              <Input 
                value={form.first_name} 
                onChange={(e) => setForm({ ...form, first_name: e.target.value })} 
                className="text-[11px] h-8"
                placeholder="John"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Last Name <span className="text-red-500">*</span>
              </label>
              <Input 
                value={form.last_name} 
                onChange={(e) => setForm({ ...form, last_name: e.target.value })} 
                className="text-[11px] h-8"
                placeholder="Doe"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Email Address <span className="text-red-500">*</span>
            </label>
            <Input 
              type="email"
              value={form.email} 
              onChange={(e) => setForm({ ...form, email: e.target.value })} 
              className="text-[11px] h-8"
              placeholder="john.doe@company.com"
            />
          </div>

          {/* Role & Department */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Role <span className="text-red-500">*</span>
              </label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger className="h-8">
                  <SelectValue className="text-[11px]" />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((role) => (
                    <SelectItem key={role.value} value={role.value} className="text-[11px]">
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
          </div>

          {/* Info Message */}
          <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/30 rounded-lg">
            <p className="text-[10px] text-blue-700 dark:text-blue-400">
              <strong>Note:</strong> A temporary password will be generated and sent to the user's email address. 
              They will be required to change it on first login.
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
            disabled={saving || !form.first_name.trim() || !form.last_name.trim() || !form.email.trim()} 
            className="text-[11px] h-8 px-3 bg-[#6E72FF] hover:bg-[#6E72FF]/90"
          >
            {saving ? (
              <>
                <LoadingSpinner className="h-3 w-3 mr-2" />
                Creating User...
              </>
            ) : (
              <>
                <UserPlus className="h-3 w-3 mr-2" />
                Create User
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
