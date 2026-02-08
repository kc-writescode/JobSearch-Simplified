-- Migration: Create leads table for free tools
-- This stores data from users who use our free tools

CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    full_name TEXT,
    resume_url TEXT,
    parsed_data JSONB,
    tool_used TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add index for email and tool_used
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_tool_used ON public.leads(tool_used);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (since these are cold leads)
CREATE POLICY "Allow anonymous inserts" ON public.leads
    FOR INSERT WITH CHECK (true);

-- Allow admins/masters to view all leads
CREATE POLICY "Allow admins/masters to view all leads" ON public.leads
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'master')
        )
    );
