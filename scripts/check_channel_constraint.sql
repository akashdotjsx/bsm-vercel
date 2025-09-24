-- Check the current channel constraint to see what values are allowed
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint 
WHERE conname = 'tickets_channel_check';

-- Also check what channel values currently exist in the database
SELECT DISTINCT channel FROM tickets;
