import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Search Bar */}
      <Skeleton className="h-12 w-full" />

      {/* Filters */}
      <div className="flex items-center gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-full" />
        ))}
      </div>

      {/* Search Results */}
      <div className="space-y-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="p-6">
            <div className="flex items-start gap-4">
              <Skeleton className="h-8 w-8 rounded" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-64" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
