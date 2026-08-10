-- O lote CEBRASPE/EMBRAPA 2024 foi importado com o valor de exemplo
-- "identificador_do_curso". Ele pertence ao cargo de Jornalismo.
-- O filtro pela referência e pela associação incorreta evita alterar outras questões.

WITH imported_questions AS (
  SELECT question.id
  FROM questions question
  JOIN question_courses course ON course.question_id=question.id
  WHERE course.course_id='identificador_do_curso'
    AND question.board='CEBRASPE'
    AND question.metadata->>'reference'='CEBRASPE — EMBRAPA — 2024'
)
INSERT INTO question_courses(question_id,course_id)
SELECT id,'jornalismo' FROM imported_questions
ON CONFLICT DO NOTHING;

-- Preserva eventual identificador legado da importação, caso exista.
WITH imported_questions AS (
  SELECT question.id
  FROM questions question
  JOIN question_courses course ON course.question_id=question.id
  WHERE course.course_id='identificador_do_curso'
    AND question.board='CEBRASPE'
    AND question.metadata->>'reference'='CEBRASPE — EMBRAPA — 2024'
)
INSERT INTO question_course_legacy_ids(question_id,course_id,legacy_id)
SELECT legacy.question_id,'jornalismo',legacy.legacy_id
FROM question_course_legacy_ids legacy
JOIN imported_questions imported ON imported.id=legacy.question_id
WHERE legacy.course_id='identificador_do_curso'
ON CONFLICT(course_id,legacy_id) DO UPDATE SET question_id=EXCLUDED.question_id;

-- Remove apenas a associação criada com o identificador de exemplo.
DELETE FROM question_courses course
USING questions question
WHERE course.question_id=question.id
  AND course.course_id='identificador_do_curso'
  AND question.board='CEBRASPE'
  AND question.metadata->>'reference'='CEBRASPE — EMBRAPA — 2024';

-- Os assuntos do JSON foram conferidos e já correspondem aos blocos da prova:
-- conhecimentos básicos, legislação/tecnologia/gestão e conhecimentos específicos
-- de Jornalismo. Assim, category e topic são preservados sem generalização.
