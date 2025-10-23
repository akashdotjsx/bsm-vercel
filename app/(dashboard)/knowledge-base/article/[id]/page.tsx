"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PageContent } from "@/components/layout/page-content"
import {
  ArrowLeft,
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
  Clock,
  Send,
  MoreVertical,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
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
} from "@/components/ui/dropdown-menu"
import {
  useArticle,
  useDeleteArticle,
  useIsArticleBookmarked,
  useToggleArticleBookmark,
  useArticleVotes,
  useUserArticleVote,
  useVoteArticle,
  useArticleComments,
  useAddArticleComment,
  useDeleteArticleComment,
} from "@/hooks/use-knowledge-base"
import { useAuth } from "@/lib/contexts/auth-context"
import { formatDistanceToNow } from "date-fns"
import ReactMarkdown from "react-markdown"

export default function ArticleDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { user } = useAuth()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [commentText, setCommentText] = useState("")

  // Fetch data
  const { data: article, isLoading } = useArticle(params.id)
  const { data: bookmarkStatus } = useIsArticleBookmarked(params.id)
  const { data: voteCounts } = useArticleVotes(params.id)
  const { data: userVote } = useUserArticleVote(params.id)
  const { data: comments } = useArticleComments(params.id)

  // Mutations
  const deleteArticle = useDeleteArticle()
  const toggleBookmark = useToggleArticleBookmark()
  const voteArticle = useVoteArticle()
  const addComment = useAddArticleComment()
  const deleteComment = useDeleteArticleComment()

  const handleDelete = () => {
    deleteArticle.mutate(params.id, {
      onSuccess: () => {
        router.push("/knowledge-base")
      },
    })
  }

  const handleBookmark = () => {
    if (bookmarkStatus) {
      toggleBookmark.mutate({
        articleId: params.id,
        isBookmarked: bookmarkStatus.isBookmarked,
        bookmarkId: bookmarkStatus.bookmarkId,
      })
    }
  }

  const handleVote = (voteType: 'helpful' | 'not_helpful') => {
    voteArticle.mutate({ articleId: params.id, voteType })
  }

  const handleAddComment = () => {
    if (commentText.trim()) {
      addComment.mutate(
        { articleId: params.id, content: commentText },
        {
          onSuccess: () => {
            setCommentText("")
          },
        }
      )
    }
  }

  const handleDeleteComment = (commentId: string) => {
    deleteComment.mutate({ commentId, articleId: params.id })
  }

  if (isLoading) {
    return (
      <PageContent breadcrumb={[{ label: "Knowledge Base", href: "/knowledge-base" }, { label: "Article" }]}>
        <div className="space-y-6">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-96 w-full" />
        </div>
      </PageContent>
    )
  }

  if (!article) {
    return (
      <PageContent breadcrumb={[{ label: "Knowledge Base", href: "/knowledge-base" }, { label: "Article" }]}>
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-2">Article not found</h2>
          <p className="text-muted-foreground mb-4">The article you're looking for doesn't exist</p>
          <Button onClick={() => router.push("/knowledge-base")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Knowledge Base
          </Button>
        </div>
      </PageContent>
    )
  }

  return (
    <PageContent
      breadcrumb={[
        { label: "Knowledge Base", href: "/knowledge-base" },
        { label: article.title },
      ]}
    >
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBookmark}
              disabled={toggleBookmark.isPending}
            >
              <Bookmark
                className={`h-4 w-4 mr-2 ${bookmarkStatus?.isBookmarked ? "fill-current text-yellow-500" : ""}`}
              />
              {bookmarkStatus?.isBookmarked ? "Bookmarked" : "Bookmark"}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push(`/knowledge-base/article/${params.id}/edit`)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Article
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDeleteDialogOpen(true)} className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Article
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Article Content */}
        <Card>
          <CardHeader>
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{article.status}</Badge>
                {article.category && (
                  <Badge variant="outline" className="gap-1">
                    <Folder className="h-3 w-3" />
                    {typeof article.category === 'object' ? article.category.name : article.category}
                  </Badge>
                )}
              </div>
              <CardTitle className="text-3xl">{article.title}</CardTitle>
              {article.summary && (
                <p className="text-muted-foreground text-lg">{article.summary}</p>
              )}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {article.author && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{article.author.display_name || article.author.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDistanceToNow(new Date(article.created_at), { addSuffix: true })}</span>
                </div>
                {article.updated_at !== article.created_at && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Updated {formatDistanceToNow(new Date(article.updated_at), { addSuffix: true })}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <span>{article.view_count || 0} views</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown>{article.content}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>

        {/* Voting Section */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold mb-1">Was this article helpful?</h3>
                <p className="text-sm text-muted-foreground">Let us know if this article was useful</p>
              </div>
              <div className="flex items-center gap-4">
                <Button
                  variant={userVote?.vote_type === 'helpful' ? 'default' : 'outline'}
                  onClick={() => handleVote('helpful')}
                  disabled={voteArticle.isPending}
                  className="gap-2"
                >
                  <ThumbsUp className="h-4 w-4" />
                  Helpful ({voteCounts?.helpful || 0})
                </Button>
                <Button
                  variant={userVote?.vote_type === 'not_helpful' ? 'default' : 'outline'}
                  onClick={() => handleVote('not_helpful')}
                  disabled={voteArticle.isPending}
                  className="gap-2"
                >
                  <ThumbsDown className="h-4 w-4" />
                  Not Helpful ({voteCounts?.notHelpful || 0})
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comments Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Comments ({comments?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Add Comment */}
            {user && (
              <div className="space-y-3">
                <Textarea
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={3}
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleAddComment}
                    disabled={!commentText.trim() || addComment.isPending}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {addComment.isPending ? "Posting..." : "Post Comment"}
                  </Button>
                </div>
              </div>
            )}

            {comments && comments.length > 0 && (
              <>
                <Separator />
                <div className="space-y-4">
                  {comments.map((comment: any) => (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={comment.user?.avatar_url} />
                        <AvatarFallback>
                          {comment.user?.display_name?.[0] || comment.user?.email?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {comment.user?.display_name || comment.user?.email}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          {user && comment.user_id === user.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleDeleteComment(comment.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {comments && comments.length === 0 && !user && (
              <p className="text-center text-muted-foreground py-8">No comments yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Article</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{article.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteArticle.isPending}
            >
              {deleteArticle.isPending ? "Deleting..." : "Delete Article"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContent>
  )
}
