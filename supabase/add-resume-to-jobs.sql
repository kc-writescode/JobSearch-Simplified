-- Add resume_id column to jobs table
-- This links a specific resume to each job for tailoring

ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS resume_id UUID REFERENCES public.resumes(id) ON DELETE SET NULL;

-- Add job_role column to resumes if not exists
ALTER TABLE public.resumes
ADD COLUMN IF NOT EXISTS job_role TEXT;

-- Create index for faster joins
CREATE INDEX IF NOT EXISTS idx_jobs_resume_id ON public.jobs(resume_id);
CREATE INDEX IF NOT EXISTS idx_resumes_job_role ON public.resumes(job_role);

-- Update job status enum to include new statuses
-- (Already handled by simplified-schema.sql, but ensure compatibility)
