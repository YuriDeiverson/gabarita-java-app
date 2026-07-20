CREATE TABLE schedule_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), study_plan_id UUID NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE,
  block_id VARCHAR(160) NOT NULL, is_completed BOOLEAN NOT NULL, completed_at TIMESTAMPTZ,
  UNIQUE(study_plan_id, block_id)
);
CREATE TABLE quiz_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), study_plan_id UUID NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE,
  question_id VARCHAR(160) NOT NULL, answer VARCHAR(80) NOT NULL, is_correct BOOLEAN NOT NULL,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(study_plan_id, question_id)
);
