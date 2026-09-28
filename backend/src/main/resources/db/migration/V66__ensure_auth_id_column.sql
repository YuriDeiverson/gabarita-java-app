-- Ensure auth_id column exists in users table
-- This migration fixes missing auth_id column that may have been missed in V64

ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20) DEFAULT 'firebase';
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_id VARCHAR(255);

-- Create index for faster lookups by auth_id
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id) WHERE auth_id IS NOT NULL;

-- Add comments
COMMENT ON COLUMN users.auth_provider IS 'Authentication provider: firebase, supabase, etc.';
COMMENT ON COLUMN users.auth_id IS 'External auth ID (Firebase UID, Supabase user ID, etc.)';
