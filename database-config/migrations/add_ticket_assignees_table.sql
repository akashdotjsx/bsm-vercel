-- Migration: Add support for multiple assignees per ticket
-- Created: 2025-01-09
-- Description: Creates a junction table for many-to-many relationship between tickets and users

-- Create ticket_assignees junction table
CREATE TABLE IF NOT EXISTS ticket_assignees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES profiles(id),
  role TEXT DEFAULT 'assignee', -- e.g., 'primary', 'secondary', 'watcher', 'assignee'
  is_active BOOLEAN DEFAULT true, -- To track if assignment is still active
  
  -- Prevent duplicate assignments
  CONSTRAINT ticket_assignees_unique UNIQUE(ticket_id, user_id),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ticket_assignees_ticket ON ticket_assignees(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_assignees_user ON ticket_assignees(user_id);
CREATE INDEX IF NOT EXISTS idx_ticket_assignees_active ON ticket_assignees(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE ticket_assignees ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view ticket assignees if they're involved with the ticket
CREATE POLICY "Users can view ticket assignees" ON ticket_assignees
  FOR SELECT
  USING (
    -- User is an assignee of the ticket
    user_id = auth.uid()
    OR
    -- User is the requester of the ticket
    EXISTS (
      SELECT 1 FROM tickets
      WHERE id = ticket_id
      AND requester_id = auth.uid()
    )
    OR
    -- User is another assignee of the ticket
    EXISTS (
      SELECT 1 FROM ticket_assignees ta2
      WHERE ta2.ticket_id = ticket_assignees.ticket_id
      AND ta2.user_id = auth.uid()
    )
  );

-- RLS Policy: Users can assign others to tickets they're involved with
CREATE POLICY "Users can assign to tickets" ON ticket_assignees
  FOR INSERT
  WITH CHECK (
    -- User is the requester of the ticket
    EXISTS (
      SELECT 1 FROM tickets
      WHERE id = ticket_id
      AND requester_id = auth.uid()
    )
    OR
    -- User is already assigned to the ticket (can add others)
    EXISTS (
      SELECT 1 FROM ticket_assignees
      WHERE ticket_id = ticket_assignees.ticket_id
      AND user_id = auth.uid()
    )
    OR
    -- User is the original assignee
    EXISTS (
      SELECT 1 FROM tickets
      WHERE id = ticket_id
      AND assignee_id = auth.uid()
    )
  );

-- RLS Policy: Users can remove assignees from tickets they're involved with
CREATE POLICY "Users can remove assignees" ON ticket_assignees
  FOR DELETE
  USING (
    -- User is removing themselves
    user_id = auth.uid()
    OR
    -- User is the requester
    EXISTS (
      SELECT 1 FROM tickets
      WHERE id = ticket_id
      AND requester_id = auth.uid()
    )
    OR
    -- User is another assignee
    EXISTS (
      SELECT 1 FROM ticket_assignees ta2
      WHERE ta2.ticket_id = ticket_assignees.ticket_id
      AND ta2.user_id = auth.uid()
    )
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ticket_assignees_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ticket_assignees_updated_at
  BEFORE UPDATE ON ticket_assignees
  FOR EACH ROW
  EXECUTE FUNCTION update_ticket_assignees_updated_at();

-- Migrate existing assignee_id data to new table
-- Only migrate if assignee_id is not null
INSERT INTO ticket_assignees (ticket_id, user_id, role, assigned_at, assigned_by)
SELECT 
  id as ticket_id,
  assignee_id as user_id,
  'primary' as role,
  created_at as assigned_at,
  requester_id as assigned_by
FROM tickets
WHERE assignee_id IS NOT NULL
ON CONFLICT (ticket_id, user_id) DO NOTHING;

-- Comment: Keep assignee_id column for backward compatibility
-- It will store the "primary" assignee for legacy code
COMMENT ON COLUMN tickets.assignee_id IS 'Legacy single assignee. Use ticket_assignees table for multiple assignees.';
COMMENT ON TABLE ticket_assignees IS 'Junction table for multiple assignees per ticket. Supports many-to-many relationship.';
