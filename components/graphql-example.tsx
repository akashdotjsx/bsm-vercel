'use client'

import { useGraphQL, useGraphQLMutation } from '@/hooks/use-graphql'
import { GraphQLQueries } from '@/lib/supabase/graphql'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Example component showing how to use GraphQL with Supabase
export function GraphQLExample() {
  // Query example - fetch all users
  const { data, loading, error, refetch } = useGraphQL(
    GraphQLQueries.getAllUsers(),
    undefined,
    {
      onCompleted: (data) => {
        console.log('Users loaded:', data)
      },
      onError: (error) => {
        console.error('Error loading users:', error)
      }
    }
  )

  // Mutation example
  const { execute: createUser, loading: creating } = useGraphQLMutation(
    GraphQLQueries.createUser()
  )

  const handleCreateUser = async () => {
    try {
      const result = await createUser({
        email: `test${Date.now()}@example.com`
      })
      console.log('User created:', result)
      // Refetch users after creating
      await refetch()
    } catch (error) {
      console.error('Error creating user:', error)
    }
  }

  // Custom GraphQL query example
  const customQuery = `
    query GetTablesInfo {
      __schema {
        types {
          name
          kind
          description
        }
      }
    }
  `

  const { data: schemaData } = useGraphQL(customQuery)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>GraphQL Integration Example</CardTitle>
          <CardDescription>
            Using Supabase's built-in GraphQL endpoint with the single client approach
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Users List */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Users</h3>
            {loading && <p>Loading users...</p>}
            {error && <p className="text-red-500">Error: {error.message}</p>}
            {data && (
              <pre className="bg-gray-100 p-2 rounded text-sm">
                {JSON.stringify(data, null, 2)}
              </pre>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={refetch} disabled={loading}>
              Refetch Users
            </Button>
            <Button onClick={handleCreateUser} disabled={creating}>
              {creating ? 'Creating...' : 'Create Test User'}
            </Button>
          </div>

          {/* Schema Info */}
          {schemaData && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Schema Types</h3>
              <pre className="bg-gray-100 p-2 rounded text-sm max-h-40 overflow-auto">
                {JSON.stringify(schemaData, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}