"use client"

import { Sun, Moon, User, Lock, Settings, LogOut, Clock, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Image from "next/image"
import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useIsMobile } from "@/hooks/use-mobile"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { getAvatarProps } from "@/lib/avatar-utils"

export function GlobalHeader() {
  const [theme, setTheme] = useState<string>("light")
  const [userStatus, setUserStatus] = useState("Online")
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false)
  const [organizationLogo, setOrganizationLogo] = useState<string | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)
  const router = useRouter()
  const isMobile = useIsMobile()
  const userDropdownRef = useRef<HTMLDivElement>(null)

  const userData = {
    name: "Shashank Singh",
    email: "shashank@kroolo.com",
    account: "Kroolo",
    id: "45739289",
    plan: "Business",
    role: "System Admin",
    localTime: "2:30 PM",
  }

  const statusOptions = [
    { value: "Online", color: "bg-green-500", label: "Online" },
    { value: "Away", color: "bg-yellow-500", label: "Away" },
    { value: "Busy", color: "bg-red-500", label: "Busy" },
    { value: "Offline", color: "bg-gray-500", label: "Offline" },
  ]

  const isAdmin = userData.role === "System Admin" || userData.role === "Org Admin"
  const avatarProps = useMemo(() => getAvatarProps(userData.name), [userData.name])

  useEffect(() => {
    setIsHydrated(true)

    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("theme") || "light"
      const savedLogo = localStorage.getItem("organizationLogo")

      setTheme(savedTheme)
      if (savedLogo) {
        setOrganizationLogo(savedLogo)
      }

      document.documentElement.classList.toggle("dark", savedTheme === "dark")
    }
  }, [])

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
      setIsUserDropdownOpen(false)
      setIsStatusDropdownOpen(false)
    }
  }, [])

  const handleLogoUpdate = useCallback((event: CustomEvent) => {
    setOrganizationLogo(event.detail.logoUrl)
  }, [])

  useEffect(() => {
    if (!isHydrated) return

    document.addEventListener("mousedown", handleClickOutside)
    window.addEventListener("logoUpdated", handleLogoUpdate as EventListener)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      window.removeEventListener("logoUpdated", handleLogoUpdate as EventListener)
    }
  }, [isHydrated, handleClickOutside, handleLogoUpdate])

  const handleSettingsClick = useCallback(() => {
    router.push("/bsm/settings")
    setIsUserDropdownOpen(false)
  }, [router])

  const handleMyProfileClick = useCallback(() => {
    router.push("/bsm/settings#profile")
    setIsUserDropdownOpen(false)
  }, [router])

  const handleStatusChange = useCallback((newStatus: string) => {
    setUserStatus(newStatus)
    setIsStatusDropdownOpen(false)
  }, [])

  const handleThemeToggle = useCallback(() => {
    if (typeof window === "undefined") return

    const newTheme = theme === "dark" ? "light" : "dark"
    setTheme(newTheme)
    localStorage.setItem("theme", newTheme)
    document.documentElement.classList.toggle("dark", newTheme === "dark")
  }, [theme])

  const currentStatusColor = statusOptions.find((s) => s.value === userStatus)?.color || "bg-green-500"

  return (
    <header className="h-14 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-6 fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center gap-2 flex-shrink-0">
        <Image
          src={
            organizationLogo ||
            "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Kroolo%20Logo-kuyVfAB5iW8WooZbrbQmPXSHHTVv6Q.png" ||
            "/placeholder.svg" ||
            "/placeholder.svg"
          }
          alt="Kroolo"
          width={isMobile ? 80 : 100}
          height={isMobile ? 22 : 28}
          className={`${isMobile ? "h-5" : "h-7"} w-auto`}
        />
      </div>

      <div className="hidden sm:block flex-1 px-6">
        <div className="text-sm text-gray-500">Search temporarily disabled</div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleThemeToggle}
          className="h-8 w-8 p-0 flex-shrink-0"
          suppressHydrationWarning
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <div className="flex-shrink-0">
          <NotificationBell />
        </div>

        <div className="relative flex-shrink-0" ref={userDropdownRef}>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800/50 flex-shrink-0"
            onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
          >
            <Avatar className="h-7 w-7">
              <AvatarFallback className={`${avatarProps.colorClass} text-white text-[11px] font-semibold`}>
                {avatarProps.initials}
              </AvatarFallback>
            </Avatar>
          </Button>

          {isUserDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-md shadow-lg z-[60] will-change-transform">
              <div className="p-4 bg-gray-50/50 dark:bg-gray-800/30 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 ring-2 ring-white dark:ring-gray-700">
                    <AvatarFallback className={`${avatarProps.colorClass} text-white text-sm font-semibold`}>
                      {avatarProps.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[15px] text-gray-900 dark:text-white truncate">
                      {userData.name}
                    </div>
                    <div className="text-[13px] text-gray-500 dark:text-gray-400 truncate">{userData.email}</div>
                    <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{userData.role}</div>
                  </div>
                </div>
              </div>

              <div className="p-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 px-2 py-1 bg-green-50 dark:bg-green-900/20 rounded-full">
                    <div className={`w-2 h-2 ${currentStatusColor} rounded-full`}></div>
                    <span className="text-[12px] font-medium text-green-700 dark:text-green-400">{userStatus}</span>
                  </div>
                  <div className="relative">
                    <button
                      className="text-[11px] px-2 py-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1"
                      onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                    >
                      Set status
                      <ChevronDown className="h-3 w-3" />
                    </button>

                    {isStatusDropdownOpen && (
                      <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-[70]">
                        {statusOptions.map((status) => (
                          <button
                            key={status.value}
                            className="w-full flex items-center gap-2 px-3 py-2 text-[12px] hover:bg-gray-50 dark:hover:bg-gray-700 first:rounded-t-md last:rounded-b-md"
                            onClick={() => handleStatusChange(status.value)}
                          >
                            <div className={`w-2 h-2 ${status.color} rounded-full`}></div>
                            <span className="text-gray-700 dark:text-gray-300">{status.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-3 space-y-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/20">
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
                <button
                  className="w-full flex items-center gap-3 px-3 py-2 text-[13px] rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={handleMyProfileClick}
                >
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700 dark:text-gray-300">My Profile</span>
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2 text-[13px] rounded-md hover:bg-gray-50 dark:hover:bg-gray-800">
                  <Lock className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700 dark:text-gray-300">Change Password</span>
                </button>
                {isAdmin && (
                  <button
                    className="w-full flex items-center gap-3 px-3 py-2 text-[13px] rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={handleSettingsClick}
                  >
                    <Settings className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-700 dark:text-gray-300">Settings</span>
                  </button>
                )}

                <div className="my-2 border-t border-gray-100 dark:border-gray-800"></div>

                <button className="w-full flex items-center gap-3 px-3 py-2 text-[13px] rounded-md hover:bg-red-50 dark:hover:bg-red-900/20">
                  <LogOut className="h-4 w-4 text-red-500" />
                  <span className="text-red-600 dark:text-red-400 font-medium">Log out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
