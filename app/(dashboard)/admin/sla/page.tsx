"use client"

import { useState } from "react"
import { AdminPageGuard } from "@/components/auth/admin-page-guard"
import { PageContent } from "@/components/layout/page-content"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Clock, AlertTriangle, CheckCircle, Plus, MoreHorizontal, Edit, Settings, Trash2 } from "lucide-react"

interface SLA {
  id: string
  name: string
  priority: string
  responseTime: string
  resolutionTime: string
  compliance: number
  description?: string
  businessHours: boolean
}

export default function SLAManagementPage() {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showConfigureDialog, setShowConfigureDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedSLA, setSelectedSLA] = useState<SLA | null>(null)
  const [slas, setSLAs] = useState<SLA[]>([
    {
      id: "1",
      name: "Critical Issues",
      priority: "P1",
      responseTime: "15",
      resolutionTime: "4",
      compliance: 98,
      description: "Critical system outages and security incidents",
      businessHours: false,
    },
    {
      id: "2",
      name: "High Priority",
      priority: "P2",
      responseTime: "60",
      resolutionTime: "8",
      compliance: 95,
      description: "High impact issues affecting multiple users",
      businessHours: true,
    },
    {
      id: "3",
      name: "Medium Priority",
      priority: "P3",
      responseTime: "240",
      resolutionTime: "24",
      compliance: 92,
      description: "Standard issues with moderate impact",
      businessHours: true,
    },
    {
      id: "4",
      name: "Low Priority",
      priority: "P4",
      responseTime: "480",
      resolutionTime: "72",
      compliance: 89,
      description: "Minor issues and enhancement requests",
      businessHours: true,
    },
  ])

  const [formData, setFormData] = useState({
    name: "",
    priority: "",
    responseTime: "",
    resolutionTime: "",
    description: "",
    businessHours: true,
  })

  const calculateOverallCompliance = () => {
    const totalCompliance = slas.reduce((sum, sla) => sum + sla.compliance, 0)
    return (totalCompliance / slas.length).toFixed(1)
  }

  const formatTime = (minutes: string) => {
    const mins = Number.parseInt(minutes)
    if (mins < 60) return `${mins} min`
    if (mins < 1440) return `${Math.floor(mins / 60)}h`
    return `${Math.floor(mins / 1440)}d`
  }

  const handleCreateSLA = () => {
    const newSLA: SLA = {
      id: Date.now().toString(),
      name: formData.name,
      priority: formData.priority,
      responseTime: formData.responseTime,
      resolutionTime: formData.resolutionTime,
      compliance: Math.floor(Math.random() * 10) + 85, // Simulate compliance
      description: formData.description,
      businessHours: formData.businessHours,
    }
    setSLAs([...slas, newSLA])
    setShowCreateDialog(false)
    resetForm()
  }

  const handleEditSLA = () => {
    if (!selectedSLA) return
    setSLAs(slas.map((sla) => (sla.id === selectedSLA.id ? { ...sla, ...formData } : sla)))
    setShowEditDialog(false)
    resetForm()
  }

  const handleDeleteSLA = () => {
    if (!selectedSLA) return
    setSLAs(slas.filter((sla) => sla.id !== selectedSLA.id))
    setShowDeleteDialog(false)
    setSelectedSLA(null)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      priority: "",
      responseTime: "",
      resolutionTime: "",
      description: "",
      businessHours: true,
    })
    setSelectedSLA(null)
  }

  const openEditDialog = (sla: SLA) => {
    setSelectedSLA(sla)
    setFormData({
      name: sla.name,
      priority: sla.priority,
      responseTime: sla.responseTime,
      resolutionTime: sla.resolutionTime,
      description: sla.description || "",
      businessHours: sla.businessHours,
    })
    setShowEditDialog(true)
  }

  return (
    <AdminPageGuard permission="administration.view">
      <PageContent
        title="SLA Management"
        description="Configure and monitor Service Level Agreements"
        breadcrumb={[
          { label: "Administration", href: "/admin" },
          { label: "SLA Management", href: "/admin/sla" },
        ]}
      >
      <div className="space-y-6 font-sans text-[13px]">
        <div>
          <h1 className="text-[13px] font-semibold tracking-tight">SLA Management</h1>
          <p className="text-muted-foreground">Configure and monitor Service Level Agreements</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm font-medium">SLA Compliance</p>
                  <p className="text-[13px] font-bold">{calculateOverallCompliance()}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Avg Response Time</p>
                  <p className="text-[13px] font-bold">2.4h</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-sm font-medium">Breached SLAs</p>
                  <p className="text-[13px] font-bold">12</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-purple-500" />
                <div>
                  <p className="text-sm font-medium">Active SLAs</p>
                  <p className="text-[13px] font-bold">{slas.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-[11px] font-semibold">SLA Policies</CardTitle>
                <CardDescription>Configure response and resolution time targets</CardDescription>
              </div>
              <Button size="sm" onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create SLA
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {slas.map((sla) => (
                <div key={sla.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg shadow-sm">
                  <div className="flex items-center space-x-4">
                    <Badge
                      variant={sla.priority === "P1" ? "destructive" : sla.priority === "P2" ? "default" : "secondary"}
                    >
                      {sla.priority}
                    </Badge>
                    <div>
                      <p className="font-medium">{sla.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Response: {formatTime(sla.responseTime)} | Resolution: {formatTime(sla.resolutionTime)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge variant="outline">{sla.compliance}% compliance</Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(sla)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit SLA
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedSLA(sla)
                            setShowConfigureDialog(true)
                          }}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Configure
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedSLA(sla)
                            setShowDeleteDialog(true)
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New SLA</DialogTitle>
              <DialogDescription>Define response and resolution time targets for this SLA policy.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">SLA Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Critical Issues"
                />
              </div>
              <div>
                <Label htmlFor="priority">Priority Level</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="P1">P1 - Critical</SelectItem>
                    <SelectItem value="P2">P2 - High</SelectItem>
                    <SelectItem value="P3">P3 - Medium</SelectItem>
                    <SelectItem value="P4">P4 - Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="response">Response Time (minutes)</Label>
                  <Input
                    id="response"
                    type="number"
                    value={formData.responseTime}
                    onChange={(e) => setFormData({ ...formData, responseTime: e.target.value })}
                    placeholder="15"
                  />
                </div>
                <div>
                  <Label htmlFor="resolution">Resolution Time (hours)</Label>
                  <Input
                    id="resolution"
                    type="number"
                    value={formData.resolutionTime}
                    onChange={(e) =>
                      setFormData({ ...formData, resolutionTime: (Number.parseInt(e.target.value) * 60).toString() })
                    }
                    placeholder="4"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe when this SLA applies..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateSLA}>Create SLA</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit SLA</DialogTitle>
              <DialogDescription>
                Update the response and resolution time targets for this SLA policy.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">SLA Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-priority">Priority Level</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="P1">P1 - Critical</SelectItem>
                    <SelectItem value="P2">P2 - High</SelectItem>
                    <SelectItem value="P3">P3 - Medium</SelectItem>
                    <SelectItem value="P4">P4 - Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-response">Response Time (minutes)</Label>
                  <Input
                    id="edit-response"
                    type="number"
                    value={formData.responseTime}
                    onChange={(e) => setFormData({ ...formData, responseTime: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-resolution">Resolution Time (hours)</Label>
                  <Input
                    id="edit-resolution"
                    type="number"
                    value={Math.floor(Number.parseInt(formData.resolutionTime) / 60)}
                    onChange={(e) =>
                      setFormData({ ...formData, resolutionTime: (Number.parseInt(e.target.value) * 60).toString() })
                    }
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditSLA}>Update SLA</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showConfigureDialog} onOpenChange={setShowConfigureDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Configure SLA Settings</DialogTitle>
              <DialogDescription>Advanced configuration options for {selectedSLA?.name}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Business Hours Only</Label>
                  <Select defaultValue={selectedSLA?.businessHours ? "true" : "false"}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No (24/7)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Escalation Rules</Label>
                  <Select defaultValue="auto">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Automatic</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="disabled">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Notification Recipients</Label>
                <Input placeholder="Enter email addresses separated by commas" />
              </div>
              <div>
                <Label>Breach Threshold (%)</Label>
                <Input type="number" defaultValue="80" min="0" max="100" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfigureDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => setShowConfigureDialog(false)}>Save Configuration</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Delete SLA</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{selectedSLA?.name}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteSLA}>
                Delete SLA
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageContent>
    </AdminPageGuard>
  )
}
