"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { X, UserPlus } from "lucide-react"

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
        className="ml-auto w-[90vw] sm:w-[70vw] md:w-[60vw] lg:w-[50vw] xl:w-[40vw] min-w-[320px] max-w-[900px] bg-white shadow-2xl flex flex-col relative z-10 overflow-hidden border-l border-gray-200"
        style={{ height: 'calc(100vh - var(--header-height, 56px))' }}
      >
        {/* Header */}
        <div className="p-4 bg-white flex items-center justify-between flex-shrink-0 border-b border-gray-200">
          <div className="flex-1 min-w-0 mr-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Add New User</h2>
            <p className="text-sm text-gray-600">
              Create a new user account with appropriate permissions.
            </p>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-4 space-y-4">
          {/* First Name & Last Name */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label 
                className="block"
                style={{
                  fontFamily: 'Inter',
                  fontWeight: 500,
                  fontSize: '12px',
                  lineHeight: '1.2102272510528564em',
                  color: '#595959'
                }}
              >
                First Name <span className="text-red-500">*</span>
              </label>
              <Input 
                value={form.first_name} 
                onChange={(e) => setForm({ ...form, first_name: e.target.value })} 
                className="border-[#E6E6E6] focus:border-[#6E72FF] focus:ring-[#6E72FF]"
                style={{
                  width: '275px',
                  height: '37px',
                  padding: '10px 15px',
                  borderRadius: '5px',
                  fontFamily: 'Inter',
                  fontWeight: 500,
                  fontSize: '14px',
                  lineHeight: '1.2102272851126534em',
                  color: '#595959'
                }}
                placeholder="John"
              />
            </div>
            <div className="space-y-2.5">
              <label 
                className="block"
                style={{
                  fontFamily: 'Inter',
                  fontWeight: 500,
                  fontSize: '12px',
                  lineHeight: '1.2102272510528564em',
                  color: '#595959'
                }}
              >
                Last Name <span className="text-red-500">*</span>
              </label>
              <Input 
                value={form.last_name} 
                onChange={(e) => setForm({ ...form, last_name: e.target.value })} 
                className="border-[#E6E6E6] focus:border-[#6E72FF] focus:ring-[#6E72FF]"
                style={{
                  width: '275px',
                  height: '37px',
                  padding: '10px 15px',
                  borderRadius: '5px',
                  fontFamily: 'Inter',
                  fontWeight: 500,
                  fontSize: '14px',
                  lineHeight: '1.2102272851126534em',
                  color: '#595959'
                }}
                placeholder="Doe"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label 
              className="block"
              style={{
                fontFamily: 'Inter',
                fontWeight: 500,
                fontSize: '12px',
                lineHeight: '1.2102272510528564em',
                color: '#595959'
              }}
            >
              Email Address <span className="text-red-500">*</span>
            </label>
            <Input 
              type="email"
              value={form.email} 
              onChange={(e) => setForm({ ...form, email: e.target.value })} 
              className="border-[#E6E6E6] focus:border-[#6E72FF] focus:ring-[#6E72FF]"
              style={{
                width: '575px',
                height: '37px',
                padding: '10px 15px',
                borderRadius: '5px',
                fontFamily: 'Inter',
                fontWeight: 500,
                fontSize: '14px',
                lineHeight: '1.2102272851126534em',
                color: '#595959'
              }}
              placeholder="Enter Email Address"
            />
          </div>

          {/* Role & Department */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label 
                className="block"
                style={{
                  fontFamily: 'Inter',
                  fontWeight: 500,
                  fontSize: '12px',
                  lineHeight: '1.2102272510528564em',
                  color: '#595959'
                }}
              >
                Role <span className="text-red-500">*</span>
              </label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger 
                  className="border-[#E6E6E6] focus:border-[#6E72FF] focus:ring-[#6E72FF]"
                  style={{
                    width: '275px',
                    height: '37px',
                    padding: '10px 15px',
                    borderRadius: '5px',
                    fontFamily: 'Inter',
                    fontWeight: 500,
                    fontSize: '14px',
                    lineHeight: '1.2102272851126534em',
                    color: '#595959'
                  }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label 
                className="block"
                style={{
                  fontFamily: 'Inter',
                  fontWeight: 500,
                  fontSize: '12px',
                  lineHeight: '1.2102272510528564em',
                  color: '#595959'
                }}
              >
                Department
              </label>
              <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v })}>
                <SelectTrigger 
                  className="border-[#E6E6E6] focus:border-[#6E72FF] focus:ring-[#6E72FF]"
                  style={{
                    width: '275px',
                    height: '37px',
                    padding: '10px 15px',
                    borderRadius: '5px',
                    fontFamily: 'Inter',
                    fontWeight: 500,
                    fontSize: '14px',
                    lineHeight: '1.2102272851126534em',
                    color: '#595959'
                  }}
                >
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Spacing between Role/Department and Note - matching Figma */}
          <div style={{ height: '1px' }}></div>

          {/* Info Note */}
          <div 
            className="rounded-lg"
            style={{
              backgroundColor: '#F3F4FF',
              borderRadius: '5px',
              padding: '15px 10px',
              width: '575px'
            }}
          >
            <p 
              style={{
                fontFamily: 'Inter',
                fontWeight: 400,
                fontSize: '12px',
                lineHeight: '1.2102272510528564em',
                color: '#6C757D',
                margin: 0,
                width: '548px'
              }}
            >
              <strong style={{ color: '#DC3545' }}>Note:</strong> A temporary password will be generated and sent to the user's email address. They will be required to change it on first login.
            </p>
          </div>

          {/* Cancel and Create User buttons - positioned right below the note */}
          <div className="flex gap-4 justify-end" style={{ marginTop: '16px' }}>
            {/* Cancel Button */}
            <Button
              variant="outline"
              onClick={onClose}
              disabled={saving}
              className="border-black text-black hover:bg-gray-50"
              style={{
                height: '36px',
                padding: '0px 15px',
                borderRadius: '5px',
                fontFamily: 'Inter',
                fontWeight: 600,
                fontSize: '12px',
                lineHeight: '1.2102272510528564em'
              }}
            >
              Cancel
            </Button>
            
            {/* Create User Button */}
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#6E72FF] hover:bg-[#5A5FCC] text-white"
              style={{
                height: '36px',
                padding: '0px 15px',
                borderRadius: '5px',
                fontFamily: 'Inter',
                fontWeight: 600,
                fontSize: '12px',
                lineHeight: '1.2102272510528564em'
              }}
            >
              {saving ? (
                <>
                  <LoadingSpinner className="mr-2 h-4 w-4" />
                  Creating...
                </>
              ) : (
                'Create User'
              )}
            </Button>
          </div>
        </div>

      </div>
    </div>
  )
}
