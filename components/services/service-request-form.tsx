"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CalendarIcon, X, Star } from "lucide-react"
import { useAuth } from "@/lib/contexts/auth-context"

interface Service {
  id: string
  name: string
  description: string
  category_name: string
  estimated_delivery_days: number
  requires_approval: boolean
  status: string
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

interface ServiceRequestFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  service: Service | null
  onSubmit: (data: ServiceRequestFormData) => void
}

const departments = [
  "IT",
  "Human Resources", 
  "Finance",
  "Marketing",
  "Operations",
  "Sales",
  "Legal",
  "Facilities"
]

const priorities = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" }
]

const urgencyLevels = [
  { value: "low", label: "Normal" },
  { value: "medium", label: "Moderate" },
  { value: "high", label: "Urgent" }
]

export function ServiceRequestForm({ open, onOpenChange, service, onSubmit }: ServiceRequestFormProps) {
  const { profile } = useAuth()
  const [formData, setFormData] = useState<ServiceRequestFormData>({
    requestName: "",
    department: "",
    priority: "medium",
    urgency: "low",
    expectedDeliveryDate: "",
    costCenter: "",
    approverEmail: "",
    description: "",
    businessJustification: "",
    additionalRequirements: ""
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    // Reset form
    setFormData({
      requestName: "",
      department: "",
      priority: "medium",
      urgency: "low",
      expectedDeliveryDate: "",
      costCenter: "",
      approverEmail: "",
      description: "",
      businessJustification: "",
      additionalRequirements: ""
    })
  }

  const handleInputChange = (field: keyof ServiceRequestFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (!service) return null

  const getSLAText = () => {
    if (service.estimated_delivery_days) {
      if (service.estimated_delivery_days === 1) {
        return "1 day"
      }
      return `${service.estimated_delivery_days} days`
    }
    return "TBD"
  }

  const getPopularityStars = () => {
    // Mock popularity based on service name for demo
    return 4 // Default to 4 stars
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded">
                <div className="w-6 h-6 bg-blue-600 rounded" />
              </div>
              <div>
                <DialogTitle className="text-[11px] font-semibold">
                  Request Service: {service.name}
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  {service.category_name} • SLA: {getSLAText()}
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-1 text-sm text-muted-foreground mb-6">
          {service.description}
        </div>

        {/* Service Information */}
        <div className="bg-muted/50 p-4 rounded-lg mb-6">
          <h3 className="font-medium text-sm mb-3">Service Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Category:</span>
              <span className="ml-2 font-medium">{service.category_name}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Expected SLA:</span>
              <span className="ml-2 font-medium">{getSLAText()}</span>
            </div>
            <div className="col-span-1">
              <span className="text-muted-foreground">Popularity:</span>
              <div className="inline-flex items-center ml-2">
                {Array.from({ length: getPopularityStars() }).map((_, i) => (
                  <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Request Details */}
          <div>
            <h3 className="font-medium text-sm mb-4">Request Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="requestName" className="text-sm">
                  Request Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="requestName"
                  placeholder="Give your request a descriptive name"
                  value={formData.requestName}
                  onChange={(e) => handleInputChange("requestName", e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="department" className="text-sm">Department</Label>
                <Select
                  value={formData.department}
                  onValueChange={(value) => handleInputChange("department", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept.toLowerCase().replace(" ", "_")}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priority" className="text-sm">
                Priority <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => handleInputChange("priority", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="urgency" className="text-sm">Urgency</Label>
              <Select
                value={formData.urgency}
                onValueChange={(value) => handleInputChange("urgency", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {urgencyLevels.map((urgency) => (
                    <SelectItem key={urgency.value} value={urgency.value}>
                      {urgency.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="expectedDeliveryDate" className="text-sm">Expected Delivery Date</Label>
              <Input
                id="expectedDeliveryDate"
                type="date"
                value={formData.expectedDeliveryDate}
                onChange={(e) => handleInputChange("expectedDeliveryDate", e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="costCenter" className="text-sm">Cost Center</Label>
              <Input
                id="costCenter"
                placeholder="e.g., CC-2024-001"
                value={formData.costCenter}
                onChange={(e) => handleInputChange("costCenter", e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {service.requires_approval && (
            <div>
              <Label htmlFor="approverEmail" className="text-sm">Approver Email</Label>
              <Input
                id="approverEmail"
                type="email"
                placeholder="manager@company.com"
                value={formData.approverEmail}
                onChange={(e) => handleInputChange("approverEmail", e.target.value)}
                className="mt-1"
              />
            </div>
          )}

          <div>
            <Label htmlFor="description" className="text-sm">
              Detailed Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Provide a detailed description of what you need..."
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              required
              className="mt-1 min-h-[80px]"
            />
          </div>

          {service.requires_approval && (
            <div>
              <Label htmlFor="businessJustification" className="text-sm">
                Business Justification <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="businessJustification"
                placeholder="Explain the business need and impact..."
                value={formData.businessJustification}
                onChange={(e) => handleInputChange("businessJustification", e.target.value)}
                required
                className="mt-1 min-h-[60px]"
              />
            </div>
          )}

          <div>
            <Label htmlFor="additionalRequirements" className="text-sm">Additional Requirements</Label>
            <Textarea
              id="additionalRequirements"
              placeholder="Any special requirements, constraints, or preferences..."
              value={formData.additionalRequirements}
              onChange={(e) => handleInputChange("additionalRequirements", e.target.value)}
              className="mt-1 min-h-[60px]"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Submit Request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}