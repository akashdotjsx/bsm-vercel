"use client"

import { useState } from "react"
import { X, Settings, MessageSquare, History, User, Calendar, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/lib/contexts/auth-context"
import {
  useArticleComments,
  useAddArticleComment,
  useDeleteArticleComment,
  useArticleRevisions,
  type ArticleComment,
  type ArticleRevision,
} from "@/hooks/use-article-interactions"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"

interface ArticleActionsTrayProps {
  isOpen: boolean
  onClose: () => void
  articleId: string
  articleStatus?: string
  onStatusChange?: (status: string) => void
}

export function ArticleActionsTray({
  isOpen,
  onClose,
  articleId,
  articleStatus = "draft",
  onStatusChange,
}: ArticleActionsTrayProps) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("settings")
  const [newComment, setNewComment] = useState("")

  // Fetch data
  const { data: comments, isLoading: commentsLoading } = useArticleComments(articleId)
  const { data: revisions, isLoading: revisionsLoading } = useArticleRevisions(articleId)

  // Mutations
  const addComment = useAddArticleComment()
  const deleteComment = useDeleteArticleComment()

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      toast.error("Comment cannot be empty")
      return
    }

    try {
      await addComment.mutateAsync({
        articleId,
        userId: user?.id!,
        organizationId: user?.organizationId!,
        content: newComment,
        isInternal: false,
      })
      setNewComment("")
      toast.success("Comment added successfully")
    } catch (error: any) {
      toast.error("Failed to add comment", {
        description: error.message,
      })
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment.mutateAsync({ commentId })
      toast.success("Comment deleted")
    } catch (error: any) {
      toast.error("Failed to delete comment", {
        description: error.message,
      })
    }
  }

  const getUserInitials = (comment: ArticleComment) => {
    const name = comment.user?.display_name || comment.user?.email || "?"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Tray */}
      <div className="fixed right-0 top-0 bottom-0 w-full md:w-[600px] bg-background border-l shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-muted/30">
          <h2 className="text-lg font-semibold">Article Actions</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 h-auto">
            <TabsTrigger
              value="settings"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3 text-[13px]"
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
            <TabsTrigger
              value="comments"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3 text-[13px]"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Comments
              {comments && comments.length > 0 && (
                <Badge variant="secondary" className="ml-2 text-[10px] h-5 px-1.5">
                  {comments.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3 text-[13px]"
            >
              <History className="h-4 w-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>

          {/* Settings Tab */}
          <TabsContent value="settings" className="flex-1 p-6 space-y-6 overflow-auto">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-3">General Settings</h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-[13px]">Article Status</Label>
                    <Select
                      value={articleStatus}
                      onValueChange={(value) => onStatusChange?.(value)}
                    >
                      <SelectTrigger className="mt-1.5 text-[13px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft" className="text-[13px]">
                          Draft
                        </SelectItem>
                        <SelectItem value="published" className="text-[13px]">
                          Published
                        </SelectItem>
                        <SelectItem value="archived" className="text-[13px]">
                          Archived
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Control the visibility and availability of this article
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-medium mb-3">Permissions</h3>
                <p className="text-[13px] text-muted-foreground">
                  Configure who can view and edit this article. Permission settings are
                  controlled at the organization level.
                </p>
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-medium mb-3">SEO & Metadata</h3>
                <p className="text-[13px] text-muted-foreground">
                  Search engine optimization settings for better discoverability.
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Comments Tab */}
          <TabsContent value="comments" className="flex-1 flex flex-col">
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-4">
                {commentsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : comments && comments.length > 0 ? (
                  comments.map((comment: ArticleComment) => (
                    <div
                      key={comment.id}
                      className="border rounded-lg p-4 space-y-3 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={comment.user?.avatar_url} />
                            <AvatarFallback className="text-xs bg-primary/10">
                              {getUserInitials(comment)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-[13px] font-medium">
                              {comment.user?.display_name || comment.user?.email}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(comment.created_at), {
                                addSuffix: true,
                              })}
                            </p>
                          </div>
                        </div>
                        {comment.user_id === user?.id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteComment(comment.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <p className="text-[13px] leading-relaxed whitespace-pre-wrap">
                        {comment.content}
                      </p>
                      {comment.is_internal && (
                        <Badge variant="secondary" className="text-[10px]">
                          Internal
                        </Badge>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
                    <p className="text-sm text-muted-foreground">No comments yet</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Be the first to leave feedback
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Add Comment Section */}
            <div className="p-6 border-t bg-muted/30 space-y-3">
              <Label className="text-[13px] font-medium">Add Comment</Label>
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts or feedback..."
                className="text-[13px] min-h-[100px] resize-none"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNewComment("")}
                  className="text-[13px]"
                  disabled={!newComment.trim()}
                >
                  Clear
                </Button>
                <Button
                  size="sm"
                  onClick={handleAddComment}
                  className="text-[13px] bg-[#7073fc] hover:bg-[#5a5dfc]"
                  disabled={!newComment.trim() || addComment.isPending}
                >
                  {addComment.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Post Comment
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="flex-1 overflow-auto">
            <ScrollArea className="h-full p-6">
              <div className="space-y-3">
                {revisionsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : revisions && revisions.length > 0 ? (
                  revisions.map((revision: ArticleRevision, index: number) => (
                    <div
                      key={revision.id}
                      className="border rounded-lg p-4 space-y-2 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={index === 0 ? "default" : "secondary"} className="text-[10px]">
                              v{revision.version_number}
                            </Badge>
                            {index === 0 && (
                              <Badge variant="outline" className="text-[10px]">
                                Current
                              </Badge>
                            )}
                          </div>
                          <p className="text-[13px] font-medium">{revision.title}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(revision.created_at), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>

                      {revision.change_description && (
                        <p className="text-[13px] text-muted-foreground">
                          {revision.change_description}
                        </p>
                      )}

                      <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
                        <User className="h-3 w-3" />
                        <span>{revision.user?.display_name || revision.user?.email}</span>
                        <Calendar className="h-3 w-3 ml-2" />
                        <span>
                          {new Date(revision.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <History className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
                    <p className="text-sm text-muted-foreground">No revision history</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Changes will appear here
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
