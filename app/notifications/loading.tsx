import { PlatformLayout } from "@/components/layout/platform-layout"

export default function NotificationsLoading() {
  return (
    <PlatformLayout>
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 bg-muted rounded animate-pulse"></div>
            <div className="h-4 w-96 bg-muted rounded animate-pulse mt-2"></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-6 w-16 bg-muted rounded animate-pulse"></div>
            <div className="h-8 w-24 bg-muted rounded animate-pulse"></div>
            <div className="h-8 w-20 bg-muted rounded animate-pulse"></div>
          </div>
        </div>

        {/* Filter Skeleton */}
        <div className="flex items-center gap-2 pb-4 border-b border">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-8 w-16 bg-muted rounded animate-pulse"></div>
          ))}
        </div>

        {/* Notifications Skeleton */}
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="p-4 rounded-lg border">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-muted rounded-full animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-muted rounded animate-pulse"></div>
                  <div className="h-3 w-full bg-muted rounded animate-pulse"></div>
                  <div className="flex items-center justify-between">
                    <div className="h-3 w-20 bg-muted rounded animate-pulse"></div>
                    <div className="flex gap-2">
                      <div className="h-6 w-16 bg-muted rounded animate-pulse"></div>
                      <div className="h-6 w-12 bg-muted rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PlatformLayout>
  )
}
