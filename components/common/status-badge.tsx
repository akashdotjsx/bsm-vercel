"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: string
  type?: "ticket" | "asset" | "change" | "service" | "user"
  size?: "sm" | "md" | "lg"
  className?: string
}

export function StatusBadge({ status, type = "ticket", size = "md", className }: StatusBadgeProps) {
  const getStatusConfig = (status: string, type: string) => {
    const configs = {
      ticket: {
        open: { color: "bg-yellow-100 text-yellow-800 border-yellow-200", dot: "bg-yellow-500" },
        in_progress: { color: "bg-blue-100 text-blue-800 border-blue-200", dot: "bg-blue-500" },
        pending: { color: "bg-orange-100 text-orange-800 border-orange-200", dot: "bg-orange-500" },
        resolved: { color: "bg-green-100 text-green-800 border-green-200", dot: "bg-green-500" },
        closed: { color: "bg-gray-100 text-gray-800 border-gray-200", dot: "bg-gray-500" },
      },
      asset: {
        active: { color: "bg-green-100 text-green-800 border-green-200", dot: "bg-green-500" },
        inactive: { color: "bg-gray-100 text-gray-800 border-gray-200", dot: "bg-gray-500" },
        maintenance: { color: "bg-yellow-100 text-yellow-800 border-yellow-200", dot: "bg-yellow-500" },
        retired: { color: "bg-red-100 text-red-800 border-red-200", dot: "bg-red-500" },
      },
      change: {
        draft: { color: "bg-gray-100 text-gray-800 border-gray-200", dot: "bg-gray-500" },
        submitted: { color: "bg-blue-100 text-blue-800 border-blue-200", dot: "bg-blue-500" },
        approved: { color: "bg-green-100 text-green-800 border-green-200", dot: "bg-green-500" },
        rejected: { color: "bg-red-100 text-red-800 border-red-200", dot: "bg-red-500" },
        in_progress: { color: "bg-yellow-100 text-yellow-800 border-yellow-200", dot: "bg-yellow-500" },
        completed: { color: "bg-green-100 text-green-800 border-green-200", dot: "bg-green-500" },
        cancelled: { color: "bg-gray-100 text-gray-800 border-gray-200", dot: "bg-gray-500" },
      },
      service: {
        active: { color: "bg-green-100 text-green-800 border-green-200", dot: "bg-green-500" },
        inactive: { color: "bg-gray-100 text-gray-800 border-gray-200", dot: "bg-gray-500" },
        maintenance: { color: "bg-yellow-100 text-yellow-800 border-yellow-200", dot: "bg-yellow-500" },
        deprecated: { color: "bg-red-100 text-red-800 border-red-200", dot: "bg-red-500" },
      },
      user: {
        active: { color: "bg-green-100 text-green-800 border-green-200", dot: "bg-green-500" },
        inactive: { color: "bg-gray-100 text-gray-800 border-gray-200", dot: "bg-gray-500" },
        suspended: { color: "bg-red-100 text-red-800 border-red-200", dot: "bg-red-500" },
        pending: { color: "bg-yellow-100 text-yellow-800 border-yellow-200", dot: "bg-yellow-500" },
      },
    }

    const typeConfig = configs[type as keyof typeof configs] || configs.ticket
    return (
      typeConfig[status.toLowerCase() as keyof typeof typeConfig] ||
      typeConfig.open || {
        color: "bg-gray-100 text-gray-800 border-gray-200",
        dot: "bg-gray-500",
      }
    )
  }

  const config = getStatusConfig(status, type)

  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-2.5 py-1",
    lg: "text-sm px-3 py-1.5",
  }

  const dotSizes = {
    sm: "w-1.5 h-1.5",
    md: "w-2 h-2",
    lg: "w-2.5 h-2.5",
  }

  return (
    <Badge
      variant="outline"
      className={cn("inline-flex items-center gap-1.5 font-medium border", config.color, sizeClasses[size], className)}
    >
      <div className={cn("rounded-full", config.dot, dotSizes[size])} />
      {status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
    </Badge>
  )
}
