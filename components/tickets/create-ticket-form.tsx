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
    requester: "current-user", // Auto-populated with current user
    department: "",
    category: "",
    subcategory: "",
    assignee: "",
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
    aiSummary: ""
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
        className={`w-full h-10 border border-[#E6E6E6] rounded-md px-4 text-sm ${!isValid ? 'border-red-500' : ''}`}
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
    if (!form.assignee) {
      alert('Please select an assignee')
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
      assignee_id: form.assignee,
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
    <div className="w-full max-w-[575px] mx-auto bg-[#fafafa] h-full flex flex-col">
      {/* Header - Fixed */}
      <div className="pt-6 pr-6 pb-6 pl-0 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-[#F3F4FF] rounded-full flex items-center justify-center flex-shrink-0">
            <svg width="40" height="39" viewBox="0 0 40 39" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="0.5" width="39" height="39" rx="19.5" fill="#F3F4FF"/>
              <path d="M16.2853 18.5714L19.9996 22.2857L23.7139 18.5714M12.571 12.0714H27.4282C27.9207 12.0714 28.3931 12.2671 28.7414 12.6154C29.0896 12.9636 29.2853 13.436 29.2853 13.9286V19.5C29.2853 21.9627 28.307 24.3246 26.5656 26.066C24.8242 27.8074 22.4623 28.7857 19.9996 28.7857C18.7802 28.7857 17.5727 28.5455 16.4461 28.0789C15.3195 27.6122 14.2958 26.9282 13.4336 26.066C11.6922 24.3246 10.7139 21.9627 10.7139 19.5V13.9286C10.7139 13.436 10.9095 12.9636 11.2578 12.6154C11.6061 12.2671 12.0785 12.0714 12.571 12.0714Z" stroke="black" strokeWidth="1.57857" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-[#2D2F34]" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: '16px', lineHeight: '1.2', margin: 0, padding: 0 }}>Create New Ticket</h2>
            <p className="text-sm text-[#717171]" style={{ fontFamily: 'Inter', fontWeight: 400, fontSize: '12px', lineHeight: '1.2', margin: 0, padding: 0 }}>Fill in the details below to create a new ticket</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="w-8 h-8 p-0 flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 relative"
      >
        
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
        {/* Basic Details Section */}
        <div className="space-y-0">
          <div className="bg-[#F3F4FF] py-2.5 pl-0 pr-6" style={{ height: '40px' }}>
            <h3 className="text-[#595959] pl-3" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: '16px', lineHeight: '1.21' }}>Basic Details</h3>
          </div>
          <div className="bg-[#fafafa] pl-0 pr-6 pb-6 pt-4">
          {/* Ticket Title */}
          <div className="space-y-2 mb-4">
            <Label className="text-sm font-medium text-[#2D2F34]">Ticket Title *</Label>
            <Input
              value={form.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter Title"
              className="w-full h-10 border border-[#E6E6E6] rounded-md px-4 text-sm"
              required
            />
          </div>

          {/* Requester and Department Row */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#2D2F34]">Requester</Label>
              <div className="h-10 border border-[#E6E6E6] rounded-md bg-gray-50 flex items-center px-4">
                <span className="text-sm text-gray-600">Current User (Auto-filled)</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#2D2F34]">Department *</Label>
              <Select value={form.department} onValueChange={(value) => handleInputChange('department', value)} required>
                <SelectTrigger className="h-10 border border-[#E6E6E6] rounded-md">
                  <SelectValue placeholder="Select Department" />
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
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#2D2F34]">Category *</Label>
              <Select value={form.category} onValueChange={(value) => handleInputChange('category', value)} required>
                <SelectTrigger className="h-10 border border-[#E6E6E6] rounded-md">
                  <SelectValue placeholder="Select Category" />
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
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#2D2F34]">Sub-Category *</Label>
              <Select 
                value={form.subcategory} 
                onValueChange={(value) => handleInputChange('subcategory', value)}
                disabled={!form.category}
                required
              >
                <SelectTrigger className="h-10 border border-[#E6E6E6] rounded-md">
                  <SelectValue placeholder="Select Sub-Category" />
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
            <Label className="text-sm font-medium text-[#2D2F34]">Description *</Label>
            <Textarea
              value={form.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe the issue or request in detail..."
              className="w-full min-h-[100px] border border-[#E6E6E6] rounded-md px-4 py-3 text-sm resize-none"
              required
            />
          </div>
          </div>
        </div>

        {/* Assignment & Communication Section */}
        <div className="space-y-0">
          <div className="bg-[#F3F4FF] py-2.5 pl-0 pr-6" style={{ height: '40px' }}>
            <h3 className="text-[#595959] pl-3" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: '16px', lineHeight: '1.21' }}>Assignment & Communication</h3>
          </div>
          <div className="bg-[#fafafa] pl-0 pr-6 pb-6 pt-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#2D2F34]">Assignee *</Label>
              <div className="relative">
                <Select value={form.assignee} onValueChange={(value) => handleInputChange('assignee', value)} required>
                  <SelectTrigger className="h-10 border border-[#E6E6E6] rounded-md pl-10">
                    <SelectValue placeholder="Select Assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.display_name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <UserPlus className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#6E72FF]" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#2D2F34]">Watchers</Label>
              <Select value={form.watchers} onValueChange={(value) => handleInputChange('watchers', value)}>
                <SelectTrigger className="h-10 border border-[#E6E6E6] rounded-md">
                  <SelectValue placeholder="Add Watchers" />
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

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#2D2F34]">Target Due Date *</Label>
              <Select value={form.targetDueDate} onValueChange={(value) => handleInputChange('targetDueDate', value)} required>
                <SelectTrigger className="h-10 border border-[#E6E6E6] rounded-md">
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
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#2D2F34]">Priority *</Label>
              <Select value={form.priority} onValueChange={(value) => handleInputChange('priority', value)} required>
                <SelectTrigger className="h-10 border border-[#E6E6E6] rounded-md">
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

          <div className="space-y-2">
            <Label className="text-sm font-medium text-[#2D2F34]">Status</Label>
            <Select value={form.status} onValueChange={(value) => handleInputChange('status', value)}>
              <SelectTrigger className="h-10 border border-[#E6E6E6] rounded-md">
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
          </div>
        </div>

        {/* Associated Project Section */}
        <div className="space-y-0">
          <div className="bg-[#F3F4FF] py-2.5 pl-0 pr-6" style={{ height: '40px' }}>
            <h3 className="text-[#595959] pl-3" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: '16px', lineHeight: '1.21' }}>Associated Project</h3>
          </div>
          <div className="bg-[#fafafa] pl-0 pr-6 pb-6 pt-4">
          <div className="space-y-2">
            <div className="relative">
              <Input
                value={form.associatedProject}
                onChange={(e) => handleInputChange('associatedProject', e.target.value)}
                placeholder="Link to a project"
                className="w-full h-10 border border-[#E6E6E6] rounded-md pl-10 pr-10"
              />
              <Link2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#6E72FF]" />
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#717171]" />
            </div>
          </div>
          </div>
        </div>

        {/* Timeline & Priority Section */}
        <div className="space-y-0">
          <div className="bg-[#F3F4FF] py-2.5 pl-0 pr-6" style={{ height: '40px' }}>
            <h3 className="text-[#595959] pl-3" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: '16px', lineHeight: '1.21' }}>Timeline & Priority</h3>
          </div>
          <div className="bg-[#fafafa] pl-0 pr-6 pb-6 pt-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#2D2F34]">Impact</Label>
              <Select value={form.impact} onValueChange={(value) => handleInputChange('impact', value)}>
                <SelectTrigger className="h-10 border border-[#E6E6E6] rounded-md">
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
              <Label className="text-sm font-medium text-[#2D2F34]">Urgency</Label>
              <Select value={form.urgency} onValueChange={(value) => handleInputChange('urgency', value)}>
                <SelectTrigger className="h-10 border border-[#E6E6E6] rounded-md">
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
              <Label className="text-sm font-medium text-[#2D2F34]">Calculated Priority</Label>
              <div className="h-10 border border-[#E6E6E6] rounded-md bg-[#E4E4E4] flex items-center px-4">
                <span className="text-sm text-[#717171]">N/A</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#2D2F34]">SLA Policy</Label>
              <div className="h-10 border border-[#E6E6E6] rounded-md bg-[#E4E4E4] flex items-center px-4">
                <span className="text-sm text-[#717171]">Select impact & urgency for SLA</span>
              </div>
            </div>
          </div>
          </div>
        </div>

        {/* Task Management Section */}
        <div className="space-y-0">
          <div className="bg-[#F3F4FF] py-2.5 pl-0 pr-6" style={{ height: '40px' }}>
            <h3 className="text-[#595959] pl-3" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: '16px', lineHeight: '1.21' }}>Task Management</h3>
          </div>
          <div className="bg-[#fafafa] pl-0 pr-6 pb-6 pt-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-[#2D2F34]">Checklist</Label>
            
            {/* Checklist Items */}
            {draftChecklist.map((item, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-white border border-[#E6E6E6] rounded-md">
                <Square className="w-5 h-5 text-[#717171]" />
                <span className="flex-1 text-sm text-[#717171]">{item}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeChecklistItem(index)}
                  className="w-6 h-6 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
            
            {/* Add New Checklist Item */}
            <div className="flex items-center gap-3 p-3 bg-white border border-[#E6E6E6] rounded-md">
              <Square className="w-5 h-5 text-[#717171]" />
              <Input
                value={newChecklistItem}
                onChange={(e) => setNewChecklistItem(e.target.value)}
                placeholder="Gather user requirements"
                className="flex-1 border-0 focus:ring-0 text-sm"
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
                className="w-6 h-6 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <Button
              type="button"
              onClick={addChecklistItem}
              className="w-full h-9 bg-[#6E72FF] text-white text-sm font-medium rounded-md hover:bg-[#6E72FF]/90"
            >
              Add Item
            </Button>
          </div>
          </div>
        </div>

        {/* Custom Fields Section */}
        {customColumns && customColumns.length > 0 && (
          <div className="space-y-0">
            <div className="bg-[#F3F4FF] py-2.5 pl-0 pr-6" style={{ height: '40px' }}>
              <h3 className="text-[#595959] pl-3" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: '16px', lineHeight: '1.21' }}>Custom Fields</h3>
            </div>
            <div className="bg-[#fafafa] pl-0 pr-6 pb-6 pt-4">
              <div className="space-y-4">
                {customColumns
                  .filter(column => column.visible !== false) // Only show visible columns
                  .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)) // Sort by sort_order
                  .map((column) => (
                    <div key={column.id} className="space-y-2">
                      <Label className="text-sm font-medium text-[#2D2F34]">
                        {column.title}
                        {column.defaultValue && (
                          <span className="text-xs text-gray-500 ml-1">(Default: {column.defaultValue})</span>
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
        <div className="p-6 bg-[#fafafa]">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2 px-3 py-2 border-b-2 border-[#6E72FF]">
              <span className="text-sm font-semibold text-[#6E72FF]">Internal Only</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2">
              <Mail className="w-4 h-4 text-[#717171]" />
              <span className="text-sm text-[#717171]">Email</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2">
              <div className="w-4 h-4 bg-[#E01E5A] rounded flex items-center justify-center">
                <span className="text-xs text-white font-bold">S</span>
              </div>
              <span className="text-sm text-[#717171]">Slack</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2">
              <div className="w-4 h-4 bg-[#5059C9] rounded flex items-center justify-center">
                <span className="text-xs text-white font-bold">M</span>
              </div>
              <span className="text-sm text-[#717171]">Microsoft Teams</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-[#2D2F34]">Staff-only Comments</Label>
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add internal notes visible only to your team. Use rich text for better formatting."
              className="w-full min-h-[100px] border border-[#E6E6E6] rounded-md px-4 py-3 text-sm resize-none"
            />
          </div>

          {/* File Upload */}
          <div className="mt-4 p-4 border-2 border-dashed border-[#A0A8C2] rounded-lg text-center">
            <Button
              type="button"
              className="h-9 bg-[#6E72FF] text-white text-sm font-medium rounded-md hover:bg-[#6E72FF]/90 mb-2"
            >
              <Upload className="w-4 h-4 mr-2" />
              Choose File
            </Button>
            <p className="text-sm text-[#717171]">Drag and drop files here, or click to upload</p>
          </div>
        </div>

        {/* AI & Automation Section */}
        <div className="space-y-0">
          <div className="bg-[#F3F4FF] py-2.5 pl-0 pr-6" style={{ height: '40px' }}>
            <h3 className="text-[#595959] pl-3" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: '16px', lineHeight: '1.21' }}>AI & Automation</h3>
          </div>
          <div className="bg-[#fafafa] pl-0 pr-6 pb-6 pt-4">
          <div className="space-y-2 mb-4">
            <Label className="text-sm font-medium text-[#2D2F34]">Suggested Solutions</Label>
            <div className="p-4 bg-white border border-[#E6E6E6] rounded-md">
              <p className="text-sm text-[#717171] leading-relaxed">
                Based on the category, potential solutions might include:<br/>
                • Refer to knowledge base article KB-203.<br/>
                • Verify network connectivity.<br/>
                • Restart relevant services.<br/>
                <span className="text-xs">(AI-generated suggestions)</span>
              </p>
            </div>
          </div>

          <div className="p-4 bg-white border border-[#DEE3ED] rounded-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#6E72FF] rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[#202020]">Auto-Assign via AI</span>
                  </div>
                  <p className="text-sm text-[#717171]">Allow AI to intelligently assign this ticket to the most suitable agent.</p>
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
            className="w-full h-9 bg-[#6E72FF] text-white text-sm font-medium rounded-md hover:bg-[#6E72FF]/90 mt-4"
          >
            Generate AI Summary
          </Button>
          </div>
        </div>

        </form>
      </div>

      {/* Action Buttons - Fixed at bottom */}
      <div className="flex justify-end gap-3 p-6 border-t border-[#E6E6E6] flex-shrink-0 bg-white">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="h-9 px-4 text-sm font-medium border border-[#000000] text-[#000000] hover:bg-gray-50"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          onClick={handleSubmit}
          className="h-9 px-4 bg-[#6E72FF] text-white text-sm font-medium rounded-md hover:bg-[#6E72FF]/90"
        >
          {isSubmitting ? "Creating..." : "Create Ticket"}
        </Button>
      </div>
    </div>
  )
}
