"use client"

import { Sun, Moon, HelpCircle, ChevronDown, User, Lock, RefreshCw, Settings, LogOut, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useTheme } from "next-themes"
import Image from "next/image"
import { useState } from "react"
import { useNotifications } from "@/lib/contexts/notification-context"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { GlobalSearch } from "@/components/search/global-search"
import { useRouter } from "next/navigation"
import { useIsMobile } from "@/hooks/use-mobile"
import { useAuth } from "@/lib/contexts/auth-context"

export function GlobalHeader() {
  const { theme, setTheme } = useTheme()
  const [userStatus, setUserStatus] = useState("Online")
  const { notifications } = useNotifications()
  const router = useRouter()
  const isMobile = useIsMobile()
  const { user, profile, organization, signOut, loading } = useAuth()

  // Format user data from profile
  const userData = {
    name: profile ? `${profile.first_name} ${profile.last_name}` : user?.email || 'User',
    email: user?.email || '',
    account: organization?.name || 'Organization',
    id: profile?.id?.slice(-8) || 'N/A',
    plan: organization?.subscription_tier || 'Basic',
    role: profile?.role === 'admin' ? 'System Admin' : profile?.role === 'manager' ? 'Org Admin' : profile?.role || 'User',
    localTime: new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }),
  }

  const isAdmin = profile?.role === 'admin' || profile?.role === 'manager'

  const handleLogout = async () => {
    try {
      await signOut()
      router.push('/auth/login')
    } catch (error) {
      console.error('Error during logout:', error)
    }
  }

  const handleSettingsClick = () => {
    router.push("/settings")
  }

  return (
    <header className="h-12 md:h-14 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center px-4 md:px-6 gap-3 md:gap-6 fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center gap-2">
        <Image
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Kroolo%20Logo-kuyVfAB5iW8WooZbrbQmPXSHHTVv6Q.png"
          alt="Kroolo"
          width={isMobile ? 80 : 100}
          height={isMobile ? 22 : 28}
          className={`${isMobile ? "h-5" : "h-7"} w-auto`}
        />
      </div>

      <div className="hidden sm:block flex-1">
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {!isMobile && (
          <Button variant="ghost" size="sm" className="h-8 px-2">
            <div className="w-4 h-4 text-pink-500">✦</div>
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={`${isMobile ? "h-8 px-2 text-xs" : "h-8 px-3 text-[13px]"} font-medium`}
            >
              {isMobile ? "Kroolo" : "Kroolo Enterprise"}
              <ChevronDown className="ml-1 h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Kroolo Enterprise</DropdownMenuItem>
            <DropdownMenuItem>Switch Organization</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="h-8 w-8 p-0"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        {!isMobile && (
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <HelpCircle className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </Button>
        )}

        <NotificationBell notifications={notifications} />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800/50"
            >
              <Avatar className={`${isMobile ? "h-6 w-6" : "h-7 w-7"}`}>
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-[10px] md:text-[11px] font-semibold">
                  {userData.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className={`${isMobile ? "w-64" : "w-72"} p-0 border border-gray-100 dark:border-gray-100/10 shadow-lg dark:shadow-2xl bg-white dark:bg-gray-900`}
          >
            <div className="p-4 bg-gray-50/50 dark:bg-gray-800/30 border-b border-gray-100 dark:border-gray-100/10">
              <div className="flex items-center gap-3">
                <Avatar className={`${isMobile ? "h-10 w-10" : "h-12 w-12"} ring-2 ring-white dark:ring-gray-700`}>
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-semibold">
                    {userData.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[14px] md:text-[15px] text-gray-900 dark:text-white truncate">
                    {userData.name}
                  </div>
                  <div className="text-[12px] md:text-[13px] text-gray-500 dark:text-gray-400 truncate">
                    {userData.email}
                  </div>
                  <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{userData.role}</div>
                </div>
              </div>
            </div>

            <div className="p-3 border-b border-gray-100 dark:border-gray-100/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-2 py-1 bg-green-50 dark:bg-green-900/20 rounded-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-[12px] font-medium text-green-700 dark:text-green-400">{userStatus}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[11px] h-6 px-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Set status
                </Button>
              </div>
            </div>

            <div className="p-3 space-y-2 border-b border-gray-100 dark:border-gray-100/10 bg-gray-50/30 dark:bg-gray-800/20">
              <div className="flex items-center gap-2 text-[12px]">
                <Clock className="h-3 w-3 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">{userData.localTime} local time</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[12px]">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Account</span>
                  <div className="font-medium text-gray-900 dark:text-white">{userData.account}</div>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">ID</span>
                  <div className="font-medium text-gray-900 dark:text-white">{userData.id}</div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-gray-500 dark:text-gray-400">Current Plan</span>
                <span className="text-[12px] font-semibold px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
                  {userData.plan}
                </span>
              </div>
            </div>

            <div className="p-2">
              <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 text-[13px] cursor-pointer rounded-md hover:bg-muted/50 transition-colors">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-gray-700 dark:text-gray-300">My Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 text-[13px] cursor-pointer rounded-md focus:bg-muted/50 hover:bg-muted/50 transition-colors">
                <Lock className="h-4 w-4 text-gray-500" />
                <span className="text-gray-700 dark:text-gray-300">Change Password</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 text-[13px] cursor-pointer rounded-md focus:bg-muted/50 hover:bg-muted/50 transition-colors">
                <RefreshCw className="h-4 w-4 text-gray-500" />
                <span className="text-gray-700 dark:text-gray-300">Switch Account</span>
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem
                  className="flex items-center gap-3 px-3 py-2 text-[13px] cursor-pointer rounded-md focus:bg-muted/50 hover:bg-muted/50 transition-colors"
                  onClick={handleSettingsClick}
                >
                  <Settings className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700 dark:text-gray-300">Settings</span>
                </DropdownMenuItem>
              )}

              <div className="my-2 border-t border-gray-100 dark:border-gray-100/10"></div>

              <DropdownMenuItem 
                className="flex items-center gap-3 px-3 py-2 text-[13px] cursor-pointer rounded-md hover:bg-destructive/10 transition-colors"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 text-red-500" />
                <span className="text-red-600 dark:text-red-400 font-medium">Log out</span>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
