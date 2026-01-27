-- Add applied_by column to jobs table
-- Tracks which admin/VA actually submitted the application
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS applied_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Index for performance report queries
CREATE INDEX IF NOT EXISTS idx_jobs_applied_by ON public.jobs(applied_by);

-- Backfill: for jobs already marked as applied with an assigned_to admin,
-- set applied_by to the assigned admin so historical reports are accurate.
UPDATE public.jobs
SET applied_by = assigned_to
WHERE status = 'applied'
  AND applied_by IS NULL
  AND assigned_to IS NOT NULL;
