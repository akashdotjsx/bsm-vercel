import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-24" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Account Info */}
        <div className="p-6">
          <div className="text-center space-y-4">
            <Skeleton className="h-20 w-20 rounded-full mx-auto mb-4" />
            <Skeleton className="h-6 w-32 mx-auto mb-2" />
            <Skeleton className="h-4 w-24 mx-auto" />
          </div>
          <div className="space-y-3 mt-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>
        </div>

        {/* Activity/Details */}
        <div className="md:col-span-2 space-y-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="p-6">
              <div className="space-y-4">
                <Skeleton className="h-5 w-32" />
              </div>
              <div className="space-y-3 mt-4">
                {Array.from({ length: 4 }).map((_, j) => (
                  <Skeleton key={j} className="h-16 w-full" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
