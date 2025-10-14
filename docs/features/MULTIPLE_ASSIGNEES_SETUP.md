# Multiple Assignees - Implementation Guide

## Current Status

✅ **UI Component Ready:** `MultiAssigneeAvatars` component is fully built and tested
✅ **Display Logic Ready:** Shows up to 3 avatars with "+N" badge for additional assignees
✅ **Frontend Integration:** Already integrated in tickets list and My Tickets page

⚠️ **Database:** Currently only supports single `assignee_id` per ticket
⚠️ **Backend:** Need to add support for multiple assignees

## Current Behavior

Right now, tickets have ONE assignee:
- Database: `tickets.assignee_id` (single UUID)
- UI shows: 1 avatar (e.g., "JD")
- Component works: Shows 1 person correctly

## How to Enable Multiple Assignees

### Step 1: Update Database Schema

Create a junction table to support many-to-many relationship:

```sql
-- Create ticket_assignees junction table
CREATE TABLE ticket_assignees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES profiles(id),
  role TEXT, -- Optional: e.g., 'primary', 'secondary', 'watcher'
  
  -- Prevent duplicate assignments
  UNIQUE(ticket_id, user_id),
  
  -- Indexes for performance
  CREATE INDEX idx_ticket_assignees_ticket ON ticket_assignees(ticket_id),
  CREATE INDEX idx_ticket_assignees_user ON ticket_assignees(user_id)
);

-- Enable RLS
ALTER TABLE ticket_assignees ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view ticket assignees"
  ON ticket_assignees FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM ticket_assignees WHERE ticket_id = ticket_assignees.ticket_id
    )
    OR
    auth.uid() IN (
      SELECT requester_id FROM tickets WHERE id = ticket_assignees.ticket_id
    )
  );

CREATE POLICY "Users can assign tickets"
  ON ticket_assignees FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tickets
      WHERE id = ticket_id
      AND (requester_id = auth.uid() OR assignee_id = auth.uid())
    )
  );
```

### Step 2: Update GraphQL Query

Modify the ticket query to fetch all assignees:

```graphql
query GetTickets($first: Int!, $offset: Int!) {
  ticketsCollection(first: $first, offset: $offset) {
    edges {
      node {
        id
        ticket_number
        title
        # ... other fields
        
        # NEW: Fetch all assignees
        assignees: ticket_assigneesCollection {
          edges {
            node {
              user_id
              role
              assigned_at
              user: profiles {
                id
                display_name
                first_name
                last_name
                email
                avatar_url
              }
            }
          }
        }
      }
    }
  }
}
```

### Step 3: Update Data Transformation

Update the ticket transformation in `app/(dashboard)/tickets/page.tsx`:

```typescript
// Transform API ticket data to match the expected format
const transformedTickets = useMemo(() => {
  if (!tickets || tickets.length === 0) return []
  
  return tickets.map((ticket) => {
    // NEW: Map all assignees from junction table
    const assignees = ticket.assignees?.edges.map((edge: any) => ({
      id: edge.node.user.id,
      name: edge.node.user.display_name,
      avatar: getAvatarInitials(
        edge.node.user.first_name, 
        edge.node.user.last_name, 
        edge.node.user.display_name
      ),
      display_name: edge.node.user.display_name,
      first_name: edge.node.user.first_name,
      last_name: edge.node.user.last_name,
      avatar_url: edge.node.user.avatar_url,
      role: edge.node.role,
      assigned_at: edge.node.assigned_at
    })) || []
    
    return {
      // ... other fields
      assignees: assignees, // Now contains multiple assignees!
      // Keep backward compatibility
      assignee: assignees[0] || null,
    }
  })
}, [tickets])
```

### Step 4: Update Ticket Drawer

Update assignee selection in `components/tickets/ticket-drawer.tsx`:

```typescript
// Current: Single assignee
const [form, setForm] = useState({
  // ...
  assignee_ids: [] as string[], // ALREADY supports multiple!
})

// On save, create multiple assignee records
const handleSave = async () => {
  // ... existing code
  
  // NEW: After creating/updating ticket, assign all users
  if (form.assignee_ids.length > 0) {
    await Promise.all(
      form.assignee_ids.map(userId =>
        assignUserToTicket(ticketId, userId)
      )
    )
  }
}
```

### Step 5: Create Assignment API

Create API route: `app/api/tickets/[id]/assignees/route.ts`

```typescript
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { user_id, role } = await req.json()
  
  // Insert into ticket_assignees
  const { data, error } = await supabase
    .from('ticket_assignees')
    .insert({
      ticket_id: params.id,
      user_id: user_id,
      role: role || 'assignee'
    })
    .select()
  
  if (error) throw error
  return NextResponse.json(data)
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(req.url)
  const user_id = searchParams.get('user_id')
  
  // Remove from ticket_assignees
  const { error } = await supabase
    .from('ticket_assignees')
    .delete()
    .match({ ticket_id: params.id, user_id: user_id })
  
  if (error) throw error
  return NextResponse.json({ success: true })
}
```

## What Happens After Implementation

### Before (Current):
```
Ticket has 1 assignee:
[ JD ]
```

### After (With Multiple Assignees):
```
Ticket has 3 assignees:
[ JD ][ MS ][ AK ]

Ticket has 5 assignees (shows +2):
[ JD ][ MS ][ AK ][ +2 ]
```

## UI Already Supports It!

The `MultiAssigneeAvatars` component already handles:
- ✅ Display up to 3 avatars
- ✅ Show "+N" badge for additional assignees
- ✅ Overlapping avatar layout
- ✅ Tooltips with names
- ✅ Avatar images or initials
- ✅ Proper styling and z-index

**No UI changes needed!** Just update the backend to provide multiple assignees.

## Migration Path

1. **Phase 1 (Current):** Single assignee works with MultiAssigneeAvatars
2. **Phase 2:** Add `ticket_assignees` table alongside existing `assignee_id`
3. **Phase 3:** Migrate existing assignments to new table
4. **Phase 4:** Update frontend to use new assignees array
5. **Phase 5:** Remove old `assignee_id` column (optional, keep for backward compat)

## Testing Multiple Assignees

Once implemented, you can test by:

```sql
-- Assign multiple users to a ticket
INSERT INTO ticket_assignees (ticket_id, user_id, role) VALUES
  ('ticket-uuid', 'user1-uuid', 'primary'),
  ('ticket-uuid', 'user2-uuid', 'secondary'),
  ('ticket-uuid', 'user3-uuid', 'watcher'),
  ('ticket-uuid', 'user4-uuid', 'assignee'),
  ('ticket-uuid', 'user5-uuid', 'assignee');
```

The UI will automatically show:
- First 3 avatars
- "+2" badge for the remaining 2

## Summary

✅ **UI Component:** Already built and working
✅ **Display Logic:** Shows 1-3 avatars + badge
✅ **Frontend Integration:** Already in place
⚠️ **Backend:** Need to add junction table and API
⚠️ **GraphQL:** Need to update queries

The component is **ready for multiple assignees** - it just needs the backend support!
