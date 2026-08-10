-- A área organiza a navegação do banco; a categoria passa a representar uma
-- disciplina. Isso elimina rótulos genéricos que misturavam áreas e matérias.
WITH classified AS (
  SELECT
    question.id,
    COALESCE(NULLIF(BTRIM(question.metadata->>'category'),''),'Geral') AS old_category,
    COALESCE(NULLIF(BTRIM(question.metadata->>'topic'),''),COALESCE(NULLIF(BTRIM(question.metadata->>'category'),''),'Geral')) AS old_topic,
    CASE
      WHEN question.metadata->>'category'='Conhecimentos Específicos - Jornalismo' THEN 'Jornalismo'
      WHEN question.metadata->>'category'='Conhecimentos Específicos' THEN 'Tecnologia da Informação'
      WHEN question.metadata->>'category'='TI Básica' THEN 'Tecnologia da Informação'
      WHEN question.metadata->>'category'='Português' THEN 'Língua Portuguesa'
      WHEN question.metadata->>'category'='Conhecimentos Específicos - Técnico em Enfermagem' THEN 'Técnico em Enfermagem'
      WHEN question.metadata->>'category'='Conhecimentos Gerais'
        AND question.metadata->>'topic'='Direito administrativo e administração pública' THEN 'Direito Administrativo'
      WHEN question.metadata->>'category'='Conhecimentos Gerais'
        AND question.metadata->>'topic'='Regulação e agências reguladoras' THEN 'Regulação e Agências Reguladoras'
      WHEN question.metadata->>'category'='Conhecimentos Gerais'
        AND question.metadata->>'topic'='Raciocínio lógico' THEN 'Raciocínio Lógico'
      ELSE COALESCE(NULLIF(BTRIM(question.metadata->>'category'),''),'Geral')
    END AS category
  FROM questions question
), normalized AS (
  SELECT
    id,
    category,
    CASE
      WHEN old_category='Conhecimentos Específicos - Jornalismo' AND old_topic=old_category THEN 'Jornalismo'
      WHEN old_category IN ('Conhecimentos Específicos','TI Básica') AND old_topic=old_category THEN 'Tecnologia da Informação'
      WHEN old_category='Português' AND old_topic=old_category THEN 'Língua Portuguesa'
      WHEN old_category='Conhecimentos Específicos - Técnico em Enfermagem' AND old_topic=old_category THEN 'Técnico em Enfermagem'
      ELSE old_topic
    END AS topic
  FROM classified
)
UPDATE questions question
SET metadata=jsonb_set(
  jsonb_set(
    jsonb_set(question.metadata,'{category}',to_jsonb(normalized.category),true),
    '{topic}',to_jsonb(normalized.topic),true
  ),
  '{area}',to_jsonb(
    CASE
      WHEN normalized.category IN (
        'Língua Portuguesa','Língua Inglesa','Tecnologia da Informação','Ética e Compliance',
        'Conhecimentos de Alagoas','Direito Administrativo','Regulação e Agências Reguladoras',
        'Raciocínio Lógico','Matemática e Estatística'
      ) THEN 'Conhecimentos Gerais'
      ELSE 'Conhecimentos Específicos'
    END
  ),true
)
FROM normalized
WHERE question.id=normalized.id;

CREATE INDEX IF NOT EXISTS questions_area_metadata ON questions((metadata->>'area'));
