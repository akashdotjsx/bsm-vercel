"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { createBrowserClient } from "@supabase/ssr"
import {
  X,
  Bell,
  Copy,
  Link,
  Paperclip,
  Bold,
  Italic,
  Underline,
  Plus,
  Trash2,
  Send,
  Upload,
  Download,
  Building,
  FileText,
  History,
  Search,
  AtSign,
  Calendar,
  User,
} from "lucide-react"

interface TicketTrayProps {
  isOpen: boolean
  onClose: () => void
  onSave?: () => void
  ticket?: any
}

export function TicketTray({ isOpen, onClose, onSave, ticket }: TicketTrayProps) {
  const [activeTab, setActiveTab] = useState("details")
  const [description, setDescription] = useState("")
  const [isWatching, setIsWatching] = useState(false)
  const [newChecklistItem, setNewChecklistItem] = useState("")
  const [newComment, setNewComment] = useState("")
  const [taskName, setTaskName] = useState("")
  const [showAccountSearch, setShowAccountSearch] = useState(false)
  const [accountSearchQuery, setAccountSearchQuery] = useState("")
  const [showMentionDropdown, setShowMentionDropdown] = useState(false)
  const [mentionQuery, setMentionQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const [users, setUsers] = useState<any[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [accounts, setAccounts] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [serviceCategories, setServiceCategories] = useState<any[]>([])
  const [serviceTypes, setServiceTypes] = useState<any[]>([])
  const [priorities, setPriorities] = useState<any[]>([])
  const [contacts, setContacts] = useState<any[]>([])
  const [accountStatuses, setAccountStatuses] = useState<any[]>([])

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const generateTicketId = async () => {
    try {
      const { data, error } = await supabase
        .from("tickets")
        .select("ticket_number")
        .order("created_at", { ascending: false })
        .limit(1)

      if (error) {
        console.error("[v0] Error fetching last ticket:", error)
        return `TK-${Math.floor(Math.random() * 9999) + 1}`
      }

      let nextNumber = 1
      if (data && data.length > 0 && data[0].ticket_number) {
        const lastNumber = Number.parseInt(data[0].ticket_number.split("-")[1]) || 0
        nextNumber = lastNumber + 1
      }

      return `TK-${nextNumber.toString().padStart(4, "0")}`
    } catch (error) {
      console.error("[v0] Error generating ticket ID:", error)
      return `TK-${Math.floor(Math.random() * 9999) + 1}`
    }
  }

  const fetchData = async () => {
    setIsLoading(true)
    try {
      console.log("[v0] Fetching data from database...")

      // Fetch users from profiles table
      const { data: usersData, error: usersError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email, display_name")
        .eq("is_active", true)

      if (usersError) {
        console.error("[v0] Error fetching users:", usersError)
      } else {
        const formattedUsers =
          usersData?.map((user) => ({
            id: user.id,
            name: user.display_name || `${user.first_name} ${user.last_name}`,
            email: user.email,
            avatar: (user.first_name?.[0] || "") + (user.last_name?.[0] || ""),
          })) || []
        setUsers(formattedUsers)
        console.log("[v0] Users loaded:", formattedUsers.length)
      }

      // Fetch departments
      const { data: deptData, error: deptError } = await supabase.from("departments").select("id, name")

      if (deptError) {
        console.error("[v0] Error fetching departments:", deptError)
      } else {
        setDepartments(deptData || [])
        console.log("[v0] Departments loaded:", deptData?.length || 0)
      }

      // Fetch teams
      const { data: teamsData, error: teamsError } = await supabase
        .from("teams")
        .select("id, name")
        .eq("is_active", true)

      if (teamsError) {
        console.error("[v0] Error fetching teams:", teamsError)
      } else {
        setTeams(teamsData || [])
        console.log("[v0] Teams loaded:", teamsData?.length || 0)
      }

      // Fetch service categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("service_categories")
        .select("id, name")
        .eq("is_active", true)

      if (categoriesError) {
        console.error("[v0] Error fetching service categories:", categoriesError)
      } else {
        setServiceCategories(categoriesData || [])
        console.log("[v0] Service categories loaded:", categoriesData?.length || 0)
      }

      // Fetch service types
      const { data: typesData, error: typesError } = await supabase
        .from("service_types")
        .select("id, name, service_category_id")
        .eq("is_active", true)

      if (typesError) {
        console.error("[v0] Error fetching service types:", typesError)
      } else {
        setServiceTypes(typesData || [])
        console.log("[v0] Service types loaded:", typesData?.length || 0)
      }

      // Fetch priority matrix
      const { data: prioritiesData, error: prioritiesError } = await supabase
        .from("priority_matrix")
        .select("id, name, level, color")
        .eq("is_active", true)
        .order("level", { ascending: true })

      if (prioritiesError) {
        console.error("[v0] Error fetching priorities:", prioritiesError)
      } else {
        setPriorities(prioritiesData || [])
        console.log("[v0] Priorities loaded:", prioritiesData?.length || 0)
      }

      // Fetch accounts
      const { data: accountsData, error: accountsError } = await supabase
        .from("accounts")
        .select("id, name, email, phone")
        .eq("is_active", true)

      if (accountsError) {
        console.error("[v0] Error fetching accounts:", accountsError)
      } else {
        setAccounts(accountsData || [])
        console.log("[v0] Accounts loaded:", accountsData?.length || 0)
      }

      // Fetch account statuses
      const { data: statusData, error: statusError } = await supabase
        .from("account_status")
        .select("id, name, color")
        .eq("is_active", true)

      if (statusError) {
        console.error("[v0] Error fetching account statuses:", statusError)
      } else {
        setAccountStatuses(statusData || [])
        console.log("[v0] Account statuses loaded:", statusData?.length || 0)
      }

      // Fetch contacts
      const { data: contactsData, error: contactsError } = await supabase
        .from("contacts")
        .select(`
          id, 
          first_name, 
          last_name, 
          email, 
          phone, 
          title, 
          department,
          account_id,
          accounts(name)
        `)
        .eq("is_active", true)

      if (contactsError) {
        console.error("[v0] Error fetching contacts:", contactsError)
      } else {
        setContacts(contactsData || [])
        console.log("[v0] Contacts loaded:", contactsData?.length || 0)
      }
    } catch (error) {
      console.error("[v0] Error fetching data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchData()
    }
  }, [isOpen])

  const getCurrentUser = () => {
    // In a real app, this would come from auth context
    return (
      users.find((user) => user.email === "current@user.com") ||
      (users.length > 0 ? users[0] : { name: "Current User", email: "current@user.com" })
    )
  }

  const [ticketData, setTicketData] = useState({
    id: ticket?.id || "",
    title: ticket?.title || taskName || "New Ticket",
    type: ticket?.type || "Incident",
    status: ticket?.status || "Open",
    priority: ticket?.priority || "Medium",
    reportedBy: ticket?.reportedBy || "Current User",
    assignee: ticket?.assignee?.name || "",
    requester: ticket?.requester || "Current User",
    organization: ticket?.organization || "",
    department: ticket?.department || "",
    category: ticket?.category || "",
    subcategory: ticket?.subcategory || "",
    team: ticket?.team || "",
    serviceCategory: ticket?.serviceCategory || "",
    serviceType: ticket?.serviceType || "",
    createdDate: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    dueDate: ticket?.dueDate || "",
    estimatedTime: "8",
    actualTime: "6.5",
    tags: ticket?.tags || [],
    accounts: ticket?.accounts || [],
    checklist: ticket?.checklist || [],
    comments: ticket?.comments || [],
    files: ticket?.files || [],
    history: ticket?.history || [],
  })

  useEffect(() => {
    if (!ticket && isOpen && !ticketData.id) {
      generateTicketId().then((id) => {
        setTicketData((prev) => ({ ...prev, id }))
      })
    }
  }, [isOpen, ticket])

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
        return "bg-blue-100 text-blue-800"
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
        return "bg-blue-100 text-blue-800"
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
    console.log("[v0] Linking account:", account)
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
    console.log("[v0] Account linked successfully, updated ticket data")
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
        return <FileText className="h-5 w-5 text-blue-600" />
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

  const handleSaveTicket = async () => {
    try {
      console.log("[v0] Saving new ticket:", ticketData)
      setIsLoading(true)

      const currentUser = getCurrentUser()

      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: ticketData.title,
          description: description || "",
          status: ticketData.status,
          priority: ticketData.priority,
          type: ticketData.type,
          category: ticketData.serviceCategory || "",
          subcategory: ticketData.serviceType || "",
          assignee_id: users.find((u) => u.name === ticketData.assignee)?.id || null,
          organization_id: accounts.find((a) => a.name === ticketData.organization)?.id || null,
          requester_id: currentUser.id || null,
          urgency: ticketData.priority,
          impact: ticketData.priority,
          severity: ticketData.priority,
          channel: "Web",
          ticket_number: ticketData.id,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create ticket")
      }

      const result = await response.json()

      if (result.success) {
        console.log("[v0] Ticket saved successfully:", result.ticket)

        // Add to history
        setTicketData((prev) => ({
          ...prev,
          history: [
            {
              id: Date.now(),
              action: "Ticket created",
              user: currentUser.name,
              timestamp: new Date().toLocaleString(),
              details: "Initial ticket created",
            },
            ...prev.history,
          ],
        }))

        // Call onSave callback to refresh the tickets list
        if (onSave) {
          await onSave()
        }

        onClose()
      } else {
        throw new Error(result.error || "Failed to create ticket")
      }
    } catch (error) {
      console.error("[v0] Error saving ticket:", error)
      alert("Error creating ticket. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />

      <div className="ml-auto w-[40vw] min-w-[700px] max-w-[900px] bg-white dark:bg-gray-900 shadow-2xl flex flex-col h-full relative z-10">
        <div className="p-6 bg-white dark:bg-gray-900">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {!ticket ? (
                <Input
                  placeholder="Enter task name..."
                  value={taskName}
                  onChange={(e) => {
                    setTaskName(e.target.value)
                    setTicketData({ ...ticketData, title: e.target.value })
                  }}
                  className="text-xl font-semibold border-none p-0 h-auto focus-visible:ring-0"
                />
              ) : (
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{ticketData.title}</h1>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => {
                  navigator.clipboard.writeText(ticketData.id)
                  alert(`Ticket ID ${ticketData.id} copied to clipboard`)
                }}
                title="Copy Ticket ID"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 w-8 p-0 ${isWatching ? "text-blue-600" : ""}`}
                onClick={() => setIsWatching(!isWatching)}
                title={isWatching ? "Stop watching" : "Watch ticket"}
              >
                <Bell className={`h-4 w-4 ${isWatching ? "fill-current" : ""}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => {
                  const ticketLink = `${window.location.origin}/tickets/${ticketData.id}`
                  navigator.clipboard.writeText(ticketLink)
                  alert("Ticket link copied to clipboard")
                }}
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
              {isLoading && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Loading data...</p>
                </div>
              )}

              {/* Description Section */}
              <div className="space-y-3">
                <span className="text-sm font-medium text-gray-900 dark:text-white">Description</span>

                <div className="flex items-center gap-1 p-2 bg-gray-50 rounded-t-md">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      const textarea = document.querySelector(
                        'textarea[placeholder="Add Description"]',
                      ) as HTMLTextAreaElement
                      if (textarea) {
                        const start = textarea.selectionStart
                        const end = textarea.selectionEnd
                        const selectedText = description.substring(start, end)
                        const newText =
                          description.substring(0, start) + `**${selectedText}**` + description.substring(end)
                        setDescription(newText)
                      }
                    }}
                  >
                    <Bold className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      const textarea = document.querySelector(
                        'textarea[placeholder="Add Description"]',
                      ) as HTMLTextAreaElement
                      if (textarea) {
                        const start = textarea.selectionStart
                        const end = textarea.selectionEnd
                        const selectedText = description.substring(start, end)
                        const newText =
                          description.substring(0, start) + `*${selectedText}*` + description.substring(end)
                        setDescription(newText)
                      }
                    }}
                  >
                    <Italic className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      const textarea = document.querySelector(
                        'textarea[placeholder="Add Description"]',
                      ) as HTMLTextAreaElement
                      if (textarea) {
                        const start = textarea.selectionStart
                        const end = textarea.selectionEnd
                        const selectedText = description.substring(start, end)
                        const newText =
                          description.substring(0, start) + `<u>${selectedText}</u>` + description.substring(end)
                        setDescription(newText)
                      }
                    }}
                  >
                    <Underline className="h-4 w-4" />
                  </Button>
                  <div className="w-px h-6 bg-gray-300 mx-1"></div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      const link = prompt("Enter link URL:")
                      if (link) {
                        setDescription((prev) => prev + `\n[Link](${link})`)
                      }
                    }}
                  >
                    <Link className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      const input = document.createElement("input")
                      input.type = "file"
                      input.accept = ".pdf,.doc,.docx,.png,.jpg,.jpeg"
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0]
                        if (file) {
                          setDescription((prev) => prev + `\n[Attachment: ${file.name}]`)
                        }
                      }
                      input.click()
                    }}
                  >
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
                    <span className="text-sm font-medium text-gray-700">Requested By</span>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium">
                        {getCurrentUser().name?.charAt(0) || "U"}
                      </div>
                      <span className="text-sm">{getCurrentUser().name}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Assignee</span>
                    <Select
                      value={ticketData.assignee}
                      onValueChange={(value) => setTicketData({ ...ticketData, assignee: value })}
                    >
                      <SelectTrigger className="w-40 h-9">
                        <SelectValue placeholder="Select assignee" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.name}>
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">
                                {user.avatar}
                              </div>
                              {user.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Team</span>
                    <Select
                      value={ticketData.team}
                      onValueChange={(value) => setTicketData({ ...ticketData, team: value })}
                    >
                      <SelectTrigger className="w-40 h-9">
                        <SelectValue placeholder="Select team" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.name}>
                            {team.name}
                          </SelectItem>
                        ))}
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
                        {priorities.map((priority) => (
                          <SelectItem key={priority.id} value={priority.name}>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: priority.color }} />
                              {priority.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Department</span>
                    <Select
                      value={ticketData.department}
                      onValueChange={(value) => setTicketData({ ...ticketData, department: value })}
                    >
                      <SelectTrigger className="w-40 h-9">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.name}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Service Category</span>
                    <Select
                      value={ticketData.serviceCategory}
                      onValueChange={(value) => setTicketData({ ...ticketData, serviceCategory: value })}
                    >
                      <SelectTrigger className="w-40 h-9">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {serviceCategories.map((category) => (
                          <SelectItem key={category.id} value={category.name}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Service Type</span>
                    <Select
                      value={ticketData.serviceType}
                      onValueChange={(value) => setTicketData({ ...ticketData, serviceType: value })}
                    >
                      <SelectTrigger className="w-40 h-9">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {serviceTypes.map((type) => (
                          <SelectItem key={type.id} value={type.name}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 ml-1"
                        onClick={() => {
                          const newTags = ticketData.tags.filter((_, i) => i !== index)
                          setTicketData({ ...ticketData, tags: newTags })
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 text-xs bg-transparent"
                    onClick={() => {
                      const newTag = prompt("Enter tag name:")
                      if (newTag) {
                        setTicketData({ ...ticketData, tags: [...ticketData.tags, newTag] })
                      }
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Tag
                  </Button>
                </div>
              </div>

              {/* Save Button for new tickets */}
              {!ticket && (
                <div className="flex justify-end pt-4 border-t">
                  <Button onClick={handleSaveTicket} disabled={!ticketData.title.trim() || isLoading}>
                    {isLoading ? "Creating..." : "Create Ticket"}
                  </Button>
                </div>
              )}
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
                    />
                    <Button size="sm" onClick={() => setShowAccountSearch(false)}>
                      Cancel
                    </Button>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {accounts
                      .filter(
                        (account) =>
                          account.name.toLowerCase().includes(accountSearchQuery.toLowerCase()) ||
                          account.email?.toLowerCase().includes(accountSearchQuery.toLowerCase()),
                      )
                      .map((account) => (
                        <div
                          key={account.id}
                          className="flex items-center justify-between p-3 bg-white rounded border hover:bg-gray-50 cursor-pointer"
                          onClick={() => {
                            setTicketData({
                              ...ticketData,
                              accounts: [
                                ...ticketData.accounts,
                                {
                                  id: account.id,
                                  name: account.name,
                                  email: account.email,
                                  phone: account.phone,
                                  status: "Active",
                                  lastContact: "Just linked",
                                },
                              ],
                            })
                            setShowAccountSearch(false)
                            setAccountSearchQuery("")
                          }}
                        >
                          <div>
                            <div className="font-medium">{account.name}</div>
                            <div className="text-sm text-gray-500">{account.email}</div>
                          </div>
                          <Button size="sm">Link</Button>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {ticketData.accounts.map((account, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <Building className="h-5 w-5 text-gray-400" />
                          <div>
                            <div className="font-medium">{account.name}</div>
                            <div className="text-sm text-gray-500">{account.email}</div>
                          </div>
                        </div>

                        {contacts
                          .filter((contact) => contact.account_id === account.id)
                          .map((contact, contactIndex) => (
                            <div key={contactIndex} className="ml-8 text-sm text-gray-600">
                              <div>
                                {contact.title} - {contact.department}
                              </div>
                              <div>
                                {contact.first_name} {contact.last_name}
                              </div>
                            </div>
                          ))}
                      </div>

                      <div className="flex items-center gap-2">
                        <div
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            account.status === "Active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {account.status}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "checklist" && (
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Checklist</h3>
                <Button
                  size="sm"
                  onClick={() => {
                    const newItem = prompt("Enter checklist item:")
                    if (newItem) {
                      setTicketData({
                        ...ticketData,
                        checklist: [
                          ...ticketData.checklist,
                          {
                            id: Date.now(),
                            text: newItem,
                            completed: false,
                            assignee: "",
                            dueDate: "",
                          },
                        ],
                      })
                    }
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>

              <div className="space-y-3">
                {ticketData.checklist.map((item, index) => (
                  <div key={item.id || index} className="flex items-center gap-3 p-3 border rounded-lg">
                    <Checkbox
                      checked={item.completed}
                      onCheckedChange={(checked) => {
                        setTicketData({
                          ...ticketData,
                          checklist: ticketData.checklist.map((checkItem, i) =>
                            i === index ? { ...checkItem, completed: !!checked } : checkItem,
                          ),
                        })
                      }}
                    />

                    <div className="flex-1">
                      <div className={`${item.completed ? "line-through text-gray-500" : ""}`}>{item.text}</div>

                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <Select
                            value={item.assignee}
                            onValueChange={(value) => {
                              setTicketData({
                                ...ticketData,
                                checklist: ticketData.checklist.map((checkItem, i) =>
                                  i === index ? { ...checkItem, assignee: value } : checkItem,
                                ),
                              })
                            }}
                          >
                            <SelectTrigger className="w-32 h-8">
                              <SelectValue placeholder="Assignee" />
                            </SelectTrigger>
                            <SelectContent>
                              {users.map((user) => (
                                <SelectItem key={user.id} value={user.name}>
                                  {user.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <Input
                            type="date"
                            value={item.dueDate}
                            onChange={(e) => {
                              setTicketData({
                                ...ticketData,
                                checklist: ticketData.checklist.map((checkItem, i) =>
                                  i === index ? { ...checkItem, dueDate: e.target.value } : checkItem,
                                ),
                              })
                            }}
                            className="w-32 h-8"
                          />
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => {
                        setTicketData({
                          ...ticketData,
                          checklist: ticketData.checklist.filter((_, i) => i !== index),
                        })
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "comments" && (
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                {ticketData.comments.map((comment, index) => (
                  <div key={comment.id || index} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium">
                      {comment.avatar}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{comment.author}</span>
                        <span className="text-xs text-gray-500">{comment.timestamp}</span>
                      </div>
                      <div className="text-sm text-gray-700">{comment.content}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <Textarea
                    placeholder="Add a comment... Use @ to mention someone"
                    value={newComment}
                    onChange={(e) => {
                      const value = e.target.value
                      setNewComment(value)

                      // Check for @ mentions
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
                    }}
                    className="min-h-[80px]"
                  />

                  {showMentionDropdown && (
                    <div className="absolute top-full left-0 right-0 bg-white border rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                      {users
                        .filter((user) => user.name.toLowerCase().includes(mentionQuery.toLowerCase()))
                        .map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer"
                            onClick={() => {
                              const lastAtIndex = newComment.lastIndexOf("@")
                              const beforeMention = newComment.substring(0, lastAtIndex)
                              const afterMention = `@${user.name} `
                              setNewComment(beforeMention + afterMention)
                              setShowMentionDropdown(false)
                            }}
                          >
                            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">
                              {user.avatar}
                            </div>
                            <span className="text-sm">{user.name}</span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setShowMentionDropdown(!showMentionDropdown)}
                    >
                      <AtSign className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => {
                        const input = document.createElement("input")
                        input.type = "file"
                        input.accept = ".pdf,.doc,.docx,.png,.jpg,.jpeg"
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0]
                          if (file) {
                            setNewComment((prev) => prev + `\n[Attachment: ${file.name}]`)
                          }
                        }
                        input.click()
                      }}
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => {
                      if (newComment.trim()) {
                        const comment = {
                          id: Date.now(),
                          author: getCurrentUser().name,
                          avatar: getCurrentUser().name?.charAt(0) || "U",
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
                    }}
                    disabled={!newComment.trim()}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Comment
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "history" && (
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Activity History</h3>
              </div>

              <div className="space-y-4">
                {ticketData.history.map((entry, index) => (
                  <div key={entry.id || index} className="flex gap-3 pb-4 border-b last:border-b-0">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <History className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{entry.action}</span>
                        <span className="text-xs text-gray-500">by {entry.user}</span>
                      </div>
                      <div className="text-xs text-gray-500 mb-1">{entry.timestamp}</div>
                      <div className="text-sm text-gray-700">{entry.details}</div>
                    </div>
                  </div>
                ))}

                {ticketData.history.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No activity history yet</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Files tab remains the same */}
          {activeTab === "files" && (
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Files & Attachments</h3>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.xls,.xlsx,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg"
                    onChange={(e) => {
                      const files = e.target.files
                      if (files) {
                        Array.from(files).forEach((file) => {
                          const newFile = {
                            id: Date.now() + Math.random(),
                            name: file.name,
                            size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
                            uploadedBy: getCurrentUser().name,
                            uploadedAt: "Just now",
                            type: file.name.split(".").pop()?.toLowerCase() || "file",
                          }
                          setTicketData((prev) => ({
                            ...prev,
                            files: [...prev.files, newFile],
                          }))
                        })
                      }
                    }}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button size="sm" onClick={() => document.getElementById("file-upload")?.click()}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Files
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {ticketData.files.map((file, index) => (
                  <div key={file.id || index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <div>
                        <div className="font-medium text-sm">{file.name}</div>
                        <div className="text-xs text-gray-500">
                          {file.size} • Uploaded by {file.uploadedBy} • {file.uploadedAt}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => alert(`Download functionality for: ${file.name}`)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          setTicketData((prev) => ({
                            ...prev,
                            files: prev.files.filter((_, i) => i !== index),
                          }))
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {ticketData.files.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No files attached yet</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
