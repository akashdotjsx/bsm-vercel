"use client"

import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CustomColumn } from "@/lib/stores/custom-columns-store"
import { useCustomColumnsGraphQL } from "@/hooks/queries/use-custom-columns-graphql"
import { useAuth } from "@/lib/contexts/auth-context"
import { Plus, Trash2, X, Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface CustomColumnsDropdownProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  triggerRef?: React.RefObject<HTMLElement>
}

export function CustomColumnsDropdown({ open, onOpenChange, triggerRef }: CustomColumnsDropdownProps) {
  const { user, profile, organizationId, loading } = useAuth()
  
  // Debug user and organization
  console.log('🔍 CustomColumnsDropdown - user:', user)
  console.log('🔍 CustomColumnsDropdown - profile:', profile)
  console.log('🔍 CustomColumnsDropdown - organizationId:', organizationId)
  console.log('🔍 CustomColumnsDropdown - loading:', loading)
  
  // Don't render anything if still loading or no organization
  if (loading || !organizationId) {
    console.log('⏳ CustomColumnsDropdown - Not rendering: loading or no organization')
    return null
  }
  
  // Use GraphQL for custom columns - only if we have a valid organization_id
  const {
    columns,
    isLoading,
    createColumn,
    updateColumn: updateColumnGraphQL,
    deleteColumn,
    isCreating,
    isUpdating,
    isDeleting
  } = useCustomColumnsGraphQL(organizationId)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const [newColumnTitle, setNewColumnTitle] = useState("")
  const [newColumnType, setNewColumnType] = useState<CustomColumn["type"]>("text")

  // Position dropdown relative to trigger
  const [position, setPosition] = useState({ top: 100, left: 100, width: 498 })

  // No need to sync with store - using GraphQL directly

  useEffect(() => {
    if (open) {
      console.log('🎯 CustomColumnsDropdown opened, triggerRef:', triggerRef)
      
      const calculatePosition = () => {
        console.log('🎯 Calculating position, triggerRef?.current:', triggerRef?.current)
        
        if (triggerRef?.current) {
          const rect = triggerRef.current.getBoundingClientRect()
          const viewportWidth = window.innerWidth
          const viewportHeight = window.innerHeight
          
          console.log('🎯 CustomColumnsDropdown positioning:', {
            triggerRect: rect,
            viewportWidth,
            viewportHeight,
            triggerRef: triggerRef.current,
            element: triggerRef.current,
            calculatedTop: rect.bottom + 8,
            calculatedLeft: rect.left,
            buttonBottom: rect.bottom,
            buttonTop: rect.top,
            buttonLeft: rect.left,
            buttonRight: rect.right
          })
          
          // Position dropdown directly below the trigger button
          // Align right edge of dropdown with right edge of button
          let top = rect.bottom + 8 // 8px gap below the trigger
          let left = rect.right - 498 // Align right edge of dropdown with right edge of button
          
          // Ensure dropdown doesn't go off screen horizontally
          if (left + 498 > viewportWidth) {
            left = viewportWidth - 498 - 16 // 16px margin from right edge
          }
          if (left < 16) {
            left = 16 // 16px margin from left edge
          }
          
          // If dropdown would go off bottom of screen, position it above the trigger
          if (top + 600 > viewportHeight) {
            top = rect.top - 600 - 8 // 8px gap above the trigger
          }
          
          const finalPosition = {
            top: Math.max(16, top), // Ensure minimum 16px from top
            left: left,
            width: 498 // Fixed width from Figma design
          }
          
          // TEMPORARY: Force position for testing
          console.log('🎯 FORCING POSITION FOR TESTING - Original:', finalPosition)
          finalPosition.top = rect.bottom + 20 // Force 20px below button
          finalPosition.left = rect.right - 498 // Align right edge of dropdown with right edge of button
          console.log('🎯 FORCED POSITION:', finalPosition)
          
          console.log('🎯 Final position:', finalPosition)
          setPosition(finalPosition)
        } else {
          // Try to find the button by class as fallback
          console.log('🎯 CustomColumnsDropdown: No triggerRef, trying to find button by class')
          const buttonElement = document.querySelector('button[title="Manage custom columns"]') as HTMLButtonElement
          
          if (buttonElement) {
            console.log('🎯 Found button by class:', buttonElement)
            const rect = buttonElement.getBoundingClientRect()
            const viewportWidth = window.innerWidth
            const viewportHeight = window.innerHeight
            
            // Position dropdown directly below the trigger button
            let top = rect.bottom + 8
            let left = rect.right - 498 // Align right edge of dropdown with right edge of button
            
            // Ensure dropdown doesn't go off screen horizontally
            if (left + 498 > viewportWidth) {
              left = viewportWidth - 498 - 16
            }
            if (left < 16) {
              left = 16
            }
            
            // If dropdown would go off bottom of screen, position it above the trigger
            if (top + 600 > viewportHeight) {
              top = rect.top - 600 - 8
            }
            
            const finalPosition = {
              top: Math.max(16, top),
              left: left,
              width: 498 // Fixed width from Figma design
            }
            
            // TEMPORARY: Force position for testing
            console.log('🎯 FALLBACK FORCING POSITION FOR TESTING - Original:', finalPosition)
            finalPosition.top = rect.bottom + 20 // Force 20px below button
            finalPosition.left = rect.right - 498 // Align right edge of dropdown with right edge of button
            console.log('🎯 FALLBACK FORCED POSITION:', finalPosition)
            
            console.log('🎯 Fallback position:', finalPosition)
            setPosition(finalPosition)
          } else {
            // Final fallback positioning - center the dropdown
            console.log('🎯 CustomColumnsDropdown: No button found, using centered fallback positioning')
            const viewportWidth = window.innerWidth
            const viewportHeight = window.innerHeight
            setPosition({
              top: Math.max(100, (viewportHeight - 600) / 2),
              left: Math.max(16, (viewportWidth - 498) / 2),
              width: 498
            })
          }
        }
      }
      
      // Try immediately first
      calculatePosition()
      
      // Also try after a small delay in case DOM isn't ready
      const timeoutId = setTimeout(calculatePosition, 50)
      
      return () => clearTimeout(timeoutId)
    }
  }, [open, triggerRef])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      
      // Check if click is on SelectContent (which is rendered in a portal)
      const isSelectContent = (target as Element)?.closest('[data-slot="select-content"]')
      
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        triggerRef?.current &&
        !triggerRef.current.contains(target) &&
        !isSelectContent
      ) {
        onOpenChange(false)
      }
    }

    const handleResize = () => {
      if (open && triggerRef?.current) {
        const rect = triggerRef.current.getBoundingClientRect()
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight
        
        // Position dropdown directly below the trigger button
        let top = rect.bottom + 8
        let left = rect.right - 498 // Align right edge of dropdown with right edge of button
        
        // Ensure dropdown doesn't go off screen horizontally
        if (left + 498 > viewportWidth) {
          left = viewportWidth - 498 - 16
        }
        if (left < 16) {
          left = 16
        }
        
        // If dropdown would go off bottom of screen, position it above the trigger
        if (top + 600 > viewportHeight) {
          top = rect.top - 600 - 8
        }
        
        setPosition({
          top: Math.max(16, top),
          left: left,
          width: 498 // Fixed width from Figma design
        })
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
      window.addEventListener("resize", handleResize)
      return () => {
        document.removeEventListener("mousedown", handleClickOutside)
        window.removeEventListener("resize", handleResize)
      }
    }
  }, [open, onOpenChange, triggerRef])

  const handleAddColumn = async () => {
    if (!newColumnTitle.trim()) return

    // organizationId should be available since we check it before rendering
    if (!organizationId) {
      console.error('❌ Unexpected: No organization_id found')
      return
    }

    try {
      console.log('🚀 Creating custom column with organization_id:', organizationId)
      
      await createColumn({
        title: newColumnTitle.trim(),
        type: newColumnType,
        visible: true,
      })

      // Reset form
      setNewColumnTitle("")
      setNewColumnType("text")
    } catch (error) {
      console.error('Error creating custom column:', error)
    }
  }


  const handleRemoveColumn = async (columnId: string) => {
    if (confirm("Are you sure you want to remove this column? All data will be lost.")) {
      try {
        await deleteColumn(columnId)
      } catch (error) {
        console.error('Error deleting custom column:', error)
      }
    }
  }

  const getColumnTypeIcon = (type: string) => {
    switch (type) {
      case "text":
        return "📝"
      case "number":
        return "🔢"
      case "date":
        return "📅"
      case "select":
        return "📋"
      case "multiselect":
        return "☑️"
      default:
        return "📝"
    }
  }

  const getColumnIconBgColor = (type: string) => {
    switch (type) {
      case "text":
        return "bg-[#6366F1]"
      case "number":
        return "bg-[#10B981]"
      case "date":
        return "bg-[#6366F1]"
      case "select":
        return "bg-[#F59E0B]"
      case "multiselect":
        return "bg-[#EC4899]"
      default:
        return "bg-[#6B7280]"
    }
  }

  if (!open) return null

  // Debug: Log the current position
  console.log('🎯 Rendering dropdown with position:', position)

  const dropdownContent = (
    <div
      ref={dropdownRef}
      className="fixed z-[9999] bg-background border border-border rounded-2xl shadow-xl flex flex-col overflow-hidden"
      style={{
        position: 'fixed',
        top: position.top || 100,
        left: position.left || 100,
        width: 520,
        maxHeight: "90vh",
        boxShadow: "var(--dropdown-shadow)",
        zIndex: 9999
      }}
    >
      {/* Header */}
      <div className="p-6 pb-4 border-b border-border flex-shrink-0">
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Manage Custom Columns
        </h2>
        <p className="text-sm text-muted-foreground">
          Add custom columns to your ticket table. Values are stored in the database and persist across sessions.
        </p>
      </div>

      <div className="overflow-y-auto flex-1 scrollbar-thin">
        <div className="p-6 pt-4 space-y-6">
        {/* Add New Column Section - FIRST */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Add New Column</h3>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Label htmlFor="column-title" className="text-xs font-medium text-foreground mb-1.5 block">
                Column Title
              </Label>
              <Input
                id="column-title"
                placeholder="e.g. Team, Project, Customer ID"
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
                className="h-9 text-sm bg-background border-border focus:border-primary focus:ring-primary"
              />
            </div>

            <div className="flex-1">
              <Label htmlFor="column-type" className="text-xs font-medium text-foreground mb-1.5 block">
                Column Type
              </Label>
              <Select value={newColumnType} onValueChange={(value) => setNewColumnType(value as CustomColumn["type"])}>
                <SelectTrigger id="column-type" className="h-9 text-sm bg-background border-border focus:border-primary focus:ring-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[10000]">
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleAddColumn}
              disabled={!newColumnTitle.trim() || isCreating}
              className="h-9 px-5 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg"
            >
              {isCreating ? "Adding..." : "Add Column"}
            </Button>
          </div>
        </div>

        {/* Existing Columns Section - SECOND */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">
            Existing Custom Columns ({columns.length})
          </h3>
          {columns.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-border rounded-lg">
              <p className="text-sm text-muted-foreground">
                No custom columns added yet. Create your first column above.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1 scrollbar-thin">
              {columns.map((column) => (
                <div
                  key={column.id}
                  className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${getColumnIconBgColor(column.type)} rounded-lg flex items-center justify-center text-white text-lg`}>
                      {getColumnTypeIcon(column.type)}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">{column.title}</div>
                      <div className="text-xs text-muted-foreground">Type: {column.type.charAt(0).toUpperCase() + column.type.slice(1)}</div>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        await updateColumnGraphQL({ 
                          id: column.id, 
                          updates: { visible: !column.visible } 
                        })
                      } catch (error) {
                        console.error('Error toggling column visibility:', error)
                      }
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      column.visible !== false ? 'bg-success' : 'bg-border'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-background border border-muted-foreground transition-transform ${
                        column.visible !== false ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  )

  // Use portal to render at document body level
  if (typeof document !== 'undefined') {
    return createPortal(dropdownContent, document.body)
  }
  
  // Fallback for SSR
  return dropdownContent
}
