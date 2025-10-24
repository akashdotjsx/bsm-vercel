import { createClient } from '@/lib/supabase/client'

interface NotificationPayload {
  userId: string
  organizationId: string
  type: 'ticket' | 'workflow' | 'system' | 'info' | 'success' | 'user'
  title: string
  message: string
  priority?: 'high' | 'medium' | 'low'
  metadata?: Record<string, any>
}

/**
 * Send a notification to a user
 * This creates a notification record in the database which will trigger
 * realtime updates to the notification bell
 */
export async function sendNotification(payload: NotificationPayload): Promise<boolean> {
  try {
    const supabase = createClient()
    
    const { error } = await supabase.from('notifications').insert({
      user_id: payload.userId,
      organization_id: payload.organizationId,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      priority: payload.priority || 'medium',
      metadata: payload.metadata || {},
      read: false,
    })

    if (error) {
      console.error('Failed to send notification:', error)
      return false
    }

    return true
  } catch (err) {
    console.error('Error sending notification:', err)
    return false
  }
}

/**
 * Send notification when a ticket is assigned
 */
export async function notifyTicketAssignment(params: {
  assigneeId: string
  organizationId: string
  ticketNumber: string
  ticketTitle: string
  assignedBy?: string
  priority?: 'high' | 'medium' | 'low'
}) {
  const assignedByText = params.assignedBy ? ` by ${params.assignedBy}` : ''
  
  return sendNotification({
    userId: params.assigneeId,
    organizationId: params.organizationId,
    type: 'ticket',
    title: 'Ticket Assigned to You',
    message: `Ticket ${params.ticketNumber}: "${params.ticketTitle}" has been assigned to you${assignedByText}`,
    priority: params.priority || 'medium',
    metadata: {
      ticketNumber: params.ticketNumber,
      action: 'assigned',
    },
  })
}

/**
 * Send notification when a ticket is updated
 */
export async function notifyTicketUpdate(params: {
  userId: string
  organizationId: string
  ticketNumber: string
  ticketTitle: string
  updateType: string
  updatedBy?: string
}) {
  const updatedByText = params.updatedBy ? ` by ${params.updatedBy}` : ''
  
  return sendNotification({
    userId: params.userId,
    organizationId: params.organizationId,
    type: 'ticket',
    title: 'Ticket Updated',
    message: `Ticket ${params.ticketNumber}: "${params.ticketTitle}" was updated${updatedByText}`,
    priority: 'low',
    metadata: {
      ticketNumber: params.ticketNumber,
      action: 'updated',
      updateType: params.updateType,
    },
  })
}

/**
 * Send notification when a ticket is resolved
 */
export async function notifyTicketResolved(params: {
  userId: string
  organizationId: string
  ticketNumber: string
  ticketTitle: string
  resolvedBy?: string
}) {
  const resolvedByText = params.resolvedBy ? ` by ${params.resolvedBy}` : ''
  
  return sendNotification({
    userId: params.userId,
    organizationId: params.organizationId,
    type: 'success',
    title: 'Ticket Resolved',
    message: `Ticket ${params.ticketNumber}: "${params.ticketTitle}" has been resolved${resolvedByText}`,
    priority: 'low',
    metadata: {
      ticketNumber: params.ticketNumber,
      action: 'resolved',
    },
  })
}

/**
 * Send notification when a workflow requires approval
 */
export async function notifyWorkflowApproval(params: {
  approverId: string
  organizationId: string
  workflowName: string
  workflowId: string
  requestedBy?: string
}) {
  const requestedByText = params.requestedBy ? ` from ${params.requestedBy}` : ''
  
  return sendNotification({
    userId: params.approverId,
    organizationId: params.organizationId,
    type: 'workflow',
    title: 'Workflow Approval Required',
    message: `The workflow "${params.workflowName}" requires your approval${requestedByText}`,
    priority: 'medium',
    metadata: {
      workflowId: params.workflowId,
      action: 'approval_required',
    },
  })
}

/**
 * Send notification when a workflow is completed
 */
export async function notifyWorkflowCompleted(params: {
  userId: string
  organizationId: string
  workflowName: string
  workflowId: string
}) {
  return sendNotification({
    userId: params.userId,
    organizationId: params.organizationId,
    type: 'success',
    title: 'Workflow Completed',
    message: `The workflow "${params.workflowName}" has been completed successfully`,
    priority: 'low',
    metadata: {
      workflowId: params.workflowId,
      action: 'completed',
    },
  })
}

/**
 * Send notification when a workflow is assigned
 */
export async function notifyWorkflowAssignment(params: {
  assigneeId: string
  organizationId: string
  workflowName: string
  workflowId: string
  assignedBy?: string
}) {
  const assignedByText = params.assignedBy ? ` by ${params.assignedBy}` : ''
  
  return sendNotification({
    userId: params.assigneeId,
    organizationId: params.organizationId,
    type: 'workflow',
    title: 'Workflow Assigned to You',
    message: `The workflow "${params.workflowName}" has been assigned to you${assignedByText}`,
    priority: 'medium',
    metadata: {
      workflowId: params.workflowId,
      action: 'assigned',
    },
  })
}

/**
 * Send notification for SLA breach warning
 */
export async function notifySLABreach(params: {
  userId: string
  organizationId: string
  ticketNumber: string
  ticketTitle: string
  timeRemaining: string
}) {
  return sendNotification({
    userId: params.userId,
    organizationId: params.organizationId,
    type: 'system',
    title: 'SLA Breach Warning',
    message: `Ticket ${params.ticketNumber}: "${params.ticketTitle}" is approaching SLA deadline (${params.timeRemaining} remaining)`,
    priority: 'high',
    metadata: {
      ticketNumber: params.ticketNumber,
      action: 'sla_warning',
      timeRemaining: params.timeRemaining,
    },
  })
}

/**
 * Send multiple notifications at once
 */
export async function sendBatchNotifications(notifications: NotificationPayload[]): Promise<boolean[]> {
  return Promise.all(notifications.map(sendNotification))
}
