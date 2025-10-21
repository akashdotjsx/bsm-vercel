-- Script to assign some test tickets for filter testing
-- This will assign some tickets to users so the assignee/reported by filters work

-- First, let's see what tickets and users we have
SELECT 
  t.id, 
  t.title, 
  t.assignee_id, 
  t.requester_id,
  t.assignee_ids
FROM tickets t 
LIMIT 5;

-- Get some user IDs to assign
SELECT 
  p.id, 
  p.display_name, 
  p.email
FROM profiles p 
LIMIT 5;

-- Update a few tickets with assignee and requester data
-- Replace these UUIDs with actual user IDs from your database

-- Example updates (you'll need to replace with real user IDs):
-- UPDATE tickets 
-- SET assignee_id = 'user-uuid-here',
--     requester_id = 'user-uuid-here'
-- WHERE id = 'ticket-uuid-here';

-- Or assign to multiple users:
-- UPDATE tickets 
-- SET assignee_ids = ARRAY['user-uuid-1', 'user-uuid-2'],
--     requester_id = 'user-uuid-here'
-- WHERE id = 'ticket-uuid-here';
