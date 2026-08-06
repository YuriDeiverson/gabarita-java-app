ALTER TABLE shared_study_subjects
  ADD COLUMN IF NOT EXISTS study_objective TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS review_summary JSONB NOT NULL DEFAULT '[]'::jsonb;

UPDATE shared_study_subjects
SET review_summary = key_takeaways
WHERE review_summary = '[]'::jsonb
  AND key_takeaways <> '[]'::jsonb;
