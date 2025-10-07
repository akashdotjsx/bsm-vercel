"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useMode } from "@/lib/contexts/mode-context"
import { useAuth } from "@/lib/contexts/auth-context"
import {
  Ticket,
  Workflow,
  Settings,
  BarChart3,
  Users,
  Shield,
  Bell,
  Zap,
  Building2,
  Clock,
  AlertTriangle,
  CheckCircle,
  ArrowUpRight,
  BookOpen,
  HardDrive,
  MessageSquare,
  Building,
  ChevronDown,
  ChevronRight,
  List,
  Eye,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

const customerViewItems = [
  { name: "Dashboard", href: "/dashboard", icon: BarChart3, permission: null },
  { name: "Customers", href: "/customers", icon: Users, permission: null },
  { name: "Tickets", href: "/tickets", icon: Ticket, hasSubmenu: true, permission: null },
  { name: "Live Chat", href: "/live-chat", icon: MessageSquare, permission: null },
  { name: "Knowledge Base", href: "/knowledge-base", icon: BookOpen, permission: null },
  { name: "Analytics", href: "/analytics", icon: BarChart3, permission: null },
]

const employeeViewItems = [
  { name: "Dashboard", href: "/dashboard", icon: BarChart3, permission: null },
  { name: "Accounts", href: "/accounts", icon: Building, permission: null },
  { name: "Tickets", href: "/tickets", icon: Ticket, hasSubmenu: true, permission: null },
  { name: "Workflows", href: "/workflows", icon: Workflow, permission: null },
  { name: "Asset Management", href: "/assets", icon: HardDrive, permission: null },
  { name: "Services", href: "/services", icon: Settings, hasSubmenu: true, permission: null },
  { name: "Knowledge Base", href: "/knowledge-base", icon: BookOpen, permission: null },
  { name: "Analytics", href: "/analytics", icon: BarChart3, permission: null },
  { name: "Notifications", href: "/notifications", icon: Bell, permission: null },
]

const ticketSubmenuItems = [
  { name: "All Tickets", href: "/tickets", icon: List },
  { name: "Following", href: "/tickets/following", icon: Eye },
  { name: "My Tickets", href: "/tickets/my-tickets", icon: User },
]

const servicesSubmenuItems = [
  { name: "Request Service", href: "/services", icon: Settings },
  { name: "My Requests", href: "/services/my-requests", icon: Clock },
]

const servicesSubmenuItemsManager = [
  { name: "Request Service", href: "/services", icon: Settings },
  { name: "My Requests", href: "/services/my-requests", icon: Clock },
  { name: "Team Requests", href: "/services/team-requests", icon: Users },
]

const administrationItems = [
  { name: "Integrations", href: "/integrations", icon: Zap, permission: null },
  { name: "Approval Workflows", href: "/admin/approvals", icon: CheckCircle, permission: null },
  { name: "SLA Management", href: "/admin/sla", icon: Clock, permission: null },
  { name: "Priority Matrix", href: "/admin/priorities", icon: AlertTriangle, permission: null },
  { name: "Service Catalog", href: "/admin/catalog", icon: Building2, permission: null },
  { name: "All Service Requests", href: "/admin/service-requests", icon: List, permission: null },
  { name: "Users & Teams", href: "/users", icon: Users, permission: null },
  { name: "Security & Access", href: "/admin/security", icon: Shield, permission: null },
]

export function SidebarNavigation() {
  const pathname = usePathname()
  const { mode } = useMode()
  const { profile, organization, canView, loading, permissionsLoading, isAdmin } = useAuth()
  const [expandedMenus, setExpandedMenus] = useState<string[]>([])

  const navigationItems = mode === "customer" ? customerViewItems : employeeViewItems
  const sectionTitle = mode === "customer" ? "Customer Support" : "SERVICE MANAGEMENT"

  const toggleSubmenu = (itemName: string) => {
    setExpandedMenus((prev) =>
      prev.includes(itemName) ? prev.filter((name) => name !== itemName) : [...prev, itemName],
    )
  }

  // Show skeleton during loading to prevent flash
  // Helper function to determine if an item should be shown
  const shouldShowItem = (item: any) => {
    // Always show items with no permission requirement
    if (!item.permission) {
      return true
    }

    // Admins see all items regardless of per-module permissions
    if (isAdmin) {
      return true
    }
    
    // During initial loading, show skeleton/placeholder to prevent flickering
    if (loading) {
      return true
    }
    
    // If permissions are still loading, show the item to prevent flickering
    if (permissionsLoading) {
      return true
    }
    
    // Once loaded, check actual permissions
    return canView(item.permission)
  }

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col bg-sidebar">
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-sidebar-border scrollbar-track-transparent min-h-0">
          <div className="p-4">
            <div className="h-4 w-32 bg-muted animate-pulse rounded mb-4"></div>
            <nav className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-8 bg-muted animate-pulse rounded"></div>
              ))}
            </nav>
          </div>
          <div className="px-4 pb-4">
            <div className="h-4 w-28 bg-muted animate-pulse rounded mb-4"></div>
            <nav className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-8 bg-muted animate-pulse rounded"></div>
              ))}
            </nav>
          </div>
        </div>
        <div className="flex-shrink-0 p-4 border-t border-sidebar-border">
          <div className="bg-sidebar-primary rounded-lg p-4">
            <div className="h-4 w-20 bg-muted animate-pulse rounded mb-3"></div>
            <div className="h-6 w-full bg-muted animate-pulse rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col bg-sidebar">
      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-sidebar-border scrollbar-track-transparent min-h-0">
        <div className="p-4">
          <h2 className="text-[10px] font-semibold text-sidebar-foreground/80 uppercase tracking-wider mb-4">
            {sectionTitle}
          </h2>
          <nav className="space-y-2">
            {navigationItems.filter(shouldShowItem).map((item) => {
              const Icon = item.icon
              const isExpanded = expandedMenus.includes(item.name)
              const isTicketsPath = pathname.startsWith("/tickets")

              return (
                <div key={item.name}>
                  {item.hasSubmenu ? (
                    <div>
                      <button
                        onClick={() => toggleSubmenu(item.name)}
                        className={cn(
                          "flex items-center justify-between w-full px-3 py-2 text-[12px] font-medium rounded-md transition-all duration-200",
                          isTicketsPath
                            ? "bg-sidebar-primary text-sidebar-primary-foreground"
                            : "text-sidebar-foreground hover:bg-sidebar-hover hover:text-sidebar-foreground",
                        )}
                      >
                        <div className="flex items-center">
                          <Icon className="mr-3 h-4 w-4" />
                          {item.name}
                        </div>
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </button>
              {isExpanded && (
                        <div className="ml-6 mt-1 space-y-1">
                          {(item.name === 'Tickets' ? ticketSubmenuItems : (isAdmin || profile?.role === 'manager' ? servicesSubmenuItemsManager : servicesSubmenuItems)).map((subItem) => {
                            const SubIcon = subItem.icon
                            return (
                                <Link
                                key={subItem.name}
                                href={subItem.href}
                                className={cn(
                                  "flex items-center px-3 py-1.5 text-[12px] font-medium rounded-md transition-all duration-200",
                                  pathname === subItem.href
                                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                                    : "text-sidebar-foreground/60 hover:bg-sidebar-primary/30 hover:text-sidebar-foreground",
                                )}
                              >
                                <SubIcon className="mr-3 h-3 w-3" />
                                {subItem.name}
                              </Link>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center px-3 py-2 text-[12px] font-medium rounded-md transition-all duration-200",
                        pathname === item.href
                          ? "bg-sidebar-primary text-sidebar-primary-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-hover hover:text-sidebar-foreground",
                      )}
                    >
                      <Icon className="mr-3 h-4 w-4" />
                      {item.name}
                    </Link>
                  )}
                </div>
              )
            })}
          </nav>
        </div>

        {mode === "employee" && (
          <div className="px-4 pb-4">
            <h2 className="text-[10px] font-semibold text-sidebar-foreground/80 uppercase tracking-wider mb-4">
              ADMINISTRATION
            </h2>
            <nav className="space-y-2">
              {administrationItems.filter(shouldShowItem).map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center px-3 py-2 text-[12px] font-medium rounded-md transition-all duration-200",
                      pathname === item.href
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-hover hover:text-sidebar-foreground",
                    )}
                  >
                    <Icon className="mr-3 h-4 w-4" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
        )}
      </div>

      {/* Fixed footer */}
      <div className="flex-shrink-0 p-4 border-t border-sidebar-border">
        <div className="bg-sidebar-primary rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-medium text-sidebar-primary-foreground">
              {organization?.subscription_tier || 'Basic'} Plan
            </span>
          </div>
          <Button
            size="sm"
            className="w-full bg-sidebar-accent hover:bg-sidebar-accent/90 text-sidebar-accent-foreground text-[10px] font-medium"
          >
            <ArrowUpRight className="mr-1 h-3 w-3" />
            {profile?.role === 'admin' ? 'Manage License' : 'View License'}
          </Button>
        </div>
      </div>
    </div>
  )
}
