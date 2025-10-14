"use client"

import { useState } from "react"
import { Check, ChevronsUpDown, User as UserIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { UserAvatar } from "./user-avatar"
import { cn } from "@/lib/utils"

interface User {
  id: string
  first_name?: string
  last_name?: string
  display_name?: string
  email: string
  role: string
  department?: string
  is_active: boolean
  avatar_url?: string
}

interface UserSelectorProps {
  users: User[]
  value?: string
  onValueChange: (userId: string) => void
  placeholder?: string
  emptyText?: string
  className?: string
  disabled?: boolean
  showOnlyActive?: boolean
  filterByRole?: string[]
  filterByDepartment?: string[]
}

export function UserSelector({
  users,
  value,
  onValueChange,
  placeholder = "Select user...",
  emptyText = "No users found",
  className,
  disabled = false,
  showOnlyActive = true,
  filterByRole,
  filterByDepartment,
}: UserSelectorProps) {
  const [open, setOpen] = useState(false)

  // Filter users based on criteria
  const filteredUsers = users.filter(user => {
    if (showOnlyActive && !user.is_active) return false
    if (filterByRole && !filterByRole.includes(user.role)) return false
    if (filterByDepartment && user.department && !filterByDepartment.includes(user.department)) return false
    return true
  })

  const selectedUser = filteredUsers.find(user => user.id === value)

  const getDisplayName = (user: User) => {
    if (user.display_name) return user.display_name
    if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`
    if (user.first_name) return user.first_name
    return user.email
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between", className)}
          disabled={disabled}
        >
          {selectedUser ? (
            <UserAvatar 
              user={selectedUser} 
              size="sm" 
              showName 
              showRole 
              className="max-w-[200px]"
            />
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <UserIcon className="h-4 w-4" />
              {placeholder}
            </div>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[350px] p-0" side="bottom" align="start">
        <Command>
          <CommandInput placeholder="Search users..." className="h-9" />
          <CommandList className="max-h-[250px]">
            <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">{emptyText}</CommandEmpty>
            <CommandGroup>
              {filteredUsers.map((user) => {
                const isSelected = value === user.id
                return (
                  <CommandItem
                    key={user.id}
                    value={user.id}
                    onSelect={(currentValue) => {
                      onValueChange(currentValue === value ? "" : currentValue)
                      setOpen(false)
                    }}
                    className={cn(
                      "flex items-center justify-between cursor-pointer p-3 hover:bg-accent/50 dark:hover:bg-accent/70 transition-colors",
                      isSelected && "bg-accent/30 dark:bg-accent/50"
                    )}
                  >
                    <UserAvatar 
                      user={user} 
                      size="sm" 
                      showName 
                      showRole 
                      showDepartment
                      showStatus
                      className="flex-1 min-w-0"
                    />
                    <Check
                      className={cn(
                        "ml-2 h-4 w-4 text-primary",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}