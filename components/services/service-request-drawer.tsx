"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Label } from "@/components/ui/label"
import { DateTimePicker } from "@/components/ui/date-time-picker"
import { format } from "date-fns"
import { toast } from "sonner"
import { 
  X, 
  Save, 
  Star,
  Clock,
  ShoppingCart,
  Package
} from "lucide-react"
import { useAuth } from "@/lib/contexts/auth-context"
import { createServiceRequestGQL } from "@/hooks/use-services-assets-gql"

interface ServiceRequestDrawerProps {
  isOpen: boolean
  onClose: () => void
  service?: any // Service to request
}

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

export default function ServiceRequestDrawer({ isOpen, onClose, service }: ServiceRequestDrawerProps) {
  const { user, organization } = useAuth()
  
  // Prevent background scroll when drawer is open
  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isOpen])

  const [saving, setSaving] = useState(false)
  
  // Local form state
  const [form, setForm] = useState({
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


  const handleSave = async () => {
    if (!service || !user) return

    setSaving(true)
    try {
      // Validate required fields
      if (!form.requestName.trim()) {
        toast.error("Request name is required")
        setSaving(false)
        return
      }
      
      if (!form.description.trim()) {
        toast.error("Description is required")
        setSaving(false)
        return
      }

      if (service.requires_approval && !form.businessJustification.trim()) {
        toast.error("Business justification is required for this service")
        setSaving(false)
        return
      }

      // Prepare request data
      const requestData = {
        service_id: service.id,
        requester_id: user.id,
        title: form.requestName,
        description: form.description,
        business_justification: form.businessJustification,
        priority: form.priority,
        urgency: form.urgency,
        estimated_delivery_date: form.expectedDeliveryDate || undefined,
        cost_center: form.costCenter || undefined,
        status: service.requires_approval ? 'pending_approval' : 'approved',
        approval_status: service.requires_approval ? 'pending' : 'approved',
        form_data: {
          department: form.department,
          approverEmail: form.approverEmail,
          additionalRequirements: form.additionalRequirements,
        },
        organization_id: organization?.id
      }

      console.log("[REQUEST] Creating service request:", requestData)
      
      const result = await createServiceRequestGQL(requestData)
      console.log("[REQUEST] Service request created:", result)
      
      toast.success("Service request submitted successfully!", {
        description: `Request #${result.request_number || result.id} has been created.`
      })
      
      // Close drawer after creation
      onClose()
    } catch (error) {
      console.error("Error creating service request:", error)
      toast.error("Failed to submit service request")
    } finally {
      setSaving(false)
    }
  }

  const getSLAText = () => {
    if (service?.estimated_delivery_days) {
      if (service.estimated_delivery_days === 1) return "1 day"
      return `${service.estimated_delivery_days} days`
    }
    return "TBD"
  }

  const getPopularityStars = () => {
    if (!service?.popularity_score) return 4
    return Math.min(5, Math.max(1, Math.round(service.popularity_score / 20)))
  }

  if (!isOpen) return null

  return (
    <>
      {/* Drawer overlay - starts below navbar */}
      <div className="fixed inset-0 z-50 flex" style={{ top: 'var(--header-height, 56px)' }}>
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
        
        {/* Drawer panel */}
        <div 
          className="ml-auto w-[90vw] sm:w-[70vw] md:w-[60vw] lg:w-[50vw] xl:w-[40vw] min-w-[320px] max-w-[900px] bg-background shadow-2xl flex flex-col relative z-10 overflow-hidden border-l"
          style={{ height: 'calc(100vh - var(--header-height, 56px))' }}
        >
          {/* Header */}
          <div className="p-4 md:p-6 bg-background flex items-center justify-between flex-shrink-0 border-b">
            <div className="flex-1 min-w-0 mr-4">
              <h2 className="text-sm md:text-[13px] font-semibold text-foreground mb-1 truncate">
                Request Service: {service?.name || "Loading..."}
              </h2>
              {service && (
                <p className="text-[10px] md:text-[11px] text-muted-foreground">
                  {service.category_name} • SLA: {getSLAText()}
                </p>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 shrink-0" 
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Service Information */}
          {service && (
            <div className="px-4 md:px-6 py-4 bg-muted/30 border-b">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[13px] font-medium text-foreground mb-1">{service.name}</h3>
                  <p className="text-[11px] text-muted-foreground mb-2">{service.description}</p>
                  <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>SLA: {getSLAText()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: getPopularityStars() }).map((_, i) => (
                        <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    {service.requires_approval && (
                      <Badge variant="outline" className="text-[10px] h-4">
                        Approval Required
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
            {/* Request Details */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  Request Name <span className="text-red-500">*</span>
                </label>
                <Input 
                  value={form.requestName} 
                  onChange={(e) => setForm({ ...form, requestName: e.target.value })} 
                  className="text-[11px] h-8"
                  placeholder="Give your request a descriptive name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Department</label>
                  <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v })}>
                    <SelectTrigger className="h-8">
                      <SelectValue className="text-[11px]" placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept.toLowerCase().replace(" ", "_")} className="text-[11px]">
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    Priority <span className="text-red-500">*</span>
                  </label>
                  <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                    <SelectTrigger className="h-8">
                      <SelectValue className="text-[11px]" />
                    </SelectTrigger>
                    <SelectContent>
                      {priorities.map((priority) => (
                        <SelectItem key={priority.value} value={priority.value} className="text-[11px]">
                          {priority.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Urgency</label>
                  <Select value={form.urgency} onValueChange={(v) => setForm({ ...form, urgency: v })}>
                    <SelectTrigger className="h-8">
                      <SelectValue className="text-[11px]" />
                    </SelectTrigger>
                    <SelectContent>
                      {urgencyLevels.map((urgency) => (
                        <SelectItem key={urgency.value} value={urgency.value} className="text-[11px]">
                          {urgency.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Expected Delivery Date</label>
                  <DateTimePicker
                    value={form.expectedDeliveryDate ? new Date(form.expectedDeliveryDate) : undefined}
                    onChange={(d) => setForm({ ...form, expectedDeliveryDate: d ? d.toISOString() : "" })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Cost Center</label>
                  <Input 
                    value={form.costCenter} 
                    onChange={(e) => setForm({ ...form, costCenter: e.target.value })} 
                    className="text-[11px] h-8"
                    placeholder="e.g., CC-2024-001"
                  />
                </div>
                {service?.requires_approval && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Approver Email</label>
                    <Input 
                      type="email"
                      value={form.approverEmail} 
                      onChange={(e) => setForm({ ...form, approverEmail: e.target.value })} 
                      className="text-[11px] h-8"
                      placeholder="manager@company.com"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  Detailed Description <span className="text-red-500">*</span>
                </label>
                <Textarea 
                  rows={4} 
                  value={form.description} 
                  onChange={(e) => setForm({ ...form, description: e.target.value })} 
                  className="text-[11px] resize-none"
                  placeholder="Provide a detailed description of what you need..."
                />
              </div>

              {service?.requires_approval && (
                <div className="space-y-2">
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    Business Justification <span className="text-red-500">*</span>
                  </label>
                  <Textarea 
                    rows={3} 
                    value={form.businessJustification} 
                    onChange={(e) => setForm({ ...form, businessJustification: e.target.value })} 
                    className="text-[11px] resize-none"
                    placeholder="Explain the business need and impact..."
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Additional Requirements</label>
                <Textarea 
                  rows={3} 
                  value={form.additionalRequirements} 
                  onChange={(e) => setForm({ ...form, additionalRequirements: e.target.value })} 
                  className="text-[11px] resize-none"
                  placeholder="Any special requirements, constraints, or preferences..."
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t p-3 md:p-4 flex justify-end gap-2 flex-shrink-0 bg-background">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="text-[11px] h-8 px-3"
              disabled={saving}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saving || !service} 
              className="text-[11px] h-8 px-3 bg-[#6E72FF] hover:bg-[#6E72FF]/90"
            >
              {saving ? (
                <>
                  <LoadingSpinner className="h-3 w-3 mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <ShoppingCart className="h-3 w-3 mr-2" />
                  Submit Request
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}