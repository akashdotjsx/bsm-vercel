"use client"

import React, { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { useTheme } from "next-themes"
import { 
  X, 
  User, 
  Calendar,
  Link2,
  Square,
  CheckSquare,
  Plus,
  Upload,
  Mail,
  Bot,
  Star,
  ChevronDown,
  UserPlus
} from "lucide-react"
import { useServiceCategories } from "@/lib/hooks/use-service-categories"
import { useUsers } from "@/hooks/use-users"
import { useCustomColumnsGraphQL } from "@/hooks/queries/use-custom-columns-graphql"
import { useAuth } from "@/lib/contexts/auth-context"
import { TeamSelector } from "@/components/users/team-selector"
import { DateTimePicker } from "@/components/ui/date-time-picker"
import { format } from "date-fns"

interface CreateTicketFormProps {
  onSave: (data: any) => void
  onCancel: () => void
  isSubmitting?: boolean
}

export default function CreateTicketForm({ onSave, onCancel, isSubmitting = false }: CreateTicketFormProps) {
  // Auth context for organization
  const { organization } = useAuth()
  const { theme } = useTheme()
  
  // Add custom CSS for placeholder color
  React.useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      [data-placeholder] {
        color: #595959 !important;
      }
      .dark [data-placeholder] {
        color: #9ca3af !important;
      }
    `
    document.head.appendChild(style)
    return () => {
      document.head.removeChild(style)
    }
  }, [])
  
  // Custom columns hook
  const { columns: customColumns, isLoading: customColumnsLoading } = useCustomColumnsGraphQL(organization?.id || '')
  
  // Form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    requester: "", // Will show placeholder "Select"
    department: "",
    category: "",
    subcategory: "",
    assignee: "",
    assignee_ids: [] as string[], // Multiple assignees
    watchers: "",
    targetDueDate: "",
    priority: "medium", // Default to medium
    status: "new", // Default to new
    impact: "medium", // Default to medium
    urgency: "medium", // Default to medium
    calculatedPriority: "",
    slaPolicy: "",
    associatedProject: "",
    checklist: [] as string[],
    customFields: {} as Record<string, any>,
    staffOnlyComments: "",
    aiAutoAssign: false,
    aiSummary: "",
    tags: [] as string[]
  })

  const [newChecklistItem, setNewChecklistItem] = useState("")
  const [draftChecklist, setDraftChecklist] = useState<string[]>([])
  const [newComment, setNewComment] = useState("")
  const [isInternalComment, setIsInternalComment] = useState(true) // Default to internal for staff-only
  const scrollRef = useRef<HTMLDivElement>(null)

  // Data hooks
  const { categories: supabaseCategories, loading: categoriesLoading } = useServiceCategories()
  const { users, teams, loading: usersLoading } = useUsers()

  const selectedCategory = supabaseCategories.find((c) => c.id === form.category)
  const availableServices = selectedCategory?.services || []

  const handleInputChange = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  // Handle custom field changes
  const handleCustomFieldChange = (columnId: string, value: any) => {
    // Find the column title for this columnId
    const column = customColumns?.find(col => col.id === columnId)
    const fieldKey = column?.title || columnId // Use title as key, fallback to ID
    
    setForm(prev => ({
      ...prev,
      customFields: {
        ...prev.customFields,
        [fieldKey]: value
      }
    }))
  }

  // Custom field input component for create form
  const CustomFieldInput = ({ column, value, onValueChange }: { column: any, value: any, onValueChange: (value: any) => void }) => {
    const [localValue, setLocalValue] = useState(value || "")
    const [isValid, setIsValid] = useState(true)

    useEffect(() => {
      setLocalValue(value || "")
    }, [value])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      
      // For number type, validate the input
      if (column.type === "number") {
        if (newValue === "" || newValue === "-" || /^-?\d*\.?\d*$/.test(newValue)) {
          setLocalValue(newValue)
          setIsValid(true)
        } else {
          setIsValid(false)
        }
        return
      }
      
      // For date type, validate date format
      if (column.type === "date") {
        if (newValue === "" || /^\d{4}-\d{2}-\d{2}$/.test(newValue)) {
          setLocalValue(newValue)
          setIsValid(true)
        } else {
          setIsValid(false)
        }
        return
      }
      
      // For text type, allow any input
      setLocalValue(newValue)
      setIsValid(true)
    }

    const handleBlur = () => {
      if (localValue !== value) {
        onValueChange(localValue)
      }
    }

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleBlur()
      }
    }

    return (
      <Input
        type={column.type === "number" ? "number" : column.type === "date" ? "date" : "text"}
        value={localValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onKeyPress={handleKeyPress}
        placeholder={column.defaultValue || `Enter ${column.title.toLowerCase()}`}
        className={`w-full h-10 border border-border dark:border-border rounded-md px-4 text-sm bg-background dark:bg-card text-foreground dark:text-foreground placeholder:text-[#595959] ${!isValid ? 'border-destructive dark:border-destructive' : ''}`}
      />
    )
  }

  const addChecklistItem = () => {
    if (newChecklistItem.trim()) {
      setDraftChecklist(prev => [...prev, newChecklistItem.trim()])
      setNewChecklistItem("")
    }
  }

  const removeChecklistItem = (index: number) => {
    setDraftChecklist(prev => prev.filter((_, i) => i !== index))
  }

  // Helper function to calculate due date from target due date selection
  const calculateDueDate = (targetDueDate: string) => {
    const now = new Date()
    switch (targetDueDate) {
      case '1day':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
      case '3days':
        return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString()
      case '1week':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
      case '2weeks':
        return new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString()
      default:
        return null
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic validation for required fields
    if (!form.title.trim()) {
      alert('Please enter a ticket title')
      return
    }
    if (!form.description.trim()) {
      alert('Please enter a description')
      return
    }
    if (!form.category) {
      alert('Please select a category')
      return
    }
    if (!form.subcategory) {
      alert('Please select a sub-category')
      return
    }
    if (!form.assignee_ids || form.assignee_ids.length === 0) {
      alert('Please select at least one assignee')
      return
    }
    // Target due date is now optional - removed validation
    
    // Map form data to API expected format
    const ticketData = {
      title: form.title,
      description: form.description,
      category: form.category,
      subcategory: form.subcategory,
      priority: form.priority || 'medium', // Fallback to medium if empty
      urgency: form.urgency || 'medium', // Fallback to medium if empty
      impact: form.impact || 'medium', // Fallback to medium if empty
      assignee_id: form.assignee_ids.length > 0 ? form.assignee_ids[0] : null, // First assignee for backward compatibility
      assignee_ids: form.assignee_ids, // Multiple assignees
      due_date: form.targetDueDate ? calculateDueDate(form.targetDueDate) : null, // Optional due date
      tags: form.tags && form.tags.length > 0 ? form.tags : null,
      custom_fields: form.customFields && Object.keys(form.customFields).length > 0 ? form.customFields : null,
      type: 'request', // Default type
      status: 'new' // Default status for new tickets
      // Note: requester_id and organization_id will be added by the ticket drawer
    }
    
    console.log('🎫 Form submitting with data:', ticketData)
    console.log('🎫 Form assignee data:', {
      assignee_ids: form.assignee_ids,
      assignee_id: form.assignee_ids.length > 0 ? form.assignee_ids[0] : null,
      hasAssignees: form.assignee_ids.length > 0
    })
    console.log('🎫 Draft checklist:', draftChecklist)
    console.log('🎫 Staff comment:', newComment)
    console.log('🎫 Form validation passed, calling onSave...')
    try {
      // Pass the form data along with draft checklist and comment to onSave
      onSave({
        ...ticketData,
        draftChecklist,
        newComment: newComment.trim(),
        isInternalComment
      })
      console.log('🎫 onSave called successfully')
    } catch (error) {
      console.error('🎫 Error calling onSave:', error)
      alert('Error submitting ticket: ' + (error as Error).message)
    }
  }


  return (
    <div className="w-full max-w-[575px] mx-auto bg-background dark:bg-card h-full flex flex-col">
      {/* Header - Fixed */}
      <div className="pt-6 pr-6 pb-6 pl-0 border-b border-border dark:border-border flex-shrink-0">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-[#F3F4FF] rounded-full flex items-center justify-center flex-shrink-0">
            <svg width="40" height="39" viewBox="0 0 40 39" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="0.5" width="39" height="39" rx="19.5" fill="#F3F4FF"/>
              <path d="M16.2853 18.5714L19.9996 22.2857L23.7139 18.5714M12.571 12.0714H27.4282C27.9207 12.0714 28.3931 12.2671 28.7414 12.6154C29.0896 12.9636 29.2853 13.436 29.2853 13.9286V19.5C29.2853 21.9627 28.307 24.3246 26.5656 26.066C24.8242 27.8074 22.4623 28.7857 19.9996 28.7857C18.7802 28.7857 17.5727 28.5455 16.4461 28.0789C15.3195 27.6122 14.2958 26.9282 13.4336 26.066C11.6922 24.3246 10.7139 21.9627 10.7139 19.5V13.9286C10.7139 13.436 10.9095 12.9636 11.2578 12.6154C11.6061 12.2671 12.0785 12.0714 12.571 12.0714Z" stroke="#000000" strokeWidth="1.57857" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-foreground dark:text-foreground" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: '16px', lineHeight: '1.2', margin: 0, padding: 0 }}>Create New Ticket</h2>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground" style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: '12px', lineHeight: '1.2', margin: 0, padding: 0 }}>Fill in the details below to create a new ticket</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="w-8 h-8 p-0 flex-shrink-0 hover:bg-muted dark:hover:bg-muted"
          >
            <X className="w-5 h-5 text-muted-foreground dark:text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-muted-foreground/30 dark:scrollbar-thumb-muted-foreground/50 scrollbar-track-transparent relative"
      >
        
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
        {/* Basic Details Section */}
        <div className="space-y-0">
          <div className="bg-[#F3F4FF] dark:bg-primary/10 py-2.5 pl-0 pr-6" style={{ height: '40px' }}>
            <h3 className="pl-3 ticket-form-heading" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: '16px', lineHeight: '1.21' }}>Basic Details</h3>
          </div>
          <div className="bg-[#fafafa] dark:bg-card pl-0 pr-6 pb-6 pt-4">
          {/* Ticket Title */}
                 <div className="space-y-2 mb-4">
                   <Label className="text-sm font-medium ticket-form-label">Ticket Title *</Label>
            <Input
              value={form.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
                     placeholder="Enter Title"
                     className="w-full h-10 border border-border dark:border-border rounded-md px-4 text-sm bg-background dark:bg-card ticket-form-input ticket-form-placeholder"
              required
            />
          </div>

          {/* Requester and Department Row */}
          <div className="flex gap-4 mb-4 w-full max-w-4xl">
            <div className="space-y-2 flex-1">
              <Label className="text-sm font-medium ticket-form-label">Requester</Label>
              <Select value={form.requester} onValueChange={(value) => handleInputChange('requester', value)}>
                <SelectTrigger className="border border-border dark:border-border rounded-md bg-background dark:bg-card ticket-form-input ticket-form-placeholder" style={{ height: '38px', width: '100%' }}>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current-user">Current User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 flex-1">
              <Label className="text-sm font-medium ticket-form-label">Department *</Label>
              <Select value={form.department} onValueChange={(value) => handleInputChange('department', value)} required>
                <SelectTrigger className="border border-border dark:border-border rounded-md bg-background dark:bg-card ticket-form-input ticket-form-placeholder" style={{ height: '38px', width: '100%' }}>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="it">IT</SelectItem>
                  <SelectItem value="hr">HR</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="operations">Operations</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Category and Sub-Category Row */}
          <div className="flex gap-4 mb-4 w-full max-w-4xl">
            <div className="space-y-2 flex-1">
              <Label className="text-sm font-medium ticket-form-label">Category *</Label>
              <Select value={form.category} onValueChange={(value) => handleInputChange('category', value)} required>
                <SelectTrigger className="border border-border dark:border-border rounded-md bg-background dark:bg-card ticket-form-input ticket-form-placeholder" style={{ height: '38px', width: '100%' }}>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {supabaseCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 flex-1">
              <Label className="text-sm font-medium ticket-form-label">Sub-Category *</Label>
              <Select
                value={form.subcategory}
                onValueChange={(value) => handleInputChange('subcategory', value)}
                disabled={!form.category}
                required
              >
                <SelectTrigger className="border border-border dark:border-border rounded-md bg-background dark:bg-card ticket-form-input ticket-form-placeholder" style={{ height: '38px', width: '100%' }}>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {availableServices.map((service: any) => (
                    <SelectItem key={service.name} value={service.name}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
                   <Label className="text-sm font-medium ticket-form-label">Description *</Label>
            <Textarea
              value={form.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe the issue or request in detail..."
               className="w-full min-h-[120px] border border-border dark:border-border rounded-md px-5 py-4 text-sm resize-none bg-background dark:bg-card ticket-form-input ticket-form-placeholder"
              required
            />
          </div>
          </div>
        </div>

        {/* Assignment & Communication Section */}
        <div className="space-y-0">
          <div className="bg-[#F3F4FF] dark:bg-primary/10 py-2.5 pl-0 pr-6" style={{ height: '40px' }}>
            <h3 className="pl-3 ticket-form-heading" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: '16px', lineHeight: '1.21' }}>Assignment & Communication</h3>
          </div>
          <div className="bg-[#fafafa] dark:bg-card pl-0 pr-6 pb-6 pt-4">
          <div className="flex gap-4 mb-4 w-full max-w-4xl">
                   <div className="space-y-2 flex-1">
                     <Label className="text-sm font-medium ticket-form-label">Assignees *</Label>
              <div className="relative">
                <Select 
                  value="" 
                  onValueChange={(value) => {
                    if (value && !form.assignee_ids.includes(value)) {
                      setForm({ ...form, assignee_ids: [...form.assignee_ids, value] })
                    }
                  }}
                >
                  <SelectTrigger 
                    className="h-10 border border-border dark:border-border rounded-md pl-10 bg-background dark:bg-card ticket-form-input ticket-form-placeholder" 
                    style={{ 
                      width: '100%'
                    }}
                  >
                    <SelectValue placeholder="Select Assignees" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#6E72FF] flex items-center justify-center text-white text-xs font-medium">
                            {(user as any).avatar_url ? (
                              <img
                                src={(user as any).avatar_url}
                                alt={user.display_name || user.email}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              (() => {
                                if (user.display_name) {
                                  return user.display_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
                                }
                                if (user.first_name && user.last_name) {
                                  return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
                                }
                                if (user.first_name) {
                                  return user.first_name.substring(0, 2).toUpperCase()
                                }
                                return user.email.substring(0, 2).toUpperCase()
                              })()
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium">{user.display_name || user.email}</div>
                            {user.email !== user.display_name && (
                              <div className="text-xs text-muted-foreground">{user.email}</div>
                            )}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <UserPlus className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary dark:text-primary" />
              </div>
              {form.assignee_ids.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {form.assignee_ids.map((id) => {
                    const user = users.find(u => u.id === id)
                    return (
                      <Badge key={id} variant="secondary" className="text-xs">
                        {user?.display_name || user?.email || id}
                        <button
                          onClick={() => setForm({ ...form, assignee_ids: form.assignee_ids.filter(aid => aid !== id) })}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )
                  })}
                </div>
              )}
            </div>
            <div className="space-y-2 flex-1">
                     <Label className="text-sm font-medium ticket-form-label">Watchers</Label>
              <div className="relative">
                <Select value={form.watchers} onValueChange={(value) => handleInputChange('watchers', value)}>
                  <SelectTrigger 
                    className="h-10 border border-border dark:border-border rounded-md pl-10 bg-background dark:bg-card ticket-form-input ticket-form-placeholder" 
                    style={{ width: '100%' }}
                  >
                    <SelectValue placeholder="Add Watchers" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#6E72FF] flex items-center justify-center text-white text-xs font-medium">
                            {(user as any).avatar_url ? (
                              <img
                                src={(user as any).avatar_url}
                                alt={user.display_name || user.email}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              (() => {
                                if (user.display_name) {
                                  return user.display_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
                                }
                                if (user.first_name && user.last_name) {
                                  return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
                                }
                                if (user.first_name) {
                                  return user.first_name.substring(0, 2).toUpperCase()
                                }
                                return user.email.substring(0, 2).toUpperCase()
                              })()
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium">{user.display_name || user.email}</div>
                            {user.email !== user.display_name && (
                              <div className="text-xs text-muted-foreground">{user.email}</div>
                            )}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <UserPlus className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary dark:text-primary" />
              </div>
            </div>
          </div>

          <div className="flex gap-4 mb-4 w-full max-w-4xl">
            <div className="space-y-2 flex-1">
                     <Label className="text-sm font-medium ticket-form-label">Target Due Date *</Label>
              <Select value={form.targetDueDate} onValueChange={(value) => handleInputChange('targetDueDate', value)} required>
                <SelectTrigger 
                  className="h-10 border border-border dark:border-border rounded-md bg-background dark:bg-card ticket-form-input ticket-form-placeholder" 
                  style={{ width: '100%' }}
                >
                  <SelectValue placeholder="Select Due Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1day">1 Day</SelectItem>
                  <SelectItem value="3days">3 Days</SelectItem>
                  <SelectItem value="1week">1 Week</SelectItem>
                  <SelectItem value="2weeks">2 Weeks</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 flex-1">
                     <Label className="text-sm font-medium ticket-form-label">Priority *</Label>
              <Select value={form.priority} onValueChange={(value) => handleInputChange('priority', value)} required>
                <SelectTrigger 
                  className="h-10 border border-border dark:border-border rounded-md bg-background dark:bg-card ticket-form-input ticket-form-placeholder" 
                  style={{ width: '100%' }}
                >
                  <SelectValue placeholder="Select Priority" />
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

          <div className="flex gap-4 mb-4 w-full max-w-4xl">
            <div className="space-y-2 flex-1">
              <Label className="text-sm font-medium ticket-form-label">Status</Label>
              <Select value={form.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger 
                  className="h-10 border border-border dark:border-border rounded-md bg-background dark:bg-card ticket-form-input ticket-form-placeholder" 
                  style={{ width: '100%' }}
                >
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            </div>
            <div className="flex-1"></div>
          </div>
          </div>
        </div>

        {/* Associated Project Section */}
        <div className="space-y-0">
          <div className="bg-[#F3F4FF] dark:bg-primary/10 py-2.5 pl-0 pr-6" style={{ height: '40px' }}>
            <h3 className="pl-3 ticket-form-heading" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: '16px', lineHeight: '1.21' }}>Associated Project</h3>
          </div>
          <div className="bg-[#fafafa] dark:bg-card pl-0 pr-6 pb-6 pt-4">
          <div className="space-y-2">
            <div className="relative">
              <Input
                value={form.associatedProject}
                onChange={(e) => handleInputChange('associatedProject', e.target.value)}
                placeholder="Link to a project"
                className="w-full h-10 border border-border dark:border-border rounded-md pl-10 pr-10 bg-background dark:bg-card text-foreground dark:text-foreground placeholder:text-[#595959] dark:placeholder:text-[#8e8e8e]"
              />
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clipPath="url(#clip0_1_358)">
                  <path d="M9.33347 7.33334C9.04716 6.95059 8.68189 6.63389 8.26243 6.40471C7.84297 6.17554 7.37913 6.03926 6.90237 6.00512C6.4256 5.97097 5.94708 6.03976 5.49924 6.20682C5.0514 6.37388 4.64472 6.63529 4.3068 6.97334L2.3068 8.97334C1.69961 9.60201 1.36363 10.444 1.37122 11.318C1.37881 12.192 1.72938 13.028 2.3474 13.6461C2.96543 14.2641 3.80147 14.6147 4.67546 14.6223C5.54945 14.6298 6.39146 14.2939 7.02013 13.6867L8.16013 12.5467M6.66679 8.66666C6.95309 9.04942 7.31836 9.36612 7.73782 9.59529C8.15728 9.82446 8.62113 9.96074 9.09789 9.99489C9.57465 10.029 10.0532 9.96024 10.501 9.79318C10.9489 9.62613 11.3555 9.36471 11.6935 9.02666L13.6935 7.02666C14.3006 6.39799 14.6366 5.55598 14.629 4.68199C14.6214 3.808 14.2709 2.97196 13.6529 2.35394C13.0348 1.73591 12.1988 1.38535 11.3248 1.37775C10.4508 1.37016 9.6088 1.70614 8.98012 2.31333L7.83346 3.45333" stroke={theme === 'dark' ? '#ffffff' : '#000000'} strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                </g>
                <defs>
                  <clipPath id="clip0_1_358">
                    <rect width="16" height="16" fill="white"/>
                  </clipPath>
                </defs>
              </svg>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground dark:text-muted-foreground" />
            </div>
          </div>
          </div>
        </div>

        {/* Timeline & Priority Section */}
        <div className="space-y-0">
          <div className="bg-[#F3F4FF] dark:bg-primary/10 py-2.5 pl-0 pr-6" style={{ height: '40px' }}>
            <h3 className="pl-3 ticket-form-heading" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: '16px', lineHeight: '1.21' }}>Timeline & Priority</h3>
          </div>
          <div className="bg-[#fafafa] dark:bg-card pl-0 pr-6 pb-6 pt-4">
          <div className="flex gap-4 mb-4 w-full max-w-4xl">
            <div className="space-y-2 flex-1">
              <Label className="text-sm font-medium ticket-form-label">Impact</Label>
              <Select value={form.impact} onValueChange={(value) => handleInputChange('impact', value)}>
                <SelectTrigger 
                  className="h-10 border border-border dark:border-border rounded-md bg-background dark:bg-card ticket-form-input ticket-form-placeholder" 
                  style={{ width: '100%' }}
                >
                  <SelectValue placeholder="Select Impact Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 flex-1">
              <Label className="text-sm font-medium ticket-form-label">Urgency</Label>
              <Select value={form.urgency} onValueChange={(value) => handleInputChange('urgency', value)}>
                <SelectTrigger 
                  className="h-10 border border-border dark:border-border rounded-md bg-background dark:bg-card ticket-form-input ticket-form-placeholder" 
                  style={{ width: '100%' }}
                >
                  <SelectValue placeholder="Select Urgency Level" />
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

          <div className="flex gap-4 w-full max-w-4xl">
            <div className="space-y-2 flex-1">
              <Label className="text-sm font-medium ticket-form-label">Calculated Priority</Label>
              <div className="h-10 border border-border dark:border-border rounded-md bg-muted dark:bg-muted flex items-center px-4" style={{ width: '100%' }}>
                <span className="text-sm text-muted-foreground dark:text-muted-foreground">N/A</span>
              </div>
            </div>
            <div className="space-y-2 flex-1">
              <Label className="text-sm font-medium ticket-form-label">SLA Policy</Label>
              <div className="h-10 border border-border dark:border-border rounded-md bg-muted dark:bg-muted flex items-center px-4" style={{ width: '100%' }}>
                <span className="text-sm text-muted-foreground dark:text-muted-foreground">Select impact & urgency for SLA</span>
              </div>
            </div>
          </div>
          </div>
        </div>

        {/* Task Management Section */}
        <div className="space-y-0">
          <div className="bg-[#F3F4FF] dark:bg-primary/10 py-2.5 pl-0 pr-6" style={{ height: '40px' }}>
            <h3 className="pl-3 ticket-form-heading" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: '16px', lineHeight: '1.21' }}>Task Management</h3>
          </div>
          <div className="bg-[#fafafa] dark:bg-card pl-0 pr-6 pb-6 pt-4">
          <div className="space-y-2">
                   <Label className="text-sm font-medium ticket-form-label">Checklist</Label>
            
            {/* Checklist Items */}
            {draftChecklist.map((item, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-background dark:bg-card border border-border dark:border-border rounded-md">
                <Square className="w-5 h-5 text-muted-foreground dark:text-muted-foreground" />
                       <span className="flex-1 text-sm ticket-form-input">{item}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeChecklistItem(index)}
                  className="w-6 h-6 p-0 hover:bg-muted dark:hover:bg-muted"
                >
                  <X className="w-4 h-4 text-muted-foreground dark:text-muted-foreground" />
                </Button>
              </div>
            ))}
            
            {/* Add New Checklist Item */}
            <div className="flex items-center gap-2 p-2 bg-background dark:bg-card border border-border dark:border-border rounded-md">
              <Square className="w-4 h-4 text-muted-foreground dark:text-muted-foreground" />
              <Input
                value={newChecklistItem}
                onChange={(e) => setNewChecklistItem(e.target.value)}
                placeholder="Gather user requirements"
                       className="flex-1 border-0 focus:ring-0 text-sm bg-transparent ticket-form-input ticket-form-placeholder"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addChecklistItem()
                  }
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addChecklistItem}
                className="w-6 h-6 p-0 hover:bg-muted dark:hover:bg-muted"
              >
                <Plus className="w-3 h-3 text-muted-foreground dark:text-muted-foreground" />
              </Button>
            </div>
            
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={addChecklistItem}
                className="h-9 px-4 bg-primary dark:bg-primary text-primary-foreground dark:text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 dark:hover:bg-primary/90"
              >
                Add Item
              </Button>
            </div>
          </div>
          </div>
        </div>

        {/* Custom Fields Section */}
        {customColumns && customColumns.length > 0 && (
          <div className="space-y-0">
            <div className="bg-[#F3F4FF] dark:bg-primary/10 py-2.5 pl-0 pr-6" style={{ height: '40px' }}>
              <h3 className="pl-3 ticket-form-heading" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: '16px', lineHeight: '1.21' }}>Custom Fields</h3>
            </div>
            <div className="bg-[#fafafa] dark:bg-card pl-0 pr-6">
              <div className="space-y-4">
                {customColumns
                  .filter(column => column.visible !== false) // Only show visible columns
                  .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)) // Sort by sort_order
                  .map((column) => (
                    <div key={column.id} className="space-y-2">
                      <Label className="text-sm font-medium ticket-form-label">
                        {column.title}
                        {column.defaultValue && (
                          <span className="text-xs text-muted-foreground dark:text-muted-foreground ml-1">(Default: {column.defaultValue})</span>
                        )}
                      </Label>
                      <CustomFieldInput
                        column={column}
                        value={form.customFields?.[column.title] || column.defaultValue || ""}
                        onValueChange={(value) => handleCustomFieldChange(column.id, value)}
                      />
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Communication Options */}
        <div className="bg-[#fafafa] dark:bg-card -mt-0">
          <div className="flex items-center gap-0 mb-4 pl-0 pr-6">
            <div className="flex items-center gap-2 px-3 py-2">
              <span className="font-semibold border-b-2 border-[#6E72FF] pb-1" style={{ color: '#6E72FF', fontFamily: 'Inter', fontWeight: 600, fontSize: '14px', borderBottomWidth: '2px' }}>Internal Only</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2">
              <Mail className="w-4 h-4" style={{ color: '#717171' }} />
              <span style={{ color: '#717171', fontFamily: 'Inter', fontWeight: 600, fontSize: '14px' }}>Email</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2">
              <div className="w-4 h-4 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M2.77987 12.7327C3.21831 12.7315 3.63842 12.5568 3.94834 12.2466C4.25825 11.9365 4.43273 11.5163 4.43362 11.0778V9.4241H2.77987C2.34164 9.42499 1.92157 9.59932 1.61148 9.90899C1.30139 10.2187 1.12649 10.6385 1.125 11.0767C1.12613 11.9891 1.86638 12.7293 2.77875 12.7305L2.77987 12.7327ZM6.92212 9.42297C6.48369 9.42416 6.06358 9.59893 5.75366 9.90906C5.44375 10.2192 5.26927 10.6394 5.26837 11.0778V15.2212C5.27063 16.1336 6.01087 16.8727 6.92212 16.875C7.36036 16.8738 7.78031 16.6992 8.09019 16.3893C8.40007 16.0794 8.57469 15.6595 8.57588 15.2212V11.0767C8.57469 10.6385 8.40007 10.2185 8.09019 9.90866C7.78031 9.59878 7.36036 9.42416 6.92212 9.42297Z" fill="#E01E5A"/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M5.26837 2.77987C5.2695 3.69225 6.00975 4.4325 6.92212 4.43362H8.57588V2.77987C8.57499 2.34164 8.40066 1.92157 8.09099 1.61148C7.78131 1.30139 7.36149 1.12649 6.92325 1.125C6.48501 1.12619 6.06507 1.3008 5.75518 1.61068C5.4453 1.92057 5.27069 2.34051 5.2695 2.77875L5.26837 2.77987ZM8.57588 6.92212C8.57469 6.48389 8.40007 6.06394 8.09019 5.75406C7.78031 5.44418 7.36036 5.26956 6.92212 5.26837H2.77875C2.34051 5.26956 1.92057 5.44418 1.61068 5.75406C1.3008 6.06394 1.12619 6.48389 1.125 6.92212C1.12725 7.83562 1.8675 8.57475 2.77875 8.57588H6.92325C7.36149 8.57469 7.78143 8.40007 8.09132 8.09019C8.4012 7.78031 8.57469 7.36036 8.57588 6.92212Z" fill="#36C5F0"/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M11.0774 8.577C11.5157 8.57581 11.9356 8.4012 12.2455 8.09132C12.5554 7.78143 12.73 7.36149 12.7312 6.92325V2.77875C12.73 2.34071 12.5555 1.92093 12.2459 1.61108C11.9363 1.30123 11.5166 1.12648 11.0786 1.125C10.6403 1.12619 10.2204 1.3008 9.91049 1.61068C9.60061 1.92057 9.42599 2.34051 9.4248 2.77875V6.92325C9.42705 7.8345 10.1651 8.57475 11.0774 8.577ZM15.2197 5.26837C14.7814 5.26956 14.3615 5.44418 14.0516 5.75406C13.7417 6.06394 13.5671 6.48389 13.5659 6.92212V8.57588H15.2197C15.6579 8.57499 16.078 8.40066 16.3881 8.09099C16.6982 7.78131 16.8731 7.36149 16.8746 6.92325C16.8734 6.48501 16.6988 6.06507 16.3889 5.75518C16.079 5.4453 15.659 5.27069 15.2208 5.2695L15.2197 5.26837Z" fill="#2EB67D"/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M9.42383 11.0779C9.42608 11.9903 10.1652 12.7305 11.0776 12.7317H15.221C15.659 12.7305 16.0788 12.556 16.3886 12.2464C16.6985 11.9367 16.8732 11.5171 16.8747 11.079C16.8735 10.6408 16.6989 10.2209 16.389 9.91098C16.0791 9.6011 15.6592 9.42648 15.221 9.42529H11.0776C10.6393 9.42648 10.2194 9.6011 9.90951 9.91098C9.59963 10.2209 9.42502 10.6397 9.42383 11.0779ZM12.7313 15.2202C12.7301 14.7819 12.5555 14.362 12.2456 14.0521C11.9358 13.7422 11.5158 13.5676 11.0776 13.5664H9.42383V15.2202C9.42608 16.1337 10.1652 16.8728 11.0776 16.8739C11.5158 16.8727 11.9358 16.6981 12.2456 16.3882C12.5555 16.0784 12.7301 15.6584 12.7313 15.2202Z" fill="#ECB22E"/>
                </svg>
              </div>
              <span style={{ color: '#717171', fontFamily: 'Inter', fontWeight: 600, fontSize: '14px' }}>Slack</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2">
              <div className="w-4 h-4 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.1114 7.73428H16.1794C16.5642 7.73428 16.8758 8.04478 16.8758 8.4284V12.1274C16.8755 12.4631 16.8091 12.7954 16.6804 13.1054C16.5516 13.4154 16.3631 13.697 16.1256 13.9341C15.888 14.1712 15.6061 14.3593 15.2959 14.4874C14.9856 14.6156 14.6532 14.6814 14.3175 14.6812H14.3063C13.9706 14.6814 13.6382 14.6156 13.328 14.4874C13.0178 14.3593 12.7358 14.1712 12.4983 13.9341C12.2607 13.697 12.0722 13.4154 11.9435 13.1054C11.8147 12.7954 11.7483 12.4631 11.748 12.1274V8.09878C11.748 7.8974 11.9112 7.73428 12.1114 7.73428ZM14.862 7.00303C15.771 7.00303 16.509 6.26615 16.509 5.35828C16.509 4.44928 15.771 3.7124 14.8609 3.7124C13.9508 3.7124 13.2128 4.44928 13.2128 5.35828C13.2128 6.26615 13.9508 7.00303 14.8609 7.00303H14.862Z" fill="#5059C9"/>
                  <path d="M9.73256 7.00313C10.045 7.00357 10.3544 6.94246 10.6432 6.82328C10.932 6.7041 11.1945 6.52919 11.4156 6.30855C11.6368 6.0879 11.8123 5.82584 11.9322 5.53734C12.052 5.24883 12.1139 4.93954 12.1142 4.62713C12.114 4.31453 12.0523 4.00502 11.9324 3.71632C11.8125 3.42761 11.6369 3.16537 11.4156 2.94459C11.1943 2.72381 10.9317 2.54882 10.6427 2.42964C10.3537 2.31045 10.044 2.24941 9.73144 2.25C9.41912 2.24971 9.10981 2.31093 8.82115 2.43018C8.5325 2.54942 8.27015 2.72435 8.0491 2.94499C7.82805 3.16562 7.65262 3.42763 7.53283 3.71606C7.41304 4.00449 7.35123 4.31369 7.35094 4.626C7.35094 5.93888 8.41631 7.00313 9.73144 7.00313H9.73256ZM12.9073 7.73438H6.19106C6.00894 7.7388 5.83603 7.81534 5.7103 7.94718C5.58458 8.07902 5.51634 8.25538 5.52056 8.4375V12.6563C5.49611 13.7497 5.90664 14.8082 6.662 15.5992C7.41735 16.3902 8.45577 16.849 9.54919 16.875C10.6428 16.8493 11.6815 16.3906 12.4371 15.5996C13.1927 14.8085 13.6034 13.7499 13.5789 12.6563V8.4375C13.581 8.34723 13.5653 8.25743 13.5327 8.17323C13.5001 8.08903 13.4512 8.01209 13.3888 7.94679C13.3264 7.8815 13.2518 7.82913 13.1692 7.79268C13.0866 7.75624 12.9976 7.73642 12.9073 7.73438Z" fill="#7B83EB"/>
                  <path opacity="0.1" d="M9.91622 7.73438V13.6463C9.91533 13.8237 9.84436 13.9936 9.71878 14.119C9.5932 14.2444 9.42317 14.315 9.24572 14.3156H5.84259C5.62966 13.7879 5.52005 13.2242 5.51972 12.6551V8.4375C5.51762 8.34728 5.53335 8.25754 5.56599 8.1734C5.59862 8.08927 5.64754 8.0124 5.70992 7.94719C5.7723 7.88199 5.84694 7.82972 5.92955 7.7934C6.01216 7.75707 6.10112 7.7374 6.19134 7.7355H9.91509L9.91622 7.73438Z" fill="black"/>
                  <path opacity="0.2" d="M9.54917 7.7344V14.0119C9.5477 14.1892 9.47655 14.3587 9.35109 14.484C9.22563 14.6092 9.05594 14.6801 8.87867 14.6813H6.01554C5.88904 14.4492 5.78832 14.204 5.71517 13.95C5.58722 13.5307 5.52201 13.0947 5.52167 12.6563V8.43528C5.51958 8.34515 5.53526 8.2555 5.56783 8.17143C5.6004 8.08737 5.64921 8.01055 5.71148 7.94536C5.77374 7.88017 5.84824 7.82788 5.93072 7.79149C6.01222 7.7551 6.10107 7.73532 6.19119 7.73328H9.55029L9.54917 7.7344Z" fill="black"/>
                  <path opacity="0.2" d="M9.54917 7.7344V13.2807C9.5477 13.4579 9.47655 13.6275 9.35109 13.7527C9.22563 13.878 9.05594 13.9489 8.87867 13.95H5.71517C5.58722 13.5307 5.52201 13.0947 5.52167 12.6563V8.43528C5.51958 8.34515 5.53526 8.2555 5.56783 8.17143C5.6004 8.08737 5.64921 8.01055 5.71148 7.94536C5.77374 7.88017 5.84824 7.82788 5.93072 7.79149C6.01222 7.7551 6.10107 7.73532 6.19119 7.73328H9.55029L9.54917 7.7344Z" fill="black"/>
                  <path opacity="0.2" d="M9.18369 7.7344V13.2807C9.18222 13.4579 9.11107 13.6275 8.98561 13.7527C8.86016 13.878 8.69046 13.9489 8.51319 13.95H5.71419C5.58624 13.5307 5.52103 13.0947 5.52069 12.6563V8.43528C5.5186 8.34515 5.53429 8.2555 5.56685 8.17143C5.59942 8.08737 5.64823 8.01055 5.7105 7.94536C5.77277 7.88017 5.84727 7.82788 5.92975 7.79149C6.01222 7.7551 6.10107 7.73532 6.19119 7.73328L9.18369 7.7344Z" fill="black"/>
                  <path opacity="0.1" d="M9.91562 5.8443V6.9963C9.85374 6.99968 9.79524 7.00305 9.73224 7.00305C9.67037 7.00305 9.61187 6.99968 9.54887 6.9963C9.04643 6.95758 8.56927 6.76034 8.18613 6.43301C7.803 6.10568 7.53368 5.66515 7.41699 5.17493H9.24512C9.42238 5.17552 9.59224 5.24604 9.71779 5.37117C9.84334 5.4963 9.91443 5.66592 9.91562 5.84318V5.8443Z" fill="black"/>
                  <path opacity="0.2" d="M9.54891 6.21V6.99637C9.11182 6.96294 8.69247 6.80941 8.33713 6.55273C7.98178 6.29604 7.70425 5.94618 7.53516 5.54175H8.87953C9.05659 5.54263 9.22617 5.61329 9.35148 5.73838C9.47679 5.86348 9.54772 6.03294 9.54891 6.21Z" fill="black"/>
                  <path opacity="0.2" d="M9.54891 6.21V6.99637C9.11182 6.96294 8.69247 6.80941 8.33713 6.55273C7.98178 6.29604 7.70425 5.94618 7.53516 5.54175H8.87953C9.05659 5.54263 9.22617 5.61329 9.35148 5.73838C9.47679 5.86348 9.54772 6.03294 9.54891 6.21Z" fill="black"/>
                  <path opacity="0.2" d="M9.18328 6.2099V6.93778C8.81779 6.85147 8.47792 6.67987 8.19147 6.43702C7.90502 6.19417 7.68011 5.88696 7.53516 5.54053H8.51391C8.69116 5.54141 8.86091 5.61222 8.98625 5.73756C9.11159 5.8629 9.18239 6.03265 9.18328 6.2099Z" fill="black"/>
                  <path d="M1.79663 5.54065H8.51175C8.883 5.54065 9.18338 5.84102 9.18338 6.21115V12.9139C9.18338 13.002 9.16599 13.0893 9.13223 13.1707C9.09846 13.2522 9.04897 13.3261 8.98659 13.3884C8.92421 13.4507 8.85016 13.5001 8.76868 13.5337C8.68721 13.5673 8.5999 13.5845 8.51175 13.5844H1.7955C1.70745 13.5844 1.62026 13.5671 1.53891 13.5334C1.45756 13.4997 1.38365 13.4503 1.32138 13.388C1.25912 13.3258 1.20973 13.2518 1.17604 13.1705C1.14234 13.0891 1.125 13.002 1.125 12.9139V6.21115C1.125 5.8399 1.42537 5.54065 1.79663 5.54065Z" fill="url(#paint0_linear_667_1508)"/>
                  <path d="M6.92049 8.09205H5.57837V11.7404H4.72337V8.09205H3.38574V7.3833H6.91937L6.92049 8.09205Z" fill="white"/>
                  <defs>
                    <linearGradient id="paint0_linear_667_1508" x1="2.5245" y1="5.01752" x2="7.76925" y2="14.1165" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#5A62C3"/>
                      <stop offset="0.5" stopColor="#4D55BD"/>
                      <stop offset="1" stopColor="#3940AB"/>
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <span style={{ color: '#717171', fontFamily: 'Inter', fontWeight: 600, fontSize: '14px' }}>Microsoft Teams</span>
            </div>
          </div>

          <div className="space-y-2 pl-0 pr-6 pb-6">
                     <Label className="text-sm font-medium ticket-form-label">Staff-only Comments</Label>
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add internal notes visible only to your team. Use rich text for better formatting."
               className="w-full min-h-[60px] border border-border dark:border-border rounded-md px-5 py-4 text-sm resize-none bg-background dark:bg-card text-foreground dark:text-foreground placeholder:text-[#595959]"
              style={{ 
                fontFamily: 'Inter', 
                fontWeight: 500, 
                fontSize: '12px' 
              }}
            />
          </div>

          {/* File Upload */}
          <div className="mt-4 ml-0 mr-6 mb-6 p-4 border-2 border-dashed border-muted-foreground/30 dark:border-muted-foreground/50 rounded-lg text-center">
            <Button
              type="button"
              className="h-9 bg-primary dark:bg-primary text-primary-foreground dark:text-primary-foreground text-sm font-medium rounded-[5px] hover:bg-primary/90 dark:hover:bg-primary/90 mb-2"
            >
              Choose File
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="ml-2">
                <g clipPath="url(#clip0_604_2505)">
                  <path d="M13.5933 12.2599C14.2435 11.9055 14.7572 11.3445 15.0532 10.6657C15.3493 9.98686 15.4108 9.22877 15.2281 8.51108C15.0454 7.79338 14.629 7.15696 14.0444 6.70225C13.4599 6.24754 12.7406 6.00044 12 5.99995H11.16C10.9582 5.21944 10.5821 4.49484 10.0599 3.88061C9.5378 3.26638 8.8832 2.77852 8.14537 2.45369C7.40754 2.12886 6.60567 1.97552 5.80005 2.0052C4.99443 2.03489 4.20602 2.24682 3.49409 2.62506C2.78216 3.0033 2.16525 3.53802 1.68972 4.189C1.2142 4.83999 0.892434 5.59031 0.748627 6.38355C0.60482 7.17678 0.64271 7.9923 0.859449 8.76879C1.07619 9.54528 1.46613 10.2625 1.99997 10.8666M7.99998 13.9999V7.99995M7.99998 7.99995L10.6666 10.6657M7.99998 7.99995L5.33331 10.6657" stroke="white" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
                </g>
                <defs>
                  <clipPath id="clip0_604_2505">
                    <rect width="16" height="16" fill="white"/>
                  </clipPath>
                </defs>
              </svg>
            </Button>
            <p className="text-sm ticket-form-text">Drag and drop files here, or click to upload</p>
          </div>
        </div>

        {/* AI & Automation Section */}
        <div className="space-y-0">
          <div className="bg-[#F3F4FF] dark:bg-primary/10 py-2.5 pl-0 pr-6" style={{ height: '40px' }}>
            <h3 className="pl-3 ticket-form-heading" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: '16px', lineHeight: '1.21' }}>AI & Automation</h3>
          </div>
          <div className="bg-[#fafafa] dark:bg-card pl-0 pr-6 pb-6 pt-4">
          <div className="space-y-2 mb-4">
                   <Label className="text-sm font-medium ticket-form-label">Suggested Solutions</Label>
            <div className="p-4">
                     <p className="text-sm leading-relaxed ticket-form-text" style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: '14px', lineHeight: '2em' }}>
                Based on the category, potential solutions might include:<br/>
                • Refer to knowledge base article KB-203.<br/>
                • Verify network connectivity.<br/>
                • Restart relevant services. <span className="ticket-form-text">(AI-generated suggestions)</span>
              </p>
            </div>
          </div>

          <div className="p-4 border border-[#DEE3ED] dark:border-border rounded-[5px] bg-white dark:bg-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-black dark:text-white">
                    <path d="M4.45489 15.6009V11.8866M2.5 13.7438H6.40979M13.4475 8.91516L12.7037 10.3283C12.4961 10.7227 12.3923 10.9199 12.2536 11.0909C12.1306 11.2425 11.9875 11.3785 11.8278 11.4953C11.6479 11.6271 11.4403 11.7257 11.0251 11.923L9.53763 12.6295L11.0251 13.3361C11.4403 13.5332 11.6479 13.6318 11.8278 13.7636C11.9875 13.8805 12.1306 14.0165 12.2536 14.1681C12.3923 14.339 12.4961 14.5362 12.7037 14.9307L13.4475 16.3438L14.1912 14.9307C14.3988 14.5362 14.5025 14.339 14.6412 14.1681C14.7642 14.0165 14.9074 13.8805 15.067 13.7636C15.2469 13.6318 15.4545 13.5332 15.8697 13.3361L17.3572 12.6295L15.8697 11.923C15.4545 11.7257 15.2469 11.6271 15.067 11.4953C14.9074 11.3785 14.7642 11.2425 14.6412 11.0909C14.5025 10.9199 14.3988 10.7227 14.1912 10.3283L13.4475 8.91516Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M7.20239 4.15311L7.60708 3.34375L8.01176 4.15311L8.0118 4.15319C8.14873 4.42706 8.21721 4.56401 8.30869 4.68267C8.38986 4.78799 8.48427 4.8824 8.58959 4.96358C8.70827 5.05506 8.84523 5.12355 9.11915 5.26051L9.92851 5.66519L9.11915 6.06987C8.84523 6.20683 8.70827 6.27531 8.58959 6.36679C8.48427 6.44797 8.38986 6.54238 8.30869 6.6477C8.2172 6.76638 8.14872 6.90334 8.01176 7.17726L7.60708 7.98662L7.20239 7.17726C7.06544 6.90334 6.99696 6.76638 6.90547 6.6477C6.82429 6.54238 6.72988 6.44797 6.62457 6.36679C6.50588 6.27531 6.36893 6.20683 6.09501 6.06987L5.28564 5.66519L6.09501 5.26051C6.36893 5.12355 6.50588 5.05507 6.62457 4.96358C6.72988 4.8824 6.82429 4.78799 6.90547 4.68267C6.99695 4.56401 7.06542 4.42706 7.20236 4.15319L7.20239 4.15311Z" stroke="currentColor" strokeWidth="0.835717" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold ticket-form-input" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: '16px' }}>Auto-Assign via AI</span>
                  </div>
                  <p className="text-sm ticket-form-text" style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: '12px' }}>Allow AI to intelligently assign this ticket to the most suitable agent.</p>
                </div>
              </div>
              <Switch
                checked={form.aiAutoAssign}
                onCheckedChange={(checked) => handleInputChange('aiAutoAssign', checked)}
              />
            </div>
            
            <div className="flex justify-center mt-4">
              <Button
                type="button"
                className="h-9 bg-[#6E72FF] text-white text-sm font-medium rounded-[5px] hover:bg-[#5b4cf2]"
                style={{ 
                  fontFamily: 'Inter', 
                  fontWeight: 600, 
                  fontSize: '12px',
                  lineHeight: '1.2102272510528564em',
                  width: 'fit-content',
                  paddingLeft: '15px',
                  paddingRight: '15px'
                }}
              >
                Generate AI Summary
              </Button>
            </div>
          </div>
          </div>
        </div>

        </form>
      </div>

      {/* Action Buttons - Fixed at bottom */}
      <div className="flex justify-end gap-3 p-6 border-t border-border dark:border-border flex-shrink-0 bg-background dark:bg-card">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="h-9 px-4 text-sm font-medium border-black text-black dark:text-black hover:bg-gray-100 dark:hover:bg-gray-200 hover:text-black dark:hover:text-black"
          style={{ 
            backgroundColor: '#FAFAFA',
            borderColor: '#000000',
            borderRadius: '5px',
            color: '#000000'
          }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          onClick={handleSubmit}
          className="h-9 px-4 bg-primary dark:bg-primary text-primary-foreground dark:text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 dark:hover:bg-primary/90"
        >
          {isSubmitting ? "Creating..." : "Create Ticket"}
        </Button>
      </div>
    </div>
  )
}
