CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  email VARCHAR(180) UNIQUE,
  timezone VARCHAR(60) NOT NULL DEFAULT 'America/Maceio',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO users (id, name, email) VALUES ('00000000-0000-0000-0000-000000000001', 'Usuário demonstração', 'demo@gabarita.ai');

CREATE TABLE exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name VARCHAR(180) NOT NULL,
  board VARCHAR(100), exam_year INTEGER, description TEXT, active BOOLEAN NOT NULL DEFAULT true
);
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), exam_id UUID REFERENCES exams(id),
  name VARCHAR(160) NOT NULL, weight NUMERIC(6,3) NOT NULL DEFAULT 1,
  frequency NUMERIC(6,3) NOT NULL DEFAULT 1, difficulty SMALLINT NOT NULL DEFAULT 3
);
CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL, weight NUMERIC(6,3) NOT NULL DEFAULT 1,
  frequency NUMERIC(6,3) NOT NULL DEFAULT 1, difficulty SMALLINT NOT NULL DEFAULT 3, active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE study_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id),
  exam_id UUID REFERENCES exams(id), course_id VARCHAR(100), title VARCHAR(180) NOT NULL,
  exam_date DATE NOT NULL, status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', is_primary BOOLEAN NOT NULL DEFAULT false,
  is_template BOOLEAN NOT NULL DEFAULT false, block_minutes INTEGER NOT NULL DEFAULT 60,
  break_minutes INTEGER NOT NULL DEFAULT 10, final_sprint_days INTEGER NOT NULL DEFAULT 14,
  weekly_goal_minutes INTEGER, monthly_goal_minutes INTEGER, version INTEGER NOT NULL DEFAULT 1,
  settings JSONB NOT NULL DEFAULT '{}', created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX one_primary_plan_per_user ON study_plans(user_id) WHERE is_primary AND status = 'ACTIVE';
CREATE TABLE plan_topics (
  plan_id UUID REFERENCES study_plans(id) ON DELETE CASCADE, topic_id UUID REFERENCES topics(id),
  priority NUMERIC(8,4), enabled BOOLEAN NOT NULL DEFAULT true, PRIMARY KEY(plan_id, topic_id)
);
CREATE TABLE availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), plan_id UUID NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE,
  weekday SMALLINT NOT NULL CHECK (weekday BETWEEN 0 AND 6), start_time TIME NOT NULL, end_time TIME NOT NULL,
  block_minutes INTEGER, break_minutes INTEGER, UNIQUE(plan_id, weekday, start_time)
);
CREATE TABLE unavailable_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), plan_id UUID NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE,
  starts_at TIMESTAMPTZ NOT NULL, ends_at TIMESTAMPTZ NOT NULL, reason VARCHAR(240), CHECK(ends_at > starts_at)
);
CREATE TABLE plan_history (
  id BIGSERIAL PRIMARY KEY, plan_id UUID NOT NULL, version INTEGER NOT NULL, action VARCHAR(40) NOT NULL,
  snapshot JSONB NOT NULL, changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE schedule_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), plan_id UUID NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES topics(id), block_type VARCHAR(24) NOT NULL DEFAULT 'STUDY',
  starts_at TIMESTAMPTZ NOT NULL, duration_minutes INTEGER NOT NULL, position INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING', source_block_id UUID, title VARCHAR(220) NOT NULL,
  methodology VARCHAR(240), details JSONB NOT NULL DEFAULT '{}', completed_at TIMESTAMPTZ
);
CREATE INDEX schedule_by_plan_date ON schedule_blocks(plan_id, starts_at);

CREATE TABLE passages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), title VARCHAR(240), content TEXT NOT NULL, source VARCHAR(300)
);
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), exam_id UUID REFERENCES exams(id), subject_id UUID REFERENCES subjects(id),
  topic_id UUID REFERENCES topics(id), passage_id UUID REFERENCES passages(id), board VARCHAR(100), exam_year INTEGER,
  type VARCHAR(24) NOT NULL, statement TEXT NOT NULL, explanation TEXT, difficulty SMALLINT NOT NULL DEFAULT 3,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', correct_answer JSONB NOT NULL, metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE question_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  label VARCHAR(10) NOT NULL, content TEXT NOT NULL, position INTEGER NOT NULL, UNIQUE(question_id, label)
);
CREATE INDEX question_filters ON questions(exam_id, board, subject_id, topic_id, exam_year, difficulty, status);

CREATE TABLE simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id), plan_id UUID REFERENCES study_plans(id),
  title VARCHAR(180) NOT NULL, status VARCHAR(20) NOT NULL DEFAULT 'CREATED', score_mode VARCHAR(20) NOT NULL DEFAULT 'CEBRASPE',
  time_limit_seconds INTEGER, started_at TIMESTAMPTZ, paused_at TIMESTAMPTZ, finished_at TIMESTAMPTZ,
  elapsed_seconds INTEGER NOT NULL DEFAULT 0, settings JSONB NOT NULL DEFAULT '{}', created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE simulation_questions (
  simulation_id UUID REFERENCES simulations(id) ON DELETE CASCADE, question_id UUID REFERENCES questions(id),
  position INTEGER NOT NULL, PRIMARY KEY(simulation_id, question_id), UNIQUE(simulation_id, position)
);
CREATE TABLE answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id),
  simulation_id UUID REFERENCES simulations(id) ON DELETE CASCADE, question_id UUID NOT NULL REFERENCES questions(id),
  answer JSONB NOT NULL, correct BOOLEAN, time_spent_seconds INTEGER NOT NULL DEFAULT 0,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(simulation_id, question_id)
);
CREATE TABLE user_question_state (
  user_id UUID REFERENCES users(id), question_id UUID REFERENCES questions(id), favorite BOOLEAN NOT NULL DEFAULT false,
  personal_note TEXT, wrong_count INTEGER NOT NULL DEFAULT 0, correct_streak INTEGER NOT NULL DEFAULT 0,
  mastery NUMERIC(5,4) NOT NULL DEFAULT 0, next_review_at TIMESTAMPTZ, PRIMARY KEY(user_id, question_id)
);
CREATE TABLE study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id), plan_id UUID REFERENCES study_plans(id),
  topic_id UUID REFERENCES topics(id), schedule_block_id UUID REFERENCES schedule_blocks(id),
  started_at TIMESTAMPTZ NOT NULL, ended_at TIMESTAMPTZ, duration_seconds INTEGER, retention_score NUMERIC(5,4)
);
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES users(id), type VARCHAR(40) NOT NULL,
  title VARCHAR(180) NOT NULL, message TEXT NOT NULL, scheduled_for TIMESTAMPTZ NOT NULL, read_at TIMESTAMPTZ, metadata JSONB NOT NULL DEFAULT '{}'
);
