-- ============================================
-- EMERGENCY RESET - Use this if database is corrupted
-- ============================================

-- For Supabase: Use the SQL Editor to run this
-- It will safely reset everything

-- Step 1: Safely drop everything that might exist
-- Don't worry about errors - these just mean it's already gone

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_resumes_updated_at ON public.resumes;
DROP TRIGGER IF EXISTS update_jobs_updated_at ON public.jobs;
DROP TRIGGER IF EXISTS update_applications_updated_at ON public.applications;
DROP TRIGGER IF EXISTS update_tailored_resumes_updated_at ON public.tailored_resumes;

-- Try to drop functions (CASCADE handles any dependent triggers)
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- Now manually drop each table with minimal assumptions
DROP TABLE IF EXISTS public.tailored_resumes;
DROP TABLE IF EXISTS public.applications;
DROP TABLE IF EXISTS public.jobs;
DROP TABLE IF EXISTS public.resumes;
DROP TABLE IF EXISTS public.profiles;

-- Drop types
DROP TYPE IF EXISTS public.job_status;
DROP TYPE IF EXISTS public.resume_status;
DROP TYPE IF EXISTS public.tailored_resume_status;
DROP TYPE IF EXISTS public.application_status;
DROP TYPE IF EXISTS public.job_type;
DROP TYPE IF EXISTS public.work_mode;
