import { useQuery, useMutation, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

/**
 * Execute a GraphQL query
 */
async function graphqlQuery<TData = any>(query: string, variables?: Record<string, any>): Promise<TData> {
  const supabase = createClient()
  const graphqlUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/graphql/v1`
  
  const { data: { session } } = await supabase.auth.getSession()
  
  const response = await fetch(graphqlUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  })

  const result = await response.json()

  if (result.errors) {
    console.error('GraphQL Errors:', result.errors)
    throw new Error(result.errors[0]?.message || 'GraphQL query failed')
  }

  return result.data
}

/**
 * Hook for GraphQL queries
 */
export function useGraphQL<TData = any>(
  query: string,
  variables?: Record<string, any>,
  options?: Omit<UseQueryOptions<TData>, 'queryKey' | 'queryFn'>
) {
  return useQuery<TData>({
    queryKey: ['graphql', query, variables],
    queryFn: async () => {
      return await graphqlQuery<TData>(query, variables)
    },
    ...options,
  } as any)
}

/**
 * Hook for GraphQL mutations
 */
export function useGraphQLMutation<TData = any, TVariables = Record<string, any>>(
  mutation: string,
  options?: UseMutationOptions<TData, Error, TVariables>
) {
  return useMutation<TData, Error, TVariables>({
    mutationFn: async (variables: TVariables) => {
      return await graphqlQuery<TData>(mutation, variables as any)
    },
    ...options,
  })
}
