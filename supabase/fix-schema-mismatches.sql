-- ============================================
-- FIX: Schema Mismatches Between Code and Database
-- Run this in Supabase SQL Editor AFTER fix-rls-policies.sql
-- ============================================

-- ============================================
-- STEP 1: Add missing job statuses to enum
-- ============================================

-- Add 'delegate_to_va' status (used for task delegation)
ALTER TYPE public.job_status ADD VALUE IF NOT EXISTS 'delegate_to_va';

-- Add 'trashed' status (used for soft delete)
ALTER TYPE public.job_status ADD VALUE IF NOT EXISTS 'trashed';

-- ============================================
-- STEP 2: Add is_default column to resumes
-- (Code uses is_default, schema has is_primary)
-- ============================================

-- Add is_default column if it doesn't exist
ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;

-- Create index for is_default
CREATE INDEX IF NOT EXISTS idx_resumes_is_default ON public.resumes(user_id, is_default);

-- Migrate data from is_primary to is_default (if is_primary exists)
UPDATE public.resumes
SET is_default = is_primary
WHERE is_primary = true AND (is_default IS NULL OR is_default = false);

-- Create trigger function to ensure only one default resume per user
CREATE OR REPLACE FUNCTION public.ensure_single_default_resume()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    -- Unset any existing default for this user
    UPDATE public.resumes
    SET is_default = false
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists, then create
DROP TRIGGER IF EXISTS ensure_single_default_resume ON public.resumes;
CREATE TRIGGER ensure_single_default_resume
  BEFORE INSERT OR UPDATE ON public.resumes
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_single_default_resume();

-- ============================================
-- STEP 3: Add missing columns to jobs table
-- ============================================

-- Add cover_letter column if it doesn't exist
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS cover_letter TEXT;

-- Add submission_proof column if it doesn't exist
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS submission_proof TEXT;

-- ============================================
-- STEP 4: Verify the is_admin function exists
-- (Required for RLS policies)
-- ============================================

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

-- ============================================
-- STEP 5: Re-apply RLS policies with is_admin()
-- ============================================

-- Drop existing policies that might cause recursion
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Profiles policies (using is_admin() to prevent recursion)
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Resumes policies
DROP POLICY IF EXISTS "Users can view their own resumes" ON public.resumes;
DROP POLICY IF EXISTS "Admins can view all resumes" ON public.resumes;
DROP POLICY IF EXISTS "Users can insert their own resumes" ON public.resumes;
DROP POLICY IF EXISTS "Users can update their own resumes" ON public.resumes;
DROP POLICY IF EXISTS "Users can delete their own resumes" ON public.resumes;

CREATE POLICY "Users can view their own resumes"
  ON public.resumes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all resumes"
  ON public.resumes FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Users can insert their own resumes"
  ON public.resumes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own resumes"
  ON public.resumes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own resumes"
  ON public.resumes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Jobs policies
DROP POLICY IF EXISTS "Users can view their own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Admins can view all jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can insert their own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can update their own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can delete their own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Admins can update all jobs" ON public.jobs;

CREATE POLICY "Users can view their own jobs"
  ON public.jobs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all jobs"
  ON public.jobs FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Users can insert their own jobs"
  ON public.jobs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own jobs"
  ON public.jobs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own jobs"
  ON public.jobs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can update all jobs"
  ON public.jobs FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================
-- DONE! Schema should now match the code
-- ============================================

-- Verification queries (run these to check):
-- SELECT enum_range(NULL::job_status);
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'resumes' AND column_name IN ('is_default', 'is_primary');
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'jobs' AND column_name IN ('cover_letter', 'submission_proof');
