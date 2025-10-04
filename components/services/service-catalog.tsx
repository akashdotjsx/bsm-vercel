"use client"

import { useState } from "react"
import { useMode } from "@/lib/contexts/mode-context"
import { useServiceCategories } from "@/lib/hooks/use-service-categories"
import { useServices } from "@/lib/hooks/use-services"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

export function ServiceCatalog() {
  const { mode } = useMode()
  const { categories, loading, error, addCategory, refetch } = useServiceCategories()
  const { addService, updateService, deleteService, loading: serviceLoading, error: serviceError } = useServices()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("popularity")

  // Convert Supabase categories to the expected format
  const services = categories.map(cat => {
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
  
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false)
  const [showAddServiceModal, setShowAddServiceModal] = useState(false)
  const [showEditServiceModal, setShowEditServiceModal] = useState(false)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [selectedCategoryForService, setSelectedCategoryForService] = useState("")
  const [selectedService, setSelectedService] = useState(null)
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
      await addCategory({
        name: newCategory.name,
        description: newCategory.description,
        icon: "Settings",
        color: newCategory.color,
        services: [],
      })
      setNewCategory({ name: "", description: "", color: "bg-blue-500" })
      setShowAddCategoryModal(false)
    } catch (error) {
      console.error("Error adding category:", error)
    }
  }

  const handleAddService = async () => {
    if (!newService.name || !selectedCategoryForService) {
      alert('Please fill in all required fields')
      return
    }

    try {
      const serviceData = {
        name: newService.name,
        description: newService.description,
        category_id: selectedCategoryForService,
        estimated_delivery_days: newService.sla ? parseInt(newService.sla.replace(/\D/g, '')) || 3 : 3,
        popularity_score: newService.popularity
      }

      await addService(serviceData)
      
      // Reset form and close modal
      setNewService({ name: "", description: "", sla: "", popularity: 3 })
      setSelectedCategoryForService("")
      setShowAddServiceModal(false)
      
      // Refresh categories to show the new service
      await refetch()
      
      alert(`Service "${newService.name}" has been added successfully!`)
    } catch (error) {
      console.error('Error adding service:', error)
      alert(`Failed to add service: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleEditService = () => {
    // TODO: Implement service update via API
    setShowEditServiceModal(false)
  }

  const handleDeleteService = (categoryId: string, serviceName: string) => {
    // TODO: Implement service deletion via API
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
    alert("Service request submitted successfully! You will receive a confirmation email shortly.")
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

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-2"></div>
        <span>Loading service catalog...</span>
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
          <h1 className="text-3xl font-bold text-gray-900">Service Catalog</h1>
          <p className="text-gray-600 mt-1">Manage service categories and request types</p>
        </div>
        <Dialog open={showAddCategoryModal} onOpenChange={setShowAddCategoryModal}>
          <DialogTrigger asChild>
            <Button className="bg-black text-white hover:bg-gray-800">
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search categories and services..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-gray-50 border-gray-200 rounded-lg"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Services</p>
              <p className="text-3xl font-bold text-gray-900">{services.reduce((acc, cat) => acc + cat.services.length, 0)}</p>
            </div>
            <Building2 className="h-8 w-8 text-gray-400" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Services</p>
              <p className="text-3xl font-bold text-gray-900">{services.reduce((acc, cat) => acc + cat.services.length, 0)}</p>
            </div>
            <Settings className="h-8 w-8 text-gray-400" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Service Owners</p>
              <p className="text-3xl font-bold text-gray-900">{services.length}</p>
            </div>
            <Users className="h-8 w-8 text-gray-400" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Categories</p>
              <p className="text-3xl font-bold text-gray-900">{services.length}</p>
            </div>
            <Layers className="h-8 w-8 text-gray-400" />
          </div>
        </Card>
      </div>

      {/* Service Categories */}
      <div className="space-y-6">
        {filteredServices.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
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
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg ${category.color} text-white`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-bold text-gray-900">{category.name}</h3>
                          <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Active</span>
                        </div>
                        <p className="text-gray-600 mt-1">{category.description} • Owner: System</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-sm"
                        onClick={() => {
                          setSelectedCategoryForService(category.id)
                          setShowAddServiceModal(true)
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Service
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {category.services.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {category.services.map((service, index) => (
                        <div key={index} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 mb-1">{service.name}</h4>
                              <p className="text-sm text-gray-600 mb-3">{service.description}</p>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  <span>{service.sla}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                {Array.from({ length: service.popularity }).map((_, i) => (
                                  <span key={i} className="text-yellow-400">
                                    ★
                                  </span>
                                ))}
                              </div>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
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
              disabled={serviceLoading || !newService.name.trim()}
            >
              {serviceLoading ? 'Adding...' : 'Add Service'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
