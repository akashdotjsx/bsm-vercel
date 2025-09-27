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
  { name: "Accounts", href: "/accounts", icon: Building, permission: 'users' },
  { name: "Tickets", href: "/tickets", icon: Ticket, hasSubmenu: true, permission: 'tickets' },
  { name: "Workflows", href: "/workflows", icon: Workflow, permission: 'workflows' },
  { name: "Asset Management", href: "/assets", icon: HardDrive, permission: 'assets' },
  { name: "Services", href: "/services", icon: Settings, permission: 'services' },
  { name: "Knowledge Base", href: "/knowledge-base", icon: BookOpen, permission: 'knowledge_base' },
  { name: "Analytics", href: "/analytics", icon: BarChart3, permission: 'analytics' },
  { name: "Notifications", href: "/notifications", icon: Bell, permission: null },
]

const ticketSubmenuItems = [
  { name: "All Tickets", href: "/tickets", icon: List },
  { name: "Following", href: "/tickets/following", icon: Eye },
  { name: "My Tickets", href: "/tickets/my-tickets", icon: User },
]

const administrationItems = [
  { name: "Integrations", href: "/integrations", icon: Zap, permission: 'integrations' },
  { name: "Approval Workflows", href: "/admin/approvals", icon: CheckCircle, permission: 'workflows' },
  { name: "SLA Management", href: "/admin/sla", icon: Clock, permission: 'sla_policies' },
  { name: "Priority Matrix", href: "/admin/priorities", icon: AlertTriangle, permission: 'tickets' },
  { name: "Service Catalog", href: "/admin/catalog", icon: Building2, permission: 'services' },
  { name: "Users & Teams", href: "/users", icon: Users, permission: 'users' },
  { name: "Security & Access", href: "/admin/security", icon: Shield, permission: 'security' },
]

export function SidebarNavigation() {
  const pathname = usePathname()
  const { mode } = useMode()
  const { profile, organization, canView } = useAuth()
  const [expandedMenus, setExpandedMenus] = useState<string[]>([])

  const navigationItems = mode === "customer" ? customerViewItems : employeeViewItems
  const sectionTitle = mode === "customer" ? "Customer Support" : "SERVICE MANAGEMENT"

  const toggleSubmenu = (itemName: string) => {
    setExpandedMenus((prev) =>
      prev.includes(itemName) ? prev.filter((name) => name !== itemName) : [...prev, itemName],
    )
  }

  return (
    <div className="w-full h-full flex flex-col bg-sidebar">
      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-sidebar-border scrollbar-track-transparent">
        <div className="p-4">
          <h2 className="text-xs font-semibold text-sidebar-foreground/80 uppercase tracking-wider mb-6">
            {sectionTitle}
          </h2>
          <nav className="space-y-2">
            {navigationItems.filter(item => {
              if (!item.permission) {
                return true // No permission required
              }
              return canView(item.permission)
            }).map((item) => {
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
                          "flex items-center justify-between w-full px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200",
                          isTicketsPath
                            ? "bg-sidebar-primary text-sidebar-primary-foreground"
                            : "text-sidebar-foreground/70 hover:bg-sidebar-primary/50 hover:text-sidebar-foreground",
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
                          {ticketSubmenuItems.map((subItem) => {
                            const SubIcon = subItem.icon
                            return (
                              <Link
                                key={subItem.name}
                                href={subItem.href}
                                className={cn(
                                  "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200",
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
                        "flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200",
                        pathname === item.href
                          ? "bg-sidebar-primary text-sidebar-primary-foreground"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-primary/50 hover:text-sidebar-foreground",
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

        {mode === "employee" && canView('administration') && (
          <div className="px-4 pb-4">
            <h2 className="text-xs font-semibold text-sidebar-foreground/80 uppercase tracking-wider mb-6">
              ADMINISTRATION
            </h2>
            <nav className="space-y-2">
              {administrationItems.filter(item => {
                if (!item.permission) {
                  return true
                }
                return canView(item.permission)
              }).map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200",
                      pathname === item.href
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-primary/50 hover:text-sidebar-foreground",
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
            <span className="text-sm font-medium text-sidebar-primary-foreground">
              {organization?.subscription_tier || 'Basic'} Plan
            </span>
          </div>
          <Button
            size="sm"
            className="w-full bg-sidebar-accent hover:bg-sidebar-accent/90 text-sidebar-accent-foreground text-xs font-medium"
          >
            <ArrowUpRight className="mr-1 h-3 w-3" />
            {profile?.role === 'admin' ? 'Manage License' : 'View License'}
          </Button>
        </div>
      </div>
    </div>
  )
}
