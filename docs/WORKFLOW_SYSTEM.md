# Workflow Management System Documentation

## Overview

The Workflow Management System provides a comprehensive solution for creating, managing, and monitoring business process workflows in the Kroolo BSM platform. It includes a visual workflow designer, execution engine, pre-built templates, and a monitoring dashboard.

## System Architecture

### Components

1. **Workflow Engine** (`lib/workflow/engine.ts`)
   - Evaluates conditions, validators, and post-functions
   - Executes transitions between workflow statuses
   - Maintains execution logs
   - Handles workflow state management

2. **Workflow Designer** (`components/workflows/workflow-designer.tsx`)
   - Visual workflow editor using React Flow
   - Drag-and-drop status nodes
   - Connect statuses with transitions
   - Edit properties inline

3. **Workflow Dashboard** (`components/workflows/workflow-dashboard.tsx`)
   - Monitor workflow executions
   - View performance metrics
   - Access workflow templates
   - Manage active workflows

4. **Workflow Templates** (`lib/workflow/templates.ts`)
   - Pre-built workflows for common scenarios
   - ITIL-compliant processes
   - Customizable templates

## Features

### 1. Visual Workflow Designer

- **Drag-and-Drop Interface**: Create workflows visually with nodes and edges
- **Status Nodes**: Define workflow statuses with categories and colors
- **Transitions**: Connect statuses with business logic
- **Properties Editor**: Edit node and edge properties in real-time
- **Save & Test**: Save workflows and test execution

### 2. Workflow Execution Engine

- **Condition Evaluation**: Check if transitions are allowed
- **Validators**: Validate data before transitions
- **Post-Functions**: Execute actions after transitions
- **Execution Logging**: Track all workflow executions
- **Error Handling**: Graceful failure handling

### 3. Pre-Built Templates

#### Available Templates:

1. **Standard Incident Workflow**
   - Entity: Incident
   - Statuses: New → Assigned → Investigating → Escalated → Resolved → Closed
   - Features: Auto-escalation, SLA tracking, notifications

2. **Standard Change Workflow**
   - Entity: Change
   - Statuses: Draft → Pending Review → Pending CAB → Approved → Scheduled → Implementing → Completed
   - Features: CAB approval, risk assessment, scheduled implementation

3. **Service Request Workflow**
   - Entity: Service Request
   - Statuses: Submitted → Pending Approval → Approved → In Progress → Completed
   - Features: Approval workflows, auto-approval, fulfillment tracking

4. **Simple Ticket Workflow**
   - Entity: Ticket
   - Statuses: Open → In Progress → Waiting Customer → Resolved → Closed
   - Features: Basic ticket lifecycle, customer waiting state

### 4. Workflow Dashboard

- **Statistics**: Total workflows, executions, success rate, alerts
- **Workflows Tab**: Manage active and draft workflows
- **Executions Tab**: Monitor execution history and status
- **Templates Tab**: Browse and use pre-built templates

## Usage

### Creating a New Workflow

```typescript
import { WorkflowDesigner } from '@/components/workflows/workflow-designer'
import { useWorkflowMutations } from '@/hooks/use-workflows'

function MyComponent() {
  const { createWorkflow } = useWorkflowMutations()

  const handleSave = async (config: WorkflowConfig) => {
    await createWorkflow({
      name: 'My Workflow',
      description: 'Custom workflow',
      entity_type: 'ticket',
      workflow_config: config,
      status: 'draft'
    })
  }

  return (
    <WorkflowDesigner
      onSave={handleSave}
      onTest={(config) => console.log('Testing:', config)}
    />
  )
}
```

### Using Workflow Templates

```typescript
import { workflowTemplates } from '@/lib/workflow/templates'

// Get a specific template
const incidentTemplate = workflowTemplates.find(t => t.id === 'template-incident-standard')

// Create workflow from template
const newWorkflow = {
  name: incidentTemplate.name,
  description: incidentTemplate.description,
  entity_type: incidentTemplate.entity_type,
  workflow_config: incidentTemplate.config,
  status: 'active'
}
```

### Executing a Workflow

```typescript
import { WorkflowEngine } from '@/lib/workflow/engine'

const engine = new WorkflowEngine()

// Execute a transition
const result = await engine.executeTransition(
  workflow,
  transition,
  {
    entity: ticket,
    user: currentUser,
    context: {
      comment: 'Starting work',
      assignee_id: currentUser.id
    }
  }
)

if (result.success) {
  console.log('Transition successful')
  console.log('New status:', result.newStatus)
} else {
  console.error('Transition failed:', result.errors)
}
```

### Monitoring Workflows

```typescript
import { WorkflowDashboard } from '@/components/workflows/workflow-dashboard'

function WorkflowPage() {
  return <WorkflowDashboard />
}
```

## Database Schema

### workflows Table

```sql
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name VARCHAR NOT NULL,
  description TEXT,
  entity_type VARCHAR NOT NULL, -- 'ticket', 'service_request', 'change', etc.
  status VARCHAR DEFAULT 'draft', -- 'draft', 'active', 'archived'
  version INTEGER DEFAULT 1,
  workflow_config JSONB NOT NULL,
  initial_status VARCHAR,
  trigger_conditions JSONB DEFAULT '[]',
  tags TEXT[],
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### workflow_executions Table

```sql
CREATE TABLE workflow_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID NOT NULL REFERENCES workflows(id),
  entity_id UUID NOT NULL,
  entity_type VARCHAR NOT NULL,
  current_status VARCHAR NOT NULL,
  status VARCHAR DEFAULT 'running', -- 'running', 'completed', 'failed'
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  error_message TEXT,
  execution_log JSONB DEFAULT '[]',
  triggered_by UUID REFERENCES profiles(id)
);
```

## GraphQL Operations

### Queries

```graphql
# Get all workflows
query GetWorkflows($filter: workflowsFilter) {
  workflowsCollection(filter: $filter) {
    edges {
      node {
        id
        name
        description
        entity_type
        status
        workflow_config
      }
    }
  }
}

# Get workflow executions
query GetWorkflowExecutions($filter: workflow_executionsFilter) {
  workflow_executionsCollection(filter: $filter) {
    edges {
      node {
        id
        workflow_id
        entity_id
        current_status
        status
        started_at
        completed_at
      }
    }
  }
}
```

### Mutations

```graphql
# Create workflow
mutation CreateWorkflow($input: workflowsInsertInput!) {
  insertIntoworkflowsCollection(objects: [$input]) {
    records {
      id
      name
    }
  }
}

# Update workflow
mutation UpdateWorkflow($id: UUID!, $input: workflowsUpdateInput!) {
  updateworkflowsCollection(filter: { id: { eq: $id } }, set: $input) {
    records {
      id
      name
      status
    }
  }
}
```

## Workflow Config Structure

```typescript
interface WorkflowConfig {
  statuses: WorkflowStatus[]
  transitions: WorkflowTransition[]
  initial_status: string
}

interface WorkflowStatus {
  id: string
  name: string
  category: 'todo' | 'in_progress' | 'done'
  color: string
}

interface WorkflowTransition {
  id: string
  name: string
  from_status: string
  to_status: string
  conditions: Condition[]
  validators: Validator[]
  post_functions: PostFunction[]
}
```

## Testing

All workflows are tested using the comprehensive test script:

```bash
npm run test:workflows
# or
node scripts/test-workflows.js
```

### Test Results

✅ All 13 tests passing:
- 4/4 CRUD operations
- 6/6 Execution engine features
- 3/3 Complex scenarios

## Best Practices

1. **Status Design**
   - Keep statuses simple and clear
   - Use consistent color coding
   - Group related statuses by category

2. **Transitions**
   - Always add conditions for restricted transitions
   - Validate required fields before transitions
   - Use post-functions for notifications and updates

3. **Conditions**
   - Keep conditions simple and testable
   - Avoid complex nested logic
   - Document condition requirements

4. **Validators**
   - Provide clear error messages
   - Validate early to fail fast
   - Check all required fields

5. **Post-Functions**
   - Keep post-functions idempotent
   - Handle errors gracefully
   - Log important actions

## Troubleshooting

### Common Issues

1. **Workflow not executing**
   - Check workflow status is 'active'
   - Verify conditions are met
   - Check validators pass

2. **Transitions not appearing**
   - Verify from_status matches current status
   - Check conditions evaluate to true
   - Ensure user has required permissions

3. **Post-functions failing**
   - Check execution logs
   - Verify field mappings
   - Ensure notification recipients exist

## Future Enhancements

- [ ] Parallel transitions
- [ ] Sub-workflows
- [ ] Scheduled transitions
- [ ] Advanced analytics
- [ ] Workflow versioning
- [ ] Workflow templates marketplace
- [ ] Integration with external systems
- [ ] Workflow simulation/testing mode

## Support

For issues or questions:
- Check the test results: `npm run test:workflows`
- Review execution logs in the dashboard
- See `lib/workflow/engine.ts` for engine details
- Reference templates in `lib/workflow/templates.ts`
