-- ============================================
-- Add Personal Details to Profiles Table
-- Run this in Supabase SQL Editor
-- ============================================

-- The personal details form saves all data as a JSONB field
-- This is more flexible and avoids schema changes for new fields

-- 1. Add personal_details JSONB column (stores all form fields)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS personal_details JSONB DEFAULT '{}'::jsonb;

-- 2. Add individual commonly-accessed fields for easier queries
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS github_url TEXT,
ADD COLUMN IF NOT EXISTS portfolio_url TEXT;

-- 3. Add resume_data for parsed resume information
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS resume_data JSONB;

-- 4. Create trigger to sync first_name, last_name, phone from personal_details
CREATE OR REPLACE FUNCTION sync_profile_details()
RETURNS TRIGGER AS $$
BEGIN
  -- Sync commonly accessed fields from personal_details JSONB
  IF NEW.personal_details IS NOT NULL THEN
    NEW.first_name = COALESCE(NEW.personal_details->>'first_name', NEW.first_name);
    NEW.last_name = COALESCE(NEW.personal_details->>'last_name', NEW.last_name);
    NEW.phone = COALESCE(NEW.personal_details->>'phone', NEW.phone);
    NEW.linkedin_url = COALESCE(NEW.personal_details->>'linkedin_url', NEW.linkedin_url);
    NEW.github_url = COALESCE(NEW.personal_details->>'github_url', NEW.github_url);
    NEW.portfolio_url = COALESCE(NEW.personal_details->>'portfolio_url', NEW.portfolio_url);

    -- Update full_name from first + middle + last
    IF NEW.personal_details->>'first_name' IS NOT NULL OR NEW.personal_details->>'last_name' IS NOT NULL THEN
      NEW.full_name = TRIM(
        COALESCE(NEW.personal_details->>'first_name', '') || ' ' ||
        COALESCE(NEW.personal_details->>'middle_name', '') || ' ' ||
        COALESCE(NEW.personal_details->>'last_name', '')
      );
      -- Clean up extra spaces
      NEW.full_name = REGEXP_REPLACE(NEW.full_name, '\s+', ' ', 'g');
      NEW.full_name = TRIM(NEW.full_name);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_profile_details_trigger ON public.profiles;
CREATE TRIGGER sync_profile_details_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_details();

-- 5. Create index for faster JSONB queries
CREATE INDEX IF NOT EXISTS idx_profiles_personal_details ON public.profiles USING GIN (personal_details);

-- ============================================
-- Personal Details JSONB Structure
-- ============================================
-- {
--   "first_name": "John",
--   "middle_name": "M",
--   "last_name": "Doe",
--   "email": "john@example.com",
--   "password_applications": "...",
--   "date_of_birth": "1990-01-15",
--   "phone": "+1234567890",
--
--   "address_line_1": "123 Main St",
--   "address_line_2": "Apt 4B",
--   "city": "San Francisco",
--   "county": "San Francisco",
--   "state": "CA",
--   "country": "USA",
--   "zipcode": "94105",
--
--   "linkedin_url": "https://linkedin.com/in/johndoe",
--   "github_url": "https://github.com/johndoe",
--   "portfolio_url": "https://johndoe.com",
--
--   "desired_salary": "150000",
--   "desired_salary_range": "140000-160000",
--   "current_salary": "120000",
--   "start_date": "2024-02-01",
--   "notice_period": "2 weeks",
--   "willing_to_relocate": "yes",
--   "preferred_cities": "San Francisco, New York",
--   "preferred_shift": "Day",
--   "preferred_days": "Mon-Fri",
--   "travel_percentage": "25",
--   "experience_travel": "yes",
--   "able_overtime": "yes",
--   "languages": "English, Spanish",
--
--   "university": "MIT",
--   "field_of_study": "Computer Science",
--   "degree": "Bachelor's",
--   "gpa": "3.8",
--   "education_from": "2008",
--   "education_to": "2012",
--
--   "is_us_citizen": "yes",
--   "eligible_to_work_us": "yes",
--   "needs_sponsorship": "no",
--   "sponsorship_type": "",
--   "visa_status_explanation": "",
--   "citizenship_status": "Citizen",
--   "nationality": "American",
--   "authorized_work": "yes",
--   "visa_start_date": "",
--   "visa_expiration_date": "",
--   "h1b_info": "",
--
--   "security_clearance": "None",
--   "security_q1": "What is your first school?",
--   "security_a1": "...",
--   "security_q2": "...",
--   "security_a2": "...",
--   "security_q3": "...",
--   "security_a3": "...",
--
--   "is_veteran": "no",
--   "ethnicity": "",
--   "gender": "",
--   "sexual_orientation": "",
--   "disabilities": "no",
--   "driving_license": "yes",
--   "ssn": "xxx-xx-xxxx",
--
--   "linkedin_email": "...",
--   "linkedin_password": "...",
--
--   "references": [
--     {"name": "Jane Smith", "email": "jane@company.com", "position": "Manager", "relationship": "Former Manager", "phone": "+1..."},
--     {"name": "...", ...},
--     {"name": "...", ...}
--   ]
-- }
