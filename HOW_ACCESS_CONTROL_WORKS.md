# How Access Control Works - Config-Based System

## ✅ NOW COMPLETE: Config File Controls Everything!

### The Flow

```
User visits page
    ↓
Dashboard Layout loads
    ↓
UnifiedPageGuard checks:
    1. Is user authenticated?
    2. What is user's role? (admin/manager/agent/user)
    3. What permissions does user have?
    ↓
Looks up page in config/page-access.config.ts
    ↓
Checks if user's role is in allowedRoles[]
    ↓
If yes: Show page ✅
If no: Show "Access Denied" ❌
```

## 🎯 Single Source of Truth

**File:** `/config/page-access.config.ts`

This ONE file controls access to ALL pages. Change it, and access changes everywhere instantly.

## How to Control Access

### Example 1: Make a page accessible to all users
```typescript
{
  path: '/tickets',
  label: 'Tickets',
  allowedRoles: [], // Empty = ALL authenticated users
}
```

### Example 2: Restrict to specific roles
```typescript
{
  path: '/admin/security',
  label: 'Security',
  allowedRoles: ['admin'], // Only admins
  requiresPermission: 'administration.full_edit', // Extra check
}
```

### Example 3: Allow multiple roles
```typescript
{
  path: '/analytics',
  label: 'Analytics', 
  allowedRoles: ['admin', 'manager'], // Admins and managers only
}
```

### Example 4: Add a new restricted page
```typescript
{
  path: '/reports/executive',
  label: 'Executive Reports',
  allowedRoles: ['admin', 'manager'], // Managers can view
  requiresPermission: 'reports.view', // Must also have permission
}
```

## Current Configuration

### 🌐 Open to ALL Users (empty allowedRoles)
- Dashboard
- Accounts
- Tickets
- Workflows
- Assets
- Services
- Knowledge Base
- Analytics
- Notifications
- Users & Teams
- Settings
- Profile

### 🔐 Admin Only (allowedRoles: ['admin'])
- /admin/security
- /admin/approvals
- /admin/catalog
- /admin/priorities
- /admin/service-requests
- /admin/sla
- /integrations

## Components

### UnifiedPageGuard
**Location:** `/components/guards/unified-page-guard.tsx`

This component:
1. Wraps the entire dashboard
2. Checks EVERY page navigation
3. Reads from config file
4. Shows loading/auth/denied states
5. Automatically applied to ALL dashboard pages

### Where It's Applied
**File:** `/app/(dashboard)/layout.tsx`

```tsx
<UnifiedPageGuard>
  <DashboardContent>{children}</DashboardContent>
</UnifiedPageGuard>
```

Every page under `/app/(dashboard)/` is automatically protected!

## User Roles (from Supabase)

1. **admin** - Full system access
2. **manager** - Management access  
3. **agent** - Support/service delivery
4. **user** - Basic access

## Benefits

✅ **Centralized** - One file controls everything
✅ **Simple** - Edit config, access changes everywhere
✅ **Type-safe** - TypeScript ensures correctness
✅ **Flexible** - Easy to add new roles/pages
✅ **Automatic** - Layout applies guard to all pages
✅ **Database-driven** - Roles come from Supabase

## Testing

### As Admin
- ✅ Can access ALL pages

### As Manager
- ✅ Can access Service Management pages
- ❌ Cannot access Admin pages (if not in allowedRoles)

### As Agent/User
- ✅ Can access Service Management pages
- ❌ Cannot access Admin pages

## How to Add a New Role

1. **Add to Supabase** (roles table)
2. **Update config** (`/config/page-access.config.ts`):
   ```typescript
   export type UserRole = 'admin' | 'manager' | 'agent' | 'user' | 'newrole'
   ```
3. **Assign pages** to the new role in `PAGE_ACCESS_CONFIG`

Done! The system automatically handles it.

## How to Add a New Page

Just add to `PAGE_ACCESS_CONFIG`:
```typescript
{
  path: '/new-feature',
  label: 'New Feature',
  allowedRoles: ['admin', 'manager'], // Who can access
  requiresPermission: 'feature.view', // Optional permission check
}
```

No need to add guards to the page itself! The layout handles it.

## Debugging

If a user can't access a page:
1. Check their role in Supabase `profiles` table
2. Check `PAGE_ACCESS_CONFIG` for that page
3. Check if their role is in `allowedRoles[]`
4. Check if they have required permission (if specified)

## Future Enhancements

You can easily add:
- Department-based access
- Team-based access
- Time-based access (business hours only)
- Feature flags
- A/B testing access

All in the config file!
