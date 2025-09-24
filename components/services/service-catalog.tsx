"use client"

import { useState } from "react"
import { useMode } from "@/lib/contexts/mode-context"
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
} from "lucide-react"

const employeeServices = [
  {
    id: "it",
    name: "IT Services",
    description: "Technology support and equipment requests",
    icon: Laptop,
    color: "bg-blue-500",
    services: [
      { name: "Laptop Request", description: "Request new laptop or replacement", sla: "3-5 days", popularity: 5 },
      { name: "Software Installation", description: "Install approved software", sla: "1-2 days", popularity: 4 },
      { name: "VPN Access", description: "Request VPN access for remote work", sla: "Same day", popularity: 5 },
      { name: "Password Reset", description: "Reset forgotten passwords", sla: "2 hours", popularity: 3 },
      { name: "BYOD Setup", description: "Configure personal device for work", sla: "1-2 days", popularity: 2 },
    ],
  },
  {
    id: "hr",
    name: "HR Services",
    description: "Human resources and employee support",
    icon: Users,
    color: "bg-green-500",
    services: [
      {
        name: "Employment Letter",
        description: "Request employment verification letter",
        sla: "2-3 days",
        popularity: 4,
      },
      { name: "Leave Request", description: "Submit vacation or sick leave", sla: "1-2 days", popularity: 5 },
      {
        name: "Benefits Inquiry",
        description: "Questions about health, dental, retirement",
        sla: "Same day",
        popularity: 3,
      },
      { name: "Payroll Issue", description: "Report payroll discrepancies", sla: "1-2 days", popularity: 2 },
      { name: "Grievance Filing", description: "File formal complaint or grievance", sla: "5-7 days", popularity: 1 },
    ],
  },
  {
    id: "finance",
    name: "Finance Services",
    description: "Financial processes and reimbursements",
    icon: DollarSign,
    color: "bg-yellow-500",
    services: [
      {
        name: "Expense Reimbursement",
        description: "Submit expenses for reimbursement",
        sla: "5-7 days",
        popularity: 5,
      },
      { name: "Purchase Order", description: "Request new purchase order", sla: "3-5 days", popularity: 3 },
      { name: "Vendor Onboarding", description: "Add new vendor to system", sla: "7-10 days", popularity: 2 },
      { name: "Corporate Card", description: "Request corporate credit card", sla: "10-14 days", popularity: 2 },
      { name: "Invoice Query", description: "Questions about invoices or payments", sla: "1-2 days", popularity: 3 },
    ],
  },
  {
    id: "legal",
    name: "Legal Services",
    description: "Legal documents and compliance support",
    icon: Scale,
    color: "bg-purple-500",
    services: [
      { name: "NDA Request", description: "Non-disclosure agreement preparation", sla: "3-5 days", popularity: 4 },
      { name: "Contract Review", description: "Legal review of contracts", sla: "5-7 days", popularity: 3 },
      { name: "MSA Preparation", description: "Master service agreement drafting", sla: "7-10 days", popularity: 2 },
      { name: "IP Filing", description: "Intellectual property registration", sla: "14-21 days", popularity: 1 },
      { name: "Legal Consultation", description: "General legal advice", sla: "2-3 days", popularity: 2 },
    ],
  },
  {
    id: "facilities",
    name: "Facilities & Admin",
    description: "Office space and administrative services",
    icon: Building,
    color: "bg-orange-500",
    services: [
      { name: "Parking Request", description: "Request parking space assignment", sla: "3-5 days", popularity: 3 },
      { name: "Seating Change", description: "Request desk or office relocation", sla: "5-7 days", popularity: 2 },
      { name: "ID Badge", description: "Request new or replacement ID badge", sla: "1-2 days", popularity: 4 },
      { name: "HVAC Issue", description: "Report heating/cooling problems", sla: "Same day", popularity: 3 },
      { name: "Housekeeping", description: "Special cleaning or maintenance request", sla: "1-2 days", popularity: 2 },
    ],
  },
  {
    id: "security",
    name: "Security Services",
    description: "Security access and compliance",
    icon: Shield,
    color: "bg-red-500",
    services: [
      { name: "Access Request", description: "Request building or system access", sla: "2-3 days", popularity: 4 },
      { name: "Security Review", description: "Security assessment of processes", sla: "7-10 days", popularity: 2 },
      { name: "Incident Report", description: "Report security incidents", sla: "Same day", popularity: 1 },
      { name: "Training Request", description: "Security awareness training", sla: "5-7 days", popularity: 3 },
      { name: "Policy Question", description: "Questions about security policies", sla: "1-2 days", popularity: 2 },
    ],
  },
]

const customerServices = [
  {
    id: "technical-support",
    name: "Technical Support",
    description: "Product technical assistance and troubleshooting",
    icon: Settings,
    color: "bg-blue-500",
    services: [
      { name: "Product Setup", description: "Help with initial product configuration", sla: "4 hours", popularity: 5 },
      { name: "Bug Report", description: "Report software bugs or issues", sla: "2 hours", popularity: 4 },
      { name: "Integration Support", description: "Help with third-party integrations", sla: "8 hours", popularity: 3 },
      { name: "Performance Issue", description: "Report performance problems", sla: "4 hours", popularity: 3 },
      { name: "Feature Request", description: "Request new product features", sla: "1-2 days", popularity: 2 },
    ],
  },
  {
    id: "account-management",
    name: "Account Management",
    description: "Account and billing support services",
    icon: Users,
    color: "bg-green-500",
    services: [
      { name: "Billing Inquiry", description: "Questions about invoices and billing", sla: "4 hours", popularity: 4 },
      { name: "Plan Upgrade", description: "Upgrade subscription plan", sla: "2 hours", popularity: 3 },
      { name: "User Management", description: "Add or remove user accounts", sla: "2 hours", popularity: 4 },
      { name: "Contract Review", description: "Review contract terms and conditions", sla: "1-2 days", popularity: 2 },
      { name: "Renewal Discussion", description: "Discuss contract renewal options", sla: "4 hours", popularity: 3 },
    ],
  },
  {
    id: "customer-success",
    name: "Customer Success",
    description: "Onboarding and success services",
    icon: Star,
    color: "bg-purple-500",
    services: [
      { name: "Onboarding Session", description: "Guided product onboarding", sla: "1-2 days", popularity: 5 },
      { name: "Training Request", description: "Product training for your team", sla: "3-5 days", popularity: 4 },
      { name: "Best Practices", description: "Consultation on best practices", sla: "1-2 days", popularity: 3 },
      { name: "Health Check", description: "Account health assessment", sla: "5-7 days", popularity: 2 },
      { name: "Success Planning", description: "Create success plan for your goals", sla: "3-5 days", popularity: 3 },
    ],
  },
  {
    id: "documentation",
    name: "Documentation & Resources",
    description: "Access to guides and documentation",
    icon: FileText,
    color: "bg-orange-500",
    services: [
      { name: "Custom Documentation", description: "Request custom documentation", sla: "5-7 days", popularity: 2 },
      { name: "API Documentation", description: "Technical API documentation", sla: "1-2 days", popularity: 3 },
      { name: "Video Tutorial", description: "Request video tutorials", sla: "7-10 days", popularity: 2 },
      { name: "Knowledge Base", description: "Access to knowledge base articles", sla: "Immediate", popularity: 4 },
      { name: "Webinar Request", description: "Request product webinar", sla: "10-14 days", popularity: 1 },
    ],
  },
]

export function ServiceCatalog() {
  const { mode } = useMode()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("popularity")

  const [services, setServices] = useState(mode === "employee" ? employeeServices : customerServices)
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

  const handleAddCategory = () => {
    const newCat = {
      id: newCategory.name.toLowerCase().replace(/\s+/g, "-"),
      name: newCategory.name,
      description: newCategory.description,
      icon: Settings,
      color: newCategory.color,
      services: [],
    }
    setServices([...services, newCat])
    setNewCategory({ name: "", description: "", color: "bg-blue-500" })
    setShowAddCategoryModal(false)
    alert("Service category added successfully!")
  }

  const handleAddService = () => {
    const updatedServices = services.map((category) => {
      if (category.id === selectedCategoryForService) {
        return {
          ...category,
          services: [...category.services, newService],
        }
      }
      return category
    })
    setServices(updatedServices)
    setNewService({ name: "", description: "", sla: "", popularity: 3 })
    setShowAddServiceModal(false)
    alert("Service added successfully!")
  }

  const handleEditService = () => {
    const updatedServices = services.map((category) => ({
      ...category,
      services: category.services.map((service) => (service === selectedService ? newService : service)),
    }))
    setServices(updatedServices)
    setShowEditServiceModal(false)
    alert("Service updated successfully!")
  }

  const handleDeleteService = (categoryId, serviceName) => {
    const updatedServices = services.map((category) => {
      if (category.id === categoryId) {
        return {
          ...category,
          services: category.services.filter((service) => service.name !== serviceName),
        }
      }
      return category
    })
    setServices(updatedServices)
    alert("Service deleted successfully!")
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

  return (
    <div className="space-y-6 text-[13px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Service Catalog</h1>
          <p className="text-[13px] text-muted-foreground">Browse and request services from various departments</p>
        </div>
        <Dialog open={showAddCategoryModal} onOpenChange={setShowAddCategoryModal}>
          <DialogTrigger asChild>
            <Button className="text-[13px]">
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
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
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search services..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 text-[13px]"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48 text-[13px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {services.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-40 text-[13px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="popularity">Popularity</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="sla">SLA</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6">
        {filteredServices.map((category) => {
          const Icon = category.icon
          return (
            <Card key={category.id} className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${category.color} text-white`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{category.name}</CardTitle>
                      <CardDescription className="text-[13px]">{category.description}</CardDescription>
                    </div>
                  </div>
                  <Dialog open={showAddServiceModal} onOpenChange={setShowAddServiceModal}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedCategoryForService(category.id)}
                        className="text-[13px]"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Service
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Service to {category.name}</DialogTitle>
                        <DialogDescription className="text-[13px]">
                          Create a new service in this category.
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
                            placeholder="e.g., Laptop Request"
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
                            SLA
                          </Label>
                          <Input
                            id="service-sla"
                            value={newService.sla}
                            onChange={(e) => setNewService({ ...newService, sla: e.target.value })}
                            placeholder="e.g., 3-5 days"
                            className="text-[13px]"
                          />
                        </div>
                        <div>
                          <Label htmlFor="service-popularity" className="text-[13px]">
                            Popularity (1-5)
                          </Label>
                          <Select
                            value={newService.popularity.toString()}
                            onValueChange={(value) =>
                              setNewService({ ...newService, popularity: Number.parseInt(value) })
                            }
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
                        <Button onClick={handleAddService} className="text-[13px]">
                          Add Service
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {category.services
                    .sort((a, b) => {
                      if (sortBy === "popularity") return b.popularity - a.popularity
                      if (sortBy === "name") return a.name.localeCompare(b.name)
                      return a.sla.localeCompare(b.sla)
                    })
                    .map((service) => (
                      <div
                        key={service.name}
                        className="p-4 border-gray-100 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-[13px]">{service.name}</h4>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              {Array.from({ length: service.popularity }).map((_, i) => (
                                <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              ))}
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  <MoreVertical className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedService(service)
                                    setNewService(service)
                                    setShowEditServiceModal(true)
                                  }}
                                  className="text-[13px]"
                                >
                                  <Edit className="h-3 w-3 mr-2" />
                                  Edit Service
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteService(category.id, service.name)}
                                  className="text-[13px] text-red-600"
                                >
                                  <Trash2 className="h-3 w-3 mr-2" />
                                  Delete Service
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        <p className="text-[13px] text-muted-foreground mb-3">{service.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-[13px] text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {service.sla}
                          </div>
                          <Dialog open={showRequestModal} onOpenChange={setShowRequestModal}>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedService(service)
                                  setSelectedServiceCategory(category)
                                }}
                                className="text-[13px]"
                              >
                                Request
                                <ArrowRight className="h-3 w-3 ml-1" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-3">
                                  {selectedServiceCategory && (
                                    <div className={`p-2 rounded-lg ${selectedServiceCategory.color} text-white`}>
                                      <selectedServiceCategory.icon className="h-4 w-4" />
                                    </div>
                                  )}
                                  <div>
                                    <div className="text-lg">Request Service: {selectedService?.name}</div>
                                    <div className="text-sm font-normal text-muted-foreground">
                                      {selectedServiceCategory?.name} • SLA: {selectedService?.sla}
                                    </div>
                                  </div>
                                </DialogTitle>
                                <DialogDescription className="text-[13px]">
                                  {selectedService?.description}
                                </DialogDescription>
                              </DialogHeader>

                              <div className="space-y-6">
                                <div className="bg-muted/30 p-4 rounded-lg">
                                  <h4 className="font-medium text-[13px] mb-2">Service Information</h4>
                                  <div className="grid grid-cols-2 gap-4 text-[13px]">
                                    <div>
                                      <span className="text-muted-foreground">Category:</span>
                                      <span className="ml-2 font-medium">{selectedServiceCategory?.name}</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Expected SLA:</span>
                                      <span className="ml-2 font-medium">{selectedService?.sla}</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Popularity:</span>
                                      <div className="ml-2 inline-flex items-center gap-1">
                                        {Array.from({ length: selectedService?.popularity || 0 }).map((_, i) => (
                                          <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-4">
                                  <h4 className="font-medium text-[13px]">Request Details</h4>

                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label htmlFor="request-name" className="text-[13px]">
                                        Request Name *
                                      </Label>
                                      <Input
                                        id="request-name"
                                        value={requestForm.requestName}
                                        onChange={(e) =>
                                          setRequestForm({ ...requestForm, requestName: e.target.value })
                                        }
                                        placeholder="Give your request a descriptive name"
                                        className="text-[13px]"
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="department" className="text-[13px]">
                                        Department
                                      </Label>
                                      <Select
                                        value={requestForm.department}
                                        onValueChange={(value) => setRequestForm({ ...requestForm, department: value })}
                                      >
                                        <SelectTrigger className="text-[13px]">
                                          <SelectValue placeholder="Select department" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="engineering">Engineering</SelectItem>
                                          <SelectItem value="marketing">Marketing</SelectItem>
                                          <SelectItem value="sales">Sales</SelectItem>
                                          <SelectItem value="hr">Human Resources</SelectItem>
                                          <SelectItem value="finance">Finance</SelectItem>
                                          <SelectItem value="operations">Operations</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label htmlFor="priority" className="text-[13px]">
                                        Priority *
                                      </Label>
                                      <Select
                                        value={requestForm.priority}
                                        onValueChange={(value) => setRequestForm({ ...requestForm, priority: value })}
                                      >
                                        <SelectTrigger className="text-[13px]">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="Critical">Critical</SelectItem>
                                          <SelectItem value="Urgent">Urgent</SelectItem>
                                          <SelectItem value="High">High</SelectItem>
                                          <SelectItem value="Medium">Medium</SelectItem>
                                          <SelectItem value="Low">Low</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div>
                                      <Label htmlFor="urgency" className="text-[13px]">
                                        Urgency
                                      </Label>
                                      <Select
                                        value={requestForm.urgency}
                                        onValueChange={(value) => setRequestForm({ ...requestForm, urgency: value })}
                                      >
                                        <SelectTrigger className="text-[13px]">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="Emergency">Emergency</SelectItem>
                                          <SelectItem value="High">High</SelectItem>
                                          <SelectItem value="Normal">Normal</SelectItem>
                                          <SelectItem value="Low">Low</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label htmlFor="expected-delivery" className="text-[13px]">
                                        Expected Delivery Date
                                      </Label>
                                      <Input
                                        id="expected-delivery"
                                        type="date"
                                        value={requestForm.expectedDelivery}
                                        onChange={(e) =>
                                          setRequestForm({ ...requestForm, expectedDelivery: e.target.value })
                                        }
                                        className="text-[13px]"
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="cost-center" className="text-[13px]">
                                        Cost Center
                                      </Label>
                                      <Input
                                        id="cost-center"
                                        value={requestForm.costCenter}
                                        onChange={(e) => setRequestForm({ ...requestForm, costCenter: e.target.value })}
                                        placeholder="e.g., CC-2024-001"
                                        className="text-[13px]"
                                      />
                                    </div>
                                  </div>

                                  <div>
                                    <Label htmlFor="approver-email" className="text-[13px]">
                                      Approver Email
                                    </Label>
                                    <Input
                                      id="approver-email"
                                      type="email"
                                      value={requestForm.approverEmail}
                                      onChange={(e) =>
                                        setRequestForm({ ...requestForm, approverEmail: e.target.value })
                                      }
                                      placeholder="manager@company.com"
                                      className="text-[13px]"
                                    />
                                  </div>

                                  <div>
                                    <Label htmlFor="description" className="text-[13px]">
                                      Detailed Description *
                                    </Label>
                                    <Textarea
                                      id="description"
                                      value={requestForm.description}
                                      onChange={(e) => setRequestForm({ ...requestForm, description: e.target.value })}
                                      placeholder="Provide a detailed description of what you need..."
                                      className="text-[13px] min-h-[80px]"
                                    />
                                  </div>

                                  <div>
                                    <Label htmlFor="justification" className="text-[13px]">
                                      Business Justification *
                                    </Label>
                                    <Textarea
                                      id="justification"
                                      value={requestForm.justification}
                                      onChange={(e) =>
                                        setRequestForm({ ...requestForm, justification: e.target.value })
                                      }
                                      placeholder="Explain the business need and impact..."
                                      className="text-[13px] min-h-[80px]"
                                    />
                                  </div>

                                  <div>
                                    <Label htmlFor="additional-requirements" className="text-[13px]">
                                      Additional Requirements
                                    </Label>
                                    <Textarea
                                      id="additional-requirements"
                                      value={requestForm.additionalRequirements}
                                      onChange={(e) =>
                                        setRequestForm({ ...requestForm, additionalRequirements: e.target.value })
                                      }
                                      placeholder="Any special requirements, constraints, or preferences..."
                                      className="text-[13px] min-h-[60px]"
                                    />
                                  </div>
                                </div>
                              </div>

                              <DialogFooter className="flex gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => setShowRequestModal(false)}
                                  className="text-[13px]"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={handleServiceRequest}
                                  className="text-[13px]"
                                  disabled={
                                    !requestForm.requestName || !requestForm.description || !requestForm.justification
                                  }
                                >
                                  Submit Request
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Dialog open={showEditServiceModal} onOpenChange={setShowEditServiceModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
            <DialogDescription className="text-[13px]">Update the service details.</DialogDescription>
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
                className="text-[13px]"
              />
            </div>
            <div>
              <Label htmlFor="edit-service-sla" className="text-[13px]">
                SLA
              </Label>
              <Input
                id="edit-service-sla"
                value={newService.sla}
                onChange={(e) => setNewService({ ...newService, sla: e.target.value })}
                className="text-[13px]"
              />
            </div>
            <div>
              <Label htmlFor="edit-service-popularity" className="text-[13px]">
                Popularity (1-5)
              </Label>
              <Select
                value={newService.popularity?.toString()}
                onValueChange={(value) => setNewService({ ...newService, popularity: Number.parseInt(value) })}
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
            <Button onClick={handleEditService} className="text-[13px]">
              Update Service
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {filteredServices.length === 0 && (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No services found</h3>
          <p className="text-muted-foreground text-[13px]">Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  )
}
