"use client"

import { Sun, Moon, HelpCircle, Sparkles, Timer, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useTheme } from "next-themes"
import Image from "next/image"
import { useState, useEffect } from "react"
import { useNotifications } from "@/lib/contexts/notification-context"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { GlobalSearch } from "@/components/search/global-search"
import { AvatarMenu } from "./avatar-menu"
import { OrganizationSwitcher } from "./organization-switcher"
import { HelpCenterDropdown } from "./help-center-dropdown"
import { useRouter } from "next/navigation"
import { useIsMobile } from "@/hooks/use-mobile"
import { useAuth } from "@/lib/contexts/auth-context"

// Define the NAV_HEIGHT constant as mentioned in the reference
const NAV_HEIGHT = "3rem" // 48px (h-12)

interface KrooloNavbarProps {
  className?: string
}

export function KrooloNavbar({ className }: KrooloNavbarProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [timerRunning, setTimerRunning] = useState(false)
  const [timerTime, setTimerTime] = useState("00:00:00")
  const { notifications } = useNotifications()
  const router = useRouter()
  const isMobile = useIsMobile()
  const { user, profile, organization, signOut, loading } = useAuth()

  // Prevent hydration mismatch with theme
  useEffect(() => {
    setMounted(true)
  }, [])

  // Mock timer functionality (feature flagged)
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (timerRunning) {
      interval = setInterval(() => {
        // Mock timer logic - in real app this would track actual time
        setTimerTime(prev => {
          const [hours, minutes, seconds] = prev.split(':').map(Number)
          const totalSeconds = hours * 3600 + minutes * 60 + seconds + 1
          const newHours = Math.floor(totalSeconds / 3600)
          const newMinutes = Math.floor((totalSeconds % 3600) / 60)
          const newSeconds = totalSeconds % 60
          return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}:${newSeconds.toString().padStart(2, '0')}`
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [timerRunning])

  // Don't render user data during loading to prevent flash
  if (loading) {
    return (
      <header className={`h-14 bg-background border-b border-border flex items-center px-4 md:px-6 fixed top-0 left-0 right-0 z-50 ${className}`}>
        <div className="flex items-center gap-3">
          {mounted && (
            <button
              onClick={() => router.push('/')}
              className="cursor-pointer hover:opacity-80 transition-opacity"
            >
              <Image
                src={theme === 'dark' ? '/images/kroolo-light-logo1.svg' : '/images/kroolo-dark-logo2.svg'}
                alt="Kroolo"
                width={106}
                height={24}
                className="h-6 w-auto"
              />
            </button>
          )}
          {!mounted && (
            <div className="h-6 w-26 bg-muted animate-pulse rounded" />
          )}
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 h-5 font-medium">
            BSM
          </Badge>
        </div>
        
        {/* Search Feature - Centered */}
        <div className="hidden sm:flex justify-center flex-1">
          <div className="w-full max-w-md">
            <GlobalSearch />
          </div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-8 h-8 bg-muted animate-pulse rounded-full" />
          <div className="w-16 h-6 bg-muted animate-pulse rounded" />
          <div className="w-8 h-8 bg-muted animate-pulse rounded" />
          <div className="w-8 h-8 bg-muted animate-pulse rounded-full" />
        </div>
      </header>
    )
  }

  const handleToggleTimer = () => {
    setTimerRunning(!timerRunning)
    if (!timerRunning) {
      setTimerTime("00:00:00")
    }
  }

  const handleHelpCenter = () => {
    // Navigate to help center or open help modal
    console.log('Opening help center')
  }

  return (
    <header 
      className={`h-12 bg-background border-b border-border flex items-center px-3 md:px-4 fixed top-0 left-0 right-0 z-50 ${className}`}
      style={{ height: NAV_HEIGHT }}
    >
      {/* Logo Section */}
      <div className="flex items-center gap-3">
        {mounted && (
          <button
            onClick={() => router.push('/')}
            className="cursor-pointer hover:opacity-80 transition-opacity"
          >
            <Image
              src={theme === 'dark' ? '/images/kroolo-light-logo1.svg' : '/images/kroolo-dark-logo2.svg'}
              alt="Kroolo"
              width={96}
              height={22}
              className="h-6 w-auto"
            />
          </button>
        )}
        {!mounted && (
          <div className="h-5 w-22 bg-muted animate-pulse rounded" />
        )}
        
        <Badge variant="secondary" className="text-[9px] px-1 py-0.5 h-4 font-medium">
          BSM
        </Badge>
      </div>

      {/* Search Feature (Universal search button - feature flagged) - Centered */}
      <div className="hidden sm:flex justify-center flex-1">
        <div className="w-full max-w-md">
          <GlobalSearch />
        </div>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="h-7 w-7 p-0"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        {/* Help Center */}
        {!isMobile && <HelpCenterDropdown />}

        {/* Notifications */}
        <NotificationBell notifications={notifications} />

        {/* Avatar Menu */}
        <AvatarMenu />
      </div>
    </header>
  )
}

// Export the NAV_HEIGHT for use in other components
export { NAV_HEIGHT }