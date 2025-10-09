"use client"

import { useState } from "react"
import { PageContent } from "@/components/layout/page-content"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, Clock, AlertTriangle, TrendingUp, Users } from "lucide-react"

interface PriorityLevel {
  id: string
  name: string
  color: string
  responseTime: string
  description: string
}

interface MatrixCell {
  impact: string
  urgency: string
  priority: PriorityLevel
}

export default function PriorityMatrixPage() {
  const [isConfigureOpen, setIsConfigureOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("matrix")

  const [priorityLevels, setPriorityLevels] = useState<PriorityLevel[]>([
    {
      id: "p1",
      name: "Critical",
      color: "destructive",
      responseTime: "Immediate",
      description: "Immediate response required",
    },
    { id: "p2", name: "High", color: "orange", responseTime: "1 hour", description: "Response within 1 hour" },
    { id: "p3", name: "Medium", color: "secondary", responseTime: "4 hours", description: "Response within 4 hours" },
    { id: "p4", name: "Low", color: "outline", responseTime: "8 hours", description: "Response within 8 hours" },
  ])

  const [matrixConfig, setMatrixConfig] = useState<MatrixCell[]>([
    { impact: "high", urgency: "high", priority: priorityLevels[0] },
    { impact: "high", urgency: "medium", priority: priorityLevels[1] },
    { impact: "high", urgency: "low", priority: priorityLevels[2] },
    { impact: "medium", urgency: "high", priority: priorityLevels[1] },
    { impact: "medium", urgency: "medium", priority: priorityLevels[2] },
    { impact: "medium", urgency: "low", priority: priorityLevels[3] },
    { impact: "low", urgency: "high", priority: priorityLevels[2] },
    { impact: "low", urgency: "medium", priority: priorityLevels[3] },
    { impact: "low", urgency: "low", priority: priorityLevels[3] },
  ])

  const [newPriority, setNewPriority] = useState({
    name: "",
    color: "secondary",
    responseTime: "",
    description: "",
  })

  const handleAddPriority = () => {
    if (newPriority.name && newPriority.responseTime) {
      const priority: PriorityLevel = {
        id: `p${priorityLevels.length + 1}`,
        ...newPriority,
      }
      setPriorityLevels([...priorityLevels, priority])
      setNewPriority({ name: "", color: "secondary", responseTime: "", description: "" })
    }
  }

  const handleDeletePriority = (id: string) => {
    setPriorityLevels(priorityLevels.filter((p) => p.id !== id))
  }

  const handleMatrixCellChange = (impact: string, urgency: string, priorityId: string) => {
    const priority = priorityLevels.find((p) => p.id === priorityId)
    if (priority) {
      setMatrixConfig((prev) =>
        prev.map((cell) => (cell.impact === impact && cell.urgency === urgency ? { ...cell, priority } : cell)),
      )
    }
  }

  const getMatrixCell = (impact: string, urgency: string) => {
    return matrixConfig.find((cell) => cell.impact === impact && cell.urgency === urgency)
  }

  const getBadgeVariant = (color: string) => {
    switch (color) {
      case "destructive":
        return "destructive"
      case "orange":
        return "default"
      case "secondary":
        return "secondary"
      case "outline":
        return "outline"
      default:
        return "default"
    }
  }

  const getBadgeClassName = (color: string) => {
    switch (color) {
      case "orange":
        return "bg-orange-500 hover:bg-orange-600"
      default:
        return ""
    }
  }

  return (
    <PageContent
      title="Priority Matrix"
      description="Configure priority levels based on impact and urgency"
      breadcrumb={[
        { label: "Administration", href: "/admin" },
        { label: "Priority Matrix", href: "/admin/priorities" },
      ]}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-[13px] font-semibold text-foreground">Priority Matrix</h1>
          <p className="text-[13px] text-muted-foreground mt-1">Configure priority levels based on impact and urgency</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <div>
                  <p className="text-[13px] font-medium">Critical Tickets</p>
                  <p className="text-[13px] font-bold">12</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-[13px] font-medium">Avg Response Time</p>
                  <p className="text-[13px] font-bold">2.4h</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-[13px] font-medium">SLA Compliance</p>
                  <p className="text-[13px] font-bold">94.2%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-[13px] font-medium">Priority Levels</p>
                  <p className="text-[13px] font-bold">{priorityLevels.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-[11px] font-semibold">Impact vs Urgency Matrix</CardTitle>
                <CardDescription className="text-[13px]">
                  Define priority levels based on business impact and urgency
                </CardDescription>
              </div>
              <Dialog open={isConfigureOpen} onOpenChange={setIsConfigureOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Configure
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Configure Priority Matrix</DialogTitle>
                    <DialogDescription className="text-[13px]">
                      Manage priority levels and configure the impact vs urgency matrix
                    </DialogDescription>
                  </DialogHeader>

                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="matrix">Matrix Configuration</TabsTrigger>
                      <TabsTrigger value="priorities">Priority Levels</TabsTrigger>
                    </TabsList>

                    <TabsContent value="matrix" className="space-y-4">
                      <div className="grid grid-cols-4 gap-4">
                        <div className="text-center font-medium text-[13px] text-muted-foreground p-2">Impact / Urgency</div>
                        <div className="text-center font-medium text-[13px] bg-red-50 p-2 rounded">High Urgency</div>
                        <div className="text-center font-medium text-[13px] bg-yellow-50 p-2 rounded">
                          Medium Urgency
                        </div>
                        <div className="text-center font-medium text-[13px] bg-green-50 p-2 rounded">Low Urgency</div>

                        {["high", "medium", "low"].map((impact) => (
                          <>
                            <div
                              key={`${impact}-label`}
                              className={`text-center font-medium text-[13px] p-2 rounded ${
                                impact === "high" ? "bg-red-50" : impact === "medium" ? "bg-yellow-50" : "bg-green-50"
                              }`}
                            >
                              {impact.charAt(0).toUpperCase() + impact.slice(1)} Impact
                            </div>
                            {["high", "medium", "low"].map((urgency) => {
                              const cell = getMatrixCell(impact, urgency)
                              return (
                                <div key={`${impact}-${urgency}`} className="p-2">
                                  <Select
                                    value={cell?.priority.id}
                                    onValueChange={(value) => handleMatrixCellChange(impact, urgency, value)}
                                  >
                                    <SelectTrigger className="w-full">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {priorityLevels.map((priority) => (
                                        <SelectItem key={priority.id} value={priority.id}>
                                          {priority.name} ({priority.responseTime})
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              )
                            })}
                          </>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="priorities" className="space-y-4">
                      <div className="space-y-4">
                        <div className="grid grid-cols-4 gap-4">
                          <div>
                            <Label htmlFor="priority-name" className="text-[13px]">
                              Priority Name
                            </Label>
                            <Input
                              id="priority-name"
                              value={newPriority.name}
                              onChange={(e) => setNewPriority({ ...newPriority, name: e.target.value })}
                              placeholder="e.g., Critical"
                              className="text-[13px]"
                            />
                          </div>
                          <div>
                            <Label htmlFor="priority-color" className="text-[13px]">
                              Color
                            </Label>
                            <Select
                              value={newPriority.color}
                              onValueChange={(value) => setNewPriority({ ...newPriority, color: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="destructive">Red (Critical)</SelectItem>
                                <SelectItem value="orange">Orange (High)</SelectItem>
                                <SelectItem value="secondary">Yellow (Medium)</SelectItem>
                                <SelectItem value="outline">Green (Low)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="response-time" className="text-[13px]">
                              Response Time
                            </Label>
                            <Input
                              id="response-time"
                              value={newPriority.responseTime}
                              onChange={(e) => setNewPriority({ ...newPriority, responseTime: e.target.value })}
                              placeholder="e.g., 1 hour"
                              className="text-[13px]"
                            />
                          </div>
                          <div className="flex items-end">
                            <Button onClick={handleAddPriority} className="w-full text-[13px]">
                              Add Priority
                            </Button>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="description" className="text-[13px]">
                            Description
                          </Label>
                          <Input
                            id="description"
                            value={newPriority.description}
                            onChange={(e) => setNewPriority({ ...newPriority, description: e.target.value })}
                            placeholder="e.g., Immediate response required"
                            className="text-[13px]"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium text-[13px]">Existing Priority Levels</h4>
                        {priorityLevels.map((priority) => (
                          <div
                            key={priority.id}
                            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                          >
                            <div className="flex items-center space-x-3">
                              <Badge
                                variant={getBadgeVariant(priority.color)}
                                className={getBadgeClassName(priority.color)}
                              >
                                {priority.name}
                              </Badge>
                              <span className="text-[13px]">{priority.responseTime}</span>
                              <span className="text-[13px] text-muted-foreground">{priority.description}</span>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeletePriority(priority.id)}
                              className="text-[13px]"
                            >
                              Delete
                            </Button>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" onClick={() => setIsConfigureOpen(false)} className="text-[13px]">
                      Cancel
                    </Button>
                    <Button onClick={() => setIsConfigureOpen(false)} className="text-[13px]">
                      Save Changes
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center font-medium text-[13px] text-muted-foreground p-2">Impact / Urgency</div>
              <div className="text-center font-medium text-[13px] bg-red-50 p-2 rounded">High Urgency</div>
              <div className="text-center font-medium text-[13px] bg-yellow-50 p-2 rounded">Medium Urgency</div>
              <div className="text-center font-medium text-[13px] bg-green-50 p-2 rounded">Low Urgency</div>

              {["high", "medium", "low"].map((impact) => (
                <>
                  <div
                    key={`${impact}-label`}
                    className={`text-center font-medium text-[13px] p-2 rounded ${
                      impact === "high" ? "bg-red-50" : impact === "medium" ? "bg-yellow-50" : "bg-green-50"
                    }`}
                  >
                    {impact.charAt(0).toUpperCase() + impact.slice(1)} Impact
                  </div>
                  {["high", "medium", "low"].map((urgency) => {
                    const cell = getMatrixCell(impact, urgency)
                    const bgColor =
                      impact === "high" && urgency === "high"
                        ? "bg-red-50 border-red-200"
                        : (impact === "high" && urgency === "medium") || (impact === "medium" && urgency === "high")
                          ? "bg-orange-50 border-orange-200"
                          : (impact === "high" && urgency === "low") ||
                              (impact === "medium" && urgency === "medium") ||
                              (impact === "low" && urgency === "high")
                            ? "bg-yellow-50 border-yellow-200"
                            : "bg-green-50 border-green-200"

                    return (
                      <div key={`${impact}-${urgency}`} className={`text-center p-4 border-2 rounded-lg ${bgColor}`}>
                        {cell && (
                          <>
                            <Badge
                              variant={getBadgeVariant(cell.priority.color)}
                              className={`mb-2 ${getBadgeClassName(cell.priority.color)}`}
                            >
                              {cell.priority.name} ({cell.priority.id.toUpperCase()})
                            </Badge>
                            <p className="text-xs text-muted-foreground">{cell.priority.description}</p>
                          </>
                        )}
                      </div>
                    )
                  })}
                </>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContent>
  )
}
