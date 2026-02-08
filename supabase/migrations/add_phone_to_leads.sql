-- Migration: Add user_phone to leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS user_phone TEXT;

COMMENT ON COLUMN public.leads.user_phone IS 'Captured phone number from the resume content';
