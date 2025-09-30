"use client"

import React, { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { 
  Clock, 
  User, 
  Calendar, 
  DollarSign, 
  Building, 
  Mail,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertTriangle,
  MessageSquare,
  Users
} from "lucide-react"
import { useAuth } from "@/lib/contexts/auth-context"
import { toast } from "sonner"

interface ServiceRequest {
  id: string
  request_number: string
  title: string
  description: string
  business_justification: string
  status: string
  priority: string
  urgency: string
  created_at: string
  estimated_delivery_date: string
  cost_center: string
  form_data: any
  service: {
    name: string
    estimated_delivery_days: number
  }
  requester: {
    first_name: string
    last_name: string
    email: string
    department: string
  }
  assignee?: {
    first_name: string
    last_name: string
    email: string
  }
  approver?: {
    first_name: string
    last_name: string
    email: string
  }
}

interface ServiceRequestDetailsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  request: ServiceRequest | null
  onUpdate: () => void
}

const statusConfig = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  approved: { label: "Approved", color: "bg-blue-100 text-blue-800", icon: CheckCircle2 },
  in_progress: { label: "In Progress", color: "bg-purple-100 text-purple-800", icon: RefreshCw },
  completed: { label: "Completed", color: "bg-green-100 text-green-800", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-800", icon: XCircle },
  cancelled: { label: "Cancelled", color: "bg-gray-100 text-gray-800", icon: XCircle }
}

const priorityConfig = {
  low: { label: "Low", color: "bg-gray-100 text-gray-800" },
  medium: { label: "Medium", color: "bg-blue-100 text-blue-800" },
  high: { label: "High", color: "bg-orange-100 text-orange-800" },
  critical: { label: "Critical", color: "bg-red-100 text-red-800" }
}

export function ServiceRequestDetails({ open, onOpenChange, request, onUpdate }: ServiceRequestDetailsProps) {
  const { isAdmin, profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("details")
  const [newStatus, setNewStatus] = useState("")
  const [newPriority, setNewPriority] = useState("")
  const [comment, setComment] = useState("")
  const [assigneeEmail, setAssigneeEmail] = useState("")

  if (!request) return null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium
    return (
      <Badge variant="outline" className={config.color}>
        {config.label}
      </Badge>
    )
  }

  const handleApprove = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/service-requests/${request.id}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment })
      })

      if (response.ok) {
        toast.success('Service request approved successfully')
        setComment("")
        onUpdate()
        onOpenChange(false)
      } else {
        toast.error('Failed to approve request')
      }
    } catch (error) {
      toast.error('Failed to approve request')
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/service-requests/${request.id}/reject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment })
      })

      if (response.ok) {
        toast.success('Service request rejected')
        setComment("")
        onUpdate()
        onOpenChange(false)
      } else {
        toast.error('Failed to reject request')
      }
    } catch (error) {
      toast.error('Failed to reject request')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async () => {
    if (!newStatus) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/service-requests/${request.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, comment })
      })

      if (response.ok) {
        toast.success('Status updated successfully')
        setComment("")
        setNewStatus("")
        onUpdate()
      } else {
        toast.error('Failed to update status')
      }
    } catch (error) {
      toast.error('Failed to update status')
    } finally {
      setLoading(false)
    }
  }

  const handleAssign = async () => {
    if (!assigneeEmail) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/service-requests/${request.id}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigneeEmail, comment })
      })

      if (response.ok) {
        toast.success('Request assigned successfully')
        setAssigneeEmail("")
        setComment("")
        onUpdate()
      } else {
        toast.error('Failed to assign request')
      }
    } catch (error) {
      toast.error('Failed to assign request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold">
                {request.title}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-600">#{request.request_number}</span>
                {getStatusBadge(request.status)}
                {getPriorityBadge(request.priority)}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {/* Tab Navigation */}
          <div className="border-b mb-4">
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab("details")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "details"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Request Details
              </button>
              {(isAdmin || profile?.role === 'manager') && (
                <button
                  onClick={() => setActiveTab("actions")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "actions"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Actions
                </button>
              )}
            </div>
          </div>

          {activeTab === "details" && (
            <div className="space-y-6">
              {/* Request Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4 text-gray-600" />
                      <span className="font-medium text-sm">Requester</span>
                    </div>
                    <p className="text-sm">{request.requester.first_name} {request.requester.last_name}</p>
                    <p className="text-xs text-gray-600">{request.requester.email}</p>
                    {request.requester.department && (
                      <p className="text-xs text-gray-600">{request.requester.department}</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-gray-600" />
                      <span className="font-medium text-sm">Timeline</span>
                    </div>
                    <p className="text-sm">Created: {formatDate(request.created_at)}</p>
                    {request.estimated_delivery_date && (
                      <p className="text-xs text-gray-600">
                        Due: {formatDate(request.estimated_delivery_date)}
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Building className="h-4 w-4 text-gray-600" />
                      <span className="font-medium text-sm">Service</span>
                    </div>
                    <p className="text-sm">{request.service.name}</p>
                    <p className="text-xs text-gray-600">
                      SLA: {request.service.estimated_delivery_days} days
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Request Content */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Request Description</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm mb-2">Description</h4>
                    <p className="text-sm text-gray-700">{request.description}</p>
                  </div>
                  
                  {request.business_justification && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Business Justification</h4>
                      <p className="text-sm text-gray-700">{request.business_justification}</p>
                    </div>
                  )}

                  {request.form_data?.additionalRequirements && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Additional Requirements</h4>
                      <p className="text-sm text-gray-700">{request.form_data.additionalRequirements}</p>
                    </div>
                  )}

                  <Separator />

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Priority:</span>
                      <p className="text-gray-600">{request.priority}</p>
                    </div>
                    <div>
                      <span className="font-medium">Urgency:</span>
                      <p className="text-gray-600">{request.urgency}</p>
                    </div>
                    {request.cost_center && (
                      <div>
                        <span className="font-medium">Cost Center:</span>
                        <p className="text-gray-600">{request.cost_center}</p>
                      </div>
                    )}
                    {request.form_data?.department && (
                      <div>
                        <span className="font-medium">Department:</span>
                        <p className="text-gray-600">{request.form_data.department}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Assignment Info */}
              {(request.assignee || request.approver) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Assignment & Approval</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {request.assignee && (
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-600" />
                        <span className="font-medium text-sm">Assigned to:</span>
                        <span className="text-sm">
                          {request.assignee.first_name} {request.assignee.last_name} ({request.assignee.email})
                        </span>
                      </div>
                    )}
                    {request.approver && (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-gray-600" />
                        <span className="font-medium text-sm">Approver:</span>
                        <span className="text-sm">
                          {request.approver.first_name} {request.approver.last_name} ({request.approver.email})
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeTab === "actions" && (isAdmin || profile?.role === 'manager') && (
            <div className="space-y-6">
              {/* Quick Actions for Pending Requests */}
              {request.status === 'pending' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Approval Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="approval-comment">Comment (Optional)</Label>
                      <Textarea
                        id="approval-comment"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Add a comment about your decision..."
                        className="mt-1"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleApprove}
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button 
                        onClick={handleReject}
                        disabled={loading}
                        variant="destructive"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Status Update */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Update Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="status-select">New Status</Label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select new status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="status-comment">Comment</Label>
                    <Textarea
                      id="status-comment"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Explain the status change..."
                      className="mt-1"
                    />
                  </div>
                  <Button 
                    onClick={handleStatusUpdate}
                    disabled={loading || !newStatus}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Update Status
                  </Button>
                </CardContent>
              </Card>

              {/* Assignment */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Assign Request</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="assignee-email">Assignee Email</Label>
                    <Input
                      id="assignee-email"
                      value={assigneeEmail}
                      onChange={(e) => setAssigneeEmail(e.target.value)}
                      placeholder="user@company.com"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="assign-comment">Assignment Notes</Label>
                    <Textarea
                      id="assign-comment"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Instructions for the assignee..."
                      className="mt-1"
                    />
                  </div>
                  <Button 
                    onClick={handleAssign}
                    disabled={loading || !assigneeEmail}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Assign Request
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}