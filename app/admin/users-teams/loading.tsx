import { PlatformLayout } from "@/components/layout/platform-layout"

export default function Loading() {
  return (
    <PlatformLayout title="Users & Teams">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 bg-muted rounded w-48 animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-96 animate-pulse"></div>
          </div>
        </div>

        <div className="border-b border">
          <div className="flex space-x-8">
            <div className="h-10 bg-muted rounded w-20 animate-pulse"></div>
            <div className="h-10 bg-muted rounded w-20 animate-pulse"></div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-6 bg-muted rounded w-32 animate-pulse"></div>
              <div className="h-4 bg-muted rounded w-64 animate-pulse"></div>
            </div>
            <div className="h-10 bg-muted rounded w-24 animate-pulse"></div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="h-10 bg-muted rounded w-64 animate-pulse"></div>
            <div className="h-10 bg-muted rounded w-32 animate-pulse"></div>
            <div className="h-10 bg-muted rounded w-48 animate-pulse"></div>
          </div>

          <div className="bg-card rounded-lg shadow-sm">
            <div className="p-6 space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-4 bg-muted rounded flex-1 animate-pulse"></div>
                  <div className="h-4 bg-muted rounded w-32 animate-pulse"></div>
                  <div className="h-4 bg-muted rounded w-24 animate-pulse"></div>
                  <div className="h-4 bg-muted rounded w-20 animate-pulse"></div>
                  <div className="h-4 bg-muted rounded w-16 animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PlatformLayout>
  )
}
