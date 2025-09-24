-- Create password history table to track last 3 passwords
CREATE TABLE IF NOT EXISTS public.password_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.password_history ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "password_history_select_own"
  ON public.password_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "password_history_insert_own"
  ON public.password_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_password_history_user_id_created_at 
ON public.password_history(user_id, created_at DESC);

-- Function to clean up old password history (keep only last 3)
CREATE OR REPLACE FUNCTION public.cleanup_password_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete old password history, keeping only the 3 most recent
  DELETE FROM public.password_history
  WHERE user_id = NEW.user_id
  AND id NOT IN (
    SELECT id FROM public.password_history
    WHERE user_id = NEW.user_id
    ORDER BY created_at DESC
    LIMIT 3
  );
  
  RETURN NEW;
END;
$$;

-- Trigger to automatically clean up old password history
DROP TRIGGER IF EXISTS cleanup_password_history_trigger ON public.password_history;
CREATE TRIGGER cleanup_password_history_trigger
  AFTER INSERT ON public.password_history
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_password_history();
