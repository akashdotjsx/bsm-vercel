"use client"

import { useState, useEffect } from "react"
import { PageContent } from "@/components/layout/page-content"
import { ServiceRequestDetails } from "@/components/services/service-request-details"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Search, 
  Eye, 
  MoreHorizontal, 
  CheckCircle2, 
  XCircle, 
  Clock,
  AlertCircle,
  RefreshCw,
  Users
} from "lucide-react"
import { useAuth } from "@/lib/contexts/auth-context"
import { toast } from "@/lib/toast"
import { useServiceRequestsGQL } from "@/hooks/use-services-assets-gql"

interface ServiceRequest {
  id: string
  request_number: string
  title: string
  description: string
  business_justification?: string
  status: string
  priority: string
  urgency: string
  created_at: string
  estimated_delivery_date: string
  cost_center?: string
  form_data?: any
  requester: {
    first_name: string
    last_name: string
    email: string
    department: string
  }
  service: {
    name: string
    estimated_delivery_days: number
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

const statusConfig = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300", icon: Clock },
  approved: { label: "Approved", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300", icon: CheckCircle2 },
  in_progress: { label: "In Progress", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300", icon: RefreshCw },
  completed: { label: "Completed", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300", icon: XCircle },
  cancelled: { label: "Cancelled", color: "bg-muted text-muted-foreground", icon: XCircle }
}

const priorityConfig = {
  low: { label: "Low", color: "bg-muted text-muted-foreground" },
  medium: { label: "Medium", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" },
  high: { label: "High", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300" },
  critical: { label: "Critical", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" }
}

export default function AdminServiceRequestsPage() {
  const { isAdmin, user } = useAuth()
  const organizationId = user?.user_metadata?.organization_id || "00000000-0000-0000-0000-000000000001"
  
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  // Use GraphQL hook for fetching all service requests
  const { serviceRequests: requests, count, loading, error, refetch } = useServiceRequestsGQL({
    organization_id: organizationId,
    scope: 'all',
    limit: 100
  })

  useEffect(() => {
    if (!isAdmin) {
      toast.error('Access denied - Admin privileges required')
      return
    }

    if (error) {
      console.error('Error fetching service requests:', error)
      toast.error('Failed to load service requests')
    }
  }, [isAdmin, error])

  const handleViewDetails = (request: ServiceRequest) => {
    console.log('View Details clicked for request:', request.id, request.title)
    setSelectedRequest(request)
    setShowDetails(true)
    console.log('Modal state set - showDetails:', true, 'selectedRequest:', request.id)
  }

  const handleRequestUpdate = () => {
    refetch()
  }

  const filteredRequests = requests.filter(request => {
    if (statusFilter !== "all" && request.status !== statusFilter) return false
    if (priorityFilter !== "all" && request.priority !== priorityFilter) return false
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return (
        request.title.toLowerCase().includes(searchLower) ||
        request.request_number.toLowerCase().includes(searchLower) ||
        request.service.name.toLowerCase().includes(searchLower) ||
        request.requester.email.toLowerCase().includes(searchLower) ||
        `${request.requester.first_name} ${request.requester.last_name}`.toLowerCase().includes(searchLower)
      )
    }
    return true
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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

  const getStatusCounts = () => {
    return {
      total: requests.length,
      pending: requests.filter(r => r.status === 'pending').length,
      approved: requests.filter(r => r.status === 'approved').length,
      in_progress: requests.filter(r => r.status === 'in_progress').length,
      completed: requests.filter(r => r.status === 'completed').length,
    }
  }

  const statusCounts = getStatusCounts()

  if (!isAdmin) {
    return (
      <PageContent title="Access Denied" description="Admin privileges required">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-[11px] font-semibold text-foreground mb-2">Access Denied</h2>
            <p className="text-[10px] text-muted-foreground">You need administrator privileges to view all service requests.</p>
          </CardContent>
        </Card>
      </PageContent>
    )
  }

  return (
    <PageContent
      title="All Service Requests"
      description="Manage all service requests across the organization"
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-muted-foreground">Total Requests</p>
                  <p className="text-[13px] font-bold">{statusCounts.total}</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-muted-foreground">Pending</p>
                  <p className="text-[13px] font-bold">{statusCounts.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-muted-foreground">Approved</p>
                  <p className="text-[13px] font-bold">{statusCounts.approved}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-muted-foreground">In Progress</p>
                  <p className="text-[13px] font-bold">{statusCounts.in_progress}</p>
                </div>
                <RefreshCw className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-muted-foreground">Completed</p>
                  <p className="text-[13px] font-bold">{statusCounts.completed}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search requests, services, or requesters..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-full md:w-[150px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Requests List */}
        <div className="space-y-4">
          {loading ? (
            // Loading skeleton
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                    <div className="h-3 bg-muted rounded w-full"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredRequests.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-[11px] font-semibold text-foreground mb-2">No service requests found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== "all" || priorityFilter !== "all"
                    ? "Try adjusting your search or filter criteria"
                    : "No service requests have been submitted yet"}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredRequests.map((request) => (
              <Card key={request.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-[11px] font-semibold text-foreground">
                          {request.title}
                        </h3>
                        {getStatusBadge(request.status)}
                        {getPriorityBadge(request.priority)}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <span className="font-medium">#{request.request_number}</span>
                        <span>•</span>
                        <span>{request.service.name}</span>
                        <span>•</span>
                        <span>
                          {request.requester.first_name} {request.requester.last_name} 
                          ({request.requester.email})
                        </span>
                        <span>•</span>
                        <span>Created {formatDate(request.created_at)}</span>
                        {request.requester.department && (
                          <>
                            <span>•</span>
                            <span>{request.requester.department}</span>
                          </>
                        )}
                      </div>

                      <p className="text-foreground mb-3 line-clamp-2">
                        {request.description}
                      </p>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {request.estimated_delivery_date && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>Due: {formatDate(request.estimated_delivery_date)}</span>
                          </div>
                        )}
                        {request.assignee && (
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>Assigned to: {request.assignee.first_name} {request.assignee.last_name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          console.log('BUTTON CLICKED!')
                          alert('Button clicked!')
                          handleViewDetails(request)
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {selectedRequest && (
        <ServiceRequestDetails
          request={selectedRequest}
          open={showDetails}
          onOpenChange={setShowDetails}
          onUpdate={handleRequestUpdate}
        />
      )}
    </PageContent>
  )
}
