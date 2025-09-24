"use client"

import { useState } from "react"
import { Filter, User, Tag, Building, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { cn } from "@/lib/utils"

interface SearchFiltersProps {
  onFiltersChange: (filters: SearchFilters) => void
  className?: string
}

interface SearchFilters {
  types: string[]
  dateRange: { from?: Date; to?: Date }
  assignee?: string
  department?: string
  status?: string
  priority?: string
  tags: string[]
}

const contentTypes = [
  { id: "ticket", label: "Tickets", icon: "🎫" },
  { id: "user", label: "Users", icon: "👤" },
  { id: "knowledge", label: "Knowledge Base", icon: "📚" },
  { id: "service", label: "Services", icon: "⚙️" },
  { id: "asset", label: "Assets", icon: "💻" },
  { id: "workflow", label: "Workflows", icon: "🔄" },
  { id: "account", label: "Accounts", icon: "🏢" },
]

const departments = [
  "IT Services",
  "Human Resources",
  "Finance",
  "Legal",
  "Facilities",
  "Security",
  "Engineering",
  "Marketing",
  "Sales",
  "Customer Success",
]

const statusOptions = ["Open", "In Progress", "Pending", "Resolved", "Closed", "Active", "Inactive"]

const priorityOptions = ["Urgent", "High", "Medium", "Low"]

export function SearchFilters({ onFiltersChange, className }: SearchFiltersProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    types: [],
    dateRange: {},
    tags: [],
  })
  const [isOpen, setIsOpen] = useState(false)

  const updateFilters = (newFilters: Partial<SearchFilters>) => {
    const updated = { ...filters, ...newFilters }
    setFilters(updated)
    onFiltersChange(updated)
  }

  const toggleType = (type: string) => {
    const newTypes = filters.types.includes(type) ? filters.types.filter((t) => t !== type) : [...filters.types, type]
    updateFilters({ types: newTypes })
  }

  const clearFilters = () => {
    const cleared = {
      types: [],
      dateRange: {},
      tags: [],
    }
    setFilters(cleared)
    onFiltersChange(cleared)
  }

  const activeFiltersCount =
    filters.types.length +
    (filters.dateRange.from ? 1 : 0) +
    (filters.assignee ? 1 : 0) +
    (filters.department ? 1 : 0) +
    (filters.status ? 1 : 0) +
    (filters.priority ? 1 : 0) +
    filters.tags.length

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="text-[13px] h-8 bg-transparent">
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" align="start">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-[13px]">Search Filters</h4>
              {activeFiltersCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-[12px] h-6 px-2">
                  Clear all
                </Button>
              )}
            </div>

            {/* Content Types */}
            <div>
              <Label className="text-[12px] font-medium mb-2 block">Content Types</Label>
              <div className="grid grid-cols-2 gap-2">
                {contentTypes.map((type) => (
                  <div key={type.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={type.id}
                      checked={filters.types.includes(type.id)}
                      onCheckedChange={() => toggleType(type.id)}
                    />
                    <Label htmlFor={type.id} className="text-[12px] flex items-center gap-1 cursor-pointer">
                      <span>{type.icon}</span>
                      {type.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div>
              <Label className="text-[12px] font-medium mb-2 block">Date Range</Label>
              <DatePickerWithRange
                date={filters.dateRange}
                onDateChange={(range) => updateFilters({ dateRange: range || {} })}
                className="w-full"
              />
            </div>

            {/* Department */}
            <div>
              <Label className="text-[12px] font-medium mb-2 block">Department</Label>
              <Select
                value={filters.department || "any_department"}
                onValueChange={(value) => updateFilters({ department: value || undefined })}
              >
                <SelectTrigger className="text-[12px]">
                  <SelectValue placeholder="Any department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any_department">Any department</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div>
              <Label className="text-[12px] font-medium mb-2 block">Status</Label>
              <Select
                value={filters.status || "any_status"}
                onValueChange={(value) => updateFilters({ status: value || undefined })}
              >
                <SelectTrigger className="text-[12px]">
                  <SelectValue placeholder="Any status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any_status">Any status</SelectItem>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div>
              <Label className="text-[12px] font-medium mb-2 block">Priority</Label>
              <Select
                value={filters.priority || "any_priority"}
                onValueChange={(value) => updateFilters({ priority: value || undefined })}
              >
                <SelectTrigger className="text-[12px]">
                  <SelectValue placeholder="Any priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any_priority">Any priority</SelectItem>
                  {priorityOptions.map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {priority}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Assignee */}
            <div>
              <Label className="text-[12px] font-medium mb-2 block">Assignee</Label>
              <Input
                placeholder="Search by assignee..."
                value={filters.assignee || ""}
                onChange={(e) => updateFilters({ assignee: e.target.value || undefined })}
                className="text-[12px]"
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Active Filter Tags */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {filters.types.map((type) => {
            const typeInfo = contentTypes.find((t) => t.id === type)
            return (
              <Badge
                key={type}
                variant="secondary"
                className="text-xs h-6 px-2 cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => toggleType(type)}
              >
                {typeInfo?.icon} {typeInfo?.label} ×
              </Badge>
            )
          })}
          {filters.department && (
            <Badge
              variant="secondary"
              className="text-xs h-6 px-2 cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => updateFilters({ department: undefined })}
            >
              <Building className="h-3 w-3 mr-1" />
              {filters.department} ×
            </Badge>
          )}
          {filters.status && (
            <Badge
              variant="secondary"
              className="text-xs h-6 px-2 cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => updateFilters({ status: undefined })}
            >
              <Tag className="h-3 w-3 mr-1" />
              {filters.status} ×
            </Badge>
          )}
          {filters.priority && (
            <Badge
              variant="secondary"
              className="text-xs h-6 px-2 cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => updateFilters({ priority: undefined })}
            >
              <Clock className="h-3 w-3 mr-1" />
              {filters.priority} ×
            </Badge>
          )}
          {filters.assignee && (
            <Badge
              variant="secondary"
              className="text-xs h-6 px-2 cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => updateFilters({ assignee: undefined })}
            >
              <User className="h-3 w-3 mr-1" />
              {filters.assignee} ×
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
