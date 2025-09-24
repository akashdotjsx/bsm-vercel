"use client"

import { BusinessIntelligence } from "@/components/dashboard/business-intelligence"
import { PlatformLayout } from "@/components/layout/platform-layout"

export default function DashboardPage() {
  console.log("[v0] Dashboard page loading")

  const mockProfile = {
    id: "demo-user-id",
    email: "admin@kroolo.com",
    first_name: "Admin",
    last_name: "User",
    display_name: "Admin User",
    department: "IT",
    role: "Administrator",
    is_active: true,
  }

  console.log("[v0] Dashboard rendering with user:", mockProfile.display_name)

  return (
    <PlatformLayout>
      <BusinessIntelligence />
    </PlatformLayout>
  )
}
