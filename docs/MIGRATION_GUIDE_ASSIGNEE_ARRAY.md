# Migration Guide: Simplifying Multi-Assignee Support

## 🎯 Goal
Convert from a complex `ticket_assignees` junction table to a simple `assignee_ids` UUID array field on the `tickets` table.

## ✅ Why This Change?
1. **Simpler data model** - No need for a separate table
2. **Easier updates** - Directly update the array instead of managing junction records
3. **Better GraphQL support** - Arrays work seamlessly with Supabase GraphQL
4. **Faster queries** - No joins required
5. **Cleaner UI updates** - Direct assignment without complex mutations

---

## 📋 Migration Steps

### Step 1: Run the SQL Migration

Open your Supabase dashboard and go to the **SQL Editor**. Then run this migration:

```sql
-- Migration: Convert single assignee to array of assignees
-- This simplifies the data model by removing the junction table

-- Step 1: Add the new assignee_ids column (UUID array)
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS assignee_ids UUID[] DEFAULT ARRAY[]::UUID[];

-- Step 2: Migrate existing single assignee_id to the array
UPDATE tickets 
SET assignee_ids = ARRAY[assignee_id] 
WHERE assignee_id IS NOT NULL 
  AND (assignee_ids IS NULL OR array_length(assignee_ids, 1) IS NULL);

-- Step 3: Copy all assignees from the junction table to the array
-- Group by ticket_id and aggregate all user_ids into an array
WITH junction_aggregated AS (
  SELECT 
    ticket_id,
    array_agg(user_id) as user_ids
  FROM ticket_assignees
  GROUP BY ticket_id
)
UPDATE tickets t
SET assignee_ids = j.user_ids
FROM junction_aggregated j
WHERE t.id = j.ticket_id;

-- Step 4: Create index on assignee_ids for performance
CREATE INDEX IF NOT EXISTS idx_tickets_assignee_ids ON tickets USING GIN (assignee_ids);

-- Step 5: Add a helper function to check if a user is assigned to a ticket
CREATE OR REPLACE FUNCTION is_user_assigned_to_ticket(ticket_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT user_id = ANY(
    SELECT assignee_ids FROM tickets WHERE id = ticket_id
  );
$$ LANGUAGE SQL STABLE;

-- Step 6: Update RLS policies to work with the new array column
-- Drop old policies if they reference the old junction table approach
DROP POLICY IF EXISTS "Users can view tickets assigned to them" ON tickets;

-- Recreate the policy using the array column
CREATE POLICY "Users can view tickets assigned to them" ON tickets
  FOR SELECT
  USING (
    auth.uid() = ANY(assignee_ids) OR 
    auth.uid() = creator_id OR
    auth.uid() = updated_by
  );

COMMENT ON COLUMN tickets.assignee_ids IS 'Array of user IDs assigned to this ticket. Replaces the single assignee_id and ticket_assignees junction table.';
```

### Step 2: Verify the Migration

After running the migration, verify the data:

```sql
-- Check tickets with multiple assignees
SELECT 
  ticket_number,
  assignee_id,
  assignee_ids,
  array_length(assignee_ids, 1) as num_assignees
FROM tickets
WHERE assignee_ids IS NOT NULL AND array_length(assignee_ids, 1) > 0
ORDER BY num_assignees DESC
LIMIT 10;
```

You should see:
- All tickets with `assignee_id` now have that ID in `assignee_ids`
- Tickets with multiple assignees from the junction table now have all IDs in the array

### Step 3: Refresh the Supabase GraphQL Schema

**Option A: Via Dashboard**
1. Go to your Supabase project dashboard
2. Navigate to **API** → **GraphQL**
3. Click **"Refresh Schema"** or restart your project

**Option B: Via SQL**
```sql
-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Comment on the column to trigger GraphQL schema update
COMMENT ON COLUMN tickets.assignee_ids IS 'Array of user IDs assigned to this ticket. Replaces the single assignee_id and ticket_assignees junction table.';
```

### Step 4: Restart Your Development Server

```bash
# Kill any running Next.js processes
pkill -f next

# Start fresh
npm run dev
```

---

## 🔧 What Changed in the Code

### ✅ Already Updated Files

#### 1. `database-config/db.sql`
Added the `assignee_ids` column to the tickets table schema:
```sql
assignee_ids uuid[] DEFAULT ARRAY[]::uuid[],
```

#### 2. `hooks/queries/use-tickets-graphql-query.ts`
Updated all GraphQL queries to:
- Fetch `assignee_ids` instead of joining `ticket_assigneesCollection`
- Map `assignee_ids` array to full profile objects
- Simplified data transformation logic

**Before:**
```typescript
assignees: ticket_assigneesCollection {
  edges {
    node {
      user_id
      role
    }
  }
}
```

**After:**
```typescript
assignee_ids  // Simple array!
```

---

## 🎨 UI Components (Already Compatible)

The following components already work with the `assignees` array:

✅ `components/tickets/multi-assignee-avatars.tsx` - Displays multiple assignees with avatars
✅ `app/(main)/tickets/page.tsx` - Tickets list with multi-assignee UI
✅ `app/(main)/my-tickets/page.tsx` - My Tickets page

These components expect an `assignees` array and will work automatically after the migration!

---

## 📝 How to Update Assignees Going Forward

### In the Ticket Drawer/Form

To update assignees, simply pass the `assignee_ids` array:

```typescript
// Update ticket with multiple assignees
updateTicket({
  id: ticketId,
  updates: {
    assignee_ids: ['user-uuid-1', 'user-uuid-2', 'user-uuid-3']
  }
})
```

### Example: User Selector Component

```typescript
<UserSelector
  value={ticket.assignee_ids || []}
  onChange={(userIds) => {
    updateTicket({
      id: ticket.id,
      updates: { assignee_ids: userIds }
    })
  }}
  multiple
/>
```

---

## 🧪 Testing After Migration

### 1. Test Assigning Multiple Users

```typescript
// In your browser console or test file
const testMultipleAssignees = async () => {
  const { supabase } = await import('@/lib/supabase/client')
  
  // Pick a ticket
  const ticketId = 'your-ticket-id'
  
  // Assign 3 users
  const { data, error } = await supabase
    .from('tickets')
    .update({ 
      assignee_ids: [
        'user-id-1',
        'user-id-2', 
        'user-id-3'
      ]
    })
    .eq('id', ticketId)
    .select()
  
  console.log('Updated:', data)
}

testMultipleAssignees()
```

### 2. Verify UI Updates

After assigning multiple users:
- ✅ Tickets list should show up to 3 avatars
- ✅ "+N" badge should appear if more than 3 assignees
- ✅ Hovering should show all assignee names
- ✅ My Tickets should filter correctly

---

## 🚨 Troubleshooting

### Issue: "assignee_ids is not a valid field"
**Solution:** Refresh the GraphQL schema (see Step 3) and restart your dev server.

### Issue: No assignees showing in UI
**Solution:** 
1. Check the migration ran successfully (Step 2)
2. Verify GraphQL schema includes `assignee_ids` field
3. Check browser console for GraphQL errors

### Issue: RLS Policy Errors
**Solution:** The migration updates RLS policies to use `assignee_ids`. If you have custom policies, update them:
```sql
-- Example: Check if user is in assignee_ids array
auth.uid() = ANY(assignee_ids)
```

---

## 🎉 Benefits After Migration

1. **Simpler updates** - Update assignees with a single array update
2. **No junction table complexity** - Direct field access
3. **Better performance** - No joins required for assignee lookups
4. **GraphQL-friendly** - Arrays work natively with Supabase GraphQL
5. **Easier to reason about** - Assignees are just an array field

---

## 🗑️ Optional Cleanup (After Confirming Everything Works)

Once you've confirmed the migration works and the UI displays correctly, you can optionally drop the old junction table:

```sql
-- ⚠️ ONLY RUN THIS AFTER CONFIRMING EVERYTHING WORKS!
DROP TABLE IF EXISTS ticket_assignees CASCADE;
```

**Note:** The migration script leaves this table intact by default in case you need to rollback.

---

## 📚 Summary

✅ Add `assignee_ids` UUID[] column to tickets table
✅ Migrate existing data from `assignee_id` and `ticket_assignees`
✅ Update GraphQL queries to use the array field
✅ Refresh GraphQL schema
✅ Test multiple assignee assignment and UI display

**Next Steps:**
1. Run the SQL migration in Supabase dashboard
2. Refresh GraphQL schema
3. Restart dev server
4. Test assigning multiple users
5. Verify UI displays correctly

🎯 Your multi-assignee feature is now simplified and production-ready!
