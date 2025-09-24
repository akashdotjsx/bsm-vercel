"use client"

import type React from "react"

import { useState, useCallback, useRef, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { PlatformLayout } from "@/components/layout/platform-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Save,
  Play,
  Settings,
  Trash2,
  Zap,
  Users,
  Mail,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Target,
  GitBranch,
  DollarSign,
  Diamond,
  Split,
  Merge,
  Plus,
  Circle,
} from "lucide-react"

interface WorkflowNode {
  id: string
  type: "trigger" | "condition" | "action" | "approval" | "decision" | "parallel" | "merge"
  title: string
  description: string
  config: Record<string, any>
  position: { x: number; y: number }
  connections: string[]
  inputConnections: string[]
  outputConnections: string[]
}

interface Connection {
  id: string
  from: string
  to: string
  fromPort?: string
  toPort?: string
}

export default function WorkflowBuilderPage() {
  const searchParams = useSearchParams()
  const workflowId = searchParams.get("id")

  const [workflowName, setWorkflowName] = useState("New Approval Workflow")
  const [workflowDescription, setWorkflowDescription] = useState("")
  const [nodes, setNodes] = useState<WorkflowNode[]>([])
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null)
  const [draggedComponent, setDraggedComponent] = useState<string | null>(null)
  const [connections, setConnections] = useState<Connection[]>([])
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null)
  const [dragConnection, setDragConnection] = useState<{ from: string; x: number; y: number } | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (workflowId) {
      loadExistingWorkflow(workflowId)
    }
  }, [workflowId])

  const loadExistingWorkflow = (id: string) => {
    // Sample workflow configurations
    const workflowTemplates = {
      WF001: {
        name: "Employee Onboarding",
        description:
          "Automated workflow for new employee setup including account creation, asset assignment, and access provisioning",
        nodes: [
          {
            id: "node-1",
            type: "trigger" as const,
            title: "New Employee Request",
            description: "Triggers when HR submits new employee onboarding request",
            config: { departments: ["HR"], requestTypes: ["onboarding"] },
            position: { x: 100, y: 50 },
            connections: ["node-2"],
            inputConnections: [],
            outputConnections: ["node-2"],
          },
          {
            id: "node-2",
            type: "condition" as const,
            title: "Department Check",
            description: "Route based on employee department",
            config: { condition: "department IN ['IT', 'Finance', 'Sales']" },
            position: { x: 100, y: 200 },
            connections: ["node-3", "node-4"],
            inputConnections: ["node-1"],
            outputConnections: ["node-3", "node-4"],
          },
          {
            id: "node-3",
            type: "approval" as const,
            title: "Manager Approval",
            description: "Direct manager approval for onboarding",
            config: { approverRole: "manager", timeout: 24, escalation: true },
            position: { x: 50, y: 350 },
            connections: ["node-5"],
            inputConnections: ["node-2"],
            outputConnections: ["node-5"],
          },
          {
            id: "node-4",
            type: "approval" as const,
            title: "HR Approval",
            description: "HR team approval for compliance",
            config: { approverRole: "hr", timeout: 48, escalation: true },
            position: { x: 300, y: 350 },
            connections: ["node-5"],
            inputConnections: ["node-2"],
            outputConnections: ["node-5"],
          },
          {
            id: "node-5",
            type: "action" as const,
            title: "Account Creation",
            description: "Create user accounts and assign access",
            config: { recipients: ["it-admin@company.com"], template: "account_creation" },
            position: { x: 175, y: 500 },
            connections: [],
            inputConnections: ["node-3", "node-4"],
            outputConnections: [],
          },
        ],
        connections: [
          { id: "conn-1", from: "node-1", to: "node-2" },
          { id: "conn-2", from: "node-2", to: "node-3" },
          { id: "conn-3", from: "node-2", to: "node-4" },
          { id: "conn-4", from: "node-3", to: "node-5" },
          { id: "conn-5", from: "node-4", to: "node-5" },
        ],
      },
      WF002: {
        name: "IT Asset Request Approval",
        description: "Multi-level approval process for IT equipment requests with budget validation",
        nodes: [
          {
            id: "node-1",
            type: "trigger" as const,
            title: "Asset Request Submitted",
            description: "Triggers when employee submits IT asset request",
            config: { requestTypes: ["hardware", "software"] },
            position: { x: 100, y: 50 },
            connections: ["node-2"],
            inputConnections: [],
            outputConnections: ["node-2"],
          },
          {
            id: "node-2",
            type: "decision" as const,
            title: "Cost Threshold Check",
            description: "Check if request exceeds budget threshold",
            config: { condition: "cost > 1000", operator: "IF" },
            position: { x: 100, y: 200 },
            connections: ["node-3", "node-4"],
            inputConnections: ["node-1"],
            outputConnections: ["node-3", "node-4"],
          },
          {
            id: "node-3",
            type: "approval" as const,
            title: "Manager Approval",
            description: "Manager approval for low-cost items",
            config: { approverRole: "manager", timeout: 24, escalation: true },
            position: { x: 50, y: 350 },
            connections: ["node-6"],
            inputConnections: ["node-2"],
            outputConnections: ["node-6"],
          },
          {
            id: "node-4",
            type: "approval" as const,
            title: "Finance Approval",
            description: "Finance approval for high-cost items",
            config: { approverRole: "finance", timeout: 48, escalation: true },
            position: { x: 300, y: 350 },
            connections: ["node-5"],
            inputConnections: ["node-2"],
            outputConnections: ["node-5"],
          },
          {
            id: "node-5",
            type: "approval" as const,
            title: "Procurement Approval",
            description: "Final procurement team approval",
            config: { approverRole: "procurement", timeout: 72, escalation: true },
            position: { x: 300, y: 500 },
            connections: ["node-6"],
            inputConnections: ["node-4"],
            outputConnections: ["node-6"],
          },
          {
            id: "node-6",
            type: "action" as const,
            title: "Asset Provisioning",
            description: "Provision approved IT assets",
            config: { recipients: ["it-procurement@company.com"], template: "asset_approved" },
            position: { x: 175, y: 650 },
            connections: [],
            inputConnections: ["node-3", "node-5"],
            outputConnections: [],
          },
        ],
        connections: [
          { id: "conn-1", from: "node-1", to: "node-2" },
          { id: "conn-2", from: "node-2", to: "node-3" },
          { id: "conn-3", from: "node-2", to: "node-4" },
          { id: "conn-4", from: "node-4", to: "node-5" },
          { id: "conn-5", from: "node-3", to: "node-6" },
          { id: "conn-6", from: "node-5", to: "node-6" },
        ],
      },
    }

    const template = workflowTemplates[id as keyof typeof workflowTemplates]
    if (template) {
      setWorkflowName(template.name)
      setWorkflowDescription(template.description)
      setNodes(template.nodes)
      setConnections(template.connections)
      console.log("[v0] Loaded existing workflow:", id, template.name)
    }
  }

  const addNode = useCallback((type: string, position: { x: number; y: number }) => {
    const nodeTemplates = {
      "ticket-created": {
        type: "trigger" as const,
        title: "Ticket Created",
        description: "Triggers when a new ticket is created",
        config: { ticketTypes: [], priorities: [], departments: [] },
      },
      "cost-threshold": {
        type: "condition" as const,
        title: "Cost Threshold",
        description: "Check if request amount exceeds threshold",
        config: { amount: 1000, operator: "greater_than" },
      },
      "if-condition": {
        type: "decision" as const,
        title: "If Condition",
        description: "Conditional branching based on criteria",
        config: { condition: "cost > 1000", trueAction: "", falseAction: "" },
      },
      "and-condition": {
        type: "decision" as const,
        title: "AND Logic",
        description: "All conditions must be true",
        config: { conditions: [], operator: "AND" },
      },
      "or-condition": {
        type: "decision" as const,
        title: "OR Logic",
        description: "Any condition can be true",
        config: { conditions: [], operator: "OR" },
      },
      "parallel-split": {
        type: "parallel" as const,
        title: "Parallel Split",
        description: "Execute multiple paths simultaneously",
        config: { branches: [] },
      },
      "merge-join": {
        type: "merge" as const,
        title: "Merge Join",
        description: "Wait for all parallel paths to complete",
        config: { waitForAll: true },
      },
      "manager-approval": {
        type: "approval" as const,
        title: "Manager Approval",
        description: "Requires manager approval",
        config: { approverRole: "manager", timeout: 24, escalation: true },
      },
      "email-notification": {
        type: "action" as const,
        title: "Email Notification",
        description: "Send email notification",
        config: { recipients: [], template: "default", timing: "immediate" },
      },
    }

    const template = nodeTemplates[type as keyof typeof nodeTemplates]
    if (!template) return

    const newNode: WorkflowNode = {
      id: `node-${Date.now()}`,
      ...template,
      position,
      connections: [],
      inputConnections: [],
      outputConnections: [],
    }

    setNodes((prev) => [...prev, newNode])
  }, [])

  const handleNodeConnect = useCallback(
    (nodeId: string, event?: React.MouseEvent) => {
      if (connectingFrom && connectingFrom !== nodeId) {
        // Create connection
        const newConnection: Connection = {
          id: `conn-${Date.now()}`,
          from: connectingFrom,
          to: nodeId,
        }

        setConnections((prev) => [...prev, newConnection])

        // Update node connections
        setNodes((prev) =>
          prev.map((node) => {
            if (node.id === connectingFrom) {
              return { ...node, outputConnections: [...node.outputConnections, nodeId] }
            }
            if (node.id === nodeId) {
              return { ...node, inputConnections: [...node.inputConnections, connectingFrom] }
            }
            return node
          }),
        )

        setConnectingFrom(null)
        setDragConnection(null)
        console.log("[v0] Connected nodes:", connectingFrom, "->", nodeId)
      } else {
        // Start connection
        setConnectingFrom(nodeId)
        console.log("[v0] Starting connection from:", nodeId)
      }
    },
    [connectingFrom],
  )

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (connectingFrom && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect()
        setDragConnection({
          from: connectingFrom,
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        })
      }
    },
    [connectingFrom],
  )

  const handleCanvasClick = useCallback(() => {
    if (connectingFrom) {
      setConnectingFrom(null)
      setDragConnection(null)
      console.log("[v0] Cancelled connection")
    }
  }, [connectingFrom])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      if (!draggedComponent) return

      const rect = e.currentTarget.getBoundingClientRect()
      const position = {
        x: e.clientX - rect.left - 128, // Center the node
        y: e.clientY - rect.top - 60,
      }

      addNode(draggedComponent, position)
      setDraggedComponent(null)
    },
    [draggedComponent, addNode],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const renderConnections = () => {
    const allConnections = [...connections]

    // Add drag connection if active
    if (dragConnection) {
      const fromNode = nodes.find((n) => n.id === dragConnection.from)
      if (fromNode) {
        allConnections.push({
          id: "drag-connection",
          from: dragConnection.from,
          to: "drag-target",
        })
      }
    }

    return allConnections.map((connection) => {
      const fromNode = nodes.find((n) => n.id === connection.from)

      let toX, toY
      if (connection.to === "drag-target" && dragConnection) {
        toX = dragConnection.x
        toY = dragConnection.y
      } else {
        const toNode = nodes.find((n) => n.id === connection.to)
        if (!toNode) return null
        toX = toNode.position.x + 128 // Node width / 2
        toY = toNode.position.y + 20 // Top connection point
      }

      if (!fromNode) return null

      const fromX = fromNode.position.x + 128 // Node width / 2
      const fromY = fromNode.position.y + 120 // Bottom connection point

      // Calculate control points for smooth curve
      const controlY1 = fromY + Math.abs(toY - fromY) * 0.3
      const controlY2 = toY - Math.abs(toY - fromY) * 0.3

      const isDragConnection = connection.id === "drag-connection"

      return (
        <g key={connection.id}>
          <defs>
            <marker
              id={`arrowhead-${connection.id}`}
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill={isDragConnection ? "#3b82f6" : "#6b7280"} />
            </marker>
          </defs>
          <path
            d={`M ${fromX} ${fromY} C ${fromX} ${controlY1} ${toX} ${controlY2} ${toX} ${toY}`}
            stroke={isDragConnection ? "#3b82f6" : "#6b7280"}
            strokeWidth={isDragConnection ? "3" : "2"}
            fill="none"
            markerEnd={`url(#arrowhead-${connection.id})`}
            strokeDasharray={isDragConnection ? "5,5" : "none"}
          />
        </g>
      )
    })
  }

  const saveWorkflow = () => {
    console.log("[v0] Saving workflow:", { workflowName, workflowDescription, nodes, connections })
    alert("Workflow saved successfully!")
  }

  const testWorkflow = () => {
    console.log("[v0] Testing workflow:", nodes, connections)
    alert("Workflow test initiated!")
  }

  return (
    <PlatformLayout
      breadcrumb={[{ label: "Workflows", href: "/workflows" }, { label: workflowId ? "Edit Workflow" : "Builder" }]}
    >
      <div className="h-[calc(100vh-8rem)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-white dark:bg-gray-900">
          <div className="flex-1">
            <Input
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="text-lg font-semibold border-none p-0 h-auto bg-transparent"
              placeholder="Workflow Name"
            />
            <Input
              value={workflowDescription}
              onChange={(e) => setWorkflowDescription(e.target.value)}
              className="text-sm text-muted-foreground border-none p-0 h-auto bg-transparent mt-1"
              placeholder="Workflow Description"
            />
          </div>
          <div className="flex items-center gap-2">
            {workflowId && (
              <Badge variant="outline" className="text-xs">
                Editing: {workflowId}
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={testWorkflow}>
              <Play className="h-4 w-4 mr-2" />
              Test
            </Button>
            <Button size="sm" onClick={saveWorkflow}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>

        <div className="flex-1 flex">
          {/* Component Palette */}
          <div className="w-80 border-r bg-gray-50 dark:bg-gray-900 p-4 overflow-y-auto">
            <Tabs defaultValue="triggers" className="w-full">
              <TabsList className="grid w-full grid-cols-5 text-xs">
                <TabsTrigger value="triggers">Triggers</TabsTrigger>
                <TabsTrigger value="conditions">Logic</TabsTrigger>
                <TabsTrigger value="approvals">Approvals</TabsTrigger>
                <TabsTrigger value="actions">Actions</TabsTrigger>
                <TabsTrigger value="flow">Flow</TabsTrigger>
              </TabsList>

              {/* ... existing TabsContent sections ... */}
              <TabsContent value="triggers" className="space-y-2 mt-4">
                <ComponentCard
                  id="ticket-created"
                  icon={<Zap className="h-4 w-4" />}
                  title="Ticket Created"
                  description="Triggers when new ticket is created"
                  onDragStart={setDraggedComponent}
                />
                <ComponentCard
                  id="status-changed"
                  icon={<Target className="h-4 w-4" />}
                  title="Status Changed"
                  description="Triggers on ticket status change"
                  onDragStart={setDraggedComponent}
                />
                <ComponentCard
                  id="sla-breach"
                  icon={<AlertTriangle className="h-4 w-4" />}
                  title="SLA Breach"
                  description="Triggers on SLA violation"
                  onDragStart={setDraggedComponent}
                />
              </TabsContent>

              <TabsContent value="conditions" className="space-y-2 mt-4">
                <ComponentCard
                  id="if-condition"
                  icon={<Diamond className="h-4 w-4" />}
                  title="If Condition"
                  description="Conditional branching"
                  onDragStart={setDraggedComponent}
                />
                <ComponentCard
                  id="and-condition"
                  icon={<Split className="h-4 w-4" />}
                  title="AND Logic"
                  description="All conditions must be true"
                  onDragStart={setDraggedComponent}
                />
                <ComponentCard
                  id="or-condition"
                  icon={<Merge className="h-4 w-4" />}
                  title="OR Logic"
                  description="Any condition can be true"
                  onDragStart={setDraggedComponent}
                />
                <ComponentCard
                  id="cost-threshold"
                  icon={<DollarSign className="h-4 w-4" />}
                  title="Cost Threshold"
                  description="Check request amount"
                  onDragStart={setDraggedComponent}
                />
                <ComponentCard
                  id="department-check"
                  icon={<Users className="h-4 w-4" />}
                  title="Department Check"
                  description="Filter by department"
                  onDragStart={setDraggedComponent}
                />
              </TabsContent>

              <TabsContent value="approvals" className="space-y-2 mt-4">
                <ComponentCard
                  id="manager-approval"
                  icon={<Users className="h-4 w-4" />}
                  title="Manager Approval"
                  description="Direct manager approval"
                  onDragStart={setDraggedComponent}
                />
                <ComponentCard
                  id="hr-approval"
                  icon={<Users className="h-4 w-4" />}
                  title="HR Approval"
                  description="HR department approval"
                  onDragStart={setDraggedComponent}
                />
                <ComponentCard
                  id="finance-approval"
                  icon={<DollarSign className="h-4 w-4" />}
                  title="Finance Approval"
                  description="Finance team approval"
                  onDragStart={setDraggedComponent}
                />
                <ComponentCard
                  id="it-approval"
                  icon={<Settings className="h-4 w-4" />}
                  title="IT Approval"
                  description="IT department approval"
                  onDragStart={setDraggedComponent}
                />
                <ComponentCard
                  id="procurement-approval"
                  icon={<CheckCircle className="h-4 w-4" />}
                  title="Procurement Approval"
                  description="Procurement team approval"
                  onDragStart={setDraggedComponent}
                />
              </TabsContent>

              <TabsContent value="actions" className="space-y-2 mt-4">
                <ComponentCard
                  id="email-notification"
                  icon={<Mail className="h-4 w-4" />}
                  title="Email Notification"
                  description="Send email notification"
                  onDragStart={setDraggedComponent}
                />
                <ComponentCard
                  id="slack-notification"
                  icon={<MessageSquare className="h-4 w-4" />}
                  title="Slack Notification"
                  description="Send Slack message"
                  onDragStart={setDraggedComponent}
                />
                <ComponentCard
                  id="teams-notification"
                  icon={<MessageSquare className="h-4 w-4" />}
                  title="Teams Notification"
                  description="Send Teams message"
                  onDragStart={setDraggedComponent}
                />
                <ComponentCard
                  id="escalation"
                  icon={<AlertTriangle className="h-4 w-4" />}
                  title="Escalation"
                  description="Escalate to next level"
                  onDragStart={setDraggedComponent}
                />
                <ComponentCard
                  id="delegation"
                  icon={<GitBranch className="h-4 w-4" />}
                  title="Delegation"
                  description="Delegate to another user"
                  onDragStart={setDraggedComponent}
                />
                <ComponentCard
                  id="reassign"
                  icon={<Users className="h-4 w-4" />}
                  title="Reassign"
                  description="Reassign ticket"
                  onDragStart={setDraggedComponent}
                />
              </TabsContent>

              <TabsContent value="flow" className="space-y-2 mt-4">
                <ComponentCard
                  id="parallel-split"
                  icon={<Split className="h-4 w-4" />}
                  title="Parallel Split"
                  description="Execute multiple paths"
                  onDragStart={setDraggedComponent}
                />
                <ComponentCard
                  id="merge-join"
                  icon={<Merge className="h-4 w-4" />}
                  title="Merge Join"
                  description="Wait for all paths"
                  onDragStart={setDraggedComponent}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Canvas */}
          <div className="flex-1 flex">
            <div
              ref={canvasRef}
              className="flex-1 bg-gray-100 dark:bg-gray-800 relative overflow-auto"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onMouseMove={handleCanvasMouseMove}
              onClick={handleCanvasClick}
            >
              {nodes.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Start Building Your Workflow</p>
                    <p className="text-sm">Drag components from the left panel to create your approval workflow</p>
                    <p className="text-xs mt-2 text-blue-600">
                      💡 Tip: Click the + button on nodes to connect them together
                    </p>
                  </div>
                </div>
              ) : (
                <div className="relative w-full h-full">
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
                    {renderConnections()}
                  </svg>

                  <div className="p-8 relative" style={{ zIndex: 2 }}>
                    {nodes.map((node) => (
                      <WorkflowNodeComponent
                        key={node.id}
                        node={node}
                        isSelected={selectedNode?.id === node.id}
                        isConnecting={connectingFrom === node.id}
                        onClick={() => setSelectedNode(node)}
                        onConnect={(e) => {
                          e?.stopPropagation()
                          handleNodeConnect(node.id, e)
                        }}
                        onDelete={() => {
                          // Remove node and its connections
                          setNodes((prev) => prev.filter((n) => n.id !== node.id))
                          setConnections((prev) => prev.filter((c) => c.from !== node.id && c.to !== node.id))
                          if (selectedNode?.id === node.id) setSelectedNode(null)
                          if (connectingFrom === node.id) {
                            setConnectingFrom(null)
                            setDragConnection(null)
                          }
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Properties Panel */}
            {selectedNode && (
              <div className="w-80 border-l bg-white dark:bg-gray-900 p-4 overflow-y-auto">
                <NodePropertiesPanel
                  node={selectedNode}
                  onUpdate={(updatedNode) => {
                    setNodes((prev) => prev.map((n) => (n.id === updatedNode.id ? updatedNode : n)))
                    setSelectedNode(updatedNode)
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </PlatformLayout>
  )
}

// ... existing code for ComponentCard, WorkflowNodeComponent, and NodePropertiesPanel ...

function ComponentCard({
  id,
  icon,
  title,
  description,
  onDragStart,
}: {
  id: string
  icon: React.ReactNode
  title: string
  description: string
  onDragStart: (id: string) => void
}) {
  return (
    <Card
      className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
      draggable
      onDragStart={() => onDragStart(id)}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">{icon}</div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm">{title}</h4>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function WorkflowNodeComponent({
  node,
  isSelected,
  isConnecting,
  onClick,
  onConnect,
  onDelete,
}: {
  node: WorkflowNode
  isSelected: boolean
  isConnecting: boolean
  onClick: () => void
  onConnect: (e?: React.MouseEvent) => void
  onDelete: () => void
}) {
  const getNodeColor = (type: string) => {
    switch (type) {
      case "trigger":
        return "border-green-500 bg-green-50 dark:bg-green-900/20"
      case "condition":
      case "decision":
        return "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
      case "approval":
        return "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
      case "action":
        return "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
      case "parallel":
      case "merge":
        return "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
      default:
        return "border-gray-500 bg-gray-50 dark:bg-gray-900/20"
    }
  }

  return (
    <div
      className="absolute"
      style={{
        left: node.position.x,
        top: node.position.y,
      }}
    >
      <div
        className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white cursor-pointer hover:bg-blue-600 transition-colors z-10"
        onClick={(e) => {
          e.stopPropagation()
          onConnect(e)
        }}
        title="Input connection point"
      >
        <Circle className="h-2 w-2 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
      </div>

      <Card
        className={`w-64 cursor-pointer transition-all border-2 ${getNodeColor(node.type)} ${
          isSelected ? "ring-2 ring-primary shadow-lg" : ""
        } ${isConnecting ? "ring-2 ring-blue-400 shadow-lg" : ""} hover:shadow-md`}
        onClick={onClick}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs">
              {node.type}
            </Badge>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-blue-100"
                onClick={(e) => {
                  e.stopPropagation()
                  onConnect(e)
                }}
                title="Connect to another node"
              >
                <Plus className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-red-100"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete()
                }}
                title="Delete node"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <CardTitle className="text-sm">{node.title}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground">{node.description}</p>
        </CardContent>
      </Card>

      <div
        className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-green-500 rounded-full border-2 border-white cursor-pointer hover:bg-green-600 transition-colors z-10"
        onClick={(e) => {
          e.stopPropagation()
          onConnect(e)
        }}
        title="Output connection point"
      >
        <Plus className="h-2 w-2 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
      </div>
    </div>
  )
}

function NodePropertiesPanel({
  node,
  onUpdate,
}: {
  node: WorkflowNode
  onUpdate: (node: WorkflowNode) => void
}) {
  const updateConfig = (key: string, value: any) => {
    onUpdate({
      ...node,
      config: { ...node.config, [key]: value },
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium text-sm mb-2">Node Properties</h3>
        <Badge variant="outline">{node.type}</Badge>
      </div>

      <div className="space-y-3">
        <div>
          <Label className="text-xs">Title</Label>
          <Input
            value={node.title}
            onChange={(e) => onUpdate({ ...node, title: e.target.value })}
            className="text-sm"
          />
        </div>

        <div>
          <Label className="text-xs">Description</Label>
          <Textarea
            value={node.description}
            onChange={(e) => onUpdate({ ...node, description: e.target.value })}
            className="text-sm min-h-[60px]"
          />
        </div>

        {node.type === "decision" && (
          <>
            <div>
              <Label className="text-xs">Condition Type</Label>
              <Select value={node.config.operator || "IF"} onValueChange={(value) => updateConfig("operator", value)}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IF">If Condition</SelectItem>
                  <SelectItem value="AND">AND Logic</SelectItem>
                  <SelectItem value="OR">OR Logic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Condition Expression</Label>
              <Textarea
                value={node.config.condition || ""}
                onChange={(e) => updateConfig("condition", e.target.value)}
                placeholder="e.g., cost > 1000 OR department == 'IT'"
                className="text-sm min-h-[60px]"
              />
            </div>
          </>
        )}

        {node.type === "approval" && (
          <>
            <div>
              <Label className="text-xs">Approver Role</Label>
              <Select value={node.config.approverRole} onValueChange={(value) => updateConfig("approverRole", value)}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">Direct Manager</SelectItem>
                  <SelectItem value="hr">HR Team</SelectItem>
                  <SelectItem value="finance">Finance Team</SelectItem>
                  <SelectItem value="it">IT Team</SelectItem>
                  <SelectItem value="procurement">Procurement Team</SelectItem>
                  <SelectItem value="security">Security Team</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Timeout (hours)</Label>
              <Input
                type="number"
                value={node.config.timeout || 24}
                onChange={(e) => updateConfig("timeout", Number.parseInt(e.target.value))}
                className="text-sm"
              />
            </div>

            <div>
              <Label className="text-xs">Escalation Policy</Label>
              <Select
                value={node.config.escalation ? "enabled" : "disabled"}
                onValueChange={(value) => updateConfig("escalation", value === "enabled")}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="enabled">Auto-escalate on timeout</SelectItem>
                  <SelectItem value="disabled">No escalation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {node.type === "condition" && node.title.includes("Cost") && (
          <>
            <div>
              <Label className="text-xs">Threshold Amount</Label>
              <Input
                type="number"
                value={node.config.amount || 1000}
                onChange={(e) => updateConfig("amount", Number.parseFloat(e.target.value))}
                className="text-sm"
              />
            </div>

            <div>
              <Label className="text-xs">Operator</Label>
              <Select value={node.config.operator} onValueChange={(value) => updateConfig("operator", value)}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="greater_than">Greater than</SelectItem>
                  <SelectItem value="less_than">Less than</SelectItem>
                  <SelectItem value="equal_to">Equal to</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {node.type === "action" && node.title.includes("Notification") && (
          <>
            <div>
              <Label className="text-xs">Recipients</Label>
              <Textarea
                value={node.config.recipients?.join(", ") || ""}
                onChange={(e) => updateConfig("recipients", e.target.value.split(", ").filter(Boolean))}
                placeholder="Enter email addresses separated by commas"
                className="text-sm min-h-[60px]"
              />
            </div>

            <div>
              <Label className="text-xs">Template</Label>
              <Select value={node.config.template} onValueChange={(value) => updateConfig("template", value)}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approval_request">Approval Request</SelectItem>
                  <SelectItem value="approval_granted">Approval Granted</SelectItem>
                  <SelectItem value="approval_denied">Approval Denied</SelectItem>
                  <SelectItem value="escalation">Escalation Notice</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Timing</Label>
              <Select value={node.config.timing} onValueChange={(value) => updateConfig("timing", value)}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Immediate</SelectItem>
                  <SelectItem value="delayed">Delayed (1 hour)</SelectItem>
                  <SelectItem value="daily">Daily digest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {(node.type === "parallel" || node.type === "merge") && (
          <div>
            <Label className="text-xs">{node.type === "parallel" ? "Number of Branches" : "Wait Strategy"}</Label>
            {node.type === "parallel" ? (
              <Input
                type="number"
                value={node.config.branches?.length || 2}
                onChange={(e) => updateConfig("branches", Array(Number.parseInt(e.target.value)).fill(""))}
                className="text-sm"
                min="2"
                max="5"
              />
            ) : (
              <Select
                value={node.config.waitForAll ? "all" : "any"}
                onValueChange={(value) => updateConfig("waitForAll", value === "all")}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wait for all branches</SelectItem>
                  <SelectItem value="any">Wait for any branch</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
