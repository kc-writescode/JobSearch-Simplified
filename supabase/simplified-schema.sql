-- Simplified Schema Migration
-- Run this to update the database to the new simplified design

-- 1. Add new columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS github_url TEXT;

-- 2. Add new status values to jobs table
-- First, let's update the status column to support new values
ALTER TABLE public.jobs
ALTER COLUMN status TYPE TEXT;

-- Update existing statuses to new simplified values
UPDATE public.jobs SET status = 'saved' WHERE status = 'pending';
UPDATE public.jobs SET status = 'tailored' WHERE status = 'tailored';
UPDATE public.jobs SET status = 'applied' WHERE status = 'applied';

-- 3. Add applied_at column to jobs if not exists
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS applied_at TIMESTAMPTZ;

-- 4. Migrate application data into jobs (if applications table exists)
-- Copy applied_at dates from applications to jobs
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'applications') THEN
    UPDATE public.jobs j
    SET applied_at = a.applied_at
    FROM public.applications a
    WHERE j.id = a.job_id AND a.applied_at IS NOT NULL;

    -- Update job status based on application status
    UPDATE public.jobs j
    SET status = CASE
      WHEN a.status IN ('interview_scheduled', 'interviewed') THEN 'interviewing'
      WHEN a.status = 'offer_received' THEN 'offer'
      WHEN a.status = 'submitted' THEN 'applied'
      ELSE j.status
    END
    FROM public.applications a
    WHERE j.id = a.job_id;
  END IF;
END $$;

-- 5. Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_user_status ON public.jobs(user_id, status);

-- 6. Update RLS policies for profiles (add new columns)
-- Ensure users can update their own profile with new fields
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 7. Add check constraint for valid job statuses
ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_status_check;
ALTER TABLE public.jobs ADD CONSTRAINT jobs_status_check
  CHECK (status IN ('saved', 'tailoring', 'tailored', 'applied', 'interviewing', 'offer', 'closed'));

-- Summary of changes:
-- - profiles: Added phone, linkedin_url, github_url columns
-- - jobs: Simplified statuses (saved, tailoring, tailored, applied, interviewing, offer, closed)
-- - jobs: Added applied_at column
-- - applications: Data merged into jobs (table can be dropped later)
