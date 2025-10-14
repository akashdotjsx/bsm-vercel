/**
 * Comprehensive Workflow Type System
 * Supports Jira-style workflows with statuses, transitions, conditions, validators, and post-functions
 */

// ============================================================================
// Core Workflow Types
// ============================================================================

export interface Workflow {
  id: string
  organization_id: string
  name: string
  description?: string
  category?: string
  definition: WorkflowDefinition
  version: number
  is_template: boolean
  status: 'draft' | 'active' | 'archived'
  created_by?: string
  last_modified_by?: string
  total_executions: number
  successful_executions: number
  failed_executions: number
  created_at: string
  updated_at: string
}

export interface WorkflowDefinition {
  meta?: WorkflowMeta
  steps: WorkflowStep[]
  initialStepId: string
  variables?: Record<string, any>
}

export interface WorkflowMeta {
  version?: string
  category?: string
  description?: string
  tags?: string[]
  [key: string]: any
}

// ============================================================================
// Workflow Steps (Statuses)
// ============================================================================

export interface WorkflowStep {
  id: string
  name: string
  status: string  // Maps to ticket status
  category: StatusCategory
  type?: 'start' | 'intermediate' | 'end'
  position?: { x: number; y: number }
  properties?: StepProperties
  actions: WorkflowAction[]  // Transitions from this step
}

export type StatusCategory = 'New' | 'In Progress' | 'Review' | 'Complete' | 'Blocked' | 'Cancelled'

export interface StepProperties {
  color?: string
  icon?: string
  isResolution?: boolean
  allowReopen?: boolean
  requiresComment?: boolean
  autoAssign?: boolean
  notifyUsers?: string[]
  [key: string]: any
}

// ============================================================================
// Workflow Actions (Transitions)
// ============================================================================

export interface WorkflowAction {
  id: string
  name: string  // Transition name
  view?: 'transition' | 'inline'
  to: string  // Target step ID
  from?: string  // Source step ID (redundant but helpful)
  conditions?: WorkflowCondition[]
  validators?: WorkflowValidator[]
  postFunctions?: WorkflowPostFunction[]
  properties?: ActionProperties
}

export interface ActionProperties {
  requireComment?: boolean
  requireAssignee?: boolean
  requireApproval?: boolean
  buttonColor?: string
  confirmationMessage?: string
  [key: string]: any
}

// ============================================================================
// Conditions
// ============================================================================

export interface WorkflowCondition {
  id?: string
  type: ConditionType
  config: ConditionConfig
  operator?: 'AND' | 'OR'
  negate?: boolean
}

export type ConditionType =
  | 'jira.permission.condition'
  | 'jira.field.required'
  | 'jira.user.condition'
  | 'jira.role.condition'
  | 'jira.field.value'
  | 'jira.field.comparison'
  | 'jira.time.condition'
  | 'custom.script'

export interface ConditionConfig {
  // Permission-based
  permission?: string
  requiredPermission?: string
  
  // Field-based
  field?: string
  value?: any
  operator?: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than'
  required?: boolean
  
  // User/Role-based
  user?: string
  role?: string
  mustBeAssignee?: boolean
  mustBeReporter?: boolean
  
  // Time-based
  beforeDate?: string
  afterDate?: string
  withinHours?: number
  
  // Custom script
  script?: string
  scriptLanguage?: 'javascript' | 'typescript'
  
  [key: string]: any
}

// ============================================================================
// Validators
// ============================================================================

export interface WorkflowValidator {
  id?: string
  type: ValidatorType
  config: ValidatorConfig
  errorMessage?: string
}

export type ValidatorType =
  | 'jira.field.validator'
  | 'jira.permission.validator'
  | 'jira.regex.validator'
  | 'jira.date.validator'
  | 'jira.user.validator'
  | 'custom.validator'

export interface ValidatorConfig {
  // Field validation
  field?: string
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: string  // Regex pattern
  
  // Permission validation
  permission?: string
  mustHaveRole?: string
  
  // Date validation
  dateField?: string
  mustBeFuture?: boolean
  mustBePast?: boolean
  maxDaysFromNow?: number
  
  // User validation
  mustBeAssigned?: boolean
  allowedUsers?: string[]
  
  // Custom script
  validatorScript?: string
  
  [key: string]: any
}

// ============================================================================
// Post Functions
// ============================================================================

export interface WorkflowPostFunction {
  id?: string
  type: PostFunctionType
  config: PostFunctionConfig
  order?: number
}

export type PostFunctionType =
  | 'jira.update.status.function'
  | 'jira.update.assignee.function'
  | 'jira.set.resolution.function'
  | 'jira.clear.resolution.function'
  | 'jira.notify.function'
  | 'jira.notify.reviewer.function'
  | 'jira.notify.reporter.function'
  | 'jira.add.comment.function'
  | 'jira.update.field.function'
  | 'jira.trigger.webhook.function'
  | 'custom.function'

export interface PostFunctionConfig {
  // Status update
  newStatus?: string
  
  // Assignee update
  assignTo?: string
  assignToReporter?: boolean
  assignToCurrentUser?: boolean
  unassign?: boolean
  
  // Resolution
  resolution?: string
  clearResolution?: boolean
  
  // Notifications
  notifyUsers?: string[]
  notifyRoles?: string[]
  notifyReporter?: boolean
  notifyAssignee?: boolean
  emailTemplate?: string
  
  // Comments
  comment?: string
  commentVisibility?: 'public' | 'internal'
  
  // Field updates
  fieldUpdates?: Record<string, any>
  
  // Webhook
  webhookUrl?: string
  webhookPayload?: Record<string, any>
  
  // Custom script
  functionScript?: string
  
  [key: string]: any
}

// ============================================================================
// Workflow Execution Types
// ============================================================================

export interface WorkflowExecution {
  id: string
  workflow_id: string
  organization_id: string
  triggered_by: string
  trigger_user_id?: string
  context_data: ExecutionContext
  ticket_id?: string
  service_request_id?: string
  status: 'running' | 'completed' | 'failed' | 'cancelled'
  current_step?: string
  error_message?: string
  started_at: string
  completed_at?: string
  duration_seconds?: number
  execution_log: ExecutionLogEntry[]
  created_at: string
}

export interface ExecutionContext {
  entityType: 'ticket' | 'service_request' | 'asset' | 'change_request'
  entityId: string
  userId: string
  previousStatus?: string
  newStatus?: string
  transitionId?: string
  transitionName?: string
  comment?: string
  [key: string]: any
}

export interface ExecutionLogEntry {
  timestamp: string
  stepId?: string
  stepName?: string
  action: string
  status: 'started' | 'completed' | 'failed' | 'skipped'
  message?: string
  details?: Record<string, any>
  duration?: number
}

export interface StepExecution {
  id: string
  execution_id: string
  step_id: string
  step_name: string
  step_type: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  input_data: Record<string, any>
  output_data: Record<string, any>
  error_message?: string
  started_at: string
  completed_at?: string
  duration_seconds?: number
  assigned_to?: string
  completed_by?: string
  due_date?: string
  created_at: string
}

// ============================================================================
// Workflow Builder UI Types
// ============================================================================

export interface WorkflowNode {
  id: string
  type: 'status' | 'start' | 'end'
  position: { x: number; y: number }
  data: {
    step: WorkflowStep
    isSelected?: boolean
  }
}

export interface WorkflowEdge {
  id: string
  source: string
  target: string
  type?: 'smoothstep' | 'step' | 'straight'
  animated?: boolean
  label?: string
  data?: {
    action: WorkflowAction
  }
}

export interface WorkflowBuilderState {
  workflow: Workflow | null
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  selectedNode: WorkflowNode | null
  selectedEdge: WorkflowEdge | null
  isDirty: boolean
}

// ============================================================================
// Workflow Engine Types
// ============================================================================

export interface TransitionRequest {
  entityId: string
  entityType: 'ticket' | 'service_request' | 'asset' | 'change_request'
  workflowId: string
  currentStepId: string
  actionId: string
  userId: string
  context?: Record<string, any>
}

export interface TransitionResult {
  success: boolean
  newStepId?: string
  newStatus?: string
  errors?: string[]
  validationErrors?: ValidationError[]
  executionId?: string
  logs?: ExecutionLogEntry[]
}

export interface ValidationError {
  field?: string
  validator: string
  message: string
  code?: string
}

// ============================================================================
// XML Import/Export Types
// ============================================================================

export interface WorkflowXML {
  workflow: {
    '@name': string
    '@description'?: string
    meta?: {
      '@name': string
      '@value': string
    }[]
    steps: {
      step: Array<{
        '@id': string
        '@name': string
        '@status': string
        '@category': string
        actions?: {
          action: Array<{
            '@id': string
            '@name': string
            '@view': string
            '@to': string
            conditions?: {
              condition: Array<{
                '@type': string
                '#text': string
              }>
            }
            validators?: {
              validator: Array<{
                '@type': string
                '#text'?: string
              }>
            }
            'post-functions'?: {
              function: Array<{
                '@type': string
                '#text'?: string
              }>
            }
          }>
        }
      }>
    }
  }
}

// ============================================================================
// Utility Types
// ============================================================================

export type WorkflowStatus = 'draft' | 'active' | 'archived'
export type ExecutionStatus = 'running' | 'completed' | 'failed' | 'cancelled'
export type StepExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped'

export interface WorkflowFilter {
  organizationId?: string
  status?: WorkflowStatus
  category?: string
  search?: string
  createdBy?: string
  isTemplate?: boolean
}

export interface WorkflowStats {
  totalWorkflows: number
  activeWorkflows: number
  totalExecutions: number
  successRate: number
  averageExecutionTime: number
}
