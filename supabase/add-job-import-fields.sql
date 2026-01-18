-- Add job import fields to jobs table
-- Run this migration to add columns needed for job URL import feature

-- Add new columns for imported job data
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS requirements jsonb;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS salary_range text;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS job_type text;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_remote boolean DEFAULT false;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS raw_import_text text;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS import_confidence integer;

-- Add comment for documentation
COMMENT ON COLUMN jobs.requirements IS 'Array of job requirements extracted from job posting';
COMMENT ON COLUMN jobs.salary_range IS 'Salary range text extracted from job posting';
COMMENT ON COLUMN jobs.job_type IS 'Job type: full-time, part-time, contract, internship';
COMMENT ON COLUMN jobs.is_remote IS 'Whether the job is remote';
COMMENT ON COLUMN jobs.raw_import_text IS 'Raw text extracted from job posting URL (max 5000 chars)';
COMMENT ON COLUMN jobs.import_confidence IS 'AI extraction confidence score 0-100';
