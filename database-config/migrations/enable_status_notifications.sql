-- Status Change Notifications - Global Settings
-- By default, status notifications are ENABLED for ALL organizations
-- This migration shows how to disable it for specific organizations if needed

-- ✅ DEFAULT BEHAVIOR: Notifications are ENABLED globally (no action needed)
-- The code checks: organization?.settings?.notify_on_status_change !== false
-- This means notifications are ON unless explicitly set to false

-- Query to check current setting for all organizations
SELECT 
  id, 
  name, 
  CASE 
    WHEN settings->>'notify_on_status_change' = 'false' THEN 'DISABLED'
    ELSE 'ENABLED (default)'
  END as status_notifications
FROM organizations
ORDER BY name;

-- ❌ DISABLE notifications for a specific organization
-- Only use this if you want to opt-out a specific organization
-- UPDATE organizations 
-- SET settings = jsonb_set(
--   COALESCE(settings, '{}'::jsonb), 
--   '{notify_on_status_change}', 
--   'false'
-- )
-- WHERE id = 'your-org-id';

-- ✅ RE-ENABLE notifications for a specific organization (if previously disabled)
-- UPDATE organizations 
-- SET settings = jsonb_set(
--   COALESCE(settings, '{}'::jsonb), 
--   '{notify_on_status_change}', 
--   'true'
-- )
-- WHERE id = 'your-org-id';

-- 🗑️ Remove the setting entirely (falls back to default: ENABLED)
-- UPDATE organizations 
-- SET settings = settings - 'notify_on_status_change'
-- WHERE id = 'your-org-id';
