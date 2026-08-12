-- Refina classificações cuja disciplina real é mais específica que palavras
-- genéricas encontradas no conteúdo (ex.: "texto", "tecnologia" e
-- "jornalismo" no contexto do cargo).

WITH seed(subject_slug,slug,name,position) AS (VALUES
  ('jornalismo','historia-jornalismo','História do Jornalismo e da Imprensa',80),
  ('jornalismo','gatekeeping-noticiabilidade','Gatekeeping e Critérios de Noticiabilidade',90),
  ('jornalismo','jornalismo-dados','Jornalismo de Dados',100),
  ('assessoria-imprensa','releases-produtos','Releases e Produtos de Assessoria',40),
  ('assessoria-imprensa','gestao-crise','Gestão de Crise',50),
  ('comunicacao-organizacional','comunicacao-institucional','Comunicação Institucional',40),
  ('comunicacao-organizacional','comunicacao-digital-metricas','Comunicação Digital e Métricas',50),
  ('editoracao-design','preparacao-originais','Preparação e Edição de Originais',30),
  ('producao-audiovisual','telejornalismo','Telejornalismo',30),
  ('producao-audiovisual','radiojornalismo','Radiojornalismo',40),
  ('inovacao-tecnologia','sistemas-inovacao','Sistemas e Ecossistemas de Inovação',40),
  ('inovacao-tecnologia','prospeccao-tecnologica','Prospecção Tecnológica',50),
  ('inovacao-tecnologia','exploracao-ativos','Exploração e Valoração de Ativos Tecnológicos',60),
  ('inovacao-tecnologia','fomento-inovacao','Fomento, Incubadoras e Aceleradoras',70),
  ('legislacao-institucional','etica-ebserh','Ética e Normas da EBSERH',30)
)
INSERT INTO topics(subject_id,slug,name,position)
SELECT s.id,seed.slug,seed.name,seed.position
FROM seed JOIN subjects s ON s.slug=seed.subject_slug AND s.exam_id IS NULL
ON CONFLICT DO NOTHING;

WITH source AS (
  SELECT q.id,
    lower(COALESCE(q.detailed_topic,'')) detail,
    lower(COALESCE(q.metadata->>'reference','')) reference,
    lower(concat_ws(' ',q.metadata->>'reference',q.statement,q.explanation)) content
  FROM questions q WHERE q.status IN('ACTIVE','ANNULLED')
), classified AS (
  SELECT id,
    CASE
      -- A referência da prova e o idioma do próprio item prevalecem sobre
      -- rótulos de gramática portuguesa gerados pelo acervo legado.
      WHEN reference ~ 'língua inglesa|english'
        OR detail ~ 'língua inglesa|compreensão e tradução'
        OR content ~ '^\s*(\[[^]]+\]\s*)?(in|the|according|although|users|perfecting|sudden|grain|an unpleasant)\M'
        THEN 'lingua-inglesa'
      WHEN detail ~ 'assessoria de imprensa' OR reference ~ 'assessoria de imprensa|produtos de assessoria|release|press kit|clipping|clipagem|mailing|gerenciamento de crise'
        THEN 'assessoria-imprensa'
      WHEN detail ~ 'editoração|projeto gráfico' OR reference ~ 'editoração|projeto gráfico|diagramação|mancha gráfica|preparação de originais'
        THEN 'editoracao-design'
      WHEN reference ~ 'telejornalismo|técnicas de telejornalismo' THEN 'producao-audiovisual'
      WHEN reference ~ 'radiojornalismo|técnicas de radiojornalismo' THEN 'producao-audiovisual'
      WHEN detail ~ '\mlgpd\M' OR reference ~ 'lei nº 13\.709|\mlgpd\M' THEN 'protecao-dados-lgpd'
      WHEN detail ~ 'legislação e ética da ebserh' OR reference ~ 'legislação.*ebserh' THEN 'legislacao-institucional'
      WHEN detail ~ 'transferência de tecnologia|exploração comercial|valoração de ativos|marco legal de ct&i'
        OR reference ~ 'ct&i|inovação|tecnológica|tecnológico|incubadoras|aceleradoras|living labs|sistemas de inovação|bibliometria|índice h|fator de impacto|ciência aberta|subvenção econômica'
        THEN 'inovacao-tecnologia'
      WHEN reference ~ 'comunicação pública|comunicação institucional|jornalismo institucional|accountability|linguagem cidadã|lai|lei de acesso|lei nº 12\.527|comunicação digital|métricas digitais|\mkpi\M|\mctr\M'
        THEN 'comunicacao-organizacional'
      ELSE NULL
    END subject_slug,
    CASE
      WHEN reference ~ 'língua inglesa|english' OR detail ~ 'língua inglesa|compreensão e tradução'
        OR content ~ '^\s*(\[[^]]+\]\s*)?(in|the|according|although|users|perfecting|sudden|grain|an unpleasant)\M'
        THEN CASE
          WHEN reference ~ 'verb tense|modal verb|voice conversion|pronoun|connector|transition word'
            OR content ~ 'present perfect|passive voice|modal verb|pronoun|grammatical accuracy|logical connector|although.*introduces'
            THEN 'gramatica'
          WHEN detail ~ 'tradução' OR reference ~ 'vocabulary|idiom|phrasal verb|translation'
            OR content ~ 'translated|traduzid|means|mean |word .*replace|expression .*mean'
            THEN 'traducao-vocabulario'
          ELSE 'interpretacao' END
      WHEN detail ~ 'assessoria de imprensa' OR reference ~ 'assessoria de imprensa|produtos de assessoria|release|press kit|clipping|clipagem|mailing|gerenciamento de crise'
        THEN CASE
          WHEN reference ~ 'media training' THEN 'media-training'
          WHEN reference ~ 'clipping|clipagem|mailing' THEN 'clipping-mailing'
          WHEN reference ~ 'release|press kit|produtos de assessoria' THEN 'releases-produtos'
          WHEN reference ~ 'crise' THEN 'gestao-crise'
          ELSE 'relacionamento-imprensa' END
      WHEN detail ~ 'editoração|projeto gráfico' OR reference ~ 'editoração|projeto gráfico|diagramação|mancha gráfica|preparação de originais'
        THEN CASE WHEN reference ~ 'preparação de originais' THEN 'preparacao-originais' ELSE 'diagramacao' END
      WHEN reference ~ 'telejornalismo|técnicas de telejornalismo' THEN 'telejornalismo'
      WHEN reference ~ 'radiojornalismo|técnicas de radiojornalismo' THEN 'radiojornalismo'
      WHEN detail ~ '\mlgpd\M' OR reference ~ 'lei nº 13\.709|\mlgpd\M' THEN 'lgpd'
      WHEN detail ~ 'legislação e ética da ebserh' OR reference ~ 'legislação.*ebserh' THEN 'etica-ebserh'
      WHEN detail ~ 'exploração comercial|valoração de ativos' THEN 'exploracao-ativos'
      WHEN reference ~ 'prospecção tecnológica' THEN 'prospeccao-tecnologica'
      WHEN reference ~ 'sistemas de inovação|tripla hélice|arranjos promotores|living labs' THEN 'sistemas-inovacao'
      WHEN reference ~ 'incubadoras|aceleradoras|subvenção econômica' THEN 'fomento-inovacao'
      WHEN detail ~ 'marco legal de ct&i' OR reference ~ 'marco legal|lei federal nº 13\.243|encomenda tecnológica' THEN 'marco-legal-cti'
      WHEN detail ~ 'transferência de tecnologia' OR reference ~ 'transferência de tecnologia|royalties' THEN 'transferencia-tecnologia'
      WHEN reference ~ 'bibliometria|índice h|fator de impacto|ciência aberta' THEN 'prospeccao-tecnologica'
      WHEN reference ~ 'ct&i|inovação|tecnológica|tecnológico' THEN 'fundamentos'
      WHEN reference ~ 'comunicação digital|métricas digitais|\mkpi\M|\mctr\M' THEN 'comunicacao-digital-metricas'
      WHEN reference ~ 'comunicação institucional|jornalismo institucional' THEN 'comunicacao-institucional'
      WHEN reference ~ 'comunicação pública|accountability|linguagem cidadã|lai|lei de acesso|lei nº 12\.527' THEN 'comunicacao-publica'
      ELSE NULL
    END topic_slug
  FROM source
), resolved AS (
  SELECT c.id,s.id subject_id,s.name subject_name,t.id topic_id,t.name topic_name
  FROM classified c JOIN subjects s ON s.slug=c.subject_slug AND s.exam_id IS NULL
  JOIN topics t ON t.subject_id=s.id AND t.slug=c.topic_slug
  WHERE c.subject_slug IS NOT NULL AND c.topic_slug IS NOT NULL
)
UPDATE questions q SET subject_id=r.subject_id,topic_id=r.topic_id,
  metadata=jsonb_set(jsonb_set(q.metadata,'{category}',to_jsonb(r.subject_name),true),'{topic}',to_jsonb(r.topic_name),true),
  updated_at=now()
FROM resolved r WHERE q.id=r.id;

-- Segunda etapa: reduz o assunto genérico de Jornalismo quando a própria
-- referência identifica inequivocamente o conteúdo jornalístico.
WITH mapped(id,topic_slug) AS (
  SELECT q.id,CASE
    WHEN lower(COALESCE(q.metadata->>'reference','')) ~ 'história do jornalismo|história da imprensa|imprensa no brasil' THEN 'historia-jornalismo'
    WHEN lower(COALESCE(q.metadata->>'reference','')) ~ 'gatekeeping' THEN 'gatekeeping-noticiabilidade'
    WHEN lower(COALESCE(q.metadata->>'reference','')) ~ 'jornalismo de dados|data journalism|data storytelling' THEN 'jornalismo-dados'
    WHEN lower(COALESCE(q.metadata->>'reference','')) ~ 'divulgação científica' THEN 'jornalismo-cientifico'
    WHEN lower(COALESCE(q.metadata->>'reference','')) ~ 'tipologia|gênero|codevasf 2024 - item 96' THEN 'generos-formatos'
    WHEN lower(COALESCE(q.metadata->>'reference','')) ~ 'notícia|reportagem|entrevista' THEN 'noticia-reportagem'
    ELSE NULL END
  FROM questions q JOIN subjects s ON s.id=q.subject_id JOIN topics current_topic ON current_topic.id=q.topic_id
  WHERE q.status IN('ACTIVE','ANNULLED') AND s.slug='jornalismo' AND current_topic.slug='fundamentos'
), resolved AS (
  SELECT m.id,t.id topic_id,t.name topic_name FROM mapped m
  JOIN subjects s ON s.slug='jornalismo' AND s.exam_id IS NULL
  JOIN topics t ON t.subject_id=s.id AND t.slug=m.topic_slug WHERE m.topic_slug IS NOT NULL
)
UPDATE questions q SET topic_id=r.topic_id,metadata=jsonb_set(q.metadata,'{topic}',to_jsonb(r.topic_name),true),updated_at=now()
FROM resolved r WHERE q.id=r.id;
