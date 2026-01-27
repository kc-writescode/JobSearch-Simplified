-- ============================================
-- Add Task Assignment Fields to Jobs Table
-- ============================================

-- 1. Add assignment-related columns to jobs table
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS assignment_status TEXT DEFAULT 'unassigned' CHECK (assignment_status IN ('unassigned', 'assigned', 'in_progress', 'completed')),
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;

-- 2. Create index for faster filtering by assigned_to
CREATE INDEX IF NOT EXISTS idx_jobs_assigned_to ON public.jobs(assigned_to);
CREATE INDEX IF NOT EXISTS idx_jobs_assignment_status ON public.jobs(assignment_status);

-- 3. Update RLS policies (if needed)
-- Note: Admins already have "Admins can update all jobs" policy from fix-schema-mismatches.sql

-- 4. Function to automatically update assigned_at when assigned_to is changed
CREATE OR REPLACE FUNCTION update_assigned_at_column()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.assigned_to IS DISTINCT FROM OLD.assigned_to) AND (NEW.assigned_to IS NOT NULL) THEN
        NEW.assigned_at = NOW();
        -- Auto-set status to assigned if it was unassigned
        IF NEW.assignment_status = 'unassigned' THEN
            NEW.assignment_status = 'assigned';
        END IF;
    ELSIF (NEW.assigned_to IS NULL) THEN
        NEW.assigned_at = NULL;
        NEW.assignment_status = 'unassigned';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Trigger for assigned_at
DROP TRIGGER IF EXISTS update_jobs_assigned_at ON public.jobs;
CREATE TRIGGER update_jobs_assigned_at
    BEFORE UPDATE ON public.jobs
    FOR EACH ROW
    WHEN (NEW.assigned_to IS DISTINCT FROM OLD.assigned_to)
    EXECUTE FUNCTION update_assigned_at_column();
