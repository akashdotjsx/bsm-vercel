"use client"

import { BusinessIntelligence } from "@/components/dashboard/business-intelligence"
import { PlatformLayout } from "@/components/layout/platform-layout"

export default function DashboardPage() {
  console.log("[v0] Dashboard page loading")
  return (
    <PlatformLayout>
      <BusinessIntelligence />
    </PlatformLayout>
  )
}
