-- Fix infinite recursion in profiles RLS policies
-- Drop any existing problematic policies that might cause recursion

-- Drop all existing policies on profiles table
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_authenticated" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_authenticated" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_authenticated" ON public.profiles;

-- Create new non-recursive RLS policies for profiles table
-- These policies use simple auth.uid() checks without querying the profiles table itself
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- Add a policy for service accounts or admin access without recursion
-- This allows authenticated users to read all profiles for analytics purposes
CREATE POLICY "profiles_select_authenticated" ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');
