/**
 * Minimal page loader for smooth transitions
 * Shows briefly only on first load - cached data loads instantly
 */
export function MinimalPageLoader({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <div className="text-sm text-muted-foreground animate-pulse">{message}</div>
      </div>
    </div>
  )
}
