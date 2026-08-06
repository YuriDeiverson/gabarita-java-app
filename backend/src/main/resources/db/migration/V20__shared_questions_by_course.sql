-- Uma questão passa a existir uma única vez e pode ser vinculada a vários cursos.
CREATE TABLE question_courses (
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  course_id VARCHAR(120) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY(question_id,course_id)
);

CREATE INDEX question_courses_course ON question_courses(course_id,question_id);

CREATE TABLE question_course_legacy_ids (
  question_id UUID NOT NULL,
  course_id VARCHAR(120) NOT NULL,
  legacy_id VARCHAR(180) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY(course_id,legacy_id),
  FOREIGN KEY(question_id,course_id) REFERENCES question_courses(question_id,course_id) ON DELETE CASCADE
);

CREATE INDEX question_course_legacy_question ON question_course_legacy_ids(question_id,course_id);

INSERT INTO question_courses(question_id,course_id)
SELECT id,metadata->>'courseId' FROM questions WHERE COALESCE(metadata->>'courseId','')<>''
ON CONFLICT DO NOTHING;

INSERT INTO question_course_legacy_ids(question_id,course_id,legacy_id)
SELECT id,metadata->>'courseId',metadata->>'legacyId' FROM questions
WHERE COALESCE(metadata->>'courseId','')<>'' AND COALESCE(metadata->>'legacyId','')<>''
ON CONFLICT DO NOTHING;

DROP INDEX IF EXISTS questions_course_legacy_unique;
DROP INDEX IF EXISTS questions_course_statement_unique;

-- Primeiro consolida enunciados integralmente iguais que estavam copiados entre cursos.
CREATE TEMP TABLE question_merge_map(
  duplicate_id UUID PRIMARY KEY,
  keeper_id UUID NOT NULL
) ON COMMIT DROP;

INSERT INTO question_merge_map(duplicate_id,keeper_id)
SELECT id,keeper FROM (
  SELECT id,
    first_value(id) OVER(PARTITION BY regexp_replace(lower(statement),'[^[:alnum:]]','','g') ORDER BY created_at,id) keeper,
    row_number() OVER(PARTITION BY regexp_replace(lower(statement),'[^[:alnum:]]','','g') ORDER BY created_at,id) position
  FROM questions
) ranked WHERE position>1;

INSERT INTO question_courses(question_id,course_id)
SELECT map.keeper_id,link.course_id FROM question_courses link JOIN question_merge_map map ON map.duplicate_id=link.question_id
ON CONFLICT DO NOTHING;

INSERT INTO question_course_legacy_ids(question_id,course_id,legacy_id)
SELECT map.keeper_id,legacy.course_id,legacy.legacy_id
FROM question_course_legacy_ids legacy JOIN question_merge_map map ON map.duplicate_id=legacy.question_id
ON CONFLICT(course_id,legacy_id) DO UPDATE SET question_id=EXCLUDED.question_id;

UPDATE quiz_progress progress SET question_id=map.keeper_id::text FROM question_merge_map map WHERE progress.question_id=map.duplicate_id::text;
UPDATE quiz_answer_events event SET question_id=map.keeper_id::text FROM question_merge_map map WHERE event.question_id=map.duplicate_id::text;
UPDATE question_session_answers answer SET question_id=map.keeper_id::text FROM question_merge_map map WHERE answer.question_id=map.duplicate_id::text;
UPDATE user_question_notes note SET question_id=map.keeper_id::text,
  question_key=note.course_id||':'||map.keeper_id::text FROM question_merge_map map WHERE note.question_id=map.duplicate_id::text;
UPDATE question_reports report SET question_id=map.keeper_id,
  question_key=regexp_replace(report.question_key,map.duplicate_id::text||'$',map.keeper_id::text)
FROM question_merge_map map WHERE report.question_id=map.duplicate_id;
UPDATE simulation_questions item SET question_id=map.keeper_id FROM question_merge_map map WHERE item.question_id=map.duplicate_id;
UPDATE answers answer SET question_id=map.keeper_id FROM question_merge_map map WHERE answer.question_id=map.duplicate_id;
UPDATE user_question_state state SET question_id=map.keeper_id FROM question_merge_map map WHERE state.question_id=map.duplicate_id;

DELETE FROM questions question USING question_merge_map map WHERE question.id=map.duplicate_id;

-- Depois mantém uma única questão para cada uma das 13 afirmações repetidas de Jornalismo.
TRUNCATE question_merge_map;

INSERT INTO question_merge_map(duplicate_id,keeper_id)
SELECT id,keeper FROM (
  SELECT id,
    first_value(id) OVER(PARTITION BY fingerprint ORDER BY created_at,id) keeper,
    row_number() OVER(PARTITION BY fingerprint ORDER BY created_at,id) position,
    count(*) OVER(PARTITION BY fingerprint) amount
  FROM (
    SELECT question.id,question.created_at,
      regexp_replace(
        regexp_replace(
          regexp_replace(lower(question.statement),'^\[[^]]+\]\s*','','i'),
          '^[^:]*:\s*','','i'
        ),
        '\s*\((simulado|item inédito)[^)]*\)\s*$','','i'
      ) raw_assertion,
      regexp_replace(
        regexp_replace(
          regexp_replace(
            regexp_replace(lower(question.statement),'^\[[^]]+\]\s*','','i'),
            '^[^:]*:\s*','','i'
          ),
          '\s*\((simulado|item inédito)[^)]*\)\s*$','','i'
        ),
        '[^[:alnum:]]','','g'
      ) fingerprint
    FROM questions question
    WHERE EXISTS(SELECT 1 FROM question_courses link WHERE link.question_id=question.id AND link.course_id='jornalismo')
      AND question.metadata->>'category' IN('Conhecimentos Específicos','Conhecimentos Específicos - Jornalismo')
      AND position(':' IN question.statement)>0
  ) candidates
  WHERE length(fingerprint)>=60
) ranked WHERE position>1 AND amount>1;

INSERT INTO question_courses(question_id,course_id)
SELECT map.keeper_id,link.course_id FROM question_courses link JOIN question_merge_map map ON map.duplicate_id=link.question_id
ON CONFLICT DO NOTHING;

INSERT INTO question_course_legacy_ids(question_id,course_id,legacy_id)
SELECT map.keeper_id,legacy.course_id,legacy.legacy_id
FROM question_course_legacy_ids legacy JOIN question_merge_map map ON map.duplicate_id=legacy.question_id
ON CONFLICT(course_id,legacy_id) DO UPDATE SET question_id=EXCLUDED.question_id;

UPDATE quiz_progress progress SET question_id=map.keeper_id::text FROM question_merge_map map WHERE progress.question_id=map.duplicate_id::text;
UPDATE quiz_answer_events event SET question_id=map.keeper_id::text FROM question_merge_map map WHERE event.question_id=map.duplicate_id::text;
UPDATE question_session_answers answer SET question_id=map.keeper_id::text FROM question_merge_map map WHERE answer.question_id=map.duplicate_id::text;
UPDATE user_question_notes note SET question_id=map.keeper_id::text,
  question_key=note.course_id||':'||map.keeper_id::text FROM question_merge_map map WHERE note.question_id=map.duplicate_id::text;
UPDATE question_reports report SET question_id=map.keeper_id,
  question_key=regexp_replace(report.question_key,map.duplicate_id::text||'$',map.keeper_id::text)
FROM question_merge_map map WHERE report.question_id=map.duplicate_id;
UPDATE simulation_questions item SET question_id=map.keeper_id FROM question_merge_map map WHERE item.question_id=map.duplicate_id;
UPDATE answers answer SET question_id=map.keeper_id FROM question_merge_map map WHERE answer.question_id=map.duplicate_id;
UPDATE user_question_state state SET question_id=map.keeper_id FROM question_merge_map map WHERE state.question_id=map.duplicate_id;

DELETE FROM questions question USING question_merge_map map WHERE question.id=map.duplicate_id;

-- Curso e ID de importação pertencem às associações, não ao conteúdo da questão.
UPDATE questions SET metadata=metadata-'courseId'-'legacyId';

CREATE UNIQUE INDEX questions_normalized_statement_unique
  ON questions(md5(regexp_replace(lower(statement),'[^[:alnum:]]','','g')));
