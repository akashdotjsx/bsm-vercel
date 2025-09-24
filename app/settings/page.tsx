"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PlatformLayout } from "@/components/layout/platform-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Settings,
  User,
  Bell,
  Building,
  Palette,
  Users,
  Database,
  Ticket,
  BarChart3,
  Workflow,
  Shield,
  Zap,
  Bot,
  Search,
  Upload,
  Save,
  Server,
  FileText,
  ArrowLeft,
  Check,
  X,
  Trash2,
} from "lucide-react"

export default function SettingsPage() {
  const router = useRouter()
  const [activeSection, setActiveSection] = useState("profile")
  const [searchQuery, setSearchQuery] = useState("")
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")

  const [profileData, setProfileData] = useState({
    name: "Admin User",
    email: "admin@kroolo.com",
    status: "active",
    avatar: "",
    title: "System Administrator",
    department: "IT Services",
    phone: "+1 (555) 123-4567",
    timezone: "America/New_York",
    language: "en",
    bio: "Experienced system administrator with 10+ years in IT service management.",
  })

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [phoneCountryCode, setPhoneCountryCode] = useState("+1")
  const [phoneNumber, setPhoneNumber] = useState("(555) 123-4567")

  const [organizationSettings, setOrganizationSettings] = useState({
    logo: null as File | null,
    logoUrl: "/placeholder.svg?height=80&width=80&text=Logo",
    name: "Kroolo Enterprise",
    urlSlug: "kroolo-enterprise",
  })

  const departments = [
    "IT Services",
    "Human Resources",
    "Finance",
    "Operations",
    "Marketing",
    "Sales",
    "Customer Support",
    "Engineering",
    "Legal",
    "Administration",
  ]

  const countryCodes = [
    { code: "+1", country: "US/CA", flag: "🇺🇸" },
    { code: "+44", country: "UK", flag: "🇬🇧" },
    { code: "+91", country: "IN", flag: "🇮🇳" },
    { code: "+49", country: "DE", flag: "🇩🇪" },
    { code: "+33", country: "FR", flag: "🇫🇷" },
    { code: "+81", country: "JP", flag: "🇯🇵" },
    { code: "+86", country: "CN", flag: "🇨🇳" },
    { code: "+61", country: "AU", flag: "🇦🇺" },
  ]

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        alert("File size must be less than 5MB")
        return
      }

      if (!file.type.startsWith("image/")) {
        alert("Please select an image file")
        return
      }

      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setImagePreview(result)
        setProfileData((prev) => ({ ...prev, avatar: result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview("")
    setProfileData((prev) => ({ ...prev, avatar: "" }))
  }

  const handlePhoneChange = (value: string) => {
    setPhoneNumber(value)
    setProfileData((prev) => ({ ...prev, phone: `${phoneCountryCode} ${value}` }))
  }

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB")
        return
      }
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file")
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        setOrganizationSettings((prev) => ({
          ...prev,
          logo: file,
          logoUrl: e.target?.result as string,
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleLogoRemove = () => {
    setOrganizationSettings((prev) => ({
      ...prev,
      logo: null,
      logoUrl: "/placeholder.svg?height=80&width=80&text=Logo",
    }))
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim()
  }

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    weeklyDigest: false,
    ticketUpdates: true,
    workflowAlerts: true,
    systemAlerts: true,
    marketingEmails: false,
    securityAlerts: true,
    maintenanceNotices: true,
    reportReady: true,
  })

  const [workspaceSettings, setWorkspaceSettings] = useState({
    autoSave: true,
    compactView: false,
    showTutorials: true,
    defaultView: "dashboard",
    itemsPerPage: 25,
    enableKeyboardShortcuts: true,
    showPreviewPanes: true,
    autoRefresh: true,
    collaborativeEditing: true,
  })

  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: "system",
    colorScheme: "blue",
    fontSize: "medium",
    density: "comfortable",
    animations: true,
    reducedMotion: false,
    highContrast: false,
    customCSS: "",
  })

  const [ticketingSettings, setTicketingSettings] = useState({
    autoAssignment: true,
    aiClassification: true,
    defaultPriority: "medium",
    slaEnabled: true,
    escalationRules: true,
    kanbanView: true,
    allowGuestTickets: false,
    requireApproval: false,
    autoClose: true,
    customerSatisfactionSurvey: true,
    ticketNumberFormat: "TKT-{YYYY}-{####}",
    defaultCategory: "general",
  })

  const [analyticsSettings, setAnalyticsSettings] = useState({
    realTimeUpdates: true,
    exportEnabled: true,
    retentionPeriod: "12months",
    dashboardRefresh: "5min",
    alertThresholds: true,
    customReports: true,
    dataSharing: false,
    anonymizeData: true,
    trackingEnabled: true,
    performanceMetrics: true,
  })

  const [assetSettings, setAssetSettings] = useState({
    autoDiscovery: true,
    dependencyMapping: true,
    changeTracking: true,
    complianceScanning: false,
    lifecycleManagement: true,
    integrationSync: true,
    assetTagging: true,
    deprecationAlerts: true,
    maintenanceScheduling: true,
    costTracking: true,
  })

  const [workflowSettings, setWorkflowSettings] = useState({
    visualBuilder: true,
    approvalChains: true,
    automationRules: true,
    conditionalLogic: true,
    parallelProcessing: false,
    auditTrail: true,
    templateLibrary: true,
    versionControl: true,
    rollbackCapability: true,
    testMode: true,
  })

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: "8hours",
    passwordPolicy: "strong",
    auditLogging: true,
    ipRestrictions: false,
    ssoEnabled: false,
    loginAttempts: 5,
    accountLockout: true,
    encryptionEnabled: true,
    securityHeaders: true,
  })

  const [integrationSettings, setIntegrationSettings] = useState({
    apiEnabled: true,
    webhooksEnabled: true,
    rateLimiting: true,
    authMethod: "oauth2",
    logRequests: true,
    cacheEnabled: true,
    syncFrequency: "15min",
    errorRetries: 3,
    timeoutDuration: "30s",
    compressionEnabled: true,
  })

  const [systemSettings, setSystemSettings] = useState({
    autoBackup: true,
    performanceMonitoring: true,
    errorReporting: true,
    maintenanceMode: false,
    debugMode: false,
    compressionEnabled: true,
    cacheSize: "1GB",
    logLevel: "info",
    maxFileSize: "10MB",
    cleanupSchedule: "weekly",
  })

  const [knowledgeSettings, setKnowledgeSettings] = useState({
    aiEnhanced: true,
    autoTagging: true,
    versionControl: true,
    collaborativeEditing: true,
    approvalWorkflow: false,
    publicAccess: false,
    searchIndexing: true,
    contentSuggestions: true,
    duplicateDetection: true,
    archiveOldContent: true,
  })

  const [aiSettings, setAiSettings] = useState({
    enableAI: true,
    autoClassification: true,
    sentimentAnalysis: true,
    smartSuggestions: true,
    languageDetection: true,
    autoTranslation: false,
    confidenceThreshold: 0.8,
    learningMode: true,
    dataCollection: true,
    modelVersion: "latest",
  })

  const settingsNavigation = [
    {
      category: "General",
      items: [
        { id: "profile", label: "Profile", icon: User },
        { id: "notifications", label: "Notifications", icon: Bell },
        { id: "workspace", label: "Workspace", icon: Building },
        { id: "appearance", label: "Appearance", icon: Palette },
      ],
    },
    {
      category: "Platform Configuration",
      items: [
        { id: "ticketing", label: "Ticketing System", icon: Ticket },
        { id: "analytics", label: "Analytics & Reports", icon: BarChart3 },
        { id: "workflows", label: "Workflow Builder", icon: Workflow },
        { id: "assets", label: "Asset Management", icon: Database },
        { id: "knowledge", label: "Knowledge Base", icon: FileText },
        { id: "ai-automation", label: "AI & Automation", icon: Bot },
      ],
    },
    {
      category: "Administration",
      items: [
        { id: "users-teams", label: "Users & Teams", icon: Users },
        { id: "security", label: "Security & Access", icon: Shield },
        { id: "integrations", label: "Integrations", icon: Zap },
        { id: "system", label: "System Settings", icon: Server },
      ],
    },
  ]

  const handleSave = async () => {
    setSaveStatus("saving")
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setSaveStatus("saved")
      setTimeout(() => setSaveStatus("idle"), 2000)
    } catch (error) {
      setSaveStatus("error")
      setTimeout(() => setSaveStatus("idle"), 2000)
    }
  }

  const handleGoHome = () => {
    router.push("/dashboard")
  }

  const renderProfileSection = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Profile</h2>
        <p className="text-sm text-muted-foreground mt-1">Manage your personal information and account settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your profile details and preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20">
              {imagePreview || profileData.avatar ? (
                <img
                  src={imagePreview || profileData.avatar}
                  alt="Profile"
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                  {profileData.name.charAt(0)}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="space-y-2">
              <Label>Profile Picture</Label>
              <div className="flex gap-2">
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="image-upload" />
                <Button variant="outline" size="sm" onClick={() => document.getElementById("image-upload")?.click()}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Image
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveImage}
                  disabled={!imagePreview && !profileData.avatar}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Max file size: 5MB. Supported formats: JPG, PNG, GIF</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input
                value={profileData.name}
                onChange={(e) => setProfileData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Enter your full name"
              />
            </div>
            <div className="space-y-2">
              <Label>Email Address *</Label>
              <Input
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="Enter your email"
              />
            </div>
            <div className="space-y-2">
              <Label>Job Title</Label>
              <Input
                value={profileData.title}
                onChange={(e) => setProfileData((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Enter your job title"
              />
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Select
                value={profileData.department}
                onValueChange={(value) => setProfileData((prev) => ({ ...prev, department: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <div className="flex gap-2">
                <Select
                  value={phoneCountryCode}
                  onValueChange={(value) => {
                    setPhoneCountryCode(value)
                    setProfileData((prev) => ({ ...prev, phone: `${value} ${phoneNumber}` }))
                  }}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {countryCodes.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        <span className="flex items-center gap-2">
                          <span>{country.flag}</span>
                          <span>{country.code}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={phoneNumber}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="Enter phone number"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select
                value={profileData.timezone}
                onValueChange={(value) => setProfileData((prev) => ({ ...prev, timezone: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                  <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="Europe/London">London (GMT)</SelectItem>
                  <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Bio</Label>
            <Textarea
              value={profileData.bio}
              onChange={(e) => setProfileData((prev) => ({ ...prev, bio: e.target.value }))}
              placeholder="Tell us about yourself..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Account Status</Label>
            <div className="flex items-center gap-2">
              <Badge variant={profileData.status === "active" ? "default" : "secondary"}>
                {profileData.status === "active" ? "Active" : "Inactive"}
              </Badge>
              <span className="text-sm text-muted-foreground">Your account is currently {profileData.status}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderNotificationsSection = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Notifications</h2>
        <p className="text-sm text-muted-foreground mt-1">Manage how you receive notifications and updates</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>Configure which emails you want to receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive email notifications for important updates</p>
            </div>
            <Switch
              checked={notificationSettings.emailNotifications}
              onCheckedChange={(checked) =>
                setNotificationSettings((prev) => ({ ...prev, emailNotifications: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Ticket Updates</Label>
              <p className="text-sm text-muted-foreground">Get notified when tickets are updated</p>
            </div>
            <Switch
              checked={notificationSettings.ticketUpdates}
              onCheckedChange={(checked) => setNotificationSettings((prev) => ({ ...prev, ticketUpdates: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Workflow Alerts</Label>
              <p className="text-sm text-muted-foreground">Notifications for workflow approvals and completions</p>
            </div>
            <Switch
              checked={notificationSettings.workflowAlerts}
              onCheckedChange={(checked) => setNotificationSettings((prev) => ({ ...prev, workflowAlerts: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">System Alerts</Label>
              <p className="text-sm text-muted-foreground">Important system notifications and maintenance</p>
            </div>
            <Switch
              checked={notificationSettings.systemAlerts}
              onCheckedChange={(checked) => setNotificationSettings((prev) => ({ ...prev, systemAlerts: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Weekly Digest</Label>
              <p className="text-sm text-muted-foreground">Get a weekly summary of your activity</p>
            </div>
            <Switch
              checked={notificationSettings.weeklyDigest}
              onCheckedChange={(checked) => setNotificationSettings((prev) => ({ ...prev, weeklyDigest: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Push Notifications</CardTitle>
          <CardDescription>Browser and mobile push notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Browser Notifications</Label>
              <p className="text-sm text-muted-foreground">Show notifications in your browser</p>
            </div>
            <Switch
              checked={notificationSettings.pushNotifications}
              onCheckedChange={(checked) =>
                setNotificationSettings((prev) => ({ ...prev, pushNotifications: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Security Alerts</Label>
              <p className="text-sm text-muted-foreground">Critical security notifications</p>
            </div>
            <Switch
              checked={notificationSettings.securityAlerts}
              onCheckedChange={(checked) => setNotificationSettings((prev) => ({ ...prev, securityAlerts: checked }))}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderWorkspaceSection = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Workspace</h2>
        <p className="text-sm text-muted-foreground mt-1">Configure your workspace settings and preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organization Settings</CardTitle>
          <CardDescription>Manage your organization's branding and identity</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Organization Logo */}
          <div className="space-y-3">
            <Label className="font-medium">Organization Logo</Label>
            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  src={organizationSettings.logoUrl || "/placeholder.svg"}
                  alt="Organization Logo"
                  className="w-20 h-20 rounded-lg object-cover border border-gray-100"
                />
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => document.getElementById("logo-upload")?.click()}>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Logo
                  </Button>
                  {organizationSettings.logo && (
                    <Button variant="outline" size="sm" onClick={handleLogoRemove}>
                      <X className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Recommended: 200x200px, PNG or JPG, max 5MB</p>
              </div>
              <input id="logo-upload" type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            </div>
          </div>

          {/* Organization Name */}
          <div className="space-y-2">
            <Label className="font-medium">Organization Name</Label>
            <Input
              value={organizationSettings.name}
              onChange={(e) => {
                const newName = e.target.value
                setOrganizationSettings((prev) => ({
                  ...prev,
                  name: newName,
                  urlSlug: generateSlug(newName),
                }))
              }}
              placeholder="Enter organization name"
              className="max-w-md"
            />
            <p className="text-xs text-muted-foreground">This name will appear in your workspace and communications</p>
          </div>

          {/* URL Slug */}
          <div className="space-y-2">
            <Label className="font-medium">URL Slug</Label>
            <div className="flex items-center gap-2 max-w-md">
              <span className="text-sm text-muted-foreground">kroolo.com/</span>
              <Input
                value={organizationSettings.urlSlug}
                onChange={(e) => {
                  const slug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")
                  setOrganizationSettings((prev) => ({ ...prev, urlSlug: slug }))
                }}
                placeholder="organization-slug"
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              This will be your organization's unique URL. Only lowercase letters, numbers, and hyphens allowed.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>General Preferences</CardTitle>
          <CardDescription>Customize your workspace experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Auto-save</Label>
              <p className="text-sm text-muted-foreground">Automatically save your work</p>
            </div>
            <Switch
              checked={workspaceSettings.autoSave}
              onCheckedChange={(checked) => setWorkspaceSettings((prev) => ({ ...prev, autoSave: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Compact View</Label>
              <p className="text-sm text-muted-foreground">Use a more compact interface layout</p>
            </div>
            <Switch
              checked={workspaceSettings.compactView}
              onCheckedChange={(checked) => setWorkspaceSettings((prev) => ({ ...prev, compactView: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Show Tutorials</Label>
              <p className="text-sm text-muted-foreground">Display helpful tutorials and tips</p>
            </div>
            <Switch
              checked={workspaceSettings.showTutorials}
              onCheckedChange={(checked) => setWorkspaceSettings((prev) => ({ ...prev, showTutorials: checked }))}
            />
          </div>

          <div className="space-y-2">
            <Label className="font-medium">Default View</Label>
            <Select
              value={workspaceSettings.defaultView}
              onValueChange={(value) => setWorkspaceSettings((prev) => ({ ...prev, defaultView: value }))}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dashboard">Dashboard</SelectItem>
                <SelectItem value="tickets">Tickets</SelectItem>
                <SelectItem value="analytics">Analytics</SelectItem>
                <SelectItem value="assets">Assets</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="font-medium">Items Per Page</Label>
            <Select
              value={workspaceSettings.itemsPerPage.toString()}
              onValueChange={(value) =>
                setWorkspaceSettings((prev) => ({ ...prev, itemsPerPage: Number.parseInt(value) }))
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderAppearanceSection = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Appearance</h2>
        <p className="text-sm text-muted-foreground mt-1">Customize the look and feel of your interface</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Theme Settings</CardTitle>
          <CardDescription>Choose your preferred theme and color scheme</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="font-medium">Theme</Label>
            <Select
              value={appearanceSettings.theme}
              onValueChange={(value) => setAppearanceSettings((prev) => ({ ...prev, theme: value }))}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="font-medium">Color Scheme</Label>
            <Select
              value={appearanceSettings.colorScheme}
              onValueChange={(value) => setAppearanceSettings((prev) => ({ ...prev, colorScheme: value }))}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="blue">Blue</SelectItem>
                <SelectItem value="green">Green</SelectItem>
                <SelectItem value="purple">Purple</SelectItem>
                <SelectItem value="orange">Orange</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="font-medium">Font Size</Label>
            <Select
              value={appearanceSettings.fontSize}
              onValueChange={(value) => setAppearanceSettings((prev) => ({ ...prev, fontSize: value }))}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="large">Large</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Animations</Label>
              <p className="text-sm text-muted-foreground">Enable interface animations</p>
            </div>
            <Switch
              checked={appearanceSettings.animations}
              onCheckedChange={(checked) => setAppearanceSettings((prev) => ({ ...prev, animations: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">High Contrast</Label>
              <p className="text-sm text-muted-foreground">Increase contrast for better accessibility</p>
            </div>
            <Switch
              checked={appearanceSettings.highContrast}
              onCheckedChange={(checked) => setAppearanceSettings((prev) => ({ ...prev, highContrast: checked }))}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderTicketingSection = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Ticketing System</h2>
        <p className="text-sm text-muted-foreground mt-1">Configure ticket management, SLA, and automation settings</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Ticket Management</CardTitle>
            <CardDescription>Core ticketing system configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Auto-assignment</Label>
                <p className="text-sm text-muted-foreground">Automatically assign tickets to available agents</p>
              </div>
              <Switch
                checked={ticketingSettings.autoAssignment}
                onCheckedChange={(checked) => setTicketingSettings((prev) => ({ ...prev, autoAssignment: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">AI Classification</Label>
                <p className="text-sm text-muted-foreground">
                  Use AI to automatically categorize and prioritize tickets
                </p>
              </div>
              <Switch
                checked={ticketingSettings.aiClassification}
                onCheckedChange={(checked) => setTicketingSettings((prev) => ({ ...prev, aiClassification: checked }))}
              />
            </div>

            <div className="space-y-2">
              <Label className="font-medium">Default Priority</Label>
              <Select
                value={ticketingSettings.defaultPriority}
                onValueChange={(value) => setTicketingSettings((prev) => ({ ...prev, defaultPriority: value }))}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SLA & Escalation</CardTitle>
            <CardDescription>Service level agreements and escalation rules</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">SLA Tracking</Label>
                <p className="text-sm text-muted-foreground">Enable SLA monitoring and alerts</p>
              </div>
              <Switch
                checked={ticketingSettings.slaEnabled}
                onCheckedChange={(checked) => setTicketingSettings((prev) => ({ ...prev, slaEnabled: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Escalation Rules</Label>
                <p className="text-sm text-muted-foreground">Automatically escalate overdue tickets</p>
              </div>
              <Switch
                checked={ticketingSettings.escalationRules}
                onCheckedChange={(checked) => setTicketingSettings((prev) => ({ ...prev, escalationRules: checked }))}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderAnalyticsSection = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Analytics & Reports</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure dashboard settings, reporting, and data retention
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Dashboard Settings</CardTitle>
            <CardDescription>Real-time analytics and performance monitoring</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Real-time Updates</Label>
                <p className="text-sm text-muted-foreground">Enable live dashboard updates</p>
              </div>
              <Switch
                checked={analyticsSettings.realTimeUpdates}
                onCheckedChange={(checked) => setAnalyticsSettings((prev) => ({ ...prev, realTimeUpdates: checked }))}
              />
            </div>

            <div className="space-y-2">
              <Label className="font-medium">Refresh Interval</Label>
              <Select
                value={analyticsSettings.dashboardRefresh}
                onValueChange={(value) => setAnalyticsSettings((prev) => ({ ...prev, dashboardRefresh: value }))}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1min">1 minute</SelectItem>
                  <SelectItem value="5min">5 minutes</SelectItem>
                  <SelectItem value="15min">15 minutes</SelectItem>
                  <SelectItem value="30min">30 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Export Functionality</Label>
                <p className="text-sm text-muted-foreground">Allow CSV and PDF exports</p>
              </div>
              <Switch
                checked={analyticsSettings.exportEnabled}
                onCheckedChange={(checked) => setAnalyticsSettings((prev) => ({ ...prev, exportEnabled: checked }))}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderSecuritySection = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Security & Access</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage authentication, authorization, and security policies
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Authentication</CardTitle>
            <CardDescription>User authentication and session management</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">Require 2FA for all users</p>
              </div>
              <Switch
                checked={securitySettings.twoFactorAuth}
                onCheckedChange={(checked) => setSecuritySettings((prev) => ({ ...prev, twoFactorAuth: checked }))}
              />
            </div>

            <div className="space-y-2">
              <Label className="font-medium">Session Timeout</Label>
              <Select
                value={securitySettings.sessionTimeout}
                onValueChange={(value) => setSecuritySettings((prev) => ({ ...prev, sessionTimeout: value }))}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1hour">1 hour</SelectItem>
                  <SelectItem value="4hours">4 hours</SelectItem>
                  <SelectItem value="8hours">8 hours</SelectItem>
                  <SelectItem value="24hours">24 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Audit Logging</Label>
                <p className="text-sm text-muted-foreground">Log all user activities and system changes</p>
              </div>
              <Switch
                checked={securitySettings.auditLogging}
                onCheckedChange={(checked) => setSecuritySettings((prev) => ({ ...prev, auditLogging: checked }))}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderWorkflowsSection = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Workflow Builder</h2>
        <p className="text-sm text-muted-foreground mt-1">Configure workflow automation and approval processes</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Workflow Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Visual Builder</Label>
              <p className="text-sm text-muted-foreground">Enable drag-and-drop workflow designer</p>
            </div>
            <Switch
              checked={workflowSettings.visualBuilder}
              onCheckedChange={(checked) => setWorkflowSettings((prev) => ({ ...prev, visualBuilder: checked }))}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Approval Chains</Label>
              <p className="text-sm text-muted-foreground">Enable multi-level approval workflows</p>
            </div>
            <Switch
              checked={workflowSettings.approvalChains}
              onCheckedChange={(checked) => setWorkflowSettings((prev) => ({ ...prev, approvalChains: checked }))}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderAssetsSection = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Asset Management</h2>
        <p className="text-sm text-muted-foreground mt-1">Configure CMDB, asset discovery, and lifecycle management</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Asset Discovery</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Auto Discovery</Label>
              <p className="text-sm text-muted-foreground">Automatically discover network assets</p>
            </div>
            <Switch
              checked={assetSettings.autoDiscovery}
              onCheckedChange={(checked) => setAssetSettings((prev) => ({ ...prev, autoDiscovery: checked }))}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Dependency Mapping</Label>
              <p className="text-sm text-muted-foreground">Map asset relationships and dependencies</p>
            </div>
            <Switch
              checked={assetSettings.dependencyMapping}
              onCheckedChange={(checked) => setAssetSettings((prev) => ({ ...prev, dependencyMapping: checked }))}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderKnowledgeSection = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Knowledge Base</h2>
        <p className="text-sm text-muted-foreground mt-1">Configure knowledge base settings and content management</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Knowledge Base Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">AI Enhanced</Label>
              <p className="text-sm text-muted-foreground">Enable AI-powered content suggestions</p>
            </div>
            <Switch
              checked={knowledgeSettings.aiEnhanced}
              onCheckedChange={(checked) => setKnowledgeSettings((prev) => ({ ...prev, aiEnhanced: checked }))}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Auto Tagging</Label>
              <p className="text-sm text-muted-foreground">Automatically tag articles with relevant keywords</p>
            </div>
            <Switch
              checked={knowledgeSettings.autoTagging}
              onCheckedChange={(checked) => setKnowledgeSettings((prev) => ({ ...prev, autoTagging: checked }))}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderAISection = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">AI & Automation</h2>
        <p className="text-sm text-muted-foreground mt-1">Configure AI settings and automation features</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>AI Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Enable AI</Label>
              <p className="text-sm text-muted-foreground">Enable AI features across the platform</p>
            </div>
            <Switch
              checked={aiSettings.enableAI}
              onCheckedChange={(checked) => setAiSettings((prev) => ({ ...prev, enableAI: checked }))}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Auto Classification</Label>
              <p className="text-sm text-muted-foreground">Automatically classify tickets and assets</p>
            </div>
            <Switch
              checked={aiSettings.autoClassification}
              onCheckedChange={(checked) => setAiSettings((prev) => ({ ...prev, autoClassification: checked }))}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderUsersTeamsSection = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Users & Teams</h2>
        <p className="text-sm text-muted-foreground mt-1">Manage users, teams, and access permissions</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">User Invites</Label>
              <p className="text-sm text-muted-foreground">Allow users to invite new members</p>
            </div>
            <Switch
              checked={systemSettings.userInvites}
              onCheckedChange={(checked) => setSystemSettings((prev) => ({ ...prev, userInvites: checked }))}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Team Management</Label>
              <p className="text-sm text-muted-foreground">Enable team creation and management</p>
            </div>
            <Switch
              checked={systemSettings.teamManagement}
              onCheckedChange={(checked) => setSystemSettings((prev) => ({ ...prev, teamManagement: checked }))}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderIntegrationsSection = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Integrations</h2>
        <p className="text-sm text-muted-foreground mt-1">Configure integrations with third-party services</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>API Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">API Enabled</Label>
              <p className="text-sm text-muted-foreground">Enable the platform API</p>
            </div>
            <Switch
              checked={integrationSettings.apiEnabled}
              onCheckedChange={(checked) => setIntegrationSettings((prev) => ({ ...prev, apiEnabled: checked }))}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Webhooks Enabled</Label>
              <p className="text-sm text-muted-foreground">Enable webhooks for real-time updates</p>
            </div>
            <Switch
              checked={integrationSettings.webhooksEnabled}
              onCheckedChange={(checked) => setIntegrationSettings((prev) => ({ ...prev, webhooksEnabled: checked }))}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderSystemSection = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">System Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">Configure core system settings and maintenance options</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Backup Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Auto Backup</Label>
              <p className="text-sm text-muted-foreground">Automatically back up system data</p>
            </div>
            <Switch
              checked={systemSettings.autoBackup}
              onCheckedChange={(checked) => setSystemSettings((prev) => ({ ...prev, autoBackup: checked }))}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Performance Monitoring</Label>
              <p className="text-sm text-muted-foreground">Enable performance monitoring and alerts</p>
            </div>
            <Switch
              checked={systemSettings.performanceMonitoring}
              onCheckedChange={(checked) => setSystemSettings((prev) => ({ ...prev, performanceMonitoring: checked }))}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderDefaultSection = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">Configure your platform settings and preferences</p>
      </div>
      <Card>
        <CardContent className="p-8 text-center">
          <Settings className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Select a Settings Category</h3>
          <p className="text-sm text-muted-foreground">Choose a category from the sidebar to configure your settings</p>
        </CardContent>
      </Card>
    </div>
  )

  const renderContent = () => {
    switch (activeSection) {
      case "profile":
        return renderProfileSection()
      case "notifications":
        return renderNotificationsSection()
      case "workspace":
        return renderWorkspaceSection()
      case "appearance":
        return renderAppearanceSection()
      case "ticketing":
        return renderTicketingSection()
      case "analytics":
        return renderAnalyticsSection()
      case "security":
        return renderSecuritySection()
      case "workflows":
        return renderWorkflowsSection()
      case "assets":
        return renderAssetsSection()
      case "knowledge":
        return renderKnowledgeSection()
      case "ai-automation":
        return renderAISection()
      case "users-teams":
        return renderUsersTeamsSection()
      case "integrations":
        return renderIntegrationsSection()
      case "system":
        return renderSystemSection()
      default:
        return renderDefaultSection()
    }
  }

  return (
    <PlatformLayout>
      <div className="flex h-full bg-background">
        <div className="w-64 bg-card border-r border-gray-100 flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Settings className="w-4 h-4 text-primary-foreground" />
                </div>
                <h1 className="text-lg font-semibold">Settings</h1>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGoHome}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Home
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search settings"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-sm border-gray-100"
              />
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto p-4">
            <nav className="space-y-6">
              {settingsNavigation.map((category) => (
                <div key={category.category}>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    {category.category}
                  </h3>
                  <ul className="space-y-1">
                    {category.items
                      .filter((item) => item.label.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((item) => {
                        const Icon = item.icon
                        return (
                          <li key={item.id}>
                            <button
                              onClick={() => setActiveSection(item.id)}
                              className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                                activeSection === item.id
                                  ? "bg-primary/10 text-primary"
                                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                              {item.label}
                            </button>
                          </li>
                        )
                      })}
                  </ul>
                </div>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-8">
            {renderContent()}

            <div className="mt-8 pt-6 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Changes are automatically saved when you modify settings
                </p>
                <Button onClick={handleSave} disabled={saveStatus === "saving"} className="px-6">
                  {saveStatus === "saving" && (
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  )}
                  {saveStatus === "saved" && <Check className="w-4 h-4 mr-2" />}
                  {saveStatus === "error" && <X className="w-4 h-4 mr-2" />}
                  {saveStatus === "idle" && <Save className="w-4 h-4 mr-2" />}
                  {saveStatus === "saving"
                    ? "Saving..."
                    : saveStatus === "saved"
                      ? "Saved!"
                      : saveStatus === "error"
                        ? "Error"
                        : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PlatformLayout>
  )
}
