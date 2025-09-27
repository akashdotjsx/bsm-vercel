"use client"

import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { employeeServices, customerServices, ServiceCategory, Service } from "@/lib/types/services"
import { useMode } from "@/lib/contexts/mode-context"

export function ServiceSelectorDemo() {
  const { mode } = useMode()
  const [serviceCategory, setServiceCategory] = useState("")
  const [service, setService] = useState("")
  
  const serviceCategories = mode === "employee" ? employeeServices : customerServices
  const selectedCategory = serviceCategories.find(cat => cat.id === serviceCategory)
  const availableServices = selectedCategory?.services || []
  const selectedService = availableServices.find(s => s.name === service)

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Service Selection Demo</CardTitle>
        <p className="text-sm text-muted-foreground">
          This demonstrates the service catalog integration in the create ticket form
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="serviceCategory">Service Category</Label>
            <Select value={serviceCategory} onValueChange={(value) => {
              setServiceCategory(value)
              setService("") // Reset service when category changes
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select service category" />
              </SelectTrigger>
              <SelectContent>
                {serviceCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="service">Service</Label>
            <Select 
              value={service} 
              onValueChange={setService}
              disabled={!serviceCategory}
            >
              <SelectTrigger>
                <SelectValue placeholder={serviceCategory ? "Select service" : "Select category first"} />
              </SelectTrigger>
              <SelectContent>
                {availableServices.map((serviceItem, index) => (
                  <SelectItem key={index} value={serviceItem.name}>
                    <div className="flex flex-col">
                      <span>{serviceItem.name}</span>
                      <span className="text-xs text-muted-foreground">{serviceItem.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedService && (
          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <h4 className="font-medium mb-2">Selected Service Details:</h4>
              <div className="space-y-1 text-sm">
                <p><strong>Name:</strong> {selectedService.name}</p>
                <p><strong>Description:</strong> {selectedService.description}</p>
                <p><strong>SLA:</strong> {selectedService.sla}</p>
                <p><strong>Popularity:</strong> {selectedService.popularity}/5</p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="text-xs text-muted-foreground">
          <p><strong>Current Mode:</strong> {mode}</p>
          <p><strong>Available Categories:</strong> {serviceCategories.length}</p>
          <p><strong>Available Services:</strong> {availableServices.length}</p>
        </div>
      </CardContent>
    </Card>
  )
}
