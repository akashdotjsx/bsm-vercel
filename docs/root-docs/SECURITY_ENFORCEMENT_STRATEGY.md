# Security Enforcement Strategy
## Complete Role-Based Access Control Implementation

---

## Overview

This document outlines the **comprehensive security enforcement strategy** to ensure:

1. ✅ **GraphQL queries ALWAYS include organization_id filtering**
2. ✅ **Admin pages are completely hidden from non-admin users**
3. ✅ **Settings pages show only user's own data**
4. ✅ **Every page has role/permission checks**
5. ✅ **Navigation items hidden based on permissions**
6. ✅ **API routes validate organization_id ownership**

---

## 1. GraphQL Security Pattern (MANDATORY)

### ❌ WRONG - Missing Organization Filter
```typescript
// DON'T DO THIS - Returns all organizations' data
const { data } = useGraphQL(GET_TICKETS_QUERY, { 
  status: 'open' 
})
```

### ✅ CORRECT - Always Include Organization Filter
```typescript
// ALWAYS DO THIS - Scoped to user's organization
const { organizationId } = useAuth()

const { data } = useGraphQL(GET_TICKETS_QUERY, { 
  filter: {
    organization_id: { eq: organizationId },
    status: { eq: 'open' }
  }
})
```

### Mandatory GraphQL Query Pattern

**EVERY GraphQL query MUST follow this pattern:**

```typescript
import { useAuth } from '@/lib/contexts/auth-context'

export function useYourData() {
  const { organizationId, user } = useAuth()
  
  // MANDATORY: Check organizationId exists
  if (!organizationId) {
    throw new Error('No organization context')
  }
  
  const { data, loading, error } = useGraphQL(YOUR_QUERY, {
    // MANDATORY: Always filter by organization_id
    filter: {
      organization_id: { eq: organizationId },
      // ... other filters
    }
  })
  
  return { data, loading, error }
}
```

---

## 2. Page-Level Security Guards

### Every Page MUST Have Permission Check

```typescript
'use client'

import { PermissionGuard } from '@/components/auth/permission-guard'
import { RoleGuard } from '@/components/auth/role-guard'

export default function YourPage() {
  return (
    <PermissionGuard 
      permission="module.view"  // Replace with actual permission
      fallback={<UnauthorizedPage />}
    >
      {/* Page content here */}
    </PermissionGuard>
  )
}
```

### Admin Pages Pattern

```typescript
'use client'

import { AdminOnly } from '@/components/auth/role-guard'
import { redirect } from 'next/navigation'
import { useAuth } from '@/lib/contexts/auth-context'

export default function AdminPage() {
  const { isAdmin, loading } = useAuth()
  
  // Server-side protection
  if (!loading && !isAdmin) {
    redirect('/dashboard')
  }
  
  return (
    <AdminOnly fallback={<UnauthorizedPage />}>
      {/* Admin-only content */}
    </AdminOnly>
  )
}
```

### User Settings Pattern (Own Data Only)

```typescript
'use client'

import { useAuth } from '@/lib/contexts/auth-context'

export default function UserSettingsPage() {
  const { user, profile, organizationId } = useAuth()
  
  // Fetch ONLY current user's data
  const { data } = useGraphQL(GET_USER_PROFILE_QUERY, {
    filter: {
      id: { eq: user.id },  // ✅ Own data only
      organization_id: { eq: organizationId }  // ✅ Org scoped
    }
  })
  
  // Update ONLY current user's data
  const handleUpdate = async (updates) => {
    await updateProfile({
      id: user.id,  // ✅ Can only update self
      organization_id: organizationId,  // ✅ Verify org
      ...updates
    })
  }
  
  return <div>{/* Settings UI */}</div>
}
```

---

## 3. Navigation Filtering (Sidebar)

### Current Implementation Issues

**Problem**: Sidebar shows all items regardless of permissions

**Solution**: Already implemented in `sidebar-navigation.tsx` (lines 128-151):

```typescript
// ✅ GOOD - Already implemented
const shouldShowItem = (item: any) => {
  if (!item.permission) return true  // Public items
  if (isAdmin) return true           // Admin sees all
  if (loading || permissionsLoading) return true  // Prevent flash
  return canView(item.permission)    // Check permission
}

// Filter navigation items
navigationItems.filter(shouldShowItem).map((item) => {
  // Render only allowed items
})
```

### Add Permission Checks to Navigation Items

**Update navigation item definitions:**

```typescript
// components/dashboard/sidebar-navigation.tsx

const employeeViewItems = [
  { name: "Dashboard", href: "/dashboard", icon: BarChart3, permission: null },
  { name: "Accounts", href: "/accounts", icon: Building, permission: null },
  { name: "Tickets", href: "/tickets", icon: Ticket, hasSubmenu: true, permission: "tickets.view" },
  { name: "Workflows", href: "/workflows", icon: Workflow, permission: "workflows.view" },
  { name: "Asset Management", href: "/assets", icon: HardDrive, permission: "cmdb.view" },
  { name: "Services", href: "/services", icon: Settings, hasSubmenu: true, permission: "services.view" },
  { name: "Knowledge Base", href: "/knowledge-base", icon: BookOpen, permission: "knowledge_base.view" },
  { name: "Analytics", href: "/analytics", icon: BarChart3, permission: "analytics.view" },
  { name: "Notifications", href: "/notifications", icon: Bell, permission: null },
]

const administrationItems = [
  { name: "Integrations", href: "/integrations", icon: Zap, permission: "integrations.view" },
  { name: "Approval Workflows", href: "/admin/approvals", icon: CheckCircle, permission: "administration.view" },
  { name: "SLA Management", href: "/admin/sla", icon: Clock, permission: "administration.view" },
  { name: "Priority Matrix", href: "/admin/priorities", icon: AlertTriangle, permission: "administration.view" },
  { name: "Service Catalog", href: "/admin/catalog", icon: Building2, permission: "administration.view" },
  { name: "All Service Requests", href: "/admin/service-requests", icon: List, permission: "administration.view" },
  { name: "Users & Teams", href: "/users", icon: Users, permission: "users.view" },
  { name: "Security & Access", href: "/admin/security", icon: Shield, permission: "administration.full_edit" },
]
```

### Hide Administration Section for Non-Admins

```typescript
// Only show administration section if user has ANY admin permission
const showAdministration = isAdmin || 
  canView('administration.view') || 
  canView('integrations.view') ||
  canView('users.view')

// In render:
{showAdministration && (
  <div className="px-4 pb-4">
    <h3 className="text-[10px] font-semibold uppercase">Administration</h3>
    <nav className="space-y-1">
      {administrationItems.filter(shouldShowItem).map((item) => (
        // Render item
      ))}
    </nav>
  </div>
)}
```

---

## 4. API Route Security Pattern

### Every API Route MUST Validate Organization

```typescript
// app/api/your-endpoint/[id]/route.ts

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // MANDATORY: Get user's organization
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()
  
  if (!profile?.organization_id) {
    return NextResponse.json({ error: 'No organization' }, { status: 400 })
  }
  
  // MANDATORY: Verify resource belongs to user's organization
  const { data, error } = await supabase
    .from('your_table')
    .select('*')
    .eq('id', params.id)
    .eq('organization_id', profile.organization_id)  // ✅ CRITICAL
    .single()
  
  if (!data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  
  return NextResponse.json(data)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()
  
  if (!profile?.organization_id) {
    return NextResponse.json({ error: 'No organization' }, { status: 400 })
  }
  
  const body = await request.json()
  
  // MANDATORY: Update with organization verification
  const { data, error } = await supabase
    .from('your_table')
    .update(body)
    .eq('id', params.id)
    .eq('organization_id', profile.organization_id)  // ✅ CRITICAL
    .select()
    .single()
  
  if (!data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  
  return NextResponse.json(data)
}
```

---

## 5. Middleware Enhancement

### Current Issue
Middleware only checks authentication, not permissions.

### Enhanced Middleware

```typescript
// lib/supabase/middleware.ts

import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

// Define protected routes and their required permissions
const ROUTE_PERMISSIONS: Record<string, string> = {
  '/admin': 'administration.view',
  '/admin/security': 'administration.full_edit',
  '/admin/approvals': 'administration.view',
  '/admin/sla': 'administration.view',
  '/admin/priorities': 'administration.view',
  '/admin/catalog': 'administration.view',
  '/admin/service-requests': 'administration.view',
  '/users': 'users.view',
  '/analytics': 'analytics.view',
  '/workflows': 'workflows.view',
  '/assets': 'cmdb.view',
  '/integrations': 'integrations.view',
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => 
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    },
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Check authentication
  if (!user && 
      request.nextUrl.pathname !== "/" &&
      !request.nextUrl.pathname.startsWith("/login") &&
      !request.nextUrl.pathname.startsWith("/auth")) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  // Check route-level permissions
  if (user) {
    const pathname = request.nextUrl.pathname
    
    // Find matching permission requirement
    const requiredPermission = Object.keys(ROUTE_PERMISSIONS).find(route => 
      pathname.startsWith(route)
    )
    
    if (requiredPermission) {
      const permission = ROUTE_PERMISSIONS[requiredPermission]
      
      // Get user's permissions
      const { data: hasPermission } = await supabase
        .rpc('user_has_permission', { 
          user_uuid: user.id, 
          permission_name: permission 
        })
      
      if (!hasPermission) {
        // Redirect to unauthorized page
        const url = request.nextUrl.clone()
        url.pathname = "/unauthorized"
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}
```

---

## 6. Implementation Checklist

### Phase 1: GraphQL Security (Week 1)

- [ ] **Audit all GraphQL queries**
  - Find all `useGraphQL()` calls
  - Ensure ALL have `organization_id` filter
  - Add TypeScript lint rule to enforce

- [ ] **Create GraphQL query wrapper**
  ```typescript
  // hooks/use-secure-graphql.ts
  export function useSecureGraphQL(query: string, variables: any) {
    const { organizationId } = useAuth()
    
    if (!variables.filter) {
      variables.filter = {}
    }
    
    // FORCE organization_id filter
    variables.filter.organization_id = { eq: organizationId }
    
    return useGraphQL(query, variables)
  }
  ```

- [ ] **Replace all `useGraphQL` with `useSecureGraphQL`**

### Phase 2: Page-Level Guards (Week 1-2)

- [ ] **Add guards to all admin pages**
  - /admin/security → `administration.full_edit`
  - /admin/approvals → `administration.view`
  - /admin/sla → `administration.view`
  - /admin/priorities → `administration.view`
  - /admin/catalog → `administration.view`
  - /admin/service-requests → `administration.view`

- [ ] **Add guards to module pages**
  - /tickets → `tickets.view`
  - /workflows → `workflows.view`
  - /assets → `cmdb.view`
  - /analytics → `analytics.view`
  - /users → `users.view`

- [ ] **Settings pages - own data only**
  - Profile settings → user.id filter
  - Notification preferences → user.id filter

### Phase 3: Navigation Filtering (Week 2)

- [ ] **Update navigation item permissions**
  - Add `permission` field to all items
  - Hide admin section from non-admins
  - Test with different user roles

- [ ] **Mobile navigation**
  - Apply same filters to mobile drawer
  - Ensure consistency

### Phase 4: API Security (Week 2)

- [ ] **Audit all API routes with [id] params**
  - Add organization_id verification to:
    - /api/tickets/[id]/route.ts
    - /api/service-requests/[id]/route.ts
    - /api/workflows/[id]/route.ts
    - /api/assets/[id]/route.ts
    - All other ID-based routes

- [ ] **Add permission checks to API routes**
  ```typescript
  // Check if user has permission
  const { data: hasPermission } = await supabase
    .rpc('user_has_permission', { 
      user_uuid: user.id, 
      permission_name: 'module.action' 
    })
  
  if (!hasPermission) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  ```

### Phase 5: Middleware Enhancement (Week 3)

- [ ] **Implement route-permission mapping**
- [ ] **Add permission validation in middleware**
- [ ] **Add audit logging for access denials**

---

## 7. Testing Requirements

### Permission Testing Matrix

| User Role | Can Access Admin | Can Access Analytics | Can Access Settings (Own) |
|-----------|------------------|----------------------|---------------------------|
| User      | ❌ No            | ❌ No                | ✅ Yes                    |
| Agent     | ❌ No            | ❌ No                | ✅ Yes                    |
| Manager   | ⚠️ Partial       | ✅ Yes               | ✅ Yes                    |
| Admin     | ✅ Yes           | ✅ Yes               | ✅ Yes                    |

### Test Cases

```typescript
// Test 1: Non-admin cannot access admin pages
test('User cannot access /admin/security', async () => {
  const userToken = await loginAsUser()
  const response = await fetch('/admin/security', {
    headers: { Authorization: `Bearer ${userToken}` }
  })
  expect(response.status).toBe(403) // Or redirect to /unauthorized
})

// Test 2: GraphQL queries filter by organization
test('Tickets query only returns own organization data', async () => {
  const org1User = await createUser({ org: 'org1' })
  const org2Ticket = await createTicket({ org: 'org2' })
  
  const tickets = await queryTickets(org1User.token)
  
  expect(tickets).not.toContainEqual(expect.objectContaining({
    id: org2Ticket.id
  }))
})

// Test 3: User can only update own settings
test('User cannot update another user settings', async () => {
  const user1 = await createUser()
  const user2 = await createUser()
  
  const response = await updateUserSettings(user2.id, { theme: 'dark' }, user1.token)
  
  expect(response.status).toBe(403)
})
```

---

## 8. Quick Reference

### ✅ DO THIS

```typescript
// 1. Always filter by organization_id in GraphQL
const { organizationId } = useAuth()
useGraphQL(QUERY, { 
  filter: { organization_id: { eq: organizationId } } 
})

// 2. Always wrap admin pages
<AdminOnly>
  <AdminContent />
</AdminOnly>

// 3. Always verify org in API routes
.eq('id', params.id)
.eq('organization_id', profile.organization_id)

// 4. Always add permission to nav items
{ name: "Item", permission: "module.view" }

// 5. Always filter own data only in settings
filter: { 
  id: { eq: user.id },
  organization_id: { eq: organizationId }
}
```

### ❌ DON'T DO THIS

```typescript
// 1. Never query without organization filter
useGraphQL(QUERY, { filter: { status: 'open' } })  // ❌

// 2. Never expose admin pages without guard
export default function AdminPage() {
  return <AdminContent />  // ❌ No guard!
}

// 3. Never update without org verification
await supabase
  .from('table')
  .update(data)
  .eq('id', params.id)  // ❌ Missing org check!

// 4. Never show nav items without permission check
items.map(item => <NavItem />)  // ❌ No filtering!

// 5. Never allow access to other users' data
.eq('user_id', params.userId)  // ❌ Can be anyone!
```

---

## 9. Enforcement Rules

### Rule 1: Organization Filtering
**Every database query MUST include organization_id filter**

### Rule 2: Page Guards
**Every protected page MUST have PermissionGuard or RoleGuard**

### Rule 3: API Verification
**Every ID-based API route MUST verify organization ownership**

### Rule 4: Navigation Filtering
**All navigation items MUST have permission checks**

### Rule 5: Own Data Only
**Settings/profile pages MUST filter by current user.id**

---

## 10. Migration Plan

### Week 1: Critical Security
1. Add organization_id to all GraphQL queries
2. Add guards to all admin pages
3. Add org verification to API routes

### Week 2: Navigation & Testing
1. Update navigation permissions
2. Hide admin section from non-admins
3. Comprehensive testing

### Week 3: Middleware & Monitoring
1. Enhanced middleware
2. Audit logging
3. Security monitoring

---

## Summary

This strategy ensures **defense in depth** with security at:
1. ✅ Database level (RLS policies)
2. ✅ API level (organization verification)
3. ✅ Application level (permission guards)
4. ✅ UI level (hidden navigation items)
5. ✅ Client level (filtered queries)

**No single point of failure** - even if one layer is bypassed, others protect the data.
