"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { PageContent } from "@/components/layout/page-content"
import { ArrowLeft, Save, Loader2, Upload, FileText, Sparkles, CheckCircle, Cloud } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCreateArticle, useArticleCategories } from "@/hooks/use-knowledge-base"
import { toast } from "sonner"
import { GoogleDriveBrowser } from "@/components/knowledge-base/google-drive-browser"

export default function NewArticlePage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"manual" | "import" | "google-drive">("manual")
  const [formData, setFormData] = useState({
    title: "",
    summary: "",
    content: "",
    category_id: "",
    status: "draft" as "draft" | "published",
    tags: "",
  })
  
  // Document import state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [aiSuggestions, setAiSuggestions] = useState<{
    category: string | null
    tags: string[]
    qualityScore: number
  } | null>(null)
  
  // Google Drive state
  const [googleDriveAccountId, setGoogleDriveAccountId] = useState<string | null>(null)
  const [isProcessingGoogleDrive, setIsProcessingGoogleDrive] = useState(false)

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

  const handleFileUpload = useCallback(
    async (file: File) => {
      setUploadedFile(file)
      setIsProcessing(true)
      setProcessingProgress(0)

      try {
        // Simulate progress for UX
        const progressInterval = setInterval(() => {
          setProcessingProgress((prev) => Math.min(prev + 10, 90))
        }, 200)

        const formData = new FormData()
        formData.append("file", file)
        formData.append("categories", JSON.stringify(categories?.map((c) => c.name) || []))

        const response = await fetch("/api/knowledge/import", {
          method: "POST",
          body: formData,
        })

        clearInterval(progressInterval)
        setProcessingProgress(100)

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || "Failed to process document")
        }

        const result = await response.json()
        const data = result.data

        // Find category ID from name
        const categoryId =
          categories?.find((c) => c.name === data.category)?.id || ""

        // Populate form with AI-enhanced data
        setFormData({
          title: data.title,
          summary: data.summary,
          content: data.content,
          category_id: categoryId,
          status: "draft",
          tags: data.tags.join(", "),
        })

        setAiSuggestions({
          category: data.category,
          tags: data.tags,
          qualityScore: data.qualityScore,
        })

        toast.success("Document processed successfully!", {
          description: "Review and edit the extracted content below",
        })
      } catch (error: any) {
        console.error("Upload error:", error)
        toast.error("Failed to process document", {
          description: error.message,
        })
      } finally {
        setIsProcessing(false)
      }
    },
    [categories]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer.files[0]
      if (file) {
        handleFileUpload(file)
      }
    },
    [handleFileUpload]
  )

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
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

  // Handle Google Drive files selection
  const handleGoogleDriveFilesSelected = async (files: any[]) => {
    if (files.length === 0) return

    setIsProcessingGoogleDrive(true)
    setProcessingProgress(0)

    try {
      // Process files one by one (can be enhanced to batch process)
      const file = files[0] // Start with first file
      
      toast.info(`Downloading and processing ${file.name}...`)

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProcessingProgress((prev) => Math.min(prev + 10, 90))
      }, 300)

      // Download file from Google Drive
      const downloadResponse = await fetch("/api/google-drive/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: googleDriveAccountId,
          fileId: file.id,
          fileName: file.name,
          mimeType: file.mimeType,
        }),
      })

      if (!downloadResponse.ok) {
        throw new Error("Failed to download file from Google Drive")
      }

      const downloadData = await downloadResponse.json()
      
      // Convert base64 content to file
      const contentBuffer = Buffer.from(downloadData.content, "base64")
      const blob = new Blob([contentBuffer], { type: downloadData.mimeType })
      const downloadedFile = new File([blob], downloadData.fileName, {
        type: downloadData.mimeType,
      })

      // Process through existing import pipeline
      const formData = new FormData()
      formData.append("file", downloadedFile)
      formData.append("categories", JSON.stringify(categories?.map((c) => c.name) || []))

      const response = await fetch("/api/knowledge/import", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      setProcessingProgress(100)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to process document")
      }

      const result = await response.json()
      const data = result.data

      // Find category ID from name
      const categoryId = categories?.find((c) => c.name === data.category)?.id || ""

      // Populate form with AI-enhanced data
      setFormData({
        title: data.title,
        summary: data.summary,
        content: data.content,
        category_id: categoryId,
        status: "draft",
        tags: data.tags.join(", "),
      })

      setAiSuggestions({
        category: data.category,
        tags: data.tags,
        qualityScore: data.qualityScore,
      })

      setUploadedFile(downloadedFile)

      toast.success("Document imported from Google Drive!", {
        description: "Review and edit the extracted content below",
      })
    } catch (error: any) {
      console.error("Google Drive import error:", error)
      toast.error("Failed to import from Google Drive", {
        description: error.message,
      })
    } finally {
      setIsProcessingGoogleDrive(false)
    }
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

        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="manual">
              <FileText className="h-4 w-4 mr-2" />
              Manual Entry
            </TabsTrigger>
            <TabsTrigger value="import">
              <Upload className="h-4 w-4 mr-2" />
              Upload File
            </TabsTrigger>
            <TabsTrigger value="google-drive">
              <Cloud className="h-4 w-4 mr-2" />
              Google Drive
            </TabsTrigger>
          </TabsList>

          <TabsContent value="import" className="space-y-6">
            {/* Upload Area */}
            {!uploadedFile && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    AI-Powered Document Import
                  </CardTitle>
                  <CardDescription>
                    Upload your document and let AI extract, format, and enhance the content
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    className="border-2 border-dashed rounded-lg p-12 text-center hover:border-primary transition-colors cursor-pointer"
                    onClick={() => document.getElementById("file-upload")?.click()}
                  >
                    <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">
                      Drop your document here or click to browse
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Supported formats: Word (.docx), Markdown (.md), Text (.txt), HTML
                    </p>
                    <Badge variant="outline" className="gap-1">
                      <Sparkles className="h-3 w-3" />
                      AI will auto-categorize and tag
                    </Badge>
                    <input
                      id="file-upload"
                      type="file"
                      accept=".docx,.doc,.md,.txt,.html,.htm"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileUpload(file)
                      }}
                      className="hidden"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Processing State */}
            {isProcessing && (
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <div>
                          <p className="font-medium">Processing document...</p>
                          <p className="text-sm text-muted-foreground">
                            {uploadedFile?.name}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {processingProgress}%
                      </span>
                    </div>
                    <Progress value={processingProgress} />
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>✓ Parsing document structure</p>
                      <p>✓ Extracting content and formatting</p>
                      <p className="flex items-center gap-2">
                        <Sparkles className="h-3 w-3" />
                        AI analyzing and enhancing content...
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Success - Show Form */}
            {uploadedFile && !isProcessing && (
              <Card className="border-green-200 bg-green-50/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div className="flex-1">
                      <p className="font-medium text-green-900">
                        Document processed successfully!
                      </p>
                      <p className="text-sm text-green-700">
                        AI has extracted and enhanced the content. Review and edit below.
                      </p>
                    </div>
                    {aiSuggestions && (
                      <Badge variant="outline" className="bg-white">
                        Quality: {aiSuggestions.qualityScore}/100
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="google-drive" className="space-y-6">
            {/* Google Drive Browser */}
            <GoogleDriveBrowser
              onFilesSelected={handleGoogleDriveFilesSelected}
              onConnect={(accountId) => setGoogleDriveAccountId(accountId)}
            />

            {/* Processing State */}
            {isProcessingGoogleDrive && (
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <div>
                          <p className="font-medium">Processing from Google Drive...</p>
                          <p className="text-sm text-muted-foreground">
                            Downloading and analyzing document
                          </p>
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {processingProgress}%
                      </span>
                    </div>
                    <Progress value={processingProgress} />
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>✓ Downloading from Google Drive</p>
                      <p>✓ Parsing document structure</p>
                      <p className="flex items-center gap-2">
                        <Sparkles className="h-3 w-3" />
                        AI analyzing and enhancing content...
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Success - Show indicator */}
            {uploadedFile && !isProcessingGoogleDrive && activeTab === "google-drive" && (
              <Card className="border-green-200 bg-green-50/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div className="flex-1">
                      <p className="font-medium text-green-900">
                        Document imported successfully!
                      </p>
                      <p className="text-sm text-green-700">
                        Review and edit the extracted content below.
                      </p>
                    </div>
                    {aiSuggestions && (
                      <Badge variant="outline" className="bg-white">
                        Quality: {aiSuggestions.qualityScore}/100
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="manual">
            <Card>
              <CardHeader>
                <CardTitle>Write Article Manually</CardTitle>
                <CardDescription>
                  Create your article from scratch with full control
                </CardDescription>
              </CardHeader>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Article Form (shown for all tabs when ready) */}
        {(activeTab === "manual" || 
          (activeTab === "import" && uploadedFile && !isProcessing) ||
          (activeTab === "google-drive" && uploadedFile && !isProcessingGoogleDrive)) && (
          <form id="article-form" onSubmit={handleSubmit}>
            <Card>
              <CardContent className="space-y-6 pt-6">
                {/* AI Suggestions Banner */}
                {aiSuggestions && (
                  <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                    <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">AI Suggestions Applied</p>
                      {aiSuggestions.category && (
                        <p className="text-xs text-muted-foreground">
                          Category: {aiSuggestions.category}
                        </p>
                      )}
                      {aiSuggestions.tags.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Tags: {aiSuggestions.tags.join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                )}

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
        )}
      </div>
    </PageContent>
  )
}
