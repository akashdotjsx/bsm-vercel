import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Asset Type Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="text-center space-y-2">
            <Skeleton className="h-8 w-8 mx-auto rounded" />
            <Skeleton className="h-4 w-20 mx-auto" />
            <Skeleton className="h-6 w-12 mx-auto" />
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-48" />
      </div>

      {/* Assets Table */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-3 border rounded">
                <Skeleton className="h-10 w-10 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
