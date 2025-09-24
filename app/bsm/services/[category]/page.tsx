import { ServiceCategoryDetail } from "@/components/services/service-category-detail"

interface ServiceCategoryPageProps {
  params: {
    category: string
  }
}

export default function ServiceCategoryPage({ params }: ServiceCategoryPageProps) {
  return <ServiceCategoryDetail categoryId={params.category} />
}
