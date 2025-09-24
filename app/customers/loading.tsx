import { PlatformLayout } from "@/components/layout/platform-layout"
import { Skeleton } from "@/components/ui/skeleton"

export default function CustomersLoading() {
  return (
    <PlatformLayout
      breadcrumb={[
        { label: "Customer Support", href: "/dashboard" },
        { label: "Customers", href: "/customers" },
      ]}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-48" />
        </div>

        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <div className="flex gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-40" />
            ))}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </PlatformLayout>
  )
}
