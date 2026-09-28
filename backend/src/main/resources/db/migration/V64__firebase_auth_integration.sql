-- Firebase Auth integration - replaces Supabase auth integration
-- Firebase manages authentication externally. This migration ensures the users table is compatible.
-- The backend API will sync Firebase users to the public.users table.

-- Add a column to track the auth provider (firebase, supabase, etc.)
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20) DEFAULT 'firebase';
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_id VARCHAR(255); -- Firebase UID or Supabase user ID

-- Create index for faster lookups by auth_id
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id) WHERE auth_id IS NOT NULL;

-- Add comment to document the Firebase integration
COMMENT ON COLUMN users.auth_provider IS 'Authentication provider: firebase, supabase, etc.';
COMMENT ON COLUMN users.auth_id IS 'External auth ID (Firebase UID, Supabase user ID, etc.)';

-- Since Firebase doesn't have database triggers like Supabase, the backend API will handle user creation
-- when a user first authenticates with Firebase. This is done in the authentication flow.
