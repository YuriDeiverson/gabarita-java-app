-- Add admin role column to users table
-- This enables database-level control of administrative access

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

-- Add comment to document the admin role
COMMENT ON COLUMN users.is_admin IS 'Whether the user has administrative privileges';

-- Create index for faster admin lookups
CREATE INDEX IF NOT EXISTS idx_users_admin ON users(is_admin) WHERE is_admin = true;
