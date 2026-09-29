-- Set the demo user as admin for testing purposes
-- In production, you should manually set is_admin=true for specific users

UPDATE users SET is_admin = true WHERE email = 'demo@gabarita.ai';
