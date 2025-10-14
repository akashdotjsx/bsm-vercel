"use client"

import type React from "react"
import { KrooloNavbar } from "@/components/layout/kroolo-navbar"
import { SidebarNavigation } from "@/components/dashboard/sidebar-navigation"
import { useIsMobile } from "@/hooks/use-mobile"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { useState } from "react"

/**
 * Persistent Dashboard Layout
 * This layout wraps all main application pages and ensures the navbar and sidebar
 * remain mounted and don't refresh during navigation.
 * 
 * Key Features:
 * - Navbar and sidebar persist across all routes
 * - No remounting on navigation
 * - Mobile-responsive with sheet sidebar
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const isMobile = useIsMobile()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Persistent Navbar - Never remounts */}
      <KrooloNavbar />

      <div className="flex flex-1 pt-12 overflow-hidden">
        {/* Desktop Sidebar - Persistent */}
        {!isMobile && (
          <div 
            className="w-64 border-r border-sidebar-border h-[calc(100vh-3rem)] flex flex-col fixed left-0 top-12 z-40 shadow-sm bg-sidebar overflow-hidden"
          >
            <SidebarNavigation />
          </div>
        )}

        {/* Mobile Sidebar - Sheet */}
        {isMobile && (
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="fixed left-4 top-14 z-50 md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <SidebarNavigation />
            </SheetContent>
          </Sheet>
        )}

        {/* Main Content Area - Only this changes on navigation */}
        <div className={`flex-1 flex flex-col overflow-hidden ${!isMobile ? "ml-64" : ""}`}>
          <main className="flex-1 overflow-auto bg-muted/30">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
