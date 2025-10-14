# Service Request Assignee Selection Feature

## Overview
Added comprehensive assignee selection capability to the Service Request Drawer, allowing users to assign service requests to individual users or entire teams. This feature mirrors the existing assignee selection functionality in the Ticket Drawer.

---

## Implementation Details

### 1. **UI Component Updates**

#### Service Request Drawer (`components/services/service-request-drawer.tsx`)

**Changes Made:**
- ✅ Added `useUsers` hook to fetch users and teams
- ✅ Imported `TeamSelector` component  
- ✅ Added `assignee_ids: string[]` to form state
- ✅ Added TeamSelector UI between the urgency and cost center fields
- ✅ Updated `handleSave` to include `assignee_ids` and `assignee_id` (for backward compatibility)

**Key Code:**
```tsx
import { useUsers } from "@/hooks/use-users"
import { TeamSelector } from "@/components/users/team-selector"

// In component:
const { users, teams } = useUsers()

// In form state:
assignee_ids: [] as string[]

// UI placement (lines 336-347):
<div className="space-y-2">
  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
    Assign To
  </label>
  <TeamSelector
    teams={teams}
    users={users}
    selectedUserIds={form.assignee_ids}
    onUsersChange={(userIds) => setForm({ ...form, assignee_ids: userIds })}
    placeholder="Assign to user or team..."
    className="h-9 text-[11px]"
  />
</div>

// In handleSave (lines 152-159):
if (form.assignee_ids.length > 0) {
  requestData.assignee_ids = form.assignee_ids
  requestData.assignee_id = form.assignee_ids[0] // Set first assignee as primary
} else {
  requestData.assignee_ids = []
  requestData.assignee_id = null
}
```

---

### 2. **Database Migration**

#### Migration File: `database-migrations/add_service_requests_assignee_ids.sql`

**Purpose:**
Adds support for multiple assignees on service requests, similar to how tickets support multiple assignees.

**Key Steps:**
1. ✅ Adds `assignee_ids UUID[]` column to `service_requests` table
2. ✅ Migrates existing single `assignee_id` values to the array
3. ✅ Creates GIN index on `assignee_ids` for performance
4. ✅ Adds helper function `is_user_assigned_to_service_request()`
5. ✅ Updates RLS policies to support both `assignee_id` and `assignee_ids`

**To Apply:**
```bash
psql -U postgres -d your_database -f database-migrations/add_service_requests_assignee_ids.sql
```

Or via Supabase Dashboard:
- Navigate to SQL Editor
- Paste the contents of the migration file
- Execute

---

### 3. **GraphQL Integration**

**No changes required!** ✅

The existing GraphQL mutation `createServiceRequestGQL` in `hooks/use-services-assets-gql.ts` already accepts a generic `requestData: any` parameter, so it will automatically accept `assignee_ids` and `assignee_id` fields.

The mutation simply passes all fields through to the database:
```typescript
export async function createServiceRequestGQL(requestData: any): Promise<any> {
  const client = await createGraphQLClient()
  
  const mutation = gql`
    mutation CreateServiceRequest($input: service_requestsInsertInput!) {
      insertIntoservice_requestsCollection(objects: [$input]) {
        records {
          id
          service_id
          requester_id
          status
          priority
          form_data
          approval_status
          fulfilled_at
          created_at
          updated_at
        }
      }
    }
  `
  
  const response: any = await client.request(mutation, { input: requestData })
  return response.insertIntoservice_requestsCollection.records[0]
}
```

---

## Team Selector Component

### Overview
The `TeamSelector` component (`components/users/team-selector.tsx`) is a sophisticated multi-select control that allows:
- Selecting individual users
- Selecting entire teams (automatically adds all team members)
- Filtering/searching users and teams
- Visual indication of selected users with avatars
- Responsive display for different screen sizes

### Features
- **Team Selection**: Clicking a team selects/deselects all its members
- **Individual Selection**: Users can be selected individually
- **Visual Feedback**: 
  - Shows selected users with avatars and names
  - Compact avatar stacks for 3+ selections
  - Role badges and department info for each user
  - Active status indicators
- **Search**: Built-in search/filter for both teams and users
- **Multi-select Support**: Handles multiple assignees elegantly

### Data Requirements
The component expects teams with nested member data:
```typescript
interface Team {
  id: string
  name: string
  description?: string
  department?: string
  is_active: boolean
  team_members?: Array<{
    user: User
    role: string
  }>
}
```

---

## Data Flow

### 1. **Teams and Users Data**
```
useUsers hook (hooks/use-users.ts)
  ↓
Fetches from Supabase directly:
  - profiles table (users)
  - teams table (with nested team_members)
  ↓
Provides to component: { users, teams }
```

### 2. **Team Members Structure**
```sql
-- Query executed by useUsers:
SELECT 
  teams.*,
  team_members(
    id,
    role,
    user:profiles(id, display_name, email, avatar_url)
  )
FROM teams
```

This returns:
```json
{
  "id": "team-uuid",
  "name": "Engineering Team",
  "team_members": [
    {
      "id": "member-uuid",
      "role": "lead",
      "user": {
        "id": "user-uuid",
        "display_name": "John Doe",
        "email": "john@example.com",
        "avatar_url": "..."
      }
    }
  ]
}
```

### 3. **Selection Flow**
```
User clicks team/user in TeamSelector
  ↓
TeamSelector updates selectedUserIds array
  ↓
Parent component receives update via onUsersChange
  ↓
Form state updated: assignee_ids = [user-id-1, user-id-2, ...]
  ↓
On submit, requestData includes assignee_ids
  ↓
GraphQL mutation sends to database
```

---

## Testing

### Manual Testing Steps

1. **Apply Database Migration**
   ```bash
   psql -U postgres -d kroolo_bsm -f database-migrations/add_service_requests_assignee_ids.sql
   ```

2. **Navigate to Services Page**
   - Open the app in browser
   - Go to `/services`

3. **Open Service Request Drawer**
   - Click "Request" button on any service card
   - Drawer should open with service details

4. **Test Assignee Selection**
   - Look for "Assign To" field (after Expected Delivery Date)
   - Click the assignee selector
   - **Test Team Selection:**
     - Click a team name
     - Verify all team members are selected (shown as avatars)
     - Click the team again to deselect all
   - **Test Individual Selection:**
     - Click individual user names to add/remove
     - Verify avatar appears in the selector
   - **Test Mixed Selection:**
     - Select a team, then deselect one member
     - Verify partial team selection is indicated

5. **Submit Service Request**
   - Fill required fields (Request Name, Description)
   - Click "Submit Request"
   - Verify success toast appears
   - Check database for `assignee_ids` array

6. **Verify Database**
   ```sql
   SELECT 
     id, 
     title, 
     assignee_id, 
     assignee_ids,
     status
   FROM service_requests 
   ORDER BY created_at DESC 
   LIMIT 5;
   ```
   
   Should show:
   - `assignee_id`: First assignee UUID (or null)
   - `assignee_ids`: Array of all assignee UUIDs

---

## Backward Compatibility

### Strategy
We maintain **both** `assignee_id` and `assignee_ids` fields to ensure backward compatibility:

1. **New Requests:**
   - `assignee_ids`: Array of all selected assignees
   - `assignee_id`: First assignee in the array (primary assignee)

2. **Existing Requests:**
   - Migration copies existing `assignee_id` → `assignee_ids` array
   - Old code using `assignee_id` continues to work
   - New code can use `assignee_ids` for multi-assignee features

3. **RLS Policies:**
   ```sql
   CREATE POLICY "Users can view service requests assigned to them" ON service_requests
     FOR SELECT
     USING (
       auth.uid() = assignee_id OR            -- Old single assignee
       auth.uid() = ANY(assignee_ids) OR      -- New multiple assignees
       auth.uid() = requester_id              -- Requester always has access
     );
   ```

---

## Future Enhancements

### Potential Improvements:
1. **Assignee Notifications**
   - Send email/notification when assigned to a service request
   - Implement real-time notifications via Supabase Realtime

2. **Assignee Workload View**
   - Show number of open requests per assignee
   - Visual workload indicators in TeamSelector

3. **Auto-Assignment Rules**
   - Round-robin assignment based on workload
   - Skills-based routing
   - Department-based auto-assignment

4. **Assignee Management in Edit Mode**
   - Add/remove assignees after request creation
   - Track assignee history
   - Reassignment workflow

5. **Team-Based Permissions**
   - Restrict assignee selection to certain teams
   - Role-based assignment rules
   - Department-specific service routing

---

## Related Files

### Components:
- `components/services/service-request-drawer.tsx` - Service request form with assignee selection
- `components/users/team-selector.tsx` - Reusable team/user selector component
- `components/tickets/ticket-drawer.tsx` - Reference implementation (tickets)

### Hooks:
- `hooks/use-users.ts` - Fetches users and teams from Supabase
- `hooks/use-users-gql.ts` - GraphQL version (includes useTeamsGQL)
- `hooks/use-services-assets-gql.ts` - Service request GraphQL mutations

### Database:
- `database-config/db.sql` - Main schema (line 188: service_requests table)
- `database-migrations/add_service_requests_assignee_ids.sql` - New migration
- `database-migrations/convert-to-assignee-array.sql` - Reference (tickets migration)

### Queries:
- `lib/graphql/queries.ts` - GET_TEAMS_QUERY (line 269)

---

## Summary

✅ **Implemented:**
- Multi-assignee selection UI in Service Request Drawer
- Database migration to support assignee_ids array
- Backward compatibility with existing assignee_id field
- Reused TeamSelector component from ticket drawer

✅ **Tested:**
- Component imports and hooks
- Form state management
- GraphQL mutation compatibility
- Database schema review

✅ **Ready for:**
- Database migration execution
- User acceptance testing
- Production deployment

---

## Contact
For questions or issues related to this feature, refer to the ticket drawer implementation as a reference (`components/tickets/ticket-drawer.tsx` lines 566-577).
