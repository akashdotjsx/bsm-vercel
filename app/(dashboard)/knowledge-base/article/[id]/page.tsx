"use client"

import { useState } from "react"
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
  ThumbsUp,
  ThumbsDown,
  Eye,
  Calendar,
  User,
  Clock,
  Tag,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

export default function ArticlePage() {
  const router = useRouter()
  const params = useParams()
  const [activeTab, setActiveTab] = useState("content")
  const [showSettings, setShowSettings] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showPublish, setShowPublish] = useState(false)

  // Sample article data
  const article = {
    id: params.id,
    title: "Setting up Billing Automation",
    content: `# Setting up Billing Automation

This comprehensive guide will walk you through the process of configuring automated billing processes and invoice generation in your BSM platform.

## Overview

Automated billing helps streamline your financial operations by reducing manual work and ensuring consistent, timely invoice generation.

## Prerequisites

Before setting up billing automation, ensure you have:
- Administrative access to the billing module
- Configured payment gateways
- Set up customer accounts and billing profiles

## Step 1: Configure Billing Rules

Navigate to the billing configuration section and set up your automation rules:

1. Define billing cycles (monthly, quarterly, annually)
2. Set up automatic invoice generation dates
3. Configure payment terms and due dates

## Step 2: Set Up Templates

Create standardized invoice templates that will be used for automated generation:

- Company branding and logo
- Standard terms and conditions
- Payment instructions
- Contact information

## Step 3: Testing

Before going live, thoroughly test your automation:

1. Run test billing cycles
2. Verify invoice accuracy
3. Test payment processing
4. Validate notification systems

## Troubleshooting

Common issues and solutions:

- **Invoice generation fails**: Check template configuration
- **Payment processing errors**: Verify gateway settings
- **Notification issues**: Review email settings

## Best Practices

- Regular monitoring of automated processes
- Periodic review of billing rules
- Backup and recovery procedures
- Staff training on the system`,
    author: "John Smith",
    createdDate: "Feb 15, 2024",
    lastModified: "2 days ago",
    status: "Published",
    views: 245,
    readTime: "5 min read",
    tags: ["Billing", "Automation", "Finance"],
    category: "Billing & Finance",
  }

  const handlePublish = () => {
    alert("Article published successfully!")
    setShowPublish(false)
  }

  return (
    <PageContent
      breadcrumb={[
        { label: "Knowledge Base", href: "/knowledge-base" },
        { label: article.category, href: "/knowledge-base/category/billing-finance" },
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
            <Button variant="outline" size="sm" onClick={() => setShowSettings(true)} className="text-[13px]">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowComments(true)} className="text-[13px]">
              <MessageSquare className="h-4 w-4 mr-2" />
              Comments
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowHistory(true)} className="text-[13px]">
              <History className="h-4 w-4 mr-2" />
              History
            </Button>
            <Button onClick={() => setShowPublish(true)} className="bg-[#7073fc] hover:bg-[#5a5dfc] text-[13px]">
              Publish
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
                <Button variant="outline" size="sm" className="w-full justify-start text-[13px] bg-transparent">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Article
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start text-[13px] bg-transparent">
                  <Bookmark className="h-4 w-4 mr-2" />
                  Bookmark
                </Button>
                <Separator />
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 text-[13px] bg-transparent">
                    <ThumbsUp className="h-4 w-4 mr-1" />
                    12
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 text-[13px] bg-transparent">
                    <ThumbsDown className="h-4 w-4 mr-1" />1
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
                  {article.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-[11px]">
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Article Settings</DialogTitle>
            <DialogDescription className="text-[13px]">
              Configure article visibility, permissions, and metadata.
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general" className="text-[13px]">
                General
              </TabsTrigger>
              <TabsTrigger value="permissions" className="text-[13px]">
                Permissions
              </TabsTrigger>
              <TabsTrigger value="seo" className="text-[13px]">
                SEO
              </TabsTrigger>
            </TabsList>
            <TabsContent value="general" className="space-y-4">
              <div className="grid gap-2">
                <Label className="text-[13px]">Article Status</Label>
                <select className="w-full p-2 border rounded text-[13px]">
                  <option>Published</option>
                  <option>Draft</option>
                  <option>Archived</option>
                </select>
              </div>
            </TabsContent>
            <TabsContent value="permissions" className="space-y-4">
              <p className="text-[13px]">Configure who can view and edit this article.</p>
            </TabsContent>
            <TabsContent value="seo" className="space-y-4">
              <p className="text-[13px]">Search engine optimization settings.</p>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettings(false)} className="text-[13px]">
              Cancel
            </Button>
            <Button className="text-[13px]">Save Settings</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Comments Dialog */}
      <Dialog open={showComments} onOpenChange={setShowComments}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Comments & Feedback</DialogTitle>
            <DialogDescription className="text-[13px]">View and manage comments on this article.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <div className="border rounded p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                  JS
                </div>
                <span className="font-medium text-[13px]">Jane Smith</span>
                <span className="text-xs text-muted-foreground">2 days ago</span>
              </div>
              <p className="text-[13px]">
                This article was very helpful! The step-by-step instructions made it easy to follow.
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-[13px]">Add Comment</Label>
            <Textarea placeholder="Write your comment..." className="text-[13px]" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowComments(false)} className="text-[13px]">
              Close
            </Button>
            <Button className="text-[13px]">Post Comment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Article History</DialogTitle>
            <DialogDescription className="text-[13px]">
              View revision history and changes made to this article.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            <div className="border rounded p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-[13px]">Version 1.2</span>
                <span className="text-xs text-muted-foreground">2 days ago</span>
              </div>
              <p className="text-[13px] text-muted-foreground">Updated troubleshooting section with new solutions</p>
              <p className="text-xs text-muted-foreground">By John Smith</p>
            </div>
            <div className="border rounded p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-[13px]">Version 1.1</span>
                <span className="text-xs text-muted-foreground">1 week ago</span>
              </div>
              <p className="text-[13px] text-muted-foreground">Added best practices section</p>
              <p className="text-xs text-muted-foreground">By John Smith</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHistory(false)} className="text-[13px]">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Publish Dialog */}
      <Dialog open={showPublish} onOpenChange={setShowPublish}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish Article</DialogTitle>
            <DialogDescription className="text-[13px]">
              Are you sure you want to publish this article? It will be visible to all users.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPublish(false)} className="text-[13px]">
              Cancel
            </Button>
            <Button onClick={handlePublish} className="bg-[#7073fc] hover:bg-[#5a5dfc] text-[13px]">
              Publish Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContent>
  )
}
