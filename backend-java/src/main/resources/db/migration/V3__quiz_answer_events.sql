CREATE TABLE quiz_answer_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  study_plan_id UUID NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE,
  question_id VARCHAR(160) NOT NULL,
  answer VARCHAR(80) NOT NULL,
  is_correct BOOLEAN NOT NULL,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX quiz_events_plan_date ON quiz_answer_events(study_plan_id, answered_at);
CREATE INDEX quiz_events_question ON quiz_answer_events(question_id);

INSERT INTO quiz_answer_events(study_plan_id,question_id,answer,is_correct,answered_at)
SELECT study_plan_id,question_id,answer,is_correct,answered_at FROM quiz_progress;
