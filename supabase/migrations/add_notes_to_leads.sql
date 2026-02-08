-- Migration: Add notes to leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS notes TEXT;

COMMENT ON COLUMN public.leads.notes IS 'Internal admin notes for this cold lead';
