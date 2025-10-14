import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex h-screen">
      {/* Left Sidebar - Nodes */}
      <div className="w-64 border-r border-border p-4 space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-full" />
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="p-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 bg-muted/30 relative">
        {/* Top Toolbar */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
          <div className="p-2 flex items-center gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-8 rounded" />
            ))}
          </div>
        </div>

        {/* Canvas Placeholder */}
        <div className="p-8 space-y-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-24 w-48 rounded" />
              <Skeleton className="h-1 w-16" />
              <Skeleton className="h-24 w-48 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Right Sidebar - Properties */}
      <div className="w-80 border-l border-border p-4 space-y-4">
        <Skeleton className="h-8 w-32" />
        <div className="p-4 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
