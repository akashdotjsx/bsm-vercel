"use client"

import { useState } from "react"
import { PlatformLayout } from "@/components/layout/platform-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Zap,
  Plus,
  Search,
  Filter,
  Settings,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Slack,
  MessageSquare,
  Shield,
  Users,
  Phone,
  Building2,
  Briefcase,
  UserCheck,
  Activity,
} from "lucide-react"

const integrations = [
  // CRM Integrations
  {
    id: 1,
    name: "Salesforce",
    description: "Sync customer data and tickets with Salesforce CRM",
    category: "CRM",
    status: "Connected",
    icon: Building2,
    color: "text-blue-600",
    lastSync: "3 minutes ago",
    features: ["Customer sync", "Lead management", "Opportunity tracking"],
  },
  {
    id: 2,
    name: "HubSpot",
    description: "Integrate with HubSpot for marketing and sales automation",
    category: "CRM",
    status: "Available",
    icon: Building2,
    color: "text-orange-600",
    lastSync: null,
    features: ["Contact management", "Deal tracking", "Marketing automation"],
  },
  // HR Integrations
  {
    id: 3,
    name: "Workday",
    description: "Connect with Workday for employee data and HR processes",
    category: "HR",
    status: "Connected",
    icon: Users,
    color: "text-purple-600",
    lastSync: "15 minutes ago",
    features: ["Employee directory", "Onboarding workflows", "Time tracking"],
  },
  {
    id: 4,
    name: "BambooHR",
    description: "Sync employee information and HR workflows with BambooHR",
    category: "HR",
    status: "Available",
    icon: Users,
    color: "text-green-600",
    lastSync: null,
    features: ["Employee records", "Performance reviews", "Benefits management"],
  },
  // Service Management Integrations
  {
    id: 5,
    name: "Zendesk",
    description: "Import and sync tickets from Zendesk support platform",
    category: "Service Management",
    status: "Connected",
    icon: Briefcase,
    color: "text-emerald-600",
    lastSync: "1 minute ago",
    features: ["Ticket sync", "Customer data", "SLA tracking"],
  },
  {
    id: 6,
    name: "ServiceNow",
    description: "Enterprise service management integration with ServiceNow",
    category: "Service Management",
    status: "Connected",
    icon: Briefcase,
    color: "text-indigo-600",
    lastSync: "5 minutes ago",
    features: ["ITSM workflows", "Change management", "Asset tracking"],
  },
  {
    id: 7,
    name: "Freshdesk",
    description: "Connect with Freshdesk for customer support operations",
    category: "Service Management",
    status: "Available",
    icon: Briefcase,
    color: "text-blue-500",
    lastSync: null,
    features: ["Ticket management", "Knowledge base", "Automation"],
  },
  {
    id: 8,
    name: "Jira Service Management",
    description: "Integrate with Jira Service Management for IT service delivery",
    category: "Service Management",
    status: "Available",
    icon: Briefcase,
    color: "text-blue-700",
    lastSync: null,
    features: ["Incident management", "Problem tracking", "Change approval"],
  },
  // Collaboration Integrations
  {
    id: 9,
    name: "Slack",
    description: "Connect with Slack for team communication and notifications",
    category: "Collaboration",
    status: "Connected",
    icon: Slack,
    color: "text-purple-600",
    lastSync: "2 minutes ago",
    features: ["Ticket notifications", "Status updates", "Team collaboration"],
  },
  {
    id: 10,
    name: "Microsoft Teams",
    description: "Integrate with Microsoft Teams for enterprise communication",
    category: "Collaboration",
    status: "Connected",
    icon: MessageSquare,
    color: "text-blue-600",
    lastSync: "4 minutes ago",
    features: ["Chat integration", "Meeting scheduling", "File sharing"],
  },
  {
    id: 11,
    name: "WhatsApp Business",
    description: "Enable customer support through WhatsApp Business API",
    category: "Collaboration",
    status: "Available",
    icon: MessageSquare,
    color: "text-green-600",
    lastSync: null,
    features: ["Customer messaging", "Media sharing", "Business profiles"],
  },
  // Telephony Integrations
  {
    id: 12,
    name: "Twilio",
    description: "Voice and SMS integration through Twilio platform",
    category: "Telephony",
    status: "Connected",
    icon: Phone,
    color: "text-red-600",
    lastSync: "8 minutes ago",
    features: ["Voice calls", "SMS messaging", "Call recording"],
  },
  {
    id: 13,
    name: "Genesys",
    description: "Enterprise contact center integration with Genesys Cloud",
    category: "Telephony",
    status: "Available",
    icon: Phone,
    color: "text-purple-700",
    lastSync: null,
    features: ["Omnichannel routing", "Workforce management", "Analytics"],
  },
  {
    id: 14,
    name: "Aircall",
    description: "Cloud-based phone system integration with Aircall",
    category: "Telephony",
    status: "Available",
    icon: Phone,
    color: "text-blue-500",
    lastSync: null,
    features: ["Call management", "Team collaboration", "CRM integration"],
  },
  // Identity Integrations
  {
    id: 15,
    name: "Okta",
    description: "Single sign-on and identity management with Okta",
    category: "Identity",
    status: "Connected",
    icon: UserCheck,
    color: "text-blue-600",
    lastSync: "Just now",
    features: ["SSO authentication", "User provisioning", "MFA"],
  },
  {
    id: 16,
    name: "Azure AD",
    description: "Microsoft Azure Active Directory integration",
    category: "Identity",
    status: "Connected",
    icon: UserCheck,
    color: "text-blue-700",
    lastSync: "2 minutes ago",
    features: ["Directory sync", "Conditional access", "Identity protection"],
  },
]

const categories = [
  { name: "All", count: 16 },
  { name: "CRM", count: 2 },
  { name: "HR", count: 2 },
  { name: "Service Management", count: 4 },
  { name: "Collaboration", count: 3 },
  { name: "Telephony", count: 3 },
  { name: "Identity", count: 2 },
]

export default function IntegrationsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [showAddIntegration, setShowAddIntegration] = useState(false)
  const [showConfigureModal, setShowConfigureModal] = useState(false)
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [selectedIntegration, setSelectedIntegration] = useState<any>(null)
  const [showFilterModal, setShowFilterModal] = useState(false)

  const filteredIntegrations = integrations.filter((integration) => {
    const matchesSearch =
      integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      integration.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "All" || integration.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleConnect = (integration: any) => {
    setSelectedIntegration(integration)
    setShowConnectModal(true)
  }

  const handleConfigure = (integration: any) => {
    setSelectedIntegration(integration)
    setShowConfigureModal(true)
  }

  const handleSettings = (integration: any) => {
    setSelectedIntegration(integration)
    setShowSettingsModal(true)
  }

  return (
    <PlatformLayout
      title="Integrations"
      description="Connect and manage third-party integrations"
      breadcrumbs={[
        { label: "Service Management", href: "/dashboard" },
        { label: "Integrations", href: "/integrations" },
      ]}
    >
      <div className="space-y-6 font-sans text-[13px]">
        <div className="space-y-2">
          <h1 className="text-[13px] font-semibold tracking-tight">Integrations</h1>
          <p className="text-muted-foreground">
            Connect and manage third-party integrations to extend your platform capabilities
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search integrations..."
                className="pl-10 w-80 text-[13px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowFilterModal(true)} className="text-[13px]">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>
          <Button onClick={() => setShowAddIntegration(true)} className="text-[13px]">
            <Plus className="mr-2 h-4 w-4" />
            Add Integration
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Zap className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-[10px] font-medium text-muted-foreground">Total Integrations</p>
                  <p className="text-[13px] font-bold">16</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-[10px] font-medium text-muted-foreground">Connected</p>
                  <p className="text-[13px] font-bold">8</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertCircle className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-[10px] font-medium text-muted-foreground">Available</p>
                  <p className="text-[13px] font-bold">8</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-[10px] font-medium text-muted-foreground">Secure</p>
                  <p className="text-[13px] font-bold">100%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Categories */}
        <div className="flex space-x-2 flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category.name}
              variant={category.name === selectedCategory ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category.name)}
              className="text-[13px]"
            >
              {category.name} ({category.count})
            </Button>
          ))}
        </div>

        {/* Integrations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIntegrations.map((integration) => {
            const Icon = integration.icon
            return (
              <Card key={integration.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Icon className={`h-8 w-8 ${integration.color}`} />
                      <div>
                        <CardTitle className="text-[11px] font-sans">{integration.name}</CardTitle>
                        <Badge
                          variant={integration.status === "Connected" ? "default" : "secondary"}
                          className="mt-1 text-[13px]"
                        >
                          {integration.status}
                        </Badge>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleSettings(integration)}>
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription className="text-[13px] font-sans">{integration.description}</CardDescription>

                  {integration.status === "Connected" && integration.lastSync && (
                    <div className="flex items-center text-[13px] text-muted-foreground font-sans">
                      <CheckCircle className="mr-1 h-3 w-3 text-green-600" />
                      Last sync: {integration.lastSync}
                    </div>
                  )}

                  <div className="space-y-2">
                    <p className="text-[13px] font-medium font-sans">Features:</p>
                    <ul className="text-[13px] text-muted-foreground space-y-1 font-sans">
                      {integration.features.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <CheckCircle className="mr-2 h-3 w-3 text-green-600" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    {integration.status === "Connected" ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 bg-transparent text-[13px]"
                          onClick={() => handleConfigure(integration)}
                        >
                          Configure
                        </Button>
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" className="flex-1 text-[13px]" onClick={() => handleConnect(integration)}>
                        Connect
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Add Integration Modal */}
        <Dialog open={showAddIntegration} onOpenChange={setShowAddIntegration}>
          <DialogContent className="max-w-2xl font-sans">
            <DialogHeader>
              <DialogTitle className="text-[13px]">Add New Integration</DialogTitle>
              <DialogDescription className="text-[13px]">
                Create a custom integration or request a new integration to be added to the marketplace.
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="custom" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="custom" className="text-[13px]">
                  Custom Integration
                </TabsTrigger>
                <TabsTrigger value="request" className="text-[13px]">
                  Request Integration
                </TabsTrigger>
              </TabsList>
              <TabsContent value="custom" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-[13px]">
                      Integration Name
                    </Label>
                    <Input id="name" placeholder="Enter integration name" className="text-[13px]" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-[13px]">
                      Category
                    </Label>
                    <Select>
                      <SelectTrigger className="text-[13px]">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="crm">CRM</SelectItem>
                        <SelectItem value="hr">HR</SelectItem>
                        <SelectItem value="service">Service Management</SelectItem>
                        <SelectItem value="collaboration">Collaboration</SelectItem>
                        <SelectItem value="telephony">Telephony</SelectItem>
                        <SelectItem value="identity">Identity</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-[13px]">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what this integration does"
                    className="text-[13px]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="endpoint" className="text-[13px]">
                      API Endpoint
                    </Label>
                    <Input id="endpoint" placeholder="https://api.example.com" className="text-[13px]" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="auth" className="text-[13px]">
                      Authentication Type
                    </Label>
                    <Select>
                      <SelectTrigger className="text-[13px]">
                        <SelectValue placeholder="Select auth type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="oauth">OAuth 2.0</SelectItem>
                        <SelectItem value="apikey">API Key</SelectItem>
                        <SelectItem value="basic">Basic Auth</SelectItem>
                        <SelectItem value="bearer">Bearer Token</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="request" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="requestName" className="text-[13px]">
                    Integration Name
                  </Label>
                  <Input
                    id="requestName"
                    placeholder="Which integration would you like to see?"
                    className="text-[13px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessCase" className="text-[13px]">
                    Business Case
                  </Label>
                  <Textarea
                    id="businessCase"
                    placeholder="Explain why this integration would be valuable"
                    className="text-[13px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority" className="text-[13px]">
                    Priority
                  </Label>
                  <Select>
                    <SelectTrigger className="text-[13px]">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
            </Tabs>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddIntegration(false)} className="text-[13px]">
                Cancel
              </Button>
              <Button onClick={() => setShowAddIntegration(false)} className="text-[13px]">
                Create Integration
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Connect Integration Modal */}
        <Dialog open={showConnectModal} onOpenChange={setShowConnectModal}>
          <DialogContent className="max-w-lg font-sans">
            <DialogHeader>
              <DialogTitle className="text-[13px]">Connect {selectedIntegration?.name}</DialogTitle>
              <DialogDescription className="text-[13px]">
                Enter your credentials to connect with {selectedIntegration?.name}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey" className="text-[13px]">
                  API Key
                </Label>
                <Input id="apiKey" type="password" placeholder="Enter your API key" className="text-[13px]" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="domain" className="text-[13px]">
                  Domain/Instance URL
                </Label>
                <Input id="domain" placeholder="https://yourcompany.example.com" className="text-[13px]" />
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="testConnection" />
                <Label htmlFor="testConnection" className="text-[13px]">
                  Test connection before saving
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConnectModal(false)} className="text-[13px]">
                Cancel
              </Button>
              <Button onClick={() => setShowConnectModal(false)} className="text-[13px]">
                Connect
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Configure Integration Modal */}
        <Dialog open={showConfigureModal} onOpenChange={setShowConfigureModal}>
          <DialogContent className="max-w-3xl font-sans">
            <DialogHeader>
              <DialogTitle className="text-[13px]">Configure {selectedIntegration?.name}</DialogTitle>
              <DialogDescription className="text-[13px]">
                Manage settings and sync preferences for {selectedIntegration?.name}.
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="settings" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="settings" className="text-[13px]">
                  Settings
                </TabsTrigger>
                <TabsTrigger value="sync" className="text-[13px]">
                  Sync
                </TabsTrigger>
                <TabsTrigger value="mapping" className="text-[13px]">
                  Field Mapping
                </TabsTrigger>
                <TabsTrigger value="logs" className="text-[13px]">
                  Logs
                </TabsTrigger>
              </TabsList>
              <TabsContent value="settings" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[13px]">Connection Status</Label>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-[13px]">Connected</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[13px]">Last Sync</Label>
                    <p className="text-[13px] text-muted-foreground">{selectedIntegration?.lastSync}</p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-[13px]">Auto Sync</Label>
                      <p className="text-[13px] text-muted-foreground">Automatically sync data every 15 minutes</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-[13px]">Notifications</Label>
                      <p className="text-[13px] text-muted-foreground">Send notifications for sync errors</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="sync" className="space-y-4">
                <div className="space-y-4">
                  <Button className="text-[13px]">
                    <Activity className="mr-2 h-4 w-4" />
                    Sync Now
                  </Button>
                  <div className="space-y-2">
                    <Label className="text-[13px]">Sync Frequency</Label>
                    <Select defaultValue="15min">
                      <SelectTrigger className="text-[13px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5min">Every 5 minutes</SelectItem>
                        <SelectItem value="15min">Every 15 minutes</SelectItem>
                        <SelectItem value="30min">Every 30 minutes</SelectItem>
                        <SelectItem value="1hour">Every hour</SelectItem>
                        <SelectItem value="manual">Manual only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="mapping" className="space-y-4">
                <div className="space-y-4">
                  <p className="text-[13px] text-muted-foreground">
                    Map fields between {selectedIntegration?.name} and your system.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-[13px]">Source Field</Label>
                      <Select>
                        <SelectTrigger className="text-[13px]">
                          <SelectValue placeholder="Select source field" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="name">Name</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="phone">Phone</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-[13px]">Target Field</Label>
                      <Select>
                        <SelectTrigger className="text-[13px]">
                          <SelectValue placeholder="Select target field" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="customer_name">Customer Name</SelectItem>
                          <SelectItem value="customer_email">Customer Email</SelectItem>
                          <SelectItem value="customer_phone">Customer Phone</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="logs" className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-[13px]">Sync completed successfully - 2 minutes ago</span>
                  </div>
                  <div className="flex items-center space-x-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-[13px]">Sync completed successfully - 17 minutes ago</span>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfigureModal(false)} className="text-[13px]">
                Close
              </Button>
              <Button onClick={() => setShowConfigureModal(false)} className="text-[13px]">
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Settings Modal */}
        <Dialog open={showSettingsModal} onOpenChange={setShowSettingsModal}>
          <DialogContent className="max-w-lg font-sans">
            <DialogHeader>
              <DialogTitle className="text-[13px]">{selectedIntegration?.name} Settings</DialogTitle>
              <DialogDescription className="text-[13px]">
                Manage integration settings and preferences.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-[13px]">Enable Integration</Label>
                  <p className="text-[13px] text-muted-foreground">Turn this integration on or off</p>
                </div>
                <Switch defaultChecked={selectedIntegration?.status === "Connected"} />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label className="text-[13px]">Integration Name</Label>
                <Input defaultValue={selectedIntegration?.name} className="text-[13px]" />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px]">Description</Label>
                <Textarea defaultValue={selectedIntegration?.description} className="text-[13px]" />
              </div>
              <Separator />
              <div className="space-y-2">
                <Button variant="destructive" className="w-full text-[13px]">
                  Disconnect Integration
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSettingsModal(false)} className="text-[13px]">
                Cancel
              </Button>
              <Button onClick={() => setShowSettingsModal(false)} className="text-[13px]">
                Save Settings
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Filter Modal */}
        <Dialog open={showFilterModal} onOpenChange={setShowFilterModal}>
          <DialogContent className="max-w-md font-sans">
            <DialogHeader>
              <DialogTitle className="text-[13px]">Filter Integrations</DialogTitle>
              <DialogDescription className="text-[13px]">
                Filter integrations by status, category, and other criteria.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[13px]">Status</Label>
                <Select>
                  <SelectTrigger className="text-[13px]">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="connected">Connected</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[13px]">Category</Label>
                <Select>
                  <SelectTrigger className="text-[13px]">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="crm">CRM</SelectItem>
                    <SelectItem value="hr">HR</SelectItem>
                    <SelectItem value="service">Service Management</SelectItem>
                    <SelectItem value="collaboration">Collaboration</SelectItem>
                    <SelectItem value="telephony">Telephony</SelectItem>
                    <SelectItem value="identity">Identity</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[13px]">Last Sync</Label>
                <Select>
                  <SelectTrigger className="text-[13px]">
                    <SelectValue placeholder="Any time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any time</SelectItem>
                    <SelectItem value="1hour">Last hour</SelectItem>
                    <SelectItem value="24hours">Last 24 hours</SelectItem>
                    <SelectItem value="7days">Last 7 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowFilterModal(false)} className="text-[13px]">
                Clear Filters
              </Button>
              <Button onClick={() => setShowFilterModal(false)} className="text-[13px]">
                Apply Filters
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PlatformLayout>
  )
}
