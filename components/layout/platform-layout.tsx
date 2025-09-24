"use client"

import type React from "react"
import { SidebarNavigation } from "@/components/dashboard/sidebar-navigation"
import { GlobalHeader } from "@/components/layout/global-header"
import { useIsMobile } from "@/hooks/use-mobile"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface PlatformLayoutProps {
  children: React.ReactNode
}

export function PlatformLayout({ children }: PlatformLayoutProps) {
  const isMobile = useIsMobile()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="h-full bg-background flex flex-col">
      <GlobalHeader />

      <div className="flex flex-1 pt-12">
        {!isMobile && (
          <div className="w-64 bg-sidebar border-r border-sidebar-border h-full flex flex-col fixed left-0 top-12 z-40 shadow-sm">
            <SidebarNavigation />
          </div>
        )}

        {isMobile && (
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="fixed left-4 top-16 z-50 md:hidden">
                <span className="text-lg">☰</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <SidebarNavigation />
            </SheetContent>
          </Sheet>
        )}

        <div className={`flex-1 flex flex-col ${!isMobile ? "ml-64" : ""}`}>
          <main className="flex-1 p-6 overflow-auto">{children}</main>
        </div>
      </div>
    </div>
  )
}
