-- ============================================
-- Tailored Resumes Table Setup
-- Run this in Supabase SQL Editor
-- ============================================

-- Create the tailored_resumes table
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

  -- Ensure one tailored resume per job per user
  UNIQUE(user_id, job_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS tailored_resumes_user_id_idx ON public.tailored_resumes(user_id);
CREATE INDEX IF NOT EXISTS tailored_resumes_job_id_idx ON public.tailored_resumes(job_id);
CREATE INDEX IF NOT EXISTS tailored_resumes_status_idx ON public.tailored_resumes(status);

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS
ALTER TABLE public.tailored_resumes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own tailored resumes" ON public.tailored_resumes;
DROP POLICY IF EXISTS "Users can insert their own tailored resumes" ON public.tailored_resumes;
DROP POLICY IF EXISTS "Users can update their own tailored resumes" ON public.tailored_resumes;
DROP POLICY IF EXISTS "Users can delete their own tailored resumes" ON public.tailored_resumes;

-- Policy: Users can view their own tailored resumes
CREATE POLICY "Users can view their own tailored resumes"
ON public.tailored_resumes FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Users can insert their own tailored resumes
CREATE POLICY "Users can insert their own tailored resumes"
ON public.tailored_resumes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own tailored resumes
CREATE POLICY "Users can update their own tailored resumes"
ON public.tailored_resumes FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Users can delete their own tailored resumes
CREATE POLICY "Users can delete their own tailored resumes"
ON public.tailored_resumes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- Updated_at trigger
-- ============================================

-- Create trigger for tailored_resumes table
DROP TRIGGER IF EXISTS update_tailored_resumes_updated_at ON public.tailored_resumes;
CREATE TRIGGER update_tailored_resumes_updated_at
  BEFORE UPDATE ON public.tailored_resumes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
