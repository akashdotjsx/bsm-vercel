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

-- Note: You can now drop the ticket_assignees junction table if no longer needed
-- DROP TABLE IF EXISTS ticket_assignees CASCADE;
-- But we'll leave it for now in case you want to rollback

COMMENT ON COLUMN tickets.assignee_ids IS 'Array of user IDs assigned to this ticket. Replaces the single assignee_id and ticket_assignees junction table.';
