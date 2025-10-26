# User Status Persistence Fix

## Problem
User status was resetting to "Online" on every login instead of persisting the last set status (e.g., "Do Not Disturb", "Away", etc.).

## Root Cause
The `Profile` interface in `auth-context.tsx` was missing the `status` and `status_color` fields that exist in the database schema. This meant that when the profile was fetched from the database, these fields were not being loaded into the application state.

## Solution

### 1. Updated Profile Interface
Added `status` and `status_color` fields to the Profile interface in `lib/contexts/auth-context.tsx`:

```typescript
interface Profile {
  // ... existing fields
  status: string
  status_color: string
  // ...
}
```

### 2. Enhanced Status Display
Added a status indicator dot on the avatar with hover tooltip in `components/layout/avatar-menu.tsx`:

- **Visual Indicator**: Small colored dot at the bottom-right of the avatar showing current status
- **Hover Tooltip**: Shows the status label (e.g., "Online", "Do Not Disturb") when hovering over the avatar
- **Consistent UI**: The status color matches the selected status everywhere in the UI

### 3. Status Persistence Flow

The status now persists correctly through this flow:

1. **User sets status** → Saved to `profiles` table (`status` and `status_color` columns)
2. **User logs out** → Status remains in database
3. **User logs back in** → Profile is fetched with status fields
4. **Status is displayed** → Shows the previously saved status, not "Online"

## Database Schema Reference

From `database-config/db.sql`:
```sql
CREATE TABLE public.profiles (
  -- ... other fields
  status character varying DEFAULT 'Online'::character varying,
  status_color character varying DEFAULT '#16a34a'::character varying,
  -- ... other fields
);
```

## Custom Statuses
The system also supports custom statuses saved in the `user_custom_statuses` table:
- Users can create personalized status messages
- Recent custom statuses are shown in the status dropdown
- Custom statuses are reusable and sorted by last used time

## UI Features

### Avatar Status Indicator
- Small colored dot on avatar (bottom-right corner)
- Color matches the selected status
- Border to separate from avatar background

### Hover Tooltip
Shows on avatar hover:
- Status color indicator
- Status label text
- Clean, minimal design

### Status Dropdown
Inside the avatar menu:
- Current status displayed with color indicator
- "Set a status" button to change status
- Predefined options: Online, Busy, Away, Do Not Disturb, Appear Offline
- Custom status option with color picker
- Recent custom statuses shown below predefined options

## Testing Checklist

- [x] Set status to "Do Not Disturb"
- [x] Log out
- [x] Log back in
- [x] Verify status is still "Do Not Disturb"
- [x] Hover over avatar to see status tooltip
- [x] Check status indicator dot shows correct color
- [x] Verify status displays inside avatar dropdown
- [x] Create custom status and verify it persists
- [x] Switch between statuses and verify persistence

## Related Files

- `lib/contexts/auth-context.tsx` - Profile interface updated
- `components/layout/avatar-menu.tsx` - Status display and persistence logic
- `database-config/db.sql` - Database schema reference
- `components/ui/tooltip.tsx` - Tooltip component for status display
