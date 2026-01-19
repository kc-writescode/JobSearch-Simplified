-- ============================================
-- COMPLETE FIX: All Schema and RLS Issues
-- Run this single file in Supabase SQL Editor
-- ============================================

-- ============================================
-- STEP 1: Create is_admin function (SECURITY DEFINER)
-- This prevents infinite recursion in RLS policies
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
-- STEP 2: Add missing job statuses to enum
-- ============================================

DO $$
BEGIN
  -- Add 'delegate_to_va' if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'delegate_to_va' AND enumtypid = 'public.job_status'::regtype) THEN
    ALTER TYPE public.job_status ADD VALUE 'delegate_to_va';
  END IF;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  -- Add 'trashed' if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'trashed' AND enumtypid = 'public.job_status'::regtype) THEN
    ALTER TYPE public.job_status ADD VALUE 'trashed';
  END IF;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- ============================================
-- STEP 3: Add is_default column to resumes
-- ============================================

ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_resumes_is_default ON public.resumes(user_id, is_default);

-- Migrate from is_primary to is_default if needed
UPDATE public.resumes
SET is_default = is_primary
WHERE is_primary = true AND (is_default IS NULL OR is_default = false);

-- Trigger to ensure only one default resume per user
CREATE OR REPLACE FUNCTION public.ensure_single_default_resume()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE public.resumes
    SET is_default = false
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_single_default_resume ON public.resumes;
CREATE TRIGGER ensure_single_default_resume
  BEFORE INSERT OR UPDATE ON public.resumes
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_single_default_resume();

-- ============================================
-- STEP 4: Add missing columns to jobs table
-- ============================================

ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS cover_letter TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS submission_proof TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS raw_import_text TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS import_confidence INTEGER DEFAULT 0;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS is_remote BOOLEAN DEFAULT false;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS salary_range TEXT;

-- ============================================
-- STEP 5: Fix ALL RLS Policies
-- Drop ALL existing policies first, then recreate
-- ============================================

-- === PROFILES POLICIES ===
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;

CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_select_admin"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "profiles_update_admin"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- === RESUMES POLICIES ===
DROP POLICY IF EXISTS "Users can view their own resumes" ON public.resumes;
DROP POLICY IF EXISTS "Admins can view all resumes" ON public.resumes;
DROP POLICY IF EXISTS "Users can insert their own resumes" ON public.resumes;
DROP POLICY IF EXISTS "Users can update their own resumes" ON public.resumes;
DROP POLICY IF EXISTS "Users can delete their own resumes" ON public.resumes;
DROP POLICY IF EXISTS "resumes_select_own" ON public.resumes;
DROP POLICY IF EXISTS "resumes_select_admin" ON public.resumes;
DROP POLICY IF EXISTS "resumes_insert_own" ON public.resumes;
DROP POLICY IF EXISTS "resumes_update_own" ON public.resumes;
DROP POLICY IF EXISTS "resumes_delete_own" ON public.resumes;

CREATE POLICY "resumes_select_own"
  ON public.resumes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "resumes_select_admin"
  ON public.resumes FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "resumes_insert_own"
  ON public.resumes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "resumes_update_own"
  ON public.resumes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "resumes_delete_own"
  ON public.resumes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- === JOBS POLICIES ===
DROP POLICY IF EXISTS "Users can view their own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Admins can view all jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can insert their own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can update their own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can delete their own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Admins can update all jobs" ON public.jobs;
DROP POLICY IF EXISTS "jobs_select_own" ON public.jobs;
DROP POLICY IF EXISTS "jobs_select_admin" ON public.jobs;
DROP POLICY IF EXISTS "jobs_insert_own" ON public.jobs;
DROP POLICY IF EXISTS "jobs_update_own" ON public.jobs;
DROP POLICY IF EXISTS "jobs_delete_own" ON public.jobs;
DROP POLICY IF EXISTS "jobs_update_admin" ON public.jobs;

CREATE POLICY "jobs_select_own"
  ON public.jobs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "jobs_select_admin"
  ON public.jobs FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "jobs_insert_own"
  ON public.jobs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "jobs_update_own"
  ON public.jobs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "jobs_delete_own"
  ON public.jobs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "jobs_update_admin"
  ON public.jobs FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- === APPLICATIONS POLICIES ===
DROP POLICY IF EXISTS "Users can view their own applications" ON public.applications;
DROP POLICY IF EXISTS "Admins can view all applications" ON public.applications;
DROP POLICY IF EXISTS "Users can insert their own applications" ON public.applications;
DROP POLICY IF EXISTS "Users can update their own applications" ON public.applications;
DROP POLICY IF EXISTS "Users can delete their own applications" ON public.applications;
DROP POLICY IF EXISTS "applications_select_own" ON public.applications;
DROP POLICY IF EXISTS "applications_select_admin" ON public.applications;
DROP POLICY IF EXISTS "applications_insert_own" ON public.applications;
DROP POLICY IF EXISTS "applications_update_own" ON public.applications;
DROP POLICY IF EXISTS "applications_delete_own" ON public.applications;

CREATE POLICY "applications_select_own"
  ON public.applications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "applications_select_admin"
  ON public.applications FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "applications_insert_own"
  ON public.applications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "applications_update_own"
  ON public.applications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "applications_delete_own"
  ON public.applications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- === TAILORED_RESUMES POLICIES ===
DROP POLICY IF EXISTS "Users can view their own tailored resumes" ON public.tailored_resumes;
DROP POLICY IF EXISTS "Admins can view all tailored resumes" ON public.tailored_resumes;
DROP POLICY IF EXISTS "Users can insert their own tailored resumes" ON public.tailored_resumes;
DROP POLICY IF EXISTS "Users can update their own tailored resumes" ON public.tailored_resumes;
DROP POLICY IF EXISTS "Users can delete their own tailored resumes" ON public.tailored_resumes;
DROP POLICY IF EXISTS "tailored_resumes_select_own" ON public.tailored_resumes;
DROP POLICY IF EXISTS "tailored_resumes_select_admin" ON public.tailored_resumes;
DROP POLICY IF EXISTS "tailored_resumes_insert_own" ON public.tailored_resumes;
DROP POLICY IF EXISTS "tailored_resumes_insert_admin" ON public.tailored_resumes;
DROP POLICY IF EXISTS "tailored_resumes_update_own" ON public.tailored_resumes;
DROP POLICY IF EXISTS "tailored_resumes_update_admin" ON public.tailored_resumes;
DROP POLICY IF EXISTS "tailored_resumes_delete_own" ON public.tailored_resumes;
DROP POLICY IF EXISTS "tailored_resumes_delete_admin" ON public.tailored_resumes;

CREATE POLICY "tailored_resumes_select_own"
  ON public.tailored_resumes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "tailored_resumes_select_admin"
  ON public.tailored_resumes FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "tailored_resumes_insert_own"
  ON public.tailored_resumes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tailored_resumes_insert_admin"
  ON public.tailored_resumes FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "tailored_resumes_update_own"
  ON public.tailored_resumes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tailored_resumes_update_admin"
  ON public.tailored_resumes FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "tailored_resumes_delete_own"
  ON public.tailored_resumes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "tailored_resumes_delete_admin"
  ON public.tailored_resumes FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================
-- STEP 6: Storage Bucket Setup for Resumes
-- ============================================

-- Create the resumes storage bucket (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resumes',
  'resumes',
  false,
  10485760,  -- 10MB limit
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['application/pdf'];

-- Drop existing storage policies first
DROP POLICY IF EXISTS "Users can upload their own resumes" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own resumes" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own resumes" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own resumes" ON storage.objects;
DROP POLICY IF EXISTS "storage_resumes_insert" ON storage.objects;
DROP POLICY IF EXISTS "storage_resumes_select" ON storage.objects;
DROP POLICY IF EXISTS "storage_resumes_update" ON storage.objects;
DROP POLICY IF EXISTS "storage_resumes_delete" ON storage.objects;

-- Storage Policies with unique names
CREATE POLICY "storage_resumes_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'resumes' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "storage_resumes_select"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'resumes' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "storage_resumes_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'resumes' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "storage_resumes_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'resumes' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================
-- DONE! Run this verification query:
-- ============================================
-- SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public';
-- SELECT * FROM storage.buckets WHERE id = 'resumes';
