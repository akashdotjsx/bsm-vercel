'use client'

import { useState, useEffect, useCallback } from 'react'
import { executeGraphQLQuery } from '@/lib/supabase/graphql'

interface UseGraphQLResult<T> {
  data: T | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

/**
 * React hook for GraphQL queries (client-side)
 * @param query - GraphQL query string
 * @param variables - Query variables
 * @param options - Query options
 */
export function useGraphQL<T = any>(
  query: string,
  variables?: Record<string, any>,
  options?: {
    skip?: boolean
    onCompleted?: (data: T) => void
    onError?: (error: Error) => void
  }
): UseGraphQLResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(!options?.skip)
  const [error, setError] = useState<Error | null>(null)

  const execute = useCallback(async () => {
    if (options?.skip) return

    try {
      setLoading(true)
      setError(null)
      const result = await executeGraphQLQuery<T>(query, variables)
      
      if (result.errors && result.errors.length > 0) {
        const error = new Error(result.errors[0]?.message || 'GraphQL Error')
        setError(error)
        options?.onError?.(error)
        return
      }
      
      const resultData = result.data || null
      setData(resultData)
      if (resultData) {
        options?.onCompleted?.(resultData)
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      options?.onError?.(error)
    } finally {
      setLoading(false)
    }
  }, [query, JSON.stringify(variables), options?.skip])

  useEffect(() => {
    execute()
  }, [execute])

  return { data, loading, error, refetch: execute }
}

/**
 * React hook for GraphQL mutations (client-side)
 * @param mutation - GraphQL mutation string
 */
export function useGraphQLMutation<T = any, V = Record<string, any>>(
  mutation: string
) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const execute = useCallback(async (variables?: V): Promise<T | null> => {
    try {
      setLoading(true)
      setError(null)
      const result = await executeGraphQLQuery<T>(mutation, variables)
      
      if (result.errors && result.errors.length > 0) {
        const error = new Error(result.errors[0]?.message || 'GraphQL Error')
        setError(error)
        throw error
      }
      
      return result.data || null
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [mutation])

  return { execute, loading, error }
}