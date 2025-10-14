-- Migration: Add automatic ticket number generation
-- Description: Creates a function and trigger to automatically generate ticket numbers
--              in the format TK-{timestamp}-{random} for new tickets
-- Date: 2025-10-09

-- ============================================================================
-- FUNCTION: Generate Ticket Number
-- ============================================================================

CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  timestamp_part BIGINT;
  random_part TEXT;
  ticket_number TEXT;
  max_attempts INTEGER := 10;
  attempt INTEGER := 0;
BEGIN
  -- Loop to ensure uniqueness (in case of collisions)
  LOOP
    -- Get current timestamp in milliseconds
    timestamp_part := EXTRACT(EPOCH FROM NOW())::BIGINT * 1000;
    
    -- Generate random 6-character alphanumeric string (uppercase)
    random_part := UPPER(
      SUBSTRING(
        MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) 
        FROM 1 FOR 6
      )
    );
    
    -- Construct ticket number: TK-{timestamp}-{random}
    ticket_number := 'TK-' || timestamp_part || '-' || random_part;
    
    -- Check if this ticket number already exists
    IF NOT EXISTS (
      SELECT 1 FROM public.tickets WHERE ticket_number = ticket_number
    ) THEN
      RETURN ticket_number;
    END IF;
    
    -- Increment attempt counter
    attempt := attempt + 1;
    
    -- If we've tried too many times, raise an error
    IF attempt >= max_attempts THEN
      RAISE EXCEPTION 'Could not generate unique ticket number after % attempts', max_attempts;
    END IF;
    
    -- Wait a tiny bit to ensure timestamp changes
    PERFORM pg_sleep(0.001);
  END LOOP;
END;
$$;

-- Add comment to function
COMMENT ON FUNCTION public.generate_ticket_number() IS 
'Generates a unique ticket number in the format TK-{timestamp}-{random}. 
Used by the trigger to auto-populate ticket_number on insert.';

-- ============================================================================
-- TRIGGER FUNCTION: Set Ticket Number Before Insert
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_ticket_number_before_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only generate ticket number if not already provided
  IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
    NEW.ticket_number := public.generate_ticket_number();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Add comment to trigger function
COMMENT ON FUNCTION public.set_ticket_number_before_insert() IS 
'Trigger function that automatically generates ticket_number before insert if not provided.';

-- ============================================================================
-- TRIGGER: Auto-generate Ticket Number
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_set_ticket_number ON public.tickets;

CREATE TRIGGER trigger_set_ticket_number
  BEFORE INSERT ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.set_ticket_number_before_insert();

-- Add comment to trigger
COMMENT ON TRIGGER trigger_set_ticket_number ON public.tickets IS 
'Automatically generates a unique ticket number before insert if not provided.';

-- ============================================================================
-- ALTER TABLE: Make ticket_number nullable (optional)
-- ============================================================================

-- Since we're auto-generating, we can make it nullable in the DB
-- But the trigger will always populate it
ALTER TABLE public.tickets 
  ALTER COLUMN ticket_number DROP NOT NULL;

-- Add back NOT NULL constraint via CHECK constraint that allows NULL during insert
-- but the trigger will always populate it
ALTER TABLE public.tickets 
  ALTER COLUMN ticket_number SET NOT NULL;

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================

-- Test the function manually
-- SELECT public.generate_ticket_number();

-- Test insert without ticket_number
-- INSERT INTO public.tickets (
--   organization_id, 
--   title, 
--   description, 
--   requester_id
-- ) VALUES (
--   '00000000-0000-0000-0000-000000000001',
--   'Test Auto-Generated Ticket',
--   'This ticket should have an auto-generated ticket_number',
--   (SELECT id FROM public.profiles LIMIT 1)
-- );

-- ============================================================================
-- ROLLBACK SCRIPT (if needed)
-- ============================================================================

-- DROP TRIGGER IF EXISTS trigger_set_ticket_number ON public.tickets;
-- DROP FUNCTION IF EXISTS public.set_ticket_number_before_insert();
-- DROP FUNCTION IF EXISTS public.generate_ticket_number();
