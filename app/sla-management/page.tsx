import { PlatformLayout } from "@/components/layout/platform-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, AlertTriangle, CheckCircle, Plus, Edit, Trash2 } from "lucide-react"

export default function SLAManagementPage() {
  console.log("[v0] SLA Management page loading")

  const slaTemplates = [
    {
      id: 1,
      name: "Critical Incident",
      priority: "P1",
      responseTime: "15 minutes",
      resolutionTime: "4 hours",
      businessHours: "24/7",
      status: "active",
      departments: ["IT", "Security"],
    },
    {
      id: 2,
      name: "High Priority Request",
      priority: "P2",
      responseTime: "1 hour",
      resolutionTime: "8 hours",
      businessHours: "Business Hours",
      status: "active",
      departments: ["IT", "HR"],
    },
    {
      id: 3,
      name: "Standard Request",
      priority: "P3",
      responseTime: "4 hours",
      resolutionTime: "24 hours",
      businessHours: "Business Hours",
      status: "active",
      departments: ["IT", "HR", "Finance"],
    },
    {
      id: 4,
      name: "Low Priority",
      priority: "P4",
      responseTime: "24 hours",
      resolutionTime: "72 hours",
      businessHours: "Business Hours",
      status: "draft",
      departments: ["IT"],
    },
  ]

  return (
    <PlatformLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">SLA Management</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Configure service level agreements and response time policies
            </p>
          </div>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create SLA Template
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active SLAs</p>
                  <p className="text-2xl font-semibold text-foreground">12</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Response Time</p>
                  <p className="text-2xl font-semibold text-foreground">2.3h</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">SLA Breaches</p>
                  <p className="text-2xl font-semibold text-foreground">3</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Compliance Rate</p>
                  <p className="text-2xl font-semibold text-foreground">94.2%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SLA Templates */}
        <Card>
          <CardHeader>
            <CardTitle>SLA Templates</CardTitle>
            <CardDescription>Manage service level agreement templates for different priority levels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {slaTemplates.map((sla) => (
                <div
                  key={sla.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <Badge
                      variant={sla.priority === "P1" ? "destructive" : sla.priority === "P2" ? "default" : "secondary"}
                    >
                      {sla.priority}
                    </Badge>
                    <div>
                      <h3 className="font-medium text-base text-foreground">{sla.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Response: {sla.responseTime} • Resolution: {sla.resolutionTime} • {sla.businessHours}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {sla.departments.map((dept) => (
                          <Badge key={dept} variant="outline" className="text-xs">
                            {dept}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={sla.status === "active" ? "default" : "secondary"}>{sla.status}</Badge>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </PlatformLayout>
  )
}
