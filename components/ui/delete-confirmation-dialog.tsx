"use client"

import { useState } from "react"
import { Trash2, X } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface DeleteConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void | Promise<void>
  title?: string
  description?: string
  itemName?: string
  requireCheckbox?: boolean
  checkboxLabel?: string
  isDeleting?: boolean
}

export function DeleteConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  title = "Delete Task",
  description = "Do you want to delete this task?",
  itemName,
  requireCheckbox = true,
  checkboxLabel = "Click to Agree",
  isDeleting = false,
}: DeleteConfirmationDialogProps) {
  const [isChecked, setIsChecked] = useState(false)

  const handleConfirm = async () => {
    if (requireCheckbox && !isChecked) return
    await onConfirm()
    setIsChecked(false)
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setIsChecked(false)
    }
    onOpenChange(newOpen)
  }

  const displayDescription = itemName
    ? `${description} "${itemName}"?`
    : description

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="bg-background border-border max-w-xl">
        <button
          onClick={() => handleOpenChange(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <AlertDialogHeader>
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex-shrink-0">
              <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <AlertDialogTitle className="text-foreground text-xl">
                {title}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground mt-2">
                {displayDescription}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        {requireCheckbox && (
          <div className="flex items-center space-x-3 py-4">
            <Checkbox
              id="delete-confirm"
              checked={isChecked}
              onCheckedChange={(checked) => setIsChecked(checked as boolean)}
              className="border-2 border-muted-foreground data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
            />
            <Label
              htmlFor="delete-confirm"
              className="text-base font-medium text-foreground cursor-pointer select-none"
            >
              {checkboxLabel}
            </Label>
          </div>
        )}

        <AlertDialogFooter className="gap-2 sm:gap-2">
          <AlertDialogCancel 
            className="border-border hover:bg-muted"
            disabled={isDeleting}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={(requireCheckbox && !isChecked) || isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white dark:bg-red-600 dark:hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
