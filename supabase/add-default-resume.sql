-- Add is_default column to resumes table
-- Only one resume can be default per user

-- Add the column
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS is_default boolean DEFAULT false;

-- Create a function to ensure only one default resume per user
CREATE OR REPLACE FUNCTION ensure_single_default_resume()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    -- Unset any existing default for this user
    UPDATE resumes
    SET is_default = false
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS trigger_single_default_resume ON resumes;
CREATE TRIGGER trigger_single_default_resume
  BEFORE INSERT OR UPDATE ON resumes
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_resume();

-- Comment for documentation
COMMENT ON COLUMN resumes.is_default IS 'Whether this resume is the default for auto-selection when importing jobs';
