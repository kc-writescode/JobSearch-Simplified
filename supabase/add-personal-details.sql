-- Add personal_details column to profiles table
-- This stores the comprehensive profile information for job applications

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS personal_details JSONB DEFAULT NULL;

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_profiles_personal_details ON public.profiles USING GIN (personal_details);

-- Update the updated_at trigger (if it exists)
-- This will be handled by the existing trigger
