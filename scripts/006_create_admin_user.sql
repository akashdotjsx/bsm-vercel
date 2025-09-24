-- Create admin user: shashank@kroolo.com with password Test@123
-- This script creates a user in the auth.users table and corresponding profile

-- Insert user into auth.users table
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  role,
  aud,
  confirmation_token,
  email_change_token_new,
  recovery_token
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'shashank@kroolo.com',
  crypt('Test@123', gen_salt('bf')),
  now(),
  now(),
  now(),
  'authenticated',
  'authenticated',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- The profile will be automatically created by the trigger we set up earlier
-- when the user first logs in, but we can also create it manually:

INSERT INTO public.profiles (
  id,
  email,
  full_name,
  role,
  department,
  created_at,
  updated_at
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'shashank@kroolo.com'),
  'shashank@kroolo.com',
  'Shashank Kumar',
  'admin',
  'IT',
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  department = EXCLUDED.department,
  updated_at = now();
