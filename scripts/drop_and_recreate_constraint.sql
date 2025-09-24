-- Drop the existing constraint and recreate it with the correct values
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_channel_check;

-- Add the new constraint with all the values we need
ALTER TABLE tickets ADD CONSTRAINT tickets_channel_check 
CHECK (channel IN ('web', 'email', 'phone', 'chat', 'api', 'portal', 'mobile'));
