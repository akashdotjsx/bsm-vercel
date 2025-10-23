"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PageContent } from "@/components/layout/page-content"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCreateArticle, useArticleCategories } from "@/hooks/use-knowledge-base"
import { toast } from "sonner"

export default function NewArticlePage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: "",
    summary: "",
    content: "",
    category_id: "",
    status: "draft" as "draft" | "published",
    tags: "",
  })

  const { data: categories } = useArticleCategories()
  const createArticle = useCreateArticle()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      toast.error("Title is required")
      return
    }

    if (!formData.content.trim()) {
      toast.error("Content is required")
      return
    }

    const tagsArray = formData.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)

    createArticle.mutate(
      {
        title: formData.title,
        summary: formData.summary || undefined,
        content: formData.content,
        category_id: formData.category_id || undefined,
        status: formData.status,
        tags: tagsArray.length > 0 ? tagsArray : undefined,
      },
      {
        onSuccess: (data) => {
          toast.success("Article created successfully")
          router.push(`/knowledge-base/article/${data.id}`)
        },
      }
    )
  }

  const handleSaveDraft = () => {
    setFormData({ ...formData, status: "draft" })
    setTimeout(() => {
      const form = document.getElementById("article-form") as HTMLFormElement
      form?.requestSubmit()
    }, 0)
  }

  const handlePublish = () => {
    setFormData({ ...formData, status: "published" })
    setTimeout(() => {
      const form = document.getElementById("article-form") as HTMLFormElement
      form?.requestSubmit()
    }, 0)
  }

  return (
    <PageContent
      breadcrumb={[
        { label: "Knowledge Base", href: "/knowledge-base" },
        { label: "New Article" },
      ]}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={createArticle.isPending}
            >
              {createArticle.isPending && formData.status === "draft" ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Draft
            </Button>
            <Button onClick={handlePublish} disabled={createArticle.isPending}>
              {createArticle.isPending && formData.status === "published" ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Publish
            </Button>
          </div>
        </div>

        {/* Form */}
        <form id="article-form" onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Create New Article</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">
                  Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="Enter article title..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              {/* Summary */}
              <div className="space-y-2">
                <Label htmlFor="summary">Summary</Label>
                <Textarea
                  id="summary"
                  placeholder="Brief summary of the article (optional)..."
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  placeholder="Enter tags separated by commas (e.g., tutorial, guide, howto)"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Separate multiple tags with commas
                </p>
              </div>

              {/* Content */}
              <div className="space-y-2">
                <Label htmlFor="content">
                  Content <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="content"
                  placeholder="Write your article content here... (Markdown supported)"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={20}
                  className="font-mono text-sm"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  You can use Markdown formatting: **bold**, *italic*, # headings, - lists, etc.
                </p>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </PageContent>
  )
}
