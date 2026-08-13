-- A partir desta versão, toda questão visível precisa possuir o mesmo nível de
-- profundidade do guia de referência de CTE recursiva: conceito, evidência,
-- resolução, diagnóstico, transferência e revisão ativa. Conteúdo parcial é
-- preservado como rascunho até passar pela revisão individual.

ALTER TABLE questions
  DROP CONSTRAINT IF EXISTS published_questions_require_complete_guide;

UPDATE questions
SET status = 'DRAFT',
  metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
    'guideReviewReason',
    'A correção ainda não possui todos os blocos da aula completa no padrão editorial aprovado.',
    'guidePreviousStatus', status
  ),
  updated_at = now()
WHERE status IN ('ACTIVE', 'ANNULLED')
  AND NOT (
    length(btrim(detailed_topic)) >= 8
    AND length(btrim(concept_explanation)) >= 300
    AND length(btrim(decisive_evidence)) >= 40
    AND length(btrim(answer_analysis)) >= 400
    AND length(btrim(exam_trap)) >= 120
    AND length(btrim(similar_question_strategy)) >= 160
    AND jsonb_array_length(fixation_tips) BETWEEN 3 AND 4
    AND answer_analysis !~* 'proposição examinada é:|a proposição anulada é:|essa formulação (atribui ao assunto|entra em conflito)'
  );

ALTER TABLE questions ADD CONSTRAINT published_questions_require_complete_guide CHECK (
  status NOT IN ('ACTIVE', 'ANNULLED') OR (
    length(btrim(detailed_topic)) >= 8
    AND length(btrim(concept_explanation)) >= 300
    AND length(btrim(decisive_evidence)) >= 40
    AND length(btrim(answer_analysis)) >= 400
    AND length(btrim(exam_trap)) >= 120
    AND length(btrim(similar_question_strategy)) >= 160
    AND jsonb_array_length(fixation_tips) BETWEEN 3 AND 4
    AND btrim(answer_analysis) <> btrim(explanation)
    AND answer_analysis !~* 'proposição examinada é:|a proposição anulada é:|essa formulação (atribui ao assunto|entra em conflito)'
    AND (
      (jsonb_array_length(comparison_rows) = 0 AND comparison_headers = '{}'::jsonb)
      OR (jsonb_array_length(comparison_rows) >= 2 AND comparison_headers <> '{}'::jsonb)
    )
  )
);

COMMENT ON CONSTRAINT published_questions_require_complete_guide ON questions IS
  'Questão publicada exige aula completa: conceito, resolução, diagnóstico, transferência e revisão ativa.';
