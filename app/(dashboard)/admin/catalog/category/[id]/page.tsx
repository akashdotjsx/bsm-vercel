"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { PageContent } from "@/components/layout/page-content"
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
import { ArrowLeft, Plus, MoreHorizontal, Edit, Trash2, User, Clock } from "lucide-react"

interface Service {
  id: string
  name: string
  description: string
  owner: string
  status: "Active" | "Inactive" | "Draft"
  createdDate: string
  requestCount: number
}

export default function CategoryServicesPage() {
  const params = useParams()
  const router = useRouter()
  const categoryId = params.id as string

  const [showAddService, setShowAddService] = useState(false)
  const [showEditService, setShowEditService] = useState(false)
  const [showDeleteService, setShowDeleteService] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [newService, setNewService] = useState({
    name: "",
    description: "",
    owner: "",
    status: "Active" as const,
  })

  // Mock category data
  const categoryNames: { [key: string]: string } = {
    "1": "IT Services",
    "2": "HR Services",
    "3": "Finance Services",
    "4": "Facilities",
    "5": "Legal Services",
    "6": "Security",
  }

  const [services, setServices] = useState<Service[]>([
    {
      id: "1",
      name: "Email Setup",
      description: "Configure new employee email accounts",
      owner: "John Smith",
      status: "Active",
      createdDate: "Sep 10, 2025",
      requestCount: 45,
    },
    {
      id: "2",
      name: "Software Installation",
      description: "Install and configure software applications",
      owner: "Sarah Johnson",
      status: "Active",
      createdDate: "Sep 08, 2025",
      requestCount: 32,
    },
    {
      id: "3",
      name: "Hardware Request",
      description: "Request new hardware equipment",
      owner: "Mike Chen",
      status: "Active",
      createdDate: "Sep 05, 2025",
      requestCount: 28,
    },
    {
      id: "4",
      name: "VPN Access",
      description: "Provide VPN access for remote work",
      owner: "John Smith",
      status: "Inactive",
      createdDate: "Sep 01, 2025",
      requestCount: 15,
    },
    {
      id: "5",
      name: "Password Reset",
      description: "Reset user passwords and account recovery",
      owner: "Sarah Johnson",
      status: "Active",
      createdDate: "Aug 28, 2025",
      requestCount: 67,
    },
  ])

  const categoryName = categoryNames[categoryId] || "Unknown Category"

  const handleAddService = () => {
    const service: Service = {
      id: Date.now().toString(),
      name: newService.name,
      description: newService.description,
      owner: newService.owner,
      status: newService.status,
      createdDate: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
      requestCount: 0,
    }
    setServices([...services, service])
    setNewService({ name: "", description: "", owner: "", status: "Active" })
    setShowAddService(false)
  }

  const handleEditService = () => {
    if (selectedService) {
      setServices(
        services.map((service) =>
          service.id === selectedService.id ? { ...selectedService, ...newService } : service,
        ),
      )
      setShowEditService(false)
      setSelectedService(null)
      setNewService({ name: "", description: "", owner: "", status: "Active" })
    }
  }

  const handleDeleteService = () => {
    if (selectedService) {
      setServices(services.filter((service) => service.id !== selectedService.id))
      setShowDeleteService(false)
      setSelectedService(null)
    }
  }

  const openEditDialog = (service: Service) => {
    setSelectedService(service)
    setNewService({
      name: service.name,
      description: service.description,
      owner: service.owner,
      status: service.status,
    })
    setShowEditService(true)
  }

  const openDeleteDialog = (service: Service) => {
    setSelectedService(service)
    setShowDeleteService(true)
  }

  return (
    <PageContent
      title={`${categoryName} - Services`}
      description={`Manage services in the ${categoryName} category`}
      breadcrumb={[
        { label: "Administration", href: "/admin" },
        { label: "Service Catalog", href: "/admin/catalog" },
        { label: categoryName, href: `/admin/catalog/category/${categoryId}` },
      ]}
    >
      <div className="space-y-6 font-sans text-[13px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Categories
            </Button>
            <div>
              <h1 className="text-[13px] font-semibold tracking-tight">{categoryName}</h1>
              <p className="text-sm text-gray-500">Manage services in this category</p>
            </div>
          </div>
          <Button onClick={() => setShowAddService(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Service
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium">Active Services</p>
                  <p className="text-[13px] font-bold">{services.filter((s) => s.status === "Active").length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-gray-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium">Inactive Services</p>
                  <p className="text-[13px] font-bold">{services.filter((s) => s.status === "Inactive").length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium">Total Requests</p>
                  <p className="text-[13px] font-bold">{services.reduce((sum, s) => sum + s.requestCount, 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-[11px] font-semibold">Services</CardTitle>
            <CardDescription>All services in the {categoryName} category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {services.map((service) => (
                <div key={service.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-medium">{service.name}</h4>
                        <Badge
                          variant={
                            service.status === "Active"
                              ? "default"
                              : service.status === "Inactive"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {service.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <User className="h-3 w-3" />
                          <span>Owner: {service.owner}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>Created: {service.createdDate}</span>
                        </div>
                        <span>{service.requestCount} requests</span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(service)}>
                          <Edit className="h-3 w-3 mr-2" />
                          Edit Service
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openDeleteDialog(service)} className="text-red-600">
                          <Trash2 className="h-3 w-3 mr-2" />
                          Delete Service
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Add Service Modal */}
        <Dialog open={showAddService} onOpenChange={setShowAddService}>
          <DialogContent className="font-sans">
            <DialogHeader>
              <DialogTitle>Add New Service</DialogTitle>
              <DialogDescription>Create a new service in the {categoryName} category.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="service-name">Service Name</Label>
                <Input
                  id="service-name"
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  placeholder="Enter service name"
                />
              </div>
              <div>
                <Label htmlFor="service-description">Description</Label>
                <Textarea
                  id="service-description"
                  value={newService.description}
                  onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                  placeholder="Enter service description"
                />
              </div>
              <div>
                <Label htmlFor="service-owner">Service Owner</Label>
                <Input
                  id="service-owner"
                  value={newService.owner}
                  onChange={(e) => setNewService({ ...newService, owner: e.target.value })}
                  placeholder="Enter owner name"
                />
              </div>
              <div>
                <Label htmlFor="service-status">Status</Label>
                <Select
                  value={newService.status}
                  onValueChange={(value: "Active" | "Inactive" | "Draft") =>
                    setNewService({ ...newService, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Draft">Draft</SelectItem>
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

        {/* Edit Service Modal */}
        <Dialog open={showEditService} onOpenChange={setShowEditService}>
          <DialogContent className="font-sans">
            <DialogHeader>
              <DialogTitle>Edit Service</DialogTitle>
              <DialogDescription>Update the service information.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-service-name">Service Name</Label>
                <Input
                  id="edit-service-name"
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  placeholder="Enter service name"
                />
              </div>
              <div>
                <Label htmlFor="edit-service-description">Description</Label>
                <Textarea
                  id="edit-service-description"
                  value={newService.description}
                  onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                  placeholder="Enter service description"
                />
              </div>
              <div>
                <Label htmlFor="edit-service-owner">Service Owner</Label>
                <Input
                  id="edit-service-owner"
                  value={newService.owner}
                  onChange={(e) => setNewService({ ...newService, owner: e.target.value })}
                  placeholder="Enter owner name"
                />
              </div>
              <div>
                <Label htmlFor="edit-service-status">Status</Label>
                <Select
                  value={newService.status}
                  onValueChange={(value: "Active" | "Inactive" | "Draft") =>
                    setNewService({ ...newService, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Draft">Draft</SelectItem>
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

        {/* Delete Service Modal */}
        <Dialog open={showDeleteService} onOpenChange={setShowDeleteService}>
          <DialogContent className="font-sans">
            <DialogHeader>
              <DialogTitle>Delete Service</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{selectedService?.name}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteService(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteService}>
                Delete Service
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageContent>
  )
}
