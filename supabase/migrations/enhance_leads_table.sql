-- Migration: Enhance leads table with more fields
-- This ensures we capture more intelligence markers from free tools

ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS user_fullname TEXT,
ADD COLUMN IF NOT EXISTS user_current_title TEXT,
ADD COLUMN IF NOT EXISTS tool_result_data JSONB,
ADD COLUMN IF NOT EXISTS extraction_data JSONB;

COMMENT ON COLUMN public.leads.tool_result_data IS 'Detailed creative output from the AI for the specific tool used';
COMMENT ON COLUMN public.leads.extraction_data IS 'Structured professional data extracted from the resume';
