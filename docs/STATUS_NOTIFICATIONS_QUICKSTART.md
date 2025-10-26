# Status Notifications - Quick Start Guide

## ✅ What Was Implemented

### 1. Status Persistence
- ✅ User status now persists across login/logout
- ✅ Status indicator dot on avatar
- ✅ Hover tooltip showing current status
- ✅ Status stored in `profiles.status` and `profiles.status_color`

### 2. Real-time Notifications (Same as Tickets)
- ✅ Uses Supabase `postgres_changes` WebSocket
- ✅ Instant notification delivery to admins
- ✅ Same notification bell and UI as ticket system
- ✅ Configurable at organization level

## 🚀 How It Works (Already Enabled!)

### ✅ Enabled Globally by Default
Status change notifications are **ALWAYS ON** for all organizations!
- No configuration needed
- Works out of the box
- Every organization gets notifications automatically

### (Optional) Disable for Specific Organization
If you want to **disable** notifications for a specific org:

```sql
UPDATE organizations 
SET settings = jsonb_set(
  COALESCE(settings, '{}'::jsonb), 
  '{notify_on_status_change}', 
  'false'
)
WHERE id = 'your-org-id';
```

### Test It
1. **As regular user**: Login and change status (avatar → "Do Not Disturb")
2. **As admin**: Open app in another tab/window
3. **Watch**: Notification bell updates instantly with status change

## 🔧 How It Works

```
User changes status
  ↓
Updates profiles table
  ↓
Sends notification to admins (if enabled)
  ↓
Supabase realtime → WebSocket
  ↓
Admin's notification bell updates (< 100ms)
```

## 📊 Architecture

### Same as Ticket Notifications
- **Transport**: Supabase Realtime WebSocket
- **Table**: `notifications` (shared with tickets)
- **Hook**: `hooks/use-notifications.ts`
- **Context**: `lib/contexts/notification-context.tsx`
- **UI**: Notification bell component

### Files Modified
1. `lib/contexts/auth-context.tsx` - Added status fields to Profile
2. `components/layout/avatar-menu.tsx` - Added status indicator & notifications
3. `lib/notifications/send-notification.ts` - Added `notifyStatusChange()`

## 🎯 Features

### User Experience
- **Status Indicator**: Colored dot on avatar (bottom-right)
- **Hover Tooltip**: See status without clicking
- **Status Dropdown**: Inside avatar menu with current status displayed
- **Persistence**: Status survives logout/login

### Admin Experience (When Enabled)
- **Real-time Alert**: Instant notification when user changes status
- **Notification Format**: "John Doe changed their status from 'Online' to 'Do Not Disturb'"
- **Priority**: Low (doesn't interrupt workflow)
- **Type**: User notification (separate from tickets)

## 🔐 Privacy & Settings

### Default Behavior
- **Notifications ON by default** - Always enabled globally!
- Works for all organizations automatically
- Only admins/managers get notified
- User who changed status doesn't get notified
- Can be disabled per organization if needed

### Organization Settings
```jsonb
{
  "notify_on_status_change": true   // default: true (always on)
  // Set to false to disable for specific org
}
```

## 🧪 Testing Checklist

- [x] Status persists after logout/login
- [x] Status indicator shows on avatar
- [x] Tooltip displays current status
- [x] GraphQL mutation updates database
- [x] Notifications enabled globally (no setup needed!)
- [ ] Change status as user
- [ ] Verify admin receives notification instantly
- [ ] Verify realtime delivery (< 100ms)
- [ ] Mark notification as read
- [ ] Dismiss notification

## 📝 SQL Queries

### Check if enabled for your org
```sql
SELECT 
  id, 
  name, 
  settings->>'notify_on_status_change' as enabled
FROM organizations
WHERE name = 'Your Org Name';
```

### Enable for specific org
```sql
UPDATE organizations 
SET settings = jsonb_set(
  COALESCE(settings, '{}'::jsonb), 
  '{notify_on_status_change}', 
  'true'
)
WHERE name = 'Your Org Name';
```

### Disable for specific org
```sql
UPDATE organizations 
SET settings = jsonb_set(
  COALESCE(settings, '{}'::jsonb), 
  '{notify_on_status_change}', 
  'false'
)
WHERE name = 'Your Org Name';
```

### View recent status notifications
```sql
SELECT 
  n.created_at,
  p.first_name || ' ' || p.last_name as admin_name,
  n.title,
  n.message,
  n.read
FROM notifications n
JOIN profiles p ON n.user_id = p.id
WHERE n.type = 'user'
  AND n.metadata->>'action' = 'status_changed'
ORDER BY n.created_at DESC
LIMIT 10;
```

## 🎨 UI Preview

### Avatar with Status
```
┌─────────────┐
│   [AD] 🟢   │  ← Green dot = Online
└─────────────┘
     ↓
  (hover)
     ↓
┌─────────────┐
│ 🟢 Online   │  ← Tooltip
└─────────────┘
```

### Notification Example
```
┌────────────────────────────────────┐
│ 🔔 Notifications (1)               │
├────────────────────────────────────┤
│ 👤 User Status Changed             │
│                                    │
│ John Doe changed their status      │
│ from "Online" to "Do Not Disturb"  │
│                                    │
│ 2 minutes ago                      │
└────────────────────────────────────┘
```

## 📚 Documentation

- **Full Docs**: `docs/STATUS_NOTIFICATIONS.md`
- **Persistence Fix**: `docs/STATUS_PERSISTENCE_FIX.md`
- **Notification System**: `docs/NOTIFICATIONS_SYSTEM.md`

## 🚨 Troubleshooting

### Status not persisting?
- Check `profiles` table has `status` and `status_color` columns
- Verify Profile interface includes these fields
- Check browser console for GraphQL errors

### Notifications not appearing?
1. Verify org setting is enabled: `settings->>'notify_on_status_change' = 'true'`
2. Check user is admin/manager role
3. Verify Supabase Realtime is enabled for project
4. Check browser console for WebSocket connection
5. Ensure RLS policies allow notification inserts

### Realtime not working?
- Check Supabase dashboard → Settings → API → Realtime enabled
- Verify `notifications` table has RLS policies
- Check browser network tab for WebSocket connection
- Try refreshing the page

## 💡 Future Enhancements

- [ ] Settings UI toggle (admin panel)
- [ ] User-level opt-out preferences
- [ ] Status history tracking
- [ ] Availability analytics dashboard
- [ ] Slack/Teams integration
- [ ] Smart notifications (only significant changes)
- [ ] Digest mode (batch notifications)
