-- ============================================
-- Complete Schema Update for Job Application Automation
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Ensure profiles table has all required columns
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS github_url TEXT,
ADD COLUMN IF NOT EXISTS portfolio_url TEXT,
ADD COLUMN IF NOT EXISTS personal_details JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS resume_data JSONB;

-- 2. Ensure jobs table has all required columns
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS resume_id UUID REFERENCES public.resumes(id),
ADD COLUMN IF NOT EXISTS applied_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cover_letter TEXT,
ADD COLUMN IF NOT EXISTS submission_proof TEXT;

-- 3. Update job status constraint (simplified statuses)
ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_status_check;
ALTER TABLE public.jobs ADD CONSTRAINT jobs_status_check
  CHECK (status IN ('saved', 'tailored', 'applied', 'trashed'));

-- 4. Clean up old statuses
UPDATE public.jobs SET status = 'saved' WHERE status = 'tailoring';
UPDATE public.jobs SET status = 'saved' WHERE status = 'pending';
UPDATE public.jobs SET status = 'applied' WHERE status IN ('interviewing', 'offer', 'closed');

-- 5. Ensure tailored_resumes table exists
CREATE TABLE IF NOT EXISTS public.tailored_resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  original_resume_data JSONB,
  tailored_summary TEXT,
  tailored_experience JSONB,
  tailored_skills TEXT[],
  full_tailored_data JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, job_id)
);

-- 6. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_user_status ON public.jobs(user_id, status);
CREATE INDEX IF NOT EXISTS idx_jobs_trashed ON public.jobs(status) WHERE status = 'trashed';
CREATE INDEX IF NOT EXISTS idx_tailored_resumes_user_id ON public.tailored_resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_tailored_resumes_job_id ON public.tailored_resumes(job_id);
CREATE INDEX IF NOT EXISTS idx_tailored_resumes_status ON public.tailored_resumes(status);

-- 7. Ensure resumes table has job_role column
ALTER TABLE public.resumes
ADD COLUMN IF NOT EXISTS job_role TEXT,
ADD COLUMN IF NOT EXISTS title TEXT;

-- 8. Enable RLS on tailored_resumes if not already enabled
ALTER TABLE public.tailored_resumes ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies for tailored_resumes
DROP POLICY IF EXISTS "Users can view their own tailored resumes" ON public.tailored_resumes;
CREATE POLICY "Users can view their own tailored resumes"
ON public.tailored_resumes FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own tailored resumes" ON public.tailored_resumes;
CREATE POLICY "Users can insert their own tailored resumes"
ON public.tailored_resumes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own tailored resumes" ON public.tailored_resumes;
CREATE POLICY "Users can update their own tailored resumes"
ON public.tailored_resumes FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own tailored resumes" ON public.tailored_resumes;
CREATE POLICY "Users can delete their own tailored resumes"
ON public.tailored_resumes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 10. Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10b. Create trigger to sync profile details from JSONB to columns
CREATE OR REPLACE FUNCTION sync_profile_details()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.personal_details IS NOT NULL THEN
    NEW.first_name = COALESCE(NEW.personal_details->>'first_name', NEW.first_name);
    NEW.last_name = COALESCE(NEW.personal_details->>'last_name', NEW.last_name);
    NEW.phone = COALESCE(NEW.personal_details->>'phone', NEW.phone);
    NEW.linkedin_url = COALESCE(NEW.personal_details->>'linkedin_url', NEW.linkedin_url);
    NEW.github_url = COALESCE(NEW.personal_details->>'github_url', NEW.github_url);
    NEW.portfolio_url = COALESCE(NEW.personal_details->>'portfolio_url', NEW.portfolio_url);

    IF NEW.personal_details->>'first_name' IS NOT NULL OR NEW.personal_details->>'last_name' IS NOT NULL THEN
      NEW.full_name = TRIM(
        COALESCE(NEW.personal_details->>'first_name', '') || ' ' ||
        COALESCE(NEW.personal_details->>'middle_name', '') || ' ' ||
        COALESCE(NEW.personal_details->>'last_name', '')
      );
      NEW.full_name = REGEXP_REPLACE(NEW.full_name, '\s+', ' ', 'g');
      NEW.full_name = TRIM(NEW.full_name);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Create triggers for updated_at
DROP TRIGGER IF EXISTS update_jobs_updated_at ON public.jobs;
CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tailored_resumes_updated_at ON public.tailored_resumes;
CREATE TRIGGER update_tailored_resumes_updated_at
  BEFORE UPDATE ON public.tailored_resumes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Sync personal_details JSONB to individual columns
DROP TRIGGER IF EXISTS sync_profile_details_trigger ON public.profiles;
CREATE TRIGGER sync_profile_details_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_details();

-- Index for faster JSONB queries
CREATE INDEX IF NOT EXISTS idx_profiles_personal_details ON public.profiles USING GIN (personal_details);

-- ============================================
-- Summary of Schema:
-- ============================================
--
-- profiles: id, email, full_name, phone, linkedin_url, github_url, resume_data, plan, ...
--
-- resumes: id, user_id, file_name, file_path, job_role, title, status, ...
--
-- jobs: id, user_id, title, company, description, job_url, location, resume_id,
--       status (saved|tailored|applied|trashed), applied_at, cover_letter, submission_proof
--
-- tailored_resumes: id, user_id, job_id, original_resume_data, tailored_summary,
--                   tailored_experience, tailored_skills, full_tailored_data,
--                   status (pending|processing|completed|failed), error_message
--
-- Status Flow:
--   saved -> tailored -> applied
--   Any status -> trashed (user can trash)
--   trashed -> saved (user can restore)
