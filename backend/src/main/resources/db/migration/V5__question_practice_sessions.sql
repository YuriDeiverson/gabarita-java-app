ALTER TABLE study_sessions
  ADD COLUMN session_kind VARCHAR(20) NOT NULL DEFAULT 'STUDY',
  ADD COLUMN questions_answered INTEGER NOT NULL DEFAULT 0 CHECK (questions_answered >= 0),
  ADD COLUMN correct_answers INTEGER NOT NULL DEFAULT 0 CHECK (correct_answers >= 0),
  ADD COLUMN context_title VARCHAR(220);
ALTER TABLE study_sessions ADD CONSTRAINT study_sessions_kind_check
  CHECK (session_kind IN ('STUDY','QUESTIONS'));

CREATE TABLE question_session_answers (
  session_id UUID NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
  question_id VARCHAR(180) NOT NULL,
  correct BOOLEAN NOT NULL,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY(session_id,question_id)
);
