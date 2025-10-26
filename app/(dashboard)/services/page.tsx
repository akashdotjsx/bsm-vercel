"use client"

import { useState, useEffect } from "react"
import { PageContent } from "@/components/layout/page-content"
import dynamic from "next/dynamic"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Laptop,
  Shield,
  Users,
  DollarSign,
  Scale,
  Building,
  Search,
  Clock,
  Star,
  ArrowRight,
  FileText,
  Settings,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  BarChart3,
  Building2,
  Ticket,
  Workflow,
  Monitor,
  BookOpen,
  TrendingUp,
  Bell,
  Zap,
  CheckCircle,
  Calendar,
  Layers,
  ShoppingCart,
  AlertCircle,
  Package,
} from "lucide-react"
import { categoryIconMap, getBgColorClass, getStarRating, formatSLA } from "@/lib/utils/icon-map"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/contexts/auth-context"
import { useStore } from "@/lib/store"
import { useServicesMCP } from "@/hooks/use-services-mcp"

const ServiceRequestDrawer = dynamic(
  () => import("@/components/services/service-request-drawer"),
  {
    loading: () => <Skeleton className="h-8 w-24" />,
    ssr: false,
  },
)

interface ServiceCategory {
  id: string
  name: string
  description: string
  icon: string
  color: string
  services: Service[]
}

interface Service {
  id: string
  name: string
  description: string
  estimated_delivery_days: number
  requires_approval: boolean
  status: string
  popularity_score: number
  total_requests: number
  category_name: string
  category_icon: string
  category_color: string
}

export default function ServicesPage() {
  const { toast } = useToast()
  const { organization, loading: authLoading } = useAuth()
  const { user } = useStore()
  
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("popularity")
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [showRequestDrawer, setShowRequestDrawer] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Debug: Log when component mounts and track URL changes
  useEffect(() => {
    console.log('✅ ServicesPage mounted')
    console.log('📍 URL:', window.location.pathname)
    console.log('📍 Title:', document.title)
    console.log('📦 Organization:', organization?.id)
    
    // Force correct page title
    document.title = 'Services | Kroolo BSM'
    
    // Check if we're really on the services page
    if (!window.location.pathname.startsWith('/services')) {
      console.error('🚨 WRONG PAGE! Expected /services but got:', window.location.pathname)
    }
    
    return () => {
      console.log('❌ ServicesPage unmounted')
    }
  }, [])
  
  // Watch for unexpected URL changes
  useEffect(() => {
    const checkURL = setInterval(() => {
      if (!window.location.pathname.startsWith('/services')) {
        console.error('🚨 URL CHANGED UNEXPECTEDLY to:', window.location.pathname)
      }
    }, 1000)
    
    return () => clearInterval(checkURL)
  }, [])

  // Use the MCP hook for data fetching
  const { categories, loading, error, refetch } = useServicesMCP()

  const handleServiceRequest = (service: Service) => {
    setSelectedService(service)
    setShowRequestDrawer(true)
  }

  const filteredServices = categories
    .filter((category) => {
      if (selectedCategory !== "all" && category.id !== selectedCategory) return false
      if (searchTerm) {
        return (
          category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          category.services.some(
            (service) =>
              service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              service.description.toLowerCase().includes(searchTerm.toLowerCase()),
          )
        )
      }
      return true
    })
    .map((category) => ({
      ...category,
      services: category.services.sort((a, b) => {
        switch (sortBy) {
          case "popularity":
            return b.popularity_score - a.popularity_score
          case "name":
            return a.name.localeCompare(b.name)
          case "newest":
            return b.total_requests - a.total_requests
          case "oldest":
            return a.total_requests - b.total_requests
          default:
            return 0
        }
      })
    }))
    .sort((a, b) => {
      switch (sortBy) {
        case "popularity":
          return b.services.reduce((sum, s) => sum + s.popularity_score, 0) - a.services.reduce((sum, s) => sum + s.popularity_score, 0)
        case "name":
          return a.name.localeCompare(b.name)
        case "newest":
          return b.services.reduce((sum, s) => sum + s.total_requests, 0) - a.services.reduce((sum, s) => sum + s.total_requests, 0)
        case "oldest":
          return a.services.reduce((sum, s) => sum + s.total_requests, 0) - b.services.reduce((sum, s) => sum + s.total_requests, 0)
        default:
          return 0
      }
    })

  // Show loading state only on initial load
  if (loading && categories.length === 0) {
    return (
      <PageContent
        title="Services"
        description="Request services and track your submissions"
        titleClassName="text-[13px] font-semibold text-[#595959]"
        descriptionClassName="text-[12px] font-normal text-[#6A707C]"
      >
        <div className="space-y-6">
          <Skeleton className="h-[38px] w-full rounded-[40px]" />
        </div>
      </PageContent>
    )
  }

  return (
    <PageContent
      title="Services"
      description="Request services and track your submissions"
      titleClassName="text-[13px] font-semibold text-[#595959]"
      descriptionClassName="text-[12px] font-normal text-[#6A707C]"
    >
      <div className="space-y-6">
        {/* Search Bar and Filter Dropdowns */}
        <div className="flex items-center gap-3 h-[38px]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search services"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-background border-border rounded-[8px] h-[38px] text-[12px] text-muted-foreground font-inter py-0 min-h-[38px]"
            />
          </div>
          
          {/* All Categories Dropdown */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="h-[38px] w-[140px] bg-background border border-border rounded-[8px] text-muted-foreground text-[12px] font-medium font-inter py-0 min-h-[38px]">
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
          
          {/* Popularity Dropdown */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-[38px] w-[120px] bg-background border border-border rounded-[8px] text-muted-foreground text-[12px] font-medium font-inter py-0 min-h-[38px]">
              <SelectValue placeholder="Popularity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popularity">Popularity</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
            </SelectContent>
          </Select>
        </div>


        {/* Service Categories */}
        <div className="space-y-6">
          {filteredServices.length === 0 ? (
            <div className="text-center py-12">
            <div className="text-[11px] text-muted-foreground mb-4">
              {searchTerm ? `No categories found matching "${searchTerm}"` : 'No service categories found.'}
            </div>
            </div>
          ) : (
            filteredServices.map((category) => {
              const Icon = category.icon
              return (
              <Card key={category.id} className="overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-lg ${category.color} text-white flex items-center justify-center`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-[13px] font-semibold text-foreground">{category.name}</h3>
                          <span className="bg-green-100 text-green-700 text-[10px] font-medium px-2 py-0.5 rounded-full">Active</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">{category.description} • Owner: System</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                  <CardContent className="p-6">
                    {category.services.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {category.services.map((service, index) => (
                          <div key={index} className="p-4 border border-border rounded-lg hover:shadow-md hover:border-border transition-all cursor-pointer" onClick={() => handleServiceRequest(service)}>
                            <div className="space-y-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-1.5">
                                    <h4 className="font-semibold text-[13px] text-foreground">{service.name}</h4>
                                    <div className="flex items-center gap-0.5">
                                      {Array.from({ length: Math.min(5, Math.max(1, service.popularity_score)) }).map((_, i) => (
                                        <span key={i} className="text-yellow-400 text-sm">
                                          ★
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                  <p className="text-[11px] text-muted-foreground leading-relaxed">{service.description}</p>
                                  {service.requires_approval && (
                                    <Badge variant="outline" className="text-[10px] mt-1">
                                      Approval Required
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center justify-between pt-2 border-t border-border">
                                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                  <Clock className="h-3.5 w-3.5" />
                                  <span>{formatSLA(service.estimated_delivery_days)}</span>
                                </div>
                                <Button 
                                  className="text-[12px] h-8 bg-background border border-border text-muted-foreground rounded-[5px] font-medium hover:bg-accent"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleServiceRequest(service)
                                  }}
                                  disabled={submitting}
                                >
                                  Request
                                  <ArrowRight className="h-3 w-3 ml-1" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-[11px] text-muted-foreground">
                        No services in this category yet.
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>

        {/* Service Request Drawer */}
        <ServiceRequestDrawer
          isOpen={showRequestDrawer}
          onClose={() => {
            setShowRequestDrawer(false)
            setSelectedService(null)
          }}
          service={selectedService}
        />
      </div>
    </PageContent>
  )
}
