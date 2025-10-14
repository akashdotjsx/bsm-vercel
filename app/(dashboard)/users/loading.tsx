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

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-40" />
      </div>

      {/* Users Table */}
      <div className="space-y-2">
        <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {Array.from({ length: 6 }).map((_, i) => (
                  <th key={i} className="text-left p-3">
                    <Skeleton className="h-4 w-20" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  </td>
                  <td className="p-3"><Skeleton className="h-4 w-24" /></td>
                  <td className="p-3"><Skeleton className="h-4 w-28" /></td>
                  <td className="p-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
                  <td className="p-3"><Skeleton className="h-4 w-20" /></td>
                  <td className="p-3"><Skeleton className="h-8 w-8" /></td>
                </tr>
              ))}
            </tbody>
        </table>
      </div>
    </div>
  )
}
