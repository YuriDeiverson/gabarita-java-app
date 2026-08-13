-- A V55 preencheu lacunas com uma estrutura automática que copiava o
-- enunciado e acrescentava uma conclusão genérica. Texto longo não equivale a
-- correção completa. Os registros permanecem preservados como rascunho para
-- revisão editorial, mas deixam de ser oferecidos como material de estudo.

ALTER TABLE questions
  DROP CONSTRAINT IF EXISTS published_questions_require_complete_guide;

UPDATE questions
SET status = 'DRAFT',
  metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
    'guideReviewReason',
    'Correção automática repete o enunciado e não oferece ensino conceitual suficiente.',
    'guidePreviousStatus', status
  ),
  updated_at = now()
WHERE status IN ('ACTIVE', 'ANNULLED')
  AND (
    answer_analysis ~* 'proposição examinada é:'
    OR answer_analysis ~* 'a proposição anulada é:'
    OR answer_analysis ~* 'essa formulação (atribui ao assunto|entra em conflito)'
  );

-- Uma questão publicada precisa oferecer base conceitual, resolução aplicada,
-- método transferível e síntese. Evidência, pegadinha e quadro continuam
-- adaptativos porque nem todo tipo de questão se beneficia desses recursos.
ALTER TABLE questions ADD CONSTRAINT published_questions_require_complete_guide CHECK (
  status NOT IN ('ACTIVE', 'ANNULLED') OR (
    length(btrim(detailed_topic)) >= 8
    AND length(btrim(concept_explanation)) >= 60
    AND length(btrim(answer_analysis)) >= 180
    AND length(btrim(similar_question_strategy)) >= 55
    AND btrim(answer_analysis) <> btrim(explanation)
    AND jsonb_array_length(fixation_tips) BETWEEN 1 AND 4
    AND (
      (jsonb_array_length(comparison_rows) = 0 AND comparison_headers = '{}'::jsonb)
      OR (jsonb_array_length(comparison_rows) >= 2 AND comparison_headers <> '{}'::jsonb)
    )
  )
);

COMMENT ON CONSTRAINT published_questions_require_complete_guide ON questions IS
  'Impede a publicação de questão sem correção autoral capaz de ensinar conceito, aplicação, transferência e revisão.';
