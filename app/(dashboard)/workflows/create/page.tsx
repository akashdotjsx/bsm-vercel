'use client'

import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Background,
  Controls,
  Connection,
  useNodesState,
  useEdgesState,
  MarkerType,
  BackgroundVariant
} from 'reactflow'
import 'reactflow/dist/style.css'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  ChevronDown, 
  ChevronRight, 
  Edit2, 
  Trash2, 
  Upload, 
  Settings as SettingsIcon,
  Eye,
  Plus
} from 'lucide-react'
import { cn } from '@/lib/utils'

const initialNodes: Node[] = [
  {
    id: 'start',
    type: 'default',
    data: { label: 'Start' },
    position: { x: 100, y: 200 },
    style: {
      background: '#6366f1',
      color: 'white',
      border: 'none',
      borderRadius: '50%',
      width: 100,
      height: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '14px',
      fontWeight: '600',
    },
  },
  {
    id: 'open',
    data: { label: 'Open' },
    position: { x: 300, y: 200 },
    style: {
      background: 'white',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      padding: '12px 20px',
      fontSize: '14px',
    },
  },
  {
    id: 'assign',
    data: { label: 'Assign Task' },
    position: { x: 500, y: 120 },
    style: {
      background: 'white',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      padding: '12px 20px',
      fontSize: '14px',
    },
  },
  {
    id: 'in-progress',
    data: { label: 'In Progress' },
    position: { x: 700, y: 200 },
    style: {
      background: '#EEF2FF',
      border: '2px solid #6366f1',
      borderRadius: '8px',
      padding: '12px 20px',
      fontSize: '14px',
      color: '#6366f1',
      fontWeight: '500',
    },
  },
  {
    id: 'problem',
    data: { label: 'Problem' },
    position: { x: 1100, y: 120 },
    style: {
      background: '#FEF2F2',
      border: '2px solid #ef4444',
      borderRadius: '8px',
      padding: '12px 20px',
      fontSize: '14px',
      color: '#ef4444',
      fontWeight: '500',
    },
  },
  {
    id: 'resolved',
    data: { label: 'Resolved' },
    position: { x: 900, y: 380 },
    style: {
      background: 'white',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      padding: '12px 20px',
      fontSize: '14px',
    },
  },
  {
    id: 'closed',
    data: { label: 'Closed' },
    position: { x: 1100, y: 380 },
    style: {
      background: '#6366f1',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      padding: '12px 20px',
      fontSize: '14px',
      fontWeight: '500',
    },
  },
]

const initialEdges: Edge[] = [
  {
    id: 'e-start-open',
    source: 'start',
    target: 'open',
    label: 'Initiate Workflow',
    type: 'smoothstep',
    animated: false,
    style: { stroke: '#9ca3af', strokeWidth: 2 },
    labelStyle: { fill: '#6b7280', fontSize: 11 },
  },
  {
    id: 'e-open-assign',
    source: 'open',
    target: 'assign',
    type: 'smoothstep',
    animated: false,
    style: { stroke: '#9ca3af', strokeWidth: 2 },
  },
  {
    id: 'e-assign-progress',
    source: 'assign',
    target: 'in-progress',
    type: 'smoothstep',
    animated: false,
    style: { stroke: '#9ca3af', strokeWidth: 2 },
  },
  {
    id: 'e-progress-problem',
    source: 'in-progress',
    target: 'problem',
    label: 'Escalate to Problem',
    type: 'smoothstep',
    animated: false,
    style: { stroke: '#ef4444', strokeWidth: 2, strokeDasharray: '5 5' },
    labelStyle: { fill: '#ef4444', fontSize: 11 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#ef4444' },
  },
  {
    id: 'e-progress-resolved',
    source: 'in-progress',
    target: 'resolved',
    label: 'Resolve Issue',
    type: 'smoothstep',
    animated: false,
    style: { stroke: '#9ca3af', strokeWidth: 2 },
    labelStyle: { fill: '#6b7280', fontSize: 11 },
  },
  {
    id: 'e-problem-progress',
    source: 'problem',
    target: 'in-progress',
    label: 'Re-open',
    type: 'smoothstep',
    animated: false,
    style: { stroke: '#9ca3af', strokeWidth: 2 },
    labelStyle: { fill: '#6b7280', fontSize: 11 },
  },
  {
    id: 'e-resolved-closed',
    source: 'resolved',
    target: 'closed',
    label: 'Close Ticket',
    type: 'smoothstep',
    animated: false,
    style: { stroke: '#9ca3af', strokeWidth: 2 },
    labelStyle: { fill: '#6b7280', fontSize: 11 },
  },
]

export default function CreateWorkflowPage() {
  const router = useRouter()
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedTransition, setSelectedTransition] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState({
    properties: false,
    triggers: false,
    conditions: false,
    validators: false,
    postFunctions: false,
  })

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  )

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background">
      {/* Left Sidebar - Configuration Panel */}
      <div className="w-[400px] border-r bg-card flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold mb-2">Create Workflow</h1>
          <div className="flex gap-2">
            <Button size="sm" variant="default" className="bg-indigo-600 hover:bg-indigo-700">
              + Add Status
            </Button>
            <Button size="sm" variant="outline">
              + Add Transition
            </Button>
            <div className="flex items-center gap-2 ml-auto">
              <input type="checkbox" id="show-labels" className="rounded" />
              <label htmlFor="show-labels" className="text-sm text-muted-foreground">
                Show transition labels
              </label>
            </div>
          </div>
        </div>

        {/* Transition Details */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-base font-semibold">Transition Name</Label>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </div>
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <p className="text-sm text-yellow-900">
                      This transition goes to a status which has no outgoing transitions. 
                      Ensure all paths lead to a terminal status.
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Options</h3>
            
            {/* Properties */}
            <button
              onClick={() => toggleSection('properties')}
              className="w-full flex items-center justify-between py-3 px-4 hover:bg-muted rounded-lg transition-colors"
            >
              <span className="font-medium">Properties (0)</span>
              {expandedSections.properties ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            {expandedSections.properties && (
              <div className="p-4 bg-muted/50 rounded-lg mt-2">
                <p className="text-sm text-muted-foreground mb-2">
                  No detailed configuration for Properties yet.
                </p>
                <Button variant="link" className="h-auto p-0 text-indigo-600">
                  Configure Properties
                </Button>
              </div>
            )}

            {/* Triggers */}
            <button
              onClick={() => toggleSection('triggers')}
              className="w-full flex items-center justify-between py-3 px-4 hover:bg-muted rounded-lg transition-colors mt-2"
            >
              <span className="font-medium">Triggers (2)</span>
              {expandedSections.triggers ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            {expandedSections.triggers && (
              <div className="p-4 bg-muted/50 rounded-lg mt-2 space-y-2">
                <div className="flex items-center justify-between p-2 bg-background rounded">
                  <span className="text-sm">Status Change</span>
                  <Badge variant="secondary" className="text-xs">Active</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-background rounded">
                  <span className="text-sm">Manual Trigger</span>
                  <Badge variant="secondary" className="text-xs">Active</Badge>
                </div>
              </div>
            )}

            {/* Conditions */}
            <button
              onClick={() => toggleSection('conditions')}
              className="w-full flex items-center justify-between py-3 px-4 hover:bg-muted rounded-lg transition-colors mt-2"
            >
              <span className="font-medium">Conditions (1)</span>
              {expandedSections.conditions ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>

            {/* Validators */}
            <button
              onClick={() => toggleSection('validators')}
              className="w-full flex items-center justify-between py-3 px-4 hover:bg-muted rounded-lg transition-colors mt-2"
            >
              <span className="font-medium">Validators (3)</span>
              {expandedSections.validators ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>

            {/* Post Functions */}
            <button
              onClick={() => toggleSection('postFunctions')}
              className="w-full flex items-center justify-between py-3 px-4 hover:bg-muted rounded-lg transition-colors mt-2"
            >
              <span className="font-medium">Post Functions (5)</span>
              {expandedSections.postFunctions ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas - React Flow */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          className="bg-gray-50"
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#e5e7eb" />
          <Controls className="bg-white border shadow-lg rounded-lg" />
        </ReactFlow>

        {/* Bottom Right - Workflow Overview Link */}
        <div className="absolute bottom-4 right-4">
          <Button variant="link" className="text-indigo-600">
            <Eye className="h-4 w-4 mr-2" />
            Workflow Overview
          </Button>
        </div>

        {/* Top Right - Export Button */}
        <div className="absolute top-4 right-4">
          <Button variant="outline" className="bg-white shadow-sm">
            <Upload className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
    </div>
  )
}
