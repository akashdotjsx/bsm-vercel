"use client"

import { useState, useEffect } from "react"
import { PageContent } from "@/components/layout/page-content"
import { ServiceRequestForm } from "@/components/services/service-request-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Clock, Star, Search, ShoppingCart, CheckCircle, AlertCircle, Package } from "lucide-react"
import { useAuth } from "@/lib/contexts/auth-context"
import { toast } from "sonner"
import { useServicesGQL, useServiceCategoriesGQL, createServiceRequestGQL } from "@/hooks/use-services-assets-gql"
import { Skeleton } from "@/components/ui/skeleton"
import { useStore } from "@/lib/store"

interface Service {
  id: string
  name: string
  description: string
  category_name: string
  category_icon: string
  category_color: string
  estimated_delivery_days: number
  requires_approval: boolean
  status: string
  popularity_score: number
  total_requests: number
}

interface ServiceRequestFormData {
  requestName: string
  department: string
  priority: string
  urgency: string
  expectedDeliveryDate: string
  costCenter: string
  approverEmail: string
  description: string
  businessJustification: string
  additionalRequirements: string
}

export default function ServicesPage() {
  const { canView } = useAuth()
  const { user } = useStore()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Fetch services and categories with GraphQL
  const { services, loading: servicesLoading, error: servicesError } = useServicesGQL({
    is_requestable: true,
    status: 'active',
    search: searchTerm || undefined
  })
  
  const { categories, loading: categoriesLoading, error: categoriesError } = useServiceCategoriesGQL({ is_active: true })
  
  const loading = servicesLoading || categoriesLoading
  
  useEffect(() => {
    if (servicesError) {
      console.error('Error fetching services:', servicesError)
      toast.error('Failed to load services')
    }
    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError)
      toast.error('Failed to load categories')
    }
  }, [servicesError, categoriesError])

  const handleServiceRequest = (service: Service) => {
    setSelectedService(service)
    setShowRequestForm(true)
  }

  const handleSubmitRequest = async (formData: ServiceRequestFormData) => {
    if (!selectedService || !user) return

    try {
      setSubmitting(true)
      
      // Use GraphQL mutation instead of REST API
      const requestData = {
        service_id: selectedService.id,
        requester_id: user.id,
        title: formData.requestName,
        description: formData.description,
        business_justification: formData.businessJustification,
        priority: formData.priority,
        urgency: formData.urgency,
        estimated_delivery_date: formData.expectedDeliveryDate || undefined,
        cost_center: formData.costCenter || undefined,
        status: selectedService.requires_approval ? 'pending_approval' : 'approved',
        approval_status: selectedService.requires_approval ? 'pending' : 'approved',
        form_data: {
          department: formData.department,
          approverEmail: formData.approverEmail,
          additionalRequirements: formData.additionalRequirements,
        },
      }

      const result = await createServiceRequestGQL(requestData)
      toast.success(`Service request submitted successfully! Request #${result.request_number || result.id}`)
      setShowRequestForm(false)
      setSelectedService(null)
    } catch (error) {
      console.error('Error submitting request:', error)
      toast.error('Failed to submit service request')
    } finally {
      setSubmitting(false)
    }
  }

  // Filter services based on search and category
  const filteredServices = services.filter(service => {
    if (selectedCategory !== "all" && service.category_name !== categories.find(c => c.id === selectedCategory)?.name) {
      return false
    }
    if (searchTerm) {
      return (
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.category_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    return true
  })

  const getSLAText = (days: number) => {
    if (days === 1) return "1 day"
    return `${days} days`
  }

  const getPopularityStars = (score: number) => {
    return Math.min(5, Math.max(1, Math.round(score / 2bg-card)))
  }

  return (
    <PageContent
      title="Services"
      description="Request services and track your submissions"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-[13px] font-bold text-gray-9bg-cardbg-card">Services</h1>
            <p className="text-[1bg-cardpx] text-gray-6bg-cardbg-card mt-1">Browse and request available services</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-4bg-cardbg-card h-4 w-4" />
            <Input
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-1bg-card text-[11px]"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-[2bg-cardbg-cardpx] text-[11px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={`stat-skel-${i}`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-5 w-12" />
                    </div>
                    <Skeleton className="h-8 w-8 rounded" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[1bg-cardpx] text-gray-6bg-cardbg-card">Total Services</p>
                      <p className="text-[13px] font-bold text-gray-9bg-cardbg-card">{services.length}</p>
                    </div>
                    <Package className="h-8 w-8 text-blue-6bg-cardbg-card" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[1bg-cardpx] text-gray-6bg-cardbg-card">Categories</p>
                      <p className="text-[13px] font-bold text-gray-9bg-cardbg-card">{categories.length}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-6bg-cardbg-card" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[1bg-cardpx] text-gray-6bg-cardbg-card">Approval Required</p>
                      <p className="text-[13px] font-bold text-gray-9bg-cardbg-card">{services.filter(s => s.requires_approval).length}</p>
                    </div>
                    <AlertCircle className="h-8 w-8 text-orange-6bg-cardbg-card" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[1bg-cardpx] text-gray-6bg-cardbg-card">Total Requests</p>
                      <p className="text-[13px] font-bold text-gray-9bg-cardbg-card">{services.reduce((acc, s) => acc + (s.total_requests || bg-card), bg-card)}</p>
                    </div>
                    <ShoppingCart className="h-8 w-8 text-purple-6bg-cardbg-card" />
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            // Loading skeleton
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={`service-skel-${i}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Skeleton className="h-5 w-2bg-card rounded-full" />
                    <Skeleton className="h-5 w-24 rounded-full" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                    <Skeleton className="h-9 w-full rounded" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredServices.length === bg-card ? (
            <div className="col-span-full text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-4bg-cardbg-card" />
              <h3 className="mt-2 text-[11px] font-semibold text-gray-9bg-cardbg-card">No services found</h3>
              <p className="mt-1 text-[1bg-cardpx] text-gray-5bg-cardbg-card">
                {searchTerm || selectedCategory !== "all" 
                  ? "Try adjusting your search or filter criteria" 
                  : "No services are available for request at this time"}
              </p>
            </div>
          ) : (
            filteredServices.map((service) => (
              <Card key={service.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-[11px]">{service.name}</CardTitle>
                      <CardDescription className="mt-1 line-clamp-2 text-[1bg-cardpx]">
                        {service.description}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[1bg-cardpx]">
                      {service.category_name}
                    </Badge>
                    {service.requires_approval && (
                      <Badge variant="outline" className="text-[1bg-cardpx]">
                        Approval Required
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-[1bg-cardpx] text-gray-6bg-cardbg-card">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>SLA: {getSLAText(service.estimated_delivery_days)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: getPopularityStars(service.popularity_score) }).map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-yellow-4bg-cardbg-card text-yellow-4bg-cardbg-card" />
                        ))}
                        <span className="ml-1">({service.total_requests || bg-card} requests)</span>
                      </div>
                    </div>
                    <Button 
                      onClick={() => handleServiceRequest(service)}
                      className="w-full"
                      disabled={submitting}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Request Service
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Service Request Form */}
        <ServiceRequestForm
          open={showRequestForm}
          onOpenChange={setShowRequestForm}
          service={selectedService}
          onSubmit={handleSubmitRequest}
        />
      </div>
    </PageContent>
  )
}
