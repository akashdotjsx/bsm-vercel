"use client"

import type React from "react"
import { SidebarNavigation } from "@/components/dashboard/sidebar-navigation"
import { GlobalHeader } from "@/components/layout/global-header"
import { useIsMobile } from "@/hooks/use-mobile"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { useState } from "react"

interface PlatformLayoutProps {
  children: React.ReactNode
  breadcrumb?: {
    label: string
    href?: string
  }[]
  title?: string
  description?: string
}

export function PlatformLayout({ children, breadcrumb, title, description }: PlatformLayoutProps) {
  const isMobile = useIsMobile()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  

  return (
    <div className="h-full bg-background flex flex-col">
      <GlobalHeader />

      <div className="flex flex-1 pt-12">
        {!isMobile && (
          <div 
            className="w-64 border-r border-sidebar-border h-[calc(100vh-3rem)] flex flex-col fixed left-0 top-12 z-40 shadow-sm bg-sidebar"
          >
            <SidebarNavigation />
          </div>
        )}

        {isMobile && (
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="fixed left-4 top-16 z-50 md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <SidebarNavigation />
            </SheetContent>
          </Sheet>
        )}

        <div className={`flex-1 flex flex-col ${!isMobile ? "ml-64" : ""}`} style={{ marginLeft: !isMobile ? '16rem' : '0' }}>
          {breadcrumb && (
            <div className="bg-muted border-b border-border px-4 md:px-6 py-2">
              <div className="flex items-center space-x-2 text-xs md:text-sm text-muted-foreground">
                {breadcrumb.map((item, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    {index > 0 && <span>/</span>}
                    {item.href ? (
                      <a href={item.href} className="hover:text-foreground transition-colors truncate">
                        {item.label}
                      </a>
                    ) : (
                      <span className="text-foreground font-medium truncate">{item.label}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <main className="flex-1 p-4 md:p-6 bg-muted/30 overflow-auto">
            {(title || description) && (
              <div className="space-y-2 mb-6">
                {title && <h1 className="text-3xl font-bold">{title}</h1>}
                {description && <p className="text-muted-foreground">{description}</p>}
              </div>
            )}
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
