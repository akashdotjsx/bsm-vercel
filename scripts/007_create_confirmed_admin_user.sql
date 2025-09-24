-- Create admin user with confirmed email using Supabase admin functions
-- This approach ensures the user is properly created in Supabase's auth system

-- First, let's create the user using a more reliable method
-- We'll use Supabase's auth.users table but ensure all required fields are set correctly

-- Delete existing user if exists (for clean setup)
DELETE FROM auth.users WHERE email = 'shashank@kroolo.com';
DELETE FROM public.profiles WHERE email = 'shashank@kroolo.com';

-- Create the user with all required Supabase auth fields
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  phone_confirmed_at,
  confirmation_sent_at,
  recovery_sent_at,
  email_change_sent_at,
  created_at,
  updated_at,
  role,
  aud,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  last_sign_in_at
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'shashank@kroolo.com',
  crypt('Test@123', gen_salt('bf')),
  now(), -- email_confirmed_at - this confirms the email
  null,   -- phone_confirmed_at
  null,   -- confirmation_sent_at
  null,   -- recovery_sent_at
  null,   -- email_change_sent_at
  now(),  -- created_at
  now(),  -- updated_at
  'authenticated',
  'authenticated',
  '',     -- confirmation_token (empty since email is confirmed)
  '',     -- recovery_token
  '',     -- email_change_token_new
  '',     -- email_change
  '{"provider": "email", "providers": ["email"]}',  -- raw_app_meta_data
  '{"full_name": "Shashank Kumar"}',                -- raw_user_meta_data
  false,  -- is_super_admin
  null    -- last_sign_in_at
);

-- Create the corresponding profile
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
);

-- Verify the user was created successfully
SELECT 
  id, 
  email, 
  email_confirmed_at,
  role,
  created_at
FROM auth.users 
WHERE email = 'shashank@kroolo.com';
