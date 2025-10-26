"use client"

import { AdminPageGuard } from "@/components/auth/admin-page-guard"
import { PageContent } from "@/components/layout/page-content"
import { ServiceCatalog } from "@/components/services/service-catalog"

export default function ServiceCatalogAdminPage() {
  return (
    <AdminPageGuard permission="administration.view">
      <PageContent
        title="Service Catalog"
        description="Manage service categories and offerings for your organization"
      >
        <ServiceCatalog />
      </PageContent>
    </AdminPageGuard>
  )
}
