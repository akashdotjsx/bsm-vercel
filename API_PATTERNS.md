# 🚀 API Patterns Quick Reference

## Overview

This guide provides quick reference for API patterns in the Kroolo BSM application.

---

## 🎯 When to Use Each Pattern

### Pattern 1: Direct GraphQL (Use 75% of the time)

**When**: User token is sufficient, no service role needed

```typescript
import { useTicketsGraphQLQuery } from '@/hooks/use-tickets-gql'

const { data, loading, error } = useTicketsGraphQLQuery({
  filter: { status: 'open' }
})
```

**Use Cases**:
- ✅ Tickets
- ✅ Services
- ✅ Assets
- ✅ Discovery Rules
- ✅ Business Services
- ✅ Organizations (reading)

---

### Pattern 2: API Route + GraphQL (Use 25% of the time)

**When**: Requires service role key or RLS bypass

```typescript
const response = await fetch('/api/workflows')
const { workflows } = await response.json()
```

**Use Cases**:
- ✅ Workflows (strict RLS)
- ✅ User creation (auth.admin)
- ✅ Team management
- ✅ Complex server-side logic

---

## 📚 Available API Routes

### `/api/workflows`

**GET** - Fetch workflows
```typescript
const res = await fetch('/api/workflows')
const { workflows } = await res.json()
```

**POST** - Create workflow
```typescript
const res = await fetch('/api/workflows', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'My Workflow',
    trigger_type: 'manual',
    actions: []
  })
})
```

**PUT** - Update workflow
```typescript
const res = await fetch('/api/workflows', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: 'workflow-id',
    name: 'Updated Name'
  })
})
```

**DELETE** - Delete workflow
```typescript
const res = await fetch('/api/workflows?id=workflow-id', {
  method: 'DELETE'
})
```

---

### `/api/users`

**GET** - Fetch users
```typescript
const res = await fetch('/api/users')
const { users } = await res.json()
```

**GET** - Fetch teams
```typescript
const res = await fetch('/api/users?type=teams')
const { teams } = await res.json()
```

**POST** - Create user
```typescript
const res = await fetch('/api/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'user',
    email: 'user@example.com',
    first_name: 'John',
    last_name: 'Doe',
    role: 'user',
    department: 'Engineering'
  })
})
```

**POST** - Create team
```typescript
const res = await fetch('/api/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'team',
    name: 'Engineering Team',
    description: 'Core engineering',
    department: 'Engineering',
    lead_id: 'user-id'
  })
})
```

**POST** - Add team member
```typescript
const res = await fetch('/api/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'team_member',
    team_id: 'team-id',
    user_id: 'user-id',
    role: 'member'
  })
})
```

**PUT** - Update user
```typescript
const res = await fetch('/api/users', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'user',
    id: 'user-id',
    display_name: 'New Name'
  })
})
```

**DELETE** - Deactivate user
```typescript
const res = await fetch('/api/users?type=user&id=user-id', {
  method: 'DELETE'
})
```

**DELETE** - Remove team member
```typescript
const res = await fetch('/api/users?type=team_member&teamId=team-id&userId=user-id', {
  method: 'DELETE'
})
```

---

## 🔵 GraphQL Hooks Reference

### Tickets
```typescript
import { 
  useTicketsGraphQLQuery,
  useTicketByIdGraphQL,
  useCreateTicketGraphQL,
  useUpdateTicketGraphQL,
  useDeleteTicketGraphQL 
} from '@/hooks/use-tickets-gql'

// Query tickets
const { data: tickets } = useTicketsGraphQLQuery({
  search: 'bug',
  status: 'open',
  priority: 'high'
})

// Create ticket
const createMutation = useCreateTicketGraphQL()
await createMutation.mutateAsync({
  title: 'New Ticket',
  description: 'Description',
  priority: 'high'
})
```

### Services & Assets
```typescript
import {
  useServicesGQL,
  useAssetsGQL,
  useBusinessServicesGQL,
  createServiceGQL,
  createAssetGQL
} from '@/hooks/use-services-assets-gql'

// Query services
const { data: services } = useServicesGQL({
  search: 'web',
  category: 'IT'
})

// Create service
const newService = await createServiceGQL({
  name: 'Web Server',
  category_id: 'category-id'
})
```

### Organizations
```typescript
import {
  useOrganizationsGQL,
  createOrganizationGQL,
  updateOrganizationGQL
} from '@/hooks/use-workflows-organizations-gql'

// Query organizations
const { data: orgs } = useOrganizationsGQL()

// Create organization
const newOrg = await createOrganizationGQL({
  name: 'New Company',
  tier: 'enterprise'
})
```

---

## 🔄 React Query Integration

All hooks use React Query for caching and state management:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// Manual query
const { data, loading, error, refetch } = useQuery(['key'], fetchFn)

// Manual mutation
const queryClient = useQueryClient()
const mutation = useMutation(mutationFn, {
  onSuccess: () => {
    queryClient.invalidateQueries(['key'])
  }
})
```

---

## 🔐 Authentication

All API routes automatically check authentication:

```typescript
// In API route
const supabase = await createSupabaseServer()
const { data: { user } } = await supabase.auth.getUser()

if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

All GraphQL queries use user's session token automatically.

---

## 🎨 Error Handling

### GraphQL Hooks
```typescript
const { data, loading, error } = useTicketsGraphQLQuery()

if (loading) return <Loading />
if (error) return <Error message={error.message} />

return <TicketList tickets={data} />
```

### API Routes
```typescript
try {
  const res = await fetch('/api/users')
  if (!res.ok) throw new Error('Failed to fetch')
  const { users } = await res.json()
  return users
} catch (error) {
  console.error(error)
  toast.error('Failed to load users')
}
```

---

## 📝 TypeScript Types

```typescript
// Ticket type
interface Ticket {
  id: string
  title: string
  description?: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'critical'
  created_at: string
  updated_at: string
  organization_id: string
}

// User type
interface User {
  id: string
  email: string
  display_name: string
  first_name?: string
  last_name?: string
  role: string
  department?: string
  is_active: boolean
  created_at: string
}

// Team type
interface Team {
  id: string
  name: string
  description?: string
  department?: string
  lead_id?: string
  is_active: boolean
  created_at: string
}
```

---

## 🧪 Testing

### Test API Routes
```typescript
// Test GET
const res = await fetch('/api/users')
expect(res.status).toBe(200)
const { users } = await res.json()
expect(users).toBeInstanceOf(Array)

// Test POST
const res = await fetch('/api/users', {
  method: 'POST',
  body: JSON.stringify({ type: 'user', email: 'test@example.com' })
})
expect(res.status).toBe(200)
```

### Test GraphQL Hooks
```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { useTicketsGraphQLQuery } from '@/hooks/use-tickets-gql'

test('fetches tickets', async () => {
  const { result } = renderHook(() => useTicketsGraphQLQuery())
  
  await waitFor(() => {
    expect(result.current.loading).toBe(false)
    expect(result.current.data).toBeDefined()
  })
})
```

---

## 🚨 Common Mistakes to Avoid

### ❌ Don't: Mix patterns
```typescript
// BAD - mixing Supabase direct with GraphQL
const supabase = createClient()
const { data } = await supabase.from('tickets').select()
```

### ✅ Do: Use GraphQL hooks
```typescript
// GOOD - use GraphQL hook
const { data } = useTicketsGraphQLQuery()
```

---

### ❌ Don't: Expose service role key
```typescript
// BAD - never use service role in client
const supabase = createClient(url, SERVICE_ROLE_KEY)
```

### ✅ Do: Use API routes
```typescript
// GOOD - service role in API route
const res = await fetch('/api/users')
```

---

### ❌ Don't: Forget organization scoping
```typescript
// BAD - query without org filter
const { data } = await client.request(GET_ALL_TICKETS)
```

### ✅ Do: Always scope to organization
```typescript
// GOOD - filter by organization
const { data } = await client.request(GET_TICKETS, {
  orgId: user.organization_id
})
```

---

## 📚 Additional Resources

- [COMPLETE_MIGRATION_REPORT.md](./COMPLETE_MIGRATION_REPORT.md) - Full migration details
- [API_AUDIT_REPORT.md](./API_AUDIT_REPORT.md) - API audit and analysis
- [WARP.md](./WARP.md) - Development setup guide
- [GraphQL Docs](./docs/graphql/) - GraphQL implementation guides

---

**Last Updated**: 2025-10-14  
**Architecture Version**: 2.0 (Modern)
