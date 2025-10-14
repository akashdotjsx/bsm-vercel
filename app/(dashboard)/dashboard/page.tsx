"use client"

import { BusinessIntelligence } from "@/components/dashboard/business-intelligence"
import { PageContent } from "@/components/layout/page-content"

export default function DashboardPage() {
  console.log("[v0] Dashboard page loading")
  return (
    <PageContent>
      <BusinessIntelligence />
    </PageContent>
  )
}
