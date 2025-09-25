"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { useMode } from "@/lib/contexts/mode-context"
import { useAuth } from "@/lib/contexts/auth-context"
import Link from "next/link"
import Image from "next/image"
import { Search, Plus } from "lucide-react"
import { NotificationBell } from "@/components/notifications/notification-bell"

export function DashboardHeader() {
  const router = useRouter()
  const { isEmployeeMode, isCustomerMode } = useMode()
  const { user, profile, organization, signOut, loading } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push("/auth/login")
    } catch (error) {
      console.error('Error during logout:', error)
    }
  }

  const employeeNavItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/tickets", label: "Tickets" },
    { href: "/workflows", label: "Workflows" },
    { href: "/services", label: "Service Catalog" },
    { href: "/analytics", label: "Analytics" },
  ]

  const customerNavItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/tickets", label: "Support" },
    { href: "/services", label: "Services" },
    { href: "/analytics", label: "Reports" },
  ]

  const navItems = isEmployeeMode ? employeeNavItems : customerNavItems

  return (
    <header className="border-b border-border bg-background">
      <div className="container mx-auto px-6 py-3 max-w-7xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="flex items-center space-x-3">
              <Image src="/images/kroolo-logo.png" alt="Kroolo" width={120} height={32} className="h-8 w-auto" />
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-muted-foreground">BSM</span>
                <Badge variant={isEmployeeMode ? "default" : "secondary"} className="text-xs font-medium">
                  {isEmployeeMode ? "Employee Services" : "Customer Support"}
                </Badge>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Search className="h-4 w-4" />
            </Button>

            <NotificationBell />

            <Button size="sm" className="h-8 text-xs font-medium">
              <Plus className="h-3 w-3 mr-1.5" />
              {isEmployeeMode ? "New Request" : "New Ticket"}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url || "/placeholder.svg"} alt={profile?.display_name} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {profile?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {profile?.display_name || `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || user?.email || 'User'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email || ''}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {profile?.department ? `${profile.department} • ` : ''}{profile?.role || 'User'}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile Settings</DropdownMenuItem>
                <DropdownMenuItem>Preferences</DropdownMenuItem>
                <DropdownMenuItem>Help & Support</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
