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
  Loader2,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useKnowledgeArticles, useDeleteArticle } from "@/hooks/use-knowledge-articles"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"

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
        .replace(/\bIt\b/g, "IT") // Fix IT Support case
    : "Category"

  // Fetch real articles from database
  const { data: articles, isLoading } = useKnowledgeArticles({
    category: categoryName,
    status: 'published',
    query: searchQuery,
    limit: 100,
  })

  // Delete mutation
  const { mutate: deleteArticle, isPending: isDeleting } = useDeleteArticle()

  const filteredArticles = articles || []

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
    if (!selectedArticle?.id) return

    deleteArticle(selectedArticle.id, {
      onSuccess: () => {
        toast.success('Article deleted', {
          description: `"${selectedArticle.title}" has been deleted successfully.`
        })
        setShowDeleteDialog(false)
        setSelectedArticle(null)
      },
      onError: (error: any) => {
        toast.error('Failed to delete article', {
          description: error.message || 'Please try again.'
        })
      }
    })
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
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={`skel-${i}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <div className="flex gap-4">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredArticles.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">No articles found in this category.</p>
              </CardContent>
            </Card>
          ) : (
            filteredArticles.map((article) => (
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
                        {article.author_name || 'Unknown'}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {article.updated_at ? formatDistanceToNow(new Date(article.updated_at), { addSuffix: true }) : 'Unknown'}
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {article.view_count || 0} views
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {Math.ceil((article.content?.length || 0) / 1000)} min read
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
          ))
          )}
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
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="text-[13px]" disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} className="text-[13px]" disabled={isDeleting}>
              {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete Article
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContent>
  )
}
