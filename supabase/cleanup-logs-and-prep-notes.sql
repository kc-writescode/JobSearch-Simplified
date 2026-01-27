-- 1. Remove the logging table
DROP TABLE IF EXISTS public.client_input_logs CASCADE;

-- 2. Remove the logging trigger and function
DROP TRIGGER IF EXISTS trg_log_profile_changes ON public.profiles;
DROP FUNCTION IF EXISTS log_profile_changes();

-- 3. Ensure client_notes exists on jobs (it should, but safety first)
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS client_notes TEXT;

-- 4. Add a flag for profile updates (optional, or use updated_at)
-- We'll use updated_at for the "green dot" logic.
