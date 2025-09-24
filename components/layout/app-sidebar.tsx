"use client"

import type * as React from "react"
import {
  BarChart3,
  Building2,
  ChevronUp,
  ChevronsUpDown,
  Command,
  CreditCard,
  HardDrive,
  LogOut,
  PieChart,
  Plus,
  Settings2,
  Ticket,
  User2,
  Workflow,
  BookOpen,
  Users,
  Shield,
  Bell,
  Zap,
  Clock,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { getAvatarProps } from "@/lib/avatar-utils"

// This is sample data.
const data = {
  user: {
    name: "System Administrator",
    email: "admin@kroolo.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Kroolo BSM",
      logo: Command,
      plan: "Enterprise",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/bsm/dashboard",
      icon: BarChart3,
      isActive: true,
    },
    {
      title: "Service Catalog",
      url: "/bsm/services",
      icon: Building2,
      items: [
        {
          title: "All Services",
          url: "/bsm/services",
        },
        {
          title: "Service Requests",
          url: "/bsm/services/requests",
        },
        {
          title: "Service Categories",
          url: "/bsm/services/categories",
        },
      ],
    },
    {
      title: "Incident Management",
      url: "/bsm/tickets",
      icon: Ticket,
      items: [
        {
          title: "All Tickets",
          url: "/bsm/tickets",
        },
      ],
    },
    {
      title: "Change Management",
      url: "/bsm/changes",
      icon: Workflow,
      items: [
        {
          title: "All Changes",
          url: "/bsm/changes",
        },
        {
          title: "Pending Approval",
          url: "/bsm/changes/pending",
        },
        {
          title: "Scheduled",
          url: "/bsm/changes/scheduled",
        },
        {
          title: "Emergency Changes",
          url: "/bsm/changes/emergency",
        },
      ],
    },
    {
      title: "Asset Management",
      url: "/bsm/assets",
      icon: HardDrive,
      items: [
        {
          title: "All Assets",
          url: "/bsm/assets",
        },
        {
          title: "Asset Discovery",
          url: "/bsm/assets/discovery",
        },
        {
          title: "Dependencies",
          url: "/bsm/assets/dependencies",
        },
        {
          title: "Lifecycle Management",
          url: "/bsm/assets/lifecycle",
        },
      ],
    },
    {
      title: "Knowledge Base",
      url: "/bsm/knowledge",
      icon: BookOpen,
      items: [
        {
          title: "Articles",
          url: "/bsm/knowledge/articles",
        },
        {
          title: "FAQs",
          url: "/bsm/knowledge/faqs",
        },
        {
          title: "Procedures",
          url: "/bsm/knowledge/procedures",
        },
        {
          title: "AI Insights",
          url: "/bsm/knowledge/ai-insights",
        },
      ],
    },
    {
      title: "Analytics & Reports",
      url: "/bsm/analytics",
      icon: PieChart,
      items: [
        {
          title: "Executive Dashboard",
          url: "/bsm/analytics/executive",
        },
        {
          title: "Performance Metrics",
          url: "/bsm/analytics/performance",
        },
        {
          title: "SLA Reports",
          url: "/bsm/analytics/sla",
        },
        {
          title: "Custom Reports",
          url: "/bsm/analytics/custom",
        },
      ],
    },
  ],
  administration: [
    {
      title: "User Management",
      url: "/bsm/admin/users",
      icon: Users,
    },
    {
      title: "Workflow Builder",
      url: "/bsm/admin/workflows",
      icon: Workflow,
    },
    {
      title: "SLA Management",
      url: "/bsm/admin/sla",
      icon: Clock,
    },
    {
      title: "Integrations",
      url: "/bsm/admin/integrations",
      icon: Zap,
    },
    {
      title: "Security & Access",
      url: "/bsm/admin/security",
      icon: Shield,
    },
    {
      title: "System Settings",
      url: "/bsm/admin/settings",
      icon: Settings2,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const avatarProps = getAvatarProps(data.user.name)

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <Command className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{data.teams[0].name}</span>
                    <span className="truncate text-xs">{data.teams[0].plan}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                align="start"
                side="bottom"
                sideOffset={4}
              >
                <DropdownMenuLabel className="text-xs text-muted-foreground">Teams</DropdownMenuLabel>
                {data.teams.map((team, index) => (
                  <DropdownMenuItem key={team.name} onClick={() => {}} className="gap-2 p-2">
                    <div className="flex size-6 items-center justify-center rounded-sm border">
                      <team.logo className="size-4 shrink-0" />
                    </div>
                    {team.name}
                    <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2 p-2">
                  <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                    <Plus className="size-4" />
                  </div>
                  <div className="font-medium text-muted-foreground">Add team</div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Service Management</SidebarGroupLabel>
          <SidebarMenu>
            {data.navMain.map((item) => (
              <Collapsible key={item.title} asChild defaultOpen={item.isActive} className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={item.title}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                      {item.items && (
                        <ChevronUp className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                      )}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  {item.items && (
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton asChild>
                              <a href={subItem.url}>
                                <span>{subItem.title}</span>
                              </a>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  )}
                </SidebarMenuItem>
              </Collapsible>
            ))}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Administration</SidebarGroupLabel>
          <SidebarMenu>
            {data.administration.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton tooltip={item.title}>
                  <item.icon />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={data.user.avatar || "/placeholder.svg"} alt={data.user.name} />
                    <AvatarFallback className={`rounded-lg ${avatarProps.colorClass} text-white font-semibold`}>
                      {avatarProps.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{data.user.name}</span>
                    <span className="truncate text-xs">{data.user.email}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src={data.user.avatar || "/placeholder.svg"} alt={data.user.name} />
                      <AvatarFallback className={`rounded-lg ${avatarProps.colorClass} text-white font-semibold`}>
                        {avatarProps.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{data.user.name}</span>
                      <span className="truncate text-xs">{data.user.email}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <User2 />
                    Account
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <CreditCard />
                    Billing
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings2 />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Bell />
                    Notifications
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <LogOut />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
