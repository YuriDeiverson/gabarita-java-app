-- Uma questão possui apenas uma resposta contabilizável por plano.
-- Mantém a tentativa mais recente já registrada antes de impor a unicidade.
DELETE FROM quiz_answer_events older
USING quiz_answer_events newer
WHERE older.study_plan_id = newer.study_plan_id
  AND older.question_id = newer.question_id
  AND (older.answered_at, older.id) < (newer.answered_at, newer.id);

-- A tabela de progresso é a fonte da resposta final escolhida pelo usuário.
UPDATE quiz_answer_events event
SET answer = progress.answer,
    is_correct = progress.is_correct
FROM quiz_progress progress
WHERE progress.study_plan_id = event.study_plan_id
  AND progress.question_id = event.question_id;

CREATE UNIQUE INDEX quiz_answer_events_plan_question_unique
  ON quiz_answer_events(study_plan_id, question_id);
