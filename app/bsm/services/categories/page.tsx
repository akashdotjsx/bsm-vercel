"use client"

import { useState } from "react"
import { PlatformLayout } from "@/components/layout/platform-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Laptop,
  Users,
  DollarSign,
  Scale,
  Building,
  Shield,
  Settings,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  BarChart3,
} from "lucide-react"
import { useRouter } from "next/navigation"

interface ServiceCategory {
  id: string
  name: string
  description: string
  icon: any
  color: string
  serviceCount: number
  activeRequests: number
  owner: string
  status: "Active" | "Draft" | "Inactive"
  createdAt: Date
  updatedAt: Date
}

export default function ServiceCategoriesPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null)
  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
    owner: "",
    status: "Active" as const,
    color: "bg-blue-500",
  })

  const [categories, setCategories] = useState<ServiceCategory[]>([
    {
      id: "1",
      name: "IT Services",
      description: "Technology support and infrastructure services",
      icon: Laptop,
      color: "bg-blue-500",
      serviceCount: 12,
      activeRequests: 8,
      owner: "IT Department",
      status: "Active",
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-15"),
    },
    {
      id: "2",
      name: "HR Services",
      description: "Human resources and employee support",
      icon: Users,
      color: "bg-green-500",
      serviceCount: 8,
      activeRequests: 5,
      owner: "HR Department",
      status: "Active",
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-10"),
    },
    {
      id: "3",
      name: "Finance Services",
      description: "Financial processes and reimbursements",
      icon: DollarSign,
      color: "bg-yellow-500",
      serviceCount: 6,
      activeRequests: 3,
      owner: "Finance Department",
      status: "Active",
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-12"),
    },
    {
      id: "4",
      name: "Legal Services",
      description: "Legal documents and compliance support",
      icon: Scale,
      color: "bg-purple-500",
      serviceCount: 5,
      activeRequests: 2,
      owner: "Legal Department",
      status: "Active",
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-08"),
    },
    {
      id: "5",
      name: "Facilities & Admin",
      description: "Office space and administrative services",
      icon: Building,
      color: "bg-orange-500",
      serviceCount: 7,
      activeRequests: 4,
      owner: "Facilities Team",
      status: "Active",
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-14"),
    },
    {
      id: "6",
      name: "Security Services",
      description: "Security access and compliance",
      icon: Shield,
      color: "bg-red-500",
      serviceCount: 4,
      activeRequests: 1,
      owner: "Security Team",
      status: "Draft",
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-16"),
    },
  ])

  const filteredCategories = categories.filter(
    (category) =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.owner.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleAddCategory = () => {
    const category: ServiceCategory = {
      id: Date.now().toString(),
      name: newCategory.name,
      description: newCategory.description,
      icon: Settings,
      color: newCategory.color,
      serviceCount: 0,
      activeRequests: 0,
      owner: newCategory.owner,
      status: newCategory.status,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    setCategories([...categories, category])
    setNewCategory({ name: "", description: "", owner: "", status: "Active", color: "bg-blue-500" })
    setShowAddDialog(false)
  }

  const handleEditCategory = () => {
    if (selectedCategory) {
      setCategories(
        categories.map((cat) =>
          cat.id === selectedCategory.id ? { ...selectedCategory, ...newCategory, updatedAt: new Date() } : cat,
        ),
      )
      setShowEditDialog(false)
      setSelectedCategory(null)
      setNewCategory({ name: "", description: "", owner: "", status: "Active", color: "bg-blue-500" })
    }
  }

  const handleDeleteCategory = () => {
    if (selectedCategory) {
      setCategories(categories.filter((cat) => cat.id !== selectedCategory.id))
      setShowDeleteDialog(false)
      setSelectedCategory(null)
    }
  }

  const openEditDialog = (category: ServiceCategory) => {
    setSelectedCategory(category)
    setNewCategory({
      name: category.name,
      description: category.description,
      owner: category.owner,
      status: category.status,
      color: category.color,
    })
    setShowEditDialog(true)
  }

  const openDeleteDialog = (category: ServiceCategory) => {
    setSelectedCategory(category)
    setShowDeleteDialog(true)
  }

  return (
    <PlatformLayout breadcrumb={[{ label: "Services", href: "/bsm/services" }, { label: "Categories" }]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Service Categories</h1>
            <p className="text-sm text-muted-foreground">Organize and manage service offerings by category</p>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Settings className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Total Categories</p>
                  <p className="text-2xl font-bold">{categories.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Active Categories</p>
                  <p className="text-2xl font-bold">{categories.filter((c) => c.status === "Active").length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Settings className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-sm font-medium">Total Services</p>
                  <p className="text-2xl font-bold">{categories.reduce((acc, cat) => acc + cat.serviceCount, 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4 text-purple-500" />
                <div>
                  <p className="text-sm font-medium">Active Requests</p>
                  <p className="text-2xl font-bold">{categories.reduce((acc, cat) => acc + cat.activeRequests, 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category) => {
            const Icon = category.icon
            return (
              <Card key={category.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${category.color} text-white`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{category.name}</CardTitle>
                          <Badge variant={category.status === "Active" ? "default" : "outline"}>
                            {category.status}
                          </Badge>
                        </div>
                        <CardDescription className="text-sm">{category.owner}</CardDescription>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/bsm/services/${category.id}`)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Services
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditDialog(category)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Category
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openDeleteDialog(category)} className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Category
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{category.description}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Services:</span>
                      <span className="ml-2 font-medium">{category.serviceCount}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Active Requests:</span>
                      <span className="ml-2 font-medium">{category.activeRequests}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filteredCategories.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No categories found</h3>
              <p className="text-muted-foreground text-center">
                Try adjusting your search criteria or create a new category
              </p>
            </CardContent>
          </Card>
        )}

        {/* Add Category Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent>
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
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddCategory}>Add Category</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Category Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
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
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-owner">Category Owner</Label>
                <Input
                  id="edit-owner"
                  value={newCategory.owner}
                  onChange={(e) => setNewCategory({ ...newCategory, owner: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditCategory}>Update Category</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Category Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Category</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{selectedCategory?.name}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
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
