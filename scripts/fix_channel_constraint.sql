-- Running the constraint fix to allow 'web' as a valid channel value
-- Drop the existing constraint if it exists
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_channel_check;

-- Add a new constraint that allows the correct channel values
ALTER TABLE tickets ADD CONSTRAINT tickets_channel_check 
CHECK (channel IN ('web', 'email', 'phone', 'chat', 'api'));
