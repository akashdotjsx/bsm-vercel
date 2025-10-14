'use client'

import React from 'react'
import { Button } from '@/components/ui/button'

export function WorkflowToolbar() {
  return (
    <div className="flex items-center gap-2 p-2 border-b">
      <Button size="sm" variant="outline">
        Toolbar
      </Button>
    </div>
  )
}
