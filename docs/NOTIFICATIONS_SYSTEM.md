# Notifications System Documentation

## Overview

The Kroolo BSM notification system provides real-time notifications for ticket assignments, workflow approvals, SLA breaches, and system events. Built with Supabase Realtime for live updates.

---

## Architecture

### Components

1. **Database Table**: `notifications` - Stores all notification records
2. **Hook**: `hooks/use-notifications.ts` - Database CRUD operations & realtime subscriptions
3. **Context**: `lib/contexts/notification-context.tsx` - UI state management
4. **Utility**: `lib/notifications/send-notification.ts` - Helper functions to create notifications
5. **UI Components**:
   - `components/notifications/notification-bell.tsx` - Header bell with dropdown
   - `app/(dashboard)/notifications/page.tsx` - Full notifications page

### Data Flow

```
Event (ticket assigned) 
  → sendNotification() 
  → Insert to DB 
  → Supabase Realtime triggers 
  → useNotifications hook receives update 
  → Context updates UI 
  → Bell badge shows new count
```

---

## Database Schema

```sql
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL,
  user_id uuid NOT NULL,
  type varchar NOT NULL,  -- 'ticket', 'workflow', 'system', 'info', 'success', 'user'
  title varchar NOT NULL,
  message text NOT NULL,
  read boolean DEFAULT false,
  priority varchar DEFAULT 'medium',  -- 'high', 'medium', 'low'
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### Indexes
- `idx_notifications_user_id` - Fast user lookups
- `idx_notifications_user_read` - Fast unread counts
- `idx_notifications_created_at` - Sorted retrieval

### RLS Policies
- ✅ Users can view their own notifications
- ✅ Service role can insert notifications
- ✅ Users can update their own notifications (mark as read)
- ✅ Users can delete their own notifications

---

## Usage Examples

### Creating Notifications

```typescript
import { 
  notifyTicketAssignment,
  notifyWorkflowApproval,
  notifySLABreach 
} from '@/lib/notifications/send-notification'

// Ticket assignment
await notifyTicketAssignment({
  assigneeId: 'user-uuid',
  organizationId: 'org-uuid',
  ticketNumber: 'TKT-2024-001',
  ticketTitle: 'Password reset request',
  assignedBy: 'John Doe',
  priority: 'high'
})

// Workflow approval
await notifyWorkflowApproval({
  approverId: 'user-uuid',
  organizationId: 'org-uuid',
  workflowName: 'Employee Onboarding',
  workflowId: 'workflow-uuid',
  requestedBy: 'Jane Smith'
})

// SLA breach warning
await notifySLABreach({
  userId: 'user-uuid',
  organizationId: 'org-uuid',
  ticketNumber: 'TKT-2024-002',
  ticketTitle: 'Critical server down',
  timeRemaining: '2 hours'
})
```

### Using in Components

```typescript
import { useNotifications } from '@/lib/contexts/notification-context'

function MyComponent() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    clearNotification
  } = useNotifications()

  return (
    <div>
      <p>Unread: {unreadCount}</p>
      {notifications.map(notification => (
        <div key={notification.id}>
          <h3>{notification.title}</h3>
          <p>{notification.message}</p>
          <button onClick={() => markAsRead(notification.id)}>
            Mark as read
          </button>
        </div>
      ))}
    </div>
  )
}
```

---

## Notification Types

| Type | Use Case | Priority | Example |
|------|----------|----------|---------|
| `ticket` | Ticket assignments, updates | High/Medium | "Ticket assigned to you" |
| `workflow` | Workflow approvals, completions | Medium | "Approval required" |
| `system` | SLA breaches, maintenance | High | "SLA breach warning" |
| `info` | General information | Low | "System update available" |
| `success` | Successful operations | Low | "Workflow completed" |
| `user` | User-related events | Low | "New team member added" |

---

## API Reference

### `useNotifications()` Hook

```typescript
interface UseNotificationsReturn {
  notifications: Notification[]
  loading: boolean
  error: string | null
  unreadCount: number
  fetchNotifications: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  clearNotification: (id: string) => Promise<void>
  clearAllNotifications: () => Promise<void>
  createNotification: (notification) => Promise<Notification | null>
}
```

### Notification Helper Functions

#### `notifyTicketAssignment()`
```typescript
notifyTicketAssignment({
  assigneeId: string
  organizationId: string
  ticketNumber: string
  ticketTitle: string
  assignedBy?: string
  priority?: 'high' | 'medium' | 'low'
})
```

#### `notifyTicketUpdate()`
```typescript
notifyTicketUpdate({
  userId: string
  organizationId: string
  ticketNumber: string
  ticketTitle: string
  updateType: string
  updatedBy?: string
})
```

#### `notifyTicketResolved()`
```typescript
notifyTicketResolved({
  userId: string
  organizationId: string
  ticketNumber: string
  ticketTitle: string
  resolvedBy?: string
})
```

#### `notifyWorkflowApproval()`
```typescript
notifyWorkflowApproval({
  approverId: string
  organizationId: string
  workflowName: string
  workflowId: string
  requestedBy?: string
})
```

#### `notifyWorkflowCompleted()`
```typescript
notifyWorkflowCompleted({
  userId: string
  organizationId: string
  workflowName: string
  workflowId: string
})
```

#### `notifyWorkflowAssignment()`
```typescript
notifyWorkflowAssignment({
  assigneeId: string
  organizationId: string
  workflowName: string
  workflowId: string
  assignedBy?: string
})
```

#### `notifySLABreach()`
```typescript
notifySLABreach({
  userId: string
  organizationId: string
  ticketNumber: string
  ticketTitle: string
  timeRemaining: string
})
```

---

## Integration Points

### Where to Add Notifications

1. **Ticket Assignment** - `app/api/tickets/[id]/route.ts` (PATCH endpoint)
2. **Ticket Updates** - `app/api/tickets/[id]/route.ts` (PATCH endpoint)
3. **Ticket Resolution** - `app/api/tickets/[id]/route.ts` (PATCH when status='resolved')
4. **Workflow Approvals** - Service request approval endpoints
5. **Workflow Completions** - Workflow engine execution completion
6. **SLA Breaches** - Scheduled job or trigger (future implementation)

### Example Integration

```typescript
// In app/api/tickets/[id]/route.ts
import { notifyTicketAssignment } from '@/lib/notifications/send-notification'

export async function PATCH(req: Request) {
  const updates = await req.json()
  
  // Update ticket in database
  const { data: ticket } = await supabase
    .from('tickets')
    .update(updates)
    .eq('id', ticketId)
    .select()
    .single()
  
  // Send notification if assignee changed
  if (updates.assignee_id && updates.assignee_id !== ticket.assignee_id) {
    await notifyTicketAssignment({
      assigneeId: updates.assignee_id,
      organizationId: ticket.organization_id,
      ticketNumber: ticket.ticket_number,
      ticketTitle: ticket.title,
      priority: ticket.priority
    })
  }
  
  return Response.json({ ticket })
}
```

---

## Testing

### Manual Testing

1. **Create a notification**:
   ```typescript
   import { sendNotification } from '@/lib/notifications/send-notification'
   
   await sendNotification({
     userId: 'your-user-id',
     organizationId: 'your-org-id',
     type: 'info',
     title: 'Test Notification',
     message: 'This is a test',
     priority: 'medium'
   })
   ```

2. **Check the bell** - Should show unread badge

3. **Mark as read** - Badge count should decrease

4. **Open another tab** - Should see realtime updates

### Database Testing

```bash
# Run database CRUD tests
npm run test:db
```

The notifications table will be automatically tested for:
- ✅ CREATE - Insert test notifications
- ✅ READ - Query notifications
- ✅ UPDATE - Mark as read
- ✅ DELETE - Clear notifications

---

## Realtime Subscriptions

The system uses Supabase Realtime to automatically update the UI:

```typescript
// Automatically set up in useNotifications hook
supabase
  .channel(`notifications:user_id=eq.${userId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'notifications',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    // Handle INSERT, UPDATE, DELETE events
  })
  .subscribe()
```

### Events Handled
- `INSERT` - New notification appears immediately
- `UPDATE` - Read status changes instantly
- `DELETE` - Notification removed from UI

---

## Performance Considerations

### Optimizations
1. **Limit 100** - Only fetch last 100 notifications
2. **Indexed queries** - Fast lookups with proper indexes
3. **Realtime filtering** - Only subscribe to user's notifications
4. **Memoization** - Filtered notifications cached with `useMemo`

### Cleanup
- Old notifications should be archived/deleted periodically
- Consider retention policy (e.g., 30 days)

---

## Future Enhancements

1. **Email Notifications** - Send email for high-priority notifications
2. **Push Notifications** - Browser/mobile push notifications
3. **Notification Preferences** - User settings for notification types
4. **Bulk Operations** - Archive, snooze, batch actions
5. **Notification History** - View archived notifications
6. **Smart Grouping** - Group similar notifications
7. **Scheduled Notifications** - Queue for later delivery

---

## Troubleshooting

### Notifications not appearing?
1. Check if user is logged in (`useAuth` hook)
2. Verify organization_id is set
3. Check RLS policies in Supabase dashboard
4. Look for errors in browser console
5. Verify Realtime is enabled in Supabase project

### Realtime not working?
1. Check Supabase Realtime is enabled
2. Verify channel subscription is active
3. Check network tab for websocket connection
4. Ensure RLS policies allow SELECT

### Badge count incorrect?
1. Refresh notifications manually
2. Check for duplicate subscriptions
3. Verify unread count calculation

---

## Related Documentation

- [Toast System](./TOAST_SYSTEM.md) - For user action feedback
- [Authentication](./AUTHENTICATION.md) - User/org context
- [Database Schema](../database-config/db.sql) - Full schema

---

## Migration Notes

### From Mock Data to Database
- ✅ Mock data removed from context
- ✅ Real Supabase queries implemented
- ✅ Realtime subscriptions active
- ✅ Persistence working
- ✅ UI components backward compatible

### Breaking Changes
- `notification.id` changed from `number` to `string` (UUID)
- `addNotification()` signature changed (no longer needs `id`)

---

**Status**: ✅ **Production Ready**

The notification system is fully implemented with database persistence, real-time updates, and comprehensive helper functions for common use cases.
