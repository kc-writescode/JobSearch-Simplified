-- ============================================
-- Client Notes, Certifications, and Input Logging
-- ============================================

-- 1. Add job-specific client notes to jobs table
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS client_notes TEXT;

-- 2. Add certifications to profiles table
-- Stores an array of { name: string, url: string, date: string }
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]'::jsonb;

-- 3. Create logs table for tracking client input history
CREATE TABLE IF NOT EXISTS public.client_input_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE, -- Optional: if log is job-specific
    field_name TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    changed_by UUID REFERENCES auth.users(id)
);

-- 4. Index for fast log retrieval
CREATE INDEX IF NOT EXISTS idx_client_logs_profile_id ON public.client_input_logs(profile_id);
CREATE INDEX IF NOT EXISTS idx_client_logs_job_id ON public.client_input_logs(job_id);

-- 5. Trigger to log changes to profile details
CREATE OR REPLACE FUNCTION log_profile_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log if the values actually changed and are not null for both
    IF (OLD.personal_details IS DISTINCT FROM NEW.personal_details) THEN
        INSERT INTO public.client_input_logs (profile_id, field_name, old_value, new_value)
        VALUES (NEW.id, 'personal_details', OLD.personal_details::text, NEW.personal_details::text);
    END IF;

    IF (OLD.certifications IS DISTINCT FROM NEW.certifications) THEN
        INSERT INTO public.client_input_logs (profile_id, field_name, old_value, new_value)
        VALUES (NEW.id, 'certifications', OLD.certifications::text, NEW.certifications::text);
    END IF;

    IF (OLD.global_notes IS DISTINCT FROM NEW.global_notes) THEN
        INSERT INTO public.client_input_logs (profile_id, field_name, old_value, new_value)
        VALUES (NEW.id, 'global_notes', OLD.global_notes, NEW.global_notes);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_log_profile_changes ON public.profiles;
CREATE TRIGGER trg_log_profile_changes
    AFTER UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION log_profile_changes();

-- 6. Enable RLS on logs
ALTER TABLE public.client_input_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own logs"
    ON public.client_input_logs FOR SELECT
    TO authenticated
    USING (auth.uid() = profile_id OR auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin' OR role = 'master'));

CREATE POLICY "Users can insert their own logs"
    ON public.client_input_logs FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = profile_id OR auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin' OR role = 'master'));
