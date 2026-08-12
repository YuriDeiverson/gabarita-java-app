-- O comentário curto continua em questions.explanation. O estudo aprofundado
-- possui campos próprios, evitando repetir o comentário dentro do modal.
ALTER TABLE questions
  ADD COLUMN detailed_topic VARCHAR(240) NOT NULL DEFAULT '',
  ADD COLUMN concept_explanation TEXT NOT NULL DEFAULT '',
  ADD COLUMN decisive_evidence TEXT NOT NULL DEFAULT '',
  ADD COLUMN answer_analysis TEXT NOT NULL DEFAULT '',
  ADD COLUMN exam_trap TEXT NOT NULL DEFAULT '',
  ADD COLUMN fixation_tips JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN comparison_headers JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN comparison_rows JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE questions
  ADD CONSTRAINT questions_fixation_tips_array CHECK (jsonb_typeof(fixation_tips) = 'array'),
  ADD CONSTRAINT questions_comparison_headers_object CHECK (jsonb_typeof(comparison_headers) = 'object'),
  ADD CONSTRAINT questions_comparison_rows_array CHECK (jsonb_typeof(comparison_rows) = 'array');

-- Preserva os dois guias completos cadastrados nas migrações anteriores.
UPDATE questions
SET
  detailed_topic = COALESCE(metadata->>'detailedTopic', ''),
  concept_explanation = COALESCE(metadata->>'conceptExplanation', ''),
  answer_analysis = COALESCE(metadata->>'answerAnalysis', ''),
  fixation_tips = COALESCE(metadata->'fixationTips', '[]'::jsonb),
  comparison_headers = COALESCE(metadata->'comparisonHeaders', '{}'::jsonb),
  comparison_rows = COALESCE(metadata->'comparisonRows', '[]'::jsonb)
WHERE metadata ?| ARRAY[
  'detailedTopic', 'conceptExplanation', 'answerAnalysis',
  'fixationTips', 'comparisonHeaders', 'comparisonRows'
];

CREATE INDEX questions_detailed_topic_idx
  ON questions (detailed_topic)
  WHERE BTRIM(detailed_topic) <> '';
