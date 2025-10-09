import { PlatformLayout } from "@/components/layout/platform-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Play, Pause, Edit, Trash2, Users, Clock, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function ApprovalWorkflowsPage() {
  console.log("[v0] Approval Workflows page loading")

  const workflows = [
    {
      id: 1,
      name: "IT Asset Request",
      description: "Approval workflow for hardware and software requests",
      steps: ["Manager Approval", "IT Review", "Budget Approval", "Procurement"],
      status: "active",
      avgTime: "2.5 days",
      completionRate: "94%",
      department: "IT",
    },
    {
      id: 2,
      name: "HR Leave Request",
      description: "Employee leave and time-off approval process",
      steps: ["Manager Approval", "HR Review"],
      status: "active",
      avgTime: "4 hours",
      completionRate: "98%",
      department: "HR",
    },
    {
      id: 3,
      name: "Finance Expense Approval",
      description: "Multi-level expense and reimbursement approval",
      steps: ["Manager Approval", "Finance Review", "Director Approval"],
      status: "active",
      avgTime: "1.2 days",
      completionRate: "91%",
      department: "Finance",
    },
    {
      id: 4,
      name: "Security Access Request",
      description: "System access and permission approval workflow",
      steps: ["Manager Approval", "Security Review", "IT Provisioning"],
      status: "draft",
      avgTime: "6 hours",
      completionRate: "96%",
      department: "Security",
    },
  ]

  return (
    <PlatformLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[13px] font-semibold text-foreground dark:text-gray-100">Approval Workflows</h1>
            <p className="text-[10px] text-muted-foreground dark:text-muted-foreground mt-1">
              Configure and manage approval processes for different request types
            </p>
          </div>
          <Button className="flex items-center gap-2" asChild>
            <Link href="/workflow-builder">
              <Plus className="h-4 w-4" />
              Create Workflow
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Play className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground dark:text-muted-foreground">Active Workflows</p>
                  <p className="text-[13px] font-semibold text-foreground dark:text-gray-100">8</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground dark:text-muted-foreground">Avg Completion Rate</p>
                  <p className="text-[13px] font-semibold text-foreground dark:text-gray-100">94.8%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground dark:text-muted-foreground">Avg Processing Time</p>
                  <p className="text-[13px] font-semibold text-foreground dark:text-gray-100">1.8 days</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground dark:text-muted-foreground">Pending Approvals</p>
                  <p className="text-[13px] font-semibold text-foreground dark:text-gray-100">23</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Workflows List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[12px]">Workflow Templates</CardTitle>
            <CardDescription className="text-[10px]">
              Manage approval workflow templates for different departments and request types
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {workflows.map((workflow) => (
                <div
                  key={workflow.id}
                  className="flex items-center justify-between p-4 border border-border dark:border-gray-800 rounded-lg"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-muted dark:bg-gray-800 rounded-lg">
                      <Users className="h-5 w-5 text-muted-foreground dark:text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-[11px] text-foreground dark:text-gray-100">{workflow.name}</h3>
                        <Badge variant="outline">{workflow.department}</Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground dark:text-muted-foreground">{workflow.description}</p>
                      <div className="flex items-center gap-4 text-[10px] text-muted-foreground dark:text-muted-foreground">
                        <span>Steps: {workflow.steps.length}</span>
                        <span>Avg Time: {workflow.avgTime}</span>
                        <span>Success Rate: {workflow.completionRate}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {workflow.steps.map((step, index) => (
                          <div key={index} className="flex items-center">
                            <Badge variant="secondary" className="text-[10px]">
                              {step}
                            </Badge>
                            {index < workflow.steps.length - 1 && <span className="mx-1 text-muted-foreground">→</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={workflow.status === "active" ? "default" : "secondary"}>{workflow.status}</Badge>
                    <Button variant="ghost" size="sm">
                      {workflow.status === "active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
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
