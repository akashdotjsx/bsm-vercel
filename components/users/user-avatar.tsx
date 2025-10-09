"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
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

interface UserAvatarProps {
  user: User
  size?: "sm" | "md" | "lg"
  showName?: boolean
  showRole?: boolean
  showDepartment?: boolean
  showStatus?: boolean
  className?: string
}

export function UserAvatar({ 
  user, 
  size = "md", 
  showName = false, 
  showRole = false,
  showDepartment = false,
  showStatus = false,
  className 
}: UserAvatarProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8", 
    lg: "h-10 w-10"
  }

  const textSizes = {
    sm: "text-[10px]",
    md: "text-[11px]",
    lg: "text-sm"
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

  const getDisplayName = (user: User) => {
    if (user.display_name) return user.display_name
    if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`
    if (user.first_name) return user.first_name
    return user.email
  }

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin': return 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 border-0'
      case 'manager': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border-0'
      case 'agent': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 border-0'
      default: return 'bg-muted text-foreground dark:bg-gray-800 dark:text-gray-300 border-0'
    }
  }

  const getAvatarGradient = (user: User) => {
    // Create a deterministic gradient based on user ID or email
    const hash = user.id.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)
    
    const gradients = [
      'from-blue-500 via-purple-500 to-pink-500',
      'from-emerald-500 via-teal-500 to-cyan-500',
      'from-orange-500 via-red-500 to-pink-500',
      'from-indigo-500 via-purple-500 to-blue-500',
      'from-green-500 via-emerald-500 to-teal-500',
      'from-rose-500 via-pink-500 to-purple-500',
      'from-amber-500 via-orange-500 to-red-500',
      'from-violet-500 via-purple-500 to-indigo-500',
    ]
    
    return gradients[Math.abs(hash) % gradients.length]
  }

  if (showName || showRole || showDepartment) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="relative">
          <Avatar className={sizeClasses[size]}>
            <AvatarImage src={user.avatar_url} alt={getDisplayName(user)} />
            <AvatarFallback className={cn(
              "font-medium text-white bg-gradient-to-br transition-all duration-200",
              getAvatarGradient(user)
            )}>
              {getInitials(user)}
            </AvatarFallback>
          </Avatar>
          {showStatus && (
            <div className={cn(
              "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background transition-colors",
              user.is_active ? "bg-emerald-500 dark:bg-emerald-400" : "bg-gray-400 dark:bg-gray-500"
            )} />
          )}
        </div>
        <div className="flex flex-col min-w-0">
          {showName && (
            <span className={cn("font-medium text-foreground truncate", textSizes[size])}>
              {getDisplayName(user)}
            </span>
          )}
          <div className="flex items-center gap-1.5 flex-wrap">
            {showRole && (
              <Badge 
                variant="outline" 
                className={cn("text-[9px] px-1.5 py-0.5 capitalize font-medium", getRoleColor(user.role))}
              >
                {user.role}
              </Badge>
            )}
            {showDepartment && user.department && (
              <span className={cn("text-muted-foreground text-[9px] truncate font-medium")}>
                • {user.department}
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("relative", className)}>
      <Avatar className={sizeClasses[size]}>
        <AvatarImage src={user.avatar_url} alt={getDisplayName(user)} />
        <AvatarFallback className={cn(
          "font-medium text-white bg-gradient-to-br transition-all duration-200",
          getAvatarGradient(user)
        )}>
          {getInitials(user)}
        </AvatarFallback>
      </Avatar>
      {showStatus && (
        <div className={cn(
          "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background transition-colors",
          user.is_active ? "bg-emerald-500 dark:bg-emerald-400" : "bg-gray-400 dark:bg-gray-500"
        )} />
      )}
    </div>
  )
}