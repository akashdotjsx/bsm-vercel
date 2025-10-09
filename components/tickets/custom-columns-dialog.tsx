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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Custom Columns</DialogTitle>
          <DialogDescription>
            Add custom columns to your ticket table. Values are stored locally and persist across sessions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add New Column Form */}
          <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/20">
            <h3 className="text-sm font-semibold">Add New Column</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="column-title" className="text-xs">
                  Column Title
                </Label>
                <Input
                  id="column-title"
                  placeholder="e.g., Team, Project, Customer ID"
                  value={newColumnTitle}
                  onChange={(e) => setNewColumnTitle(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="column-type" className="text-xs">
                  Column Type
                </Label>
                <Select value={newColumnType} onValueChange={(value) => setNewColumnType(value as CustomColumn["type"])}>
                  <SelectTrigger id="column-type" className="h-8 text-xs">
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
            </div>

            {/* Options for Select/Multi-select */}
            {(newColumnType === "select" || newColumnType === "multiselect") && (
              <div className="space-y-2">
                <Label className="text-xs">Options</Label>
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
                    className="h-8 text-xs"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddOption}
                    className="h-8 text-xs"
                  >
                    <Plus className="h-3 w-3" />
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

            <Button
              onClick={handleAddColumn}
              disabled={!newColumnTitle.trim()}
              className="w-full h-8 text-xs"
            >
              <Plus className="h-3 w-3 mr-2" />
              Add Column
            </Button>
          </div>

          {/* Existing Columns List */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Existing Custom Columns ({columns.length})</h3>
            {columns.length === 0 ? (
              <p className="text-xs text-muted-foreground p-4 text-center border border-dashed border-border rounded-lg">
                No custom columns added yet. Create your first column above.
              </p>
            ) : (
              <div className="space-y-2">
                {columns.map((column) => (
                  <div
                    key={column.id}
                    className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">{column.title}</span>
                        <Badge variant="outline" className="text-[10px] h-5">
                          {column.type}
                        </Badge>
                      </div>
                      {column.options && column.options.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {column.options.slice(0, 3).map((option, idx) => (
                            <Badge key={idx} variant="secondary" className="text-[10px] h-4">
                              {option}
                            </Badge>
                          ))}
                          {column.options.length > 3 && (
                            <Badge variant="secondary" className="text-[10px] h-4">
                              +{column.options.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveColumn(column.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="text-xs h-8">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
