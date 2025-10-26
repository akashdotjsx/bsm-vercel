/**
 * Secure GraphQL Hook Wrapper
 * 
 * This hook ENFORCES organization_id filtering on ALL GraphQL queries
 * to prevent cross-organization data leakage.
 * 
 * Usage:
 * ```typescript
 * import { useSecureGraphQL } from '@/hooks/use-secure-graphql'
 * 
 * const { data, loading, error } = useSecureGraphQL(GET_TICKETS_QUERY, {
 *   filter: { status: { eq: 'open' } }  // org filter added automatically
 * })
 * ```
 */

import { useGraphQL, useGraphQLMutation } from './use-graphql'
import { useAuth } from '@/lib/contexts/auth-context'
import { useMemo } from 'react'

interface GraphQLVariables {
  filter?: Record<string, any>
  [key: string]: any
}

/**
 * Secure GraphQL query hook that ALWAYS includes organization_id filter
 * 
 * @param query - GraphQL query string
 * @param variables - Query variables (filter will be enhanced with org_id)
 * @param options - Additional options for useGraphQL
 * @returns Query result with data, loading, error states
 */
export function useSecureGraphQL<T = any>(
  query: string,
  variables?: GraphQLVariables,
  options?: any
) {
  const { organizationId, user } = useAuth()

  // Enhance variables with organization_id filter
  const secureVariables = useMemo(() => {
    if (!organizationId) {
      console.warn('⚠️ useSecureGraphQL: No organization_id in context')
      return variables
    }

    // Clone variables to avoid mutation
    const enhanced: GraphQLVariables = { ...variables }

    // Initialize filter if not present
    if (!enhanced.filter) {
      enhanced.filter = {}
    }

    // FORCE organization_id filter (cannot be overridden)
    enhanced.filter.organization_id = { eq: organizationId }

    return enhanced
  }, [organizationId, variables])

  // Log security check in development
  if (process.env.NODE_ENV === 'development') {
    console.log('🔒 Secure GraphQL Query:', {
      hasOrgFilter: !!secureVariables.filter?.organization_id,
      organizationId,
      userId: user?.id
    })
  }

  return useGraphQL<T>(query, secureVariables, {
    ...options,
    enabled: options?.enabled !== false && !!organizationId
  })
}

/**
 * Secure GraphQL mutation hook that ALWAYS includes organization_id in input
 * 
 * @param mutation - GraphQL mutation string
 * @returns Mutation function
 */
export function useSecureGraphQLMutation<T = any>(mutation: string) {
  const { organizationId, user } = useAuth()

  return async (variables: any) => {
    if (!organizationId) {
      throw new Error('No organization context for mutation')
    }

    // Enhance input with organization_id
    const secureVariables = {
      ...variables,
      input: {
        ...variables.input,
        organization_id: organizationId
      }
    }

    // Log security check in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🔒 Secure GraphQL Mutation:', {
        hasOrgInInput: !!secureVariables.input.organization_id,
        organizationId,
        userId: user?.id
      })
    }

    return useGraphQLMutation<T>(mutation, secureVariables)
  }
}

/**
 * Hook to fetch user's OWN data only (for settings pages)
 * 
 * @param query - GraphQL query string
 * @param additionalFilters - Additional filters (optional)
 * @returns Query result filtered by current user.id AND organization_id
 */
export function useOwnDataGraphQL<T = any>(
  query: string,
  additionalFilters?: Record<string, any>
) {
  const { organizationId, user } = useAuth()

  const variables = useMemo(() => ({
    filter: {
      id: { eq: user?.id },
      organization_id: { eq: organizationId },
      ...additionalFilters
    }
  }), [organizationId, user?.id, additionalFilters])

  return useGraphQL<T>(query, variables, {
    enabled: !!user && !!organizationId
  })
}

/**
 * Type-safe wrapper for collection queries
 * Automatically extracts nodes from GraphQL collection response
 */
export function useSecureCollectionQuery<T = any>(
  query: string,
  collectionName: string,
  variables?: GraphQLVariables,
  options?: any
) {
  const { data, loading, error, refetch } = useSecureGraphQL(
    query,
    variables,
    options
  )

  const nodes = useMemo(() => {
    if (!data?.[collectionName]) return []
    return data[collectionName].edges?.map((edge: any) => edge.node) || []
  }, [data, collectionName])

  return {
    data: nodes as T[],
    loading,
    error,
    refetch,
    pageInfo: data?.[collectionName]?.pageInfo
  }
}

/**
 * Security validation utility
 * Use this to verify organization_id is present in variables
 */
export function validateOrganizationFilter(variables: any): boolean {
  return !!(variables?.filter?.organization_id?.eq)
}

/**
 * Development-only hook to audit GraphQL queries
 * Logs all queries and checks for organization_id filter
 */
export function useGraphQLSecurityAudit(enabled: boolean = false) {
  if (!enabled || process.env.NODE_ENV !== 'development') {
    return { audit: () => {}, violations: [] }
  }

  const violations: string[] = []

  const audit = (query: string, variables: any, source: string) => {
    if (!validateOrganizationFilter(variables)) {
      const violation = `⚠️ SECURITY: Missing org filter in ${source}`
      violations.push(violation)
      console.error(violation, { query, variables })
    }
  }

  return { audit, violations }
}

// Export types
export type { GraphQLVariables }
