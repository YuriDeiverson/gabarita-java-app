CREATE TABLE shared_study_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_key VARCHAR(180) NOT NULL UNIQUE,
  title VARCHAR(240) NOT NULL,
  discipline VARCHAR(240) NOT NULL DEFAULT '',
  base_content TEXT NOT NULL DEFAULT '',
  key_takeaways JSONB NOT NULL DEFAULT '[]'::jsonb,
  content_blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX shared_study_subjects_title ON shared_study_subjects(title);
