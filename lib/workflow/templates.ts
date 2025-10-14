/**
 * Workflow Templates Library
 * Pre-built workflow templates for common BSM scenarios
 */

import type { WorkflowConfig, WorkflowStep, WorkflowTransition } from '@/lib/types/workflow'

export interface WorkflowTemplate {
  id: string
  name: string
  description: string
  entity_type: 'ticket' | 'service_request' | 'change' | 'asset' | 'incident'
  category: string
  tags: string[]
  config: WorkflowConfig
  icon?: string
  color?: string
  previewImage?: string
}

/**
 * Incident Management Workflow
 * Standard ITIL incident lifecycle
 */
export const incidentWorkflowTemplate: WorkflowTemplate = {
  id: 'template-incident-standard',
  name: 'Standard Incident Workflow',
  description: 'ITIL-compliant incident management workflow with automatic escalation',
  entity_type: 'incident',
  category: 'Incident Management',
  tags: ['itil', 'incident', 'support', 'escalation'],
  icon: 'AlertTriangle',
  color: '#EF4444',
  config: {
    statuses: [
      { id: 'new', name: 'New', category: 'todo', color: '#6B7280' },
      { id: 'assigned', name: 'Assigned', category: 'in_progress', color: '#3B82F6' },
      { id: 'investigating', name: 'Investigating', category: 'in_progress', color: '#8B5CF6' },
      { id: 'escalated', name: 'Escalated', category: 'in_progress', color: '#F59E0B' },
      { id: 'resolved', name: 'Resolved', category: 'done', color: '#10B981' },
      { id: 'closed', name: 'Closed', category: 'done', color: '#059669' }
    ],
    transitions: [
      {
        id: 'assign',
        name: 'Assign',
        from_status: 'new',
        to_status: 'assigned',
        conditions: [],
        validators: [
          {
            type: 'required_field',
            config: { field: 'assignee_id' },
            message: 'Assignee is required'
          }
        ],
        post_functions: [
          {
            type: 'notification',
            config: { notify_assignee: true, template: 'incident_assigned' }
          },
          {
            type: 'sla_start',
            config: { sla_metric: 'response_time' }
          }
        ]
      },
      {
        id: 'start_investigation',
        name: 'Start Investigation',
        from_status: 'assigned',
        to_status: 'investigating',
        conditions: [
          {
            type: 'permission',
            config: { required: 'handle_incidents' }
          }
        ],
        validators: [],
        post_functions: [
          {
            type: 'auto_comment',
            config: { message: 'Investigation started by {{user.display_name}}' }
          }
        ]
      },
      {
        id: 'escalate',
        name: 'Escalate',
        from_status: 'investigating',
        to_status: 'escalated',
        conditions: [
          {
            type: 'field_value',
            config: { field: 'priority', operator: 'in', values: ['high', 'critical'] }
          }
        ],
        validators: [
          {
            type: 'required_field',
            config: { field: 'escalation_reason' },
            message: 'Escalation reason is required'
          }
        ],
        post_functions: [
          {
            type: 'notification',
            config: { notify_roles: ['incident_manager'], template: 'incident_escalated' }
          },
          {
            type: 'field_update',
            config: { fields: { escalation_level: 2, escalated_at: '{{now}}' } }
          }
        ]
      },
      {
        id: 'resolve',
        name: 'Resolve',
        from_status: 'investigating',
        to_status: 'resolved',
        conditions: [],
        validators: [
          {
            type: 'required_field',
            config: { field: 'resolution_notes' },
            message: 'Resolution notes are required'
          }
        ],
        post_functions: [
          {
            type: 'notification',
            config: { notify_requester: true, template: 'incident_resolved' }
          },
          {
            type: 'sla_stop',
            config: { sla_metric: 'resolution_time' }
          },
          {
            type: 'field_update',
            config: { fields: { resolved_at: '{{now}}', resolved_by: '{{user.id}}' } }
          }
        ]
      },
      {
        id: 'close',
        name: 'Close',
        from_status: 'resolved',
        to_status: 'closed',
        conditions: [
          {
            type: 'time_elapsed',
            config: { hours: 24, since: 'resolved_at' }
          }
        ],
        validators: [],
        post_functions: [
          {
            type: 'field_update',
            config: { fields: { closed_at: '{{now}}', closed_by: '{{user.id}}' } }
          }
        ]
      },
      {
        id: 'reopen',
        name: 'Reopen',
        from_status: 'resolved',
        to_status: 'assigned',
        conditions: [],
        validators: [
          {
            type: 'required_field',
            config: { field: 'reopen_reason' },
            message: 'Reason for reopening is required'
          }
        ],
        post_functions: [
          {
            type: 'auto_comment',
            config: { message: 'Reopened: {{context.reopen_reason}}' }
          },
          {
            type: 'notification',
            config: { notify_assignee: true, template: 'incident_reopened' }
          }
        ]
      }
    ],
    initial_status: 'new'
  }
}

/**
 * Change Management Workflow
 * ITIL change process with approvals
 */
export const changeWorkflowTemplate: WorkflowTemplate = {
  id: 'template-change-standard',
  name: 'Standard Change Workflow',
  description: 'ITIL change management with CAB approval and risk assessment',
  entity_type: 'change',
  category: 'Change Management',
  tags: ['itil', 'change', 'cab', 'approval'],
  icon: 'GitBranch',
  color: '#8B5CF6',
  config: {
    statuses: [
      { id: 'draft', name: 'Draft', category: 'todo', color: '#6B7280' },
      { id: 'pending_review', name: 'Pending Review', category: 'in_progress', color: '#3B82F6' },
      { id: 'pending_cab', name: 'Pending CAB Approval', category: 'in_progress', color: '#F59E0B' },
      { id: 'approved', name: 'Approved', category: 'in_progress', color: '#10B981' },
      { id: 'scheduled', name: 'Scheduled', category: 'in_progress', color: '#6366F1' },
      { id: 'implementing', name: 'Implementing', category: 'in_progress', color: '#8B5CF6' },
      { id: 'completed', name: 'Completed', category: 'done', color: '#059669' },
      { id: 'rejected', name: 'Rejected', category: 'done', color: '#EF4444' },
      { id: 'cancelled', name: 'Cancelled', category: 'done', color: '#DC2626' }
    ],
    transitions: [
      {
        id: 'submit_for_review',
        name: 'Submit for Review',
        from_status: 'draft',
        to_status: 'pending_review',
        conditions: [],
        validators: [
          {
            type: 'required_field',
            config: { field: 'title' },
            message: 'Title is required'
          },
          {
            type: 'required_field',
            config: { field: 'description' },
            message: 'Description is required'
          },
          {
            type: 'required_field',
            config: { field: 'risk_assessment' },
            message: 'Risk assessment is required'
          },
          {
            type: 'required_field',
            config: { field: 'implementation_plan' },
            message: 'Implementation plan is required'
          },
          {
            type: 'required_field',
            config: { field: 'rollback_plan' },
            message: 'Rollback plan is required'
          }
        ],
        post_functions: [
          {
            type: 'notification',
            config: { notify_roles: ['change_manager'], template: 'change_submitted' }
          }
        ]
      },
      {
        id: 'submit_to_cab',
        name: 'Submit to CAB',
        from_status: 'pending_review',
        to_status: 'pending_cab',
        conditions: [
          {
            type: 'permission',
            config: { required: 'change_manager' }
          },
          {
            type: 'field_value',
            config: { field: 'risk_level', operator: 'in', values: ['medium', 'high', 'critical'] }
          }
        ],
        validators: [],
        post_functions: [
          {
            type: 'notification',
            config: { notify_roles: ['cab_member'], template: 'cab_review_needed' }
          },
          {
            type: 'field_update',
            config: { fields: { cab_review_date: '{{now}}' } }
          }
        ]
      },
      {
        id: 'approve_change',
        name: 'Approve',
        from_status: 'pending_cab',
        to_status: 'approved',
        conditions: [
          {
            type: 'permission',
            config: { required: 'approve_changes' }
          }
        ],
        validators: [
          {
            type: 'required_field',
            config: { field: 'approved_by' },
            message: 'Approver information is required'
          }
        ],
        post_functions: [
          {
            type: 'notification',
            config: { notify_requester: true, template: 'change_approved' }
          },
          {
            type: 'field_update',
            config: { fields: { approved_at: '{{now}}', approved_by: '{{user.id}}' } }
          }
        ]
      },
      {
        id: 'schedule_change',
        name: 'Schedule',
        from_status: 'approved',
        to_status: 'scheduled',
        conditions: [],
        validators: [
          {
            type: 'required_field',
            config: { field: 'scheduled_start_time' },
            message: 'Scheduled start time is required'
          },
          {
            type: 'required_field',
            config: { field: 'scheduled_end_time' },
            message: 'Scheduled end time is required'
          }
        ],
        post_functions: [
          {
            type: 'notification',
            config: {
              notify_stakeholders: true,
              template: 'change_scheduled'
            }
          },
          {
            type: 'create_tasks',
            config: {
              tasks: [
                { title: 'Pre-implementation backup', due_offset_hours: -2 },
                { title: 'Execute change', due_offset_hours: 0 },
                { title: 'Post-implementation verification', due_offset_hours: 1 }
              ]
            }
          }
        ]
      },
      {
        id: 'start_implementation',
        name: 'Start Implementation',
        from_status: 'scheduled',
        to_status: 'implementing',
        conditions: [
          {
            type: 'time_window',
            config: { within_minutes_of_scheduled: 30 }
          }
        ],
        validators: [],
        post_functions: [
          {
            type: 'notification',
            config: { notify_stakeholders: true, template: 'change_started' }
          },
          {
            type: 'field_update',
            config: { fields: { actual_start_time: '{{now}}' } }
          }
        ]
      },
      {
        id: 'complete_change',
        name: 'Complete',
        from_status: 'implementing',
        to_status: 'completed',
        conditions: [],
        validators: [
          {
            type: 'required_field',
            config: { field: 'completion_notes' },
            message: 'Completion notes are required'
          },
          {
            type: 'required_field',
            config: { field: 'verification_status' },
            message: 'Verification status is required'
          }
        ],
        post_functions: [
          {
            type: 'notification',
            config: { notify_all: true, template: 'change_completed' }
          },
          {
            type: 'field_update',
            config: { fields: { actual_end_time: '{{now}}', completed_by: '{{user.id}}' } }
          }
        ]
      },
      {
        id: 'reject_change',
        name: 'Reject',
        from_status: 'pending_cab',
        to_status: 'rejected',
        conditions: [
          {
            type: 'permission',
            config: { required: 'approve_changes' }
          }
        ],
        validators: [
          {
            type: 'required_field',
            config: { field: 'rejection_reason' },
            message: 'Rejection reason is required'
          }
        ],
        post_functions: [
          {
            type: 'notification',
            config: { notify_requester: true, template: 'change_rejected' }
          },
          {
            type: 'auto_comment',
            config: { message: 'Change rejected: {{context.rejection_reason}}' }
          }
        ]
      },
      {
        id: 'cancel_change',
        name: 'Cancel',
        from_status: 'scheduled',
        to_status: 'cancelled',
        conditions: [
          {
            type: 'permission',
            config: { required: 'cancel_changes' }
          }
        ],
        validators: [
          {
            type: 'required_field',
            config: { field: 'cancellation_reason' },
            message: 'Cancellation reason is required'
          }
        ],
        post_functions: [
          {
            type: 'notification',
            config: { notify_all: true, template: 'change_cancelled' }
          }
        ]
      }
    ],
    initial_status: 'draft'
  }
}

/**
 * Service Request Workflow
 * Standard service catalog fulfillment
 */
export const serviceRequestWorkflowTemplate: WorkflowTemplate = {
  id: 'template-service-request',
  name: 'Service Request Workflow',
  description: 'Standard workflow for service catalog requests with approval',
  entity_type: 'service_request',
  category: 'Service Management',
  tags: ['service', 'request', 'catalog', 'approval'],
  icon: 'ShoppingCart',
  color: '#10B981',
  config: {
    statuses: [
      { id: 'submitted', name: 'Submitted', category: 'todo', color: '#6B7280' },
      { id: 'pending_approval', name: 'Pending Approval', category: 'in_progress', color: '#F59E0B' },
      { id: 'approved', name: 'Approved', category: 'in_progress', color: '#10B981' },
      { id: 'in_progress', name: 'In Progress', category: 'in_progress', color: '#3B82F6' },
      { id: 'completed', name: 'Completed', category: 'done', color: '#059669' },
      { id: 'rejected', name: 'Rejected', category: 'done', color: '#EF4444' },
      { id: 'cancelled', name: 'Cancelled', category: 'done', color: '#DC2626' }
    ],
    transitions: [
      {
        id: 'auto_approve',
        name: 'Auto-Approve',
        from_status: 'submitted',
        to_status: 'approved',
        conditions: [
          {
            type: 'field_value',
            config: { field: 'requires_approval', operator: 'eq', value: false }
          }
        ],
        validators: [],
        post_functions: [
          {
            type: 'notification',
            config: { notify_fulfillment_team: true, template: 'request_approved' }
          }
        ]
      },
      {
        id: 'send_for_approval',
        name: 'Send for Approval',
        from_status: 'submitted',
        to_status: 'pending_approval',
        conditions: [
          {
            type: 'field_value',
            config: { field: 'requires_approval', operator: 'eq', value: true }
          }
        ],
        validators: [],
        post_functions: [
          {
            type: 'notification',
            config: { notify_approver: true, template: 'approval_needed' }
          }
        ]
      },
      {
        id: 'approve',
        name: 'Approve',
        from_status: 'pending_approval',
        to_status: 'approved',
        conditions: [
          {
            type: 'permission',
            config: { required: 'approve_requests' }
          }
        ],
        validators: [],
        post_functions: [
          {
            type: 'notification',
            config: { notify_requester: true, template: 'request_approved' }
          },
          {
            type: 'field_update',
            config: { fields: { approved_at: '{{now}}', approved_by: '{{user.id}}' } }
          }
        ]
      },
      {
        id: 'start_fulfillment',
        name: 'Start Fulfillment',
        from_status: 'approved',
        to_status: 'in_progress',
        conditions: [],
        validators: [
          {
            type: 'required_field',
            config: { field: 'assignee_id' },
            message: 'Fulfillment assignee is required'
          }
        ],
        post_functions: [
          {
            type: 'notification',
            config: { notify_assignee: true, template: 'fulfillment_assigned' }
          },
          {
            type: 'sla_start',
            config: { sla_metric: 'fulfillment_time' }
          }
        ]
      },
      {
        id: 'complete',
        name: 'Complete',
        from_status: 'in_progress',
        to_status: 'completed',
        conditions: [],
        validators: [
          {
            type: 'required_field',
            config: { field: 'completion_notes' },
            message: 'Completion notes are required'
          }
        ],
        post_functions: [
          {
            type: 'notification',
            config: { notify_requester: true, template: 'request_completed' }
          },
          {
            type: 'sla_stop',
            config: { sla_metric: 'fulfillment_time' }
          },
          {
            type: 'field_update',
            config: { fields: { completed_at: '{{now}}', completed_by: '{{user.id}}' } }
          },
          {
            type: 'satisfaction_survey',
            config: { send_after_hours: 1 }
          }
        ]
      },
      {
        id: 'reject',
        name: 'Reject',
        from_status: 'pending_approval',
        to_status: 'rejected',
        conditions: [
          {
            type: 'permission',
            config: { required: 'approve_requests' }
          }
        ],
        validators: [
          {
            type: 'required_field',
            config: { field: 'rejection_reason' },
            message: 'Rejection reason is required'
          }
        ],
        post_functions: [
          {
            type: 'notification',
            config: { notify_requester: true, template: 'request_rejected' }
          }
        ]
      },
      {
        id: 'cancel',
        name: 'Cancel',
        from_status: 'submitted',
        to_status: 'cancelled',
        conditions: [
          {
            type: 'user_is_requester',
            config: {}
          }
        ],
        validators: [],
        post_functions: []
      }
    ],
    initial_status: 'submitted'
  }
}

/**
 * Simple Ticket Workflow
 * Basic support ticket lifecycle
 */
export const simpleTicketWorkflowTemplate: WorkflowTemplate = {
  id: 'template-ticket-simple',
  name: 'Simple Ticket Workflow',
  description: 'Basic support ticket workflow for general inquiries',
  entity_type: 'ticket',
  category: 'Support',
  tags: ['ticket', 'support', 'simple'],
  icon: 'Ticket',
  color: '#3B82F6',
  config: {
    statuses: [
      { id: 'open', name: 'Open', category: 'todo', color: '#6B7280' },
      { id: 'in_progress', name: 'In Progress', category: 'in_progress', color: '#3B82F6' },
      { id: 'waiting_customer', name: 'Waiting on Customer', category: 'in_progress', color: '#F59E0B' },
      { id: 'resolved', name: 'Resolved', category: 'done', color: '#10B981' },
      { id: 'closed', name: 'Closed', category: 'done', color: '#059669' }
    ],
    transitions: [
      {
        id: 'start_work',
        name: 'Start Work',
        from_status: 'open',
        to_status: 'in_progress',
        conditions: [],
        validators: [],
        post_functions: [
          {
            type: 'field_update',
            config: { fields: { assignee_id: '{{user.id}}' } }
          },
          {
            type: 'sla_start',
            config: { sla_metric: 'response_time' }
          }
        ]
      },
      {
        id: 'await_customer',
        name: 'Wait for Customer',
        from_status: 'in_progress',
        to_status: 'waiting_customer',
        conditions: [],
        validators: [
          {
            type: 'required_field',
            config: { field: 'last_comment' },
            message: 'Please add a comment explaining what you need from the customer'
          }
        ],
        post_functions: [
          {
            type: 'notification',
            config: { notify_requester: true, template: 'awaiting_response' }
          },
          {
            type: 'sla_pause',
            config: { sla_metric: 'resolution_time' }
          }
        ]
      },
      {
        id: 'customer_responded',
        name: 'Customer Responded',
        from_status: 'waiting_customer',
        to_status: 'in_progress',
        conditions: [],
        validators: [],
        post_functions: [
          {
            type: 'sla_resume',
            config: { sla_metric: 'resolution_time' }
          },
          {
            type: 'notification',
            config: { notify_assignee: true, template: 'customer_replied' }
          }
        ]
      },
      {
        id: 'resolve',
        name: 'Resolve',
        from_status: 'in_progress',
        to_status: 'resolved',
        conditions: [],
        validators: [
          {
            type: 'required_field',
            config: { field: 'resolution' },
            message: 'Resolution is required'
          }
        ],
        post_functions: [
          {
            type: 'notification',
            config: { notify_requester: true, template: 'ticket_resolved' }
          },
          {
            type: 'sla_stop',
            config: { sla_metric: 'resolution_time' }
          },
          {
            type: 'field_update',
            config: { fields: { resolved_at: '{{now}}' } }
          }
        ]
      },
      {
        id: 'close',
        name: 'Close',
        from_status: 'resolved',
        to_status: 'closed',
        conditions: [],
        validators: [],
        post_functions: [
          {
            type: 'field_update',
            config: { fields: { closed_at: '{{now}}' } }
          },
          {
            type: 'satisfaction_survey',
            config: { send_immediately: true }
          }
        ]
      },
      {
        id: 'reopen',
        name: 'Reopen',
        from_status: 'resolved',
        to_status: 'in_progress',
        conditions: [],
        validators: [],
        post_functions: [
          {
            type: 'notification',
            config: { notify_assignee: true, template: 'ticket_reopened' }
          },
          {
            type: 'auto_comment',
            config: { message: 'Ticket reopened by {{user.display_name}}' }
          }
        ]
      }
    ],
    initial_status: 'open'
  }
}

// Export all templates
export const workflowTemplates: WorkflowTemplate[] = [
  incidentWorkflowTemplate,
  changeWorkflowTemplate,
  serviceRequestWorkflowTemplate,
  simpleTicketWorkflowTemplate
]

export const workflowTemplateMap: Record<string, WorkflowTemplate> = {
  [incidentWorkflowTemplate.id]: incidentWorkflowTemplate,
  [changeWorkflowTemplate.id]: changeWorkflowTemplate,
  [serviceRequestWorkflowTemplate.id]: serviceRequestWorkflowTemplate,
  [simpleTicketWorkflowTemplate.id]: simpleTicketWorkflowTemplate
}

export function getTemplateById(id: string): WorkflowTemplate | undefined {
  return workflowTemplateMap[id]
}

export function getTemplatesByCategory(category: string): WorkflowTemplate[] {
  return workflowTemplates.filter(t => t.category === category)
}

export function getTemplatesByEntityType(entityType: string): WorkflowTemplate[] {
  return workflowTemplates.filter(t => t.entity_type === entityType)
}
