"use client"

import React from 'react'
import { cn } from '@/lib/utils'

interface Assignee {
  id: string
  name: string
  avatar: string
  avatar_url?: string
  display_name?: string
  first_name?: string
  last_name?: string
}

interface MultiAssigneeAvatarsProps {
  assignees: Assignee[]
  maxDisplay?: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: {
    avatar: 'h-6 w-6 text-[9px]',
    badge: 'h-6 w-6 text-[9px]'
  },
  md: {
    avatar: 'h-8 w-8 text-xs',
    badge: 'h-8 w-8 text-xs'
  },
  lg: {
    avatar: 'h-10 w-10 text-sm',
    badge: 'h-10 w-10 text-sm'
  }
}

export function MultiAssigneeAvatars({
  assignees,
  maxDisplay = 3,
  size = 'sm',
  className
}: MultiAssigneeAvatarsProps) {
  if (!assignees || assignees.length === 0) {
    return (
      <div
        className={cn(
          'rounded-full bg-muted flex items-center justify-center text-muted-foreground font-medium',
          sizeClasses[size].avatar
        )}
        title="Unassigned"
      >
        ?
      </div>
    )
  }

  const displayedAssignees = assignees.slice(0, maxDisplay)
  const remainingCount = assignees.length - maxDisplay

  // Get display name for assignee
  const getDisplayName = (assignee: Assignee) => {
    return assignee.display_name || 
           assignee.name || 
           `${assignee.first_name || ''} ${assignee.last_name || ''}`.trim()
  }

  // Get initials for avatar
  const getInitials = (assignee: Assignee) => {
    if (assignee.avatar) return assignee.avatar
    
    const name = getDisplayName(assignee)
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  return (
    <div className={cn('flex items-center -space-x-2', className)}>
      {displayedAssignees.map((assignee, index) => (
        <div
          key={assignee.id || index}
          className={cn(
            'rounded-full bg-[#6E72FF] flex items-center justify-center text-white font-medium ring-2 ring-background',
            sizeClasses[size].avatar
          )}
          title={getDisplayName(assignee)}
          style={{ zIndex: maxDisplay - index }}
        >
          {assignee.avatar_url ? (
            <img
              src={assignee.avatar_url}
              alt={getDisplayName(assignee)}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            getInitials(assignee)
          )}
        </div>
      ))}
      
      {remainingCount > 0 && (
        <div
          className={cn(
            'rounded-full bg-muted flex items-center justify-center text-muted-foreground font-semibold ring-2 ring-background',
            sizeClasses[size].badge
          )}
          title={`+${remainingCount} more assignee${remainingCount > 1 ? 's' : ''}`}
          style={{ zIndex: 0 }}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  )
}
