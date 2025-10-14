"use client"

import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { useState } from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

interface DateTimePickerProps {
  value?: Date
  onChange: (date: Date | undefined) => void
  className?: string
  placeholder?: string
}

export function DateTimePicker({ value, onChange, className, placeholder = "Pick a date and time" }: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [timeInput, setTimeInput] = useState(() => {
    if (value) {
      const hours = value.getHours().toString().padStart(2, '0')
      const minutes = value.getMinutes().toString().padStart(2, '0')
      return `${hours}:${minutes}`
    }
    return "09:00"
  })

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      // Parse time from timeInput
      const [hours, minutes] = timeInput.split(':').map(Number)
      const newDate = new Date(selectedDate)
      newDate.setHours(hours || 0, minutes || 0, 0, 0)
      onChange(newDate)
    } else {
      onChange(undefined)
    }
  }

  const handleTimeChange = (newTime: string) => {
    setTimeInput(newTime)
    if (value && newTime.match(/^\d{2}:\d{2}$/)) {
      const [hours, minutes] = newTime.split(':').map(Number)
      const newDate = new Date(value)
      newDate.setHours(hours, minutes, 0, 0)
      onChange(newDate)
    }
  }

  const handleClear = () => {
    onChange(undefined)
    setIsOpen(false)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? (
            format(value, "PPP 'at' p")
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 space-y-3">
          <Calendar
            mode="single"
            selected={value}
            onSelect={handleDateSelect}
            initialFocus
          />
          <div className="flex items-center gap-2 px-3">
            <label htmlFor="time" className="text-sm font-medium">
              Time:
            </label>
            <Input
              id="time"
              type="time"
              value={timeInput}
              onChange={(e) => handleTimeChange(e.target.value)}
              className="w-auto"
            />
          </div>
          <div className="flex justify-between px-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
            >
              Clear
            </Button>
            <Button
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              Done
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}