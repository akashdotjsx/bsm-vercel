"use client"

import { PageContent } from "@/components/layout/page-content"
import { ServiceCatalog } from "@/components/services/service-catalog"

export default function ServiceCatalogAdminPage() {
  return (
    <PageContent
      title="Service Catalog"
      description="Manage service categories and offerings for your organization"
    >
      <ServiceCatalog />
    </PageContent>
  )
}
