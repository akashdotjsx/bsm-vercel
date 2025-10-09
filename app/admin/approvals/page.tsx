import { PlatformLayout } from "@/components/layout/platform-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, Users, Plus, MoreHorizontal } from "lucide-react"
import Link from "next/link"

export default function ApprovalWorkflowsPage() {
  return (
    <PlatformLayout
      title="Approval Workflows"
      description="Configure multi-step approval processes"
      breadcrumbs={[
        { label: "Administration", href: "/admin" },
        { label: "Approval Workflows", href: "/admin/approvals" },
      ]}
    >
      <div className="space-y-6 font-sans text-[13px]">
        <div className="space-y-2">
          <h1 className="text-[13px] font-semibold tracking-tight">Approval Workflows</h1>
          <p className="text-muted-foreground">
            Configure and manage multi-step approval processes for different request types
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Active Workflows</p>
                  <p className="text-[13px] font-bold">15</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-sm font-medium">Pending Approvals</p>
                  <p className="text-[13px] font-bold">23</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Approvers</p>
                  <p className="text-[13px] font-bold">42</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-purple-500" />
                <div>
                  <p className="text-sm font-medium">Avg Approval Time</p>
                  <p className="text-[13px] font-bold">1.2d</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-[11px] font-semibold">Approval Workflows</CardTitle>
                <CardDescription>Configure approval processes for different request types</CardDescription>
              </div>
              <Button size="sm" asChild>
                <Link href="/workflow-builder">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Workflow
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "IT Equipment Request", steps: 3, approvers: "Manager → IT → Finance", status: "Active" },
                { name: "Software License", steps: 2, approvers: "Manager → IT Admin", status: "Active" },
                { name: "Access Request", steps: 2, approvers: "Manager → Security", status: "Active" },
                {
                  name: "Budget Approval",
                  steps: 4,
                  approvers: "Manager → Director → Finance → CFO",
                  status: "Active",
                },
                { name: "Vendor Onboarding", steps: 3, approvers: "Procurement → Legal → Finance", status: "Draft" },
              ].map((workflow) => (
                <div key={workflow.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <CheckCircle className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium">{workflow.name}</p>
                      <p className="text-sm text-gray-500">{workflow.approvers}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge variant="secondary">{workflow.steps} steps</Badge>
                    <Badge variant={workflow.status === "Active" ? "default" : "outline"}>{workflow.status}</Badge>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
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
