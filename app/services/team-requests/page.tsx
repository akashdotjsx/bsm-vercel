"use client"

import { useState, useEffect } from "react"
import { PlatformLayout } from "@/components/layout/platform-layout"
import { ServiceRequestDetails } from "@/components/services/service-request-details"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, Search, Eye, MoreHorizontal } from "lucide-react"
import { toast } from "sonner"

interface ServiceRequest {
  id: string
  request_number: string
  title: string
  description: string
  business_justification?: string
  status: string
  priority: string
  urgency?: string
  created_at: string
  estimated_delivery_date?: string
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
    estimated_delivery_days?: number
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

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-blue-100 text-blue-800",
  in_progress: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-800",
}

export default function TeamRequestsPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/service-requests?scope=team')
      if (response.ok) {
        const data = await response.json()
        setRequests(data.serviceRequests || [])
      } else {
        toast.error('Failed to load team requests')
      }
    } catch (e) {
      console.error(e)
      toast.error('Failed to load team requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  const handleViewDetails = (request: ServiceRequest) => {
    console.log('Team requests - View Details clicked:', request.id, request.title)
    setSelectedRequest(request)
    setShowDetails(true)
  }

  const handleRequestUpdate = () => {
    fetchRequests()
  }

  const filtered = requests.filter(r => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false
    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      return (
        r.title.toLowerCase().includes(q) ||
        r.request_number.toLowerCase().includes(q) ||
        r.requester.email.toLowerCase().includes(q) ||
        r.service.name.toLowerCase().includes(q)
      )
    }
    return true
  })

  const fmt = (d: string) => new Date(d).toLocaleDateString()

  return (
    <PlatformLayout title="Team Service Requests" description="View requests from your team and direct reports">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by title, requester, number" className="pl-10" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="animate-pulse"><CardContent className="p-6"><div className="h-4 bg-gray-200 rounded w-3/4" /></CardContent></Card>
            ))
          ) : filtered.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-gray-600">No team requests found</CardContent></Card>
          ) : (
            filtered.map((r) => (
              <Card key={r.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{r.title}</span>
                        <Badge className={`${statusColors[r.status] || statusColors.pending}`}>{r.status.replace('_',' ')}</Badge>
                        <Badge variant="outline">{r.priority}</Badge>
                      </div>
                      <div className="text-sm text-gray-600 flex items-center gap-2">
                        <span>#{r.request_number}</span>
                        <span>•</span>
                        <span>{r.service.name}</span>
                        <span>•</span>
                        <span>By {r.requester.first_name || ''} {r.requester.last_name || ''} ({r.requester.email})</span>
                        <span>•</span>
                        <span>{fmt(r.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewDetails(r)}
                      >
                        <Eye className="h-4 w-4 mr-2" />View
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
    </PlatformLayout>
  )
}
