"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"

// Base skeleton component
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted/50 dark:bg-muted/20",
        className
      )}
      {...props}
    />
  )
}

// User avatar skeleton
export function UserAvatarSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="space-y-1">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-2 w-14" />
      </div>
    </div>
  )
}

// Table skeleton
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-8 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

// Card skeleton
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-24" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-8 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 flex-1" />
        </div>
      </CardContent>
    </Card>
  )
}

// Team card skeleton
export function TeamCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div className="space-y-1 flex-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <div className="flex -space-x-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="w-6 h-6 rounded-full border-2 border-background" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Ticket list skeleton
export function TicketListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-3 w-3/4" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-12 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              </div>
              <div className="space-y-2">
                <UserAvatarSkeleton />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Form skeleton
export function FormSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-32" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Users page skeleton
export function UsersPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-6 w-8" />
                </div>
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-24" />
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b">
            <div className="flex gap-4">
              {["User", "Role", "Department", "Status", "Actions"].map((header, i) => (
                <Skeleton key={i} className="h-4 flex-1" />
              ))}
            </div>
          </div>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="p-4 border-b last:border-0 flex gap-4">
              <div className="flex items-center gap-2 flex-1">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-2 w-32" />
                </div>
              </div>
              <div className="flex-1">
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <div className="flex-1">
                <Skeleton className="h-3 w-20" />
              </div>
              <div className="flex-1">
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
              <div className="flex-1 flex gap-2">
                <Skeleton className="h-6 w-6" />
                <Skeleton className="h-6 w-6" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

// Team management skeleton
export function TeamManagementSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-9 w-28" />
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <TeamCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}