-- Add cannot_apply_reason column to jobs table
-- This stores the reason when an admin marks a job as "Cannot Apply"

ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS cannot_apply_reason TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.jobs.cannot_apply_reason IS 'Reason provided by admin when marking a job as cannot apply (trashed)';

-- Add delegated_job_id column to jobs table
-- This stores a unique random ID for each job delegated to VA (e.g., JOB-A1B2C3)

ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS delegated_job_id TEXT;

-- Create unique index on delegated_job_id (only for non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS jobs_delegated_job_id_unique
ON public.jobs (delegated_job_id)
WHERE delegated_job_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.jobs.delegated_job_id IS 'Unique random ID assigned when job is delegated to VA (format: JOB-XXXXXX)';
