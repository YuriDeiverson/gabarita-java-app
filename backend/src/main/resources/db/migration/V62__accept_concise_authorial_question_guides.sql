-- Comprimento isolado não mede profundidade editorial. Mantemos obrigatórios
-- conceito, evidência, resolução, transferência e síntese, mas aceitamos uma
-- explicação autoral concisa. As verificações semânticas contra texto genérico,
-- repetido, contraditório ou com resíduos de geração permanecem na API.

ALTER TABLE questions
  DROP CONSTRAINT IF EXISTS published_questions_require_complete_guide;

ALTER TABLE questions ADD CONSTRAINT published_questions_require_complete_guide CHECK (
  status NOT IN ('ACTIVE', 'ANNULLED') OR (
    length(btrim(detailed_topic)) >= 8
    AND length(btrim(concept_explanation)) >= 100
    AND length(btrim(decisive_evidence)) >= 40
    AND length(btrim(answer_analysis)) >= 160
    AND (btrim(exam_trap) = '' OR length(btrim(exam_trap)) >= 40)
    AND length(btrim(similar_question_strategy)) >= 40
    AND jsonb_array_length(fixation_tips) BETWEEN 2 AND 4
    AND btrim(answer_analysis) <> btrim(explanation)
    AND answer_analysis !~* 'proposição examinada é:|a proposição anulada é:|essa formulação (atribui ao assunto|entra em conflito)'
    AND (
      (jsonb_array_length(comparison_rows) = 0 AND comparison_headers = '{}'::jsonb)
      OR (jsonb_array_length(comparison_rows) >= 2 AND comparison_headers <> '{}'::jsonb)
    )
  )
);

COMMENT ON CONSTRAINT published_questions_require_complete_guide ON questions IS
  'Questão publicada exige guia autoral completo, ainda que conciso: conceito, evidência, aplicação, transferência e síntese.';
