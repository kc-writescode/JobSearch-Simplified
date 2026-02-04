-- ============================================
-- Add Overdue Tracking Fields to Jobs Table
-- For 24-hour claim timeout feature
-- ============================================

-- 1. Add overdue tracking columns to jobs table
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS overdue_released_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS previous_assignee UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 2. Create index for faster filtering by overdue_released_at
CREATE INDEX IF NOT EXISTS idx_jobs_overdue_released_at ON public.jobs(overdue_released_at);
CREATE INDEX IF NOT EXISTS idx_jobs_previous_assignee ON public.jobs(previous_assignee);

-- 3. Add comment for documentation
COMMENT ON COLUMN public.jobs.overdue_released_at IS 'Timestamp when the claim was auto-released due to 24hr timeout';
COMMENT ON COLUMN public.jobs.previous_assignee IS 'UUID of the admin who had the claim before it was auto-released';
