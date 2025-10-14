'use client'

import React from 'react'
import { Node, Edge } from 'reactflow'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'

interface WorkflowSidebarProps {
  selectedNode: Node | null
  selectedEdge: Edge | null
  onUpdateNode: (nodeId: string, data: Partial<Node['data']>) => void
  onUpdateEdge: (edgeId: string, data: Partial<Edge['data']>) => void
  onClose: () => void
}

export function WorkflowSidebar({
  selectedNode,
  selectedEdge,
  onUpdateNode,
  onUpdateEdge,
  onClose
}: WorkflowSidebarProps) {
  if (!selectedNode && !selectedEdge) {
    return (
      <div className="w-80 border-l bg-background p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Properties</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Select a status or transition to edit its properties
        </p>
      </div>
    )
  }

  return (
    <div className="w-80 border-l bg-background flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold">
          {selectedNode ? 'Status Properties' : 'Transition Properties'}
        </h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {selectedNode && (
            <>
              <div className="space-y-2">
                <Label htmlFor="status-name">Status Name</Label>
                <Input
                  id="status-name"
                  value={selectedNode.data.status.name}
                  onChange={(e) =>
                    onUpdateNode(selectedNode.id, {
                      ...selectedNode.data,
                      status: { ...selectedNode.data.status, name: e.target.value },
                      label: e.target.value
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status-category">Category</Label>
                <select
                  id="status-category"
                  className="w-full border rounded-md p-2"
                  value={selectedNode.data.status.category}
                  onChange={(e) =>
                    onUpdateNode(selectedNode.id, {
                      ...selectedNode.data,
                      status: { ...selectedNode.data.status, category: e.target.value },
                      category: e.target.value
                    })
                  }
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status-color">Color</Label>
                <Input
                  id="status-color"
                  type="color"
                  value={selectedNode.data.status.color}
                  onChange={(e) =>
                    onUpdateNode(selectedNode.id, {
                      ...selectedNode.data,
                      status: { ...selectedNode.data.status, color: e.target.value },
                      color: e.target.value
                    })
                  }
                />
              </div>
            </>
          )}

          {selectedEdge && (
            <>
              <div className="space-y-2">
                <Label htmlFor="transition-name">Transition Name</Label>
                <Input
                  id="transition-name"
                  value={selectedEdge.data.transition.name}
                  onChange={(e) =>
                    onUpdateEdge(selectedEdge.id, {
                      ...selectedEdge.data,
                      transition: { ...selectedEdge.data.transition, name: e.target.value },
                      label: e.target.value
                    })
                  }
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-medium text-sm">Conditions</h4>
                <p className="text-xs text-muted-foreground">
                  {selectedEdge.data.transition.conditions?.length || 0} condition(s)
                </p>
                {/* Add conditions editor here */}
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-medium text-sm">Validators</h4>
                <p className="text-xs text-muted-foreground">
                  {selectedEdge.data.transition.validators?.length || 0} validator(s)
                </p>
                {/* Add validators editor here */}
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-medium text-sm">Post-Functions</h4>
                <p className="text-xs text-muted-foreground">
                  {selectedEdge.data.transition.post_functions?.length || 0} post-function(s)
                </p>
                {/* Add post-functions editor here */}
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
