-- ============================================
-- Add Trashed At Tracking Field to Jobs Table
-- For 3-day auto-deletion of trashed jobs
-- ============================================

-- 1. Add trashed_at column to jobs table
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS trashed_at TIMESTAMPTZ;

-- 2. Create index for faster filtering by trashed_at
CREATE INDEX IF NOT EXISTS idx_jobs_trashed_at ON public.jobs(trashed_at);

-- 3. Add comment for documentation
COMMENT ON COLUMN public.jobs.trashed_at IS 'Timestamp when the job was moved to trash. Jobs are auto-deleted 3 days after this timestamp.';

-- 4. Backfill existing trashed jobs with updated_at as trashed_at
UPDATE public.jobs
SET trashed_at = updated_at
WHERE status = 'trashed' AND trashed_at IS NULL;
