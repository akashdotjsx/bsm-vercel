import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Executive Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-10 w-20 mb-2" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>

      {/* Executive Charts */}
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-6 w-48" />
            </div>
            <div>
              <Skeleton className="h-80 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
