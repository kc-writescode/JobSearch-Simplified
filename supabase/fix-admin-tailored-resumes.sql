-- ============================================
-- Fix RLS Policies for Admin Tailored Resumes Access
-- Run this in Supabase SQL Editor
-- ============================================

-- Drop existing tailored_resumes policies
DROP POLICY IF EXISTS "tailored_resumes_select_own" ON public.tailored_resumes;
DROP POLICY IF EXISTS "tailored_resumes_select_admin" ON public.tailored_resumes;
DROP POLICY IF EXISTS "tailored_resumes_insert_own" ON public.tailored_resumes;
DROP POLICY IF EXISTS "tailored_resumes_insert_admin" ON public.tailored_resumes;
DROP POLICY IF EXISTS "tailored_resumes_update_own" ON public.tailored_resumes;
DROP POLICY IF EXISTS "tailored_resumes_update_admin" ON public.tailored_resumes;
DROP POLICY IF EXISTS "tailored_resumes_delete_own" ON public.tailored_resumes;
DROP POLICY IF EXISTS "tailored_resumes_delete_admin" ON public.tailored_resumes;

-- Users can view their own tailored resumes
CREATE POLICY "tailored_resumes_select_own"
  ON public.tailored_resumes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all tailored resumes
CREATE POLICY "tailored_resumes_select_admin"
  ON public.tailored_resumes FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Users can insert their own tailored resumes
CREATE POLICY "tailored_resumes_insert_own"
  ON public.tailored_resumes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admins can insert tailored resumes for any user
CREATE POLICY "tailored_resumes_insert_admin"
  ON public.tailored_resumes FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- Users can update their own tailored resumes
CREATE POLICY "tailored_resumes_update_own"
  ON public.tailored_resumes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can update tailored resumes for any user
CREATE POLICY "tailored_resumes_update_admin"
  ON public.tailored_resumes FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Users can delete their own tailored resumes
CREATE POLICY "tailored_resumes_delete_own"
  ON public.tailored_resumes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can delete tailored resumes for any user
CREATE POLICY "tailored_resumes_delete_admin"
  ON public.tailored_resumes FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================
-- Also fix jobs table policies for admin access
-- (Admins need to update jobs to mark them as tailored)
-- ============================================

DROP POLICY IF EXISTS "jobs_update_admin" ON public.jobs;

-- Admins can update any job
CREATE POLICY "jobs_update_admin"
  ON public.jobs FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================
-- Verify the policies
-- ============================================
-- SELECT policyname FROM pg_policies WHERE tablename = 'tailored_resumes';
-- SELECT policyname FROM pg_policies WHERE tablename = 'jobs';
