"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
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
    priority: "medium", // Default priority
    status: "new", // Default status
    impact: "medium", // Default impact
    urgency: "medium", // Default urgency
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
        className={`w-full h-10 border border-border dark:border-border rounded-md px-4 text-sm bg-background dark:bg-card text-foreground dark:text-foreground ${!isValid ? 'border-destructive dark:border-destructive' : ''}`}
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
    if (!form.targetDueDate) {
      alert('Please select a target due date')
      return
    }
    
    // Map form data to API expected format
    const ticketData = {
      title: form.title,
      description: form.description,
      category: form.category,
      subcategory: form.subcategory,
      priority: form.priority,
      urgency: form.urgency,
      impact: form.impact,
      assignee_id: form.assignee_ids.length > 0 ? form.assignee_ids[0] : null, // First assignee for backward compatibility
      assignee_ids: form.assignee_ids, // Multiple assignees
      due_date: form.targetDueDate ? calculateDueDate(form.targetDueDate) : null,
      tags: form.tags && form.tags.length > 0 ? form.tags : null,
      custom_fields: form.customFields && Object.keys(form.customFields).length > 0 ? form.customFields : null,
      type: 'request', // Default type
      status: 'new' // Default status for new tickets
      // Note: requester_id and organization_id will be added by the ticket drawer
    }
    
    console.log('🎫 Form submitting with data:', ticketData)
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
            <h3 className="text-[#595959] dark:text-[#595959] pl-3" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: '16px', lineHeight: '1.21' }}>Basic Details</h3>
          </div>
          <div className="bg-[#fafafa] dark:bg-card pl-0 pr-6 pb-6 pt-4">
          {/* Ticket Title */}
                 <div className="space-y-2 mb-4">
                   <Label className="text-sm font-medium" style={{ color: '#595959' }}>Ticket Title *</Label>
            <Input
              value={form.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
                     placeholder="Enter Title"
                     className="w-full h-10 border border-border dark:border-border rounded-md px-4 text-sm bg-background dark:bg-card"
                     style={{ color: '#2D2F34' }}
              required
            />
          </div>

          {/* Requester and Department Row */}
          <div className="flex gap-4 mb-4 w-full max-w-4xl">
            <div className="space-y-2 flex-1">
              <Label className="text-sm font-medium" style={{ color: '#595959' }}>Requester</Label>
              <Select value={form.requester} onValueChange={(value) => handleInputChange('requester', value)}>
                <SelectTrigger className="border border-border dark:border-border rounded-md bg-background dark:bg-card" style={{ color: '#2D2F34', height: '38px', width: '100%' }}>
                  <SelectValue placeholder="Select" style={{ color: '#717171' }} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current-user">Current User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 flex-1">
              <Label className="text-sm font-medium" style={{ color: '#595959' }}>Department *</Label>
              <Select value={form.department} onValueChange={(value) => handleInputChange('department', value)} required>
                <SelectTrigger className="border border-border dark:border-border rounded-md bg-background dark:bg-card" style={{ color: '#2D2F34', height: '38px', width: '100%' }}>
                  <SelectValue placeholder="Select" style={{ color: '#717171' }} />
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
              <Label className="text-sm font-medium" style={{ color: '#595959' }}>Category *</Label>
              <Select value={form.category} onValueChange={(value) => handleInputChange('category', value)} required>
                <SelectTrigger className="border border-border dark:border-border rounded-md bg-background dark:bg-card text-foreground dark:text-foreground" style={{ height: '38px', width: '100%' }}>
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
              <Label className="text-sm font-medium" style={{ color: '#595959' }}>Sub-Category *</Label>
              <Select
                value={form.subcategory}
                onValueChange={(value) => handleInputChange('subcategory', value)}
                disabled={!form.category}
                required
              >
                <SelectTrigger className="border border-border dark:border-border rounded-md bg-background dark:bg-card" style={{ color: '#2D2F34', height: '38px', width: '100%' }}>
                  <SelectValue placeholder="Select" style={{ color: '#717171' }} />
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
                   <Label className="text-sm font-medium" style={{ color: '#595959' }}>Description *</Label>
            <Textarea
              value={form.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe the issue or request in detail..."
               className="w-full min-h-[120px] border border-border dark:border-border rounded-md px-5 py-4 text-sm resize-none bg-background dark:bg-card"
               style={{ color: '#2D2F34' }}
              required
            />
          </div>
          </div>
        </div>

        {/* Assignment & Communication Section */}
        <div className="space-y-0">
          <div className="bg-[#F3F4FF] dark:bg-primary/10 py-2.5 pl-0 pr-6" style={{ height: '40px' }}>
            <h3 className="text-[#595959] dark:text-[#595959] pl-3" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: '16px', lineHeight: '1.21' }}>Assignment & Communication</h3>
          </div>
          <div className="bg-[#fafafa] dark:bg-card pl-0 pr-6 pb-6 pt-4">
          <div className="flex gap-4 mb-4 w-full max-w-4xl">
                   <div className="space-y-2 flex-1">
                     <Label className="text-sm font-medium" style={{ color: '#595959' }}>Assignees *</Label>
              <div className="relative">
                <Select 
                  value="" 
                  onValueChange={(value) => {
                    if (value && !form.assignee_ids.includes(value)) {
                      setForm({ ...form, assignee_ids: [...form.assignee_ids, value] })
                    }
                  }}
                >
                  <SelectTrigger className="h-10 border border-border dark:border-border rounded-md pl-10 bg-background dark:bg-card text-foreground dark:text-foreground" style={{ width: '100%' }}>
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
                     <Label className="text-sm font-medium" style={{ color: '#595959' }}>Watchers</Label>
              <Select value={form.watchers} onValueChange={(value) => handleInputChange('watchers', value)}>
                <SelectTrigger className="h-10 border border-border dark:border-border rounded-md bg-background dark:bg-card" style={{ color: '#2D2F34', width: '100%' }}>
                  <SelectValue placeholder="Add Watchers" style={{ color: '#717171' }} />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.display_name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-4 mb-4 w-full max-w-4xl">
            <div className="space-y-2 flex-1">
                     <Label className="text-sm font-medium" style={{ color: '#595959' }}>Target Due Date *</Label>
              <Select value={form.targetDueDate} onValueChange={(value) => handleInputChange('targetDueDate', value)} required>
                <SelectTrigger className="h-10 border border-border dark:border-border rounded-md bg-background dark:bg-card text-foreground dark:text-foreground" style={{ width: '100%' }}>
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
                     <Label className="text-sm font-medium" style={{ color: '#595959' }}>Priority *</Label>
              <Select value={form.priority} onValueChange={(value) => handleInputChange('priority', value)} required>
                <SelectTrigger className="h-10 border border-border dark:border-border rounded-md bg-background dark:bg-card text-foreground dark:text-foreground" style={{ width: '100%' }}>
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
              <Label className="text-sm font-medium" style={{ color: '#595959' }}>Status</Label>
              <Select value={form.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger className="h-10 border border-border dark:border-border rounded-md bg-background dark:bg-card text-foreground dark:text-foreground" style={{ width: '100%' }}>
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
            <h3 className="text-[#595959] dark:text-[#595959] pl-3" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: '16px', lineHeight: '1.21' }}>Associated Project</h3>
          </div>
          <div className="bg-[#fafafa] dark:bg-card pl-0 pr-6 pb-6 pt-4">
          <div className="space-y-2">
            <div className="relative">
              <Input
                value={form.associatedProject}
                onChange={(e) => handleInputChange('associatedProject', e.target.value)}
                placeholder="Link to a project"
                className="w-full h-10 border border-border dark:border-border rounded-md pl-10 pr-10 bg-background dark:bg-card text-foreground dark:text-foreground"
              />
              <Link2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary dark:text-primary" />
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground dark:text-muted-foreground" />
            </div>
          </div>
          </div>
        </div>

        {/* Timeline & Priority Section */}
        <div className="space-y-0">
          <div className="bg-[#F3F4FF] dark:bg-primary/10 py-2.5 pl-0 pr-6" style={{ height: '40px' }}>
            <h3 className="text-[#595959] dark:text-[#595959] pl-3" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: '16px', lineHeight: '1.21' }}>Timeline & Priority</h3>
          </div>
          <div className="bg-[#fafafa] dark:bg-card pl-0 pr-6 pb-6 pt-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
                     <Label className="text-sm font-medium" style={{ color: '#595959' }}>Impact</Label>
              <Select value={form.impact} onValueChange={(value) => handleInputChange('impact', value)}>
                <SelectTrigger className="h-10 border border-border dark:border-border rounded-md bg-background dark:bg-card text-foreground dark:text-foreground">
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
            <div className="space-y-2">
                     <Label className="text-sm font-medium" style={{ color: '#595959' }}>Urgency</Label>
              <Select value={form.urgency} onValueChange={(value) => handleInputChange('urgency', value)}>
                <SelectTrigger className="h-10 border border-border dark:border-border rounded-md bg-background dark:bg-card text-foreground dark:text-foreground">
                  <SelectValue placeholder="Select" />
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                     <Label className="text-sm font-medium" style={{ color: '#595959' }}>Calculated Priority</Label>
              <div className="h-10 border border-border dark:border-border rounded-md bg-muted dark:bg-muted flex items-center px-4">
                <span className="text-sm text-muted-foreground dark:text-muted-foreground">N/A</span>
              </div>
            </div>
            <div className="space-y-2">
                     <Label className="text-sm font-medium" style={{ color: '#595959' }}>SLA Policy</Label>
              <div className="h-10 border border-border dark:border-border rounded-md bg-muted dark:bg-muted flex items-center px-4">
                <span className="text-sm text-muted-foreground dark:text-muted-foreground">Select impact & urgency for SLA</span>
              </div>
            </div>
          </div>
          </div>
        </div>

        {/* Task Management Section */}
        <div className="space-y-0">
          <div className="bg-[#F3F4FF] dark:bg-primary/10 py-2.5 pl-0 pr-6" style={{ height: '40px' }}>
            <h3 className="text-[#595959] dark:text-[#595959] pl-3" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: '16px', lineHeight: '1.21' }}>Task Management</h3>
          </div>
          <div className="bg-[#fafafa] dark:bg-card pl-0 pr-6 pb-6 pt-4">
          <div className="space-y-2">
                   <Label className="text-sm font-medium" style={{ color: '#595959' }}>Checklist</Label>
            
            {/* Checklist Items */}
            {draftChecklist.map((item, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-background dark:bg-card border border-border dark:border-border rounded-md">
                <Square className="w-5 h-5 text-muted-foreground dark:text-muted-foreground" />
                       <span className="flex-1 text-sm" style={{ color: '#2D2F34' }}>{item}</span>
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
            <div className="flex items-center gap-3 p-3 bg-background dark:bg-card border border-border dark:border-border rounded-md">
              <Square className="w-5 h-5 text-muted-foreground dark:text-muted-foreground" />
              <Input
                value={newChecklistItem}
                onChange={(e) => setNewChecklistItem(e.target.value)}
                placeholder="Gather user requirements"
                       className="flex-1 border-0 focus:ring-0 text-sm bg-transparent"
                       style={{ color: '#2D2F34' }}
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
                <Plus className="w-4 h-4 text-muted-foreground dark:text-muted-foreground" />
              </Button>
            </div>
            
            <Button
              type="button"
              onClick={addChecklistItem}
              className="w-full h-9 bg-primary dark:bg-primary text-primary-foreground dark:text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 dark:hover:bg-primary/90"
            >
              Add Item
            </Button>
          </div>
          </div>
        </div>

        {/* Custom Fields Section */}
        {customColumns && customColumns.length > 0 && (
          <div className="space-y-0">
            <div className="bg-[#F3F4FF] dark:bg-primary/10 py-2.5 pl-0 pr-6" style={{ height: '40px' }}>
              <h3 className="text-[#595959] dark:text-[#595959] pl-3" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: '16px', lineHeight: '1.21' }}>Custom Fields</h3>
            </div>
            <div className="bg-[#fafafa] dark:bg-card pl-0 pr-6 pb-6 pt-4">
              <div className="space-y-4">
                {customColumns
                  .filter(column => column.visible !== false) // Only show visible columns
                  .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)) // Sort by sort_order
                  .map((column) => (
                    <div key={column.id} className="space-y-2">
                      <Label className="text-sm font-medium text-foreground dark:text-foreground">
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
        <div className="p-6 bg-[#fafafa] dark:bg-card">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2 px-3 py-2 border-b-2 border-primary dark:border-primary">
              <span className="text-sm font-semibold text-primary dark:text-primary">Internal Only</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2">
              <Mail className="w-4 h-4 text-muted-foreground dark:text-muted-foreground" />
              <span className="text-sm text-muted-foreground dark:text-muted-foreground">Email</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2">
              <div className="w-4 h-4 bg-[#E01E5A] rounded flex items-center justify-center">
                <span className="text-xs text-white font-bold">S</span>
              </div>
              <span className="text-sm text-muted-foreground dark:text-muted-foreground">Slack</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2">
              <div className="w-4 h-4 bg-[#5059C9] rounded flex items-center justify-center">
                <span className="text-xs text-white font-bold">M</span>
              </div>
              <span className="text-sm text-muted-foreground dark:text-muted-foreground">Microsoft Teams</span>
            </div>
          </div>

          <div className="space-y-2">
                     <Label className="text-sm font-medium" style={{ color: '#595959' }}>Staff-only Comments</Label>
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add internal notes visible only to your team. Use rich text for better formatting."
               className="w-full min-h-[120px] border border-border dark:border-border rounded-md px-5 py-4 text-sm resize-none bg-background dark:bg-card text-foreground dark:text-foreground"
            />
          </div>

          {/* File Upload */}
          <div className="mt-4 p-4 border-2 border-dashed border-muted-foreground/30 dark:border-muted-foreground/50 rounded-lg text-center">
            <Button
              type="button"
              className="h-9 bg-primary dark:bg-primary text-primary-foreground dark:text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 dark:hover:bg-primary/90 mb-2"
            >
              <Upload className="w-4 h-4 mr-2" />
              Choose File
            </Button>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">Drag and drop files here, or click to upload</p>
          </div>
        </div>

        {/* AI & Automation Section */}
        <div className="space-y-0">
          <div className="bg-[#F3F4FF] dark:bg-primary/10 py-2.5 pl-0 pr-6" style={{ height: '40px' }}>
            <h3 className="text-[#595959] dark:text-[#595959] pl-3" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: '16px', lineHeight: '1.21' }}>AI & Automation</h3>
          </div>
          <div className="bg-[#fafafa] dark:bg-card pl-0 pr-6 pb-6 pt-4">
          <div className="space-y-2 mb-4">
                   <Label className="text-sm font-medium" style={{ color: '#595959' }}>Suggested Solutions</Label>
            <div className="p-4 bg-background dark:bg-card border border-border dark:border-border rounded-md">
                     <p className="text-sm leading-relaxed" style={{ color: '#2D2F34' }}>
                Based on the category, potential solutions might include:<br/>
                • Refer to knowledge base article KB-203.<br/>
                • Verify network connectivity.<br/>
                • Restart relevant services.<br/>
                <span className="text-xs">(AI-generated suggestions)</span>
              </p>
            </div>
          </div>

          <div className="p-4 bg-background dark:bg-card border border-border dark:border-border rounded-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary dark:bg-primary rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary-foreground dark:text-primary-foreground" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                         <span className="text-sm font-semibold" style={{ color: '#202020' }}>Auto-Assign via AI</span>
                  </div>
                         <p className="text-sm" style={{ color: '#595959' }}>Allow AI to intelligently assign this ticket to the most suitable agent.</p>
                </div>
              </div>
              <Switch
                checked={form.aiAutoAssign}
                onCheckedChange={(checked) => handleInputChange('aiAutoAssign', checked)}
              />
            </div>
          </div>

          <Button
            type="button"
            className="w-full h-9 bg-primary dark:bg-primary text-primary-foreground dark:text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 dark:hover:bg-primary/90 mt-4"
          >
            Generate AI Summary
          </Button>
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
          className="h-9 px-4 text-sm font-medium border-border dark:border-border text-foreground dark:text-foreground hover:bg-muted dark:hover:bg-muted"
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
