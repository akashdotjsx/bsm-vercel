"use client"

import { useState } from "react"
import { useMode } from "@/lib/contexts/mode-context"
import { useAuth } from "@/lib/contexts/auth-context"
import { 
  useServiceCategoriesQuery,
  useCreateServiceCategoryMutation,
  useCreateServiceMutation,
  useUpdateServiceMutation,
  useDeleteServiceMutation,
  useUpdateServiceCategoryMutation,
  useDeleteServiceCategoryMutation
} from "@/hooks/queries/use-service-categories-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Laptop,
  Shield,
  Users,
  DollarSign,
  Scale,
  Building,
  Search,
  Clock,
  Star,
  ArrowRight,
  FileText,
  Settings,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  BarChart3,
  Building2,
  Ticket,
  Workflow,
  Monitor,
  BookOpen,
  TrendingUp,
  Bell,
  Zap,
  CheckCircle,
  Calendar,
  Layers,
} from "lucide-react"
import { categoryIconMap, getBgColorClass, getStarRating, formatSLA } from "@/lib/utils/icon-map"
import { useToast } from "@/components/ui/use-toast"
import dynamic from "next/dynamic"

const ServiceCategoryDrawer = dynamic(
  () => import("@/components/services/service-category-drawer"),
  { ssr: false }
)

const ServiceCreateDrawer = dynamic(
  () => import("@/components/services/service-create-drawer"),
  { ssr: false }
)

export function ServiceCatalog() {
  const { mode } = useMode()
  const { toast } = useToast()
  const { organization, loading: authLoading } = useAuth()
  
  // Use React Query hooks instead of manual state management
  const { 
    data: categories = [], 
    isLoading: loading, 
    isFetching,
    error 
  } = useServiceCategoriesQuery({ is_active: true })
  
  // Mutations with automatic cache invalidation
  const createCategoryMutation = useCreateServiceCategoryMutation()
  const createServiceMutation = useCreateServiceMutation()
  const updateServiceMutation = useUpdateServiceMutation()
  const deleteServiceMutation = useDeleteServiceMutation()
  const updateServiceCategoryMutation = useUpdateServiceCategoryMutation()
  const deleteServiceCategoryMutation = useDeleteServiceCategoryMutation()
  
  // Debug: Log organization state
  console.log('🔍 ServiceCatalog - Organization:', organization)
  console.log('🔍 ServiceCatalog - Organization ID:', organization?.id)
  console.log('🔍 ServiceCatalog - Auth Loading:', authLoading)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("popularity")

  // Convert Supabase categories to the expected format and sort alphabetically
  const services = categories
    .map(cat => {
      const IconComponent = categoryIconMap[cat.icon || 'settings'] || Settings
      return {
        id: cat.id,
        name: cat.name,
        description: cat.description || "",
        icon: IconComponent,
        color: getBgColorClass(cat.color || 'blue'),
        services: (cat.services || [])
          .map(service => ({
            name: service.name,
            description: service.description || "",
            sla: service.estimated_delivery_days ? formatSLA(service.estimated_delivery_days) : "TBD",
            popularity: service.popularity_score || 1
          }))
          .sort((a, b) => a.name.localeCompare(b.name)) // Sort services alphabetically
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name)) // Sort categories alphabetically
  
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false)
  const [showAddServiceModal, setShowAddServiceModal] = useState(false)
  // New drawer states (TicketDrawer-style)
  const [showCategoryDrawer, setShowCategoryDrawer] = useState(false)
  const [showServiceDrawer, setShowServiceDrawer] = useState(false)
  const [showEditServiceModal, setShowEditServiceModal] = useState(false)
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false)
  const [showDeleteCategoryDialog, setShowDeleteCategoryDialog] = useState(false)
  const [showDeleteServiceDialog, setShowDeleteServiceDialog] = useState(false)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [selectedCategoryForService, setSelectedCategoryForService] = useState("")
  const [selectedCategoryForEdit, setSelectedCategoryForEdit] = useState(null)
  const [selectedServiceForEdit, setSelectedServiceForEdit] = useState(null)
  const [selectedService, setSelectedService] = useState(null)
  const [deleteServiceChecked, setDeleteServiceChecked] = useState(false)
  const [deleteCategoryChecked, setDeleteCategoryChecked] = useState(false)
  const [selectedServiceCategory, setSelectedServiceCategory] = useState(null)
  const [newCategory, setNewCategory] = useState({ name: "", description: "", color: "bg-blue-500" })
  const [newService, setNewService] = useState({ name: "", description: "", sla: "", popularity: 3 })
  const [requestForm, setRequestForm] = useState({
    requestName: "",
    priority: "Medium",
    description: "",
    justification: "",
    urgency: "Normal",
    expectedDelivery: "",
    additionalRequirements: "",
    approverEmail: "",
    costCenter: "",
    department: "",
  })

  const handleAddCategory = async () => {
    try {
      console.log('🎯 handleAddCategory - Organization:', organization)
      console.log('🎯 handleAddCategory - Organization ID:', organization?.id)
      console.log('🎯 handleAddCategory - Type of organization:', typeof organization)
      console.log('🎯 handleAddCategory - Auth loading:', authLoading)
      
      // Wait for auth to finish loading
      if (authLoading) {
        toast({
          title: "Loading",
          description: "Please wait while we load your account information...",
        })
        return
      }
      
      if (!organization || !organization.id) {
        console.error('❌ Organization ID is missing!', { organization, id: organization?.id })
        toast({
          title: "Authentication Required",
          description: "Please ensure you're logged in with a valid organization.",
          variant: "destructive",
        })
        return
      }
      
      const orgId = String(organization.id) // Ensure it's a string
      console.log('✅ Creating category with organization_id:', orgId)
      
      // Remove "bg-" prefix from color if present (Tailwind class to color name)
      const colorValue = newCategory.color.replace(/^bg-/, '').replace(/-\d+$/, '') // "bg-blue-500" -> "blue"
      
      const categoryData = {
        name: newCategory.name,
        description: newCategory.description || "",
        icon: "Settings",
        color: colorValue,
        is_active: true,
        organization_id: orgId
      }
      
      console.log('📤 Sending category data:', JSON.stringify(categoryData, null, 2))
      
      // Use React Query mutation - NO refetch needed!
      await createCategoryMutation.mutateAsync(categoryData)
      
      setNewCategory({ name: "", description: "", color: "bg-blue-500" })
      setShowAddCategoryModal(false)
      
      toast({
        title: "Category created",
        description: `"${newCategory.name}" has been added successfully.`,
      })
    } catch (error) {
      console.error("Error adding category:", error)
      toast({
        title: "Failed to create category",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      })
    }
  }

  const handleAddService = async () => {
    if (!newService.name || !selectedCategoryForService) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    try {
      if (!organization?.id) {
        toast({
          title: "Error",
          description: "Organization ID is missing. Please ensure you're logged in.",
          variant: "destructive",
        })
        return
      }
      
      const serviceData = {
        name: newService.name,
        description: newService.description || "",
        category_id: selectedCategoryForService,
        estimated_delivery_days: newService.sla ? parseInt(newService.sla.replace(/\D/g, '')) || 3 : 3,
        popularity_score: newService.popularity,
        is_requestable: true,
        requires_approval: false,
        status: 'active',
        organization_id: organization.id
      }

      // Use React Query mutation - NO refetch needed!
      await createServiceMutation.mutateAsync(serviceData)
      
      // Reset form and close modal
      const serviceName = newService.name
      setNewService({ name: "", description: "", sla: "", popularity: 3 })
      setSelectedCategoryForService("")
      setShowAddServiceModal(false)
      
      toast({
        title: "Service created",
        description: `"${serviceName}" has been added successfully.`,
      })
    } catch (error) {
      console.error('Error adding service:', error)
      toast({
        title: "Failed to create service",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      })
    }
  }

  const handleEditService = () => {
    // TODO: Implement service update via API
    setShowEditServiceModal(false)
  }

  const handleEditCategory = (category) => {
    setSelectedCategoryForEdit(category)
    setNewCategory({
      name: category.name,
      description: category.description,
      color: category.color
    })
    // Open drawer in edit mode
    setShowCategoryDrawer(true)
  }

  const handleDeleteCategory = (category) => {
    setSelectedCategoryForEdit(category)
    setShowDeleteCategoryDialog(true)
  }

  const handleEditServiceClick = (service, category) => {
    // Find the original service from categories data to get the real ID
    const originalCategory = categories.find(cat => cat.id === category.id)
    const originalService = originalCategory?.services?.find(s => s.name === service.name)
    
    const svc = originalService || service
    setSelectedServiceForEdit(svc)
    setSelectedCategoryForService(category.id)
    setNewService({
      name: svc.name,
      description: svc.description,
      sla: service.sla,
      popularity: service.popularity
    })
    // Open drawer in edit mode
    setShowServiceDrawer(true)
  }

  const handleDeleteService = (service, category) => {
    // Find the original service from categories data to get the real ID
    const originalCategory = categories.find(cat => cat.id === category.id)
    const originalService = originalCategory?.services?.find(s => s.name === service.name)
    
    setSelectedServiceForEdit(originalService || service)
    setSelectedCategoryForEdit(category)
    setShowDeleteServiceDialog(true)
  }

  const handleUpdateCategory = async () => {
    if (!selectedCategoryForEdit) return
    
    try {
      // Use React Query mutation - NO refetch needed!
      await updateServiceCategoryMutation.mutateAsync({
        id: selectedCategoryForEdit.id,
        name: newCategory.name,
        description: newCategory.description,
        color: newCategory.color,
        icon: "Settings"
      })
      
      const categoryName = newCategory.name
      setShowEditCategoryModal(false)
      setSelectedCategoryForEdit(null)
      setNewCategory({ name: "", description: "", color: "bg-blue-500" })
      
      toast({
        title: "Category updated",
        description: `"${categoryName}" has been updated successfully.`,
      })
    } catch (error) {
      console.error('Error updating category:', error)
      toast({
        title: "Failed to update category",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      })
    }
  }

  const handleConfirmDeleteCategory = async () => {
    if (!selectedCategoryForEdit) return
    if (!deleteCategoryChecked) return // Require checkbox to be checked
    
    const categoryName = selectedCategoryForEdit.name
    const serviceCount = selectedCategoryForEdit.services?.length || 0
    
    try {
      // Use React Query mutation
      await deleteServiceCategoryMutation.mutateAsync(selectedCategoryForEdit.id)
      
      // Close dialog and reset state
      setShowDeleteCategoryDialog(false)
      setSelectedCategoryForEdit(null)
      setDeleteCategoryChecked(false)
      
      toast({
        title: "Category deleted",
        description: serviceCount > 0 
          ? `"${categoryName}" and ${serviceCount} service${serviceCount === 1 ? '' : 's'} have been deleted.`
          : `"${categoryName}" has been deleted.`,
      })
    } catch (error) {
      console.error('Error deleting category:', error)
      toast({
        title: "Failed to delete category",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateService = async () => {
    if (!selectedServiceForEdit || !selectedServiceForEdit.id) return
    
    try {
      // Use React Query mutation - NO refetch needed!
      await updateServiceMutation.mutateAsync({
        id: selectedServiceForEdit.id,
        name: newService.name,
        description: newService.description,
        estimated_delivery_days: newService.sla ? parseInt(newService.sla.replace(/\D/g, '')) || 3 : 3,
        popularity_score: newService.popularity
      })
      
      const serviceName = newService.name
      setShowEditServiceModal(false)
      setSelectedServiceForEdit(null)
      setNewService({ name: "", description: "", sla: "", popularity: 3 })
      toast({
        title: "Service updated",
        description: `"${serviceName}" has been updated successfully.`,
      })
    } catch (error) {
      console.error('Error updating service:', error)
      toast({
        title: "Failed to update service",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      })
    }
  }

  const handleConfirmDeleteService = async () => {
    if (!selectedServiceForEdit || !selectedServiceForEdit.id) return
    if (!deleteServiceChecked) return // Require checkbox to be checked
    
    const serviceName = selectedServiceForEdit.name
    
    try {
      // Use React Query mutation
      await deleteServiceMutation.mutateAsync(selectedServiceForEdit.id)
      
      // Close dialog and reset state
      setShowDeleteServiceDialog(false)
      setSelectedServiceForEdit(null)
      setDeleteServiceChecked(false)
      
      toast({
        title: "Service deleted",
        description: `"${serviceName}" has been deleted successfully.`,
      })
    } catch (error) {
      console.error('Error deleting service:', error)
      toast({
        title: "Failed to delete service",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      })
    }
  }

  const handleServiceRequest = () => {
    console.log("[v0] Service request submitted:", {
      service: selectedService,
      category: selectedServiceCategory,
      requestName: requestForm.requestName,
      priority: requestForm.priority,
      description: requestForm.description,
      justification: requestForm.justification,
      urgency: requestForm.urgency,
      expectedDelivery: requestForm.expectedDelivery,
      additionalRequirements: requestForm.additionalRequirements,
      approverEmail: requestForm.approverEmail,
      costCenter: requestForm.costCenter,
      department: requestForm.department,
    })
    setRequestForm({
      requestName: "",
      priority: "Medium",
      description: "",
      justification: "",
      urgency: "Normal",
      expectedDelivery: "",
      additionalRequirements: "",
      approverEmail: "",
      costCenter: "",
      department: "",
    })
    setShowRequestModal(false)
  }

  const filteredServices = services.filter((category) => {
    if (selectedCategory !== "all" && category.id !== selectedCategory) return false
    if (searchTerm) {
      return (
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.services.some(
          (service) =>
            service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            service.description.toLowerCase().includes(searchTerm.toLowerCase()),
        )
      )
    }
    return true
  })

  // Show loading state only on initial load, not during refetches
  if (loading && categories.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-12" />
                </div>
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Show error state
  if (error && !categories.length) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          Error loading service catalog: {error}
        </div>
        <Button onClick={refetch} variant="outline">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          {/* Removed duplicate header - title and description are now handled by PlatformLayout */}
        </div>
          <Button className="bg-blue-600 text-white hover:bg-blue-700" onClick={() => { setSelectedCategoryForEdit(null); setShowCategoryDrawer(true) }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search categories and services..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-muted/50 border-gray-200 rounded-lg"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground">Total Services</p>
              <p className="text-[13px] font-bold text-foreground">{services.reduce((acc, cat) => acc + cat.services.length, 0)}</p>
            </div>
            <Building2 className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground">Active Services</p>
              <p className="text-[13px] font-bold text-foreground">{services.reduce((acc, cat) => acc + cat.services.length, 0)}</p>
            </div>
            <Settings className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground">Service Owners</p>
              <p className="text-[13px] font-bold text-foreground">{services.length}</p>
            </div>
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground">Categories</p>
              <p className="text-[13px] font-bold text-foreground">{services.length}</p>
            </div>
            <Layers className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>
      </div>

      {/* Drawers (TicketDrawer-style) */}
      <ServiceCategoryDrawer
        isOpen={showCategoryDrawer}
        onClose={() => setShowCategoryDrawer(false)}
        onSubmit={async (payload) => {
          try {
            if (selectedCategoryForEdit) {
              await updateServiceCategoryMutation.mutateAsync({
                id: selectedCategoryForEdit.id,
                name: payload.name,
                description: payload.description,
                icon: payload.icon,
                color: payload.color,
              })
              toast({ title: "Category updated", description: `"${payload.name}" has been updated.` })
            } else {
              // Ensure organization_id is available
              if (!organization?.id) {
                toast({ 
                  title: "Authentication Required", 
                  description: "Please ensure you're logged in with a valid organization.", 
                  variant: "destructive" 
                })
                return
              }
              
              await createCategoryMutation.mutateAsync({
                name: payload.name,
                description: payload.description || "",
                icon: payload.icon || "Settings",
                color: payload.color || "bg-blue-500",
                is_active: true,
                organization_id: organization.id
              })
              toast({ title: "Category created", description: `"${payload.name}" has been added successfully.` })
            }
          } catch (e) {
            toast({ title: selectedCategoryForEdit ? "Failed to update category" : "Failed to create category", description: e instanceof Error ? e.message : "Unexpected error", variant: "destructive" })
          }
        }}
        title={selectedCategoryForEdit ? "Edit Category" : "Create Category"}
      />
      <ServiceCreateDrawer
        isOpen={showServiceDrawer}
        onClose={() => setShowServiceDrawer(false)}
        initial={selectedServiceForEdit ? {
          name: selectedServiceForEdit.name,
          description: selectedServiceForEdit.description,
          estimated_delivery_days: selectedServiceForEdit.estimated_delivery_days ? `${selectedServiceForEdit.estimated_delivery_days} days` : "",
          popularity_score: selectedServiceForEdit.popularity_score || 3,
          category_id: selectedServiceForEdit.category_id
        } : undefined}
        onSubmit={async (serviceData) => {
          try {
            if (selectedServiceForEdit && selectedServiceForEdit.id) {
              const updates: any = {
                name: serviceData.name,
                description: serviceData.description,
                estimated_delivery_days: Number(serviceData.estimated_delivery_days) || 3,
                popularity_score: Number(serviceData.popularity_score) || 3,
                is_requestable: !!serviceData.is_requestable,
                requires_approval: !!serviceData.requires_approval,
                category_id: serviceData.category_id || selectedCategoryForService || undefined
              }
              await updateServiceMutation.mutateAsync({
                id: selectedServiceForEdit.id,
                ...updates
              })
              toast({ title: "Service updated", description: `"${serviceData.name}" has been updated.` })
            } else {
              // Ensure organization_id is available
              if (!organization?.id) {
                toast({ 
                  title: "Authentication Required", 
                  description: "Please ensure you're logged in with a valid organization.", 
                  variant: "destructive" 
                })
                return
              }
              
              const payload = {
                name: serviceData.name,
                description: serviceData.description || "",
                category_id: serviceData.category_id || selectedCategoryForService || null,
                estimated_delivery_days: Number(serviceData.estimated_delivery_days) || 3,
                popularity_score: Number(serviceData.popularity_score) || 3,
                is_requestable: !!serviceData.is_requestable,
                requires_approval: !!serviceData.requires_approval,
                status: 'active',
                organization_id: organization.id
              }
              await createServiceMutation.mutateAsync(payload)
              toast({ title: "Service created", description: `"${payload.name}" has been added successfully.` })
            }
          } catch (e) {
            toast({ title: selectedServiceForEdit ? "Failed to update service" : "Failed to create service", description: e instanceof Error ? e.message : "Unexpected error", variant: "destructive" })
          }
        }}
        title={selectedServiceForEdit ? "Edit Service" : "Create Service"}
        categories={categories.map(c => ({ id: c.id, name: c.name }))}
      />

      {/* Service Categories */}
      <div className="space-y-6">
        {filteredServices.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-[11px] text-muted-foreground mb-4">
              {searchTerm ? `No categories found matching "${searchTerm}"` : 'No service categories found.'}
            </div>
            {!searchTerm && (
              <Button onClick={() => setShowAddCategoryModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Category
              </Button>
            )}
          </div>
        ) : (
          filteredServices.map((category) => {
            const Icon = category.icon
            return (
              <Card key={category.id} className="overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-lg ${category.color} text-white flex items-center justify-center`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-[13px] font-semibold text-foreground">{category.name}</h3>
                          <span className="bg-green-100 text-green-700 text-[10px] font-medium px-2 py-0.5 rounded-full">Active</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">{category.description} • Owner: System</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="text-[11px]"
            onClick={() => {
              setSelectedCategoryForEdit(null)
              setSelectedServiceForEdit(null)
              setSelectedCategoryForService(category.id)
              setShowServiceDrawer(true)
            }}
          >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Service
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditCategory(category)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Category
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteCategory(category)} className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Category
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {category.services.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {category.services.map((service, index) => (
                        <div key={index} className="p-4 border border-gray-200 rounded-lg hover:shadow-md hover:border-border transition-all cursor-pointer 0">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-semibold text-[13px] text-foreground mb-1.5">{service.name}</h4>
                                <p className="text-[11px] text-muted-foreground leading-relaxed">{service.description}</p>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 -mt-1">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEditServiceClick(service, category)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Service
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDeleteService(service, category)} className="text-red-600">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Service
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-border">
                              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                <Clock className="h-3.5 w-3.5" />
                                <span>{service.sla}</span>
                              </div>
                              <div className="flex items-center gap-0.5">
                                {Array.from({ length: service.popularity }).map((_, i) => (
                                  <span key={i} className="text-yellow-400 text-sm">
                                    ★
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-[11px] text-muted-foreground">
                      No services in this category yet. Click "Add Service" to get started.
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Add Category Modal */}
      <Dialog open={showAddCategoryModal} onOpenChange={setShowAddCategoryModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Service Category</DialogTitle>
            <DialogDescription className="text-[13px]">
              Create a new service category to organize your services.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="category-name" className="text-[13px]">
                Category Name
              </Label>
              <Input
                id="category-name"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                placeholder="e.g., IT Services"
                className="text-[13px]"
              />
            </div>
            <div>
              <Label htmlFor="category-description" className="text-[13px]">
                Description
              </Label>
              <Textarea
                id="category-description"
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                placeholder="Brief description of the category"
                className="text-[13px]"
              />
            </div>
            <div>
              <Label htmlFor="category-color" className="text-[13px]">
                Color
              </Label>
              <Select
                value={newCategory.color}
                onValueChange={(value) => setNewCategory({ ...newCategory, color: value })}
              >
                <SelectTrigger className="text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bg-blue-500">Blue</SelectItem>
                  <SelectItem value="bg-green-500">Green</SelectItem>
                  <SelectItem value="bg-yellow-500">Yellow</SelectItem>
                  <SelectItem value="bg-purple-500">Purple</SelectItem>
                  <SelectItem value="bg-red-500">Red</SelectItem>
                  <SelectItem value="bg-orange-500">Orange</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddCategory} className="text-[13px]">
              Add Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Service Modal */}
      <Dialog open={showAddServiceModal} onOpenChange={setShowAddServiceModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Service</DialogTitle>
            <DialogDescription className="text-[13px]">
              Create a new service in the selected category.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="service-name" className="text-[13px]">
                Service Name
              </Label>
              <Input
                id="service-name"
                value={newService.name}
                onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                placeholder="e.g., Email Setup"
                className="text-[13px]"
              />
            </div>
            <div>
              <Label htmlFor="service-description" className="text-[13px]">
                Description
              </Label>
              <Textarea
                id="service-description"
                value={newService.description}
                onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                placeholder="Brief description of the service"
                className="text-[13px]"
              />
            </div>
            <div>
              <Label htmlFor="service-sla" className="text-[13px]">
                SLA (Service Level Agreement)
              </Label>
              <Input
                id="service-sla"
                value={newService.sla}
                onChange={(e) => setNewService({ ...newService, sla: e.target.value })}
                placeholder="e.g., 2 business days"
                className="text-[13px]"
              />
            </div>
            <div>
              <Label htmlFor="service-popularity" className="text-[13px]">
                Popularity (1-5 stars)
              </Label>
              <Select
                value={newService.popularity.toString()}
                onValueChange={(value) => setNewService({ ...newService, popularity: parseInt(value) })}
              >
                <SelectTrigger className="text-[13px]">
                  <SelectValue />
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
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowAddServiceModal(false)}
              className="text-[13px]"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddService} 
              className="text-[13px]"
              disabled={!newService.name.trim()}
            >
              Add Service
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Modal */}
      <Dialog open={showEditCategoryModal} onOpenChange={setShowEditCategoryModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Service Category</DialogTitle>
            <DialogDescription className="text-[13px]">
              Update the service category information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-category-name" className="text-[13px]">
                Category Name
              </Label>
              <Input
                id="edit-category-name"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                placeholder="e.g., IT Services"
                className="text-[13px]"
              />
            </div>
            <div>
              <Label htmlFor="edit-category-description" className="text-[13px]">
                Description
              </Label>
              <Textarea
                id="edit-category-description"
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                placeholder="Brief description of the category"
                className="text-[13px]"
              />
            </div>
            <div>
              <Label htmlFor="edit-category-color" className="text-[13px]">
                Color
              </Label>
              <Select
                value={newCategory.color}
                onValueChange={(value) => setNewCategory({ ...newCategory, color: value })}
              >
                <SelectTrigger className="text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bg-blue-500">Blue</SelectItem>
                  <SelectItem value="bg-green-500">Green</SelectItem>
                  <SelectItem value="bg-yellow-500">Yellow</SelectItem>
                  <SelectItem value="bg-purple-500">Purple</SelectItem>
                  <SelectItem value="bg-red-500">Red</SelectItem>
                  <SelectItem value="bg-orange-500">Orange</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditCategoryModal(false)} className="text-[13px]">
              Cancel
            </Button>
            <Button onClick={handleUpdateCategory} className="text-[13px]">
              Update Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Modal */}
      <Dialog open={showDeleteCategoryDialog} onOpenChange={(open) => {
        setShowDeleteCategoryDialog(open)
        if (!open) setDeleteCategoryChecked(false)
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20">
                <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              Delete Category
            </DialogTitle>
            <DialogDescription className="text-base">
              {(() => {
                const serviceCount = selectedCategoryForEdit?.services?.length || 0
                if (serviceCount > 0) {
                  return `This category contains ${serviceCount} service${serviceCount === 1 ? '' : 's'}. Do you want to delete category "${selectedCategoryForEdit?.name}"?`
                }
                return `Do you want to delete category "${selectedCategoryForEdit?.name}"?`
              })()}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center space-x-3 py-4">
            <Checkbox
              id="delete-category-confirm"
              checked={deleteCategoryChecked}
              onCheckedChange={(checked) => setDeleteCategoryChecked(checked as boolean)}
              className="border-2 border-muted-foreground data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
            />
            <Label
              htmlFor="delete-category-confirm"
              className="text-base font-medium text-foreground cursor-pointer select-none"
            >
              Click to Agree
            </Label>
          </div>
          
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteCategoryDialog(false)}
              disabled={deleteServiceCategoryMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDeleteCategory}
              disabled={deleteServiceCategoryMutation.isPending || !deleteCategoryChecked}
            >
              {deleteServiceCategoryMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Service Modal */}
      <Dialog open={showEditServiceModal} onOpenChange={setShowEditServiceModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
            <DialogDescription className="text-[13px]">
              Update the service information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-service-name" className="text-[13px]">
                Service Name
              </Label>
              <Input
                id="edit-service-name"
                value={newService.name}
                onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                placeholder="e.g., Email Setup"
                className="text-[13px]"
              />
            </div>
            <div>
              <Label htmlFor="edit-service-description" className="text-[13px]">
                Description
              </Label>
              <Textarea
                id="edit-service-description"
                value={newService.description}
                onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                placeholder="Brief description of the service"
                className="text-[13px]"
              />
            </div>
            <div>
              <Label htmlFor="edit-service-sla" className="text-[13px]">
                SLA (Service Level Agreement)
              </Label>
              <Input
                id="edit-service-sla"
                value={newService.sla}
                onChange={(e) => setNewService({ ...newService, sla: e.target.value })}
                placeholder="e.g., 2 business days"
                className="text-[13px]"
              />
            </div>
            <div>
              <Label htmlFor="edit-service-popularity" className="text-[13px]">
                Popularity (1-5 stars)
              </Label>
              <Select
                value={newService.popularity.toString()}
                onValueChange={(value) => setNewService({ ...newService, popularity: parseInt(value) })}
              >
                <SelectTrigger className="text-[13px]">
                  <SelectValue />
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditServiceModal(false)} className="text-[13px]">
              Cancel
            </Button>
            <Button onClick={handleUpdateService} className="text-[13px]">
              Update Service
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Service Modal */}
      <Dialog open={showDeleteServiceDialog} onOpenChange={(open) => {
        setShowDeleteServiceDialog(open)
        if (!open) setDeleteServiceChecked(false)
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20">
                <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              Delete Service
            </DialogTitle>
            <DialogDescription className="text-base">
              Do you want to delete service "{selectedServiceForEdit?.name}"?
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center space-x-3 py-4">
            <Checkbox
              id="delete-service-confirm"
              checked={deleteServiceChecked}
              onCheckedChange={(checked) => setDeleteServiceChecked(checked as boolean)}
              className="border-2 border-muted-foreground data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
            />
            <Label
              htmlFor="delete-service-confirm"
              className="text-base font-medium text-foreground cursor-pointer select-none"
            >
              Click to Agree
            </Label>
          </div>
          
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteServiceDialog(false)}
              disabled={deleteServiceMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDeleteService}
              disabled={deleteServiceMutation.isPending || !deleteServiceChecked}
            >
              {deleteServiceMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
