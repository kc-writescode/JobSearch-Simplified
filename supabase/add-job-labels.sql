-- Add labels column to jobs table
-- Allows clients to tag their jobs with labels like "Apply First", "Got a Call", etc.
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS labels TEXT[] DEFAULT '{}';

-- GIN index for fast array-contains queries (filtering by label)
CREATE INDEX IF NOT EXISTS idx_jobs_labels ON public.jobs USING gin(labels);
