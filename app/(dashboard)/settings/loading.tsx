import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 border-r border-border p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-6 w-24" />
        </div>
        <Skeleton className="h-10 w-full" />
        <div className="space-y-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <div className="space-y-1">
                {Array.from({ length: 3 }).map((_, j) => (
                  <Skeleton key={j} className="h-8 w-full" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 space-y-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-96" />
          </div>

          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-6">
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="flex justify-end gap-4">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </div>
    </div>
  )
}
