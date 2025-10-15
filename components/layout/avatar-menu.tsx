"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  User, 
  Lock, 
  RefreshCw, 
  Settings, 
  LogOut, 
  Clock,
  ChevronDown,
  Sparkles,
  MoreHorizontal,
  Pencil
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
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
import { CustomMenuItem, CustomMenuSeparator } from "@/components/ui/custom-menu"
import { useAuth } from "@/lib/contexts/auth-context"
import { useIsMobile } from "@/hooks/use-mobile"

// Status options from the main-components reference
const statusOptions = [
  { key: "online", label: "Online", color: "#16a34a", description: "Available for work" },
  { key: "busy", label: "Busy", color: "#dc2626", description: "In a meeting" },
  { key: "away", label: "Away", color: "#eab308", description: "Stepping out" },
  { key: "dnd", label: "Do Not Disturb", color: "#dc2626", description: "Focus time" },
  { key: "offline", label: "Appear Offline", color: "#9ca3af", description: "Not available" },
  { key: "custom", label: "Custom Status", color: "#8b5cf6", description: "" },
]

interface AvatarMenuProps {
  className?: string
}

export function AvatarMenu({ className }: AvatarMenuProps) {
  const router = useRouter()
  const isMobile = useIsMobile()
  const { user, profile, organization, signOut, loading } = useAuth()
  const [status, setStatus] = useState({ label: "Online", color: "#16a34a" })
  const [customColor, setCustomColor] = useState("#8b5cf6")
  const [editCustom, setEditCustom] = useState(false)
  const [customInput, setCustomInput] = useState("")
  const [statusMenuOpen, setStatusMenuOpen] = useState(false)
  const [localTime, setLocalTime] = useState("")
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)

  // Update local time every minute
  useEffect(() => {
    const updateTime = () => {
      setLocalTime(new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }))
    }
    
    updateTime()
    const interval = setInterval(updateTime, 60000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-primary/30 animate-pulse rounded-full flex items-center justify-center">
        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // If no user is authenticated, redirect to login
  if (!user || !profile) {
    router.push('/auth/login')
    return null
  }

  // Format user data from profile
  const userData = {
    name: `${profile.first_name} ${profile.last_name}`.trim(),
    email: user.email,
    account: organization?.name || profile.department || 'Organization',
    id: profile.id?.slice(-8),
    plan: organization?.subscription_tier || 'Free',
    role: profile.role === 'admin' ? 'System Admin' : profile.role === 'manager' ? 'Org Admin' : profile.role || 'User',
    initials: `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase()
  }

  // Determine if current status is custom (i.e., not one of the predefined labels)
  const baseLabels = statusOptions.filter((o) => o.key !== "custom").map((o) => o.label)
  const isCustomSelected = !baseLabels.includes(status.label)
  const customDisplayLabel = isCustomSelected ? status.label : "Custom Status"
  
  const isAdmin = profile?.role === 'admin' || profile?.role === 'manager'
  const isDemoAccount = organization?.name?.includes('Demo') || false

  const handleLogout = () => {
    setShowLogoutDialog(true)
  }

  const confirmLogout = async () => {
    await signOut()
    router.push('/auth/login')
  }

  const handleSettingsClick = () => {
    router.push("/settings")
  }

  const handleProfileClick = () => {
    router.push("/profile")
  }

  const handleSaveCustomStatus = () => {
    if (customInput.trim()) {
      setStatus({ label: customInput.trim(), color: customColor })
      setEditCustom(false)
      setCustomInput("")
      setStatusMenuOpen(false)
    }
  }

  return (
    <>
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="bg-background border-border">
          <AlertDialogHeader>
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20">
                <LogOut className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <AlertDialogTitle className="text-foreground">Logout Session</AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground">
                  Are you sure you want to logout?
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border hover:bg-muted">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmLogout}
              className="bg-red-600 hover:bg-red-700 text-white dark:bg-red-600 dark:hover:bg-red-700"
            >
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 rounded-full hover:bg-muted/50 dark:hover:bg-gray-800/50"
        >
          <Avatar className={`${isMobile ? "h-6 w-6" : "h-7 w-7"}`}>
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-[10px] md:text-[11px] font-semibold">
              {userData.initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent
        align="end"
        className="w-80 p-0 border border-border shadow-lg bg-popover text-popover-foreground rounded-lg"
      >
        {/* User Information Section */}
        <div className="p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-gradient-to-br from-amber-600 to-amber-700 text-white text-[11px] font-semibold">
                {userData.initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-[11px] text-foreground truncate">
                {userData.name}
              </div>
              <div className="text-sm text-muted-foreground truncate">
                {userData.email}
              </div>
            </div>
          </div>
        </div>

        {/* Status Section */}
        <div className="px-4 pb-3 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Status:</span>
              <div className="flex items-center gap-1">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: status.color }}
                ></div>
                <span className="text-sm font-medium text-foreground">{status.label}</span>
              </div>
            </div>
            
            {/* Keep popover open until an explicit click (outside or option) */}
            <Popover open={statusMenuOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-sm h-8 px-3 text-muted-foreground hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation()
                    setStatusMenuOpen(!statusMenuOpen)
                  }}
                >
                  Set a status
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                side="bottom"
                avoidCollisions={false}
                className="w-56 p-0 rounded-lg"
                sideOffset={8}
                onFocusOutside={(e: Event) => e.preventDefault()}
                onEscapeKeyDown={(e: KeyboardEvent) => e.preventDefault()}
                onPointerDownOutside={() => setStatusMenuOpen(false)}
              >
                <div className="py-1">
                  {statusOptions.map((opt) => (
                    <CustomMenuItem
                      key={opt.key}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (opt.key === "custom") return
                        setStatus({ label: opt.label, color: opt.color })
                        setEditCustom(false)
                        setStatusMenuOpen(false)
                      }}
                      className="flex items-center gap-2 cursor-pointer h-7 px-3 py-0"
                      style={{
                        backgroundColor: (opt.key === "custom" ? isCustomSelected : status.label === opt.label)
                          ? "var(--accent)"
                          : "transparent",
                      }}
                    >
                      <span
                        className="min-w-[10px] h-[10px] rounded-full"
                        style={{ backgroundColor: opt.key === "custom" ? customColor : opt.color }}
                      />
                      <span className="truncate text-sm">
                        {opt.key === "custom" ? customDisplayLabel : opt.label}
                      </span>
                      {opt.key === "custom" && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditCustom((v) => !v)
                          }}
                          className="ml-auto grid place-items-center rounded hover:bg-muted"
                          style={{ width: 20, height: 20 }}
                          aria-label="Edit custom status"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      )}
                    </CustomMenuItem>
                  ))}
                  
                  {editCustom && (
                    <div className="px-3 py-2 border-t">
                      <Input
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleSaveCustomStatus()
                          }
                        }}
                        placeholder="What's your status?"
                        className="text-sm h-8"
                        autoFocus
                      />
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          className="flex-1 h-7 text-xs"
                          onClick={handleSaveCustomStatus}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 h-7 text-xs"
                          onClick={() => {
                            setEditCustom(false)
                            setCustomInput("")
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Time Display */}
        <div className="px-4 pb-3 border-b border-border">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{localTime} local time</span>
          </div>
        </div>

        {/* Account Information Section */}
        <div className="px-4 pb-3 border-b border-border bg-muted/20">
          <div className="space-y-2">
            <div>
              <span className="text-sm text-muted-foreground">Account:</span>
              <div className="font-medium text-sm text-foreground mt-0.5">{userData.account}</div>
              {userData.id && (
                <div className="text-xs text-muted-foreground">ID: {userData.id}</div>
              )}
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Current Plan:</span>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge 
                  variant="secondary" 
                  className="text-xs font-semibold px-2 py-0.5 bg-primary/10 text-primary border-primary/20"
                >
                  {userData.plan}
                </Badge>
                {isDemoAccount && (
                  <Badge variant="outline" className="text-[8px] px-1 py-0 h-4">
                    Demo
                  </Badge>
                )}
              </div>
            </div>
            {userData.role && (
              <div>
                <span className="text-sm text-muted-foreground">Role:</span>
                <div className="text-sm font-medium text-foreground mt-0.5">{userData.role}</div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="py-1">
          <CustomMenuItem 
            onClick={handleProfileClick}
            className="flex items-center gap-3 px-4 py-2 text-sm cursor-pointer hover:bg-muted/50 transition-colors"
          >
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-foreground">My Profile</span>
          </CustomMenuItem>
          
          <CustomMenuItem className="flex items-center gap-3 px-4 py-2 text-sm cursor-pointer hover:bg-muted/50 transition-colors">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <span className="text-foreground">Change Password</span>
          </CustomMenuItem>
          
          <CustomMenuItem className="flex items-center gap-3 px-4 py-2 text-sm cursor-pointer hover:bg-muted/50 transition-colors">
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
            <span className="text-foreground">Switch Account</span>
          </CustomMenuItem>
          
          {isAdmin && (
            <CustomMenuItem
              onClick={handleSettingsClick}
              className="flex items-center gap-3 px-4 py-2 text-sm cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <Settings className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground">Settings</span>
            </CustomMenuItem>
          )}

          <CustomMenuSeparator className="my-1" />

          <CustomMenuItem 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2 text-sm cursor-pointer hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-4 w-4 text-red-500" />
            <span className="text-red-600 dark:text-red-400">Log out</span>
          </CustomMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
    </>
  )
}
