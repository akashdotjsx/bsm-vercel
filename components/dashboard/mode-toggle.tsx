"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useMode } from "@/lib/contexts/mode-context"

export function ModeToggle() {
  const { mode, setMode, isEmployeeMode, isCustomerMode } = useMode()

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-slate-600">Mode:</span>
      <div className="flex items-center rounded-lg border bg-card p-1">
        <Button
          variant={isEmployeeMode ? "default" : "ghost"}
          size="sm"
          onClick={() => setMode("employee")}
          className="h-8"
        >
          Employee Services
        </Button>
        <Button
          variant={isCustomerMode ? "default" : "ghost"}
          size="sm"
          onClick={() => setMode("customer")}
          className="h-8"
        >
          Customer Support
        </Button>
      </div>
      <Badge variant={isEmployeeMode ? "default" : "secondary"} className="ml-2">
        {isEmployeeMode ? "Internal" : "External"}
      </Badge>
    </div>
  )
}
