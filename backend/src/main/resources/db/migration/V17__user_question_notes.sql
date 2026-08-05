CREATE TABLE user_question_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_key VARCHAR(260) NOT NULL,
  question_id VARCHAR(180) NOT NULL,
  course_id VARCHAR(120) NOT NULL DEFAULT '',
  question_text TEXT NOT NULL,
  category VARCHAR(180) NOT NULL DEFAULT '',
  topic VARCHAR(220) NOT NULL DEFAULT '',
  reference VARCHAR(300) NOT NULL DEFAULT '',
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, question_key)
);

CREATE INDEX user_question_notes_user_updated
  ON user_question_notes(user_id, updated_at DESC);
