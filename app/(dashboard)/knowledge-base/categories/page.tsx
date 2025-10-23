"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PageContent } from "@/components/layout/page-content"
import {
  ArrowLeft,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Folder,
  Search,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  useArticleCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "@/hooks/use-knowledge-base"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"

export default function CategoriesManagementPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "",
    color: "",
  })

  const { data: categories, isLoading } = useArticleCategories()
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const deleteCategory = useDeleteCategory()

  const filteredCategories = categories?.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreateOpen = () => {
    setFormData({ name: "", description: "", icon: "", color: "" })
    setCreateDialogOpen(true)
  }

  const handleEditOpen = (category: any) => {
    setSelectedCategory(category)
    setFormData({
      name: category.name,
      description: category.description || "",
      icon: category.icon || "",
      color: category.color || "",
    })
    setEditDialogOpen(true)
  }

  const handleDeleteOpen = (category: any) => {
    setSelectedCategory(category)
    setDeleteDialogOpen(true)
  }

  const handleCreate = () => {
    if (!formData.name.trim()) {
      toast.error("Category name is required")
      return
    }

    createCategory.mutate(
      {
        name: formData.name,
        description: formData.description || undefined,
        icon: formData.icon || undefined,
        color: formData.color || undefined,
      },
      {
        onSuccess: () => {
          setCreateDialogOpen(false)
          setFormData({ name: "", description: "", icon: "", color: "" })
        },
      }
    )
  }

  const handleUpdate = () => {
    if (!formData.name.trim()) {
      toast.error("Category name is required")
      return
    }

    if (!selectedCategory) return

    updateCategory.mutate(
      {
        id: selectedCategory.id,
        name: formData.name,
        description: formData.description || undefined,
        icon: formData.icon || undefined,
        color: formData.color || undefined,
      },
      {
        onSuccess: () => {
          setEditDialogOpen(false)
          setSelectedCategory(null)
          setFormData({ name: "", description: "", icon: "", color: "" })
        },
      }
    )
  }

  const handleDelete = () => {
    if (!selectedCategory) return

    deleteCategory.mutate(selectedCategory.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false)
        setSelectedCategory(null)
      },
    })
  }

  return (
    <PageContent
      breadcrumb={[
        { label: "Knowledge Base", href: "/knowledge-base" },
        { label: "Categories" },
      ]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight mt-2">
              Category Management
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Organize your knowledge base articles into categories
            </p>
          </div>
          <Button onClick={handleCreateOpen}>
            <Plus className="h-4 w-4 mr-2" />
            New Category
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Folder className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Categories</p>
                  <p className="text-2xl font-semibold">{categories?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Folder className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Articles</p>
                  <p className="text-2xl font-semibold">
                    {categories?.reduce((sum, cat) => sum + (cat.count || 0), 0) || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Folder className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg per Category</p>
                  <p className="text-2xl font-semibold">
                    {categories && categories.length > 0
                      ? Math.round(
                          categories.reduce((sum, cat) => sum + (cat.count || 0), 0) /
                            categories.length
                        )
                      : 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Categories Table */}
        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredCategories && filteredCategories.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-center">Articles</TableHead>
                    <TableHead className="text-center">Icon</TableHead>
                    <TableHead className="text-center">Color</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories.map((category: any) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Folder className="h-4 w-4 text-muted-foreground" />
                          {category.name}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-md truncate text-muted-foreground">
                        {category.description || "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{category.count || 0}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {category.icon ? (
                          <span className="text-lg">{category.icon}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {category.color ? (
                          <div className="flex items-center justify-center gap-2">
                            <div
                              className="h-4 w-4 rounded border"
                              style={{ backgroundColor: category.color }}
                            />
                            <span className="text-xs text-muted-foreground">
                              {category.color}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditOpen(category)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteOpen(category)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No categories found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery
                    ? "Try adjusting your search"
                    : "Get started by creating your first category"}
                </p>
                {!searchQuery && (
                  <Button onClick={handleCreateOpen}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Category
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Category</DialogTitle>
            <DialogDescription>
              Add a new category to organize your knowledge base articles
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="create-name"
                placeholder="e.g., Getting Started"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-description">Description</Label>
              <Input
                id="create-description"
                placeholder="Brief description (optional)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-icon">Icon</Label>
                <Input
                  id="create-icon"
                  placeholder="📚"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Emoji or icon character</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-color">Color</Label>
                <Input
                  id="create-color"
                  type="color"
                  value={formData.color || "#3b82f6"}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createCategory.isPending}>
              {createCategory.isPending ? "Creating..." : "Create Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>Update category information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-name"
                placeholder="e.g., Getting Started"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                placeholder="Brief description (optional)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-icon">Icon</Label>
                <Input
                  id="edit-icon"
                  placeholder="📚"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Emoji or icon character</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-color">Color</Label>
                <Input
                  id="edit-color"
                  type="color"
                  value={formData.color || "#3b82f6"}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateCategory.isPending}>
              {updateCategory.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedCategory?.name}"?
              {selectedCategory && selectedCategory.count > 0 && (
                <span className="block mt-2 text-amber-600">
                  Warning: This category has {selectedCategory.count} article(s). Deleting it
                  will remove the category association from these articles.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteCategory.isPending}
            >
              {deleteCategory.isPending ? "Deleting..." : "Delete Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContent>
  )
}
