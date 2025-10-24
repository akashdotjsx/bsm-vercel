"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { CustomColumn } from "@/lib/stores/custom-columns-store"
import { useCustomColumnValuesGraphQL } from "@/hooks/queries/use-custom-columns-graphql"

interface CustomColumnCellProps {
  column: CustomColumn
  ticketId: string
  editable?: boolean // New prop to control editability
}

export function CustomColumnCell({ column, ticketId, editable = true }: CustomColumnCellProps) {
  const { customFields, setValue: updateCustomField, isSetting } = useCustomColumnValuesGraphQL(ticketId)
  const [value, setValue] = useState<any>(customFields[column.title] || "")
  const [originalValue, setOriginalValue] = useState<any>(customFields[column.title] || "")
  const [isValid, setIsValid] = useState(true)

  useEffect(() => {
    const dbValue = customFields[column.title] || ""
    setValue(dbValue)
    setOriginalValue(dbValue)
  }, [customFields, column.title])

  const handleValueChange = async (newValue: any) => {
    console.log('🎯 handleValueChange called:', {
      ticketId,
      columnTitle: column.title,
      columnType: column.type,
      newValue,
      newValueType: typeof newValue
    })
    
    setValue(newValue)
    
    // Convert value to appropriate type before saving
    let processedValue = newValue
    
    if (column.type === "number") {
      // Convert to number if it's a valid number string
      if (newValue === "" || newValue === "-") {
        processedValue = null // Store null for empty number fields
      } else if (!isNaN(Number(newValue)) && newValue !== "") {
        processedValue = Number(newValue)
      } else {
        // If it's not a valid number, don't save
        console.log('⚠️ Invalid number, not saving')
        return
      }
    } else if (column.type === "date") {
      // For date, ensure it's a valid date string or null
      if (newValue === "") {
        processedValue = null
      } else {
        // Validate date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/
        if (!dateRegex.test(newValue)) {
          console.log('⚠️ Invalid date format, not saving')
          return // Don't save invalid dates
        }
        processedValue = newValue
      }
    } else if (column.type === "text") {
      // For text, allow any string including numbers
      processedValue = newValue || ""
    }
    
    console.log('💾 Saving processed value:', processedValue)
    
    try {
      await updateCustomField({ fieldName: column.title, value: processedValue })
      console.log('✅ Custom field saved successfully')
      // Update originalValue after successful save
      setOriginalValue(newValue)
    } catch (error) {
      console.error('❌ Error updating custom field:', error)
      // Revert to original value on error
      setValue(originalValue)
    }
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    console.log('🔍 handleBlur called:', {
      ticketId,
      columnTitle: column.title,
      newValue,
      originalValue,
      currentValue: value,
      isDifferent: newValue !== originalValue
    })
    if (newValue !== originalValue) {
      console.log('💾 Calling handleValueChange from blur')
      handleValueChange(newValue)
    } else {
      console.log('⏭️ Skipping save - value unchanged from database')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // For number type, only allow numbers, decimal point, and minus sign
    if (column.type === "number") {
      const char = e.key
      const currentValue = (e.target as HTMLInputElement).value
      
      // Allow: numbers, decimal point, minus sign, backspace, delete, arrow keys, tab
      if (!/[\d.-]/.test(char) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(char)) {
        e.preventDefault()
        return
      }
      
      // Prevent multiple decimal points
      if (char === '.' && currentValue.includes('.')) {
        e.preventDefault()
        return
      }
      
      // Prevent multiple minus signs
      if (char === '-' && (currentValue.includes('-') || currentValue.length > 0)) {
        e.preventDefault()
        return
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    
    // For number type, validate the input
    if (column.type === "number") {
      // Allow empty string, single minus, or valid number format
      if (newValue === "" || newValue === "-" || /^-?\d*\.?\d*$/.test(newValue)) {
        setValue(newValue)
        setIsValid(true)
      } else {
        setIsValid(false)
      }
      return
    }
    
    // For date type, validate date format
    if (column.type === "date") {
      if (newValue === "" || /^\d{4}-\d{2}-\d{2}$/.test(newValue)) {
        setValue(newValue)
        setIsValid(true)
      } else {
        setIsValid(false)
      }
      return
    }
    
    // For text type, allow any input
    setValue(newValue)
    setIsValid(true)
  }

  // Helper function to format display value
  const formatDisplayValue = (value: any, type: string): string => {
    if (value === null || value === undefined || value === "") {
      return "—"
    }
    
    switch (type) {
      case "date":
        try {
          // Format date for display (convert from YYYY-MM-DD to a more readable format)
          const date = new Date(value)
          return date.toLocaleDateString()
        } catch {
          return String(value)
        }
      case "number":
        return String(value)
      case "text":
      default:
        return String(value)
    }
  }

  // If not editable, render as view-only
  if (!editable) {
    return (
      <div className="h-8 text-sm text-foreground min-w-[120px] flex items-center px-2">
        {formatDisplayValue(value, column.type)}
      </div>
    )
  }

  // Render based on column type (editable mode)
  switch (column.type) {
    case "text":
      return (
        <Input
          placeholder={`Enter ${column.title.toLowerCase()}...`}
          className="h-8 text-sm border-0 bg-transparent focus:bg-background min-w-[120px]"
          value={value || ""}
          onChange={handleInputChange}
          onBlur={handleBlur}
        />
      )

    case "number":
      return (
        <Input
          type="number"
          placeholder={`0`}
          className={`h-8 text-sm border-0 bg-transparent focus:bg-background min-w-[120px] ${
            !isValid ? 'ring-1 ring-red-500 focus:ring-red-500' : ''
          }`}
          value={value || ""}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          onBlur={handleBlur}
          step="any"
        />
      )

    case "date":
      return (
        <Input
          type="date"
          className={`h-8 text-sm border-0 bg-transparent focus:bg-background min-w-[120px] ${
            !isValid ? 'ring-1 ring-red-500 focus:ring-red-500' : ''
          }`}
          value={value || ""}
          onChange={handleInputChange}
          onBlur={handleBlur}
        />
      )

    default:
      return (
        <span className="text-xs text-muted-foreground">
          Unknown type
        </span>
      )
  }
}
