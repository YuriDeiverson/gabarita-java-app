-- Referências editoriais pertencem aos metadados. Elas não podem transformar
-- o mesmo enunciado em várias questões nem permanecer visíveis no texto.
DROP INDEX IF EXISTS questions_normalized_statement_unique;

CREATE TEMP TABLE question_reference_duplicates(
  duplicate_id UUID PRIMARY KEY,
  keeper_id UUID NOT NULL
) ON COMMIT DROP;

INSERT INTO question_reference_duplicates(duplicate_id,keeper_id)
SELECT id,keeper_id
FROM (
  SELECT q.id,
    first_value(q.id) OVER(PARTITION BY fingerprint ORDER BY q.created_at,q.id) keeper_id,
    row_number() OVER(PARTITION BY fingerprint ORDER BY q.created_at,q.id) duplicate_position
  FROM (
    SELECT question.*,
      md5(regexp_replace(lower(regexp_replace(question.statement,
        '[[:space:]]*[(]?[[:space:]]*ref[[:space:]]*:[^)]*[)]?[.[:space:]]*$','','i')),
        '[^[:alnum:]]','','g')) fingerprint
    FROM questions question
    WHERE question.status IN('ACTIVE','ANNULLED')
  ) q
) ranked
WHERE duplicate_position>1;

-- O vínculo com cursos é preservado no registro principal. As cópias ficam em
-- rascunho, em vez de serem apagadas, para manter respostas e notas históricas.
INSERT INTO question_courses(question_id,course_id)
SELECT duplicates.keeper_id,courses.course_id
FROM question_reference_duplicates duplicates
JOIN question_courses courses ON courses.question_id=duplicates.duplicate_id
ON CONFLICT DO NOTHING;

UPDATE questions question
SET status='DRAFT',
    metadata=question.metadata||jsonb_build_object(
      'duplicateOf',duplicates.keeper_id::text,
      'duplicateReason','same_statement_ignoring_inline_reference'),
    updated_at=now()
FROM question_reference_duplicates duplicates
WHERE question.id=duplicates.duplicate_id;

UPDATE questions
SET statement=btrim(regexp_replace(statement,
      '[[:space:]]*[(]?[[:space:]]*ref[[:space:]]*:[^)]*[)]?[.[:space:]]*$','','i')),
    updated_at=now()
WHERE statement ~* '[[:space:]]*[(]?[[:space:]]*ref[[:space:]]*:';

-- O currículo de Jornalismo contém Noções de Informática, mas não as
-- disciplinas profissionais avançadas abaixo.
DELETE FROM question_courses course
USING questions question,subjects subject
WHERE course.question_id=question.id
  AND question.subject_id=subject.id
  AND course.course_id='jornalismo'
  AND subject.name IN(
    'Arquitetura de Software',
    'Banco de Dados',
    'Engenharia de Software',
    'Governança e Gestão de TI',
    'Programação'
  );

CREATE UNIQUE INDEX questions_normalized_statement_unique
  ON questions(md5(regexp_replace(lower(regexp_replace(statement,
    '[[:space:]]*[(]?[[:space:]]*ref[[:space:]]*:[^)]*[)]?[.[:space:]]*$','','i')),
    '[^[:alnum:]]','','g')))
  WHERE status IN('ACTIVE','ANNULLED');
