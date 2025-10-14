'use client'

import React, { useCallback, useState, useEffect } from 'react'
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Connection,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
  MarkerType,
  Panel
} from 'reactflow'
import 'reactflow/dist/style.css'

import { WorkflowConfig, WorkflowStatus, WorkflowTransition } from '@/lib/types/workflow'
import { WorkflowStatusNode } from './workflow-status-node'
import { WorkflowTransitionEdge } from './workflow-transition-edge'
import { WorkflowToolbar } from './workflow-toolbar'
import { WorkflowSidebar } from './workflow-sidebar'
import { Button } from '@/components/ui/button'
import { Save, Play, Settings } from 'lucide-react'

const nodeTypes = {
  statusNode: WorkflowStatusNode
}

const edgeTypes = {
  transitionEdge: WorkflowTransitionEdge
}

interface WorkflowDesignerProps {
  workflowConfig?: WorkflowConfig
  onSave?: (config: WorkflowConfig) => void
  onTest?: (config: WorkflowConfig) => void
  readOnly?: boolean
}

export function WorkflowDesigner({
  workflowConfig,
  onSave,
  onTest,
  readOnly = false
}: WorkflowDesignerProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null)
  const [showSidebar, setShowSidebar] = useState(true)

  // Initialize from workflow config
  useEffect(() => {
    if (workflowConfig) {
      const newNodes = workflowConfig.statuses.map((status, index) => ({
        id: status.id,
        type: 'statusNode',
        data: {
          label: status.name,
          status,
          category: status.category,
          color: status.color
        },
        position: { x: index * 250, y: 200 }
      }))

      const newEdges = workflowConfig.transitions.map(transition => ({
        id: `${transition.from_status}-${transition.to_status}`,
        source: transition.from_status,
        target: transition.to_status,
        type: 'transitionEdge',
        data: {
          transition,
          label: transition.name
        },
        markerEnd: {
          type: MarkerType.ArrowClosed
        }
      }))

      setNodes(newNodes)
      setEdges(newEdges)
    }
  }, [workflowConfig, setNodes, setEdges])

  const onConnect = useCallback(
    (params: Connection) => {
      if (readOnly) return
      
      const newEdge = {
        ...params,
        id: `${params.source}-${params.target}`,
        type: 'transitionEdge',
        data: {
          transition: {
            id: `transition-${Date.now()}`,
            name: 'New Transition',
            from_status: params.source!,
            to_status: params.target!,
            conditions: [],
            validators: [],
            post_functions: []
          }
        },
        markerEnd: {
          type: MarkerType.ArrowClosed
        }
      }
      
      setEdges((eds) => addEdge(newEdge, eds))
    },
    [readOnly, setEdges]
  )

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
    setSelectedEdge(null)
    setShowSidebar(true)
  }, [])

  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    setSelectedEdge(edge)
    setSelectedNode(null)
    setShowSidebar(true)
  }, [])

  const addNewStatus = useCallback(() => {
    const newStatus: WorkflowStatus = {
      id: `status-${Date.now()}`,
      name: 'New Status',
      category: 'in_progress',
      color: '#3B82F6'
    }

    const newNode: Node = {
      id: newStatus.id,
      type: 'statusNode',
      data: {
        label: newStatus.name,
        status: newStatus,
        category: newStatus.category,
        color: newStatus.color
      },
      position: {
        x: Math.random() * 500,
        y: Math.random() * 300
      }
    }

    setNodes((nds) => [...nds, newNode])
  }, [setNodes])

  const deleteSelectedNode = useCallback(() => {
    if (!selectedNode) return

    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id))
    setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id))
    setSelectedNode(null)
  }, [selectedNode, setNodes, setEdges])

  const deleteSelectedEdge = useCallback(() => {
    if (!selectedEdge) return

    setEdges((eds) => eds.filter((e) => e.id !== selectedEdge.id))
    setSelectedEdge(null)
  }, [selectedEdge, setEdges])

  const updateNodeData = useCallback((nodeId: string, newData: Partial<Node['data']>) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: { ...node.data, ...newData }
            }
          : node
      )
    )
  }, [setNodes])

  const updateEdgeData = useCallback((edgeId: string, newData: Partial<Edge['data']>) => {
    setEdges((eds) =>
      eds.map((edge) =>
        edge.id === edgeId
          ? {
              ...edge,
              data: { ...edge.data, ...newData }
            }
          : edge
      )
    )
  }, [setEdges])

  const handleSave = useCallback(() => {
    // Convert nodes and edges back to workflow config
    const statuses: WorkflowStatus[] = nodes.map((node) => node.data.status)
    const transitions: WorkflowTransition[] = edges.map((edge) => edge.data.transition)

    const config: WorkflowConfig = {
      statuses,
      transitions,
      initial_status: nodes[0]?.id || ''
    }

    onSave?.(config)
  }, [nodes, edges, onSave])

  const handleTest = useCallback(() => {
    const statuses: WorkflowStatus[] = nodes.map((node) => node.data.status)
    const transitions: WorkflowTransition[] = edges.map((edge) => edge.data.transition)

    const config: WorkflowConfig = {
      statuses,
      transitions,
      initial_status: nodes[0]?.id || ''
    }

    onTest?.(config)
  }, [nodes, edges, onTest])

  return (
    <div className="flex h-full w-full">
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          snapToGrid
          snapGrid={[15, 15]}
          defaultEdgeOptions={{
            type: 'transitionEdge',
            animated: true,
            markerEnd: {
              type: MarkerType.ArrowClosed
            }
          }}
        >
          <Background />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              return node.data.color || '#3B82F6'
            }}
          />
          
          <Panel position="top-left" className="bg-background border rounded-lg shadow-lg p-2 space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={addNewStatus}
              disabled={readOnly}
            >
              Add Status
            </Button>
            {selectedNode && (
              <Button
                size="sm"
                variant="destructive"
                onClick={deleteSelectedNode}
                disabled={readOnly}
              >
                Delete Status
              </Button>
            )}
            {selectedEdge && (
              <Button
                size="sm"
                variant="destructive"
                onClick={deleteSelectedEdge}
                disabled={readOnly}
              >
                Delete Transition
              </Button>
            )}
          </Panel>

          <Panel position="top-right" className="bg-background border rounded-lg shadow-lg p-2 space-x-2">
            <Button
              size="sm"
              onClick={handleTest}
              disabled={readOnly}
            >
              <Play className="h-4 w-4 mr-2" />
              Test
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={readOnly}
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowSidebar(!showSidebar)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </Panel>
        </ReactFlow>
      </div>

      {showSidebar && (
        <WorkflowSidebar
          selectedNode={selectedNode}
          selectedEdge={selectedEdge}
          onUpdateNode={updateNodeData}
          onUpdateEdge={updateEdgeData}
          onClose={() => setShowSidebar(false)}
        />
      )}
    </div>
  )
}
