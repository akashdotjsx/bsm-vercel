-- Final comprehensive fix for RLS infinite recursion on profiles table
-- This script completely removes all problematic policies and creates simple, non-recursive ones

-- First, disable RLS temporarily to clean up
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on profiles table to start fresh
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_authenticated" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_authenticated" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_authenticated" ON public.profiles;
DROP POLICY IF EXISTS "profiles_read_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_write_own" ON public.profiles;

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies
-- Allow authenticated users to read all profiles (needed for analytics and user lookups)
CREATE POLICY "profiles_read_authenticated" 
  ON public.profiles FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Allow users to insert their own profile only
CREATE POLICY "profiles_insert_own" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile only
CREATE POLICY "profiles_update_own" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Allow users to delete their own profile only
CREATE POLICY "profiles_delete_own" 
  ON public.profiles FOR DELETE 
  USING (auth.uid() = id);

-- Grant necessary permissions
GRANT SELECT ON public.profiles TO authenticated;
GRANT INSERT ON public.profiles TO authenticated;
GRANT UPDATE ON public.profiles TO authenticated;
GRANT DELETE ON public.profiles TO authenticated;
