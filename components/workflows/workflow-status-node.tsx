'use client'

import React, { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { Badge } from '@/components/ui/badge'
import { WorkflowStatus } from '@/lib/types/workflow'

export const WorkflowStatusNode = memo(({ data, selected }: NodeProps<{ status: WorkflowStatus; label: string; color: string; category: string }>) => {
  const { status, label, color, category } = data

  return (
    <div 
      className={`px-4 py-3 shadow-lg rounded-lg border-2 transition-all ${
        selected ? 'border-primary ring-2 ring-primary/50' : 'border-border'
      }`}
      style={{
        backgroundColor: color + '15',
        borderColor: selected ? color : undefined
      }}
    >
      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-sm">{label}</span>
          <Badge variant="secondary" className="text-xs">
            {category}
          </Badge>
        </div>
        
        <div 
          className="h-1 rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
      
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </div>
  )
})

WorkflowStatusNode.displayName = 'WorkflowStatusNode'
