"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import {
  X,
  CalendarIcon,
  User,
  Tag,
  Link2,
  Paperclip,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  ImageIcon,
  Bot,
  ChevronRight,
  Sparkles,
  Copy,
  MessageSquare,
} from "lucide-react"
import { PlatformLayout } from "@/components/layout/platform-layout"
import { format } from "date-fns"

export default function CreateTicketPage() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState("task")
  const [status, setStatus] = useState("open")
  const [priority, setPriority] = useState("medium")
  const [assignee, setAssignee] = useState("")
  const [reportedBy, setReportedBy] = useState("current-user")
  const [dueDate, setDueDate] = useState<Date>()
  const [estimatedTime, setEstimatedTime] = useState("0")
  const [actualTime, setActualTime] = useState("0")
  const [progress, setProgress] = useState("0")
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState("")
  const [billable, setBillable] = useState(false)
  const [showDependencies, setShowDependencies] = useState(false)
  const [showLinks, setShowLinks] = useState(false)
  const [showAttachments, setShowAttachments] = useState(false)

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "task":
        return "text-yellow-600"
      case "incident":
        return "text-red-600"
      case "request":
        return "text-blue-600"
      case "problem":
        return "text-purple-600"
      case "change":
        return "text-green-600"
      default:
        return "text-gray-600"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "text-yellow-600"
      case "in_progress":
        return "text-blue-600"
      case "resolved":
        return "text-green-600"
      case "closed":
        return "text-gray-600"
      default:
        return "text-gray-600"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "text-red-600"
      case "high":
        return "text-orange-600"
      case "medium":
        return "text-yellow-600"
      case "low":
        return "text-green-600"
      default:
        return "text-gray-600"
    }
  }

  return (
    <PlatformLayout breadcrumb={[{ label: "Issues", href: "/tickets" }, { label: "Create New Issue" }]}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <span>MVP 1</span>
                  <span>/</span>
                  <span>New Issue</span>
                </div>
                <h1 className="text-xl font-medium">Create New Issue</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                0
              </Button>
              <Button variant="ghost" size="sm">
                <MessageSquare className="h-4 w-4" />5
              </Button>
              <Button variant="ghost" size="sm">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full border-2 border-muted-foreground"></div>
              <Input
                placeholder="Issue title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-xl font-medium border-0 px-0 focus-visible:ring-0 bg-transparent"
              />
            </div>
            <div className="flex items-center gap-3">
              <Button className="bg-[#7073fc] hover:bg-[#5a5dfc] text-white">
                <Bot className="h-4 w-4 mr-2" />
                Ask AI
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
            <span>16IVWQ-2389</span>
            <CalendarIcon className="h-4 w-4" />
            <span>Created on {format(new Date(), "MMM d")}</span>
            <div className="ml-auto flex items-center gap-2">
              <span>Billable?</span>
              <Switch checked={billable} onCheckedChange={setBillable} />
              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-medium">
                $
              </div>
            </div>
          </div>
        </div>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <Tabs defaultValue="details" className="w-full">
              <div className="border-b">
                <TabsList className="h-12 bg-transparent border-0 rounded-none w-full justify-start px-6">
                  <TabsTrigger
                    value="details"
                    className="data-[state=active]:border-b-2 data-[state=active]:border-[#7073fc] rounded-none bg-transparent text-[13px]"
                  >
                    Details
                  </TabsTrigger>
                  <TabsTrigger
                    value="subtasks"
                    className="data-[state=active]:border-b-2 data-[state=active]:border-[#7073fc] rounded-none bg-transparent text-[13px]"
                  >
                    Subtasks
                    <Badge variant="secondary" className="ml-2 text-xs">
                      5
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger
                    value="checklist"
                    className="data-[state=active]:border-b-2 data-[state=active]:border-[#7073fc] rounded-none bg-transparent text-[13px]"
                  >
                    Checklist
                  </TabsTrigger>
                  <TabsTrigger
                    value="comments"
                    className="data-[state=active]:border-b-2 data-[state=active]:border-[#7073fc] rounded-none bg-transparent text-[13px]"
                  >
                    Comment
                    <Badge variant="secondary" className="ml-2 text-xs">
                      3
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger
                    value="docs"
                    className="data-[state=active]:border-b-2 data-[state=active]:border-[#7073fc] rounded-none bg-transparent text-[13px]"
                  >
                    Docs
                  </TabsTrigger>
                  <TabsTrigger
                    value="history"
                    className="data-[state=active]:border-b-2 data-[state=active]:border-[#7073fc] rounded-none bg-transparent text-[13px]"
                  >
                    History
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="details" className="p-6 space-y-6 mt-0">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-muted-foreground">Description</label>
                    <Button size="sm" className="h-7 bg-[#7073fc] hover:bg-[#5a5dfc] text-white text-xs">
                      Write description
                    </Button>
                  </div>

                  <div className="border rounded-lg">
                    <div className="flex items-center gap-1 p-2 border-b bg-muted">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <Bold className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <Italic className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <Underline className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <Strikethrough className="h-3 w-3" />
                      </Button>
                      <div className="w-px h-4 bg-border mx-1" />
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <List className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <ListOrdered className="h-3 w-3" />
                      </Button>
                      <div className="w-px h-4 bg-border mx-1" />
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <Link2 className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <Paperclip className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <ImageIcon className="h-3 w-3" />
                      </Button>
                    </div>
                    <Textarea
                      placeholder="Add Description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="min-h-24 border-0 rounded-t-none focus-visible:ring-0"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-muted-foreground w-24">Type</label>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getTypeColor(type)}`} />
                      <span className="text-sm font-medium">{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-muted-foreground w-24">Status</label>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(status)}`} />
                      <span className="text-sm font-medium">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-muted-foreground w-24">Priority</label>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getPriorityColor(priority)}`} />
                      <span className="text-sm font-medium">
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-muted-foreground w-24">Reported By</label>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-muted-foreground flex items-center justify-center text-white text-xs font-medium">
                        K
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-muted-foreground w-24">Assignee</label>
                    <Button variant="ghost" className="h-auto p-0 text-[#7073fc] hover:bg-transparent">
                      <User className="h-4 w-4 mr-2" />
                      Assign to me
                    </Button>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-muted-foreground w-24">Dates</label>
                    <Button variant="ghost" className="h-auto p-0 hover:bg-transparent">
                      <CalendarIcon className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div className="flex items-center gap-4">
                      <label className="text-sm font-medium text-muted-foreground w-24">Duration</label>
                      <span className="text-sm text-muted-foreground">-</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="text-sm font-medium text-muted-foreground w-32">Estimated time (h)</label>
                      <span className="text-sm">0</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div className="flex items-center gap-4">
                      <label className="text-sm font-medium text-muted-foreground w-24">Progress</label>
                      <span className="text-sm">0%</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="text-sm font-medium text-muted-foreground w-32">Actual time (h)</label>
                      <span className="text-sm">0</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-muted-foreground w-24">Tags</label>
                    <Button variant="ghost" className="h-auto p-0 hover:bg-transparent">
                      <Tag className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium text-muted-foreground">Custom Fields</label>
                    <div className="text-sm text-muted-foreground text-center py-6">No custom fields available</div>
                  </div>
                </div>

                <div className="space-y-1">
                  <Button
                    variant="ghost"
                    className="w-full justify-start p-2 h-auto text-sm font-medium hover:bg-transparent"
                    onClick={() => setShowDependencies(!showDependencies)}
                  >
                    <ChevronRight className="h-4 w-4 mr-2" />
                    Dependencies
                  </Button>

                  <Button
                    variant="ghost"
                    className="w-full justify-start p-2 h-auto text-sm font-medium hover:bg-transparent"
                    onClick={() => setShowLinks(!showLinks)}
                  >
                    <ChevronRight className="h-4 w-4 mr-2" />
                    Links
                  </Button>

                  <Button
                    variant="ghost"
                    className="w-full justify-start p-2 h-auto text-sm font-medium hover:bg-transparent"
                    onClick={() => setShowAttachments(!showAttachments)}
                  >
                    <ChevronRight className="h-4 w-4 mr-2" />
                    Attachments
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="subtasks" className="mt-6">
                <div className="text-center py-8 text-muted-foreground">
                  <p>No subtasks created yet</p>
                  <Button className="mt-2">Add Subtask</Button>
                </div>
              </TabsContent>

              <TabsContent value="checklist" className="mt-6">
                <div className="text-center py-8 text-muted-foreground">
                  <p>No checklist items added</p>
                  <Button className="mt-2">Add Checklist Item</Button>
                </div>
              </TabsContent>

              <TabsContent value="comments" className="mt-6">
                <div className="text-center py-8 text-muted-foreground">
                  <p>No comments yet</p>
                  <Button className="mt-2">Add Comment</Button>
                </div>
              </TabsContent>

              <TabsContent value="docs" className="mt-6">
                <div className="text-center py-8 text-muted-foreground">
                  <p>No documents attached</p>
                  <Button className="mt-2">Attach Document</Button>
                </div>
              </TabsContent>

              <TabsContent value="history" className="mt-6">
                <div className="text-center py-8 text-muted-foreground">
                  <p>No history available</p>
                </div>
              </TabsContent>

              <TabsContent value="ai" className="mt-6">
                <Card className="border-[#7073fc]/20 bg-muted/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <Bot className="h-5 w-5 text-[#7073fc]" />
                      <h3 className="font-medium">AI Suggestions</h3>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="p-3 bg-card rounded-md border">
                        <p className="font-medium mb-1">Suggested Priority: Medium</p>
                        <p className="text-muted-foreground">Based on keywords and description analysis</p>
                      </div>
                      <div className="p-3 bg-card rounded-md border">
                        <p className="font-medium mb-1">Recommended Assignee: Sarah Wilson</p>
                        <p className="text-muted-foreground">Best match based on expertise and workload</p>
                      </div>
                      <div className="p-3 bg-card rounded-md border">
                        <p className="font-medium mb-1">Similar Issues Found: 3</p>
                        <p className="text-muted-foreground">Check related tickets for faster resolution</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </PlatformLayout>
  )
}
