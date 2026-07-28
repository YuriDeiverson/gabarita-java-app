-- Daily learning loop: roadmap, tasks, persistent timer, reviews and engagement.
CREATE TABLE roadmap_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE,
  name VARCHAR(180) NOT NULL,
  description TEXT,
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(plan_id, position)
);

CREATE TABLE roadmap_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES roadmap_modules(id) ON DELETE CASCADE,
  source_key VARCHAR(180) NOT NULL,
  subject_name VARCHAR(180) NOT NULL,
  title VARCHAR(220) NOT NULL,
  description TEXT,
  objective TEXT,
  content JSONB NOT NULL DEFAULT '{}',
  position INTEGER NOT NULL,
  prerequisite_id UUID REFERENCES roadmap_topics(id),
  planned_minutes INTEGER NOT NULL DEFAULT 30 CHECK (planned_minutes > 0),
  recommended_questions INTEGER NOT NULL DEFAULT 10 CHECK (recommended_questions >= 0),
  minimum_accuracy NUMERIC(5,2) NOT NULL DEFAULT 70 CHECK (minimum_accuracy BETWEEN 0 AND 100),
  difficulty SMALLINT NOT NULL DEFAULT 3 CHECK (difficulty BETWEEN 1 AND 5),
  priority NUMERIC(8,3) NOT NULL DEFAULT 1,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(plan_id, source_key)
);
CREATE INDEX roadmap_topics_plan_order ON roadmap_topics(plan_id, module_id, position) WHERE active;

CREATE TABLE topic_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  roadmap_topic_id UUID NOT NULL REFERENCES roadmap_topics(id) ON DELETE CASCADE,
  status VARCHAR(24) NOT NULL DEFAULT 'LOCKED' CHECK (status IN ('LOCKED','AVAILABLE','IN_PROGRESS','COMPLETED','NEEDS_REVIEW','PAUSED')),
  studied_seconds INTEGER NOT NULL DEFAULT 0 CHECK (studied_seconds >= 0),
  questions_answered INTEGER NOT NULL DEFAULT 0 CHECK (questions_answered >= 0),
  correct_answers INTEGER NOT NULL DEFAULT 0 CHECK (correct_answers >= 0),
  mastery NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (mastery BETWEEN 0 AND 100),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_studied_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, roadmap_topic_id)
);

CREATE TABLE daily_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  plan_id UUID NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE,
  roadmap_topic_id UUID NOT NULL REFERENCES roadmap_topics(id),
  task_date DATE NOT NULL,
  position INTEGER NOT NULL,
  activity_type VARCHAR(24) NOT NULL DEFAULT 'THEORY' CHECK (activity_type IN ('THEORY','QUESTIONS','REVIEW','SIMULATION','READING','FLASHCARDS','REVISION')),
  planned_minutes INTEGER NOT NULL CHECK (planned_minutes > 0),
  completed_minutes INTEGER NOT NULL DEFAULT 0 CHECK (completed_minutes >= 0),
  question_goal INTEGER NOT NULL DEFAULT 0 CHECK (question_goal >= 0),
  questions_answered INTEGER NOT NULL DEFAULT 0 CHECK (questions_answered >= 0),
  correct_answers INTEGER NOT NULL DEFAULT 0 CHECK (correct_answers >= 0),
  minimum_accuracy NUMERIC(5,2) NOT NULL DEFAULT 70 CHECK (minimum_accuracy BETWEEN 0 AND 100),
  achieved_accuracy NUMERIC(5,2),
  suggested_at TIME,
  priority NUMERIC(8,3) NOT NULL DEFAULT 1,
  status VARCHAR(24) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','AVAILABLE','IN_PROGRESS','COMPLETED','SKIPPED','MOVED','BLOCKED')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, plan_id, task_date, roadmap_topic_id, activity_type)
);
CREATE INDEX daily_tasks_user_date ON daily_tasks(user_id, task_date, position);

ALTER TABLE study_sessions
  ADD COLUMN daily_task_id UUID REFERENCES daily_tasks(id),
  ADD COLUMN roadmap_topic_id UUID REFERENCES roadmap_topics(id),
  ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'RUNNING',
  ADD COLUMN mode VARCHAR(20) NOT NULL DEFAULT 'FREE',
  ADD COLUMN paused_at TIMESTAMPTZ,
  ADD COLUMN active_since TIMESTAMPTZ,
  ADD COLUMN effective_seconds INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN paused_seconds INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN notes TEXT,
  ADD COLUMN device VARCHAR(160),
  ADD COLUMN pomodoro JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN pomodoro_cycle INTEGER NOT NULL DEFAULT 0 CHECK (pomodoro_cycle >= 0),
  ADD COLUMN version INTEGER NOT NULL DEFAULT 0;
UPDATE study_sessions SET status=CASE WHEN ended_at IS NULL THEN 'ABANDONED' ELSE 'COMPLETED' END,
  effective_seconds=COALESCE(duration_seconds,0);
ALTER TABLE study_sessions ADD CONSTRAINT study_sessions_status_check
  CHECK (status IN ('RUNNING','PAUSED','COMPLETED','CANCELLED','ABANDONED'));
ALTER TABLE study_sessions ADD CONSTRAINT study_sessions_mode_check CHECK (mode IN ('FREE','POMODORO'));
CREATE UNIQUE INDEX one_active_study_timer_per_user ON study_sessions(user_id)
  WHERE status IN ('RUNNING','PAUSED');

CREATE TABLE session_pauses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  reason VARCHAR(220)
);

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  roadmap_topic_id UUID NOT NULL REFERENCES roadmap_topics(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED','AVAILABLE','COMPLETED','OVERDUE','CANCELLED')),
  previous_accuracy NUMERIC(5,2),
  difficulty SMALLINT NOT NULL DEFAULT 3,
  question_goal INTEGER NOT NULL DEFAULT 5,
  completed_at TIMESTAMPTZ,
  next_interval_days INTEGER,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, roadmap_topic_id, scheduled_date)
);
CREATE INDEX reviews_due ON reviews(user_id, scheduled_date, status);

CREATE TABLE study_streaks (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  current_streak INTEGER NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
  longest_streak INTEGER NOT NULL DEFAULT 0 CHECK (longest_streak >= 0),
  last_valid_date DATE,
  perfect_days INTEGER NOT NULL DEFAULT 0 CHECK (perfect_days >= 0),
  protection_balance INTEGER NOT NULL DEFAULT 0 CHECK (protection_balance >= 0),
  status VARCHAR(20) NOT NULL DEFAULT 'INACTIVE',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE streak_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  study_date DATE NOT NULL,
  studied_minutes INTEGER NOT NULL DEFAULT 0,
  tasks_completed INTEGER NOT NULL DEFAULT 0,
  questions_answered INTEGER NOT NULL DEFAULT 0,
  goal_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  valid BOOLEAN NOT NULL DEFAULT false,
  perfect BOOLEAN NOT NULL DEFAULT false,
  protected BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, study_date)
);
CREATE TABLE streak_protections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  acquired_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  acquisition_reason VARCHAR(240) NOT NULL,
  used_for_date DATE,
  used_at TIMESTAMPTZ,
  use_reason VARCHAR(240),
  expires_at TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE','USED','EXPIRED','CANCELLED'))
);
CREATE UNIQUE INDEX one_protection_per_missed_day ON streak_protections(user_id, used_for_date) WHERE used_for_date IS NOT NULL;

CREATE TABLE xp_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  amount INTEGER NOT NULL CHECK (amount <> 0),
  reason VARCHAR(80) NOT NULL,
  related_type VARCHAR(80),
  related_id UUID,
  idempotency_key VARCHAR(220) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX xp_transactions_user ON xp_transactions(user_id, created_at DESC);

ALTER TABLE notifications
  ADD COLUMN plan_id UUID REFERENCES study_plans(id) ON DELETE CASCADE,
  ADD COLUMN destination VARCHAR(300),
  ADD COLUMN priority VARCHAR(16) NOT NULL DEFAULT 'NORMAL',
  ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'PENDING';
CREATE INDEX notifications_user_status ON notifications(user_id, read_at, scheduled_for DESC);

CREATE TABLE user_notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  enabled BOOLEAN NOT NULL DEFAULT true,
  preferred_time TIME NOT NULL DEFAULT '19:00',
  session_reminder_minutes INTEGER NOT NULL DEFAULT 10,
  streak_reminder BOOLEAN NOT NULL DEFAULT true,
  review_reminder BOOLEAN NOT NULL DEFAULT true,
  daily_summary BOOLEAN NOT NULL DEFAULT true,
  weekly_summary BOOLEAN NOT NULL DEFAULT true,
  push_enabled BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE adaptive_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  roadmap_topic_id UUID NOT NULL REFERENCES roadmap_topics(id) ON DELETE CASCADE,
  recommendation_type VARCHAR(40) NOT NULL,
  mastery_before NUMERIC(5,2),
  mastery_after NUMERIC(5,2),
  reason TEXT NOT NULL,
  applied BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
