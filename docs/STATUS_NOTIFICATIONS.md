# Status Change Notifications with Supabase Realtime

## Overview
User status changes now trigger real-time notifications to admins/managers when enabled at the organization level. This uses the same Supabase realtime infrastructure as the ticket notification system.

## How It Works

### 1. **Supabase Realtime Subscription** (Same as Tickets)
The notification system uses Supabase's `postgres_changes` listener:

```typescript
// From hooks/use-notifications.ts (lines 199-225)
const realtimeChannel = supabase
  .channel(`notifications:user_id=eq.${user.id}`)
  .on(
    'postgres_changes',
    {
      event: '*',  // INSERT, UPDATE, DELETE
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${user.id}`,
    },
    (payload) => {
      // Real-time update handling
      if (payload.eventType === 'INSERT') {
        setNotifications(prev => [payload.new as Notification, ...prev])
      }
      // ... UPDATE and DELETE handling
    }
  )
  .subscribe()
```

### 2. **Status Change Flow**

```
User changes status (avatar-menu.tsx)
  ↓
Update profiles table (GraphQL mutation)
  ↓
Call notifyStatusChange() function
  ↓
Query admins from profiles table
  ↓
Insert notifications to database
  ↓
Supabase Realtime triggers postgres_changes
  ↓
Admins' notification hooks receive INSERT event
  ↓
Notification bell updates instantly
```

### 3. **Database Tables Involved**

#### `profiles` Table
```sql
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  organization_id uuid,
  status character varying DEFAULT 'Online',
  status_color character varying DEFAULT '#16a34a',
  -- ... other fields
);
```

#### `notifications` Table (Same as tickets)
```sql
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL,
  user_id uuid NOT NULL,
  type varchar CHECK (type IN ('ticket', 'workflow', 'system', 'info', 'success', 'user')),
  title varchar NOT NULL,
  message text NOT NULL,
  read boolean DEFAULT false,
  priority varchar DEFAULT 'medium',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
```

## Implementation Details

### Avatar Menu Component
**File**: `components/layout/avatar-menu.tsx`

When a user changes their status:

```typescript
const handleStatusChange = async (newStatus, isCustom) => {
  // 1. Save old status
  const oldStatus = status.label
  
  // 2. Update UI immediately
  setStatus(newStatus)
  
  // 3. Update database via GraphQL
  await updateStatusMutation.mutateAsync({
    userId: profile.id,
    status: newStatus.label,
    statusColor: newStatus.color,
  })
  
  // 4. Check org settings for notification preference
  const notifyAdmins = organization?.settings?.notify_on_status_change === true
  
  // 5. Send notifications to admins if enabled
  if (oldStatus !== newStatus.label) {
    await notifyStatusChange({
      userId: profile.id,
      userName: `${profile.first_name} ${profile.last_name}`,
      organizationId: organization.id,
      oldStatus: oldStatus,
      newStatus: newStatus.label,
      newStatusColor: newStatus.color,
      notifyAdmins: notifyAdmins,
    })
  }
}
```

### Notification Helper Function
**File**: `lib/notifications/send-notification.ts`

```typescript
export async function notifyStatusChange(params: {
  userId: string
  userName: string
  organizationId: string
  oldStatus: string
  newStatus: string
  newStatusColor: string
  notifyAdmins?: boolean
}) {
  if (params.notifyAdmins) {
    // 1. Query all admins/managers in the org
    const { data: admins } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .eq('organization_id', params.organizationId)
      .in('role', ['admin', 'manager'])
      .neq('id', params.userId) // Don't notify self
      .eq('is_active', true)
    
    // 2. Insert notification for each admin
    const notificationPromises = admins.map(admin => 
      sendNotification({
        userId: admin.id,
        organizationId: params.organizationId,
        type: 'user',
        title: 'User Status Changed',
        message: `${params.userName} changed their status from "${params.oldStatus}" to "${params.newStatus}"`,
        priority: 'low',
        metadata: {
          changedByUserId: params.userId,
          oldStatus: params.oldStatus,
          newStatus: params.newStatus,
          action: 'status_changed',
        },
      })
    )
    
    await Promise.all(notificationPromises)
  }
}
```

## Organization Settings

### Enable Status Notifications
To enable status change notifications for an organization, update the `settings` JSONB field:

```sql
UPDATE organizations 
SET settings = jsonb_set(
  settings, 
  '{notify_on_status_change}', 
  'true'
)
WHERE id = 'your-org-id';
```

### Via Supabase Dashboard
1. Navigate to Table Editor → `organizations`
2. Find your organization
3. Edit the `settings` column (JSONB)
4. Add: `{ "notify_on_status_change": true }`

### Via Settings UI (Future Enhancement)
Add a toggle in the admin settings panel:
- **Setting**: "Notify admins when users change status"
- **Path**: Settings → Notifications → Status Changes
- **Default**: `false` (opt-in for privacy)

## Real-time Behavior

### Exactly Like Ticket Notifications

| Event | Trigger | Notification Appears |
|-------|---------|---------------------|
| User changes status | Profile updated | **Instant** via Supabase realtime |
| Admin opens notification bell | Page load | Queries database for unread |
| Admin marks as read | Update query | Real-time UPDATE event |
| Admin dismisses notification | Delete query | Real-time DELETE event |

### Performance
- **Latency**: <100ms (Supabase WebSocket)
- **Reliability**: Same as Supabase Auth session
- **Scalability**: Handles 1000s of concurrent connections

## Testing

### Manual Test
1. **Setup**: Enable status notifications for your org
   ```sql
   UPDATE organizations 
   SET settings = '{"notify_on_status_change": true}'
   WHERE id = 'your-org-id';
   ```

2. **Test as Regular User**:
   - Login as regular user
   - Click avatar → Set status → "Do Not Disturb"
   - Change status to "Away"

3. **Verify as Admin**:
   - Login as admin/manager in another tab
   - Watch notification bell
   - Should see notification appear instantly: 
     "User Status Changed: John Doe changed their status from 'Do Not Disturb' to 'Away'"

### Automated Test (Future)
```typescript
describe('Status Change Notifications', () => {
  it('should notify admins when user changes status', async () => {
    // 1. Enable org setting
    // 2. Change user status
    // 3. Verify notification created
    // 4. Verify realtime event received
  })
})
```

## Privacy Considerations

### Default Behavior
- **Notifications are DISABLED by default** (opt-in)
- Organizations must explicitly enable via settings
- Only admins/managers receive notifications
- The user who changed status doesn't get notified

### Use Cases

**When to Enable**:
- ✅ Compliance/regulatory requirements
- ✅ Time tracking for billable hours
- ✅ Availability monitoring for support teams
- ✅ Workforce management

**When to Disable** (default):
- ✅ Privacy-focused organizations
- ✅ Small teams with trust-based culture
- ✅ Non-critical status changes

## Architecture Comparison: Tickets vs Status

| Feature | Ticket Notifications | Status Notifications |
|---------|---------------------|---------------------|
| **Transport** | Supabase Realtime | Supabase Realtime ✅ |
| **Protocol** | WebSocket | WebSocket ✅ |
| **Event Type** | `postgres_changes` | `postgres_changes` ✅ |
| **Table** | `notifications` | `notifications` ✅ |
| **Hook** | `use-notifications.ts` | `use-notifications.ts` ✅ |
| **Context** | `notification-context.tsx` | `notification-context.tsx` ✅ |
| **UI** | Notification bell | Notification bell ✅ |
| **Priority** | High/Medium/Low | Low (default) |
| **Type** | `ticket` | `user` |
| **Opt-out** | User preferences | Org settings |

## Related Files

- `hooks/use-notifications.ts` - Supabase realtime subscription
- `lib/notifications/send-notification.ts` - Notification helpers
- `lib/contexts/notification-context.tsx` - UI state management
- `components/layout/avatar-menu.tsx` - Status change handler
- `components/notifications/notification-bell.tsx` - Notification UI
- `database-config/db.sql` - Schema definitions

## Future Enhancements

1. **User Preferences**: Allow admins to opt-out individually
2. **Digest Mode**: Batch status changes into hourly/daily digests
3. **Status History**: Track status changes over time
4. **Analytics**: Dashboard showing team availability patterns
5. **Integration**: Sync status with Slack/Teams
6. **Smart Notifications**: Only notify if status change is "significant" (e.g., Online → Offline)
