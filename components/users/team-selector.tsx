"use client"

import { useState } from "react"
import { Check, ChevronsUpDown, Users as UsersIcon, UserPlus, X } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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

interface Team {
  id: string
  name: string
  description?: string
  department?: string
  is_active: boolean
  lead_id?: string
  team_members?: Array<{
    user: User
    role: string
  }>
}

interface TeamSelectorProps {
  teams: Team[]
  users: User[]
  selectedUserIds: string[]
  onUsersChange: (userIds: string[]) => void
  placeholder?: string
  emptyText?: string
  className?: string
  disabled?: boolean
  showOnlyActive?: boolean
}

export function TeamSelector({
  teams,
  users,
  selectedUserIds,
  onUsersChange,
  placeholder = "Select team or users...",
  emptyText = "No teams or users found",
  className,
  disabled = false,
  showOnlyActive = true,
}: TeamSelectorProps) {
  const [open, setOpen] = useState(false)

  // Filter teams and users based on criteria
  const filteredTeams = teams.filter(team => showOnlyActive ? team.is_active : true)
  const filteredUsers = users.filter(user => showOnlyActive ? user.is_active : true)

  const getDisplayName = (user: User) => {
    if (user.display_name) return user.display_name
    if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`
    if (user.first_name) return user.first_name
    return user.email
  }

  const handleTeamSelect = (team: Team) => {
    // Get all user IDs from team members
    const teamUserIds = team.team_members?.map(member => member.user.id) || []
    
    // Check if all team members are already selected
    const allMembersSelected = teamUserIds.every(id => selectedUserIds.includes(id))
    
    if (allMembersSelected && teamUserIds.length > 0) {
      // If all members are selected, deselect them
      const newSelectedIds = selectedUserIds.filter(id => !teamUserIds.includes(id))
      onUsersChange(newSelectedIds)
    } else {
      // Add team members to selection (avoiding duplicates)
      const newSelectedIds = Array.from(new Set([...selectedUserIds, ...teamUserIds]))
      onUsersChange(newSelectedIds)
    }
    setOpen(false)
  }

  const handleUserSelect = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      // Remove user
      onUsersChange(selectedUserIds.filter(id => id !== userId))
    } else {
      // Add user
      onUsersChange([...selectedUserIds, userId])
    }
  }

  const removeUser = (userId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onUsersChange(selectedUserIds.filter(id => id !== userId))
  }

  const getInitials = (user: User) => {
    if (user.display_name) {
      return user.display_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    }
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
    }
    if (user.first_name) {
      return user.first_name.substring(0, 2).toUpperCase()
    }
    return user.email.substring(0, 2).toUpperCase()
  }

  const selectedUsers = filteredUsers.filter(user => selectedUserIds.includes(user.id))

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between min-h-[2.5rem] hover:bg-muted/50 transition-colors", className)}
          disabled={disabled}
        >
          <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
            {selectedUsers.length === 0 ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <UsersIcon className="h-4 w-4" />
                {placeholder}
              </div>
            ) : selectedUsers.length <= 2 ? (
              selectedUsers.map(user => (
                <div key={user.id} className="flex items-center gap-1.5 bg-accent/50 dark:bg-accent/70 rounded-full px-2 py-1 hover:bg-accent/70 dark:hover:bg-accent/90 transition-colors group">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={user.avatar_url} alt={getDisplayName(user)} />
                    <AvatarFallback className="text-[8px] font-medium bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white">
                      {getInitials(user)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-[10px] font-medium text-foreground max-w-[100px] truncate">
                    {getDisplayName(user)}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-3 w-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20 hover:text-destructive"
                    onClick={(e) => removeUser(user.id, e)}
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </div>
              ))
            ) : selectedUsers.length <= 5 ? (
              <div className="flex items-center gap-1">
                <div className="flex -space-x-2">
                  {selectedUsers.slice(0, 4).map((user) => (
                    <Avatar key={user.id} className="h-6 w-6 border-2 border-background">
                      <AvatarImage src={user.avatar_url} alt={getDisplayName(user)} />
                      <AvatarFallback className="text-[8px] font-medium bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white">
                        {getInitials(user)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {selectedUsers.length > 4 && (
                    <div className="h-6 w-6 rounded-full border-2 border-background bg-muted dark:bg-muted/70 flex items-center justify-center text-[8px] font-medium text-muted-foreground">
                      +{selectedUsers.length - 4}
                    </div>
                  )}
                </div>
                <span className="text-[10px] font-medium text-muted-foreground ml-2">
                  {selectedUsers.length} selected
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex -space-x-1.5">
                  {selectedUsers.slice(0, 3).map((user) => (
                    <Avatar key={user.id} className="h-5 w-5 border border-background">
                      <AvatarImage src={user.avatar_url} alt={getDisplayName(user)} />
                      <AvatarFallback className="text-[7px] font-medium bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white">
                        {getInitials(user)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  <div className="h-5 w-5 rounded-full border border-background bg-primary dark:bg-primary/90 flex items-center justify-center text-[7px] font-bold text-primary-foreground">
                    +{selectedUsers.length - 3}
                  </div>
                </div>
                <span className="text-[11px] font-medium text-foreground">
                  {selectedUsers.length} users selected
                </span>
              </div>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[380px] p-0" side="bottom" align="start">
        <Command>
          <CommandInput placeholder="Search teams or users..." className="h-9" />
          <CommandList className="max-h-[300px]">
            <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">{emptyText}</CommandEmpty>
            
            {/* Teams Section - Always shown first */}
            {filteredTeams.length > 0 && (
              <CommandGroup heading="🏢 Teams (Select all members)">
                {filteredTeams.map((team) => {
                  const teamUserIds = team.team_members?.map(member => member.user.id) || []
                  const allMembersSelected = teamUserIds.length > 0 && teamUserIds.every(id => selectedUserIds.includes(id))
                  const someMembersSelected = teamUserIds.some(id => selectedUserIds.includes(id))
                  
                  return (
                    <CommandItem
                      key={`team-${team.id}`}
                      onSelect={() => handleTeamSelect(team)}
                      className={cn(
                        "flex items-start justify-between cursor-pointer p-3 hover:bg-accent/50 dark:hover:bg-accent/70 transition-colors",
                        allMembersSelected && "bg-primary/10 dark:bg-primary/20 border-l-2 border-primary",
                        someMembersSelected && !allMembersSelected && "bg-amber-50 dark:bg-amber-950/20 border-l-2 border-amber-400"
                      )}
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={cn(
                          "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                          allMembersSelected 
                            ? "bg-primary text-primary-foreground" 
                            : someMembersSelected 
                              ? "bg-amber-500 text-white" 
                              : "bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 text-white"
                        )}>
                          {allMembersSelected ? (
                            <Check className="h-4 w-4" />
                          ) : someMembersSelected ? (
                            <UsersIcon className="h-4 w-4" />
                          ) : (
                            <UsersIcon className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-[12px] text-foreground truncate">{team.name}</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {team.team_members?.length || 0} members
                            {team.department && ` • ${team.department}`}
                            {allMembersSelected && " • All selected"}
                            {someMembersSelected && !allMembersSelected && " • Partially selected"}
                          </div>
                          {team.team_members && team.team_members.length > 0 && (
                            <div className="flex -space-x-1 mt-2">
                              {team.team_members.slice(0, 4).map((member) => (
                                <Avatar key={member.user.id} className={cn(
                                  "h-5 w-5 border border-background",
                                  selectedUserIds.includes(member.user.id) && "ring-2 ring-primary ring-offset-1"
                                )}>
                                  <AvatarImage src={member.user.avatar_url} alt={getDisplayName(member.user)} />
                                  <AvatarFallback className="text-[7px] font-medium bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
                                    {getInitials(member.user)}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                              {(team.team_members?.length || 0) > 4 && (
                                <div className="h-5 w-5 rounded-full border border-background bg-muted dark:bg-muted/70 flex items-center justify-center text-[7px] font-medium text-muted-foreground">
                                  +{(team.team_members?.length || 0) - 4}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        {allMembersSelected ? (
                          <Check className="h-4 w-4 text-primary" />
                        ) : someMembersSelected ? (
                          <div className="h-4 w-4 rounded-full bg-amber-400 flex items-center justify-center">
                            <div className="h-2 w-2 rounded-full bg-white" />
                          </div>
                        ) : (
                          <UserPlus className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="text-[8px] text-muted-foreground">
                          {allMembersSelected ? 'Selected' : someMembersSelected ? 'Partial' : 'Select'}
                        </span>
                      </div>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )}

            {/* Users Section */}
            <CommandGroup heading="👤 Individual Users">
              {filteredUsers.map((user) => {
                const isSelected = selectedUserIds.includes(user.id)
                return (
                  <CommandItem
                    key={`user-${user.id}`}
                    onSelect={() => handleUserSelect(user.id)}
                    className={cn(
                      "flex items-center justify-between cursor-pointer p-3 hover:bg-accent/50 dark:hover:bg-accent/70 transition-colors",
                      isSelected && "bg-accent/30 dark:bg-accent/50"
                    )}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="relative">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={user.avatar_url} alt={getDisplayName(user)} />
                          <AvatarFallback className="text-[9px] font-medium bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white">
                            {getInitials(user)}
                          </AvatarFallback>
                        </Avatar>
                        <div className={cn(
                          "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-background",
                          user.is_active ? "bg-emerald-500 dark:bg-emerald-400" : "bg-gray-400 dark:bg-gray-500"
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-[11px] text-foreground truncate">{getDisplayName(user)}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-[8px] px-1.5 py-0.5 capitalize border-0",
                              user.role === 'admin' && "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
                              user.role === 'manager' && "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300", 
                              user.role === 'agent' && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
                              !['admin', 'manager', 'agent'].includes(user.role) && "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                            )}
                          >
                            {user.role}
                          </Badge>
                          {user.department && (
                            <span className="text-[9px] text-muted-foreground truncate">
                              {user.department}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Check
                      className={cn(
                        "h-4 w-4 text-primary",
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