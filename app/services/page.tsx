import { Suspense } from "react"
import { ServiceCatalog } from "@/components/services/service-catalog"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { PlatformLayout } from "@/components/layout/platform-layout"

export default function ServicesPage() {
  return (
    <PlatformLayout>
      <div className="space-y-6">
        <Suspense fallback={<ServiceCatalogSkeleton />}>
          <ServiceCatalog />
        </Suspense>
      </div>
    </PlatformLayout>
  )
}

function ServiceCatalogSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
