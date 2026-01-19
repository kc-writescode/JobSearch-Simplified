-- ============================================
-- Job Application Automation - COMPLETE DATABASE SCHEMA
-- Drop all tables and recreate from scratch
-- ============================================

-- Step 1: Drop existing triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 2: Drop existing functions with CASCADE
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- Step 3: Drop existing tables (in reverse dependency order)
-- CASCADE automatically handles RLS policies and any dependent triggers
DROP TABLE IF EXISTS public.tailored_resumes CASCADE;
DROP TABLE IF EXISTS public.applications CASCADE;
DROP TABLE IF EXISTS public.jobs CASCADE;
DROP TABLE IF EXISTS public.resumes CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Step 4: Drop existing types
DROP TYPE IF EXISTS public.job_status CASCADE;
DROP TYPE IF EXISTS public.resume_status CASCADE;
DROP TYPE IF EXISTS public.tailored_resume_status CASCADE;
DROP TYPE IF EXISTS public.application_status CASCADE;
DROP TYPE IF EXISTS public.job_type CASCADE;
DROP TYPE IF EXISTS public.work_mode CASCADE;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CUSTOM TYPES (ENUMS)
-- ============================================

CREATE TYPE public.job_status AS ENUM (
  'saved',
  'tailoring',
  'tailored',
  'applied',
  'interviewing',
  'offer',
  'closed'
);

CREATE TYPE public.resume_status AS ENUM (
  'uploading',
  'parsing',
  'ready',
  'error'
);

CREATE TYPE public.tailored_resume_status AS ENUM (
  'pending',
  'processing',
  'completed',
  'failed'
);

CREATE TYPE public.application_status AS ENUM (
  'draft',
  'submitted',
  'under_review',
  'interview_scheduled',
  'interviewed',
  'offer_received',
  'accepted',
  'rejected',
  'withdrawn'
);

CREATE TYPE public.job_type AS ENUM (
  'full_time',
  'part_time',
  'contract',
  'freelance',
  'internship'
);

CREATE TYPE public.work_mode AS ENUM (
  'remote',
  'onsite',
  'hybrid'
);

-- ============================================
-- PROFILES TABLE
-- ============================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  phone TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  portfolio_url TEXT,
  resume_data JSONB,
  personal_details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_personal_details ON public.profiles USING GIN (personal_details);

-- ============================================
-- RESUMES TABLE
-- ============================================

CREATE TABLE public.resumes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT DEFAULT 'application/pdf',
  parsed_text TEXT,
  parsed_data JSONB,
  status public.resume_status DEFAULT 'uploading',
  error_message TEXT,
  is_primary BOOLEAN DEFAULT false,
  title TEXT,
  job_role TEXT,
  parsed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_resumes_user_id ON public.resumes(user_id);
CREATE INDEX idx_resumes_status ON public.resumes(status);
CREATE INDEX idx_resumes_is_primary ON public.resumes(user_id, is_primary);
CREATE INDEX idx_resumes_file_path ON public.resumes(file_path);

-- ============================================
-- JOBS TABLE
-- ============================================

CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  description TEXT,
  requirements TEXT,
  status public.job_status DEFAULT 'saved',
  resume_id UUID REFERENCES public.resumes(id) ON DELETE SET NULL,
  job_type public.job_type DEFAULT 'full_time',
  work_mode public.work_mode DEFAULT 'onsite',
  location TEXT,
  salary_min INTEGER,
  salary_max INTEGER,
  salary_currency TEXT DEFAULT 'USD',
  job_url TEXT,
  skills TEXT[],
  is_active BOOLEAN DEFAULT true,
  is_favorite BOOLEAN DEFAULT false,
  priority INTEGER DEFAULT 0,
  notes TEXT,
  deadline TIMESTAMPTZ,
  applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_jobs_user_id ON public.jobs(user_id);
CREATE INDEX idx_jobs_status ON public.jobs(status);
CREATE INDEX idx_jobs_is_active ON public.jobs(is_active);
CREATE INDEX idx_jobs_resume_id ON public.jobs(resume_id);
CREATE INDEX idx_jobs_created_at ON public.jobs(created_at DESC);
CREATE INDEX idx_jobs_user_status ON public.jobs(user_id, status);

-- ============================================
-- APPLICATIONS TABLE
-- ============================================

CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  resume_id UUID REFERENCES public.resumes(id) ON DELETE SET NULL,
  status public.application_status DEFAULT 'draft',
  cover_letter TEXT,
  applied_at TIMESTAMPTZ,
  notes TEXT,
  confidence_score INTEGER CHECK (confidence_score BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_applications_user_id ON public.applications(user_id);
CREATE INDEX idx_applications_job_id ON public.applications(job_id);
CREATE INDEX idx_applications_status ON public.applications(status);
CREATE INDEX idx_applications_resume_id ON public.applications(resume_id);

-- Prevent duplicate applications to same job
CREATE UNIQUE INDEX idx_applications_unique_job ON public.applications(user_id, job_id);

-- ============================================
-- TAILORED_RESUMES TABLE
-- ============================================

CREATE TABLE public.tailored_resumes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  original_resume_data JSONB,
  tailored_summary TEXT,
  tailored_experience JSONB,
  tailored_skills TEXT[],
  full_tailored_data JSONB,
  status public.tailored_resume_status DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_tailored_resumes_user_id ON public.tailored_resumes(user_id);
CREATE INDEX idx_tailored_resumes_job_id ON public.tailored_resumes(job_id);
CREATE INDEX idx_tailored_resumes_status ON public.tailored_resumes(status);
CREATE INDEX idx_tailored_resumes_user_job ON public.tailored_resumes(user_id, job_id);
CREATE UNIQUE INDEX idx_tailored_resumes_unique_job ON public.tailored_resumes(user_id, job_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url',
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resumes_updated_at
  BEFORE UPDATE ON public.resumes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tailored_resumes_updated_at
  BEFORE UPDATE ON public.tailored_resumes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tailored_resumes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES RLS POLICIES
-- ============================================

-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================
-- RESUMES RLS POLICIES
-- ============================================

-- Users can view their own resumes
CREATE POLICY "Users can view their own resumes"
  ON public.resumes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all resumes
CREATE POLICY "Admins can view all resumes"
  ON public.resumes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Users can insert their own resumes
CREATE POLICY "Users can insert their own resumes"
  ON public.resumes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own resumes
CREATE POLICY "Users can update their own resumes"
  ON public.resumes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own resumes
CREATE POLICY "Users can delete their own resumes"
  ON public.resumes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- JOBS RLS POLICIES
-- ============================================

-- Users can view their own jobs
CREATE POLICY "Users can view their own jobs"
  ON public.jobs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all jobs
CREATE POLICY "Admins can view all jobs"
  ON public.jobs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Users can insert their own jobs
CREATE POLICY "Users can insert their own jobs"
  ON public.jobs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own jobs
CREATE POLICY "Users can update their own jobs"
  ON public.jobs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own jobs
CREATE POLICY "Users can delete their own jobs"
  ON public.jobs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can update all jobs
CREATE POLICY "Admins can update all jobs"
  ON public.jobs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- APPLICATIONS RLS POLICIES
-- ============================================

-- Users can view their own applications
CREATE POLICY "Users can view their own applications"
  ON public.applications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all applications
CREATE POLICY "Admins can view all applications"
  ON public.applications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Users can insert their own applications
CREATE POLICY "Users can insert their own applications"
  ON public.applications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own applications
CREATE POLICY "Users can update their own applications"
  ON public.applications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own applications
CREATE POLICY "Users can delete their own applications"
  ON public.applications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- TAILORED_RESUMES RLS POLICIES
-- ============================================

-- Users can view their own tailored resumes
CREATE POLICY "Users can view their own tailored resumes"
  ON public.tailored_resumes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all tailored resumes
CREATE POLICY "Admins can view all tailored resumes"
  ON public.tailored_resumes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Users can insert their own tailored resumes
CREATE POLICY "Users can insert their own tailored resumes"
  ON public.tailored_resumes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own tailored resumes
CREATE POLICY "Users can update their own tailored resumes"
  ON public.tailored_resumes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own tailored resumes
CREATE POLICY "Users can delete their own tailored resumes"
  ON public.tailored_resumes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- ENABLE REALTIME SUBSCRIPTIONS
-- ============================================

-- Enable realtime for tables that need instant updates
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.jobs;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.tailored_resumes;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.resumes;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- ============================================
-- TO MAKE A USER AN ADMIN, RUN:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@example.com';
-- ============================================
