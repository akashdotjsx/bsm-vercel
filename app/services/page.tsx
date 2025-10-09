"use client"

import { useState, useEffect } from "react"
import { PlatformLayout } from "@/components/layout/platform-layout"
import { ServiceRequestForm } from "@/components/services/service-request-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Clock, Star, Search, ShoppingCart, CheckCircle, AlertCircle, Package } from "lucide-react"
import { useAuth } from "@/lib/contexts/auth-context"
import { toast } from "sonner"
import { useServicesGQL, useServiceCategoriesGQL } from "@/hooks/use-services-assets-gql"

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
    if (!selectedService) return

    try {
      setSubmitting(true)
      
      const response = await fetch('/api/service-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          serviceId: selectedService.id,
          ...formData
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`Service request submitted successfully! Request #${data.requestNumber}`)
        setShowRequestForm(false)
        setSelectedService(null)
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to submit service request')
      }
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
    return Math.min(5, Math.max(1, Math.round(score / 20)))
  }

  return (
    <PlatformLayout
      title="Services"
      description="Request services and track your submissions"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Services</h1>
            <p className="text-gray-600 mt-1">Browse and request available services</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-[200px]">
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
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Services</p>
                  <p className="text-2xl font-bold text-gray-900">{services.length}</p>
                </div>
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Categories</p>
                  <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Approval Required</p>
                  <p className="text-2xl font-bold text-gray-900">{services.filter(s => s.requires_approval).length}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Requests</p>
                  <p className="text-2xl font-bold text-gray-900">{services.reduce((acc, s) => acc + (s.total_requests || 0), 0)}</p>
                </div>
                <ShoppingCart className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            // Loading skeleton
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredServices.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No services found</h3>
              <p className="mt-1 text-sm text-gray-500">
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
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                      <CardDescription className="mt-1 line-clamp-2">
                        {service.description}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {service.category_name}
                    </Badge>
                    {service.requires_approval && (
                      <Badge variant="outline" className="text-xs">
                        Approval Required
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>SLA: {getSLAText(service.estimated_delivery_days)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: getPopularityStars(service.popularity_score) }).map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        ))}
                        <span className="ml-1">({service.total_requests || 0} requests)</span>
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
    </PlatformLayout>
  )
}
