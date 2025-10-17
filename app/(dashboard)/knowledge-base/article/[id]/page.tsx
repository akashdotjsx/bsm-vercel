"use client"

import { useState, useEffect } from "react"
import { PageContent } from "@/components/layout/page-content"
import { useRouter, useParams } from "next/navigation"
import {
  ArrowLeft,
  Edit,
  Settings,
  MessageSquare,
  History,
  Share2,
  Bookmark,
  BookmarkCheck,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Calendar,
  User,
  Clock,
  Tag,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { useArticle, useUpdateArticle } from "@/hooks/use-knowledge-articles"
import {
  useIsArticleBookmarked,
  useToggleArticleBookmark,
  useArticleVoteCounts,
  useUserArticleVote,
  useVoteArticle,
} from "@/hooks/use-article-interactions"
import { ArticleActionsTray } from "@/components/knowledge-base/article-actions-tray"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

export default function ArticlePage() {
  const router = useRouter()
  const params = useParams()
  const [showTray, setShowTray] = useState(false)

  // Fetch real article data
  const articleId = params.id as string
  const { data: article, isLoading, error } = useArticle(articleId)
  const { mutate: updateArticle, isPending: isUpdating } = useUpdateArticle()

  // Fetch article interactions
  const { data: bookmarkStatus } = useIsArticleBookmarked(articleId)
  const { toggle: toggleBookmark, isLoading: isTogglingBookmark } = useToggleArticleBookmark()
  const { data: voteCounts } = useArticleVoteCounts(articleId)
  const { data: userVote } = useUserArticleVote(articleId)
  const { vote: voteArticle, isLoading: isVoting } = useVoteArticle()

  const handleBookmarkToggle = async () => {
    try {
      await toggleBookmark(
        articleId,
        bookmarkStatus?.isBookmarked || false,
        bookmarkStatus?.bookmarkId
      )
      toast.success(
        bookmarkStatus?.isBookmarked ? 'Bookmark removed' : 'Article bookmarked'
      )
    } catch (error: any) {
      toast.error('Failed to toggle bookmark', {
        description: error.message,
      })
    }
  }

  const handleVote = async (voteType: 'helpful' | 'not_helpful') => {
    try {
      await voteArticle(articleId, voteType)
      toast.success('Thank you for your feedback!')
    } catch (error: any) {
      toast.error('Failed to submit vote', {
        description: error.message,
      })
    }
  }

  const handleStatusChange = (newStatus: string) => {
    updateArticle(
      {
        id: articleId,
        status: newStatus,
      },
      {
        onSuccess: () => {
          toast.success('Article status updated', {
            description: `Status changed to ${newStatus}`
          })
        },
        onError: (error: any) => {
          toast.error('Failed to update status', {
            description: error.message || 'Please try again.'
          })
        }
      }
    )
  }

  if (isLoading) {
    return (
      <PageContent breadcrumb={[{ label: "Knowledge Base", href: "/knowledge-base" }, { label: "Loading..." }]}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-24" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-24" />
            </div>
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </CardContent>
          </Card>
        </div>
      </PageContent>
    )
  }

  if (error || !article) {
    return (
      <PageContent breadcrumb={[{ label: "Knowledge Base", href: "/knowledge-base" }, { label: "Error" }]}>
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">Article not found or failed to load.</p>
            <Button onClick={() => router.back()}>Go Back</Button>
          </CardContent>
        </Card>
      </PageContent>
    )
  }

  return (
    <PageContent
      breadcrumb={[
        { label: "Knowledge Base", href: "/knowledge-base" },
        { label: article.category || 'Category', href: `/knowledge-base/category/${article.category?.toLowerCase().replace(/\s+/g, '-') || 'uncategorized'}` },
        { label: article.title },
      ]}
    >
      <div className="space-y-6 text-[13px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-[13px]">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowTray(true)} 
              className="text-[13px]"
            >
              <Settings className="h-4 w-4 mr-2" />
              Manage Article
            </Button>
            <Button 
              onClick={() => router.push(`/knowledge-base/article/${article.id}/edit`)} 
              className="bg-[#7073fc] hover:bg-[#5a5dfc] text-[13px]"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Article
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-[13px]">{article.title}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
                  <div className="flex items-center gap-2">
                    <Badge className="text-[11px]">{article.status}</Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/knowledge-base/article/${article.id}/edit`)}
                      className="text-[13px]"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap text-[13px] leading-relaxed">{article.content}</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Article Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start text-[13px] bg-transparent"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href)
                    toast.success('Link copied to clipboard')
                  }}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Article
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className={cn(
                    "w-full justify-start text-[13px] bg-transparent",
                    bookmarkStatus?.isBookmarked && "text-primary"
                  )}
                  onClick={handleBookmarkToggle}
                  disabled={isTogglingBookmark}
                >
                  {isTogglingBookmark ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : bookmarkStatus?.isBookmarked ? (
                    <BookmarkCheck className="h-4 w-4 mr-2" />
                  ) : (
                    <Bookmark className="h-4 w-4 mr-2" />
                  )}
                  {bookmarkStatus?.isBookmarked ? 'Bookmarked' : 'Bookmark'}
                </Button>
                <Separator />
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className={cn(
                      "flex-1 text-[13px] bg-transparent",
                      userVote?.vote_type === 'helpful' && "text-green-600 border-green-600"
                    )}
                    onClick={() => handleVote('helpful')}
                    disabled={isVoting}
                  >
                    <ThumbsUp className="h-4 w-4 mr-1" />
                    {voteCounts?.helpful || 0}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className={cn(
                      "flex-1 text-[13px] bg-transparent",
                      userVote?.vote_type === 'not_helpful' && "text-red-600 border-red-600"
                    )}
                    onClick={() => handleVote('not_helpful')}
                    disabled={isVoting}
                  >
                    <ThumbsDown className="h-4 w-4 mr-1" />
                    {voteCounts?.notHelpful || 0}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {article.tags && article.tags.length > 0 ? (
                    article.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-[11px]">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">No tags</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Article Actions Tray */}
      <ArticleActionsTray
        isOpen={showTray}
        onClose={() => setShowTray(false)}
        articleId={articleId}
        articleStatus={article.status}
        onStatusChange={handleStatusChange}
      />
    </PageContent>
  )
}
