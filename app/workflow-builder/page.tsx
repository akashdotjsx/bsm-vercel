'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Background,
  Controls,
  Connection,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  Panel,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { PlatformLayout } from '@/components/layout/platform-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Zap, 
  Target, 
  AlertTriangle,
  Play,
  Save,
  GitBranch,
  ChevronDown,
  ChevronRight,
  Edit2,
  Trash2,
  CloudDownload,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from 'next-themes'

// Sample workflow data matching the second screenshot
const initialNodes: Node[] = [
  {
    id: 'start',
    type: 'default',
    data: { label: 'Start' },
    position: { x: 250, y: 50 },
    style: {
      background: '#6366f1',
      color: 'white',
      border: 'none',
      borderRadius: '50%',
      width: 90,
      height: 90,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '14px',
      fontWeight: '600',
      boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
    },
  },
  {
    id: 'open',
    data: { label: 'Open' },
    position: { x: 380, y: 150 },
    style: {
      background: 'white',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      padding: '12px 24px',
      fontSize: '14px',
      fontWeight: '500',
    },
  },
  {
    id: 'assign',
    data: { label: 'Assign Task' },
    position: { x: 550, y: 150 },
    style: {
      background: 'white',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      padding: '12px 24px',
      fontSize: '14px',
      fontWeight: '500',
    },
  },
  {
    id: 'in-progress',
    data: { label: 'In Progress' },
    position: { x: 740, y: 150 },
    style: {
      background: '#EEF2FF',
      border: '2px solid #6366f1',
      borderRadius: '8px',
      padding: '12px 24px',
      fontSize: '14px',
      color: '#6366f1',
      fontWeight: '500',
    },
  },
  {
    id: 'problem',
    data: { label: 'Problem' },
    position: { x: 1000, y: 50 },
    style: {
      background: '#FEF2F2',
      border: '2px solid #ef4444',
      borderRadius: '8px',
      padding: '12px 24px',
      fontSize: '14px',
      color: '#ef4444',
      fontWeight: '500',
    },
  },
  {
    id: 'resolved',
    data: { label: 'Resolved' },
    position: { x: 850, y: 350 },
    style: {
      background: '#F0FDF4',
      border: '2px solid #22c55e',
      borderRadius: '8px',
      padding: '12px 24px',
      fontSize: '14px',
      color: '#22c55e',
      fontWeight: '500',
    },
  },
  {
    id: 'closed',
    data: { label: 'Closed' },
    position: { x: 1000, y: 350 },
    style: {
      background: '#6366f1',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      padding: '12px 24px',
      fontSize: '14px',
      fontWeight: '500',
      boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
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
    style: { stroke: '#9ca3af', strokeWidth: 2 },
    labelStyle: { fill: '#6b7280', fontSize: 11, fontWeight: 500 },
  },
  {
    id: 'e-open-assign',
    source: 'open',
    target: 'assign',
    label: 'Assign Task',
    type: 'smoothstep',
    style: { stroke: '#9ca3af', strokeWidth: 2 },
    labelStyle: { fill: '#6b7280', fontSize: 11 },
  },
  {
    id: 'e-assign-progress',
    source: 'assign',
    target: 'in-progress',
    type: 'smoothstep',
    style: { stroke: '#9ca3af', strokeWidth: 2 },
  },
  {
    id: 'e-progress-problem',
    source: 'in-progress',
    target: 'problem',
    label: 'Escalate to Problem',
    type: 'smoothstep',
    style: { stroke: '#ef4444', strokeWidth: 2, strokeDasharray: '5 5' },
    labelStyle: { fill: '#ef4444', fontSize: 11 },
  },
  {
    id: 'e-progress-resolved',
    source: 'in-progress',
    target: 'resolved',
    label: 'Resolve Issue',
    type: 'smoothstep',
    style: { stroke: '#22c55e', strokeWidth: 2 },
    labelStyle: { fill: '#22c55e', fontSize: 11 },
  },
  {
    id: 'e-problem-progress',
    source: 'problem',
    target: 'in-progress',
    label: 'Re-open',
    type: 'smoothstep',
    style: { stroke: '#9ca3af', strokeWidth: 2 },
    labelStyle: { fill: '#6b7280', fontSize: 11 },
  },
  {
    id: 'e-resolved-closed',
    source: 'resolved',
    target: 'closed',
    label: 'Close Ticket',
    type: 'smoothstep',
    style: { stroke: '#6366f1', strokeWidth: 2 },
    labelStyle: { fill: '#6366f1', fontSize: 11 },
  },
]

// Draggable workflow components
const workflowComponents = [
  {
    id: 'start-node',
    category: 'Basic',
    icon: <Play className="h-4 w-4" />,
    title: 'Start',
    description: 'Beginning of the workflow',
    bgColor: '#6366f1',
  },
  {
    id: 'trigger-new-ticket',
    category: 'Triggers',
    icon: <Zap className="h-4 w-4" />,
    title: 'New Ticket Created',
    description: 'Triggers when new ticket is created',
    bgColor: '#6366f1',
  },
  {
    id: 'trigger-status-change',
    category: 'Triggers',
    icon: <Target className="h-4 w-4" />,
    title: 'Status Change',
    description: 'Triggers on ticket status change',
    bgColor: '#9333ea',
  },
  {
    id: 'trigger-sla',
    category: 'Triggers',
    icon: <AlertTriangle className="h-4 w-4" />,
    title: 'SLA Violation',
    description: 'Triggers on SLA violation',
    bgColor: '#ef4444',
  },
  {
    id: 'condition-node',
    category: 'Logic',
    icon: <GitBranch className="h-4 w-4" />,
    title: 'Condition',
    description: 'Decision point in workflow',
    bgColor: '#f59e0b',
  },
  {
    id: 'action-assign',
    category: 'Actions',
    icon: <Target className="h-4 w-4" />,
    title: 'Assign Task',
    description: 'Assign task to user or team',
    bgColor: '#10b981',
  },
  {
    id: 'action-notify',
    category: 'Actions',
    icon: <AlertTriangle className="h-4 w-4" />,
    title: 'Send Notification',
    description: 'Send email or system notification',
    bgColor: '#3b82f6',
  },
  {
    id: 'end-node',
    category: 'Basic',
    icon: <Target className="h-4 w-4" />,
    title: 'End',
    description: 'End of the workflow',
    bgColor: '#6b7280',
  },
]

export default function WorkflowBuilderPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { theme } = useTheme()
  
  // Check if this is editing an existing workflow or creating new
  const workflowId = searchParams.get('id')
  const isNewWorkflow = !workflowId
  
  // Start with empty nodes/edges for new workflows, or sample data for existing
  const [nodes, setNodes, onNodesChange] = useNodesState(isNewWorkflow ? [] : initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(isNewWorkflow ? [] : initialEdges)
  const [workflowName, setWorkflowName] = useState(isNewWorkflow ? 'New Workflow' : 'New Approval Workflow')
  const [workflowDescription, setWorkflowDescription] = useState(isNewWorkflow ? 'Describe your workflow...' : 'Workflow Description')
  const [activeTab, setActiveTab] = useState('triggers')
  const [showTransitionLabels, setShowTransitionLabels] = useState(true)
  const [expandedSections, setExpandedSections] = useState({
    properties: true,
    triggers: false,
    conditions: false,
    validators: false,
    postFunctions: false,
  })

  const isDark = theme === 'dark'

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge({
        ...params,
        type: 'smoothstep',
        animated: false,
        style: { stroke: '#9ca3af', strokeWidth: 2 },
      }, eds))
    },
    [setEdges]
  )

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType)
    event.dataTransfer.effectAllowed = 'move'
  }

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      
      const type = event.dataTransfer.getData('application/reactflow')
      if (!type) return

      const component = workflowComponents.find(c => c.id === type)
      if (!component) return

      const reactFlowBounds = event.currentTarget.getBoundingClientRect()
      const position = {
        x: event.clientX - reactFlowBounds.left - 140,
        y: event.clientY - reactFlowBounds.top - 40,
      }

      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type: 'default',
        position,
        data: { label: component.title },
        style: {
          background: component.bgColor,
          color: 'white',
          border: '2px solid rgba(255,255,255,0.2)',
          borderRadius: '8px',
          padding: '12px 16px',
          fontSize: '12px',
          fontWeight: '500',
          minWidth: '140px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      }

      setNodes((nds) => nds.concat(newNode))
    },
    [setNodes]
  )

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const tabs = [
    { id: 'triggers', label: 'Triggers' },
    { id: 'logic', label: 'Logic' },
    { id: 'approvals', label: 'Approvals' },
    { id: 'actions', label: 'Actions' },
    { id: 'flow', label: 'Flow' },
  ]

  return (
    <PlatformLayout
      breadcrumb={[
        { label: 'Workflows', href: '/workflows' },
        { label: 'Builder' }
      ]}
    >
      <div className={cn(
        'flex h-[calc(100vh-12rem)] -m-4 md:-m-6',
        isDark ? 'bg-[#1e1e2e]' : 'bg-white'
      )}>
        {/* Left Sidebar - Component Palette */}
        <div className={cn(
          'w-[400px] border-r flex flex-col',
          isDark ? 'bg-[#252535] border-gray-700/50' : 'bg-white border-gray-200'
        )}>
          {/* Header */}
          <div className={cn(
            'p-6 border-b',
            isDark ? 'border-gray-700/50' : 'border-gray-200'
          )}>
            <Input
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className={cn(
                'border-none text-base font-semibold mb-2 px-3',
                isDark ? 'bg-white text-gray-900' : 'bg-gray-50 text-gray-900'
              )}
              placeholder="Workflow Name"
            />
            <Input
              value={workflowDescription}
              onChange={(e) => setWorkflowDescription(e.target.value)}
              className={cn(
                'border-none text-sm px-3',
                isDark ? 'bg-transparent text-gray-400' : 'bg-transparent text-gray-600'
              )}
              placeholder="Workflow Description"
            />
            
            <div className="flex gap-2 mt-4">
              {isNewWorkflow ? (
                <Button 
                  size="sm" 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  onClick={() => {
                    // Add a basic start node to get started
                    const startComponent = workflowComponents.find(c => c.id === 'start-node')
                    if (startComponent) {
                      const newNode: Node = {
                        id: `start-${Date.now()}`,
                        type: 'default',
                        position: { x: 250, y: 100 },
                        data: { label: startComponent.title },
                        style: {
                          background: startComponent.bgColor,
                          color: 'white',
                          border: '2px solid rgba(255,255,255,0.2)',
                          borderRadius: '8px',
                          padding: '12px 16px',
                          fontSize: '12px',
                          fontWeight: '500',
                          minWidth: '140px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        },
                      }
                      setNodes([newNode])
                    }
                  }}
                >
                  + Quick Start
                </Button>
              ) : (
                <>
                  <Button 
                    size="sm" 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    + Add Status
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className={isDark ? 'border-gray-600 text-gray-300' : ''}
                  >
                    + Add Transition
                  </Button>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-2 mt-3">
              <input 
                type="checkbox" 
                id="show-labels" 
                className="rounded"
                checked={showTransitionLabels}
                onChange={(e) => setShowTransitionLabels(e.target.checked)}
              />
              <label 
                htmlFor="show-labels" 
                className={cn(
                  'text-sm',
                  isDark ? 'text-gray-400' : 'text-gray-600'
                )}
              >
                Show transition labels
              </label>
            </div>
          </div>

          {/* Component Palette */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="mb-4">
              <h3 className={cn(
                'text-sm font-medium mb-3',
                isDark ? 'text-gray-400' : 'text-gray-600'
              )}>
                Drag components to canvas
              </h3>
              
              {/* Group components by category */}
              {['Basic', 'Triggers', 'Logic', 'Actions'].map(category => {
                const categoryComponents = workflowComponents.filter(comp => comp.category === category)
                if (categoryComponents.length === 0) return null
                
                return (
                  <div key={category} className="mb-6">
                    <h4 className={cn(
                      'text-xs font-semibold uppercase tracking-wider mb-3',
                      isDark ? 'text-gray-500' : 'text-gray-400'
                    )}>
                      {category}
                    </h4>
                    <div className="space-y-2">
                      {categoryComponents.map((component) => (
                        <div
                          key={component.id}
                          draggable
                          onDragStart={(e) => onDragStart(e, component.id)}
                          className={cn(
                            'p-3 rounded-lg border cursor-move transition-all hover:shadow-md',
                            isDark 
                              ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' 
                              : 'bg-white border-gray-200 hover:bg-gray-50'
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div 
                              className="p-2 rounded-lg flex-shrink-0"
                              style={{ backgroundColor: component.bgColor }}
                            >
                              <div className="text-white">
                                {component.icon}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className={cn(
                                'font-medium text-sm mb-1',
                                isDark ? 'text-gray-200' : 'text-gray-900'
                              )}>
                                {component.title}
                              </h5>
                              <p className={cn(
                                'text-xs',
                                isDark ? 'text-gray-400' : 'text-gray-600'
                              )}>
                                {component.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Main Canvas - React Flow */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges.map(edge => ({
              ...edge,
              label: showTransitionLabels ? edge.label : undefined,
            }))}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            fitView
            className={isDark ? 'bg-[#1e1e2e]' : 'bg-gray-50'}
          >
            <Background 
              variant={BackgroundVariant.Dots} 
              gap={20} 
              size={1} 
              color={isDark ? '#374151' : '#d1d5db'} 
            />
            <Controls 
              className={cn(
                'border',
                isDark 
                  ? 'bg-[#2a2a3e] border-gray-700/50 [&>button]:bg-[#2a2a3e] [&>button]:text-gray-300 [&>button:hover]:bg-gray-700/50'
                  : 'bg-white border-gray-200 [&>button]:bg-white [&>button]:text-gray-700 [&>button:hover]:bg-gray-100'
              )} 
            />
            
            <Panel position="top-right" className="flex gap-2 mr-2 mt-2">
              <Button 
                size="sm" 
                variant="outline" 
                className={cn(
                  isDark 
                    ? 'bg-gray-700/50 text-gray-200 border-gray-600 hover:bg-gray-700' 
                    : 'bg-white border-gray-300 hover:bg-gray-100'
                )}
                onClick={() => alert('Export workflow functionality')}
              >
                <CloudDownload className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className={cn(
                  isDark 
                    ? 'bg-gray-700/50 text-gray-200 border-gray-600 hover:bg-gray-700' 
                    : 'bg-white border-gray-300 hover:bg-gray-100'
                )}
                onClick={() => alert('Test workflow functionality')}
              >
                <Play className="h-4 w-4 mr-2" />
                Test
              </Button>
              <Button 
                size="sm" 
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={() => alert('Save workflow functionality')}
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </Panel>

            {/* Bottom right - Workflow Overview */}
            <Panel position="bottom-right" className="mr-2 mb-2">
              <Button 
                variant="link" 
                className="text-indigo-600 hover:text-indigo-700"
              >
                Workflow Overview
              </Button>
            </Panel>
          </ReactFlow>

          {/* Empty State */}
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <GitBranch className={cn(
                  'h-16 w-16 mx-auto mb-4',
                  isDark ? 'text-gray-600' : 'text-gray-300'
                )} />
                <h3 className={cn(
                  'text-xl font-semibold mb-2',
                  isDark ? 'text-gray-400' : 'text-gray-600'
                )}>
                  {isNewWorkflow ? 'Start Building Your Workflow' : 'Your Workflow Canvas'}
                </h3>
                <p className={cn(
                  'max-w-md mx-auto mb-4',
                  isDark ? 'text-gray-500' : 'text-gray-500'
                )}>
                  {isNewWorkflow 
                    ? 'Drag components from the left panel to start creating your workflow' 
                    : 'Add more components by dragging them from the left panel'
                  }
                </p>
                <div className="inline-flex items-center gap-2 text-indigo-400 text-sm">
                  <span className="text-xl">💡</span>
                  <span>Tip: Start with a "Start" node, then add triggers and actions</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PlatformLayout>
  )
}
