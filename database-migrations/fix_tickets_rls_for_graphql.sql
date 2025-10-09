-- Migration: Fix RLS Policies for GraphQL Mutations on Tickets Table
-- Description: Updates RLS policies to allow service role access while maintaining security
--              for regular users. This enables GraphQL mutations to work properly.
-- Date: 2025-10-09

-- ============================================================================
-- PROBLEM:
-- GraphQL mutations are returning NULL because RLS policies block service role access
-- Service role uses auth.uid() which returns NULL, causing organization_id checks to fail
-- 
-- SOLUTION:
-- Add bypass for service role while maintaining security for authenticated users
-- Service role should have full access (it's used server-side with proper auth checks)
-- Regular users maintain the same security restrictions
-- ============================================================================

-- ============================================================================
-- DROP EXISTING POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view tickets in their organization" ON public.tickets;
DROP POLICY IF EXISTS "Users can create tickets in their organization" ON public.tickets;
DROP POLICY IF EXISTS "Users can update tickets they're involved with" ON public.tickets;
DROP POLICY IF EXISTS "Users can delete tickets they're involved with" ON public.tickets;

-- ============================================================================
-- CREATE UPDATED POLICIES WITH SERVICE ROLE BYPASS
-- ============================================================================

-- SELECT Policy: Allow service role full access, users can see tickets in their org
CREATE POLICY "Users can view tickets in their organization"
ON public.tickets
FOR SELECT
USING (
  -- Service role has full access (bypasses RLS)
  auth.jwt()->>'role' = 'service_role'
  OR
  -- Authenticated users can see tickets in their organization
  organization_id = get_user_organization_id()
);

-- INSERT Policy: Allow service role full access, users can create in their org
CREATE POLICY "Users can create tickets in their organization"
ON public.tickets
FOR INSERT
WITH CHECK (
  -- Service role has full access
  auth.jwt()->>'role' = 'service_role'
  OR
  -- Authenticated users can create tickets in their organization
  organization_id = get_user_organization_id()
);

-- UPDATE Policy: Allow service role full access, users can update tickets they're involved with
CREATE POLICY "Users can update tickets they're involved with"
ON public.tickets
FOR UPDATE
USING (
  -- Service role has full access
  auth.jwt()->>'role' = 'service_role'
  OR
  -- Authenticated users can update tickets they're involved with
  (
    organization_id = get_user_organization_id()
    AND (
      requester_id = auth.uid()
      OR assignee_id = auth.uid()
      OR (
        SELECT role FROM profiles WHERE id = auth.uid()
      ) IN ('admin', 'manager', 'agent')
    )
  )
);

-- DELETE Policy: Allow service role full access, users with proper roles can delete
CREATE POLICY "Users can delete tickets they're involved with"
ON public.tickets
FOR DELETE
USING (
  -- Service role has full access
  auth.jwt()->>'role' = 'service_role'
  OR
  -- Authenticated users with proper permissions can delete
  (
    organization_id = get_user_organization_id()
    AND (
      requester_id = auth.uid()
      OR assignee_id = auth.uid()
      OR (
        SELECT role FROM profiles WHERE id = auth.uid()
      ) IN ('admin', 'manager', 'agent')
    )
  )
);

-- ============================================================================
-- ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON POLICY "Users can view tickets in their organization" ON public.tickets IS
'Allows service role full access for server-side operations (GraphQL). 
Regular users can only view tickets in their organization.';

COMMENT ON POLICY "Users can create tickets in their organization" ON public.tickets IS
'Allows service role full access for server-side operations (GraphQL). 
Regular users can create tickets in their own organization.';

COMMENT ON POLICY "Users can update tickets they're involved with" ON public.tickets IS
'Allows service role full access for server-side operations (GraphQL). 
Regular users can update tickets they created, are assigned to, or have proper roles.';

COMMENT ON POLICY "Users can delete tickets they're involved with" ON public.tickets IS
'Allows service role full access for server-side operations (GraphQL). 
Regular users with proper roles can delete tickets they are involved with.';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify policies are created
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd 
-- FROM pg_policies 
-- WHERE tablename = 'tickets' 
-- ORDER BY policyname;

-- Test with service role (should work)
-- SET ROLE service_role;
-- SELECT COUNT(*) FROM tickets;
-- INSERT INTO tickets (organization_id, ticket_number, title, requester_id) 
-- VALUES ('00000000-0000-0000-0000-000000000001', 'TEST-123', 'Test', 
--         (SELECT id FROM profiles LIMIT 1));

-- ============================================================================
-- ALTERNATIVE APPROACH (if above doesn't work)
-- ============================================================================

-- If the auth.jwt()->>'role' check doesn't work, we can use this alternative:
-- Check if auth.uid() is NULL (indicates service role or unauthenticated)
-- Combined with proper application-level security checks

/*
DROP POLICY IF EXISTS "Users can create tickets in their organization" ON public.tickets;

CREATE POLICY "Users can create tickets in their organization"
ON public.tickets
FOR INSERT
WITH CHECK (
  -- If auth.uid() is NULL, it's likely service role or unauthenticated
  -- Service role should be used server-side with proper application auth
  auth.uid() IS NULL
  OR
  -- Authenticated users must create tickets in their organization
  organization_id = get_user_organization_id()
);
*/

-- ============================================================================
-- ROLLBACK SCRIPT (if needed)
-- ============================================================================

/*
-- Restore original policies
DROP POLICY IF EXISTS "Users can view tickets in their organization" ON public.tickets;
DROP POLICY IF EXISTS "Users can create tickets in their organization" ON public.tickets;
DROP POLICY IF EXISTS "Users can update tickets they're involved with" ON public.tickets;
DROP POLICY IF EXISTS "Users can delete tickets they're involved with" ON public.tickets;

CREATE POLICY "Users can view tickets in their organization"
ON public.tickets FOR SELECT
USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can create tickets in their organization"
ON public.tickets FOR INSERT
WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update tickets they're involved with"
ON public.tickets FOR UPDATE
USING (
  organization_id = get_user_organization_id()
  AND (
    requester_id = auth.uid()
    OR assignee_id = auth.uid()
    OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager', 'agent')
  )
);

CREATE POLICY "Users can delete tickets they're involved with"
ON public.tickets FOR DELETE
USING (
  organization_id = get_user_organization_id()
  AND (
    requester_id = auth.uid()
    OR assignee_id = auth.uid()
    OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager', 'agent')
  )
);
*/

-- ============================================================================
-- IMPORTANT SECURITY NOTES
-- ============================================================================

-- 1. Service role access should ONLY be used server-side
-- 2. Never expose service role key to client-side code
-- 3. Application-level authentication still required for all operations
-- 4. GraphQL resolvers should validate user permissions before operations
-- 5. Consider implementing application-level RBAC on top of RLS
-- 6. Regular audit of service role usage recommended
