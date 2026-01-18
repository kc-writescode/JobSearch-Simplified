-- Update Job Statuses Migration
-- Simplifies to 3 categories: Applying, Applied, Trashed
-- Run this in your Supabase SQL editor

-- 1. Drop the old constraint
ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_status_check;

-- 2. Add 'trashed' status and update constraint with simplified statuses
-- Valid statuses:
--   Applying: saved, tailored (jobs pending application)
--   Applied: applied (jobs that have been submitted)
--   Trashed: trashed (removed jobs)
ALTER TABLE public.jobs ADD CONSTRAINT jobs_status_check
  CHECK (status IN ('saved', 'tailored', 'applied', 'trashed'));

-- 3. Clean up old statuses - migrate to new simplified ones
-- tailoring -> saved (treat as still in applying state)
UPDATE public.jobs SET status = 'saved' WHERE status = 'tailoring';

-- interviewing, offer, closed -> applied (all are post-application)
UPDATE public.jobs SET status = 'applied' WHERE status IN ('interviewing', 'offer', 'closed');

-- 4. Add cover_letter column if not exists (for storing generated cover letters)
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS cover_letter TEXT;

-- 5. Add submission_proof column if not exists (for VA to add proof of submission)
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS submission_proof TEXT;

-- 6. Create index for trashed status queries
CREATE INDEX IF NOT EXISTS idx_jobs_trashed ON public.jobs(status) WHERE status = 'trashed';

-- Summary of statuses:
-- 'saved'    - Job added, pending tailoring and application (Applying tab)
-- 'tailored' - Resume has been tailored, ready to apply (Applying tab)
-- 'applied'  - Job has been applied to (Applied tab)
-- 'trashed'  - Job removed by user (Trashed tab)
