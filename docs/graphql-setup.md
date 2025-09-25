# GraphQL with Supabase - Single Client Approach

This project uses Supabase's built-in GraphQL support via the `pg_graphql` extension, accessed through the existing Supabase client.

## 🚀 Setup Overview

We're using the **Single Client Approach** which means:
- Only `@supabase/supabase-js` is needed (already installed)
- GraphQL endpoint: `https://your-project.supabase.co/graphql/v1`
- Same authentication as regular Supabase queries
- No additional GraphQL client libraries required

## 📁 File Structure

```
lib/supabase/
├── client.ts          # Browser Supabase client
├── server.ts          # Server Supabase client  
└── graphql.ts         # GraphQL utility functions

hooks/
└── use-graphql.ts     # React hooks for GraphQL

components/
└── graphql-example.tsx # Example component

app/api/
└── graphql-test/
    └── route.ts       # API route example
```

## 🔧 Usage Examples

### Client Components (Browser)

```typescript
import { useGraphQL, useGraphQLMutation } from '@/hooks/use-graphql'

// Query Example
const { data, loading, error, refetch } = useGraphQL(`
  query GetUsers {
    usersCollection {
      edges {
        node {
          id
          email
        }
      }
    }
  }
`)

// Mutation Example
const { execute } = useGraphQLMutation(`
  mutation CreateUser($email: String!) {
    insertIntousersCollection(objects: [{ email: $email }]) {
      records {
        id
        email
      }
    }
  }
`)

// Execute mutation
await execute({ email: 'user@example.com' })
```

### Server Components / API Routes

```typescript
import { executeGraphQLQueryServer } from '@/lib/supabase/graphql'

// In a server component or API route
const result = await executeGraphQLQueryServer(`
  query GetUsers {
    usersCollection {
      edges {
        node {
          id
          email
        }
      }
    }
  }
`)

if (result.errors) {
  // Handle errors
}

// Use result.data
```

### Direct Fetch (Any Environment)

```typescript
const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/graphql/v1`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    'Authorization': `Bearer ${session?.access_token}` // If authenticated
  },
  body: JSON.stringify({
    query: `query { ... }`,
    variables: {}
  })
})

const result = await response.json()
```

## 🔐 Authentication

GraphQL requests automatically include authentication headers when a user session exists:
- Uses the same auth as regular Supabase queries
- RLS (Row Level Security) policies apply to GraphQL queries
- Authenticated requests include the Bearer token

## 🎯 Key Features

1. **Unified Client**: Single Supabase client for both REST and GraphQL
2. **Type Safety**: Full TypeScript support
3. **React Hooks**: Custom hooks for queries and mutations
4. **Server Support**: Works in both client and server environments
5. **Authentication**: Automatic auth header management
6. **Error Handling**: Built-in error handling and loading states

## 📝 Environment Variables

Ensure these are set in your `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 🧪 Testing the Setup

1. Test the API endpoint:
```bash
curl http://localhost:3000/api/graphql-test
```

2. Use the example component in your app:
```tsx
import { GraphQLExample } from '@/components/graphql-example'

export default function Page() {
  return <GraphQLExample />
}
```

## 📚 GraphQL Schema

To explore your GraphQL schema:

1. Visit: `https://your-project.supabase.co/graphql/v1` (GraphiQL interface)
2. Or use the introspection query in code:

```typescript
const introspectionQuery = `
  {
    __schema {
      types {
        name
        kind
        description
        fields {
          name
          type {
            name
          }
        }
      }
    }
  }
`
```

## 🔄 Migrations & Schema Changes

When your database schema changes:
1. GraphQL schema auto-updates (via pg_graphql)
2. No manual schema regeneration needed
3. New tables/columns immediately available in GraphQL

## ⚡ Performance Tips

1. **Batch Queries**: Combine multiple queries in a single request
2. **Field Selection**: Only request needed fields
3. **Pagination**: Use cursor-based pagination for large datasets
4. **Caching**: Consider implementing client-side caching

## 🛠️ Troubleshooting

### Common Issues

1. **"GraphQL endpoint not found"**
   - Enable pg_graphql extension in Supabase dashboard
   - Check your project URL

2. **"Unauthorized"**
   - Verify environment variables
   - Check RLS policies

3. **"Field not found"**
   - Schema might be out of sync
   - Check table/column names in GraphQL schema

## 📖 References

- [Supabase GraphQL Docs](https://supabase.com/docs/guides/graphql)
- [pg_graphql Extension](https://github.com/supabase/pg_graphql)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript/introduction)