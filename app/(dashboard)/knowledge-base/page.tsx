"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PageContent } from "@/components/layout/page-content"
import {
  Search,
  BookOpen,
  Plus,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Bookmark,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Eye,
  Calendar,
  User,
  Folder,
  Star,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  useKnowledgeArticles,
  useArticleCategories,
  useDeleteArticle,
  useArticleBookmarks,
  useToggleArticleBookmark,
  useIsArticleBookmarked,
} from "@/hooks/use-knowledge-base"
import { useAuth } from "@/lib/contexts/auth-context"
import { formatDistanceToNow } from "date-fns"

export default function KnowledgeBasePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("published")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [articleToDelete, setArticleToDelete] = useState<string | null>(null)

  // Fetch data
  const { data: categories, isLoading: categoriesLoading } = useArticleCategories()
  const { data: articles, isLoading: articlesLoading } = useKnowledgeArticles({
    status: selectedStatus as any,
    query: searchQuery,
    category_id: selectedCategory === "all" ? undefined : selectedCategory,
    limit: 100,
  })
  const { data: bookmarks } = useArticleBookmarks()
  const deleteArticle = useDeleteArticle()
  const toggleBookmark = useToggleArticleBookmark()

  const loading = categoriesLoading || articlesLoading

  const handleDeleteArticle = () => {
    if (articleToDelete) {
      deleteArticle.mutate(articleToDelete)
      setDeleteDialogOpen(false)
      setArticleToDelete(null)
    }
  }

  const handleBookmarkToggle = (articleId: string, isBookmarked: boolean, bookmarkId?: string | null) => {
    toggleBookmark.mutate({ articleId, isBookmarked, bookmarkId })
  }

  const isArticleBookmarked = (articleId: string) => {
    return bookmarks?.some(b => b.article_id === articleId)
  }

  const getBookmarkId = (articleId: string) => {
    return bookmarks?.find(b => b.article_id === articleId)?.id
  }

  return (
    <PageContent breadcrumb={[{ label: "Knowledge Base" }]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Knowledge Base</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Browse and manage knowledge articles
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => router.push("/knowledge-base/categories")}
            >
              <Folder className="h-4 w-4 mr-2" />
              Manage Categories
            </Button>
            <Button onClick={() => router.push("/knowledge-base/new")}>
              <Plus className="h-4 w-4 mr-2" />
              New Article
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Articles</p>
                  <p className="text-2xl font-semibold">{articles?.length || 0}</p>
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
                  <p className="text-sm text-muted-foreground">Categories</p>
                  <p className="text-2xl font-semibold">{categories?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Star className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Bookmarked</p>
                  <p className="text-2xl font-semibold">{bookmarks?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Eye className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Views</p>
                  <p className="text-2xl font-semibold">
                    {articles?.reduce((sum, a) => sum + (a.view_count || 0), 0) || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name} ({cat.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full md:w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Articles List */}
        <div className="space-y-3">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <div className="flex gap-2">
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-6 w-20" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : articles && articles.length > 0 ? (
            articles.map((article: any) => {
              const isBookmarked = isArticleBookmarked(article.id)
              const bookmarkId = getBookmarkId(article.id)

              return (
                <Card
                  key={article.id}
                  className="hover:shadow-md transition-all cursor-pointer group"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <BookOpen className="h-6 w-6 text-primary" />
                      </div>
                      <div
                        className="flex-1 min-w-0"
                        onClick={() => router.push(`/knowledge-base/article/${article.id}`)}
                      >
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                            {article.title}
                          </h3>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleBookmarkToggle(article.id, isBookmarked, bookmarkId)
                              }}
                            >
                              <Bookmark
                                className={`h-4 w-4 ${isBookmarked ? "fill-current text-yellow-500" : ""}`}
                              />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    router.push(`/knowledge-base/article/${article.id}/edit`)
                                  }}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setArticleToDelete(article.id)
                                    setDeleteDialogOpen(true)
                                  }}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        {article.summary && (
                          <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                            {article.summary}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          {article.category && (
                            <Badge variant="secondary" className="gap-1">
                              <Folder className="h-3 w-3" />
                              {typeof article.category === 'object' ? article.category.name : article.category}
                            </Badge>
                          )}
                          <Badge variant="outline">{article.status}</Badge>
                          {article.author && (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>{article.author.display_name || article.author.email}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {formatDistanceToNow(new Date(article.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            <span>{article.view_count || 0} views</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <ThumbsUp className="h-3 w-3" />
                            <span>{article.helpful_count || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No articles found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery
                    ? "Try adjusting your search or filters"
                    : "Get started by creating your first article"}
                </p>
                <Button onClick={() => router.push("/knowledge-base/new")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Article
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Article</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this article? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteArticle}
              disabled={deleteArticle.isPending}
            >
              {deleteArticle.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContent>
  )
}
