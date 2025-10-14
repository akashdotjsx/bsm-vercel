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
    id: 'trigger-new-ticket',
    icon: <Zap className="h-5 w-5" />,
    title: 'Triggers when new ticket is created',
    bgColor: '#6366f1',
  },
  {
    id: 'trigger-status-change',
    icon: <Target className="h-5 w-5" />,
    title: 'Triggers on ticket status change',
    bgColor: '#9333ea',
  },
  {
    id: 'trigger-sla',
    icon: <AlertTriangle className="h-5 w-5" />,
    title: 'Triggers on SLA violation',
    bgColor: '#ef4444',
  },
]

export default function WorkflowBuilderPage() {
  const router = useRouter()
  const { theme } = useTheme()
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [workflowName, setWorkflowName] = useState('New Approval Workflow')
  const [workflowDescription, setWorkflowDescription] = useState('Workflow Description')
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
          border: '2px solid rgba(255,255,255,0.3)',
          borderRadius: '12px',
          padding: '16px 20px',
          fontSize: '13px',
          fontWeight: '500',
          minWidth: '280px',
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

          {/* Transition Details / Components List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className={cn(
                      'text-base font-semibold',
                      isDark ? 'text-gray-200' : 'text-gray-900'
                    )}>
                      Transition Name
                    </h3>
                    <ChevronDown className={cn(
                      'h-4 w-4',
                      isDark ? 'text-gray-500' : 'text-gray-400'
                    )} />
                  </div>
                  
                  <Card className={cn(
                    'border',
                    isDark 
                      ? 'bg-yellow-900/20 border-yellow-700/50' 
                      : 'bg-yellow-50 border-yellow-200'
                  )}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <p className={cn(
                            'text-sm',
                            isDark ? 'text-yellow-200' : 'text-yellow-900'
                          )}>
                            This transition goes to a status which has no outgoing transitions. 
                            Ensure all paths lead to a terminal status.
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className={cn(
                  'h-px w-full',
                  isDark ? 'bg-gray-700' : 'bg-gray-200'
                )} />

                <div>
                  <h3 className={cn(
                    'text-sm font-medium mb-3',
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  )}>
                    Options
                  </h3>
                  
                  {/* Properties */}
                  <button
                    onClick={() => toggleSection('properties')}
                    className={cn(
                      'w-full flex items-center justify-between py-3 px-4 rounded-lg transition-colors',
                      isDark ? 'hover:bg-gray-700/30' : 'hover:bg-gray-100'
                    )}
                  >
                    <span className={cn(
                      'font-medium text-base',
                      isDark ? 'text-gray-200' : 'text-gray-900'
                    )}>
                      Properties (0)
                    </span>
                    <ChevronDown className={cn(
                      'h-4 w-4 transition-transform',
                      expandedSections.properties && 'rotate-180',
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    )} />
                  </button>
                  
                  {expandedSections.properties && (
                    <div className={cn(
                      'p-4 rounded-lg mt-2',
                      isDark ? 'bg-gray-800/50' : 'bg-gray-50'
                    )}>
                      <p className={cn(
                        'text-sm mb-2',
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      )}>
                        No detailed configuration for Properties yet.
                      </p>
                      <Button 
                        variant="link" 
                        className="h-auto p-0 text-indigo-600 hover:text-indigo-700"
                      >
                        Configure Properties
                      </Button>
                    </div>
                  )}

                  {/* Triggers */}
                  <button
                    onClick={() => toggleSection('triggers')}
                    className={cn(
                      'w-full flex items-center justify-between py-3 px-4 rounded-lg transition-colors mt-2',
                      isDark ? 'hover:bg-gray-700/30' : 'hover:bg-gray-100'
                    )}
                  >
                    <span className={cn(
                      'font-medium text-base',
                      isDark ? 'text-gray-200' : 'text-gray-900'
                    )}>
                      Triggers (2)
                    </span>
                    {expandedSections.triggers ? (
                      <ChevronDown className={cn(
                        'h-4 w-4',
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      )} />
                    ) : (
                      <ChevronRight className={cn(
                        'h-4 w-4',
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      )} />
                    )}
                  </button>

                  {/* Conditions */}
                  <button
                    onClick={() => toggleSection('conditions')}
                    className={cn(
                      'w-full flex items-center justify-between py-3 px-4 rounded-lg transition-colors mt-2',
                      isDark ? 'hover:bg-gray-700/30' : 'hover:bg-gray-100'
                    )}
                  >
                    <span className={cn(
                      'font-medium text-base',
                      isDark ? 'text-gray-200' : 'text-gray-900'
                    )}>
                      Conditions (1)
                    </span>
                    <ChevronRight className={cn(
                      'h-4 w-4',
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    )} />
                  </button>

                  {/* Validators */}
                  <button
                    onClick={() => toggleSection('validators')}
                    className={cn(
                      'w-full flex items-center justify-between py-3 px-4 rounded-lg transition-colors mt-2',
                      isDark ? 'hover:bg-gray-700/30' : 'hover:bg-gray-100'
                    )}
                  >
                    <span className={cn(
                      'font-medium text-base',
                      isDark ? 'text-gray-200' : 'text-gray-900'
                    )}>
                      Validators (3)
                    </span>
                    <ChevronRight className={cn(
                      'h-4 w-4',
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    )} />
                  </button>

                  {/* Post Functions */}
                  <button
                    onClick={() => toggleSection('postFunctions')}
                    className={cn(
                      'w-full flex items-center justify-between py-3 px-4 rounded-lg transition-colors mt-2',
                      isDark ? 'hover:bg-gray-700/30' : 'hover:bg-gray-100'
                    )}
                  >
                    <span className={cn(
                      'font-medium text-base',
                      isDark ? 'text-gray-200' : 'text-gray-900'
                    )}>
                      Post Functions (5)
                    </span>
                    <ChevronRight className={cn(
                      'h-4 w-4',
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    )} />
                  </button>
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
                  Start Building Your Workflow
                </h3>
                <p className={cn(
                  'max-w-md mx-auto mb-4',
                  isDark ? 'text-gray-500' : 'text-gray-500'
                )}>
                  Drag components from the left panel to create your approval workflow
                </p>
                <div className="inline-flex items-center gap-2 text-indigo-400 text-sm">
                  <span className="text-xl">💡</span>
                  <span>Tip: Click the + button on nodes to connect them together</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PlatformLayout>
  )
}
