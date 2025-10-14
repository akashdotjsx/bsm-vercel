import * as React from "react"
import { cn } from "@/lib/utils"

export function MediaCard({ className, icon, title, subtitle, ...props }: React.ComponentProps<"div"> & {
  icon?: React.ReactNode
  title?: string
  subtitle?: string
}) {
  return (
    <div
      data-slot="media-card"
      className={cn(
        "relative max-w-56 cursor-pointer rounded-xl border border-[var(--card-border)] bg-transparent p-1.5 pr-1",
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg">
          {icon}
        </div>
        <div className="flex min-w-0 flex-col">
          {title ? (
            <div className="truncate text-[11px] font-medium text-[var(--text-color)]">
              {title}
            </div>
          ) : null}
          {subtitle ? (
            <div className="truncate text-[11px] text-[var(--secondary-text-color)]">
              {subtitle}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
