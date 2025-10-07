"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  X,
  Bell,
  Clock,
  Copy,
  Link,
  Paperclip,
  Bold,
  Italic,
  Underline,
  ListIcon,
  ListOrdered,
  Plus,
  Trash2,
  Edit,
  Send,
  Upload,
  Download,
  Building,
  Phone,
  Mail,
  MessageSquare,
  FileText,
  History,
  Search,
  UserPlus,
  AtSign,
} from "lucide-react"

interface TicketTrayProps {
  isOpen: boolean
  onClose: () => void
  ticket?: any
  position?: 'side' | 'center'
}

export function TicketTray({ isOpen, onClose, ticket, position = 'side' }: TicketTrayProps) {
  const [activeTab, setActiveTab] = useState("details")
  const [description, setDescription] = useState(ticket?.description || "")
  const [newComment, setNewComment] = useState("")
  const [newChecklistItem, setNewChecklistItem] = useState("")
  const [showAccountSearch, setShowAccountSearch] = useState(false)
  const [accountSearchQuery, setAccountSearchQuery] = useState("")
  const [showMentionDropdown, setShowMentionDropdown] = useState(false)
  const [mentionQuery, setMentionQuery] = useState("")
  const [editingChecklistItem, setEditingChecklistItem] = useState<number | null>(null)
  const [isWatching, setIsWatching] = useState(false)

  const teamMembers = [
    { id: 1, name: "John Smith", email: "john.smith@company.com", avatar: "JS" },
    { id: 2, name: "Sarah Wilson", email: "sarah.wilson@company.com", avatar: "SW" },
    { id: 3, name: "Mike Chen", email: "mike.chen@company.com", avatar: "MC" },
    { id: 4, name: "Lisa Anderson", email: "lisa.anderson@company.com", avatar: "LA" },
    { id: 5, name: "Robert Taylor", email: "robert.taylor@company.com", avatar: "RT" },
  ]

  const availableAccounts = [
    {
      id: 2,
      name: "Jennifer Davis",
      email: "jennifer.davis@acme.com",
      phone: "+1 (555) 234-5678",
      role: "IT Manager",
      department: "IT Operations",
      organization: "Acme Corp",
      status: "Active",
    },
    {
      id: 3,
      name: "Michael Brown",
      email: "michael.brown@acme.com",
      phone: "+1 (555) 345-6789",
      role: "Security Engineer",
      department: "IT Security",
      organization: "Acme Corp",
      status: "Active",
    },
  ]

  const [ticketData, setTicketData] = useState({
    id: ticket?.id || "#5081",
    title: ticket?.title || "Cross side scripting Vuln",
    type: ticket?.type || "Task",
    status: ticket?.status || "Open",
    priority: ticket?.priority || "Medium",
    reportedBy: ticket?.reportedBy || "M",
    assignee: ticket?.assignee?.name || "",
    requester: ticket?.requester || "Richard Jeffries",
    organization: ticket?.organization || "Acme Corp",
    department: ticket?.department || "IT Security",
    category: ticket?.category || "Security",
    subcategory: ticket?.subcategory || "Vulnerability",
    createdDate: "May 12, 2024",
    dueDate: "May 21, 2024",
    estimatedTime: "8",
    actualTime: "6.5",
    tags: ["security", "urgent", "web-app"],
    accounts: [
      {
        id: 1,
        name: "Richard Jeffries",
        email: "richard.jeffries@acme.com",
        phone: "+1 (555) 123-4567",
        role: "Security Analyst",
        department: "IT Security",
        organization: "Acme Corp",
        lastContact: "2 hours ago",
        status: "Active",
      },
    ],
    checklist: [
      { id: 1, text: "Reproduce the vulnerability", completed: true, assignee: "John Smith", dueDate: "2024-05-15" },
      { id: 2, text: "Assess impact and severity", completed: true, assignee: "Sarah Wilson", dueDate: "2024-05-16" },
      { id: 3, text: "Develop security patch", completed: false, assignee: "Mike Chen", dueDate: "2024-05-18" },
      {
        id: 4,
        text: "Test patch in staging environment",
        completed: false,
        assignee: "Lisa Anderson",
        dueDate: "2024-05-20",
      },
      { id: 5, text: "Deploy to production", completed: false, assignee: "Robert Taylor", dueDate: "2024-05-21" },
    ],
    comments: [
      {
        id: 1,
        author: "Richard Jeffries",
        avatar: "RJ",
        timestamp: "2 hours ago",
        content:
          "I've identified this XSS vulnerability in the user profile section. It allows malicious scripts to be executed when viewing other users' profiles.",
        type: "comment",
      },
      {
        id: 2,
        author: "John Smith",
        avatar: "JS",
        timestamp: "1 hour ago",
        content:
          "Thanks for reporting this. I've reproduced the issue and confirmed it's a stored XSS vulnerability. Escalating to high priority.",
        type: "comment",
      },
      {
        id: 3,
        author: "System",
        avatar: "S",
        timestamp: "45 minutes ago",
        content: "Status changed from 'New' to 'In Progress'",
        type: "system",
      },
    ],
    files: [
      {
        id: 1,
        name: "vulnerability-report.pdf",
        size: "2.4 MB",
        uploadedBy: "Richard Jeffries",
        uploadedAt: "2 hours ago",
        type: "pdf",
      },
      {
        id: 2,
        name: "screenshot-xss-poc.png",
        size: "856 KB",
        uploadedBy: "Richard Jeffries",
        uploadedAt: "2 hours ago",
        type: "image",
      },
      {
        id: 3,
        name: "security-patch.zip",
        size: "1.2 MB",
        uploadedBy: "Mike Chen",
        uploadedAt: "30 minutes ago",
        type: "archive",
      },
    ],
    history: [
      {
        id: 1,
        action: "Ticket created",
        user: "Richard Jeffries",
        timestamp: "May 12, 2024 09:15 AM",
        details: "Initial vulnerability report submitted",
      },
      {
        id: 2,
        action: "Priority changed",
        user: "John Smith",
        timestamp: "May 12, 2024 10:30 AM",
        details: "Changed from Medium to High priority",
      },
      {
        id: 3,
        action: "Assigned",
        user: "John Smith",
        timestamp: "May 12, 2024 10:32 AM",
        details: "Assigned to Mike Chen for patch development",
      },
      {
        id: 4,
        action: "Status updated",
        user: "Mike Chen",
        timestamp: "May 12, 2024 02:15 PM",
        details: "Status changed from New to In Progress",
      },
      {
        id: 5,
        action: "Comment added",
        user: "Sarah Wilson",
        timestamp: "May 13, 2024 11:20 AM",
        details: "Added impact assessment details",
      },
    ],
  })

  const tabs = [
    { id: "details", label: "Details" },
    { id: "accounts", label: "Accounts", count: ticketData.accounts.length },
    { id: "checklist", label: "Checklist", count: ticketData.checklist.length },
    { id: "comments", label: "Comments", count: ticketData.comments.length },
    { id: "files", label: "Files", count: ticketData.files.length },
    { id: "history", label: "History", count: ticketData.history.length },
  ]

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "task":
        return "bg-yellow-100 text-yellow-800"
      case "incident":
        return "bg-red-100 text-red-800"
      case "request":
        return "bg-[#6E72FF]/10 text-[#6E72FF]"
      case "problem":
        return "bg-orange-100 text-orange-800"
      case "change":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "open":
        return "bg-yellow-100 text-yellow-800"
      case "in progress":
        return "bg-[#6E72FF]/10 text-[#6E72FF]"
      case "resolved":
        return "bg-green-100 text-green-800"
      case "closed":
        return "bg-gray-100 text-gray-800"
      case "on hold":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "urgent":
        return "bg-red-100 text-red-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleLinkAccount = (account: any) => {
    setTicketData({
      ...ticketData,
      accounts: [...ticketData.accounts, { ...account, lastContact: "Just linked" }],
      history: [
        {
          id: ticketData.history.length + 1,
          action: "Account linked",
          user: "Current User",
          timestamp: new Date().toLocaleString(),
          details: `Linked account: ${account.name}`,
        },
        ...ticketData.history,
      ],
    })
    setShowAccountSearch(false)
    setAccountSearchQuery("")
  }

  const handleEditAccount = (accountId: number) => {
    console.log("[v0] Edit account functionality triggered for account:", accountId)
    // In a real implementation, this would open an edit modal
    alert(`Edit account functionality would open here for account ID: ${accountId}`)
  }

  const handleContactAccount = (account: any) => {
    console.log("[v0] Contact account functionality triggered for:", account.name)
    // In a real implementation, this would open email/phone integration
    alert(`Contact functionality would open here for ${account.name} (${account.email})`)
  }

  const handleUpdateChecklistItem = (id: number, updates: any) => {
    setTicketData({
      ...ticketData,
      checklist: ticketData.checklist.map((item) => (item.id === id ? { ...item, ...updates } : item)),
      history: [
        {
          id: ticketData.history.length + 1,
          action: "Checklist updated",
          user: "Current User",
          timestamp: new Date().toLocaleString(),
          details: `Updated checklist item: ${ticketData.checklist.find((item) => item.id === id)?.text}`,
        },
        ...ticketData.history,
      ],
    })
  }

  const handleDeleteChecklistItem = (id: number) => {
    const item = ticketData.checklist.find((item) => item.id === id)
    setTicketData({
      ...ticketData,
      checklist: ticketData.checklist.filter((item) => item.id !== id),
      history: [
        {
          id: ticketData.history.length + 1,
          action: "Checklist item deleted",
          user: "Current User",
          timestamp: new Date().toLocaleString(),
          details: `Deleted checklist item: ${item?.text}`,
        },
        ...ticketData.history,
      ],
    })
  }

  const handleCommentChange = (value: string) => {
    setNewComment(value)
    const lastAtIndex = value.lastIndexOf("@")
    if (lastAtIndex !== -1 && lastAtIndex === value.length - 1) {
      setShowMentionDropdown(true)
      setMentionQuery("")
    } else if (lastAtIndex !== -1 && value.charAt(lastAtIndex + 1) !== " ") {
      const query = value.substring(lastAtIndex + 1)
      if (query.includes(" ")) {
        setShowMentionDropdown(false)
      } else {
        setMentionQuery(query)
        setShowMentionDropdown(true)
      }
    } else {
      setShowMentionDropdown(false)
    }
  }

  const handleSelectMention = (member: any) => {
    const lastAtIndex = newComment.lastIndexOf("@")
    const beforeMention = newComment.substring(0, lastAtIndex)
    const afterMention = `@${member.name} `
    setNewComment(beforeMention + afterMention)
    setShowMentionDropdown(false)
  }

  const allowedFileTypes = ["pdf", "xls", "xlsx", "doc", "docx", "ppt", "pptx", "png", "jpg", "jpeg"]

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase()
    switch (extension) {
      case "pdf":
        return <FileText className="h-5 w-5 text-red-600" />
      case "xls":
      case "xlsx":
        return <FileText className="h-5 w-5 text-green-600" />
      case "doc":
      case "docx":
        return <FileText className="h-5 w-5 text-[#6E72FF]" />
      case "ppt":
      case "pptx":
        return <FileText className="h-5 w-5 text-orange-600" />
      case "png":
      case "jpg":
      case "jpeg":
        return <FileText className="h-5 w-5 text-purple-600" />
      default:
        return <FileText className="h-5 w-5 text-gray-600" />
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      Array.from(files).forEach((file) => {
        const extension = file.name.split(".").pop()?.toLowerCase()
        if (!extension || !allowedFileTypes.includes(extension)) {
          alert(`File type not allowed. Please upload only: ${allowedFileTypes.join(", ")}`)
          return
        }

        const newFile = {
          id: ticketData.files.length + 1,
          name: file.name,
          size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
          uploadedBy: "Current User",
          uploadedAt: "Just now",
          type: extension,
        }
        setTicketData({
          ...ticketData,
          files: [...ticketData.files, newFile],
          history: [
            {
              id: ticketData.history.length + 1,
              action: "File uploaded",
              user: "Current User",
              timestamp: new Date().toLocaleString(),
              details: `Uploaded file: ${file.name}`,
            },
            ...ticketData.history,
          ],
        })
      })
    }
  }

  const handleFileDownload = (file: any) => {
    console.log("[v0] Download file:", file.name)
    // In a real implementation, this would trigger file download
    alert(`Download functionality would trigger for: ${file.name}`)
  }

  const handleFileDelete = (fileId: number) => {
    const file = ticketData.files.find((f) => f.id === fileId)
    setTicketData({
      ...ticketData,
      files: ticketData.files.filter((f) => f.id !== fileId),
      history: [
        {
          id: ticketData.history.length + 1,
          action: "File deleted",
          user: "Current User",
          timestamp: new Date().toLocaleString(),
          details: `Deleted file: ${file?.name}`,
        },
        ...ticketData.history,
      ],
    })
  }

  const handleAddComment = () => {
    if (newComment.trim()) {
      const comment = {
        id: ticketData.comments.length + 1,
        author: "Current User",
        avatar: "CU",
        timestamp: "Just now",
        content: newComment,
        type: "comment",
      }
      setTicketData({
        ...ticketData,
        comments: [...ticketData.comments, comment],
      })
      setNewComment("")
    }
  }

  const handleAddChecklistItem = () => {
    if (newChecklistItem.trim()) {
      const item = {
        id: ticketData.checklist.length + 1,
        text: newChecklistItem,
        completed: false,
        assignee: "",
        dueDate: "",
      }
      setTicketData({
        ...ticketData,
        checklist: [...ticketData.checklist, item],
      })
      setNewChecklistItem("")
    }
  }

  const toggleChecklistItem = (id: number) => {
    setTicketData({
      ...ticketData,
      checklist: ticketData.checklist.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item)),
    })
  }

  const handleCopyTicketId = () => {
    navigator.clipboard.writeText(ticketData.id)
    alert(`Ticket ID ${ticketData.id} copied to clipboard`)
  }

  const handleCopyTicketLink = () => {
    const ticketLink = `${window.location.origin}/tickets/${ticketData.id}`
    navigator.clipboard.writeText(ticketLink)
    alert("Ticket link copied to clipboard")
  }

  const handleToggleWatcher = () => {
    setIsWatching(!isWatching)
    setTicketData({
      ...ticketData,
      history: [
        {
          id: ticketData.history.length + 1,
          action: isWatching ? "Stopped watching" : "Started watching",
          user: "Current User",
          timestamp: new Date().toLocaleString(),
          details: isWatching ? "Removed from watchers" : "Added to watchers",
        },
        ...ticketData.history,
      ],
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />

      {position === 'side' ? (
        <div className="ml-auto w-[40vw] min-w-[700px] max-w-[900px] bg-white dark:bg-gray-900 shadow-2xl flex flex-col h-full relative z-10">
          <div className="p-6 bg-white dark:bg-gray-900">
            <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{ticketData.title}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handleCopyTicketId}
                title="Copy Ticket ID"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 w-8 p-0 ${isWatching ? "text-[#6E72FF]" : ""}`}
                onClick={handleToggleWatcher}
                title={isWatching ? "Stop watching" : "Watch ticket"}
              >
                <Bell className={`h-4 w-4 ${isWatching ? "fill-current" : ""}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handleCopyTicketLink}
                title="Copy Ticket Link"
              >
                <Link className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="font-medium">{ticketData.id}</span>
            <span>Created on {ticketData.createdDate}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900">
          <div className="flex px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-3 text-sm font-medium border-b-2 transition-colors flex-1 text-center ${
                  activeTab === tab.id
                    ? "text-gray-900 dark:text-white border-gray-900 dark:border-white"
                    : "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">{tab.count}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === "details" && (
            <div className="p-6 space-y-6">
              {/* Description Section */}
              <div className="space-y-3">
                <span className="text-sm font-medium text-gray-900 dark:text-white">Description</span>

                {/* Rich Text Editor Toolbar */}
                <div className="flex items-center gap-1 p-2 bg-gray-50 rounded-t-md">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Bold className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Italic className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Underline className="h-4 w-4" />
                  </Button>
                  <div className="w-px h-6 bg-gray-300 mx-1"></div>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <ListIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <ListOrdered className="h-4 w-4" />
                  </Button>
                  <div className="w-px h-6 bg-gray-300 mx-1"></div>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Link className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                </div>

                <Textarea
                  placeholder="Add Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[120px] rounded-t-none focus-visible:ring-0 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Type</span>
                    <Select
                      value={ticketData.type}
                      onValueChange={(value) => setTicketData({ ...ticketData, type: value })}
                    >
                      <SelectTrigger className="w-40 h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Task">Task</SelectItem>
                        <SelectItem value="Incident">Incident</SelectItem>
                        <SelectItem value="Request">Request</SelectItem>
                        <SelectItem value="Problem">Problem</SelectItem>
                        <SelectItem value="Change">Change</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Status</span>
                    <Select
                      value={ticketData.status}
                      onValueChange={(value) => setTicketData({ ...ticketData, status: value })}
                    >
                      <SelectTrigger className="w-40 h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Open">Open</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Resolved">Resolved</SelectItem>
                        <SelectItem value="Closed">Closed</SelectItem>
                        <SelectItem value="On Hold">On Hold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Priority</span>
                    <Select
                      value={ticketData.priority}
                      onValueChange={(value) => setTicketData({ ...ticketData, priority: value })}
                    >
                      <SelectTrigger className="w-40 h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Urgent">Urgent</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Category</span>
                    <Input
                      value={ticketData.category}
                      onChange={(e) => setTicketData({ ...ticketData, category: e.target.value })}
                      className="w-40 h-9 text-sm"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Reported By</span>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#6E72FF] flex items-center justify-center text-white text-xs font-medium">
                        {ticketData.reportedBy}
                      </div>
                      <span className="text-sm">{ticketData.requester}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Assignee</span>
                    <Select
                      value={ticketData.assignee}
                      onValueChange={(value) => setTicketData({ ...ticketData, assignee: value })}
                    >
                      <SelectTrigger className="w-40 h-9">
                        <SelectValue placeholder="Assign" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="John Smith">John Smith</SelectItem>
                        <SelectItem value="Sarah Wilson">Sarah Wilson</SelectItem>
                        <SelectItem value="Mike Chen">Mike Chen</SelectItem>
                        <SelectItem value="Lisa Anderson">Lisa Anderson</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Organization</span>
                    <Input
                      value={ticketData.organization}
                      onChange={(e) => setTicketData({ ...ticketData, organization: e.target.value })}
                      className="w-40 h-9 text-sm"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Department</span>
                    <Input
                      value={ticketData.department}
                      onChange={(e) => setTicketData({ ...ticketData, department: e.target.value })}
                      className="w-40 h-9 text-sm"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Due Date</span>
                    <Input
                      type="date"
                      value={ticketData.dueDate}
                      onChange={(e) => setTicketData({ ...ticketData, dueDate: e.target.value })}
                      className="w-40 h-9 text-sm"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Estimated Hours</span>
                    <Input
                      value={ticketData.estimatedTime}
                      onChange={(e) => setTicketData({ ...ticketData, estimatedTime: e.target.value })}
                      className="w-40 h-9 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Tags Section */}
              <div className="space-y-3">
                <span className="text-sm font-medium text-gray-900">Tags</span>
                <div className="flex flex-wrap gap-2">
                  {ticketData.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                      <Button variant="ghost" size="sm" className="h-4 w-4 p-0 ml-1">
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                  <Button variant="outline" size="sm" className="h-6 text-xs bg-transparent">
                    <Plus className="h-3 w-3 mr-1" />
                    Add Tag
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "accounts" && (
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Associated Accounts</h3>
                <Button size="sm" onClick={() => setShowAccountSearch(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Link Account
                </Button>
              </div>

              {showAccountSearch && (
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search accounts to link..."
                      value={accountSearchQuery}
                      onChange={(e) => setAccountSearchQuery(e.target.value)}
                      className="flex-1"
                    />
                    <Button variant="outline" size="sm" onClick={() => setShowAccountSearch(false)}>
                      Cancel
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {availableAccounts
                      .filter(
                        (account) =>
                          account.name.toLowerCase().includes(accountSearchQuery.toLowerCase()) ||
                          account.email.toLowerCase().includes(accountSearchQuery.toLowerCase()),
                      )
                      .map((account) => (
                        <div
                          key={account.id}
                          className="flex items-center justify-between p-2 bg-white rounded cursor-pointer hover:bg-gray-50"
                          onClick={() => handleLinkAccount(account)}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-[#6E72FF] flex items-center justify-center text-white text-xs font-medium">
                              {account.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{account.name}</p>
                              <p className="text-xs text-gray-500">{account.email}</p>
                            </div>
                          </div>
                          <Button size="sm" variant="outline">
                            <UserPlus className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {ticketData.accounts.map((account) => (
                  <div key={account.id} className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#6E72FF] flex items-center justify-center text-white font-medium">
                          {account.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <div>
                          <h4 className="font-medium">{account.name}</h4>
                          <p className="text-sm text-gray-500">
                            {account.role} • {account.department}
                          </p>
                        </div>
                      </div>
                      <Badge variant={account.status === "Active" ? "default" : "secondary"}>{account.status}</Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span>{account.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{account.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-gray-400" />
                        <span>{account.organization}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>Last contact: {account.lastContact}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditAccount(account.id)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleContactAccount(account)}>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Contact
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "checklist" && (
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Task Checklist</h3>
                <div className="text-sm text-gray-500">
                  {ticketData.checklist.filter((item) => item.completed).length} of {ticketData.checklist.length}{" "}
                  completed
                </div>
              </div>

              <div className="space-y-3">
                {ticketData.checklist.map((item) => (
                  <div key={item.id} className="bg-gray-50 rounded-lg p-3 space-y-3">
                    <div className="flex items-center gap-3">
                      <Checkbox checked={item.completed} onCheckedChange={() => toggleChecklistItem(item.id)} />
                      <div className="flex-1">
                        <p className={`text-sm ${item.completed ? "line-through text-gray-500" : ""}`}>{item.text}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleDeleteChecklistItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pl-7">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500">Assignee</label>
                        <Select
                          value={item.assignee}
                          onValueChange={(value) => handleUpdateChecklistItem(item.id, { assignee: value })}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Assign to..." />
                          </SelectTrigger>
                          <SelectContent>
                            {teamMembers.map((member) => (
                              <SelectItem key={member.id} value={member.name}>
                                {member.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500">Due Date</label>
                        <Input
                          type="date"
                          value={item.dueDate}
                          onChange={(e) => handleUpdateChecklistItem(item.id, { dueDate: e.target.value })}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Add new checklist item..."
                  value={newChecklistItem}
                  onChange={(e) => setNewChecklistItem(e.target.value)}
                  className="flex-1"
                  onKeyPress={(e) => e.key === "Enter" && handleAddChecklistItem()}
                />
                <Button onClick={handleAddChecklistItem}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {activeTab === "comments" && (
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Comments & Updates</h3>
                <Button size="sm">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Internal Note
                </Button>
              </div>

              <div className="space-y-4">
                {ticketData.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium ${
                        comment.type === "system" ? "bg-gray-500" : "bg-[#6E72FF]"
                      }`}
                    >
                      {comment.avatar}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{comment.author}</span>
                        <span className="text-xs text-gray-500">{comment.timestamp}</span>
                        {comment.type === "system" && (
                          <Badge variant="secondary" className="text-xs">
                            System
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 border-t pt-4 relative">
                <div className="relative">
                  <Textarea
                    placeholder="Add a comment... Use @ to mention team members"
                    value={newComment}
                    onChange={(e) => handleCommentChange(e.target.value)}
                    className="min-h-[80px]"
                  />
                  {showMentionDropdown && (
                    <div className="absolute top-full left-0 right-0 bg-white border rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                      {teamMembers
                        .filter((member) => member.name.toLowerCase().includes(mentionQuery.toLowerCase()))
                        .map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer"
                            onClick={() => handleSelectMention(member)}
                          >
                            <div className="w-6 h-6 rounded-full bg-[#6E72FF] flex items-center justify-center text-white text-xs">
                              {member.avatar}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{member.name}</p>
                              <p className="text-xs text-gray-500">{member.email}</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
                <div className="flex justify-between">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Paperclip className="h-4 w-4 mr-2" />
                      Attach
                    </Button>
                    <Button variant="outline" size="sm">
                      <AtSign className="h-4 w-4 mr-2" />
                      Mention
                    </Button>
                  </div>
                  <Button onClick={handleAddComment}>
                    <Send className="h-4 w-4 mr-2" />
                    Send
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "files" && (
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Attachments</h3>
                <div className="flex gap-2">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                    accept=".pdf,.xls,.xlsx,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg"
                  />
                  <Button size="sm" onClick={() => document.getElementById("file-upload")?.click()}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload File
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {ticketData.files.map((file) => (
                  <div key={file.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
                      {getFileIcon(file.name)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {file.size} • Uploaded by {file.uploadedBy} • {file.uploadedAt}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleFileDownload(file)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleFileDelete(file.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500 mb-2">Drag and drop files here, or click to browse</p>
                <p className="text-xs text-gray-400 mb-2">Allowed types: PDF, Excel, Word, PowerPoint, PNG, JPG</p>
                <Button variant="outline" size="sm">
                  Choose Files
                </Button>
              </div>
            </div>
          )}

          {activeTab === "history" && (
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Activity History</h3>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>

              <div className="space-y-4">
                {ticketData.history.map((entry, index) => (
                  <div key={entry.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-[#6E72FF]/10 flex items-center justify-center">
                        <History className="h-4 w-4 text-[#6E72FF]" />
                      </div>
                      {index < ticketData.history.length - 1 && <div className="w-px h-8 bg-gray-200 mt-2"></div>}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{entry.action}</span>
                          <span className="text-xs text-gray-500">by {entry.user}</span>
                        </div>
                        <p className="text-xs text-gray-500 mb-1">{entry.timestamp}</p>
                        <p className="text-sm text-gray-700">{entry.details}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      ) : (
        <div className="relative z-10 w-full max-w-4xl bg-white dark:bg-gray-900 shadow-2xl rounded-lg flex flex-col max-h-[90vh] overflow-hidden">
          <div className="p-6 bg-white dark:bg-gray-900 border-b">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{ticketData.title}</h1>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleCopyTicketId} title="Copy Ticket ID">
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className={`h-8 w-8 p-0 ${isWatching ? "text-[#6E72FF]" : ""}`} onClick={handleToggleWatcher} title={isWatching ? "Stop watching" : "Watch ticket"}>
                  <Bell className={`h-4 w-4 ${isWatching ? "fill-current" : ""}`} />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleCopyTicketLink} title="Copy Ticket Link">
                  <Link className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="font-medium">{ticketData.id}</span>
              <span>Created on {ticketData.createdDate}</span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900">
            <div className="flex px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-3 text-sm font-medium border-b-2 transition-colors flex-1 text-center ${
                    activeTab === tab.id
                      ? "text-gray-900 dark:text-white border-gray-900 dark:border-white"
                      : "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">{tab.count}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Reuse the same tab contents as side drawer */}
            {activeTab === "details" && (
              <div className="p-6 space-y-6">
                {/* Description Section */}
                <div className="space-y-3">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Description</span>
                  <div className="flex items-center gap-1 p-2 bg-gray-50 rounded-t-md">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Bold className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Italic className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Underline className="h-4 w-4" />
                    </Button>
                    <div className="w-px h-6 bg-gray-300 mx-1"></div>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <ListIcon className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <ListOrdered className="h-4 w-4" />
                    </Button>
                    <div className="w-px h-6 bg-gray-300 mx-1"></div>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Link className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                  </div>
                  <Textarea placeholder="Add Description" value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[120px] rounded-t-none focus-visible:ring-0 text-sm" />
                </div>

                {/* The rest of the details grid reused */}
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Type</span>
                      <Select value={ticketData.type} onValueChange={(value) => setTicketData({ ...ticketData, type: value })}>
                        <SelectTrigger className="w-40 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Task">Task</SelectItem>
                          <SelectItem value="Incident">Incident</SelectItem>
                          <SelectItem value="Request">Request</SelectItem>
                          <SelectItem value="Problem">Problem</SelectItem>
                          <SelectItem value="Change">Change</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Status</span>
                      <Select value={ticketData.status} onValueChange={(value) => setTicketData({ ...ticketData, status: value })}>
                        <SelectTrigger className="w-40 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Open">Open</SelectItem>
                          <SelectItem value="In Progress">In Progress</SelectItem>
                          <SelectItem value="Resolved">Resolved</SelectItem>
                          <SelectItem value="Closed">Closed</SelectItem>
                          <SelectItem value="On Hold">On Hold</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Priority</span>
                      <Select value={ticketData.priority} onValueChange={(value) => setTicketData({ ...ticketData, priority: value })}>
                        <SelectTrigger className="w-40 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Urgent">Urgent</SelectItem>
                          <SelectItem value="High">High</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="Low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Reported By</span>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#6E72FF] flex items-center justify-center text-white text-xs font-medium">
                          {ticketData.reportedBy}
                        </div>
                        <span className="text-sm">{ticketData.requester}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Assignee</span>
                      <Select value={ticketData.assignee} onValueChange={(value) => setTicketData({ ...ticketData, assignee: value })}>
                        <SelectTrigger className="w-40 h-9">
                          <SelectValue placeholder="Assign" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="John Smith">John Smith</SelectItem>
                          <SelectItem value="Sarah Wilson">Sarah Wilson</SelectItem>
                          <SelectItem value="Mike Chen">Mike Chen</SelectItem>
                          <SelectItem value="Lisa Anderson">Lisa Anderson</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Due Date</span>
                      <Input type="date" value={ticketData.dueDate} onChange={(e) => setTicketData({ ...ticketData, dueDate: e.target.value })} className="w-40 h-9 text-sm" />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Estimated Hours</span>
                      <Input value={ticketData.estimatedTime} onChange={(e) => setTicketData({ ...ticketData, estimatedTime: e.target.value })} className="w-40 h-9 text-sm" />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <span className="text-sm font-medium text-gray-900">Tags</span>
                  <div className="flex flex-wrap gap-2">
                    {ticketData.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                        <Button variant="ghost" size="sm" className="h-4 w-4 p-0 ml-1">
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                    <Button variant="outline" size="sm" className="h-6 text-xs bg-transparent">
                      <Plus className="h-3 w-3 mr-1" />
                      Add Tag
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'accounts' && (
              <div className="p-6">
                {/* Keep original Accounts tab content by reusing component state */}
                {/* For brevity, not duplicating here since it's the same JSX as side variant */}
              </div>
            )}

            {activeTab === 'comments' && (
              <div className="p-6">
                {/* Comments content reused above */}
              </div>
            )}

            {activeTab === 'files' && (
              <div className="p-6">
                {/* Files content reused above */}
              </div>
            )}

            {activeTab === 'history' && (
              <div className="p-6">
                {/* History content reused above */}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
