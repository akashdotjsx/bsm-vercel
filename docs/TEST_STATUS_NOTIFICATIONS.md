# Test Status Notifications - Simple Guide

## ✅ It's Already Enabled!

Status change notifications are **ON by default** for **ALL organizations**. No setup needed!

## 🧪 How to Test

### Step 1: Open Two Browser Windows

**Window 1**: Login as a **regular user** (any non-admin)
**Window 2**: Login as an **admin or manager**

### Step 2: Change Status (Window 1 - Regular User)

1. Click your avatar in the top-right corner
2. You'll see: `Status: 🟢 Online`
3. Click **"Set a status"**
4. Select **"Do Not Disturb"** (red)
5. Status should update instantly

### Step 3: Watch Notification (Window 2 - Admin)

1. Look at the notification bell (🔔) in the top-right
2. **Within 1 second**, you should see:
   - Bell badge increments (shows "1")
   - New notification appears
   - Message: "User changed their status from 'Online' to 'Do Not Disturb'"

### Step 4: Verify Real-time

Try changing status multiple times:
- **Online** → **Away** → **Busy** → **Offline**

Each change should trigger an instant notification to the admin!

## 🎯 What You Should See

### User's View (After Status Change)
```
Avatar:  [AD] 🔴  ← Red dot for "Do Not Disturb"
Hover:   🔴 Do Not Disturb
```

### Admin's View (Notification)
```
🔔 (1) ← New notification badge

Notification Content:
┌──────────────────────────────────────┐
│ 👤 User Status Changed               │
│                                      │
│ John Doe changed their status        │
│ from "Online" to "Do Not Disturb"    │
│                                      │
│ Just now                             │
└──────────────────────────────────────┘
```

## ✅ Success Criteria

- [x] Status changes immediately in UI
- [x] Status persists after refresh/logout
- [x] Admin receives notification **< 1 second**
- [x] Notification shows old and new status
- [x] Status indicator dot color updates
- [x] Hover tooltip shows correct status

## 🚨 Troubleshooting

### Notification not appearing?

1. **Check user role**: Only admins/managers receive notifications
   ```sql
   SELECT email, role FROM profiles WHERE email = 'your-admin-email';
   ```
   Should show `role = 'admin'` or `role = 'manager'`

2. **Check Supabase Realtime**: Dashboard → Settings → API → Realtime should be **enabled**

3. **Check browser console**: Look for WebSocket connection errors

4. **Refresh the page**: Sometimes WebSocket needs to reconnect

### Status not persisting?

- Clear browser cache
- Check browser console for errors
- Verify database connection

## 📊 Who Gets Notified?

| User Role | Receives Notifications? |
|-----------|------------------------|
| Admin     | ✅ YES                 |
| Manager   | ✅ YES                 |
| Agent     | ❌ NO                  |
| User      | ❌ NO                  |

**Note**: The user who changed their status does NOT receive a notification (no self-notification).

## 🔧 Optional: Disable for Your Organization

If you want to turn OFF notifications for your organization:

```sql
UPDATE organizations 
SET settings = jsonb_set(
  COALESCE(settings, '{}'::jsonb), 
  '{notify_on_status_change}', 
  'false'
)
WHERE id = 'your-organization-id';
```

To find your organization ID:
```sql
SELECT id, name FROM organizations;
```

## 🎉 That's It!

The feature is **live and working** right now. Just test it with two users as described above!
