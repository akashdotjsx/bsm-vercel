# Jira Workflow Import Guide

## Overview

You can now import existing Jira workflows into Kroolo using the **Workflow Import Dialog**. This feature supports both XML and tabular (mixed) formats exported from Jira.

## Supported Formats

### 1. Tabular Format (Mixed XML + Tab-Separated)

This format includes XML metadata at the top followed by tab-separated workflow data:

```
<workflow name="Default Service Workflow" description="Sample Jira Workflow Export">
<meta name="jira.description">Sample workflow for demonstration</meta>
<meta name="jira.version">10.0.0</meta>
<meta name="jira.category">Service Management</meta>

Default Service Workflow	1	To Do	New	10	Start Progress	To Do	In Progress	User Assigned
Default Service Workflow	2	In Progress	In Progress	11	Send for Review	In Progress	In Review	Comment Required
Default Service Workflow	3	In Review	Review	12	Approve	In Review	Done	Approver Required
Default Service Workflow	4	Done	Complete	14	Reopen	Done	To Do	Can Reopen
```

**Column Order:**
1. Workflow Name
2. Step ID
3. Status Name
4. Category
5. Transition ID
6. Transition Name
7. From Status
8. To Status
9. Condition

### 2. Pure XML Format

Standard Jira workflow XML export:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<workflow name="Default Service Workflow" description="Sample Jira Workflow Export">
  <meta name="jira.description">Sample workflow for demonstration</meta>
  <meta name="jira.version">10.0.0</meta>
  <meta name="jira.category">Service Management</meta>
  <steps>
    <step id="1" name="To Do" status="To Do" category="New">
      <actions>
        <action id="10" name="Start Progress" view="transition" to="2">
          <conditions>
            <condition type="jira.permission.condition">user_assigned</condition>
          </conditions>
          <validators>
            <validator type="jira.field.validator"/>
          </validators>
          <post-functions>
            <function type="jira.update.status.function"/>
            <function type="jira.update.assignee.function"/>
          </post-functions>
        </action>
      </actions>
    </step>
    <!-- More steps... -->
  </steps>
</workflow>
```

## How to Import

### Using the UI

1. **Open Workflow Dashboard**
   - Navigate to Workflows page
   - Click the "Import Workflow" button

2. **Select Import Format**
   - Choose "Tabular Format" for mixed XML + table format
   - Choose "XML Format" for pure XML exports

3. **Provide Workflow Content**
   - Paste your Jira workflow export, or
   - Upload a file (.xml or .txt)

4. **Select Entity Type**
   - Choose the entity type (Ticket, Service Request, Incident, Change, Asset)
   - This determines where the workflow will be applied

5. **Import**
   - Click "Import Workflow"
   - The workflow will be created in "draft" status
   - Review and activate when ready

### Programmatic Import

```typescript
import { parseJiraWorkflowXML, parseJiraWorkflowXMLDom } from '@/lib/workflow/jira-parser'
import { useWorkflowMutations } from '@/hooks/use-workflows'

// For tabular format
const { meta, config } = parseJiraWorkflowXML(tabularContent)

// For XML format
const { meta, config } = parseJiraWorkflowXMLDom(xmlContent)

// Create workflow
const { createWorkflow } = useWorkflowMutations()
await createWorkflow({
  name: meta.name,
  description: meta.description,
  entity_type: 'ticket',
  workflow_config: config,
  status: 'draft'
})
```

## Field Mapping

### Jira to Kroolo Category Mapping

| Jira Category | Kroolo Category |
|--------------|----------------|
| New          | todo           |
| In Progress  | in_progress    |
| Review       | in_progress    |
| Complete     | done           |
| Done         | done           |
| Resolved     | done           |
| Closed       | done           |

### Condition Type Mapping

| Jira Condition | Kroolo Type |
|---------------|-------------|
| jira.permission.condition | permission |
| jira.field.required | required_field |
| jira.user.condition | user_condition |
| jira.role.condition | role_condition |

### Validator Type Mapping

| Jira Validator | Kroolo Type |
|---------------|-------------|
| jira.field.validator | field_validator |
| jira.permission.validator | permission_validator |
| jira.regex.validator | regex_validator |

### Post-Function Type Mapping

| Jira Post-Function | Kroolo Type |
|-------------------|-------------|
| jira.update.status.function | update_status |
| jira.update.assignee.function | update_assignee |
| jira.notify.reviewer.function | notification |
| jira.notify.reporter.function | notification |
| jira.set.resolution.function | set_resolution |
| jira.add.comment.function | auto_comment |
| jira.clear.resolution.function | clear_resolution |

## Example: Complete Import Flow

```typescript
// Your Jira export
const jiraExport = `<workflow name="Support Ticket Workflow" description="Customer support workflow">
<meta name="jira.description">Handle customer support tickets</meta>
<meta name="jira.version">2.0.0</meta>
<meta name="jira.category">Support</meta>

Support Ticket Workflow	1	Open	New	10	Start Work	Open	In Progress	Agent Assigned
Support Ticket Workflow	2	In Progress	In Progress	11	Resolve	In Progress	Resolved	Solution Provided
Support Ticket Workflow	3	Resolved	Complete	12	Close	Resolved	Closed	Verified
Support Ticket Workflow	3	Resolved	Complete	13	Reopen	Resolved	Open	Issue Persists
`

// Import using the parser
import { parseJiraWorkflowXML } from '@/lib/workflow/jira-parser'

const { meta, config } = parseJiraWorkflowXML(jiraExport)

console.log('Workflow:', meta.name)
console.log('Statuses:', config.statuses.length)
console.log('Transitions:', config.transitions.length)

// Result:
// Workflow: Support Ticket Workflow
// Statuses: 3
// Transitions: 4
```

## Tips & Best Practices

1. **Review Before Activating**
   - Imported workflows are created in "draft" status
   - Review the workflow in the visual designer
   - Verify all transitions and conditions
   - Activate only when ready

2. **Check Field Mappings**
   - Some Jira-specific fields may not map directly
   - Review and update conditions/validators as needed
   - Test the workflow thoroughly

3. **Entity Type Selection**
   - Choose the appropriate entity type for your workflow
   - Different entity types may have different available fields
   - You can always modify the workflow later

4. **Handle Complex Workflows**
   - Very complex workflows may need manual adjustments
   - Break down into smaller workflows if needed
   - Use workflow templates as reference

5. **Migration Strategy**
   - Import all workflows first
   - Test each workflow individually
   - Activate workflows gradually
   - Monitor execution logs

## Exporting Back to Jira

You can also export Kroolo workflows back to Jira XML format:

```typescript
import { exportToJiraXML } from '@/lib/workflow/jira-parser'

const xml = exportToJiraXML(
  'My Workflow',
  'Workflow description',
  workflowConfig
)

// xml contains valid Jira workflow XML
console.log(xml)
```

## Troubleshooting

### Import Fails

**Problem**: Import error "Failed to parse workflow"

**Solutions**:
- Verify the format matches expected structure
- Check for missing required fields
- Try the other import format (XML vs Tabular)
- Remove any special characters from workflow names

### Missing Transitions

**Problem**: Some transitions don't appear after import

**Solutions**:
- Check the source data has all transitions
- Verify tab-separated format (not spaces)
- Ensure From/To status names match exactly
- Check for duplicate transition IDs

### Conditions Not Working

**Problem**: Workflow conditions not evaluating correctly

**Solutions**:
- Review the condition type mapping
- Update condition configuration in the designer
- Test with sample data
- Check permission settings

## Support

For issues or questions:
- Review the parser code: `lib/workflow/jira-parser.ts`
- Check the import dialog: `components/workflows/workflow-import-dialog.tsx`
- Test with sample workflows first
- Refer to Jira export documentation
