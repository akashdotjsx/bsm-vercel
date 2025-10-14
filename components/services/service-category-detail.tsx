"use client"

import { useMode } from "@/lib/contexts/mode-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Clock, Star, ArrowRight } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

// This would typically come from a database or API
const serviceCategories = {
  employee: {
    it: {
      name: "IT Services",
      description: "Technology support and equipment requests for all employees",
      services: [
        {
          id: "laptop-request",
          name: "Laptop Request",
          description: "Request new laptop or replacement device with pre-configured software and security settings",
          sla: "3-5 business days",
          popularity: 5,
          requirements: ["Manager approval for new equipment", "Asset tag assignment", "Security compliance check"],
          process: "Submit request → Manager approval → IT procurement → Device configuration → Delivery",
        },
        {
          id: "software-installation",
          name: "Software Installation",
          description: "Install approved software applications on your work device",
          sla: "1-2 business days",
          popularity: 4,
          requirements: ["Software must be on approved list", "License availability", "Security scan completion"],
          process: "Submit request → License check → Security approval → Installation → User notification",
        },
        {
          id: "vpn-access",
          name: "VPN Access",
          description: "Request VPN access for secure remote work connectivity",
          sla: "Same day",
          popularity: 5,
          requirements: ["Remote work approval", "Security training completion", "Device compliance"],
          process: "Submit request → Security verification → VPN profile creation → Setup instructions",
        },
      ],
    },
    hr: {
      name: "HR Services",
      description: "Human resources support for all employee needs",
      services: [
        {
          id: "employment-letter",
          name: "Employment Letter",
          description: "Request official employment verification letter for various purposes",
          sla: "2-3 business days",
          popularity: 4,
          requirements: ["Valid employee status", "Purpose specification", "Manager notification"],
          process: "Submit request → HR verification → Letter generation → Approval → Delivery",
        },
        {
          id: "leave-request",
          name: "Leave Request",
          description: "Submit vacation, sick leave, or other time-off requests",
          sla: "1-2 business days",
          popularity: 5,
          requirements: ["Sufficient leave balance", "Manager approval", "Coverage arrangement"],
          process: "Submit request → Balance check → Manager approval → Calendar update → Confirmation",
        },
      ],
    },
  },
  customer: {
    "technical-support": {
      name: "Technical Support",
      description: "Comprehensive technical assistance for all product-related issues",
      services: [
        {
          id: "product-setup",
          name: "Product Setup",
          description: "Get expert help with initial product configuration and setup",
          sla: "4 hours",
          popularity: 5,
          requirements: ["Active subscription", "Admin access", "System requirements met"],
          process: "Submit request → Engineer assignment → Setup session → Configuration → Testing",
        },
        {
          id: "bug-report",
          name: "Bug Report",
          description: "Report software bugs or unexpected behavior for quick resolution",
          sla: "2 hours",
          popularity: 4,
          requirements: ["Detailed reproduction steps", "Environment information", "Error logs"],
          process: "Submit report → Triage → Investigation → Fix development → Testing → Deployment",
        },
      ],
    },
  },
}

interface ServiceCategoryDetailProps {
  categoryId: string
}

export function ServiceCategoryDetail({ categoryId }: ServiceCategoryDetailProps) {
  const { mode } = useMode()

  const categories = serviceCategories[mode as keyof typeof serviceCategories]
  const category = categories?.[categoryId as keyof typeof categories]

  if (!category) {
    notFound()
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/services">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Services
          </Link>
        </Button>
      </div>

      <div className="space-y-2">
        <h1 className="text-[13px] font-bold tracking-tight">{category.name}</h1>
        <p className="text-muted-foreground text-[11px]">{category.description}</p>
      </div>

      <div className="grid gap-6">
        {category.services.map((service) => (
          <Card key={service.id} className="overflow-hidden">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-[13px]">{service.name}</CardTitle>
                  <CardDescription className="text-[11px]">{service.description}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {service.sla}
                  </Badge>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: service.popularity }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-3">Requirements</h4>
                <ul className="space-y-2">
                  {service.requirements.map((req, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-3">Process Flow</h4>
                <div className="flex items-center gap-2 text-sm text-muted-foreground overflow-x-auto pb-2">
                  {service.process.split(" → ").map((step, index, array) => (
                    <div key={index} className="flex items-center gap-2 whitespace-nowrap">
                      <span className="px-2 py-1 bg-muted rounded text-xs">{step}</span>
                      {index < array.length - 1 && <ArrowRight className="h-3 w-3 flex-shrink-0" />}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <Button asChild>
                  <Link href={`/tickets/create?service=${encodeURIComponent(service.name)}&category=${categoryId}`}>
                    Request This Service
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
