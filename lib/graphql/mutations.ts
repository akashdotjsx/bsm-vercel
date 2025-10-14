import { gql } from 'graphql-request'

// ============================================
// WORKFLOW MUTATIONS
// ============================================

export const CREATE_WORKFLOW_MUTATION = gql`
  mutation CreateWorkflow($input: workflowsInsertInput!) {
    insertIntoworkflowsCollection(objects: [$input]) {
      records {
        id
        organization_id
        name
        description
        entity_type
        status
        version
        workflow_config
        initial_status
        trigger_conditions
        tags
        created_by
        created_at
        updated_at
      }
    }
  }
`

export const UPDATE_WORKFLOW_MUTATION = gql`
  mutation UpdateWorkflow($id: UUID!, $input: workflowsUpdateInput!) {
    updateworkflowsCollection(filter: { id: { eq: $id } }, set: $input) {
      records {
        id
        organization_id
        name
        description
        entity_type
        status
        version
        workflow_config
        initial_status
        trigger_conditions
        tags
        created_by
        created_at
        updated_at
      }
    }
  }
`

export const DELETE_WORKFLOW_MUTATION = gql`
  mutation DeleteWorkflow($id: UUID!) {
    deleteFromworkflowsCollection(filter: { id: { eq: $id } }) {
      records {
        id
      }
    }
  }
`

export const CREATE_WORKFLOW_EXECUTION_MUTATION = gql`
  mutation CreateWorkflowExecution($input: workflow_executionsInsertInput!) {
    insertIntoworkflow_executionsCollection(objects: [$input]) {
      records {
        id
        workflow_id
        entity_id
        entity_type
        current_status
        status
        started_at
        completed_at
        error_message
        execution_log
        triggered_by
      }
    }
  }
`

export const UPDATE_WORKFLOW_EXECUTION_MUTATION = gql`
  mutation UpdateWorkflowExecution($id: UUID!, $input: workflow_executionsUpdateInput!) {
    updateworkflow_executionsCollection(filter: { id: { eq: $id } }, set: $input) {
      records {
        id
        workflow_id
        entity_id
        entity_type
        current_status
        status
        started_at
        completed_at
        error_message
        execution_log
        triggered_by
      }
    }
  }
`

// ============================================
// TICKET MUTATIONS
// ============================================

export const CREATE_TICKET_MUTATION = gql`
  mutation CreateTicket($input: ticketsInsertInput!) {
    insertIntoticketsCollection(objects: [$input]) {
      records {
        id
        ticket_number
        title
        description
        type
        category
        priority
        status
        organization_id
        requester_id
        created_at
      }
    }
  }
`

export const UPDATE_TICKET_MUTATION = gql`
  mutation UpdateTicket($id: UUID!, $input: ticketsUpdateInput!) {
    updateticketsCollection(filter: { id: { eq: $id } }, set: $input) {
      records {
        id
        ticket_number
        title
        description
        type
        category
        priority
        status
        assignee_id
        updated_at
      }
    }
  }
`

export const DELETE_TICKET_MUTATION = gql`
  mutation DeleteTicket($id: UUID!) {
    deleteFromticketsCollection(filter: { id: { eq: $id } }) {
      records {
        id
      }
    }
  }
`
