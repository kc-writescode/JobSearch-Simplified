-- Migration: Add custom resume proof support
-- This allows admins to upload a custom resume when marking a job as applied

-- Add custom_resume_proof column to jobs table
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS custom_resume_proof TEXT;

-- Update comment for clarification
COMMENT ON COLUMN public.jobs.submission_proof IS 'Path or URL to the proof of job application (screenshot PDF)';
COMMENT ON COLUMN public.jobs.custom_resume_proof IS 'Path to the custom resume used for this specific job application';

-- Update feature_access structure comment in profiles
COMMENT ON COLUMN public.profiles.feature_access IS 'Feature gating controlled by master: cover_letter_enabled, resume_tailor_enabled, custom_resume_enabled';
