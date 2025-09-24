"use client"

import { useState } from "react"
import { PlatformLayout } from "@/components/layout/platform-layout"
import {
  Search,
  CreditCard,
  Server,
  Wrench,
  AlertTriangle,
  RefreshCw,
  Package,
  Shield,
  Users,
  Settings,
  BarChart3,
  Headphones,
  Bot,
  Sparkles,
  TrendingUp,
  BookOpen,
  Zap,
  MoreVertical,
  Edit,
  Trash2,
  Plus,
  Send,
  X,
  Loader2,
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

const knowledgeCategories = [
  {
    name: "Billing & Finance",
    icon: CreditCard,
    articles: 12,
    description: "Billing processes, invoicing, and financial management",
    aiInsights: "3 articles need updates based on recent policy changes",
    trending: false,
  },
  {
    name: "IT Operations",
    icon: Server,
    articles: 28,
    description: "Infrastructure management and IT operations guides",
    aiInsights: "Most searched category this month (+45% views)",
    trending: true,
  },
  {
    name: "Service Operations",
    icon: Wrench,
    articles: 35,
    description: "Service delivery and operational procedures",
    aiInsights: "2 knowledge gaps detected from recent tickets",
    trending: false,
  },
  {
    name: "Incident Management",
    icon: AlertTriangle,
    articles: 18,
    description: "Incident response and resolution procedures",
    aiInsights: "High relevance to current ticket volume",
    trending: true,
  },
  {
    name: "Change Management",
    icon: RefreshCw,
    articles: 15,
    description: "Change control processes and approval workflows",
    aiInsights: "AI suggests 4 new articles based on workflow patterns",
    trending: false,
  },
  {
    name: "Asset Management",
    icon: Package,
    articles: 22,
    description: "IT asset tracking and lifecycle management",
    aiInsights: "Content freshness score: 87% (good)",
    trending: false,
  },
  {
    name: "Security & Compliance",
    icon: Shield,
    articles: 19,
    description: "Security policies and compliance requirements",
    aiInsights: "5 articles flagged for compliance review",
    trending: false,
  },
  {
    name: "User Management",
    icon: Users,
    articles: 14,
    description: "User accounts, permissions, and access control",
    aiInsights: "Low engagement - consider restructuring content",
    trending: false,
  },
  {
    name: "System Administration",
    icon: Settings,
    articles: 31,
    description: "System configuration and administrative tasks",
    aiInsights: "Most comprehensive category - well maintained",
    trending: false,
  },
  {
    name: "Reporting & Analytics",
    icon: BarChart3,
    articles: 16,
    description: "Performance metrics and business intelligence",
    aiInsights: "Growing demand - 67% increase in searches",
    trending: true,
  },
  {
    name: "Customer Support",
    icon: Headphones,
    articles: 25,
    description: "Support processes and customer service guidelines",
    aiInsights: "AI-generated FAQ suggestions available",
    trending: false,
  },
]

export default function KnowledgeBasePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [showEditCategory, setShowEditCategory] = useState(false)
  const [showDeleteCategory, setShowDeleteCategory] = useState(false)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<any>(null)
  const [editForm, setEditForm] = useState({ name: "", description: "" })

  const [showAIChat, setShowAIChat] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hi! I'm here to help you create knowledge base articles. What topic would you like me to write about? Please describe the subject, target audience, and any specific points you'd like covered.",
      timestamp: new Date(),
    },
  ])
  const [currentMessage, setCurrentMessage] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedArticle, setGeneratedArticle] = useState<any>(null)
  const [showSaveArticle, setShowSaveArticle] = useState(false)
  const [articleForm, setArticleForm] = useState({
    title: "",
    category: "",
    content: "",
  })

  const router = useRouter()

  const filteredCategories = knowledgeCategories.filter(
    (category) =>
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleEditCategory = (category: any) => {
    setSelectedCategory(category)
    setEditForm({ name: category.name, description: category.description })
    setShowEditCategory(true)
  }

  const handleDeleteCategory = (category: any) => {
    setSelectedCategory(category)
    setShowDeleteCategory(true)
  }

  const handleCategoryClick = (category: any) => {
    router.push(`/knowledge-base/category/${category.name.toLowerCase().replace(/\s+/g, "-")}`)
  }

  const handleSaveCategory = () => {
    console.log("[v0] Saving category:", editForm)
    alert(`Category "${editForm.name}" updated successfully!`)
    setShowEditCategory(false)
  }

  const handleConfirmDelete = () => {
    console.log("[v0] Deleting category:", selectedCategory?.name)
    alert(`Category "${selectedCategory?.name}" deleted successfully!`)
    setShowDeleteCategory(false)
  }

  const handleAddCategory = () => {
    console.log("[v0] Adding new category:", editForm)
    alert(`Category "${editForm.name}" created successfully!`)
    setShowAddCategory(false)
    setEditForm({ name: "", description: "" })
  }

  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: currentMessage,
      timestamp: new Date(),
    }

    setChatMessages((prev) => [...prev, userMessage])
    setCurrentMessage("")
    setIsGenerating(true)

    setTimeout(() => {
      const responses = [
        "That's a great topic! Could you tell me more about the specific use case or scenario you'd like the article to cover?",
        "Excellent! What level of technical detail should I include? Should this be for beginners, intermediate users, or advanced practitioners?",
        "Perfect! Let me generate a comprehensive article on that topic. This will include step-by-step instructions, best practices, and troubleshooting tips.",
        "Great! I'll create a detailed article covering all the key aspects. Would you like me to include any specific examples or case studies?",
      ]

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date(),
      }

      setChatMessages((prev) => [...prev, assistantMessage])
      setIsGenerating(false)

      if (chatMessages.length >= 4) {
        setTimeout(() => {
          const finalMessage: ChatMessage = {
            id: (Date.now() + 2).toString(),
            role: "assistant",
            content:
              "Based on our conversation, I have enough information to create a comprehensive article. Would you like me to generate it now?",
            timestamp: new Date(),
          }
          setChatMessages((prev) => [...prev, finalMessage])
        }, 1000)
      }
    }, 1500)
  }

  const handleGenerateArticle = () => {
    setIsGenerating(true)

    setTimeout(() => {
      const article = {
        title: "Complete Guide to IT Service Management Best Practices",
        content: `# Complete Guide to IT Service Management Best Practices

## Introduction

IT Service Management (ITSM) is a strategic approach to designing, delivering, managing, and improving the way information technology (IT) is used within an organization. This comprehensive guide covers the essential best practices for implementing effective ITSM processes.

## Key Components of ITSM

### 1. Service Strategy
- Define service portfolio and value propositions
- Establish governance frameworks
- Align IT services with business objectives

### 2. Service Design
- Design services for availability and performance
- Implement security and compliance measures
- Plan capacity and continuity requirements

### 3. Service Transition
- Manage changes and releases effectively
- Validate and test service changes
- Manage knowledge and assets

### 4. Service Operation
- Handle incidents and problems efficiently
- Manage events and access requests
- Monitor service performance continuously

### 5. Continual Service Improvement
- Measure and analyze service performance
- Identify improvement opportunities
- Implement and monitor improvements

## Best Practices Implementation

### Incident Management
1. **Rapid Response**: Establish clear escalation procedures
2. **Root Cause Analysis**: Investigate underlying issues
3. **Communication**: Keep stakeholders informed throughout resolution

### Change Management
1. **Risk Assessment**: Evaluate potential impacts before implementation
2. **Approval Process**: Implement proper authorization workflows
3. **Testing**: Validate changes in controlled environments

### Problem Management
1. **Proactive Identification**: Monitor trends and patterns
2. **Knowledge Base**: Document known errors and workarounds
3. **Continuous Improvement**: Learn from recurring issues

## Conclusion

Effective ITSM implementation requires commitment, proper planning, and continuous improvement. By following these best practices, organizations can deliver reliable IT services that support business objectives and enhance user satisfaction.`,
      }

      setGeneratedArticle(article)
      setArticleForm({
        title: article.title,
        category: "",
        content: article.content,
      })
      setIsGenerating(false)
      setShowSaveArticle(true)
    }, 3000)
  }

  const handleSaveGeneratedArticle = () => {
    console.log("[v0] Saving generated article:", articleForm)
    alert(`Article "${articleForm.title}" has been saved to the ${articleForm.category} category!`)
    setShowSaveArticle(false)
    setShowAIChat(false)
    setChatMessages([
      {
        id: "1",
        role: "assistant",
        content:
          "Hi! I'm here to help you create knowledge base articles. What topic would you like me to write about? Please describe the subject, target audience, and any specific points you'd like covered.",
        timestamp: new Date(),
      },
    ])
    setGeneratedArticle(null)
  }

  return (
    <PlatformLayout breadcrumb={[{ label: "Knowledge Base" }]}>
      <div className="space-y-6 text-[13px]">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Knowledge Base</h1>
            <p className="text-muted-foreground text-[13px]">
              Find answers and documentation for all platform features
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditForm({ name: "", description: "" })
                setShowAddCategory(true)
              }}
              className="text-[13px]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAIChat(true)}
              className="bg-[#7073fc] text-white hover:bg-[#5a5dfc] text-[13px]"
            >
              <Zap className="h-4 w-4 mr-2" />
              AI Generate Article
            </Button>
            <Button className="text-[13px]">
              <Search className="h-4 w-4 mr-2" />
              Browse All Articles
            </Button>
          </div>
        </div>

        <Card className="border-[#7073fc]/20 bg-gradient-to-r from-[#7073fc]/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bot className="h-5 w-5 text-[#7073fc]" />
                <div>
                  <h3 className="font-medium text-sm">AI Knowledge Intelligence</h3>
                  <p className="text-xs text-muted-foreground">
                    12 content gaps identified • 8 articles need updates •
                    <span className="text-[#7073fc] font-medium"> 3 auto-generated drafts</span> ready for review
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  89% Accuracy
                </Badge>
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                  <BookOpen className="h-3 w-3 mr-1" />
                  247 Articles
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-4 py-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search for articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 text-[13px]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category) => {
            const Icon = category.icon
            return (
              <div
                key={category.name}
                className="bg-card rounded-lg border p-6 hover:shadow-md transition-all duration-200 group hover:border-primary/20 relative"
              >
                <div className="absolute top-4 right-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="text-[13px]">
                      <DropdownMenuItem onClick={() => handleEditCategory(category)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Category
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteCategory(category)} className="text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Category
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div
                  className="flex items-start space-x-4 cursor-pointer"
                  onClick={() => handleCategoryClick(category)}
                >
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-200">
                      <Icon className="h-6 w-6 text-primary transition-colors duration-200" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold">{category.name}</h3>
                      {category.trending && (
                        <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Trending
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{category.description}</p>

                    <div className="mb-3 p-2 rounded-md bg-[#7073fc]/5 border border-[#7073fc]/10">
                      <div className="flex items-start gap-2">
                        <Sparkles className="h-3 w-3 text-[#7073fc] mt-0.5 shrink-0" />
                        <p className="text-xs text-gray-700 leading-relaxed">{category.aiInsights}</p>
                      </div>
                    </div>

                    <p className="text-sm font-medium text-primary">{category.articles} articles</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <Dialog open={showEditCategory} onOpenChange={setShowEditCategory}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription className="text-[13px]">Update the category name and description.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-[13px]">
                Category Name
              </Label>
              <Input
                id="name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="text-[13px]"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description" className="text-[13px]">
                Description
              </Label>
              <Textarea
                id="description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="text-[13px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditCategory(false)} className="text-[13px]">
              Cancel
            </Button>
            <Button onClick={handleSaveCategory} className="text-[13px]">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteCategory} onOpenChange={setShowDeleteCategory}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription className="text-[13px]">
              Are you sure you want to delete "{selectedCategory?.name}"? This action cannot be undone and will remove
              all articles in this category.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteCategory(false)} className="text-[13px]">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} className="text-[13px]">
              Delete Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddCategory} onOpenChange={setShowAddCategory}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription className="text-[13px]">Create a new knowledge base category.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="new-name" className="text-[13px]">
                Category Name
              </Label>
              <Input
                id="new-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Enter category name"
                className="text-[13px]"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-description" className="text-[13px]">
                Description
              </Label>
              <Textarea
                id="new-description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Enter category description"
                className="text-[13px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCategory(false)} className="text-[13px]">
              Cancel
            </Button>
            <Button onClick={handleAddCategory} className="text-[13px]">
              Create Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAIChat} onOpenChange={setShowAIChat}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-[#7073fc]" />
                <DialogTitle>AI Article Generator</DialogTitle>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowAIChat(false)} className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <DialogDescription className="text-[13px]">
              Chat with AI to generate comprehensive knowledge base articles
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 rounded-lg">
              {chatMessages.map((message) => (
                <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.role === "user" ? "bg-[#7073fc] text-white" : "bg-white border shadow-sm"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {message.role === "assistant" && <Bot className="h-4 w-4 text-[#7073fc] mt-0.5 flex-shrink-0" />}
                      <p className="text-[13px] leading-relaxed">{message.content}</p>
                    </div>
                  </div>
                </div>
              ))}

              {isGenerating && (
                <div className="flex justify-start">
                  <div className="bg-white border shadow-sm p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 text-[#7073fc] animate-spin" />
                      <p className="text-[13px] text-muted-foreground">AI is thinking...</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex-shrink-0 mt-4">
              <div className="flex gap-2">
                <Input
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  placeholder="Describe the article you'd like me to create..."
                  className="flex-1 text-[13px]"
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!currentMessage.trim() || isGenerating}
                  className="text-[13px]"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              {chatMessages.length >= 4 && !generatedArticle && (
                <div className="mt-3 p-3 bg-[#7073fc]/5 rounded-lg border border-[#7073fc]/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-[#7073fc]" />
                      <p className="text-[13px] text-muted-foreground">
                        Ready to generate your article based on our conversation
                      </p>
                    </div>
                    <Button
                      onClick={handleGenerateArticle}
                      disabled={isGenerating}
                      className="bg-[#7073fc] hover:bg-[#5a5dfc] text-[13px]"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 mr-2" />
                          Generate Article
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showSaveArticle} onOpenChange={setShowSaveArticle}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Save Generated Article</DialogTitle>
            <DialogDescription className="text-[13px]">
              Review and save your AI-generated article to the knowledge base
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="article-title" className="text-[13px]">
                Article Title
              </Label>
              <Input
                id="article-title"
                value={articleForm.title}
                onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })}
                className="text-[13px]"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="article-category" className="text-[13px]">
                Category
              </Label>
              <Select
                value={articleForm.category}
                onValueChange={(value) => setArticleForm({ ...articleForm, category: value })}
              >
                <SelectTrigger className="text-[13px]">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="text-[13px]">
                  {knowledgeCategories.map((category) => (
                    <SelectItem key={category.name} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label className="text-[13px]">Article Preview</Label>
              <div className="max-h-60 overflow-y-auto p-3 bg-gray-50 rounded-lg border">
                <pre className="whitespace-pre-wrap text-[13px] leading-relaxed">{articleForm.content}</pre>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveArticle(false)} className="text-[13px]">
              Cancel
            </Button>
            <Button
              onClick={handleSaveGeneratedArticle}
              disabled={!articleForm.title || !articleForm.category}
              className="text-[13px]"
            >
              Save Article
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PlatformLayout>
  )
}
