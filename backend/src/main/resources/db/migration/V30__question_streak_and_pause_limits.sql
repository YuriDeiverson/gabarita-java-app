ALTER TABLE study_streaks
  ADD COLUMN IF NOT EXISTS last_qualified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_question_answered_at TIMESTAMPTZ;

UPDATE study_streaks
SET last_qualified_at = COALESCE(last_qualified_at, last_valid_date::timestamptz),
    last_question_answered_at = COALESCE(last_question_answered_at, last_valid_date::timestamptz)
WHERE last_valid_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS study_streaks_last_qualified_at_idx
  ON study_streaks(last_qualified_at);

CREATE INDEX IF NOT EXISTS study_streaks_last_question_answered_at_idx
  ON study_streaks(last_question_answered_at);
