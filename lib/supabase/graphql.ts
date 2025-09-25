import { createClient as createBrowserClient } from "./client"
import { createClient as createServerClient } from "./server"

// GraphQL endpoint for your Supabase project
const GRAPHQL_ENDPOINT = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/graphql/v1`

/**
 * Execute GraphQL queries using the browser client
 * Use this in client components and pages
 */
export async function executeGraphQLQuery<T = any>(
  query: string,
  variables?: Record<string, any>
): Promise<{ data?: T; errors?: any[] }> {
  const supabase = createBrowserClient()
  
  // Get the session for authentication
  const { data: { session } } = await supabase.auth.getSession()
  
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      ...(session?.access_token && {
        'Authorization': `Bearer ${session.access_token}`
      })
    },
    body: JSON.stringify({
      query,
      variables
    })
  })
  
  return response.json()
}

/**
 * Execute GraphQL queries using the server client
 * Use this in server components, API routes, and server actions
 */
export async function executeGraphQLQueryServer<T = any>(
  query: string,
  variables?: Record<string, any>
): Promise<{ data?: T; errors?: any[] }> {
  const supabase = await createServerClient()
  
  // Get the session for authentication
  const { data: { session } } = await supabase.auth.getSession()
  
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      ...(session?.access_token && {
        'Authorization': `Bearer ${session.access_token}`
      })
    },
    body: JSON.stringify({
      query,
      variables
    })
  })
  
  return response.json()
}

/**
 * Type-safe GraphQL query builder helpers
 */
export const GraphQLQueries = {
  // Example: Get all users
  getAllUsers: () => `
    query GetAllUsers {
      usersCollection {
        edges {
          node {
            id
            email
            created_at
            updated_at
          }
        }
      }
    }
  `,

  // Example: Get user by ID
  getUserById: (userId: string) => `
    query GetUserById {
      usersCollection(filter: { id: { eq: "${userId}" } }) {
        edges {
          node {
            id
            email
            created_at
            updated_at
          }
        }
      }
    }
  `,

  // Example: Create a user (mutation)
  createUser: () => `
    mutation CreateUser($email: String!) {
      insertIntousersCollection(objects: [{ email: $email }]) {
        records {
          id
          email
          created_at
        }
      }
    }
  `,

  // You can add more predefined queries here based on your schema
}