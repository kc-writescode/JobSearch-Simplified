-- Create app_settings table to store shared configuration values
CREATE TABLE IF NOT EXISTS app_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert the shared email access password
INSERT INTO app_settings (key, value, description)
VALUES ('shared_email_password', 'kc@codes', 'Shared password for admin/user email access')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Enable RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read app settings
CREATE POLICY "Authenticated users can read app_settings"
ON app_settings
FOR SELECT
TO authenticated
USING (true);

-- Policy: Only service role can modify app settings (for security)
-- Regular users cannot update/insert/delete
