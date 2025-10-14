import { useState, useCallback } from 'react'
import { useGraphQL, useGraphQLMutation } from './use-graphql'
import {
  GET_WORKFLOWS_QUERY,
  GET_WORKFLOW_BY_ID_QUERY,
  GET_WORKFLOW_EXECUTIONS_QUERY,
  GET_WORKFLOW_EXECUTION_BY_ID_QUERY
} from '@/lib/graphql/queries'
import {
  CREATE_WORKFLOW_MUTATION,
  UPDATE_WORKFLOW_MUTATION,
  DELETE_WORKFLOW_MUTATION,
  CREATE_WORKFLOW_EXECUTION_MUTATION,
  UPDATE_WORKFLOW_EXECUTION_MUTATION
} from '@/lib/graphql/mutations'
import { Workflow, WorkflowExecution, WorkflowConfig } from '@/lib/types/workflow'

interface UseWorkflowsOptions {
  organizationId?: string
  entityType?: string
  status?: string
  limit?: number
  offset?: number
}

export function useWorkflows(options: UseWorkflowsOptions = {}) {
  const { organizationId, entityType, status, limit = 50, offset = 0 } = options

  const filter: any = {}
  if (organizationId) filter.organization_id = { eq: organizationId }
  if (entityType) filter.entity_type = { eq: entityType }
  if (status) filter.status = { eq: status }

  const { data, loading, error, refetch } = useGraphQL<{
    workflowsCollection: {
      edges: Array<{ node: Workflow }>
      pageInfo: { hasNextPage: boolean; hasPreviousPage: boolean }
    }
  }>(
    GET_WORKFLOWS_QUERY,
    {
      filter: Object.keys(filter).length > 0 ? filter : undefined,
      orderBy: [{ created_at: 'DescNullsLast' }],
      first: limit,
      offset
    }
  )

  const workflows = data?.workflowsCollection?.edges?.map(edge => edge.node) || []
  const pageInfo = data?.workflowsCollection?.pageInfo

  return {
    workflows,
    pageInfo,
    loading,
    error,
    refetch
  }
}

export function useWorkflow(id?: string) {
  const { data, loading, error, refetch } = useGraphQL<{
    workflowsCollection: {
      edges: Array<{ node: Workflow }>
    }
  }>(
    GET_WORKFLOW_BY_ID_QUERY,
    { id },
    { enabled: !!id }
  )

  const workflow = data?.workflowsCollection?.edges?.[0]?.node

  return {
    workflow,
    loading,
    error,
    refetch
  }
}

export function useWorkflowExecutions(options: {
  workflowId?: string
  entityId?: string
  status?: string
  limit?: number
  offset?: number
} = {}) {
  const { workflowId, entityId, status, limit = 50, offset = 0 } = options

  const filter: any = {}
  if (workflowId) filter.workflow_id = { eq: workflowId }
  if (entityId) filter.entity_id = { eq: entityId }
  if (status) filter.status = { eq: status }

  const { data, loading, error, refetch } = useGraphQL<{
    workflow_executionsCollection: {
      edges: Array<{ node: WorkflowExecution }>
      pageInfo: { hasNextPage: boolean; hasPreviousPage: boolean }
    }
  }>(
    GET_WORKFLOW_EXECUTIONS_QUERY,
    {
      filter: Object.keys(filter).length > 0 ? filter : undefined,
      orderBy: [{ started_at: 'DescNullsLast' }],
      first: limit,
      offset
    }
  )

  const executions = data?.workflow_executionsCollection?.edges?.map(edge => edge.node) || []
  const pageInfo = data?.workflow_executionsCollection?.pageInfo

  return {
    executions,
    pageInfo,
    loading,
    error,
    refetch
  }
}

export function useWorkflowExecution(id?: string) {
  const { data, loading, error, refetch } = useGraphQL<{
    workflow_executionsCollection: {
      edges: Array<{ node: WorkflowExecution }>
    }
  }>(
    GET_WORKFLOW_EXECUTION_BY_ID_QUERY,
    { id },
    { enabled: !!id }
  )

  const execution = data?.workflow_executionsCollection?.edges?.[0]?.node

  return {
    execution,
    loading,
    error,
    refetch
  }
}

export function useWorkflowMutations() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const createWorkflow = useCallback(async (input: Partial<Workflow>) => {
    setLoading(true)
    setError(null)
    try {
      const result = await useGraphQLMutation(CREATE_WORKFLOW_MUTATION, { input })
      setLoading(false)
      return result.insertIntoworkflowsCollection.records[0]
    } catch (err) {
      setError(err as Error)
      setLoading(false)
      throw err
    }
  }, [])

  const updateWorkflow = useCallback(async (id: string, input: Partial<Workflow>) => {
    setLoading(true)
    setError(null)
    try {
      const result = await useGraphQLMutation(UPDATE_WORKFLOW_MUTATION, { id, input })
      setLoading(false)
      return result.updateworkflowsCollection.records[0]
    } catch (err) {
      setError(err as Error)
      setLoading(false)
      throw err
    }
  }, [])

  const deleteWorkflow = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const result = await useGraphQLMutation(DELETE_WORKFLOW_MUTATION, { id })
      setLoading(false)
      return result.deleteFromworkflowsCollection.records[0]
    } catch (err) {
      setError(err as Error)
      setLoading(false)
      throw err
    }
  }, [])

  const createExecution = useCallback(async (input: Partial<WorkflowExecution>) => {
    setLoading(true)
    setError(null)
    try {
      const result = await useGraphQLMutation(CREATE_WORKFLOW_EXECUTION_MUTATION, { input })
      setLoading(false)
      return result.insertIntoworkflow_executionsCollection.records[0]
    } catch (err) {
      setError(err as Error)
      setLoading(false)
      throw err
    }
  }, [])

  const updateExecution = useCallback(async (id: string, input: Partial<WorkflowExecution>) => {
    setLoading(true)
    setError(null)
    try {
      const result = await useGraphQLMutation(UPDATE_WORKFLOW_EXECUTION_MUTATION, { id, input })
      setLoading(false)
      return result.updateworkflow_executionsCollection.records[0]
    } catch (err) {
      setError(err as Error)
      setLoading(false)
      throw err
    }
  }, [])

  return {
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    createExecution,
    updateExecution,
    loading,
    error
  }
}
