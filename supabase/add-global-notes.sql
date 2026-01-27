-- Add global_notes to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS global_notes TEXT;
