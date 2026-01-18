-- ============================================
-- Jobs Table Setup
-- Run this in Supabase SQL Editor
-- ============================================

-- Create job_status enum type
DO $$ BEGIN
  CREATE TYPE job_status AS ENUM ('pending', 'tailored', 'applied');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create the jobs table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  description TEXT,
  status job_status DEFAULT 'pending',
  job_url TEXT,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add status column if table already exists but column doesn't
DO $$ BEGIN
  ALTER TABLE public.jobs ADD COLUMN status job_status DEFAULT 'pending';
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS jobs_user_id_idx ON public.jobs(user_id);
CREATE INDEX IF NOT EXISTS jobs_status_idx ON public.jobs(status);

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can insert their own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can update their own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can delete their own jobs" ON public.jobs;

-- Policy: Users can view their own jobs
CREATE POLICY "Users can view their own jobs"
ON public.jobs FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Users can insert their own jobs
CREATE POLICY "Users can insert their own jobs"
ON public.jobs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own jobs
CREATE POLICY "Users can update their own jobs"
ON public.jobs FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Users can delete their own jobs
CREATE POLICY "Users can delete their own jobs"
ON public.jobs FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- Updated_at trigger
-- ============================================

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for jobs table
DROP TRIGGER IF EXISTS update_jobs_updated_at ON public.jobs;
CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
