"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Clock, Star, ArrowRight, Upload, X } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface ServiceRequestFormProps {
  service?: {
    name: string
    description: string
    sla: string
    popularity: number
    category: string
  }
  onSubmit: (data: any) => void
  onCancel: () => void
}

export function ServiceRequestForm({ service, onSubmit, onCancel }: ServiceRequestFormProps) {
  const [formData, setFormData] = useState({
    requestName: service ? `${service.name} Request` : "",
    priority: "Medium",
    urgency: "Normal",
    description: "",
    justification: "",
    expectedDelivery: undefined as Date | undefined,
    additionalRequirements: "",
    approverEmail: "",
    costCenter: "",
    department: "",
    attachments: [] as File[],
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.requestName.trim()) {
      newErrors.requestName = "Request name is required"
    }
    if (!formData.description.trim()) {
      newErrors.description = "Description is required"
    }
    if (!formData.justification.trim()) {
      newErrors.justification = "Business justification is required"
    }
    if (!formData.department) {
      newErrors.department = "Department is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSubmit({
        ...formData,
        service: service?.name,
        category: service?.category,
      })
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setFormData((prev) => ({
      ...prev,
      attachments: [...prev.attachments, ...files],
    }))
  }

  const removeAttachment = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {service && (
        <Card className="bg-muted/30">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{service.name}</CardTitle>
                <CardDescription>{service.category}</CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {service.sla}
                </Badge>
                <div className="flex items-center gap-1">
                  {Array.from({ length: service.popularity }).map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{service.description}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="request-name">
              Request Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="request-name"
              value={formData.requestName}
              onChange={(e) => setFormData({ ...formData, requestName: e.target.value })}
              placeholder="Give your request a descriptive name"
              className={errors.requestName ? "border-red-500" : ""}
            />
            {errors.requestName && <p className="text-sm text-red-500 mt-1">{errors.requestName}</p>}
          </div>

          <div>
            <Label htmlFor="department">
              Department <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.department}
              onValueChange={(value) => setFormData({ ...formData, department: value })}
            >
              <SelectTrigger className={errors.department ? "border-red-500" : ""}>
                <SelectValue placeholder="Select your department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="engineering">Engineering</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="hr">Human Resources</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="operations">Operations</SelectItem>
                <SelectItem value="legal">Legal</SelectItem>
                <SelectItem value="facilities">Facilities</SelectItem>
              </SelectContent>
            </Select>
            {errors.department && <p className="text-sm text-red-500 mt-1">{errors.department}</p>}
          </div>

          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Critical">Critical</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="urgency">Urgency</Label>
            <Select value={formData.urgency} onValueChange={(value) => setFormData({ ...formData, urgency: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Emergency">Emergency</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Normal">Normal</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label>Expected Delivery Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.expectedDelivery && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.expectedDelivery ? format(formData.expectedDelivery, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.expectedDelivery}
                  onSelect={(date) => setFormData({ ...formData, expectedDelivery: date })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label htmlFor="cost-center">Cost Center</Label>
            <Input
              id="cost-center"
              value={formData.costCenter}
              onChange={(e) => setFormData({ ...formData, costCenter: e.target.value })}
              placeholder="e.g., CC-2024-001"
            />
          </div>

          <div>
            <Label htmlFor="approver-email">Approver Email</Label>
            <Input
              id="approver-email"
              type="email"
              value={formData.approverEmail}
              onChange={(e) => setFormData({ ...formData, approverEmail: e.target.value })}
              placeholder="manager@company.com"
            />
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="description">
          Detailed Description <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Provide a detailed description of what you need..."
          className={cn("min-h-[100px]", errors.description ? "border-red-500" : "")}
        />
        {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description}</p>}
      </div>

      <div>
        <Label htmlFor="justification">
          Business Justification <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="justification"
          value={formData.justification}
          onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
          placeholder="Explain the business need and impact..."
          className={cn("min-h-[100px]", errors.justification ? "border-red-500" : "")}
        />
        {errors.justification && <p className="text-sm text-red-500 mt-1">{errors.justification}</p>}
      </div>

      <div>
        <Label htmlFor="additional-requirements">Additional Requirements</Label>
        <Textarea
          id="additional-requirements"
          value={formData.additionalRequirements}
          onChange={(e) => setFormData({ ...formData, additionalRequirements: e.target.value })}
          placeholder="Any special requirements, constraints, or preferences..."
          className="min-h-[80px]"
        />
      </div>

      <div>
        <Label>Attachments</Label>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Input type="file" multiple onChange={handleFileUpload} className="hidden" id="file-upload" />
            <Button type="button" variant="outline" onClick={() => document.getElementById("file-upload")?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Files
            </Button>
            <span className="text-sm text-muted-foreground">Max 10MB per file. Supported: PDF, DOC, XLS, PNG, JPG</span>
          </div>
          {formData.attachments.length > 0 && (
            <div className="space-y-2">
              {formData.attachments.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm">{file.name}</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeAttachment(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Submit Request
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </form>
  )
}
