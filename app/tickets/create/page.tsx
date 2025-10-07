"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  X,
  CalendarIcon,
  User,
  Tag,
  Link2,
  Paperclip,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  ImageIcon,
  Bot,
  ChevronRight,
  Sparkles,
  Copy,
  MessageSquare,
  Plus,
  Check,
  Clock,
  AlertCircle,
  Save,
  Send,
  Upload,
  FileText,
  Users,
  Settings,
  History,
  CheckSquare,
  Square,
  Trash2,
  Edit,
} from "lucide-react"
import { PlatformLayout } from "@/components/layout/platform-layout"
import { format } from "date-fns"
import { useTickets, useTicketChecklist, useTicketComments, useTicketAttachments, useProfiles } from "@/hooks/use-tickets"
import { CreateTicketData } from "@/lib/api/tickets"
import { ServiceCategory, Service } from "@/lib/types/services"
import { useMode } from "@/lib/contexts/mode-context"
import { useServiceCategories } from "@/lib/hooks/use-service-categories"
import { categoryIconMap, getBgColorClass, formatSLA } from "@/lib/utils/icon-map"
import { useState as useTeamsState, useEffect as useTeamsEffect } from "react"
import { createClient } from '@/lib/supabase/client'

export default function CreateTicketPage() {
  // Form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState<"request" | "incident" | "problem" | "change" | "task">("request")
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "critical" | "urgent">("medium")
  const [urgency, setUrgency] = useState<"low" | "medium" | "high" | "critical">("medium")
  const [impact, setImpact] = useState<"low" | "medium" | "high" | "critical">("medium")
  const [serviceCategory, setServiceCategory] = useState("")
  const [service, setService] = useState("")
  const [assigneeId, setAssigneeId] = useState("")
  const [teamId, setTeamId] = useState("")
  const [dueDate, setDueDate] = useState<Date>()
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState("")
  const [customFields, setCustomFields] = useState<Record<string, any>>({})
  const [estimatedHours, setEstimatedHours] = useState<number | undefined>()
  const [department, setDepartment] = useState("")
  const [organization, setOrganization] = useState("")
  
  // UI state
  const [activeTab, setActiveTab] = useState("details")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAssigneeSearch, setShowAssigneeSearch] = useState(false)
  const [assigneeSearch, setAssigneeSearch] = useState("")
  // transient validation flags to flash red borders
  const [invalidTitle, setInvalidTitle] = useState(false)
  const [invalidDescription, setInvalidDescription] = useState(false)
  
  // Teams data
  const [teams, setTeams] = useState<Array<{id: string, name: string}>>([])
  const [teamsLoading, setTeamsLoading] = useState(true)
  
  // Organizations and departments data
  const [organizations, setOrganizations] = useState<Array<{id: string, name: string}>>([])
  const [departments, setDepartments] = useState<string[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  
  // Hooks for real data
  const { createTicket } = useTickets()
  const { searchProfiles, profiles, loading: profilesLoading } = useProfiles()
  const { mode } = useMode()
  const { categories: supabaseCategories, loading: categoriesLoading } = useServiceCategories()
  
  // Current user info
  const [currentUser, setCurrentUser] = useState<{id: string, name: string, email: string} | null>(null)
  
  // Convert Supabase categories to the expected format
  const serviceCategories = supabaseCategories.map(cat => {
    const IconComponent = categoryIconMap[cat.icon || 'settings'] || Settings
    return {
      id: cat.id,
      name: cat.name,
      description: cat.description || "",
      icon: IconComponent,
      color: getBgColorClass(cat.color || 'blue'),
      services: (cat.services || []).map(service => ({
        name: service.name,
        description: service.description || "",
        sla: service.estimated_delivery_days ? formatSLA(service.estimated_delivery_days) : "TBD",
        popularity: service.popularity_score || 1
      }))
    }
  })
  
  const selectedCategory = serviceCategories.find(cat => cat.id === serviceCategory)
  const availableServices = selectedCategory?.services || []
  
  // Fetch teams, organizations, and departments
  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient()
        
        // Fetch teams
        const { data: teamsData, error: teamsError } = await supabase
          .from('teams')
          .select('id, name')
          .eq('is_active', true)
          .order('name')
          
        if (teamsError) {
          console.error('Error fetching teams:', teamsError)
        } else {
          setTeams(teamsData || [])
        }
        
        // Fetch organizations
        const { data: orgsData, error: orgsError } = await supabase
          .from('organizations')
          .select('id, name')
          .eq('status', 'active')
          .order('name')
          
        if (orgsError) {
          console.error('Error fetching organizations:', orgsError)
        } else {
          setOrganizations(orgsData || [])
        }
        
        // Fetch unique departments from profiles
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('department')
          .not('department', 'is', null)
          
        if (profilesError) {
          console.error('Error fetching departments:', profilesError)
        } else {
          const uniqueDepts = [...new Set(profilesData?.map(p => p.department).filter(Boolean) || [])]
          setDepartments(uniqueDepts.sort())
        }
        
        // Get current user info
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: userData } = await supabase
            .from('profiles')
            .select('id, display_name, first_name, last_name, email')
            .eq('id', user.id)
            .single()
            
          if (userData) {
            setCurrentUser({
              id: userData.id,
              name: userData.display_name || `${userData.first_name} ${userData.last_name}`.trim() || userData.email,
              email: userData.email
            })
          }
        }
        
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setTeamsLoading(false)
        setDataLoading(false)
      }
    }
    
    fetchData()
  }, [])
  
  // Checklist state
  const [checklistItems, setChecklistItems] = useState<Array<{
    id: string
    text: string
    completed: boolean
    assigneeId?: string
    dueDate?: Date
  }>>([])
  const [newChecklistItem, setNewChecklistItem] = useState("")
  
  // Comments state
  const [comments, setComments] = useState<Array<{
    id: string
    content: string
    isInternal: boolean
    author: { name: string; avatar: string }
    createdAt: Date
  }>>([])
  const [newComment, setNewComment] = useState("")
  const [isInternalComment, setIsInternalComment] = useState(false)
  
  // Attachments state
  const [attachments, setAttachments] = useState<Array<{
    id: string
    name: string
    size: number
    type: string
    url: string
  }>>([])
  const [isUploading, setIsUploading] = useState(false)

  // Handlers
  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleAddChecklistItem = () => {
    if (newChecklistItem.trim()) {
      const newItem = {
        id: Date.now().toString(),
        text: newChecklistItem.trim(),
        completed: false,
      }
      setChecklistItems([...checklistItems, newItem])
      setNewChecklistItem("")
    }
  }

  const handleToggleChecklistItem = (id: string) => {
    setChecklistItems(items =>
      items.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    )
  }

  const handleDeleteChecklistItem = (id: string) => {
    setChecklistItems(items => items.filter(item => item.id !== id))
  }

  const handleAddComment = () => {
    if (newComment.trim()) {
      const comment = {
        id: Date.now().toString(),
        content: newComment.trim(),
        isInternal: isInternalComment,
        author: { name: "Current User", avatar: "CU" },
        createdAt: new Date(),
      }
      setComments([...comments, comment])
      setNewComment("")
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    setIsUploading(true)
    try {
      // In real implementation, upload to Supabase Storage
      for (const file of Array.from(files)) {
        const newAttachment = {
          id: Date.now().toString(),
          name: file.name,
          size: file.size,
          type: file.type,
          url: URL.createObjectURL(file),
        }
        setAttachments(prev => [...prev, newAttachment])
      }
    } catch (error) {
      console.error("Error uploading files:", error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async () => {
    const missingTitle = !title.trim()
    const missingDescription = !description.trim()
    if (missingTitle || missingDescription) {
      // mark invalid and persist until user fixes
      if (missingTitle) {
        setInvalidTitle(true)
      }
      if (missingDescription) {
        setInvalidDescription(true)
      }
      return
    }

    setIsSubmitting(true)
    try {
      const ticketData: CreateTicketData = {
        title: title.trim(),
        description: description.trim(),
        type,
        priority,
        urgency,
        impact,
        category: serviceCategory || undefined,
        subcategory: service || undefined,
        assignee_id: assigneeId || undefined,
        team_id: teamId || undefined,
        due_date: dueDate?.toISOString(),
        tags: tags.length > 0 ? tags : undefined,
        custom_fields: Object.keys(customFields).length > 0 ? {
          ...customFields,
          estimated_hours: estimatedHours,
          department: department,
          organization_name: organizations.find(o => o.id === organization)?.name
        } : {
          estimated_hours: estimatedHours,
          department: department,
          organization_name: organizations.find(o => o.id === organization)?.name
        },
        initial_comments: comments.map((c) => ({ content: c.content, is_internal: c.isInternal })),
        initial_checklist: checklistItems.map((i) => ({
          text: i.text,
          completed: i.completed,
          assignee_id: i.assigneeId,
          due_date: i.dueDate ? i.dueDate.toISOString() : undefined,
        })),
      }

      const newTicket = await createTicket(ticketData)
      console.log("Ticket created:", newTicket)
      
      // Store ticket info for toast notification on tickets page
      localStorage.setItem('newTicketCreated', JSON.stringify({
        ticketNumber: newTicket.ticket_number,
        title: newTicket.title,
        timestamp: Date.now()
      }))
      
      // Redirect back to tickets list page
      window.location.href = `/tickets`
      
    } catch (error) {
      console.error("Error creating ticket:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAssigneeSearch = async (query: string) => {
    setAssigneeSearch(query)
    if (query.length > 2) {
      await searchProfiles(query)
    }
  }

  // Color helpers
  const getTypeColor = (type: string) => {
    switch (type) {
      case "task":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
      case "incident":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
      case "request":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
      case "problem":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
      case "change":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-200 text-red-900 dark:bg-red-900/50 dark:text-red-200"
      case "urgent":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
      case "high":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
    }
  }

  return (
    <PlatformLayout breadcrumb={[{ label: "Tickets", href: "/tickets" }, { label: "Create Ticket" }]}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[16px] font-semibold tracking-tight">Create New Ticket</h1>
            <p className="text-[12px] text-muted-foreground">Create a new support ticket with all necessary details</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => window.history.back()}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Ticket
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[13px]">
                  <FileText className="h-4 w-4" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="title">Title *</Label>
                    {invalidTitle && (
                      <span className="flex items-center text-red-600 text-xs">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        This field is required
                      </span>
                    )}
                  </div>
                  <Input
                    id="title"
                    placeholder="Enter ticket title..."
                    value={title}
                    onChange={(e) => {
                      const v = e.target.value
                      setTitle(v)
                      if (invalidTitle && v.trim() !== '') setInvalidTitle(false)
                    }}
                    className={`text-[12px] ${invalidTitle ? 'border-red-500 ring-2 ring-red-500' : ''}`}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="description">Description *</Label>
                    {invalidDescription && (
                      <span className="flex items-center text-red-600 text-xs">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        This field is required
                      </span>
                    )}
                  </div>
                  <div className={`rounded-lg border ${invalidDescription ? 'border-red-500 ring-2 ring-red-500' : ''}`}>
                    <div className="flex items-center gap-1 p-2 border-b bg-muted/50">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <Bold className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <Italic className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <Underline className="h-3 w-3" />
                      </Button>
                      <div className="w-px h-4 bg-border mx-1" />
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <List className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <ListOrdered className="h-3 w-3" />
                      </Button>
                    </div>
                    <Textarea
                      id="description"
                      placeholder="Describe the issue or request..."
                      value={description}
                      onChange={(e) => {
                        const v = e.target.value
                        setDescription(v)
                        if (invalidDescription && v.trim() !== '') setInvalidDescription(false)
                      }}
                      className="min-h-32 border-0 rounded-t-none focus-visible:ring-0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select value={type} onValueChange={(value: any) => setType(value)}>
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
                    <Label htmlFor="status">Status</Label>
                    <Select value="new" disabled>
                      <SelectTrigger>
                        <SelectValue placeholder="New" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Status will be set to "New" when created</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="urgency">Urgency</Label>
                    <Select value={urgency} onValueChange={(value: any) => setUrgency(value)}>
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
                    <Label htmlFor="impact">Impact</Label>
                    <Select value={impact} onValueChange={(value: any) => setImpact(value)}>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="serviceCategory">Service Category</Label>
                    <Select value={serviceCategory} onValueChange={(value) => {
                      setServiceCategory(value)
                      setService("") // Reset service when category changes
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder={categoriesLoading ? "Loading categories..." : "Select service category"} />
                      </SelectTrigger>
                      <SelectContent>
                        {categoriesLoading ? (
                          <SelectItem value="loading" disabled>
                            Loading categories...
                          </SelectItem>
                        ) : (
                          serviceCategories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="service">Service</Label>
                    <Select 
                      value={service} 
                      onValueChange={setService}
                      disabled={!serviceCategory || categoriesLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          categoriesLoading ? "Loading..." : 
                          serviceCategory ? "Select service" : 
                          "Select category first"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {categoriesLoading ? (
                          <SelectItem value="loading" disabled>
                            Loading services...
                          </SelectItem>
                        ) : availableServices.length === 0 ? (
                          <SelectItem value="no-services" disabled>
                            No services available in this category
                          </SelectItem>
                        ) : (
                          availableServices.map((serviceItem, index) => (
                            <SelectItem key={index} value={serviceItem.name}>
                              <div className="flex flex-col">
                                <span>{serviceItem.name}</span>
                                <span className="text-xs text-muted-foreground">{serviceItem.description}</span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="organization">Organization</Label>
                    <Select value={organization} onValueChange={setOrganization}>
                      <SelectTrigger>
                        <SelectValue placeholder={dataLoading ? "Loading..." : "Select organization"} />
                      </SelectTrigger>
                      <SelectContent>
                        {dataLoading ? (
                          <SelectItem value="loading" disabled>
                            Loading organizations...
                          </SelectItem>
                        ) : (
                          organizations.map((org) => (
                            <SelectItem key={org.id} value={org.id}>
                              {org.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Select value={department} onValueChange={setDepartment}>
                      <SelectTrigger>
                        <SelectValue placeholder={dataLoading ? "Loading..." : "Select department"} />
                      </SelectTrigger>
                      <SelectContent>
                        {dataLoading ? (
                          <SelectItem value="loading" disabled>
                            Loading departments...
                          </SelectItem>
                        ) : (
                          departments.map((dept) => (
                            <SelectItem key={dept} value={dept}>
                              {dept}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                      id="dueDate"
                      type="datetime-local"
                      value={dueDate ? dueDate.toISOString().slice(0, 16) : ""}
                      onChange={(e) => setDueDate(e.target.value ? new Date(e.target.value) : undefined)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="estimatedHours">Estimated Hours</Label>
                    <Input
                      id="estimatedHours"
                      type="number"
                      min="0"
                      step="0.5"
                      placeholder="8"
                      value={estimatedHours || ""}
                      onChange={(e) => setEstimatedHours(e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  </div>
                </div>
                
                {/* Reported By - Read Only */}
                <div className="space-y-2">
                  <Label htmlFor="reportedBy">Reported By</Label>
                  <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                      {currentUser?.name ? currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{currentUser?.name || 'Loading...'}</p>
                      <p className="text-xs text-muted-foreground">{currentUser?.email || ''}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs for additional features */}
            <Card>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="border-b">
                  <TabsList className="h-12 bg-transparent border-0 rounded-none w-full justify-start px-6">
                    <TabsTrigger value="checklist" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none bg-transparent">
                      <CheckSquare className="h-4 w-4 mr-2" />
                      Checklist
                      {checklistItems.length > 0 && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {checklistItems.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="comments" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none bg-transparent">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Comments
                      {comments.length > 0 && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {comments.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="attachments" className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none bg-transparent">
                      <Paperclip className="h-4 w-4 mr-2" />
                      Attachments
                      {attachments.length > 0 && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {attachments.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="checklist" className="p-6 space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add checklist item..."
                      value={newChecklistItem}
                      onChange={(e) => setNewChecklistItem(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleAddChecklistItem()}
                    />
                    <Button onClick={handleAddChecklistItem} disabled={!newChecklistItem.trim()}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {checklistItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleChecklistItem(item.id)}
                          className="h-6 w-6 p-0"
                        >
                          {item.completed ? (
                            <CheckSquare className="h-4 w-4 text-green-600" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </Button>
                        <span className={`flex-1 ${item.completed ? "line-through text-muted-foreground" : ""}`}>
                          {item.text}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteChecklistItem(item.id)}
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="comments" className="p-6 space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="internal-comment"
                        checked={isInternalComment}
                        onCheckedChange={setIsInternalComment}
                      />
                      <Label htmlFor="internal-comment" className="text-sm">
                        Internal comment
                      </Label>
                    </div>
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="min-h-20"
                      />
                      <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {comments.map((comment) => (
                      <div key={comment.id} className="p-3 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium">
                            {comment.author.avatar}
                          </div>
                          <span className="font-medium text-sm">{comment.author.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(comment.createdAt, "MMM d, h:mm a")}
                          </span>
                          {comment.isInternal && (
                            <Badge variant="outline" className="text-xs">
                              Internal
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm">{comment.content}</p>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="attachments" className="p-6 space-y-4">
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Upload files</p>
                      <p className="text-xs text-muted-foreground">
                        Drag and drop files here, or click to select
                      </p>
                      <input
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                      />
                      <Button asChild variant="outline" size="sm">
                        <label htmlFor="file-upload" className="cursor-pointer">
                          <Upload className="h-4 w-4 mr-2" />
                          Choose Files
                        </label>
                      </Button>
                    </div>
                  </div>

                  {attachments.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[11px] font-medium">Attached Files</h4>
                      {attachments.map((attachment) => (
                        <div key={attachment.id} className="flex items-center gap-3 p-2 border rounded-lg">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-medium truncate">{attachment.name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {(attachment.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Assignment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[13px]">
                  <Users className="h-4 w-4" />
                  Assignment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Assignee</Label>
                  <div className="relative">
                    <Input
                      placeholder="Search for assignee..."
                      value={assigneeSearch}
                      onChange={(e) => handleAssigneeSearch(e.target.value)}
                      onFocus={() => setShowAssigneeSearch(true)}
                    />
                    {showAssigneeSearch && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                        {profilesLoading ? (
                          <div className="p-3 text-[11px] text-muted-foreground">Searching...</div>
                        ) : profiles.length > 0 ? (
                          profiles.map((profile) => (
                            <button
                              key={profile.id}
                              className="w-full text-left p-3 hover:bg-muted flex items-center gap-3"
                              onClick={() => {
                                setAssigneeId(profile.id)
                                setShowAssigneeSearch(false)
                                setAssigneeSearch(profile.display_name)
                              }}
                            >
                              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                                {profile.first_name?.[0]}{profile.last_name?.[0]}
                              </div>
                              <div>
                                <p className="font-medium text-[11px]">{profile.display_name}</p>
                                <p className="text-[10px] text-muted-foreground">{profile.email}</p>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="p-3 text-[11px] text-muted-foreground">No users found</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Team</Label>
                  <Select value={teamId} onValueChange={setTeamId}>
                    <SelectTrigger>
                      <SelectValue placeholder={teamsLoading ? "Loading teams..." : "Select team"} />
                    </SelectTrigger>
                    <SelectContent>
                      {teamsLoading ? (
                        <SelectItem value="loading" disabled>
                          Loading teams...
                        </SelectItem>
                      ) : (
                        teams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[13px]">
                  <Tag className="h-4 w-4" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddTag()}
                  />
                  <Button onClick={handleAddTag} disabled={!newTag.trim()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* AI Suggestions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[13px]">
                  <Bot className="h-4 w-4" />
                  AI Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-[11px] font-medium mb-1">Suggested Priority</p>
                  <Badge className={getPriorityColor("medium")}>Medium</Badge>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Based on description analysis
                  </p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-[11px] font-medium mb-1">Recommended Type</p>
                  <Badge className={getTypeColor("request")}>Request</Badge>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Based on keywords detected
                  </p>
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  <Bot className="h-4 w-4 mr-2" />
                  Get AI Help
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PlatformLayout>
  )
}
