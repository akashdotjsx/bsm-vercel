"use client"

import { useState } from "react"
import { PageContent } from "@/components/layout/page-content"
import { useRouter, useParams } from "next/navigation"
import {
  Search,
  ArrowLeft,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Clock,
  User,
  Calendar,
  Filter,
  SortAsc,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Sample articles data
const sampleArticles = [
  {
    id: 1,
    title: "Setting up Billing Automation",
    description: "Complete guide to configuring automated billing processes and invoice generation",
    author: "John Smith",
    lastModified: "2 days ago",
    status: "Published",
    views: 245,
    readTime: "5 min read",
  },
  {
    id: 2,
    title: "Financial Reporting Best Practices",
    description: "Guidelines for creating comprehensive financial reports and analytics",
    author: "Sarah Johnson",
    lastModified: "1 week ago",
    status: "Draft",
    views: 89,
    readTime: "8 min read",
  },
  {
    id: 3,
    title: "Invoice Management Workflow",
    description: "Step-by-step process for managing invoices from creation to payment",
    author: "Mike Davis",
    lastModified: "3 days ago",
    status: "Published",
    views: 156,
    readTime: "6 min read",
  },
]

export default function CategoryArticlesPage() {
  const router = useRouter()
  const params = useParams()
  const [searchQuery, setSearchQuery] = useState("")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedArticle, setSelectedArticle] = useState<any>(null)

  const categoryName = params.slug
    ? String(params.slug)
        .replace(/-/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase())
    : "Category"

  const filteredArticles = sampleArticles.filter(
    (article) =>
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleArticleClick = (article: any) => {
    router.push(`/knowledge-base/article/${article.id}`)
  }

  const handleEditArticle = (article: any) => {
    router.push(`/knowledge-base/article/${article.id}/edit`)
  }

  const handleDeleteArticle = (article: any) => {
    setSelectedArticle(article)
    setShowDeleteDialog(true)
  }

  const handleConfirmDelete = () => {
    console.log("[v0] Deleting article:", selectedArticle?.title)
    alert(`Article "${selectedArticle?.title}" deleted successfully!`)
    setShowDeleteDialog(false)
  }

  return (
    <PageContent breadcrumb={[{ label: "Knowledge Base", href: "/knowledge-base" }, { label: categoryName }]}>
      <div className="space-y-6 text-[13px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-[13px]">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="space-y-1">
              <h1 className="text-[13px] font-semibold tracking-tight">{categoryName}</h1>
              <p className="text-muted-foreground text-[13px]">{filteredArticles.length} articles in this category</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/knowledge-base/article/new?category=${params.slug}`)}
              className="text-[13px]"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Article
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 text-[13px]"
            />
          </div>
          <Button variant="outline" size="sm" className="text-[13px] bg-transparent">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm" className="text-[13px] bg-transparent">
            <SortAsc className="h-4 w-4 mr-2" />
            Sort
          </Button>
        </div>

        <div className="grid gap-4">
          {filteredArticles.map((article) => (
            <Card key={article.id} className="hover:shadow-md transition-all duration-200 group">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 cursor-pointer" onClick={() => handleArticleClick(article)}>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-[11px] font-semibold group-hover:text-primary transition-colors">
                        {article.title}
                      </h3>
                      <Badge variant={article.status === "Published" ? "default" : "secondary"} className="text-[11px]">
                        {article.status}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mb-4 text-[13px]">{article.description}</p>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {article.author}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {article.lastModified}
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {article.views} views
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {article.readTime}
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="text-[13px]">
                      <DropdownMenuItem onClick={() => handleArticleClick(article)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Article
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEditArticle(article)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Article
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteArticle(article)} className="text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Article
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Article</DialogTitle>
            <DialogDescription className="text-[13px]">
              Are you sure you want to delete "{selectedArticle?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="text-[13px]">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} className="text-[13px]">
              Delete Article
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContent>
  )
}
