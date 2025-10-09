import { GraphQLClient } from 'graphql-request'
import { createClient as createSupabaseClient } from '@/lib/supabase/client'

/**
 * Creates a GraphQL client authenticated with the current user's session.
 * This ensures Row Level Security (RLS) policies are enforced.
 * 
 * Usage:
 * ```ts
 * const client = await createGraphQLClient()
 * const data = await client.request(query, variables)
 * ```
 */
export async function createGraphQLClient() {
  const supabase = createSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  const accessToken = session?.access_token

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uzbozldsdzsfytsteqlb.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6Ym96bGRzZHpzZnl0c3RlcWxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMDc1MzIsImV4cCI6MjA3Mzc4MzUzMn0.01VQh8PRqphCIbUCB2gLJjUZPX-AtzAF5ZRjJWyy24g'
  
  const endpoint = `${supabaseUrl}/graphql/v1`

  const headers: Record<string, string> = {
    apikey: supabaseAnonKey,
  }

  // Include user access token if available for RLS enforcement
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  return new GraphQLClient(endpoint, {
    headers,
    // Enable automatic error extraction
    errorPolicy: 'all',
  })
}

/**
 * Creates a server-side GraphQL client with service role access.
 * USE WITH CAUTION - bypasses RLS. Only use in server components/actions.
 */
export function createServerGraphQLClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uzbozldsdzsfytsteqlb.supabase.co'
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  }

  const endpoint = `${supabaseUrl}/graphql/v1`

  return new GraphQLClient(endpoint, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    errorPolicy: 'all',
  })
}

/**
 * Type-safe GraphQL request helper
 */
export async function gqlRequest<T = any>(
  query: string,
  variables?: Record<string, any>
): Promise<T> {
  const client = await createGraphQLClient()
  return client.request<T>(query)
}
