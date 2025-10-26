"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useMode } from "@/lib/contexts/mode-context"
import { useAuth } from "@/lib/contexts/auth-context"
import { usePrefetchNav } from "@/hooks/use-prefetch-nav"
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
import { useSidebar } from "@/lib/contexts/sidebar-context"
import { PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useRouter } from "next/navigation"

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
  // { name: "Following", href: "/tickets/following", icon: Eye }, // Hidden from UI
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
  const router = useRouter()
  const { mode } = useMode()
  const { profile, organization, canView, loading, permissionsLoading, isAdmin } = useAuth()
  const { isCollapsed, toggleSidebar, setCollapsed } = useSidebar()
  const [expandedMenus, setExpandedMenus] = useState<string[]>([])
  
  // Centralized prefetch hook for all nav pages
  const { prefetchByHref } = usePrefetchNav()

  const navigationItems = mode === "customer" ? customerViewItems : employeeViewItems
  const sectionTitle = mode === "customer" ? "Customer Support" : "SERVICE MANAGEMENT"

  const handleMenuClick = (item: any) => {
    if (item.hasSubmenu) {
      // If collapsed, expand the sidebar and open the submenu
      if (isCollapsed) {
        setCollapsed(false)
        setExpandedMenus([item.name])
        
        // Navigate to first submenu item
        const submenuItems = item.name === 'Tickets' 
          ? ticketSubmenuItems 
          : (isAdmin || profile?.role === 'manager' ? servicesSubmenuItemsManager : servicesSubmenuItems)
        
        if (submenuItems.length > 0) {
          router.push(submenuItems[0].href)
        }
      } else {
        // Toggle submenu if already expanded
        setExpandedMenus((prev) =>
          prev.includes(item.name) ? prev.filter((name) => name !== item.name) : [...prev, item.name],
        )
      }
    }
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
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="w-full h-full flex flex-col bg-sidebar">
        {/* Toggle Button */}
        <div className={cn(
          "flex items-center border-b border-sidebar-border transition-all duration-300 ease-in-out min-w-0",
          isCollapsed ? "justify-center p-4" : "justify-between p-4"
        )}>
          {!isCollapsed && (
            <h2 className="sidebar-header-text text-[10px] font-semibold text-sidebar-foreground/80 uppercase tracking-wider transition-all duration-300 ease-in-out flex-shrink-0">
              {sectionTitle}
            </h2>
          )}
           <Button
             variant="ghost"
             size="sm"
             onClick={toggleSidebar}
             className="h-8 w-8 p-0 hover:bg-sidebar-hover flex-shrink-0"
           >
             {isCollapsed ? (
               <PanelLeftOpen className="h-5 w-5 flex-shrink-0" />
             ) : (
               <PanelLeftClose className="h-5 w-5 flex-shrink-0" />
             )}
           </Button>
        </div>

         {/* Scrollable content area */}
         <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-sidebar-border scrollbar-track-transparent min-h-0">
           <div className="p-4">
             <nav className="space-y-1">
            {navigationItems.filter(shouldShowItem).map((item) => {
              const Icon = item.icon
              const isExpanded = expandedMenus.includes(item.name)
              const isActive = pathname.startsWith(item.href) || (item.name === 'Tickets' && pathname.startsWith("/tickets")) || (item.name === 'Services' && pathname.startsWith("/services"))

              return (
                <div key={item.name}>
                  {item.hasSubmenu ? (
                    <div>
                      {isCollapsed ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                             <button
                               onClick={() => handleMenuClick(item)}
                               className={cn(
                                 "flex items-center w-full py-2 text-[12px] font-medium rounded-md transition-all duration-300 ease-in-out",
                                 isActive
                                   ? "bg-sidebar-primary text-sidebar-primary-foreground"
                                   : "text-sidebar-foreground hover:bg-sidebar-hover hover:text-sidebar-foreground",
                                 isCollapsed 
                                   ? "justify-center px-2" 
                                   : "justify-between px-3"
                               )}
                             >
                               <div className="flex items-center">
                                 <Icon className={cn("h-5 w-5 flex-shrink-0 transition-all duration-300 ease-in-out", !isCollapsed && "mr-3")} />
                                 {!isCollapsed && <span className="transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden">{item.name}</span>}
                               </div>
                               {!isCollapsed && (isExpanded ? <ChevronDown className="h-4 w-4 flex-shrink-0 transition-all duration-300 ease-in-out" /> : <ChevronRight className="h-4 w-4 flex-shrink-0 transition-all duration-300 ease-in-out" />)}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="ml-2">
                            <p>{item.name}</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <button
                          onClick={() => handleMenuClick(item)}
                          className={cn(
                            "flex items-center w-full py-2 text-[12px] font-medium rounded-md transition-all duration-300 ease-in-out",
                            isActive
                              ? "bg-sidebar-primary text-sidebar-primary-foreground"
                              : "text-sidebar-foreground hover:bg-sidebar-hover hover:text-sidebar-foreground",
                            isCollapsed 
                              ? "justify-center px-2" 
                              : "justify-between px-3"
                          )}
                        >
                          <div className="flex items-center">
                            <Icon className={cn("h-5 w-5 flex-shrink-0 transition-all duration-300 ease-in-out", !isCollapsed && "mr-3")} />
                            {!isCollapsed && <span className="transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden">{item.name}</span>}
                          </div>
                          {!isCollapsed && (isExpanded ? <ChevronDown className="h-4 w-4 flex-shrink-0 transition-all duration-300 ease-in-out" /> : <ChevronRight className="h-4 w-4 flex-shrink-0 transition-all duration-300 ease-in-out" />)}
                        </button>
                      )}
              {isExpanded && !isCollapsed && (
                        <div className="ml-6 mt-1 space-y-1">
                          {(item.name === 'Tickets' ? ticketSubmenuItems : (isAdmin || profile?.role === 'manager' ? servicesSubmenuItemsManager : servicesSubmenuItems)).map((subItem) => {
                            const SubIcon = subItem.icon
                            return (
                                <Link
                                key={subItem.name}
                                href={subItem.href}
                                onMouseEnter={() => prefetchByHref(subItem.href)}
                                 className={cn(
                                   "flex items-center px-3 py-1.5 text-[12px] font-medium rounded-md transition-all duration-300 ease-in-out",
                                   pathname === subItem.href
                                     ? "bg-sidebar-primary text-sidebar-primary-foreground"
                                     : "text-sidebar-foreground/60 hover:bg-sidebar-primary/30 hover:text-sidebar-foreground",
                                 )}
                              >
                                <SubIcon className="mr-3 h-4 w-4 flex-shrink-0 transition-all duration-300 ease-in-out" />
                                <span className="transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden">{subItem.name}</span>
                              </Link>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    isCollapsed ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                           <Link
                             href={item.href}
                             onMouseEnter={() => prefetchByHref(item.href)}
                             className={cn(
                               "flex items-center py-2 text-[12px] font-medium rounded-md transition-all duration-300 ease-in-out",
                               isActive
                                 ? "bg-sidebar-primary text-sidebar-primary-foreground"
                                 : "text-sidebar-foreground hover:bg-sidebar-hover hover:text-sidebar-foreground",
                               isCollapsed 
                                 ? "justify-center px-2" 
                                 : "px-3"
                             )}
                           >
                            <Icon className={cn("h-5 w-5 flex-shrink-0 transition-all duration-300 ease-in-out", !isCollapsed && "mr-3")} />
                            {!isCollapsed && <span className="transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden">{item.name}</span>}
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="ml-2">
                          <p>{item.name}</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <Link
                        href={item.href}
                        onMouseEnter={() => prefetchByHref(item.href)}
                        className={cn(
                          "flex items-center py-2 text-[12px] font-medium rounded-md transition-all duration-300 ease-in-out",
                          isActive
                            ? "bg-sidebar-primary text-sidebar-primary-foreground"
                            : "text-sidebar-foreground hover:bg-sidebar-hover hover:text-sidebar-foreground",
                          isCollapsed 
                            ? "justify-center px-2" 
                            : "px-3"
                        )}
                      >
                        <Icon className={cn("h-5 w-5 flex-shrink-0 transition-all duration-300 ease-in-out", !isCollapsed && "mr-3")} />
                        {!isCollapsed && <span className="transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden">{item.name}</span>}
                      </Link>
                    )
                  )}
                </div>
              )
            })}
          </nav>
        </div>

         {mode === "employee" && (
           <div className="px-4 pb-4 border-t border-sidebar-border pt-4">
             {!isCollapsed && (
               <h3 className="text-[10px] font-semibold text-sidebar-foreground/80 uppercase tracking-wider mb-2 px-3">
                 Administration
               </h3>
             )}
             <nav className="space-y-1">
              {administrationItems.filter(shouldShowItem).map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  isCollapsed ? (
                    <Tooltip key={item.name}>
                      <TooltipTrigger asChild>
                         <Link
                           href={item.href}
                           onMouseEnter={() => prefetchByHref(item.href)}
                           className={cn(
                             "flex items-center py-2 text-[12px] font-medium rounded-md transition-all duration-300 ease-in-out",
                             isActive
                               ? "bg-sidebar-primary text-sidebar-primary-foreground"
                               : "text-sidebar-foreground hover:bg-sidebar-hover hover:text-sidebar-foreground",
                             isCollapsed 
                               ? "justify-center px-2" 
                               : "px-3"
                           )}
                         >
                          <Icon className={cn("h-5 w-5 flex-shrink-0 transition-all duration-300 ease-in-out", !isCollapsed && "mr-3")} />
                          {!isCollapsed && <span className="transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden">{item.name}</span>}
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="ml-2">
                        <p>{item.name}</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <Link
                      key={item.name}
                      href={item.href}
                      onMouseEnter={() => prefetchByHref(item.href)}
                      className={cn(
                        "flex items-center py-2 text-[12px] font-medium rounded-md transition-all duration-300 ease-in-out",
                        isActive
                          ? "bg-sidebar-primary text-sidebar-primary-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-hover hover:text-sidebar-foreground",
                        isCollapsed 
                          ? "justify-center px-2" 
                          : "px-3"
                      )}
                    >
                      <Icon className={cn("h-5 w-5 flex-shrink-0 transition-all duration-300 ease-in-out", !isCollapsed && "mr-3")} />
                      {!isCollapsed && <span className="transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden">{item.name}</span>}
                    </Link>
                  )
                )
              })}
            </nav>
          </div>
        )}
      </div>
    </div>
    </TooltipProvider>
  )
}
