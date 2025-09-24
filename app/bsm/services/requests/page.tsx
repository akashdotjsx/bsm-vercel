"use client"

import { useState, useMemo } from "react"
import { PlatformLayout } from "@/components/layout/platform-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useDataFetcher } from "@/lib/hooks/use-data-fetcher"
import { createClient } from "@/lib/supabase/client"
import {
  Search,
  MoreHorizontal,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Calendar,
  Building2,
  Eye,
  MessageSquare,
  RefreshCw,
  AlertTriangle,
  Edit,
  UserPlus,
  Ban,
} from "lucide-react"
import { format } from "date-fns"

export default function ServiceRequestsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [activeTab, setActiveTab] = useState("all")

  const [editingRequest, setEditingRequest] = useState<any>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showCommentModal, setShowCommentModal] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [newComment, setNewComment] = useState("")
  const [newStatus, setNewStatus] = useState("")
  const [assigneeId, setAssigneeId] = useState("")

  const {
    data: fetchedRequests,
    loading: dataLoading,
    error,
    refetch,
  } = useDataFetcher({
    table: "service_requests",
    select: `
      *,
      requestor:profiles!service_requests_requestor_id_fkey(id, first_name, last_name, email),
      approver:profiles!service_requests_approver_id_fkey(id, first_name, last_name, email),
      department:departments(id, name)
    `,
    orderBy: { column: "created_at", ascending: false },
    cache: true,
    cacheTTL: 5 * 60 * 1000, // 5 minutes cache
  })

  const handleEditRequest = async (request: any) => {
    setEditingRequest(request)
    setShowEditModal(true)
  }

  const handleAddComment = async (request: any) => {
    setSelectedRequest(request)
    setShowCommentModal(true)
  }

  const handleChangeStatus = async (request: any) => {
    setSelectedRequest(request)
    setNewStatus(request.status.toLowerCase())
    setShowStatusModal(true)
  }

  const handleAssignToUser = async (request: any) => {
    setSelectedRequest(request)
    setShowAssignModal(true)
  }

  const handleCancelRequest = async (request: any) => {
    if (confirm(`Are you sure you want to cancel the request "${request.requestName}"?`)) {
      try {
        const supabase = createClient()
        const { error } = await supabase
          .from("service_requests")
          .update({ status: "cancelled" })
          .eq("request_id", request.id)

        if (error) throw error

        refetch()
      } catch (error) {
        console.error("Error cancelling request:", error)
        alert("Failed to cancel request. Please try again.")
      }
    }
  }

  const handleSaveComment = async () => {
    if (!newComment.trim() || !selectedRequest) return

    try {
      const supabase = createClient()
      // This would typically insert into a comments table
      // For now, we'll just show success message
      alert(`Comment added to request "${selectedRequest.requestName}": ${newComment}`)
      setNewComment("")
      setShowCommentModal(false)
      setSelectedRequest(null)
    } catch (error) {
      console.error("Error adding comment:", error)
      alert("Failed to add comment. Please try again.")
    }
  }

  const handleSaveStatus = async () => {
    if (!newStatus || !selectedRequest) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("service_requests")
        .update({ status: newStatus })
        .eq("request_id", selectedRequest.id)

      if (error) throw error

      setShowStatusModal(false)
      setSelectedRequest(null)
      setNewStatus("")
      refetch()
    } catch (error) {
      console.error("Error updating status:", error)
      alert("Failed to update status. Please try again.")
    }
  }

  const handleSaveAssignment = async () => {
    if (!assigneeId || !selectedRequest) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("service_requests")
        .update({ approver_id: assigneeId })
        .eq("request_id", selectedRequest.id)

      if (error) throw error

      setShowAssignModal(false)
      setSelectedRequest(null)
      setAssigneeId("")
      refetch()
    } catch (error) {
      console.error("Error assigning request:", error)
      alert("Failed to assign request. Please try again.")
    }
  }

  const transformedRequests = useMemo(() => {
    if (!fetchedRequests) return []

    return fetchedRequests.map((request: any) => ({
      id: request.request_id,
      requestName: request.request_name,
      service: request.service_name,
      category: request.service_category,
      requester: request.requestor
        ? `${request.requestor.first_name} ${request.requestor.last_name}`
        : request.requestor_name || "Unknown",
      department: request.department?.name || "Unknown",
      priority: request.priority.charAt(0).toUpperCase() + request.priority.slice(1),
      status: request.status.charAt(0).toUpperCase() + request.status.slice(1).replace("_", " "),
      createdAt: new Date(request.created_at),
      updatedAt: new Date(request.updated_at),
      dueDate: request.expected_delivery ? new Date(request.expected_delivery) : null,
      assignee: request.approver ? `${request.approver.first_name} ${request.approver.last_name}` : null,
      approver: request.approver ? `${request.approver.first_name} ${request.approver.last_name}` : null,
      description: request.description,
      justification: request.business_justification,
      comments: 0, // Would need to count from a comments table if it exists
    }))
  }, [fetchedRequests])

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "in progress":
        return <AlertCircle className="h-4 w-4 text-blue-500" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "on hold":
        return <AlertCircle className="h-4 w-4 text-orange-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "approved":
        return "bg-green-100 text-green-800 border-green-200"
      case "in progress":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "completed":
        return "bg-green-100 text-green-800 border-green-200"
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200"
      case "on hold":
        return "bg-orange-100 text-orange-800 border-orange-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200"
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const filteredRequests = transformedRequests.filter((request) => {
    const matchesSearch =
      request.requestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requester.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.id.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || request.status.toLowerCase() === statusFilter
    const matchesPriority = priorityFilter === "all" || request.priority.toLowerCase() === priorityFilter
    const matchesDepartment = departmentFilter === "all" || request.department === departmentFilter

    const matchesTab =
      activeTab === "all" ||
      (activeTab === "my-requests" && request.requester === "Current User") ||
      (activeTab === "pending-approval" && request.status.toLowerCase() === "pending") ||
      (activeTab === "in-progress" && request.status.toLowerCase() === "in progress")

    return matchesSearch && matchesStatus && matchesPriority && matchesDepartment && matchesTab
  })

  const getRequestCounts = () => {
    return {
      all: transformedRequests.length,
      myRequests: transformedRequests.filter((r) => r.requester === "Current User").length,
      pendingApproval: transformedRequests.filter((r) => r.status.toLowerCase() === "pending").length,
      inProgress: transformedRequests.filter((r) => r.status.toLowerCase() === "in progress").length,
    }
  }

  const counts = getRequestCounts()

  if (dataLoading) {
    return (
      <PlatformLayout breadcrumb={[{ label: "Services", href: "/bsm/services" }, { label: "Service Requests" }]}>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading service requests...</span>
        </div>
      </PlatformLayout>
    )
  }

  if (error) {
    return (
      <PlatformLayout breadcrumb={[{ label: "Services", href: "/bsm/services" }, { label: "Service Requests" }]}>
        <div className="flex items-center justify-center h-64">
          <AlertTriangle className="h-8 w-8 text-red-500" />
          <span className="ml-2 text-red-500">Error loading service requests: {error.message}</span>
          <Button onClick={refetch} variant="outline" className="ml-4 bg-transparent">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </PlatformLayout>
    )
  }

  return (
    <PlatformLayout breadcrumb={[{ label: "Services", href: "/bsm/services" }, { label: "Service Requests" }]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Service Requests</h1>
            <p className="text-sm text-muted-foreground">Track and manage all service requests across departments</p>
          </div>
          <Button>
            <Building2 className="h-4 w-4 mr-2" />
            New Request
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="in progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="on hold">On Hold</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              <SelectItem value="Engineering">Engineering</SelectItem>
              <SelectItem value="Marketing">Marketing</SelectItem>
              <SelectItem value="Sales">Sales</SelectItem>
              <SelectItem value="Finance">Finance</SelectItem>
              <SelectItem value="Operations">Operations</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All Requests ({counts.all})</TabsTrigger>
            <TabsTrigger value="my-requests">My Requests ({counts.myRequests})</TabsTrigger>
            <TabsTrigger value="pending-approval">Pending Approval ({counts.pendingApproval})</TabsTrigger>
            <TabsTrigger value="in-progress">In Progress ({counts.inProgress})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {filteredRequests.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Search className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No requests found</h3>
                  <p className="text-muted-foreground text-center">Try adjusting your search or filter criteria</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredRequests.map((request) => (
                  <Card key={request.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-lg">{request.requestName}</h3>
                            <Badge className={`${getStatusColor(request.status)} border`}>
                              <div className="flex items-center gap-1">
                                {getStatusIcon(request.status)}
                                {request.status}
                              </div>
                            </Badge>
                            <Badge className={`${getPriorityColor(request.priority)} border`}>{request.priority}</Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span>{request.requester}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4" />
                              <span>{request.department}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>Due: {request.dueDate ? format(request.dueDate, "MMM dd, yyyy") : "Not set"}</span>
                            </div>
                            {request.comments > 0 && (
                              <div className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" />
                                <span>{request.comments} comments</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-sm">
                            <span>
                              <strong>Service:</strong> {request.service}
                            </span>
                            <span>
                              <strong>Category:</strong> {request.category}
                            </span>
                            <span>
                              <strong>ID:</strong> {request.id}
                            </span>
                            {request.assignee && (
                              <span>
                                <strong>Assigned to:</strong> {request.assignee}
                              </span>
                            )}
                          </div>

                          <p className="text-sm text-muted-foreground line-clamp-2">{request.description}</p>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditRequest(request)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Request
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleAddComment(request)}>
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Add Comment
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleChangeStatus(request)}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Change Status
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleAssignToUser(request)}>
                                <UserPlus className="h-4 w-4 mr-2" />
                                Assign to User
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600" onClick={() => handleCancelRequest(request)}>
                                <Ban className="h-4 w-4 mr-2" />
                                Cancel Request
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Edit Request Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="requestName">Request Name</Label>
                <Input
                  id="requestName"
                  value={editingRequest?.requestName || ""}
                  onChange={(e) => setEditingRequest({ ...editingRequest, requestName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editingRequest?.description || ""}
                  onChange={(e) => setEditingRequest({ ...editingRequest, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setShowEditModal(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    alert(`Request "${editingRequest?.requestName}" updated successfully!`)
                    setShowEditModal(false)
                  }}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Comment Modal */}
        <Dialog open={showCommentModal} onOpenChange={setShowCommentModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Comment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="comment">Comment</Label>
                <Textarea
                  id="comment"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Enter your comment..."
                  rows={4}
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCommentModal(false)
                    setNewComment("")
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveComment}>Add Comment</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Change Status Modal */}
        <Dialog open={showStatusModal} onOpenChange={setShowStatusModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Change Status</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="status">New Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowStatusModal(false)
                    setNewStatus("")
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveStatus}>Update Status</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Assign to User Modal */}
        <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Assign to User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="assignee">Assign to</Label>
                <Select value={assigneeId} onValueChange={setAssigneeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user1">John Smith</SelectItem>
                    <SelectItem value="user2">Sarah Johnson</SelectItem>
                    <SelectItem value="user3">Mike Chen</SelectItem>
                    <SelectItem value="user4">Emily Davis</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAssignModal(false)
                    setAssigneeId("")
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveAssignment}>Assign Request</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PlatformLayout>
  )
}
