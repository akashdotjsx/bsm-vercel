"use client"

import { PlatformLayout } from "@/components/layout/platform-layout"
import { ServiceCatalog } from "@/components/services/service-catalog"

export default function ServiceCatalogAdminPage() {
  return (
    <PlatformLayout
      title="Service Catalog"
      description="Manage service categories and offerings for your organization"
      breadcrumbs={[
        { label: "Administration", href: "/admin" },
        { label: "Service Catalog", href: "/admin/catalog" },
      ]}
    >
      <ServiceCatalog />
    </PlatformLayout>
  )
}
