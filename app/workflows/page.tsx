import { Suspense } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Play, Pause, Settings, Zap, Bot, Sparkles, TrendingUp, AlertTriangle } from "lucide-react"
import { PlatformLayout } from "@/components/layout/platform-layout"

export default function WorkflowsPage() {
  return (
    <PlatformLayout breadcrumb={[{ label: "Workflows" }]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Workflows</h1>
            <p className="text-sm text-muted-foreground">Automate your service management processes</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" className="bg-[#7073fc] text-white hover:bg-[#5a5dfc]">
              <Zap className="h-4 w-4 mr-2" />
              AI Generate
            </Button>
            <Button size="sm" asChild>
              <Link href="/workflow-builder">
                <Plus className="h-4 w-4 mr-2" />
                Create Workflow
              </Link>
            </Button>
          </div>
        </div>

        <Card className="border-[#7073fc]/20 bg-gradient-to-r from-[#7073fc]/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bot className="h-5 w-5 text-[#7073fc]" />
                <div>
                  <h3 className="font-medium text-sm">AI Workflow Intelligence</h3>
                  <p className="text-xs text-muted-foreground">
                    3 optimization opportunities detected •
                    <span className="text-[#7073fc] font-medium"> 23% efficiency improvement</span> possible
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  94% Success Rate
                </Badge>
                <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                  <AlertTriangle className="h-3 w-3 mr-1" />2 Need Attention
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Suspense fallback={<WorkflowsSkeleton />}>
          <WorkflowsList />
        </Suspense>
      </div>
    </PlatformLayout>
  )
}

function WorkflowsList() {
  const workflows = [
    {
      id: "WF001",
      name: "Employee Onboarding",
      description:
        "Automated workflow for new employee setup including account creation, asset assignment, and access provisioning",
      status: "active",
      triggers: 12,
      completions: 8,
      avgTime: "2.5 hours",
      lastRun: "2 hours ago",
      category: "HR",
      aiInsights: "AI suggests adding IT security training step for 15% faster completion",
    },
    {
      id: "WF002",
      name: "IT Asset Request Approval",
      description: "Multi-level approval process for IT equipment requests with budget validation",
      status: "active",
      triggers: 45,
      completions: 42,
      avgTime: "1.2 days",
      lastRun: "30 minutes ago",
      category: "IT",
      aiInsights: "Predicted bottleneck: Finance approval step (avg 18h delay)",
    },
    {
      id: "WF003",
      name: "Incident Escalation",
      description: "Automatic escalation of high-priority incidents to management after SLA breach",
      status: "paused",
      triggers: 3,
      completions: 3,
      avgTime: "15 minutes",
      lastRun: "1 day ago",
      category: "Support",
      aiInsights: "Low usage detected. Consider merging with general escalation workflow",
    },
    {
      id: "WF004",
      name: "Software License Renewal",
      description: "Automated reminder and approval workflow for software license renewals",
      status: "active",
      triggers: 8,
      completions: 6,
      avgTime: "3 days",
      lastRun: "4 hours ago",
      category: "Procurement",
      aiInsights: "AI recommends 30-day advance notification for better compliance",
    },
    {
      id: "WF005",
      name: "Customer Feedback Collection",
      description: "Automated survey deployment after ticket resolution with follow-up actions",
      status: "draft",
      triggers: 0,
      completions: 0,
      avgTime: "N/A",
      lastRun: "Never",
      category: "Customer Success",
      aiInsights: "Ready for deployment. Predicted 78% response rate based on similar workflows",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "default"
      case "paused":
        return "secondary"
      case "draft":
        return "outline"
      default:
        return "secondary"
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "HR":
        return "bg-blue-100 text-blue-800"
      case "IT":
        return "bg-green-100 text-green-800"
      case "Support":
        return "bg-red-100 text-red-800"
      case "Procurement":
        return "bg-purple-100 text-purple-800"
      case "Customer Success":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {workflows.map((workflow) => (
        <Card key={workflow.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <Link href={`/workflow-builder?id=${workflow.id}`} className="hover:underline">
                    <CardTitle className="text-lg cursor-pointer hover:text-[#7073fc]">{workflow.name}</CardTitle>
                  </Link>
                  <Badge variant={getStatusColor(workflow.status)} className="text-xs">
                    {workflow.status}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(workflow.category)}`}>
                    {workflow.category}
                  </span>
                  <span className="text-xs text-muted-foreground">ID: {workflow.id}</span>
                </div>
              </div>
              <div className="flex space-x-1">
                {workflow.status === "active" ? (
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Pause className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Play className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                  <Link href={`/workflow-builder?id=${workflow.id}`}>
                    <Settings className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <CardDescription className="text-sm">{workflow.description}</CardDescription>

            <div className="p-3 rounded-lg bg-[#7073fc]/5 border border-[#7073fc]/10">
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-[#7073fc] mt-0.5 shrink-0" />
                <p className="text-xs text-gray-700 leading-relaxed">{workflow.aiInsights}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-700">Triggers</p>
                <p className="font-semibold">{workflow.triggers}</p>
              </div>
              <div>
                <p className="text-gray-700">Completions</p>
                <p className="font-semibold">{workflow.completions}</p>
              </div>
              <div>
                <p className="text-gray-700">Avg Time</p>
                <p className="font-semibold">{workflow.avgTime}</p>
              </div>
              <div>
                <p className="text-gray-700">Last Run</p>
                <p className="font-semibold">{workflow.lastRun}</p>
              </div>
            </div>

            {workflow.status === "active" && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full"
                  style={{ width: `${(workflow.completions / workflow.triggers) * 100}%` }}
                ></div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function WorkflowsSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-3/4" />
                <div className="flex space-x-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-12" />
                </div>
              </div>
              <div className="flex space-x-1">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="space-y-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-12" />
                </div>
              ))}
            </div>
            <Skeleton className="h-2 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
