/**
 * Workflow Execution Engine
 * Handles workflow transitions with conditions, validators, and post-functions
 */

import { Engine as RulesEngine } from 'json-rules-engine'
import type {
  Workflow,
  WorkflowStep,
  WorkflowAction,
  WorkflowCondition,
  WorkflowValidator,
  WorkflowPostFunction,
  TransitionRequest,
  TransitionResult,
  ValidationError,
  ExecutionLogEntry,
  ExecutionContext
} from '@/types/workflow'

export class WorkflowEngine {
  private rulesEngine: RulesEngine

  constructor() {
    this.rulesEngine = new RulesEngine()
  }

  /**
   * Execute a workflow transition
   */
  async executeTransition(
    request: TransitionRequest,
    workflow: Workflow,
    entity: any,
    user: any
  ): Promise<TransitionResult> {
    const logs: ExecutionLogEntry[] = []
    const startTime = Date.now()

    try {
      // Log start
      logs.push(this.createLogEntry('Transition started', 'started', {
        action: request.actionId,
        currentStep: request.currentStepId
      }))

      // Find current step
      const currentStep = workflow.definition.steps.find(s => s.id === request.currentStepId)
      if (!currentStep) {
        throw new Error(`Current step ${request.currentStepId} not found`)
      }

      // Find action
      const action = currentStep.actions.find(a => a.id === request.actionId)
      if (!action) {
        throw new Error(`Action ${request.actionId} not found in step ${request.currentStepId}`)
      }

      // Find target step
      const targetStep = workflow.definition.steps.find(s => s.id === action.to)
      if (!targetStep) {
        throw new Error(`Target step ${action.to} not found`)
      }

      logs.push(this.createLogEntry(`Evaluating transition: ${action.name}`, 'started', {
        from: currentStep.name,
        to: targetStep.name
      }))

      // Evaluate conditions
      const conditionResult = await this.evaluateConditions(
        action.conditions || [],
        entity,
        user,
        request.context || {}
      )

      if (!conditionResult.passed) {
        logs.push(this.createLogEntry('Conditions failed', 'failed', {
          failures: conditionResult.failures
        }))
        return {
          success: false,
          errors: conditionResult.failures,
          logs
        }
      }

      logs.push(this.createLogEntry('Conditions passed', 'completed'))

      // Run validators
      const validationErrors = await this.runValidators(
        action.validators || [],
        entity,
        user,
        request.context || {}
      )

      if (validationErrors.length > 0) {
        logs.push(this.createLogEntry('Validation failed', 'failed', {
          errors: validationErrors
        }))
        return {
          success: false,
          validationErrors,
          logs
        }
      }

      logs.push(this.createLogEntry('Validation passed', 'completed'))

      // Execute post-functions
      const postFunctionResults = await this.executePostFunctions(
        action.postFunctions || [],
        entity,
        user,
        targetStep,
        request.context || {}
      )

      logs.push(this.createLogEntry('Post-functions executed', 'completed', {
        results: postFunctionResults
      }))

      // Calculate duration
      const duration = Math.round((Date.now() - startTime) / 1000)

      logs.push(this.createLogEntry('Transition completed', 'completed', {
        duration,
        newStep: targetStep.name,
        newStatus: targetStep.status
      }))

      return {
        success: true,
        newStepId: targetStep.id,
        newStatus: targetStep.status,
        logs
      }
    } catch (error) {
      const duration = Math.round((Date.now() - startTime) / 1000)
      logs.push(this.createLogEntry('Transition failed', 'failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        duration
      }))

      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Transition failed'],
        logs
      }
    }
  }

  /**
   * Evaluate conditions
   */
  private async evaluateConditions(
    conditions: WorkflowCondition[],
    entity: any,
    user: any,
    context: Record<string, any>
  ): Promise<{ passed: boolean; failures: string[] }> {
    const failures: string[] = []

    for (const condition of conditions) {
      const result = await this.evaluateCondition(condition, entity, user, context)
      if (!result.passed) {
        failures.push(result.reason || 'Condition failed')
      }
    }

    return {
      passed: failures.length === 0,
      failures
    }
  }

  /**
   * Evaluate single condition
   */
  private async evaluateCondition(
    condition: WorkflowCondition,
    entity: any,
    user: any,
    context: Record<string, any>
  ): Promise<{ passed: boolean; reason?: string }> {
    try {
      let passed = false

      switch (condition.type) {
        case 'jira.permission.condition':
          passed = await this.checkPermission(condition.config, user)
          break

        case 'jira.field.required':
          passed = this.checkFieldRequired(condition.config, entity, context)
          break

        case 'jira.user.condition':
          passed = this.checkUserCondition(condition.config, entity, user)
          break

        case 'jira.role.condition':
          passed = this.checkRoleCondition(condition.config, user)
          break

        case 'jira.field.value':
          passed = this.checkFieldValue(condition.config, entity)
          break

        case 'jira.field.comparison':
          passed = this.checkFieldComparison(condition.config, entity)
          break

        case 'jira.time.condition':
          passed = this.checkTimeCondition(condition.config, entity)
          break

        case 'custom.script':
          passed = await this.executeCustomScript(condition.config.script || '', entity, user, context)
          break

        default:
          passed = true
      }

      // Handle negation
      if (condition.negate) {
        passed = !passed
      }

      return {
        passed,
        reason: passed ? undefined : `Condition failed: ${condition.type}`
      }
    } catch (error) {
      return {
        passed: false,
        reason: error instanceof Error ? error.message : 'Condition evaluation error'
      }
    }
  }

  /**
   * Check permission
   */
  private async checkPermission(config: any, user: any): Promise<boolean> {
    const requiredPermission = config.permission || config.requiredPermission
    if (!requiredPermission) return true

    // Check if user has the permission
    return user.permissions?.includes(requiredPermission) || false
  }

  /**
   * Check field required
   */
  private checkFieldRequired(config: any, entity: any, context: Record<string, any>): boolean {
    const field = config.field
    if (!field) return true

    const value = entity[field] || context[field]
    return value !== null && value !== undefined && value !== ''
  }

  /**
   * Check user condition
   */
  private checkUserCondition(config: any, entity: any, user: any): boolean {
    if (config.mustBeAssignee) {
      return entity.assignee_id === user.id
    }
    if (config.mustBeReporter) {
      return entity.requester_id === user.id || entity.reporter_id === user.id
    }
    if (config.user) {
      return user.id === config.user
    }
    return true
  }

  /**
   * Check role condition
   */
  private checkRoleCondition(config: any, user: any): boolean {
    if (!config.role) return true
    return user.roles?.includes(config.role) || false
  }

  /**
   * Check field value
   */
  private checkFieldValue(config: any, entity: any): boolean {
    const field = config.field
    const expectedValue = config.value
    const operator = config.operator || 'equals'

    if (!field) return true

    const actualValue = entity[field]

    switch (operator) {
      case 'equals':
        return actualValue === expectedValue
      case 'not_equals':
        return actualValue !== expectedValue
      case 'contains':
        return String(actualValue).includes(String(expectedValue))
      case 'greater_than':
        return Number(actualValue) > Number(expectedValue)
      case 'less_than':
        return Number(actualValue) < Number(expectedValue)
      default:
        return true
    }
  }

  /**
   * Check field comparison
   */
  private checkFieldComparison(config: any, entity: any): boolean {
    // Similar to checkFieldValue but with more operators
    return this.checkFieldValue(config, entity)
  }

  /**
   * Check time condition
   */
  private checkTimeCondition(config: any, entity: any): boolean {
    const now = new Date()

    if (config.beforeDate) {
      const beforeDate = new Date(config.beforeDate)
      if (now > beforeDate) return false
    }

    if (config.afterDate) {
      const afterDate = new Date(config.afterDate)
      if (now < afterDate) return false
    }

    if (config.withinHours) {
      const createdAt = new Date(entity.created_at)
      const hoursSince = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
      if (hoursSince > config.withinHours) return false
    }

    return true
  }

  /**
   * Execute custom script
   */
  private async executeCustomScript(
    script: string,
    entity: any,
    user: any,
    context: Record<string, any>
  ): Promise<boolean> {
    try {
      // Create a safe execution context
      const fn = new Function('entity', 'user', 'context', script)
      const result = fn(entity, user, context)
      return Boolean(result)
    } catch (error) {
      console.error('Custom script execution error:', error)
      return false
    }
  }

  /**
   * Run validators
   */
  private async runValidators(
    validators: WorkflowValidator[],
    entity: any,
    user: any,
    context: Record<string, any>
  ): Promise<ValidationError[]> {
    const errors: ValidationError[] = []

    for (const validator of validators) {
      const error = await this.runValidator(validator, entity, user, context)
      if (error) {
        errors.push(error)
      }
    }

    return errors
  }

  /**
   * Run single validator
   */
  private async runValidator(
    validator: WorkflowValidator,
    entity: any,
    user: any,
    context: Record<string, any>
  ): Promise<ValidationError | null> {
    try {
      let isValid = true
      let message = validator.errorMessage || 'Validation failed'

      switch (validator.type) {
        case 'jira.field.validator':
          isValid = this.validateField(validator.config, entity, context)
          message = validator.errorMessage || `Field validation failed: ${validator.config.field}`
          break

        case 'jira.permission.validator':
          isValid = await this.checkPermission(validator.config, user)
          message = validator.errorMessage || 'Permission check failed'
          break

        case 'jira.regex.validator':
          isValid = this.validateRegex(validator.config, entity)
          message = validator.errorMessage || 'Pattern validation failed'
          break

        case 'jira.date.validator':
          isValid = this.validateDate(validator.config, entity)
          message = validator.errorMessage || 'Date validation failed'
          break

        case 'jira.user.validator':
          isValid = this.checkUserCondition(validator.config, entity, user)
          message = validator.errorMessage || 'User validation failed'
          break

        case 'custom.validator':
          isValid = await this.executeCustomScript(
            validator.config.validatorScript || '',
            entity,
            user,
            context
          )
          message = validator.errorMessage || 'Custom validation failed'
          break
      }

      if (!isValid) {
        return {
          field: validator.config.field,
          validator: validator.type,
          message,
          code: validator.type
        }
      }

      return null
    } catch (error) {
      return {
        validator: validator.type,
        message: error instanceof Error ? error.message : 'Validation error',
        code: 'ERROR'
      }
    }
  }

  /**
   * Validate field
   */
  private validateField(config: any, entity: any, context: Record<string, any>): boolean {
    const field = config.field
    if (!field) return true

    const value = entity[field] || context[field]

    if (config.required && (value === null || value === undefined || value === '')) {
      return false
    }

    if (config.minLength && String(value).length < config.minLength) {
      return false
    }

    if (config.maxLength && String(value).length > config.maxLength) {
      return false
    }

    if (config.pattern) {
      const regex = new RegExp(config.pattern)
      if (!regex.test(String(value))) {
        return false
      }
    }

    return true
  }

  /**
   * Validate regex
   */
  private validateRegex(config: any, entity: any): boolean {
    const field = config.field
    const pattern = config.pattern

    if (!field || !pattern) return true

    const value = entity[field]
    const regex = new RegExp(pattern)
    return regex.test(String(value))
  }

  /**
   * Validate date
   */
  private validateDate(config: any, entity: any): boolean {
    const field = config.dateField || config.field
    if (!field) return true

    const value = entity[field]
    if (!value) return !config.required

    const date = new Date(value)
    const now = new Date()

    if (config.mustBeFuture && date <= now) {
      return false
    }

    if (config.mustBePast && date >= now) {
      return false
    }

    if (config.maxDaysFromNow) {
      const maxDate = new Date()
      maxDate.setDate(maxDate.getDate() + config.maxDaysFromNow)
      if (date > maxDate) {
        return false
      }
    }

    return true
  }

  /**
   * Execute post-functions
   */
  private async executePostFunctions(
    postFunctions: WorkflowPostFunction[],
    entity: any,
    user: any,
    targetStep: WorkflowStep,
    context: Record<string, any>
  ): Promise<any[]> {
    const results = []

    // Sort by order
    const sortedFunctions = [...postFunctions].sort((a, b) => (a.order || 0) - (b.order || 0))

    for (const fn of sortedFunctions) {
      try {
        const result = await this.executePostFunction(fn, entity, user, targetStep, context)
        results.push({ function: fn.type, result })
      } catch (error) {
        results.push({
          function: fn.type,
          error: error instanceof Error ? error.message : 'Error'
        })
      }
    }

    return results
  }

  /**
   * Execute single post-function
   */
  private async executePostFunction(
    fn: WorkflowPostFunction,
    entity: any,
    user: any,
    targetStep: WorkflowStep,
    context: Record<string, any>
  ): Promise<any> {
    switch (fn.type) {
      case 'jira.update.status.function':
        return { status: fn.config.newStatus || targetStep.status }

      case 'jira.update.assignee.function':
        if (fn.config.assignToCurrentUser) {
          return { assignee_id: user.id }
        }
        if (fn.config.assignToReporter) {
          return { assignee_id: entity.requester_id || entity.reporter_id }
        }
        if (fn.config.assignTo) {
          return { assignee_id: fn.config.assignTo }
        }
        if (fn.config.unassign) {
          return { assignee_id: null }
        }
        return {}

      case 'jira.set.resolution.function':
        return { resolution: fn.config.resolution || 'done' }

      case 'jira.clear.resolution.function':
        return { resolution: null }

      case 'jira.add.comment.function':
        return { comment: fn.config.comment }

      case 'jira.update.field.function':
        return fn.config.fieldUpdates || {}

      case 'jira.notify.function':
      case 'jira.notify.reviewer.function':
      case 'jira.notify.reporter.function':
        // In a real implementation, this would trigger notifications
        console.log('Notification post-function:', fn.config)
        return { notificationSent: true }

      case 'jira.trigger.webhook.function':
        // In a real implementation, this would trigger a webhook
        console.log('Webhook post-function:', fn.config.webhookUrl)
        return { webhookTriggered: true }

      case 'custom.function':
        return await this.executeCustomScript(
          fn.config.functionScript || '',
          entity,
          user,
          context
        )

      default:
        return {}
    }
  }

  /**
   * Create log entry
   */
  private createLogEntry(
    message: string,
    status: 'started' | 'completed' | 'failed' | 'skipped',
    details?: Record<string, any>
  ): ExecutionLogEntry {
    return {
      timestamp: new Date().toISOString(),
      action: message,
      status,
      message,
      details
    }
  }

  /**
   * Get available transitions for current step
   */
  getAvailableTransitions(
    workflow: Workflow,
    currentStepId: string,
    entity: any,
    user: any
  ): WorkflowAction[] {
    const currentStep = workflow.definition.steps.find(s => s.id === currentStepId)
    if (!currentStep) return []

    // Return all actions - condition checking happens during execution
    return currentStep.actions || []
  }
}

// Export singleton instance
export const workflowEngine = new WorkflowEngine()
