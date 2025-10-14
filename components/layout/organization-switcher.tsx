"use client"

import { useState } from "react"
import { ChevronDown, Building, Plus, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CustomMenuItem, CustomMenuSeparator, CustomMenuLabel } from "@/components/ui/custom-menu"
import { useAuth } from "@/lib/contexts/auth-context"
import { useIsMobile } from "@/hooks/use-mobile"

interface Organization {
  id: string
  name: string
  plan: string
  isDemo?: boolean
  role?: string
}

interface OrganizationSwitcherProps {
  className?: string
}

export function OrganizationSwitcher({ className }: OrganizationSwitcherProps) {
  const { user, profile, organization, loading } = useAuth()
  const isMobile = useIsMobile()
  const [switchingOrg, setSwitchingOrg] = useState<string | null>(null)

  // Mock data - in real app this would come from your API
  const [organizations] = useState<Organization[]>([
    {
      id: "1",
      name: "Kroolo Enterprise",
      plan: "Business",
      role: "Admin"
    },
    {
      id: "2", 
      name: "Acme Corporation",
      plan: "Pro",
      role: "Member"
    },
    {
      id: "3",
      name: "Demo Organization",
      plan: "Trial",
      isDemo: true,
      role: "Admin"
    }
  ])

  if (loading) {
    return (
      <div className="w-16 h-7 bg-muted animate-pulse rounded" />
    )
  }

  const currentOrg = organizations.find(org => org.name === organization?.name) || {
    id: "current",
    name: organization?.name || "Personal Account",
    plan: organization?.subscription_tier || "Free",
    role: profile?.role || "User"
  }

  const handleSwitchOrganization = async (orgId: string) => {
    setSwitchingOrg(orgId)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Here you would implement the actual org switching logic
    console.log('Switching to organization:', orgId)
    
    setSwitchingOrg(null)
  }

  const handleCreateOrganization = () => {
    // Navigate to create organization page
    console.log('Navigate to create organization')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`${isMobile ? "h-7 px-2 text-[10px]" : "h-7 px-3 text-[11px]"} font-medium hover:bg-muted/50 ${className}`}
        >
          <Building className="mr-2 h-3 w-3" />
          {isMobile ? 
            currentOrg.name.split(' ')[0] : 
            currentOrg.name.length > 20 ? 
              `${currentOrg.name.substring(0, 20)}...` : 
              currentOrg.name
          }
          <ChevronDown className="ml-1 h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-64 p-0 border border-border shadow-lg bg-popover"
      >
        {/* Current Organization Header */}
        <div className="p-3 border-b border-border bg-muted/30">
          <CustomMenuLabel className="px-0 py-0 text-xs font-medium text-muted-foreground">
            Current Organization
          </CustomMenuLabel>
          <div className="flex items-center justify-between mt-2">
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-foreground truncate">
                {currentOrg.name}
              </div>
              <div className="text-xs text-muted-foreground">
                {currentOrg.role} • {currentOrg.plan} Plan
              </div>
            </div>
            {currentOrg.isDemo && (
              <Badge variant="outline" className="text-[8px] px-1.5 py-0.5 h-5 ml-2">
                Demo
              </Badge>
            )}
          </div>
        </div>

        {/* Organizations List */}
        <div className="p-2">
          <CustomMenuLabel className="px-2 py-1.5 text-xs">
            Switch Organization
          </CustomMenuLabel>
          
          {organizations.map((org) => {
            const isCurrent = org.name === currentOrg.name
            const isSwitching = switchingOrg === org.id
            
            return (
              <CustomMenuItem
                key={org.id}
                onClick={() => !isCurrent && !isSwitching && handleSwitchOrganization(org.id)}
                disabled={isCurrent || isSwitching}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm cursor-pointer rounded-md transition-colors ${
                  isCurrent 
                    ? 'bg-primary/10 text-primary cursor-default' 
                    : isSwitching
                    ? 'opacity-50 cursor-wait'
                    : 'hover:bg-muted/50'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{org.name}</span>
                    {org.isDemo && (
                      <Badge variant="outline" className="text-[7px] px-1 py-0 h-4">
                        Demo
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {org.role} • {org.plan}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {isSwitching && (
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  )}
                  {isCurrent && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </div>
              </CustomMenuItem>
            )
          })}

          <CustomMenuSeparator className="my-2" />

          <CustomMenuItem
            onClick={handleCreateOrganization}
            className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer rounded-md hover:bg-muted/50 transition-colors"
          >
            <Plus className="w-4 h-4 text-muted-foreground" />
            <span className="text-foreground">Create Organization</span>
          </CustomMenuItem>

          <CustomMenuItem className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer rounded-md hover:bg-muted/50 transition-colors">
            <Building className="w-4 h-4 text-muted-foreground" />
            <span className="text-foreground">Manage Organizations</span>
          </CustomMenuItem>
        </div>

        {/* Organization Settings */}
        <div className="p-2 border-t border-border bg-muted/20">
          <div className="text-[10px] text-muted-foreground px-2 py-1">
            Organization settings and billing can be managed in the main settings panel.
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}