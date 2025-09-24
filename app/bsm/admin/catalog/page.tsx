"use client"

import { useState } from "react"
import { PlatformLayout } from "@/components/layout/platform-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Building2,
  Settings,
  Users,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Laptop,
  Shield,
  DollarSign,
  Scale,
  Building,
  Clock,
  Star,
  Search,
} from "lucide-react"
import { useRouter } from "next/navigation"

interface ServiceRequest {
  name: string
  description: string
  sla: string
  popularity: number
}

interface Category {
  id: string
  name: string
  description: string
  services: ServiceRequest[]
  owner: string
  status: "Active" | "Draft" | "Inactive"
  icon: any
  color: string
}

export default function ServiceCatalogAdminPage() {
  const router = useRouter()
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [showEditCategory, setShowEditCategory] = useState(false)
  const [showDeleteCategory, setShowDeleteCategory] = useState(false)
  const [showAddService, setShowAddService] = useState(false)
  const [showEditService, setShowEditService] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [selectedService, setSelectedService] = useState<ServiceRequest | null>(null)
  const [selectedCategoryForService, setSelectedCategoryForService] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
    owner: "",
    status: "Active" as const,
    color: "bg-blue-500",
  })
  const [newService, setNewService] = useState({
    name: "",
    description: "",
    sla: "",
    popularity: 3,
  })

  const [categories, setCategories] = useState<Category[]>([
    {
      id: "1",
      name: "IT Services",
      description: "Technology and infrastructure services",
      services: [
        { name: "Laptop Request", description: "Request new laptop or replacement", sla: "3-5 days", popularity: 5 },
        { name: "Software Installation", description: "Install approved software", sla: "1-2 days", popularity: 4 },
        { name: "VPN Access", description: "Request VPN access for remote work", sla: "Same day", popularity: 5 },
        { name: "Password Reset", description: "Reset forgotten passwords", sla: "2 hours", popularity: 3 },
      ],
      owner: "IT Department",
      status: "Active",
      icon: Laptop,
      color: "bg-blue-500",
    },
    {
      id: "2",
      name: "HR Services",
      description: "Human resources and employee services",
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
      ],
      owner: "HR Department",
      status: "Active",
      icon: Users,
      color: "bg-green-500",
    },
    {
      id: "3",
      name: "Finance Services",
      description: "Financial and accounting services",
      services: [
        {
          name: "Expense Reimbursement",
          description: "Submit expenses for reimbursement",
          sla: "5-7 days",
          popularity: 5,
        },
        { name: "Purchase Order", description: "Request new purchase order", sla: "3-5 days", popularity: 3 },
        { name: "Corporate Card", description: "Request corporate credit card", sla: "10-14 days", popularity: 2 },
      ],
      owner: "Finance Department",
      status: "Active",
      icon: DollarSign,
      color: "bg-yellow-500",
    },
    {
      id: "4",
      name: "Facilities",
      description: "Office and facility management services",
      services: [
        { name: "Parking Request", description: "Request parking space assignment", sla: "3-5 days", popularity: 3 },
        { name: "Seating Change", description: "Request desk or office relocation", sla: "5-7 days", popularity: 2 },
        { name: "ID Badge", description: "Request new or replacement ID badge", sla: "1-2 days", popularity: 4 },
      ],
      owner: "Facilities Team",
      status: "Active",
      icon: Building,
      color: "bg-orange-500",
    },
    {
      id: "5",
      name: "Legal Services",
      description: "Legal and compliance services",
      services: [
        { name: "NDA Request", description: "Non-disclosure agreement preparation", sla: "3-5 days", popularity: 4 },
        { name: "Contract Review", description: "Legal review of contracts", sla: "5-7 days", popularity: 3 },
        { name: "Legal Consultation", description: "General legal advice", sla: "2-3 days", popularity: 2 },
      ],
      owner: "Legal Department",
      status: "Active",
      icon: Scale,
      color: "bg-purple-500",
    },
    {
      id: "6",
      name: "Security",
      description: "Security and risk management services",
      services: [
        { name: "Access Request", description: "Request building or system access", sla: "2-3 days", popularity: 4 },
        { name: "Security Review", description: "Security assessment of processes", sla: "7-10 days", popularity: 2 },
        { name: "Training Request", description: "Security awareness training", sla: "5-7 days", popularity: 3 },
      ],
      owner: "Security Team",
      status: "Draft",
      icon: Shield,
      color: "bg-red-500",
    },
  ])

  const handleAddCategory = () => {
    const category: Category = {
      id: Date.now().toString(),
      name: newCategory.name,
      description: newCategory.description,
      services: [],
      owner: newCategory.owner,
      status: newCategory.status,
      icon: Settings,
      color: newCategory.color,
    }
    setCategories([...categories, category])
    setNewCategory({ name: "", description: "", owner: "", status: "Active", color: "bg-blue-500" })
    setShowAddCategory(false)
  }

  const handleEditCategory = () => {
    if (selectedCategory) {
      setCategories(
        categories.map((cat) =>
          cat.id === selectedCategory.id ? { ...selectedCategory, ...newCategory, icon: selectedCategory.icon } : cat,
        ),
      )
      setShowEditCategory(false)
      setSelectedCategory(null)
      setNewCategory({ name: "", description: "", owner: "", status: "Active", color: "bg-blue-500" })
    }
  }

  const handleDeleteCategory = () => {
    if (selectedCategory) {
      setCategories(categories.filter((cat) => cat.id !== selectedCategory.id))
      setShowDeleteCategory(false)
      setSelectedCategory(null)
    }
  }

  const handleAddService = () => {
    const updatedCategories = categories.map((category) => {
      if (category.id === selectedCategoryForService) {
        return {
          ...category,
          services: [...category.services, newService],
        }
      }
      return category
    })
    setCategories(updatedCategories)
    setNewService({ name: "", description: "", sla: "", popularity: 3 })
    setShowAddService(false)
  }

  const handleEditService = () => {
    if (selectedService && selectedCategory) {
      const updatedCategories = categories.map((category) => {
        if (category.id === selectedCategory.id) {
          return {
            ...category,
            services: category.services.map((service) => (service === selectedService ? newService : service)),
          }
        }
        return category
      })
      setCategories(updatedCategories)
      setShowEditService(false)
      setSelectedService(null)
      setNewService({ name: "", description: "", sla: "", popularity: 3 })
    }
  }

  const handleDeleteService = (categoryId: string, serviceName: string) => {
    const updatedCategories = categories.map((category) => {
      if (category.id === categoryId) {
        return {
          ...category,
          services: category.services.filter((service) => service.name !== serviceName),
        }
      }
      return category
    })
    setCategories(updatedCategories)
  }

  const openEditDialog = (category: Category) => {
    setSelectedCategory(category)
    setNewCategory({
      name: category.name,
      description: category.description,
      owner: category.owner,
      status: category.status,
      color: category.color,
    })
    setShowEditCategory(true)
  }

  const openDeleteDialog = (category: Category) => {
    setSelectedCategory(category)
    setShowDeleteCategory(true)
  }

  const openEditServiceDialog = (category: Category, service: ServiceRequest) => {
    setSelectedCategory(category)
    setSelectedService(service)
    setNewService(service)
    setShowEditService(true)
  }

  const filteredCategories = categories.filter((category) => {
    if (searchTerm) {
      return (
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
    <PlatformLayout
      title="Service Catalog Administration"
      description="Manage service offerings and catalog configuration"
    >
      <div className="space-y-6 font-sans text-[13px]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Service Catalog</h1>
            <p className="text-[13px] text-muted-foreground">Manage service categories and request types</p>
          </div>
          <Button size="sm" onClick={() => setShowAddCategory(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search categories and services..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 text-[13px]"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Building2 className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Total Services</p>
                  <p className="text-2xl font-bold">{categories.reduce((acc, cat) => acc + cat.services.length, 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Settings className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Active Services</p>
                  <p className="text-2xl font-bold">
                    {categories
                      .filter((cat) => cat.status === "Active")
                      .reduce((acc, cat) => acc + cat.services.length, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-sm font-medium">Service Owners</p>
                  <p className="text-2xl font-bold">{new Set(categories.map((cat) => cat.owner)).size}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Building2 className="h-4 w-4 text-purple-500" />
                <div>
                  <p className="text-sm font-medium">Categories</p>
                  <p className="text-2xl font-bold">{categories.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {filteredCategories.map((category) => {
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
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-xl">{category.name}</CardTitle>
                          <Badge variant={category.status === "Active" ? "default" : "outline"}>
                            {category.status}
                          </Badge>
                        </div>
                        <CardDescription className="text-[13px]">
                          {category.description} • Owner: {category.owner}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedCategoryForService(category.id)
                          setShowAddService(true)
                        }}
                        className="text-[13px]"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Service
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(category)}>
                            <Edit className="h-3 w-3 mr-2" />
                            Edit Category
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openDeleteDialog(category)} className="text-red-600">
                            <Trash2 className="h-3 w-3 mr-2" />
                            Delete Category
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {category.services.map((service) => (
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
                                  <MoreHorizontal className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => openEditServiceDialog(category, service)}
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
                        </div>
                      </div>
                    ))}
                    {category.services.length === 0 && (
                      <div className="col-span-full text-center py-8 text-muted-foreground text-[13px]">
                        No services in this category yet. Click "Add Service" to get started.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <Dialog open={showAddCategory} onOpenChange={setShowAddCategory}>
          <DialogContent className="font-sans">
            <DialogHeader>
              <DialogTitle>Add New Category</DialogTitle>
              <DialogDescription>Create a new service category to organize your services.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Category Name</Label>
                <Input
                  id="name"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  placeholder="Enter category name"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  placeholder="Enter category description"
                />
              </div>
              <div>
                <Label htmlFor="owner">Category Owner</Label>
                <Input
                  id="owner"
                  value={newCategory.owner}
                  onChange={(e) => setNewCategory({ ...newCategory, owner: e.target.value })}
                  placeholder="Enter owner name or department"
                />
              </div>
              <div>
                <Label htmlFor="color">Color</Label>
                <Select
                  value={newCategory.color}
                  onValueChange={(value) => setNewCategory({ ...newCategory, color: value })}
                >
                  <SelectTrigger>
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
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={newCategory.status}
                  onValueChange={(value: "Active" | "Draft" | "Inactive") =>
                    setNewCategory({ ...newCategory, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddCategory(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddCategory}>Add Category</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showAddService} onOpenChange={setShowAddService}>
          <DialogContent className="font-sans">
            <DialogHeader>
              <DialogTitle>Add New Service</DialogTitle>
              <DialogDescription>Create a new service request type.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="service-name">Service Name</Label>
                <Input
                  id="service-name"
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  placeholder="e.g., Laptop Request"
                />
              </div>
              <div>
                <Label htmlFor="service-description">Description</Label>
                <Textarea
                  id="service-description"
                  value={newService.description}
                  onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                  placeholder="Brief description of the service"
                />
              </div>
              <div>
                <Label htmlFor="service-sla">SLA</Label>
                <Input
                  id="service-sla"
                  value={newService.sla}
                  onChange={(e) => setNewService({ ...newService, sla: e.target.value })}
                  placeholder="e.g., 3-5 days"
                />
              </div>
              <div>
                <Label htmlFor="service-popularity">Popularity (1-5)</Label>
                <Select
                  value={newService.popularity.toString()}
                  onValueChange={(value) => setNewService({ ...newService, popularity: Number.parseInt(value) })}
                >
                  <SelectTrigger>
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
              <Button variant="outline" onClick={() => setShowAddService(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddService}>Add Service</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showEditService} onOpenChange={setShowEditService}>
          <DialogContent className="font-sans">
            <DialogHeader>
              <DialogTitle>Edit Service</DialogTitle>
              <DialogDescription>Update the service details.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-service-name">Service Name</Label>
                <Input
                  id="edit-service-name"
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-service-description">Description</Label>
                <Textarea
                  id="edit-service-description"
                  value={newService.description}
                  onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-service-sla">SLA</Label>
                <Input
                  id="edit-service-sla"
                  value={newService.sla}
                  onChange={(e) => setNewService({ ...newService, sla: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-service-popularity">Popularity (1-5)</Label>
                <Select
                  value={newService.popularity?.toString()}
                  onValueChange={(value) => setNewService({ ...newService, popularity: Number.parseInt(value) })}
                >
                  <SelectTrigger>
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
              <Button variant="outline" onClick={() => setShowEditService(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditService}>Update Service</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showEditCategory} onOpenChange={setShowEditCategory}>
          <DialogContent className="font-sans">
            <DialogHeader>
              <DialogTitle>Edit Category</DialogTitle>
              <DialogDescription>Update the category information.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Category Name</Label>
                <Input
                  id="edit-name"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  placeholder="Enter category name"
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  placeholder="Enter category description"
                />
              </div>
              <div>
                <Label htmlFor="edit-owner">Category Owner</Label>
                <Input
                  id="edit-owner"
                  value={newCategory.owner}
                  onChange={(e) => setNewCategory({ ...newCategory, owner: e.target.value })}
                  placeholder="Enter owner name or department"
                />
              </div>
              <div>
                <Label htmlFor="edit-color">Color</Label>
                <Select
                  value={newCategory.color}
                  onValueChange={(value) => setNewCategory({ ...newCategory, color: value })}
                >
                  <SelectTrigger>
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
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={newCategory.status}
                  onValueChange={(value: "Active" | "Draft" | "Inactive") =>
                    setNewCategory({ ...newCategory, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditCategory(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditCategory}>Update Category</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showDeleteCategory} onOpenChange={setShowDeleteCategory}>
          <DialogContent className="font-sans">
            <DialogHeader>
              <DialogTitle>Delete Category</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{selectedCategory?.name}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteCategory(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteCategory}>
                Delete Category
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PlatformLayout>
  )
}
