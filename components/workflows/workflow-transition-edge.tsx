'use client'

import React, { memo } from 'react'
import { EdgeProps, getBezierPath, EdgeLabelRenderer } from 'reactflow'
import { WorkflowTransition } from '@/lib/types/workflow'

export const WorkflowTransitionEdge = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data
}: EdgeProps<{ transition: WorkflowTransition; label?: string }>) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  return (
    <>
      <path
        id={id}
        style={style}
        className="react-flow__edge-path stroke-2"
        d={edgePath}
        markerEnd={markerEnd}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <div className="bg-background border rounded px-2 py-1 text-xs font-medium shadow-sm">
            {data?.label || data?.transition?.name || 'Transition'}
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  )
})

WorkflowTransitionEdge.displayName = 'WorkflowTransitionEdge'
