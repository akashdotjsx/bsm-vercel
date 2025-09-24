-- Check what the current channel constraint actually allows
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'tickets_channel_check';

-- Also check what values currently exist in the channel column
SELECT DISTINCT channel, COUNT(*) 
FROM tickets 
GROUP BY channel;
