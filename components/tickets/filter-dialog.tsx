"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Check } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useFilterOptions } from "@/hooks/use-filter-options"

interface FilterOption {
  id: string
  label: string
  color: string
}

interface FilterDialogProps {
  children: React.ReactNode
  onApply: (filters: FilterState) => void
  onReset: () => void
  initialFilters?: FilterState
}

interface FilterState {
  status: string[]
  priority: string[]
  type: string[]
  assignee: string[]
  reportedBy: string[]
  dateRange: {
    from: Date | undefined
    to: Date | undefined
  }
}

// Filter options will be loaded from real data via useFilterOptions hook

export const FilterDialog: React.FC<FilterDialogProps> = ({
  children,
  onApply,
  onReset,
  initialFilters,
}) => {
  const { options, loading, error } = useFilterOptions()
  const [open, setOpen] = useState(false)
  const [filters, setFilters] = useState<FilterState>(
    initialFilters || {
      status: [],
      priority: [],
      type: [],
      assignee: [],
      reportedBy: [],
      dateRange: {
        from: undefined,
        to: undefined,
      },
    }
  )

  const handleOptionToggle = (category: keyof Omit<FilterState, 'dateRange'>, optionId: string) => {
    setFilters(prev => ({
      ...prev,
      [category]: prev[category].includes(optionId)
        ? prev[category].filter(id => id !== optionId)
        : [...prev[category], optionId]
    }))
  }

  const handleApply = () => {
    console.log('🔍 Filter Apply:', {
      status: filters.status,
      type: filters.type,
      priority: filters.priority,
      assignee: filters.assignee,
      reportedBy: filters.reportedBy,
      dateRange: filters.dateRange,
      availableOptions: {
        assignees: options.assignees.map(a => ({ id: a.id, label: a.label })),
        reporters: options.reporters.map(r => ({ id: r.id, label: r.label }))
      }
    })
    console.log('🔍 SELECTED ASSIGNEE ID:', filters.assignee[0])
    console.log('🔍 SELECTED REPORTER ID:', filters.reportedBy[0])
    onApply(filters)
    setOpen(false) // Close the popover after applying filters
  }

  const handleReset = () => {
    const resetFilters: FilterState = {
      status: [],
      priority: [],
      type: [],
      assignee: [],
      reportedBy: [],
      dateRange: {
        from: undefined,
        to: undefined,
      },
    }
    setFilters(resetFilters)
    onReset()
    setOpen(false) // Close the popover after resetting filters
  }


  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent 
        className="w-[773px] bg-popover rounded-[20px] border border-border shadow-[0px_0px_15px_0px_rgba(19,43,76,0.2)] dark:shadow-[0px_0px_15px_0px_rgba(0,0,0,0.4)] p-0"
        align="start"
        side="bottom"
      >
        <div className="px-6 pt-6 pb-4">
          <h3 className="text-lg font-semibold text-popover-foreground">
            Filter Tickets
          </h3>
        </div>
        
        {/* Compact horizontal layout */}
        <div className="px-6 pb-6">
          <div className="grid grid-cols-6 gap-4">
            {/* Status Filter */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-popover-foreground">Status</h3>
              <div className="space-y-2">
                {loading ? (
                  <div className="text-xs text-muted-foreground">Loading...</div>
                ) : error ? (
                  <div className="text-xs text-destructive">Error loading options</div>
                ) : (
                  options.status.map((option) => (
                         <div
                           key={option.id}
                           className={`flex items-center gap-2 p-1 rounded cursor-pointer hover:bg-accent transition-colors ${
                             filters.status.includes(option.id) 
                               ? 'bg-primary/10 border border-primary' 
                               : 'bg-muted'
                           }`}
                           onClick={() => handleOptionToggle("status", option.id)}
                         >
                           <div className="relative">
                             <div
                               className="w-3 h-3 rounded-full"
                               style={{ backgroundColor: option.color }}
                             />
                             {filters.status.includes(option.id) && (
                               <Check className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 text-white drop-shadow-sm" />
                             )}
                           </div>
                           <span className="text-xs text-popover-foreground">{option.label}</span>
                         </div>
                  ))
                )}
              </div>
            </div>
            
            {/* Type Filter */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-popover-foreground">Type</h3>
              <div className="space-y-2">
                {loading ? (
                  <div className="text-xs text-muted-foreground">Loading...</div>
                ) : error ? (
                  <div className="text-xs text-destructive">Error loading options</div>
                ) : (
                  options.type.map((option) => (
                         <div
                           key={option.id}
                           className={`flex items-center gap-2 p-1 rounded cursor-pointer hover:bg-accent transition-colors ${
                             filters.type.includes(option.id) 
                               ? 'bg-primary/10 border border-primary' 
                               : 'bg-muted'
                           }`}
                           onClick={() => handleOptionToggle("type", option.id)}
                         >
                           <div className="relative">
                             <div
                               className="w-3 h-3 rounded-full"
                               style={{ backgroundColor: option.color }}
                             />
                             {filters.type.includes(option.id) && (
                               <Check className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 text-white drop-shadow-sm" />
                             )}
                           </div>
                           <span className="text-xs text-popover-foreground">{option.label}</span>
                         </div>
                  ))
                )}
              </div>
            </div>
            
            {/* Priority Filter */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-popover-foreground">Priority</h3>
              <div className="space-y-2">
                {loading ? (
                  <div className="text-xs text-muted-foreground">Loading...</div>
                ) : error ? (
                  <div className="text-xs text-destructive">Error loading options</div>
                ) : (
                  options.priority.map((option) => (
                         <div
                           key={option.id}
                           className={`flex items-center gap-2 p-1 rounded cursor-pointer hover:bg-accent transition-colors ${
                             filters.priority.includes(option.id) 
                               ? 'bg-primary/10 border border-primary' 
                               : 'bg-muted'
                           }`}
                           onClick={() => handleOptionToggle("priority", option.id)}
                         >
                           <div className="relative">
                             <div
                               className="w-3 h-3 rounded-full"
                               style={{ backgroundColor: option.color }}
                             />
                             {filters.priority.includes(option.id) && (
                               <Check className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 text-white drop-shadow-sm" />
                             )}
                           </div>
                           <span className="text-xs text-popover-foreground">{option.label}</span>
                         </div>
                  ))
                )}
              </div>
            </div>
            
            {/* Reported By Filter */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-popover-foreground">Reported By</h3>
              <div className="space-y-2">
                {loading ? (
                  <div className="text-xs text-muted-foreground">Loading...</div>
                ) : error ? (
                  <div className="text-xs text-destructive">Error loading options</div>
                ) : (
                  options.reporters.map((option) => (
                         <div
                           key={option.id}
                           className={`flex items-center gap-2 p-1 rounded cursor-pointer hover:bg-accent transition-colors ${
                             filters.reportedBy.includes(option.id) 
                               ? 'bg-primary/10 border border-primary' 
                               : 'bg-muted'
                           }`}
                           onClick={() => handleOptionToggle("reportedBy", option.id)}
                         >
                           <div className="relative">
                             <div
                               className="w-3 h-3 rounded-full"
                               style={{ backgroundColor: option.color }}
                             />
                             {filters.reportedBy.includes(option.id) && (
                               <Check className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 text-white drop-shadow-sm" />
                             )}
                           </div>
                           <span className="text-xs text-popover-foreground">{option.label}</span>
                         </div>
                  ))
                )}
              </div>
            </div>
            
            {/* Assignee Filter */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-popover-foreground">Assignee</h3>
              <div className="space-y-2">
                {loading ? (
                  <div className="text-xs text-muted-foreground">Loading...</div>
                ) : error ? (
                  <div className="text-xs text-destructive">Error loading options</div>
                ) : (
                  options.assignees.map((option) => (
                         <div
                           key={option.id}
                           className={`flex items-center gap-2 p-1 rounded cursor-pointer hover:bg-accent transition-colors ${
                             filters.assignee.includes(option.id) 
                               ? 'bg-primary/10 border border-primary' 
                               : 'bg-muted'
                           }`}
                           onClick={() => handleOptionToggle("assignee", option.id)}
                         >
                           <div className="relative">
                             <div
                               className="w-3 h-3 rounded-full"
                               style={{ backgroundColor: option.color }}
                             />
                             {filters.assignee.includes(option.id) && (
                               <Check className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 text-white drop-shadow-sm" />
                             )}
                           </div>
                           <span className="text-xs text-popover-foreground">{option.label}</span>
                         </div>
                  ))
                )}
              </div>
            </div>
            
            {/* Date Range Filter */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-popover-foreground">Date Range</h3>
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">From</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-between text-left font-normal border-border rounded-[5px] h-8 text-xs px-3 py-2",
                          !filters.dateRange.from && "text-muted-foreground"
                        )}
                      >
                        <span className="text-xs">
                          {filters.dateRange.from ? (
                            format(filters.dateRange.from, "dd-MM-yyyy")
                          ) : (
                            "DD-MM-YYYY"
                          )}
                        </span>
                        <CalendarIcon className="h-3.5 w-3.5 text-foreground" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.dateRange.from}
                        onSelect={(date) =>
                          setFilters(prev => ({
                            ...prev,
                            dateRange: { ...prev.dateRange, from: date }
                          }))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">To</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-between text-left font-normal border-border rounded-[5px] h-8 text-xs px-3 py-2",
                          !filters.dateRange.to && "text-muted-foreground"
                        )}
                      >
                        <span className="text-xs">
                          {filters.dateRange.to ? (
                            format(filters.dateRange.to, "dd-MM-yyyy")
                          ) : (
                            "DD-MM-YYYY"
                          )}
                        </span>
                        <CalendarIcon className="h-3.5 w-3.5 text-foreground" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.dateRange.to}
                        onSelect={(date) =>
                          setFilters(prev => ({
                            ...prev,
                            dateRange: { ...prev.dateRange, to: date }
                          }))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-end gap-4 px-6 pb-6">
          <Button
            variant="outline"
            onClick={handleReset}
            className="px-4 py-2 h-9 text-xs font-semibold border-border rounded-[5px] text-foreground hover:bg-accent"
          >
            Reset
          </Button>
          <Button
            onClick={handleApply}
            className="px-4 py-2 h-9 text-xs font-semibold bg-primary text-primary-foreground rounded-[5px] hover:bg-primary/90"
          >
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
