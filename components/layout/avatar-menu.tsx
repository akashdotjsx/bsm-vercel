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
  MoreHorizontal
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CustomMenuItem, CustomMenuSeparator } from "@/components/ui/custom-menu"
import { useAuth } from "@/lib/contexts/auth-context"
import { useIsMobile } from "@/hooks/use-mobile"

// Status options from the main-components reference
const statusOptions = [
  { id: "online", label: "Online", color: "bg-green-500", description: "Available for work" },
  { id: "busy", label: "Busy", color: "bg-red-500", description: "In a meeting" },
  { id: "away", label: "Away", color: "bg-yellow-500", description: "Stepping out" },
  { id: "dnd", label: "Do Not Disturb", color: "bg-red-600", description: "Focus time" },
  { id: "offline", label: "Appear Offline", color: "bg-gray-400", description: "Not available" },
]

interface AvatarMenuProps {
  className?: string
}

export function AvatarMenu({ className }: AvatarMenuProps) {
  const router = useRouter()
  const isMobile = useIsMobile()
  const { user, profile, organization, signOut, loading } = useAuth()
  const [userStatus, setUserStatus] = useState("online")
  const [customStatus, setCustomStatus] = useState("")
  const [isEditingStatus, setIsEditingStatus] = useState(false)
  const [localTime, setLocalTime] = useState("")

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
      <div className="w-8 h-8 bg-muted animate-pulse rounded-full" />
    )
  }

  // Format user data from profile
  const userData = {
    name: profile ? `${profile.first_name} ${profile.last_name}`.trim() : user?.email || 'User',
    email: user?.email || '',
    account: organization?.name || 'Personal Account',
    id: profile?.id?.slice(-8) || 'N/A',
    plan: organization?.subscription_tier || 'Free',
    role: profile?.role === 'admin' ? 'System Admin' : profile?.role === 'manager' ? 'Org Admin' : profile?.role || 'User',
    initials: profile ? 
      `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase() :
      user?.email?.split('@')[0]?.slice(0, 2)?.toUpperCase() || 'U'
  }

  const currentStatusData = statusOptions.find(s => s.id === userStatus) || statusOptions[0]
  const isAdmin = profile?.role === 'admin' || profile?.role === 'manager'
  const isDemoAccount = organization?.name?.includes('Demo') || false

  const handleLogout = async () => {
    await signOut()
    router.push('/auth/login')
  }

  const handleSettingsClick = () => {
    router.push("/settings")
  }

  const handleProfileClick = () => {
    router.push("/profile")
  }

  const handleStatusChange = (statusId: string) => {
    setUserStatus(statusId)
    // Here you would typically update the status in your backend
    console.log('Status changed to:', statusId)
  }

  return (
    <DropdownMenu>
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
                <div className={`w-2 h-2 ${currentStatusData.color} rounded-full`}></div>
                <span className="text-sm font-medium text-foreground">{currentStatusData.label}</span>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-sm h-8 px-3 text-muted-foreground hover:text-foreground"
                >
                  Set a status
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {statusOptions.map((status) => (
                  <CustomMenuItem
                    key={status.id}
                    onClick={() => handleStatusChange(status.id)}
                    className="flex items-center gap-3 px-3 py-2"
                  >
                    <div className={`w-3 h-3 ${status.color} rounded-full`}></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{status.label}</div>
                      <div className="text-xs text-muted-foreground">{status.description}</div>
                    </div>
                    {userStatus === status.id && (
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                    )}
                  </CustomMenuItem>
                ))}
                <CustomMenuSeparator />
                <CustomMenuItem className="flex items-center gap-3 px-3 py-2">
                  <Sparkles className="w-3 h-3" />
                  <span className="text-sm">Set custom status...</span>
                </CustomMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
  )
}