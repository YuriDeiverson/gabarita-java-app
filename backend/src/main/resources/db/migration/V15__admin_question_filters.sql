CREATE INDEX IF NOT EXISTS questions_category_metadata ON questions((metadata->>'category'));
CREATE INDEX IF NOT EXISTS questions_admin_order ON questions(updated_at DESC,created_at DESC);
