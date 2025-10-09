-- Migration: Add assignee_ids array to service_requests table
-- This allows service requests to be assigned to multiple users (like tickets)

-- Step 1: Add the new assignee_ids column (UUID array)
ALTER TABLE service_requests 
ADD COLUMN IF NOT EXISTS assignee_ids UUID[] DEFAULT ARRAY[]::UUID[];

-- Step 2: Migrate existing single assignee_id to the array
UPDATE service_requests 
SET assignee_ids = ARRAY[assignee_id] 
WHERE assignee_id IS NOT NULL 
  AND (assignee_ids IS NULL OR array_length(assignee_ids, 1) IS NULL);

-- Step 3: Create index on assignee_ids for performance
CREATE INDEX IF NOT EXISTS idx_service_requests_assignee_ids ON service_requests USING GIN (assignee_ids);

-- Step 4: Add a helper function to check if a user is assigned to a service request
CREATE OR REPLACE FUNCTION is_user_assigned_to_service_request(request_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT user_id = ANY(
    SELECT assignee_ids FROM service_requests WHERE id = request_id
  );
$$ LANGUAGE SQL STABLE;

-- Step 5: Update RLS policies to work with the new array column (if needed)
-- Drop old policies if they reference only assignee_id
DROP POLICY IF EXISTS "Users can view service requests assigned to them" ON service_requests;

-- Recreate the policy using both assignee_id and assignee_ids for backward compatibility
CREATE POLICY "Users can view service requests assigned to them" ON service_requests
  FOR SELECT
  USING (
    auth.uid() = assignee_id OR
    auth.uid() = ANY(assignee_ids) OR 
    auth.uid() = requester_id
  );

COMMENT ON COLUMN service_requests.assignee_ids IS 'Array of user IDs assigned to this service request. Complements the single assignee_id for backward compatibility.';
