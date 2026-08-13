-- Adequa os guias ao formato editorial adaptativo: somente a justificativa,
-- a estratégia de resolução e a memorização são obrigatórias. Conceito,
-- pegadinha e tabela existem apenas quando acrescentam valor pedagógico.

ALTER TABLE questions
  ADD COLUMN similar_question_strategy TEXT NOT NULL DEFAULT '';

-- Expõe a taxonomia no formato Disciplina → Assunto → Subassunto. Quando o
-- detalhe já coincide com o assunto, evita duplicá-lo.
WITH hierarchy AS (
  SELECT q.id, s.name AS subject_name, t.name AS topic_name,
    btrim(regexp_replace(q.detailed_topic, '^.*[—→]', '')) AS detail_leaf
  FROM questions q
  JOIN subjects s ON s.id = q.subject_id
  JOIN topics t ON t.id = q.topic_id
  WHERE q.status IN ('ACTIVE', 'ANNULLED')
)
UPDATE questions q
SET detailed_topic = left(h.subject_name || ' → ' || h.topic_name ||
  CASE
    WHEN h.detail_leaf = ''
      OR lower(h.detail_leaf) = lower(h.topic_name)
      OR lower(h.topic_name) LIKE '%' || lower(h.detail_leaf) || '%'
      THEN ''
    ELSE ' → ' || h.detail_leaf
  END, 240)
FROM hierarchy h
WHERE q.id = h.id AND q.detailed_topic NOT LIKE '%→%';

UPDATE questions q
SET similar_question_strategy = CASE
  WHEN btrim(q.similar_question_strategy) <> '' THEN q.similar_question_strategy
  WHEN q.comparison_headers->>'criterion' NOT IN ('Etapa da análise', 'Elemento da questão')
    AND length(btrim(COALESCE(q.fixation_tips->>0, ''))) >= 40
    THEN q.fixation_tips->>0
  WHEN lower(q.detailed_topic) ~ 'interpretação|compreensão|inferência'
    THEN 'Compare a relação lógica afirmada pelo item com a relação construída no texto: causa, consequência, condição, finalidade e alcance precisam permanecer iguais.'
  WHEN lower(q.detailed_topic) ~ 'crase|concordância|regência|pontuação|gramática|reescrita|classes de palavras|coesão'
    THEN 'Localize o trecho cobrado, identifique sua função sintática e aplique a regra no contexto; não decida apenas pelo que parece soar natural.'
  WHEN lower(q.detailed_topic) ~ 'direito|lei|licita|lgpd|ética|compliance'
    THEN 'Separe sujeito, competência, requisito, exceção e consequência da regra jurídica; depois confira qual desses elementos o item manteve, omitiu ou trocou.'
  WHEN lower(q.detailed_topic) ~ 'sql|banco de dados|programação|software|rede|segurança|nuvem|sistema|docker|kubernetes|api|uml|scrum'
    THEN 'Identifique o mecanismo técnico afirmado, suas condições de funcionamento e seus limites; então confronte cada elemento com o comportamento descrito no item.'
  WHEN lower(q.detailed_topic) ~ 'matemática|estatística|raciocínio lógico|probabilidade'
    THEN 'Traduza os dados para relações ou operações, mantenha as unidades e execute primeiro a etapa que determina o resultado pedido pelo enunciado.'
  ELSE
    'Isole a afirmação central, identifique a regra ou o conceito aplicável e confira exatamente qual condição ou consequência determina o julgamento.'
END
WHERE q.status IN ('ACTIVE', 'ANNULLED');

-- O novo resumo admite de uma a quatro linhas. Acervos antigos podiam conter
-- listas maiores; preservamos as quatro primeiras, sem reescrever seu texto.
UPDATE questions q
SET fixation_tips = normalized.tips
FROM (
  SELECT id, jsonb_agg(value ORDER BY position) AS tips
  FROM questions,
    jsonb_array_elements(fixation_tips) WITH ORDINALITY AS item(value, position)
  WHERE status IN ('ACTIVE', 'ANNULLED') AND position <= 4
  GROUP BY id
) normalized
WHERE q.id = normalized.id AND jsonb_array_length(q.fixation_tips) > 4;

ALTER TABLE questions
  DROP CONSTRAINT IF EXISTS published_questions_require_complete_guide;

ALTER TABLE questions ADD CONSTRAINT published_questions_require_complete_guide CHECK (
  status NOT IN ('ACTIVE', 'ANNULLED') OR (
    length(btrim(detailed_topic)) >= 8
    AND length(btrim(decisive_evidence)) >= 40
    AND length(btrim(answer_analysis)) >= 120
    AND length(btrim(similar_question_strategy)) >= 40
    AND btrim(answer_analysis) <> btrim(explanation)
    AND jsonb_array_length(fixation_tips) BETWEEN 1 AND 4
    AND (
      (jsonb_array_length(comparison_rows) = 0 AND comparison_headers = '{}'::jsonb)
      OR (jsonb_array_length(comparison_rows) >= 2 AND comparison_headers <> '{}'::jsonb)
    )
  )
);
