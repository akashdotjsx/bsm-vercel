/**
 * Jira Workflow XML Parser
 * Converts Jira workflow exports to Kroolo workflow format
 */

import { WorkflowConfig, WorkflowStatus, WorkflowTransition } from '@/lib/types/workflow'

interface JiraWorkflowMeta {
  name: string
  description?: string
  version?: string
  category?: string
}

interface JiraStep {
  id: string
  name: string
  status: string
  category: string
  actions: JiraAction[]
}

interface JiraAction {
  id: string
  name: string
  view?: string
  to: string
  from: string
  conditions?: JiraCondition[]
  validators?: JiraValidator[]
  postFunctions?: JiraPostFunction[]
}

interface JiraCondition {
  type: string
  value?: string
}

interface JiraValidator {
  type: string
  value?: string
}

interface JiraPostFunction {
  type: string
  value?: string
}

/**
 * Parse Jira workflow XML and convert to WorkflowConfig
 */
export function parseJiraWorkflowXML(xmlContent: string): {
  meta: JiraWorkflowMeta
  config: WorkflowConfig
} {
  // For now, we'll parse the tabular format you provided
  // In a real implementation, you'd use an XML parser like 'fast-xml-parser'
  
  const lines = xmlContent.split('\n').filter(line => line.trim())
  const meta: JiraWorkflowMeta = {
    name: 'Imported Workflow',
    description: '',
    version: '1.0.0',
    category: 'General'
  }

  const stepsMap = new Map<string, JiraStep>()
  const transitionsMap = new Map<string, JiraAction>()

  // Parse meta information
  for (const line of lines) {
    if (line.includes('<workflow name=')) {
      const nameMatch = line.match(/name="([^"]+)"/)
      if (nameMatch) meta.name = nameMatch[1]
      
      const descMatch = line.match(/description="([^"]+)"/)
      if (descMatch) meta.description = descMatch[1]
    }
    
    if (line.includes('<meta name="jira.description">')) {
      const descMatch = line.match(/>([^<]+)</)
      if (descMatch) meta.description = descMatch[1]
    }
    
    if (line.includes('<meta name="jira.version">')) {
      const versionMatch = line.match(/>([^<]+)</)
      if (versionMatch) meta.version = versionMatch[1]
    }
    
    if (line.includes('<meta name="jira.category">')) {
      const categoryMatch = line.match(/>([^<]+)</)
      if (categoryMatch) meta.category = categoryMatch[1]
    }
  }

  // Parse tabular data (your format)
  const dataLines = lines.filter(line => {
    const parts = line.split('\t')
    return parts.length >= 9 && !line.includes('<') && parts[0] && parts[1]
  })

  for (const line of dataLines) {
    const parts = line.split('\t').map(p => p.trim())
    if (parts.length < 9) continue

    const [workflowName, stepId, statusName, category, transitionId, transitionName, fromStatus, toStatus, condition] = parts

    // Skip header row
    if (stepId === 'Step ID') continue

    // Create step if not exists
    if (!stepsMap.has(stepId)) {
      stepsMap.set(stepId, {
        id: stepId,
        name: statusName,
        status: statusName.toLowerCase().replace(/\s+/g, '_'),
        category: mapJiraCategory(category),
        actions: []
      })
    }

    // Create transition if has transition data
    if (transitionId && transitionName && fromStatus && toStatus) {
      const transitionKey = `${transitionId}-${fromStatus}-${toStatus}`
      
      if (!transitionsMap.has(transitionKey)) {
        transitionsMap.set(transitionKey, {
          id: transitionId,
          name: transitionName,
          view: 'transition',
          to: toStatus,
          from: fromStatus,
          conditions: condition ? [parseCondition(condition)] : [],
          validators: [],
          postFunctions: []
        })
      }
    }
  }

  // Convert to WorkflowConfig
  const statuses: WorkflowStatus[] = Array.from(stepsMap.values()).map(step => ({
    id: step.status,
    name: step.name,
    category: step.category as any,
    color: getCategoryColor(step.category)
  }))

  const transitions: WorkflowTransition[] = Array.from(transitionsMap.values()).map(action => {
    const fromStatus = statuses.find(s => s.name === action.from)?.id || action.from.toLowerCase().replace(/\s+/g, '_')
    const toStatus = statuses.find(s => s.name === action.to)?.id || action.to.toLowerCase().replace(/\s+/g, '_')

    return {
      id: action.id,
      name: action.name,
      from_status: fromStatus,
      to_status: toStatus,
      conditions: action.conditions?.map(c => ({
        type: c.type,
        config: { condition: c.value || c.type }
      })) || [],
      validators: action.validators?.map(v => ({
        type: v.type,
        config: { validator: v.value || v.type },
        message: `Validation failed: ${v.value || v.type}`
      })) || [],
      post_functions: action.postFunctions?.map((pf, index) => ({
        type: pf.type,
        config: { value: pf.value || pf.type },
        order: index + 1
      })) || []
    }
  })

  const config: WorkflowConfig = {
    statuses,
    transitions,
    initial_status: statuses[0]?.id || 'to_do'
  }

  return { meta, config }
}

/**
 * Parse Jira XML using DOM parser (for actual XML format)
 */
export function parseJiraWorkflowXMLDom(xmlString: string): {
  meta: JiraWorkflowMeta
  config: WorkflowConfig
} {
  const parser = new DOMParser()
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml')

  const meta: JiraWorkflowMeta = {
    name: xmlDoc.querySelector('workflow')?.getAttribute('name') || 'Imported Workflow',
    description: xmlDoc.querySelector('workflow')?.getAttribute('description') || '',
    version: xmlDoc.querySelector('meta[name="jira.version"]')?.textContent || '1.0.0',
    category: xmlDoc.querySelector('meta[name="jira.category"]')?.textContent || 'General'
  }

  const steps: JiraStep[] = []
  const stepElements = xmlDoc.querySelectorAll('step')

  stepElements.forEach(stepEl => {
    const step: JiraStep = {
      id: stepEl.getAttribute('id') || '',
      name: stepEl.getAttribute('name') || '',
      status: stepEl.getAttribute('status') || '',
      category: stepEl.getAttribute('category') || '',
      actions: []
    }

    const actionElements = stepEl.querySelectorAll('action')
    actionElements.forEach(actionEl => {
      const action: JiraAction = {
        id: actionEl.getAttribute('id') || '',
        name: actionEl.getAttribute('name') || '',
        view: actionEl.getAttribute('view') || '',
        to: actionEl.getAttribute('to') || '',
        from: step.id,
        conditions: [],
        validators: [],
        postFunctions: []
      }

      // Parse conditions
      actionEl.querySelectorAll('condition').forEach(condEl => {
        action.conditions?.push({
          type: condEl.getAttribute('type') || '',
          value: condEl.textContent || ''
        })
      })

      // Parse validators
      actionEl.querySelectorAll('validator').forEach(valEl => {
        action.validators?.push({
          type: valEl.getAttribute('type') || '',
          value: valEl.textContent || ''
        })
      })

      // Parse post-functions
      actionEl.querySelectorAll('function').forEach(funcEl => {
        action.postFunctions?.push({
          type: funcEl.getAttribute('type') || '',
          value: funcEl.textContent || ''
        })
      })

      step.actions.push(action)
    })

    steps.push(step)
  })

  // Convert to WorkflowConfig
  const statuses: WorkflowStatus[] = steps.map(step => ({
    id: step.status.toLowerCase().replace(/\s+/g, '_'),
    name: step.name,
    category: mapJiraCategory(step.category) as any,
    color: getCategoryColor(mapJiraCategory(step.category))
  }))

  const transitions: WorkflowTransition[] = []
  steps.forEach(step => {
    step.actions.forEach(action => {
      const fromStatus = step.status.toLowerCase().replace(/\s+/g, '_')
      const toStep = steps.find(s => s.id === action.to)
      const toStatus = toStep?.status.toLowerCase().replace(/\s+/g, '_') || action.to

      transitions.push({
        id: action.id,
        name: action.name,
        from_status: fromStatus,
        to_status: toStatus,
        conditions: action.conditions?.map(c => ({
          type: mapConditionType(c.type),
          config: parseConditionConfig(c)
        })) || [],
        validators: action.validators?.map(v => ({
          type: mapValidatorType(v.type),
          config: parseValidatorConfig(v),
          message: `Validation failed: ${v.value || v.type}`
        })) || [],
        post_functions: action.postFunctions?.map((pf, index) => ({
          type: mapPostFunctionType(pf.type),
          config: parsePostFunctionConfig(pf),
          order: index + 1
        })) || []
      })
    })
  })

  const config: WorkflowConfig = {
    statuses,
    transitions,
    initial_status: statuses[0]?.id || 'to_do'
  }

  return { meta, config }
}

/**
 * Helper functions
 */

function mapJiraCategory(jiraCategory: string): string {
  const categoryMap: Record<string, string> = {
    'New': 'todo',
    'In Progress': 'in_progress',
    'Review': 'in_progress',
    'Complete': 'done',
    'Done': 'done',
    'Resolved': 'done',
    'Closed': 'done'
  }
  
  return categoryMap[jiraCategory] || 'in_progress'
}

function getCategoryColor(category: string): string {
  const colorMap: Record<string, string> = {
    'todo': '#6B7280',
    'in_progress': '#3B82F6',
    'done': '#10B981'
  }
  
  return colorMap[category] || '#3B82F6'
}

function parseCondition(conditionText: string): JiraCondition {
  return {
    type: conditionText.toLowerCase().replace(/\s+/g, '_'),
    value: conditionText
  }
}

function mapConditionType(jiraType: string): string {
  const typeMap: Record<string, string> = {
    'jira.permission.condition': 'permission',
    'jira.field.required': 'required_field',
    'jira.user.condition': 'user_condition',
    'jira.role.condition': 'role_condition'
  }
  
  return typeMap[jiraType] || 'custom'
}

function mapValidatorType(jiraType: string): string {
  const typeMap: Record<string, string> = {
    'jira.field.validator': 'field_validator',
    'jira.permission.validator': 'permission_validator',
    'jira.regex.validator': 'regex_validator'
  }
  
  return typeMap[jiraType] || 'custom'
}

function mapPostFunctionType(jiraType: string): string {
  const typeMap: Record<string, string> = {
    'jira.update.status.function': 'update_status',
    'jira.update.assignee.function': 'update_assignee',
    'jira.notify.reviewer.function': 'notification',
    'jira.notify.reporter.function': 'notification',
    'jira.set.resolution.function': 'set_resolution',
    'jira.add.comment.function': 'auto_comment',
    'jira.clear.resolution.function': 'clear_resolution'
  }
  
  return typeMap[jiraType] || 'custom'
}

function parseConditionConfig(condition: JiraCondition): any {
  return {
    type: condition.type,
    value: condition.value
  }
}

function parseValidatorConfig(validator: JiraValidator): any {
  return {
    type: validator.type,
    value: validator.value
  }
}

function parsePostFunctionConfig(postFunction: JiraPostFunction): any {
  const config: any = {}
  
  if (postFunction.type.includes('notify')) {
    config.notify = true
    config.template = postFunction.value
  } else if (postFunction.type.includes('resolution')) {
    config.resolution = postFunction.value || 'done'
  } else if (postFunction.type.includes('comment')) {
    config.comment = postFunction.value
  } else if (postFunction.type.includes('assignee')) {
    config.assignToCurrentUser = true
  }
  
  return config
}

/**
 * Export workflow to Jira XML format
 */
export function exportToJiraXML(
  workflowName: string,
  description: string,
  config: WorkflowConfig
): string {
  const xml: string[] = []
  
  xml.push(`<?xml version="1.0" encoding="UTF-8"?>`)
  xml.push(`<workflow name="${workflowName}" description="${description}">`)
  xml.push(`  <meta name="jira.description">${description}</meta>`)
  xml.push(`  <meta name="jira.version">1.0.0</meta>`)
  xml.push(`  <steps>`)
  
  config.statuses.forEach((status, index) => {
    xml.push(`    <step id="${index + 1}" name="${status.name}" status="${status.name}" category="${status.category}">`)
    xml.push(`      <actions>`)
    
    // Find transitions from this status
    const transitions = config.transitions.filter(t => t.from_status === status.id)
    
    transitions.forEach(transition => {
      const toStatus = config.statuses.find(s => s.id === transition.to_status)
      const toStepId = config.statuses.findIndex(s => s.id === transition.to_status) + 1
      
      xml.push(`        <action id="${transition.id}" name="${transition.name}" view="transition" to="${toStepId}">`)
      
      if (transition.conditions && transition.conditions.length > 0) {
        xml.push(`          <conditions>`)
        transition.conditions.forEach(condition => {
          xml.push(`            <condition type="${condition.type}">${JSON.stringify(condition.config)}</condition>`)
        })
        xml.push(`          </conditions>`)
      }
      
      if (transition.validators && transition.validators.length > 0) {
        xml.push(`          <validators>`)
        transition.validators.forEach(validator => {
          xml.push(`            <validator type="${validator.type}">${validator.message}</validator>`)
        })
        xml.push(`          </validators>`)
      }
      
      if (transition.post_functions && transition.post_functions.length > 0) {
        xml.push(`          <post-functions>`)
        transition.post_functions.forEach(postFunc => {
          xml.push(`            <function type="${postFunc.type}">${JSON.stringify(postFunc.config)}</function>`)
        })
        xml.push(`          </post-functions>`)
      }
      
      xml.push(`        </action>`)
    })
    
    xml.push(`      </actions>`)
    xml.push(`    </step>`)
  })
  
  xml.push(`  </steps>`)
  xml.push(`</workflow>`)
  
  return xml.join('\n')
}
