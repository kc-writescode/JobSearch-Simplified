-- ============================================
-- STEP 1: CLEANUP SCRIPT - Run this FIRST
-- ============================================

-- First: Drop the trigger on auth.users (depends on handle_new_user function)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop all functions with CASCADE (they may have dependent triggers)
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- Drop tables last (in reverse dependency order)
-- CASCADE removes dependent RLS policies and triggers automatically
DROP TABLE IF EXISTS public.tailored_resumes CASCADE;
DROP TABLE IF EXISTS public.applications CASCADE;
DROP TABLE IF EXISTS public.jobs CASCADE;
DROP TABLE IF EXISTS public.resumes CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop types
DROP TYPE IF EXISTS public.job_status CASCADE;
DROP TYPE IF EXISTS public.resume_status CASCADE;
DROP TYPE IF EXISTS public.tailored_resume_status CASCADE;
DROP TYPE IF EXISTS public.application_status CASCADE;
DROP TYPE IF EXISTS public.job_type CASCADE;
DROP TYPE IF EXISTS public.work_mode CASCADE;

-- ============================================
-- SUCCESS: All tables, types, and functions removed
-- Next: Run complete-database-schema.sql to recreate
-- ============================================
