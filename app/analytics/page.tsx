import { Suspense } from "react"
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { PlatformLayout } from "@/components/layout/platform-layout"

export default function AnalyticsPage() {
  return (
    <PlatformLayout breadcrumb={[{ label: "Analytics" }]}>
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-[13px] font-semibold tracking-tight">Analytics & Reporting</h1>
          <p className="text-[10px] text-muted-foreground">
            Real-time insights and performance metrics for service management
          </p>
        </div>

        <Suspense fallback={<AnalyticsSkeleton />}>
          <AnalyticsDashboard />
        </Suspense>
      </div>
    </PlatformLayout>
  )
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
