-- Uma questão publicada não pode voltar ao formato de comentário curto apenas.
-- Rascunhos continuam permitidos para que o conteúdo possa ser preparado.
UPDATE questions
SET detailed_topic = COALESCE(NULLIF(metadata->>'category',''),'Assunto') || ' — ' || detailed_topic,
  updated_at = now()
WHERE status IN ('ACTIVE','ANNULLED')
  AND length(btrim(detailed_topic)) BETWEEN 1 AND 7;

ALTER TABLE questions ADD CONSTRAINT published_questions_require_complete_guide CHECK (
  status NOT IN ('ACTIVE','ANNULLED') OR (
    length(btrim(detailed_topic)) >= 8
    AND length(btrim(concept_explanation)) >= 180
    AND length(btrim(decisive_evidence)) >= 40
    AND length(btrim(answer_analysis)) >= 300
    AND length(btrim(exam_trap)) >= 80
    AND btrim(answer_analysis) <> btrim(explanation)
    AND jsonb_array_length(fixation_tips) >= 3
    AND jsonb_array_length(comparison_rows) >= 3
  )
);
