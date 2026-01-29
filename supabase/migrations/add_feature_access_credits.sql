-- Migration: Add feature access control and credits system
-- This adds feature gating capabilities controlled by master role

-- Add feature_access JSONB column to profiles
-- Structure: { cover_letter_enabled: boolean, resume_tailor_enabled: boolean }
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS feature_access JSONB DEFAULT '{"cover_letter_enabled": false, "resume_tailor_enabled": false}'::jsonb;

-- Add credits column for job application credits
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 0;

-- Add index for faster credit queries
CREATE INDEX IF NOT EXISTS idx_profiles_credits ON public.profiles(credits);

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.feature_access IS 'Feature gating controlled by master: cover_letter_enabled, resume_tailor_enabled';
COMMENT ON COLUMN public.profiles.credits IS 'Number of job application credits available for the user';
