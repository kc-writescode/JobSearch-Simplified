-- ============================================
-- FIX: RLS Policy Infinite Recursion
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Drop all existing policies on profiles table
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Step 2: Create a SECURITY DEFINER function to check admin status
-- This function bypasses RLS, preventing infinite recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Step 3: Create fixed policies for profiles table
-- Users can always view and update their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can view all profiles (using the security definer function)
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Step 4: Fix policies on other tables that check admin status
-- Drop and recreate resumes admin policy
DROP POLICY IF EXISTS "Admins can view all resumes" ON public.resumes;
CREATE POLICY "Admins can view all resumes"
  ON public.resumes FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Drop and recreate jobs admin policies
DROP POLICY IF EXISTS "Admins can view all jobs" ON public.jobs;
DROP POLICY IF EXISTS "Admins can update all jobs" ON public.jobs;

CREATE POLICY "Admins can view all jobs"
  ON public.jobs FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can update all jobs"
  ON public.jobs FOR UPDATE
  TO authenticated
  USING (public.is_admin());

-- Drop and recreate applications admin policy
DROP POLICY IF EXISTS "Admins can view all applications" ON public.applications;
CREATE POLICY "Admins can view all applications"
  ON public.applications FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Drop and recreate tailored_resumes admin policy
DROP POLICY IF EXISTS "Admins can view all tailored resumes" ON public.tailored_resumes;
CREATE POLICY "Admins can view all tailored resumes"
  ON public.tailored_resumes FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- ============================================
-- DONE! Your RLS policies should now work without infinite recursion
-- ============================================
