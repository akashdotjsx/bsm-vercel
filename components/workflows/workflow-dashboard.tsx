'use client'

import React, { useState } from 'react'
import { useWorkflows, useWorkflowExecutions } from '@/hooks/use-workflows'
import { useAuth } from '@/lib/contexts/auth-context'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  GitBranch,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Activity,
  AlertCircle,
  Plus,
  Settings
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { WorkflowImportDialog } from './workflow-import-dialog'

export function WorkflowDashboard() {
  const { user } = useAuth()
  const [selectedEntityType, setSelectedEntityType] = useState<string>('all')

  const { workflows, loading: loadingWorkflows } = useWorkflows({
    organizationId: user?.organization_id,
    entityType: selectedEntityType !== 'all' ? selectedEntityType : undefined
  })

  const { executions, loading: loadingExecutions } = useWorkflowExecutions({
    limit: 50
  })

  // Calculate statistics
  const stats = {
    total: workflows.length,
    active: workflows.filter(w => w.status === 'active').length,
    draft: workflows.filter(w => w.status === 'draft').length,
    totalExecutions: executions.length,
    successful: executions.filter(e => e.status === 'completed').length,
    failed: executions.filter(e => e.status === 'failed').length,
    running: executions.filter(e => e.status === 'running').length
  }

  const successRate = stats.totalExecutions > 0 
    ? ((stats.successful / stats.totalExecutions) * 100).toFixed(1) 
    : '0'

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500'
      case 'draft':
        return 'bg-gray-500'
      case 'archived':
        return 'bg-orange-500'
      default:
        return 'bg-blue-500'
    }
  }

  const getExecutionStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600'
      case 'failed':
        return 'text-red-600'
      case 'running':
        return 'text-blue-600'
      default:
        return 'text-gray-600'
    }
  }

  const getExecutionStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4" />
      case 'failed':
        return <XCircle className="h-4 w-4" />
      case 'running':
        return <Play className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  if (loadingWorkflows || loadingExecutions) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-2">
          <Activity className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Loading workflow data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with gradient */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Workflows
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage and monitor your business process workflows
          </p>
        </div>
        <div className="flex items-center gap-2">
          <WorkflowImportDialog />
          <Button className="shadow-sm">
            <Plus className="h-4 w-4 mr-2" />
            New Workflow
          </Button>
        </div>
      </div>

      {/* Statistics Cards with hover effects */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Workflows</CardTitle>
            <div className="p-2 bg-primary/10 rounded-full">
              <GitBranch className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active} active, {stats.draft} draft
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-full">
              <Activity className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalExecutions}</div>
            <p className="text-xs text-muted-foreground">
              {stats.running} currently running
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <div className="p-2 bg-green-500/10 rounded-full">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.successful} successful, {stats.failed} failed
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alerts</CardTitle>
            <div className="p-2 bg-orange-500/10 rounded-full">
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.failed}</div>
            <p className="text-xs text-muted-foreground">
              Failed executions requiring attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs with modern styling */}
      <Tabs defaultValue="workflows" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="workflows" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Workflows</TabsTrigger>
          <TabsTrigger value="executions" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Executions</TabsTrigger>
          <TabsTrigger value="templates" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Templates</TabsTrigger>
        </TabsList>

        {/* Workflows Tab */}
        <TabsContent value="workflows" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Workflows</CardTitle>
              <CardDescription>
                Manage your organization's workflows
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                {workflows.length === 0 ? (
                  <div className="text-center py-12">
                    <GitBranch className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No workflows yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Create your first workflow to automate business processes
                    </p>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Workflow
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {workflows.map((workflow) => (
                      <Card key={workflow.id} className="hover:shadow-lg transition-all duration-200 hover:border-primary/50 cursor-pointer group">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <CardTitle className="text-lg flex items-center gap-2">
                                <span>{workflow.name}</span>
                                <Badge variant="outline" className={getStatusColor(workflow.status)}>
                                  {workflow.status}
                                </Badge>
                              </CardTitle>
                              <CardDescription>
                                {workflow.description || 'No description'}
                              </CardDescription>
                            </div>
                            <Button variant="ghost" size="sm">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-4">
                              <span className="text-muted-foreground">
                                Entity: <span className="font-medium text-foreground">{workflow.entity_type}</span>
                              </span>
                              <Separator orientation="vertical" className="h-4" />
                              <span className="text-muted-foreground">
                                Version: <span className="font-medium text-foreground">{workflow.version}</span>
                              </span>
                              <Separator orientation="vertical" className="h-4" />
                              <span className="text-muted-foreground">
                                {workflow.workflow_config?.statuses?.length || 0} statuses
                              </span>
                            </div>
                            <Button variant="outline" size="sm">
                              Edit
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Executions Tab */}
        <TabsContent value="executions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Executions</CardTitle>
              <CardDescription>
                Monitor workflow execution history and status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Workflow</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Current Status</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Duration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {executions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12">
                          <Activity className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">
                            No executions yet
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      executions.map((execution) => (
                        <TableRow key={execution.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div className={`flex items-center gap-2 ${getExecutionStatusColor(execution.status)}`}>
                              {getExecutionStatusIcon(execution.status)}
                              <span className="font-medium capitalize">{execution.status}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{execution.workflow?.name || 'Unknown'}</span>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="text-sm">{execution.entity_type}</p>
                              <p className="text-xs text-muted-foreground">{execution.entity_id}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{execution.current_status}</Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {formatDistanceToNow(new Date(execution.started_at), { addSuffix: true })}
                            </span>
                          </TableCell>
                          <TableCell>
                            {execution.completed_at ? (
                              <span className="text-sm">
                                {Math.round(
                                  (new Date(execution.completed_at).getTime() - 
                                   new Date(execution.started_at).getTime()) / 1000
                                )}s
                              </span>
                            ) : (
                              <Badge variant="outline">Running</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Templates</CardTitle>
              <CardDescription>
                Pre-built templates for common scenarios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[
                  {
                    name: 'Incident Management',
                    description: 'ITIL-compliant incident workflow',
                    icon: AlertCircle,
                    color: 'text-red-500'
                  },
                  {
                    name: 'Change Management',
                    description: 'Change approval with CAB review',
                    icon: GitBranch,
                    color: 'text-purple-500'
                  },
                  {
                    name: 'Service Request',
                    description: 'Standard service fulfillment',
                    icon: CheckCircle2,
                    color: 'text-green-500'
                  }
                ].map((template) => (
                  <Card key={template.name} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg bg-muted ${template.color}`}>
                          <template.icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-base">{template.name}</CardTitle>
                          <CardDescription className="text-xs">
                            {template.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" size="sm" className="w-full">
                        Use Template
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
