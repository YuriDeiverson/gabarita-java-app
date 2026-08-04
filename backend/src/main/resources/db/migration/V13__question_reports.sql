CREATE TABLE question_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES questions(id) ON DELETE SET NULL,
  question_key VARCHAR(220) NOT NULL,
  reporter_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason VARCHAR(40) NOT NULL,
  details TEXT NOT NULL DEFAULT '',
  question_snapshot JSONB NOT NULL DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','RESOLVED','DISMISSED')),
  admin_note TEXT NOT NULL DEFAULT '',
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX question_reports_one_pending
  ON question_reports(reporter_user_id,question_key) WHERE status='PENDING';
CREATE INDEX question_reports_admin_queue ON question_reports(status,created_at DESC);
CREATE INDEX question_reports_question ON question_reports(question_id);
