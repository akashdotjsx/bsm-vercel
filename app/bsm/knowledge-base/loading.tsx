import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export default function KnowledgeBaseLoading() {
  return (
    <div className="space-y-6 text-[13px]">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-9 w-36" />
        </div>
      </div>

      {/* AI Intelligence card skeleton */}
      <Card className="border-[#7073fc]/20 bg-gradient-to-r from-[#7073fc]/5 to-transparent">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-5 rounded" />
              <div>
                <Skeleton className="h-4 w-48 mb-1" />
                <Skeleton className="h-3 w-80" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search bar skeleton */}
      <div className="flex items-center gap-4 py-4">
        <div className="relative flex-1 max-w-md">
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      </div>

      {/* Categories grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 9 }).map((_, i) => (
          <Card key={i} className="p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <Skeleton className="w-12 h-12 rounded-lg" />
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-32" />
                  {i % 3 === 0 && <Skeleton className="h-4 w-16 rounded-full" />}
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <div className="p-2 rounded-md bg-[#7073fc]/5 border border-[#7073fc]/10">
                  <Skeleton className="h-3 w-full" />
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
