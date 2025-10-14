"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CustomColumn, useCustomColumnsStore } from "@/lib/stores/custom-columns-store"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"

interface CustomColumnCellProps {
  column: CustomColumn
  ticketId: string
}

export function CustomColumnCell({ column, ticketId }: CustomColumnCellProps) {
  const { getColumnValue, setColumnValue } = useCustomColumnsStore()
  const [value, setValue] = useState<any>(getColumnValue(ticketId, column.id) || "")

  useEffect(() => {
    setValue(getColumnValue(ticketId, column.id) || "")
  }, [ticketId, column.id, getColumnValue])

  const handleValueChange = (newValue: any) => {
    setValue(newValue)
    setColumnValue(ticketId, column.id, newValue)
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    if (newValue !== value) {
      handleValueChange(newValue)
    }
  }

  // Render based on column type
  switch (column.type) {
    case "text":
      return (
        <Input
          placeholder={`Enter ${column.title.toLowerCase()}...`}
          className="h-6 text-xs border-0 bg-transparent focus:bg-background"
          defaultValue={value || ""}
          onBlur={handleBlur}
        />
      )

    case "number":
      return (
        <Input
          type="number"
          placeholder={`0`}
          className="h-6 text-xs border-0 bg-transparent focus:bg-background"
          defaultValue={value || ""}
          onBlur={handleBlur}
        />
      )

    case "date":
      return (
        <Input
          type="date"
          className="h-6 text-xs border-0 bg-transparent focus:bg-background"
          defaultValue={value || ""}
          onBlur={handleBlur}
        />
      )

    case "select":
      return (
        <Select value={value || ""} onValueChange={handleValueChange}>
          <SelectTrigger className="h-6 text-xs border-0 bg-transparent focus:bg-background">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">None</SelectItem>
            {column.options?.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )

    case "multiselect":
      const selectedValues = Array.isArray(value) ? value : value ? [value] : []
      
      return (
        <div className="flex flex-wrap gap-1">
          {selectedValues.length > 0 ? (
            selectedValues.map((val: string, idx: number) => (
              <Badge
                key={idx}
                variant="secondary"
                className="text-[10px] h-5 flex items-center gap-1"
              >
                {val}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    const newValues = selectedValues.filter((v: string) => v !== val)
                    handleValueChange(newValues.length > 0 ? newValues : "")
                  }}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-2 w-2" />
                </button>
              </Badge>
            ))
          ) : (
            <Select
              value=""
              onValueChange={(newVal) => {
                if (newVal && !selectedValues.includes(newVal)) {
                  const newValues = [...selectedValues, newVal]
                  handleValueChange(newValues)
                }
              }}
            >
              <SelectTrigger className="h-6 text-xs border-0 bg-transparent focus:bg-background w-full">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {column.options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )

    default:
      return (
        <span className="text-xs text-muted-foreground">
          Unknown type
        </span>
      )
  }
}
