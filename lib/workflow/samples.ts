/**
 * Sample Workflow Data
 * Based on the Jira XML workflow structure provided
 */

import type { Workflow, WorkflowDefinition } from '@/types/workflow'

export const sampleServiceWorkflow: WorkflowDefinition = {
  meta: {
    version: '10.0.0',
    category: 'Service Management',
    description: 'Sample workflow for demonstration',
  },
  initialStepId: '1',
  steps: [
    {
      id: '1',
      name: 'To Do',
      status: 'to_do',
      category: 'New',
      type: 'start',
      position: { x: 100, y: 200 },
      properties: {
        color: '#6B7280',
        icon: 'circle',
      },
      actions: [
        {
          id: '10',
          name: 'Start Progress',
          view: 'transition',
          to: '2',
          from: '1',
          conditions: [
            {
              type: 'jira.permission.condition',
              config: {
                permission: 'user_assigned',
              },
            },
          ],
          validators: [],
          postFunctions: [
            {
              type: 'jira.update.status.function',
              config: {
                newStatus: 'in_progress',
              },
              order: 1,
            },
            {
              type: 'jira.update.assignee.function',
              config: {
                assignToCurrentUser: true,
              },
              order: 2,
            },
          ],
        },
      ],
    },
    {
      id: '2',
      name: 'In Progress',
      status: 'in_progress',
      category: 'In Progress',
      type: 'intermediate',
      position: { x: 300, y: 200 },
      properties: {
        color: '#3B82F6',
        icon: 'play',
      },
      actions: [
        {
          id: '11',
          name: 'Send for Review',
          view: 'transition',
          to: '3',
          from: '2',
          conditions: [
            {
              type: 'jira.field.required',
              config: {
                field: 'comment',
                required: true,
              },
            },
          ],
          validators: [
            {
              type: 'jira.field.validator',
              config: {
                field: 'comment',
                required: true,
                minLength: 10,
              },
              errorMessage: 'Comment must be at least 10 characters',
            },
          ],
          postFunctions: [
            {
              type: 'jira.notify.reviewer.function',
              config: {
                notifyRoles: ['reviewer'],
              },
              order: 1,
            },
          ],
        },
      ],
    },
    {
      id: '3',
      name: 'In Review',
      status: 'in_review',
      category: 'Review',
      type: 'intermediate',
      position: { x: 500, y: 200 },
      properties: {
        color: '#F59E0B',
        icon: 'eye',
      },
      actions: [
        {
          id: '12',
          name: 'Approve',
          view: 'transition',
          to: '4',
          from: '3',
          conditions: [
            {
              type: 'jira.permission.condition',
              config: {
                permission: 'approver_required',
              },
            },
          ],
          validators: [
            {
              type: 'jira.permission.validator',
              config: {
                permission: 'approve',
              },
              errorMessage: 'You do not have permission to approve',
            },
          ],
          postFunctions: [
            {
              type: 'jira.set.resolution.function',
              config: {
                resolution: 'done',
              },
              order: 1,
            },
            {
              type: 'jira.notify.reporter.function',
              config: {
                notifyReporter: true,
              },
              order: 2,
            },
          ],
        },
        {
          id: '13',
          name: 'Request Changes',
          view: 'transition',
          to: '2',
          from: '3',
          conditions: [
            {
              type: 'jira.user.condition',
              config: {
                role: 'reviewer',
              },
            },
          ],
          validators: [],
          postFunctions: [
            {
              type: 'jira.add.comment.function',
              config: {
                comment: 'Changes requested',
              },
              order: 1,
            },
          ],
        },
      ],
    },
    {
      id: '4',
      name: 'Done',
      status: 'done',
      category: 'Complete',
      type: 'end',
      position: { x: 700, y: 200 },
      properties: {
        color: '#10B981',
        icon: 'check',
        isResolution: true,
      },
      actions: [
        {
          id: '14',
          name: 'Reopen',
          view: 'transition',
          to: '1',
          from: '4',
          conditions: [
            {
              type: 'jira.permission.condition',
              config: {
                permission: 'can_reopen',
              },
            },
          ],
          validators: [],
          postFunctions: [
            {
              type: 'jira.clear.resolution.function',
              config: {
                clearResolution: true,
              },
              order: 1,
            },
          ],
        },
      ],
    },
  ],
}

export const simpleTicketWorkflow: WorkflowDefinition = {
  meta: {
    version: '1.0.0',
    category: 'Ticket Management',
    description: 'Simple ticket workflow for testing',
  },
  initialStepId: 'new',
  steps: [
    {
      id: 'new',
      name: 'New',
      status: 'new',
      category: 'New',
      type: 'start',
      position: { x: 100, y: 250 },
      actions: [
        {
          id: 'assign',
          name: 'Assign',
          to: 'assigned',
          postFunctions: [
            {
              type: 'jira.update.assignee.function',
              config: {
                assignToCurrentUser: true,
              },
            },
          ],
        },
      ],
    },
    {
      id: 'assigned',
      name: 'Assigned',
      status: 'assigned',
      category: 'In Progress',
      type: 'intermediate',
      position: { x: 300, y: 250 },
      actions: [
        {
          id: 'resolve',
          name: 'Resolve',
          to: 'resolved',
          conditions: [
            {
              type: 'jira.user.condition',
              config: {
                mustBeAssignee: true,
              },
            },
          ],
          postFunctions: [
            {
              type: 'jira.set.resolution.function',
              config: {
                resolution: 'fixed',
              },
            },
          ],
        },
      ],
    },
    {
      id: 'resolved',
      name: 'Resolved',
      status: 'resolved',
      category: 'Complete',
      type: 'end',
      position: { x: 500, y: 250 },
      properties: {
        isResolution: true,
      },
      actions: [
        {
          id: 'close',
          name: 'Close',
          to: 'closed',
          postFunctions: [],
        },
        {
          id: 'reopen',
          name: 'Reopen',
          to: 'assigned',
          postFunctions: [
            {
              type: 'jira.clear.resolution.function',
              config: {},
            },
          ],
        },
      ],
    },
    {
      id: 'closed',
      name: 'Closed',
      status: 'closed',
      category: 'Complete',
      type: 'end',
      position: { x: 700, y: 250 },
      properties: {
        isResolution: true,
      },
      actions: [],
    },
  ],
}

export const complexApprovalWorkflow: WorkflowDefinition = {
  meta: {
    version: '1.0.0',
    category: 'Approvals',
    description: 'Complex approval workflow with multiple conditions',
  },
  initialStepId: 'draft',
  steps: [
    {
      id: 'draft',
      name: 'Draft',
      status: 'draft',
      category: 'New',
      type: 'start',
      position: { x: 100, y: 300 },
      actions: [
        {
          id: 'submit',
          name: 'Submit for Approval',
          to: 'pending_approval',
          validators: [
            {
              type: 'jira.field.validator',
              config: {
                field: 'title',
                required: true,
                minLength: 5,
              },
              errorMessage: 'Title must be at least 5 characters',
            },
            {
              type: 'jira.field.validator',
              config: {
                field: 'description',
                required: true,
                minLength: 20,
              },
              errorMessage: 'Description must be at least 20 characters',
            },
          ],
          postFunctions: [
            {
              type: 'jira.notify.function',
              config: {
                notifyRoles: ['approver', 'manager'],
              },
            },
          ],
        },
      ],
    },
    {
      id: 'pending_approval',
      name: 'Pending Approval',
      status: 'pending_approval',
      category: 'In Progress',
      type: 'intermediate',
      position: { x: 350, y: 300 },
      actions: [
        {
          id: 'approve',
          name: 'Approve',
          to: 'approved',
          conditions: [
            {
              type: 'jira.role.condition',
              config: {
                role: 'approver',
              },
            },
          ],
          validators: [
            {
              type: 'jira.permission.validator',
              config: {
                permission: 'approve',
              },
            },
          ],
          postFunctions: [
            {
              type: 'jira.update.field.function',
              config: {
                fieldUpdates: {
                  approved_by: '{{user.id}}',
                  approved_at: '{{now}}',
                },
              },
            },
            {
              type: 'jira.notify.reporter.function',
              config: {
                notifyReporter: true,
              },
            },
          ],
        },
        {
          id: 'reject',
          name: 'Reject',
          to: 'rejected',
          conditions: [
            {
              type: 'jira.role.condition',
              config: {
                role: 'approver',
              },
            },
          ],
          validators: [
            {
              type: 'jira.field.validator',
              config: {
                field: 'rejection_reason',
                required: true,
                minLength: 10,
              },
              errorMessage: 'Rejection reason must be at least 10 characters',
            },
          ],
          postFunctions: [
            {
              type: 'jira.add.comment.function',
              config: {
                comment: 'Rejected: {{context.rejection_reason}}',
              },
            },
            {
              type: 'jira.notify.reporter.function',
              config: {
                notifyReporter: true,
              },
            },
          ],
        },
        {
          id: 'withdraw',
          name: 'Withdraw',
          to: 'draft',
          conditions: [
            {
              type: 'jira.user.condition',
              config: {
                mustBeReporter: true,
              },
            },
          ],
          postFunctions: [],
        },
      ],
    },
    {
      id: 'approved',
      name: 'Approved',
      status: 'approved',
      category: 'Complete',
      type: 'end',
      position: { x: 600, y: 200 },
      properties: {
        isResolution: true,
        color: '#10B981',
      },
      actions: [],
    },
    {
      id: 'rejected',
      name: 'Rejected',
      status: 'rejected',
      category: 'Complete',
      type: 'end',
      position: { x: 600, y: 400 },
      properties: {
        isResolution: true,
        color: '#EF4444',
      },
      actions: [
        {
          id: 'revise',
          name: 'Revise and Resubmit',
          to: 'draft',
          postFunctions: [
            {
              type: 'jira.clear.resolution.function',
              config: {},
            },
          ],
        },
      ],
    },
  ],
}

// Helper function to create a complete workflow object
export function createWorkflowFromDefinition(
  definition: WorkflowDefinition,
  organizationId: string,
  createdBy?: string
): Omit<Workflow, 'id' | 'created_at' | 'updated_at'> {
  return {
    organization_id: organizationId,
    name: definition.meta?.description || 'Unnamed Workflow',
    description: definition.meta?.description,
    category: definition.meta?.category,
    definition,
    version: 1,
    is_template: false,
    status: 'draft',
    created_by: createdBy,
    last_modified_by: createdBy,
    total_executions: 0,
    successful_executions: 0,
    failed_executions: 0,
  }
}

// Export all sample workflows
export const sampleWorkflows = {
  service: sampleServiceWorkflow,
  simple: simpleTicketWorkflow,
  approval: complexApprovalWorkflow,
}
