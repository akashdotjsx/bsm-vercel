"use client"

import { useState, useEffect } from "react"
import { PlatformLayout } from "@/components/layout/platform-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Clock, 
  Search, 
  Filter, 
  Eye, 
  MoreHorizontal, 
  CheckCircle2,
  AlertCircle,
  XCircle,
  RefreshCw
} from "lucide-react"
import { useAuth } from "@/lib/contexts/auth-context"
import { toast } from "sonner"
import { useServiceRequestsGQL } from "@/hooks/use-services-assets-gql"

interface ServiceRequest {
  id: string
  request_number: string
  title: string
  description: string
  status: string
  priority: string
  urgency: string
  created_at: string
  estimated_delivery_date: string
  service: {
    name: string
    estimated_delivery_days: number
  }
  requester: {
    first_name: string
    last_name: string
    email: string
  }
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

export default function MyServiceRequestsPage() {
  const { canView, user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")

  // Fetch service requests with GraphQL
  const { serviceRequests: requests, loading, error } = useServiceRequestsGQL({
    requester_id: user?.id,
    status: statusFilter !== "all" ? statusFilter : undefined
  })
  
  useEffect(() => {
    if (error) {
      console.error('Error fetching service requests:', error)
      toast.error('Failed to load service requests')
    }
  }, [error])

  const filteredRequests = requests.filter(request => {
    if (statusFilter !== "all" && request.status !== statusFilter) return false
    if (priorityFilter !== "all" && request.priority !== priorityFilter) return false
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return (
        request.title.toLowerCase().includes(searchLower) ||
        request.request_number.toLowerCase().includes(searchLower) ||
        request.service.name.toLowerCase().includes(searchLower)
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
      in_progress: requests.filter(r => r.status === 'in_progress').length,
      completed: requests.filter(r => r.status === 'completed').length,
    }
  }

  const statusCounts = getStatusCounts()

  return (
    <PlatformLayout
      title="My Service Requests"
      description="Track and manage your service requests"
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Requests</p>
                  <p className="text-2xl font-bold">{statusCounts.total}</p>
                </div>
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Clock className="h-4 w-4 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold">{statusCounts.pending}</p>
                </div>
                <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold">{statusCounts.in_progress}</p>
                </div>
                <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <RefreshCw className="h-4 w-4 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold">{statusCounts.completed}</p>
                </div>
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search requests..."
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
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredRequests.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No service requests found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || statusFilter !== "all" || priorityFilter !== "all"
                    ? "Try adjusting your search or filter criteria"
                    : "You haven't submitted any service requests yet"}
                </p>
                <Button onClick={() => window.location.href = '/services'}>
                  Request a Service
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredRequests.map((request) => (
              <Card key={request.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {request.title}
                        </h3>
                        {getStatusBadge(request.status)}
                        {getPriorityBadge(request.priority)}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <span className="font-medium">#{request.request_number}</span>
                        <span>•</span>
                        <span>{request.service.name}</span>
                        <span>•</span>
                        <span>Created {formatDate(request.created_at)}</span>
                      </div>

                      <p className="text-gray-700 mb-3 line-clamp-2">
                        {request.description}
                      </p>

                      {request.estimated_delivery_date && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span>Expected delivery: {formatDate(request.estimated_delivery_date)}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
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
    </PlatformLayout>
  )
}