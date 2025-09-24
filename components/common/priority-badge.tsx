"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { AlertTriangle, ArrowUp, ArrowDown, Minus } from "lucide-react"

interface PriorityBadgeProps {
  priority: string
  size?: "sm" | "md" | "lg"
  showIcon?: boolean
  className?: string
}

export function PriorityBadge({ priority, size = "md", showIcon = true, className }: PriorityBadgeProps) {
  const getPriorityConfig = (priority: string) => {
    const configs = {
      critical: {
        color: "bg-red-100 text-red-800 border-red-200",
        icon: AlertTriangle,
        iconColor: "text-red-600",
      },
      high: {
        color: "bg-orange-100 text-orange-800 border-orange-200",
        icon: ArrowUp,
        iconColor: "text-orange-600",
      },
      medium: {
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: Minus,
        iconColor: "text-yellow-600",
      },
      low: {
        color: "bg-green-100 text-green-800 border-green-200",
        icon: ArrowDown,
        iconColor: "text-green-600",
      },
      emergency: {
        color: "bg-red-100 text-red-800 border-red-200",
        icon: AlertTriangle,
        iconColor: "text-red-600",
      },
    }

    return configs[priority.toLowerCase() as keyof typeof configs] || configs.medium
  }

  const config = getPriorityConfig(priority)
  const Icon = config.icon

  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-2.5 py-1",
    lg: "text-sm px-3 py-1.5",
  }

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-4 h-4",
  }

  return (
    <Badge
      variant="outline"
      className={cn("inline-flex items-center gap-1.5 font-medium border", config.color, sizeClasses[size], className)}
    >
      {showIcon && <Icon className={cn(iconSizes[size], config.iconColor)} />}
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </Badge>
  )
}
