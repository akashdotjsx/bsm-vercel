import { ServiceCategoryDetail } from "@/components/services/service-category-detail"
import { PageContent } from "@/components/layout/page-content"

interface ServiceCategoryPageProps {
  params: {
    category: string
  }
}

export default function ServiceCategoryPage({ params }: ServiceCategoryPageProps) {
  return (
    <PageContent breadcrumb={[{ label: "Services", href: "/services" }, { label: params.category }]}>
      <ServiceCategoryDetail categoryId={params.category} />
    </PageContent>
  )
}
