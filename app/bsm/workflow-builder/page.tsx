"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { PlatformLayout } from "@/components/layout/platform-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Play,
  Save,
  Zap,
  Target,
  AlertTriangle,
  Diamond,
  Split,
  Merge,
  DollarSign,
  Users,
  Settings,
  CheckCircle,
  Mail,
  MessageSquare,
  GitBranch,
  Square,
  X,
} from "lucide-react"

interface WorkflowNode {
  id: string
  type: "trigger" | "condition" | "approval" | "action"
  title: string
  description: string
  position: { x: number; y: number }
  config: Record<string, any>
}

interface Connection {
  id: string
  from: string
  to: string
}

export default function WorkflowBuilderPage() {
  console.log("[v0] WorkflowBuilderPage rendering")

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
    console.log("[v0] Component mounted, workflowId:", workflowId)
    if (workflowId) {
      loadExistingWorkflow(workflowId)
    }
  }, [workflowId])

  const loadExistingWorkflow = (id: string) => {
    console.log("[v0] Loading existing workflow:", id)
    // Mock data for testing
    setWorkflowName("Employee Onboarding")
    setWorkflowDescription("Automated employee onboarding workflow")
    setNodes([
      {
        id: "start-1",
        type: "trigger",
        title: "New Employee",
        description: "Triggered when new employee is added",
        position: { x: 100, y: 100 },
        config: { event: "employee-created" },
      },
    ])
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    console.log("[v0] Drop event triggered")
    console.log("[v0] TEST: Drag and drop functionality - TESTING")

    if (!draggedComponent || !canvasRef.current) {
      console.log("[v0] TEST: Drag and drop - FAILED - No dragged component or canvas ref")
      return
    }

    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    console.log("[v0] TEST: Drop position calculated:", { x, y })

    const minSpacing = 200
    let finalX = Math.max(50, x - 128)
    let finalY = Math.max(50, y - 50)

    // Check for overlapping nodes and adjust position
    nodes.forEach((existingNode) => {
      const distance = Math.sqrt(
        Math.pow(finalX - existingNode.position.x, 2) + Math.pow(finalY - existingNode.position.y, 2),
      )
      if (distance < minSpacing) {
        finalX += minSpacing
        finalY += 50
      }
    })

    const newNode: WorkflowNode = {
      id: `${draggedComponent}-${Date.now()}`,
      type: getNodeType(draggedComponent),
      title: getNodeTitle(draggedComponent),
      description: getNodeDescription(draggedComponent),
      position: { x: finalX, y: finalY },
      config: {},
    }

    console.log("[v0] TEST: Creating new node - SUCCESS:", newNode)
    setNodes((prev) => [...prev, newNode])
    setDraggedComponent(null)
    console.log("[v0] TEST: Drag and drop functionality - SUCCESS")
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const getNodeType = (componentId: string): WorkflowNode["type"] => {
    if (
      componentId.includes("trigger") ||
      componentId.includes("created") ||
      componentId.includes("changed") ||
      componentId.includes("breach")
    ) {
      return "trigger"
    }
    if (componentId.includes("approval")) {
      return "approval"
    }
    if (componentId.includes("condition") || componentId.includes("threshold") || componentId.includes("check")) {
      return "condition"
    }
    return "action"
  }

  const getNodeTitle = (componentId: string): string => {
    const titles: Record<string, string> = {
      "ticket-created": "Ticket Created",
      "status-changed": "Status Changed",
      "sla-breach": "SLA Breach",
      "if-condition": "If Condition",
      "and-condition": "AND Logic",
      "or-condition": "OR Logic",
      "cost-threshold": "Cost Threshold",
      "department-check": "Department Check",
      "manager-approval": "Manager Approval",
      "hr-approval": "HR Approval",
      "finance-approval": "Finance Approval",
      "it-approval": "IT Approval",
      "procurement-approval": "Procurement Approval",
      "email-notification": "Email Notification",
      "slack-notification": "Slack Notification",
      "teams-notification": "Teams Notification",
      escalation: "Escalation",
      delegation: "Delegation",
      reassign: "Reassign",
      "parallel-split": "Parallel Split",
      "merge-join": "Merge Join",
    }
    return titles[componentId] || componentId
  }

  const getNodeDescription = (componentId: string): string => {
    const descriptions: Record<string, string> = {
      "ticket-created": "Triggers when new ticket is created",
      "status-changed": "Triggers on ticket status change",
      "sla-breach": "Triggers on SLA violation",
      "if-condition": "Conditional branching",
      "and-condition": "All conditions must be true",
      "or-condition": "Any condition can be true",
      "cost-threshold": "Check request amount",
      "department-check": "Filter by department",
      "manager-approval": "Direct manager approval",
      "hr-approval": "HR department approval",
      "finance-approval": "Finance team approval",
      "it-approval": "IT department approval",
      "procurement-approval": "Procurement team approval",
      "email-notification": "Send email notification",
      "slack-notification": "Send Slack message",
      "teams-notification": "Send Teams message",
      escalation: "Escalate to next level",
      delegation: "Delegate to another user",
      reassign: "Reassign ticket",
      "parallel-split": "Execute multiple paths",
      "merge-join": "Wait for all paths",
    }
    return descriptions[componentId] || "Workflow component"
  }

  const handleNodeConnect = (nodeId: string, e?: React.MouseEvent) => {
    console.log("[v0] TEST: Node connection functionality - TESTING")
    console.log("[v0] Node connect clicked:", nodeId, "connectingFrom:", connectingFrom)

    if (connectingFrom === null) {
      // Start connection
      setConnectingFrom(nodeId)
      console.log("[v0] TEST: Connection started from node:", nodeId)
    } else if (connectingFrom === nodeId) {
      // Cancel connection
      setConnectingFrom(null)
      console.log("[v0] TEST: Connection cancelled")
    } else {
      // Complete connection
      const newConnection: Connection = {
        id: `${connectingFrom}-${nodeId}`,
        from: connectingFrom,
        to: nodeId,
      }
      setConnections((prev) => [...prev, newConnection])
      setConnectingFrom(null)
      console.log("[v0] TEST: Node connection functionality - SUCCESS:", newConnection)
    }
  }

  const deleteNode = (nodeId: string) => {
    console.log("[v0] TEST: Node deletion functionality - TESTING")
    console.log("[v0] Deleting node:", nodeId)
    setNodes((prev) => prev.filter((n) => n.id !== nodeId))
    setConnections((prev) => prev.filter((c) => c.from !== nodeId && c.to !== nodeId))
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null)
    }
    console.log("[v0] TEST: Node deletion functionality - SUCCESS")
  }

  const renderConnections = () => {
    console.log("[v0] Rendering connections:", connections.length)

    return (
      <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
        {connections.map((connection) => {
          const fromNode = nodes.find((n) => n.id === connection.from)
          const toNode = nodes.find((n) => n.id === connection.to)

          if (!fromNode || !toNode) return null

          const fromX = fromNode.position.x + 128 // Center of node (256/2)
          const fromY = fromNode.position.y + 100 // Bottom of node
          const toX = toNode.position.x + 128 // Center of node
          const toY = toNode.position.y // Top of node

          // Create curved path
          const midY = (fromY + toY) / 2
          const path = `M ${fromX} ${fromY} Q ${fromX} ${midY} ${toX} ${toY}`

          return (
            <g key={connection.id}>
              <path d={path} stroke="#3b82f6" strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
                </marker>
              </defs>
            </g>
          )
        })}
      </svg>
    )
  }

  const saveWorkflow = async () => {
    console.log("[v0] TEST: Save functionality - TESTING")
    try {
      const workflowData = {
        name: workflowName,
        description: workflowDescription,
        nodes,
        connections,
      }

      console.log("[v0] TEST: Workflow data to save:", workflowData)

      const response = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(workflowData),
      })

      if (response.ok) {
        console.log("[v0] TEST: Save functionality - SUCCESS")
        alert("Workflow saved successfully!")
      } else {
        console.log("[v0] TEST: Save functionality - FAILED - Server error")
        alert("Failed to save workflow")
      }
    } catch (error) {
      console.error("[v0] TEST: Save functionality - FAILED - Network error:", error)
      alert("Error saving workflow")
    }
  }

  const testWorkflow = async () => {
    console.log("[v0] TEST: Test run functionality - TESTING")
    try {
      const testData = { nodes, connections }
      console.log("[v0] TEST: Test data:", testData)

      const response = await fetch("/api/workflows/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testData),
      })

      if (response.ok) {
        const result = await response.json()
        console.log("[v0] TEST: Test run functionality - SUCCESS:", result)
        alert(`Test completed: ${result.message}`)
      } else {
        console.log("[v0] TEST: Test run functionality - FAILED - Server error")
        alert("Test failed")
      }
    } catch (error) {
      console.error("[v0] TEST: Test run functionality - FAILED - Network error:", error)
      alert("Error testing workflow")
    }
  }

  console.log("[v0] TEST: Component rendering with nodes:", nodes.length, "connections:", connections.length)

  return (
    <PlatformLayout>
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
            <div className="flex-1 relative bg-gray-50 dark:bg-gray-800">
              <div
                ref={canvasRef}
                className="absolute inset-0 overflow-auto"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => setSelectedNode(null)}
              >
                {/* Grid background */}
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: `
                      linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                      linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
                    `,
                    backgroundSize: "20px 20px",
                  }}
                />

                {/* Render connections */}
                {renderConnections()}

                {/* Render nodes */}
                {nodes.map((node) => (
                  <div
                    key={node.id}
                    className="absolute"
                    style={{
                      left: node.position.x,
                      top: node.position.y,
                      zIndex: 2,
                    }}
                  >
                    <WorkflowNodeComponent
                      node={node}
                      isSelected={selectedNode?.id === node.id}
                      isConnecting={connectingFrom === node.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedNode(node)
                      }}
                      onConnect={handleNodeConnect}
                      onDelete={deleteNode}
                    />
                  </div>
                ))}

                {connectingFrom && (
                  <div className="absolute top-4 left-4 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-2 rounded-lg text-sm">
                    Click on another node to create a connection, or click anywhere to cancel
                  </div>
                )}
              </div>
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
  onClick: (e: React.MouseEvent) => void
  onConnect: (nodeId: string, e?: React.MouseEvent) => void
  onDelete: (nodeId: string) => void
}) {
  const getNodeIcon = () => {
    switch (node.type) {
      case "trigger":
        return <Zap className="h-4 w-4" />
      case "action":
        return <Play className="h-4 w-4" />
      case "condition":
        return <Diamond className="h-4 w-4" />
      case "approval":
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Square className="h-4 w-4" />
    }
  }

  const getNodeColor = () => {
    switch (node.type) {
      case "trigger":
        return "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-900 dark:text-green-100"
      case "action":
        return "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100"
      case "condition":
        return "border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-900 dark:text-orange-100"
      case "approval":
        return "border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-900 dark:text-purple-100"
      default:
        return "border-gray-500 bg-gray-50 dark:bg-gray-900/20 text-gray-900 dark:text-gray-100"
    }
  }

  return (
    <div className="group relative">
      {/* Input connection point */}
      <div
        className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-white dark:bg-gray-800 border-2 border-gray-400 rounded-full cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 flex items-center justify-center shadow-sm z-10"
        onClick={(e) => {
          e.stopPropagation()
          onConnect(node.id, e)
        }}
        title="Input connection point"
      >
        <div className="w-2 h-2 bg-gray-400 rounded-full" />
      </div>

      <Card
        className={`w-64 cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${getNodeColor()} ${
          isSelected ? "ring-2 ring-primary shadow-lg scale-105" : ""
        } ${isConnecting ? "ring-2 ring-blue-400 animate-pulse" : ""}`}
        onClick={onClick}
      >
        <CardContent className="p-4 relative">
          {/* Delete button */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute -top-2 -right-2 h-6 w-6 p-0 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-md z-10"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(node.id)
            }}
            title="Delete node"
          >
            <X className="h-3 w-3" />
          </Button>

          <div className="flex items-start gap-3 mb-3">
            <div className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm border">{getNodeIcon()}</div>
            <div className="flex-1">
              <h4 className="font-semibold text-sm">{node.title}</h4>
              <p className="text-xs opacity-75 capitalize font-medium">{node.type}</p>
            </div>
          </div>

          <p className="text-xs opacity-80 line-clamp-2">{node.description}</p>

          {/* Node ID for debugging */}
          <div className="text-xs opacity-50 mt-2 font-mono">ID: {node.id.split("-").slice(-1)[0]}</div>
        </CardContent>
      </Card>

      {/* Output connection point */}
      <div
        className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-white dark:bg-gray-800 border-2 border-gray-400 rounded-full cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 flex items-center justify-center shadow-sm z-10"
        onClick={(e) => {
          e.stopPropagation()
          onConnect(node.id, e)
        }}
        title="Output connection point"
      >
        <div className="w-2 h-2 bg-gray-400 rounded-full" />
      </div>
    </div>
  )
}

function NodePropertiesPanel({ node, onUpdate }: { node: WorkflowNode; onUpdate: (node: WorkflowNode) => void }) {
  console.log("[v0] TEST: Properties panel rendering for node:", node.id)

  const updateConfig = (key: string, value: any) => {
    console.log("[v0] TEST: Properties update - TESTING:", key, value)
    const updatedNode = {
      ...node,
      config: {
        ...node.config,
        [key]: value,
      },
    }
    onUpdate(updatedNode)
    console.log("[v0] TEST: Properties update - SUCCESS")
  }

  const updateNodeField = (field: keyof WorkflowNode, value: any) => {
    console.log("[v0] TEST: Node field update - TESTING:", field, value)
    const updatedNode = {
      ...node,
      [field]: value,
    }
    onUpdate(updatedNode)
    console.log("[v0] TEST: Node field update - SUCCESS")
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold text-lg mb-2">{node.title}</h3>
        <Badge variant="outline" className="capitalize">
          {node.type}
        </Badge>
      </div>

      <div className="space-y-3">
        <div>
          <Label htmlFor="node-title">Title</Label>
          <Input id="node-title" value={node.title} onChange={(e) => updateNodeField("title", e.target.value)} />
        </div>

        <div>
          <Label htmlFor="node-description">Description</Label>
          <Textarea
            id="node-description"
            value={node.description}
            onChange={(e) => updateNodeField("description", e.target.value)}
            rows={3}
          />
        </div>

        {/* Node-specific configuration */}
        {node.type === "trigger" && (
          <div className="space-y-3">
            <div>
              <Label>Trigger Event</Label>
              <Select
                value={node.config.event || "ticket-created"}
                onValueChange={(value) => updateConfig("event", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ticket-created">Ticket Created</SelectItem>
                  <SelectItem value="status-changed">Status Changed</SelectItem>
                  <SelectItem value="sla-breach">SLA Breach</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {node.type === "condition" && (
          <div className="space-y-3">
            <div>
              <Label>Condition Type</Label>
              <Select
                value={node.config.operator || "greater_than"}
                onValueChange={(value) => updateConfig("operator", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="greater_than">Greater Than</SelectItem>
                  <SelectItem value="less_than">Less Than</SelectItem>
                  <SelectItem value="equals">Equals</SelectItem>
                  <SelectItem value="contains">Contains</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Threshold Value</Label>
              <Input
                type="number"
                value={node.config.amount || 1000}
                onChange={(e) => updateConfig("amount", Number(e.target.value))}
              />
            </div>
          </div>
        )}

        {node.type === "approval" && (
          <div className="space-y-3">
            <div>
              <Label>Approver Role</Label>
              <Select
                value={node.config.approverRole || "manager"}
                onValueChange={(value) => updateConfig("approverRole", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="director">Director</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Timeout (hours)</Label>
              <Input
                type="number"
                value={node.config.timeout || 24}
                onChange={(e) => updateConfig("timeout", Number(e.target.value))}
              />
            </div>
          </div>
        )}

        {node.type === "action" && (
          <div className="space-y-3">
            <div>
              <Label>Action Type</Label>
              <Select
                value={node.config.actionType || "email"}
                onValueChange={(value) => updateConfig("actionType", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Send Email</SelectItem>
                  <SelectItem value="sms">Send SMS</SelectItem>
                  <SelectItem value="webhook">Call Webhook</SelectItem>
                  <SelectItem value="update">Update Record</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {node.config.actionType === "email" && (
              <div>
                <Label>Email Template</Label>
                <Select
                  value={node.config.template || "default"}
                  onValueChange={(value) => updateConfig("template", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="approval">Approval Request</SelectItem>
                    <SelectItem value="notification">Notification</SelectItem>
                    <SelectItem value="reminder">Reminder</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
