CREATE TABLE catalog_contests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(100) NOT NULL UNIQUE,
  label VARCHAR(180) NOT NULL,
  acronym VARCHAR(60) NOT NULL,
  organization VARCHAR(220) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  board VARCHAR(100) NOT NULL,
  exam_date DATE NOT NULL,
  status VARCHAR(80) NOT NULL DEFAULT 'Edital cadastrado',
  state VARCHAR(80) NOT NULL DEFAULT '',
  area VARCHAR(120) NOT NULL DEFAULT '',
  education VARCHAR(160) NOT NULL DEFAULT '',
  vacancies VARCHAR(120) NOT NULL DEFAULT 'Conforme edital',
  remuneration VARCHAR(160) NOT NULL DEFAULT 'Conforme edital',
  location VARCHAR(180) NOT NULL DEFAULT '',
  stages TEXT NOT NULL DEFAULT '',
  notice_reference TEXT NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE catalog_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id UUID NOT NULL REFERENCES catalog_contests(id) ON DELETE CASCADE,
  code VARCHAR(120) NOT NULL,
  label VARCHAR(220) NOT NULL,
  course_id VARCHAR(120) NOT NULL,
  board VARCHAR(100) NOT NULL,
  include_discursive BOOLEAN NOT NULL DEFAULT false,
  requirement VARCHAR(220) NOT NULL DEFAULT '',
  remuneration VARCHAR(160) NOT NULL DEFAULT '',
  vacancies VARCHAR(120) NOT NULL DEFAULT '',
  estimated_hours INTEGER,
  curriculum JSONB NOT NULL DEFAULT '{"topics":[],"studySections":[]}'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(contest_id,code)
);

CREATE INDEX catalog_contests_exam_date ON catalog_contests(active,exam_date);
CREATE INDEX catalog_roles_contest ON catalog_roles(contest_id,active);
CREATE INDEX questions_course_metadata ON questions((metadata->>'courseId'));
