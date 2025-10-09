import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Report Filters */}
      <div className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="mt-4">
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Charts */}
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-6 w-48" />
            </div>
            <div className="mt-4">
              <Skeleton className="h-96 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
