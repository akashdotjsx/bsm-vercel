"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCustomColumnsStore, CustomColumn } from "@/lib/stores/custom-columns-store"
import { Plus, Trash2, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface CustomColumnsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CustomColumnsDialog({ open, onOpenChange }: CustomColumnsDialogProps) {
  const { columns, addColumn, removeColumn, updateColumn } = useCustomColumnsStore()
  
  const [newColumnTitle, setNewColumnTitle] = useState("")
  const [newColumnType, setNewColumnType] = useState<CustomColumn["type"]>("text")
  const [newColumnOptions, setNewColumnOptions] = useState<string[]>([])
  const [optionInput, setOptionInput] = useState("")

  const handleAddColumn = () => {
    if (!newColumnTitle.trim()) return

    addColumn({
      title: newColumnTitle.trim(),
      type: newColumnType,
      options: (newColumnType === "select" || newColumnType === "multiselect") ? newColumnOptions : undefined,
    })

    // Reset form
    setNewColumnTitle("")
    setNewColumnType("text")
    setNewColumnOptions([])
    setOptionInput("")
  }

  const handleAddOption = () => {
    if (!optionInput.trim()) return
    setNewColumnOptions([...newColumnOptions, optionInput.trim()])
    setOptionInput("")
  }

  const handleRemoveOption = (index: number) => {
    setNewColumnOptions(newColumnOptions.filter((_, i) => i !== index))
  }

  const handleRemoveColumn = (columnId: string) => {
    if (confirm("Are you sure you want to remove this column? All data will be lost.")) {
      removeColumn(columnId)
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[380px] rounded-2xl p-0 max-h-[85vh] flex flex-col overflow-hidden">
        <div className="p-6 pb-4 border-b border-border flex-shrink-0">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-xl font-semibold text-foreground">Manage Custom Columns</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Add custom columns to your ticket table. Values are stored in the database and persist across sessions.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 scrollbar-thin">
          <div className="space-y-6">
          {/* Add New Column Form - FIRST */}
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
                  className="h-9 text-sm"
                />
              </div>

              <div className="flex-1">
                <Label htmlFor="column-type" className="text-xs font-medium text-foreground mb-1.5 block">
                  Column Type
                </Label>
                <Select value={newColumnType} onValueChange={(value) => setNewColumnType(value as CustomColumn["type"])}>
                  <SelectTrigger id="column-type" className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="select">Select (Dropdown)</SelectItem>
                    <SelectItem value="multiselect">Multi-select</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleAddColumn}
                disabled={!newColumnTitle.trim()}
                className="h-9 px-5 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg"
              >
                Add Column
              </Button>
            </div>

            {/* Options for Select/Multi-select */}
            {(newColumnType === "select" || newColumnType === "multiselect") && (
              <div className="space-y-2">
                <Label className="text-xs font-medium text-foreground">Options</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add option..."
                    value={optionInput}
                    onChange={(e) => setOptionInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleAddOption()
                      }
                    }}
                    className="h-9 text-sm"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddOption}
                    className="h-9 px-3"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {newColumnOptions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {newColumnOptions.map((option, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-xs flex items-center gap-1"
                      >
                        {option}
                        <button
                          onClick={() => handleRemoveOption(index)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Existing Columns Section - SECOND */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">
              Existing Custom Columns ({columns.length})
            </h3>
            {columns.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8 border border-dashed border-border rounded-lg">
                No custom columns added yet. Create your first column above.
              </p>
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
                      onClick={() => {
                        // Toggle visibility
                        updateColumn({ id: column.id, visible: column.visible !== false ? false : true })
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
      </DialogContent>
    </Dialog>
  )
}
