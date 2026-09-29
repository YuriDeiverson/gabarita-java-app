-- Popula materiais de estudo detalhados para assuntos do concurso ativo
-- Esta migração cria materiais de alta qualidade apenas para o concurso ativo

-- Drop função existente se ela tiver parâmetros diferentes
DROP FUNCTION IF EXISTS gabarita_subject_normalized(text);
DROP FUNCTION IF EXISTS gabarita_subject_normalized(value);

-- Função para normalizar texto para comparação
CREATE OR REPLACE FUNCTION gabarita_subject_normalized(text TEXT) 
RETURNS TEXT AS $$
BEGIN
  RETURN lower(regexp_replace(
    regexp_replace(
      regexp_replace(
        unaccent(text),
        '[^a-z0-9\s]', '', 'g'
      ),
      '\s+', ' ', 'g'
    ),
    '^\s+|\s+$', '', 'g'
  ));
END;
$$ LANGUAGE plpgsql;

-- Verificar se a função unaccent existe, se não criar uma versão simplificada
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'unaccent') THEN
    CREATE OR REPLACE FUNCTION unaccent(text TEXT) 
    RETURNS TEXT AS $$
    BEGIN
      RETURN text;
    END;
    $$ LANGUAGE plpgsql;
  END IF;
END
$$;

-- Obter o ID do plano de estudo da Polícia Civil (concurso ativo ou específico)
DO $$
DECLARE
  police_plan_id UUID;
BEGIN
  -- Primeiro tenta encontrar plano principal ativo da Polícia Civil
  SELECT id INTO police_plan_id 
  FROM study_plans 
  WHERE status = 'ACTIVE'
    AND is_primary = true
    AND (LOWER(title) LIKE '%polícia civil%' 
         OR LOWER(title) LIKE '%policia civil%'
         OR LOWER(title) LIKE '%agente%'
         OR LOWER(title) LIKE '%escrivão%'
         OR LOWER(title) LIKE '%escrivao%')
  LIMIT 1;
  
  -- Se não encontrar plano principal ativo, busca qualquer plano ativo da Polícia Civil
  IF police_plan_id IS NULL THEN
    SELECT id INTO police_plan_id 
    FROM study_plans 
    WHERE status = 'ACTIVE'
      AND (LOWER(title) LIKE '%polícia civil%' 
           OR LOWER(title) LIKE '%policia civil%'
           OR LOWER(title) LIKE '%agente%'
           OR LOWER(title) LIKE '%escrivão%'
           OR LOWER(title) LIKE '%escrivao%')
    ORDER BY is_primary DESC, created_at DESC
    LIMIT 1;
  END IF;
  
  -- Se ainda não encontrar, busca qualquer plano da Polícia Civil
  IF police_plan_id IS NULL THEN
    SELECT id INTO police_plan_id 
    FROM study_plans 
    WHERE (LOWER(title) LIKE '%polícia civil%' 
           OR LOWER(title) LIKE '%policia civil%'
           OR LOWER(title) LIKE '%agente%'
           OR LOWER(title) LIKE '%escrivão%'
           OR LOWER(title) LIKE '%escrivao%')
    ORDER BY is_primary DESC, created_at DESC
    LIMIT 1;
  END IF;
  
  -- Se ainda não encontrar, usa o plano principal ativo (genérico)
  IF police_plan_id IS NULL THEN
    SELECT id INTO police_plan_id 
    FROM study_plans 
    WHERE status = 'ACTIVE'
      AND is_primary = true
    LIMIT 1;
  END IF;
  
  IF police_plan_id IS NULL THEN
    RAISE NOTICE 'Nenhum plano de estudo encontrado. A migração não será executada.';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Plano da Polícia Civil encontrado: %', police_plan_id;
  
  -- Inserir materiais de estudo detalhados para assuntos do concurso ativo
  INSERT INTO shared_study_subjects (canonical_key, title, discipline, study_group, study_objective, review_summary, base_content, key_takeaways, content_blocks)
  SELECT 
    -- Criar chave canônica única
    CASE 
      WHEN EXISTS (SELECT 1 FROM shared_study_subjects WHERE canonical_key = 'assunto-' || substr(md5(rt.subject_name || '|' || rt.title), 1, 12))
      THEN 'assunto-' || substr(md5(rt.subject_name || '|' || rt.title || '|' || rt.id::text), 1, 12)
      ELSE 'assunto-' || substr(md5(rt.subject_name || '|' || rt.title), 1, 12)
    END as canonical_key,
    rt.title as title,
    rt.subject_name as discipline,
    CASE 
      WHEN rt.subject_name IN ('Língua Portuguesa', 'Informática', 'Raciocínio Lógico', 'Matemática', 'Direito Constitucional', 'Direito Administrativo', 'Raciocínio Lógico-Matemático', 'Tecnologia da Informação e Segurança Cibernética', 'Estatística', 'Ética no Serviço Público') 
      THEN 'Conhecimentos Básicos'
      ELSE 'Conhecimentos Específicos'
    END as study_group,
    -- Objetivo de estudo detalhado
    CASE 
      WHEN rt.subject_name LIKE '%Direito%' THEN 
        'Dominar os fundamentos jurídicos de ' || rt.title || ', compreender a interpretação doutrinária e jurisprudencial, e aplicar em situações práticas de prova.'
      WHEN rt.subject_name LIKE '%Português%' THEN 
        'Dominar as regras gramaticais e estruturas textuais de ' || rt.title || ', desenvolver capacidade de análise e produção textual, e aplicar em questões de interpretação.'
      WHEN rt.subject_name LIKE '%Lógico%' OR rt.subject_name LIKE '%Matemática%' OR rt.subject_name LIKE '%Estatística%' THEN 
        'Compreender os conceitos matemáticos e lógicos de ' || rt.title || ', dominar as técnicas de resolução, e aplicar em problemas de concurso.'
      WHEN rt.subject_name LIKE '%Informática%' OR rt.subject_name LIKE '%Tecnologia%' OR rt.subject_name LIKE '%Segurança%' THEN 
        'Dominar os conceitos técnicos de ' || rt.title || ', compreender as ferramentas e tecnologias relacionadas, e aplicar em cenários práticos de TI.'
      ELSE 
        'Compreender profundamente ' || rt.title || ', dominar seus principais conceitos e aplicações, e resolver questões complexas de prova.'
    END as study_objective,
    -- Review summary detalhado baseado em questões
    COALESCE(
      (
        SELECT jsonb_agg(DISTINCT 
          CASE 
            WHEN length(q.concept_explanation) > 100 THEN substring(q.concept_explanation, 1, 300)
            WHEN length(q.decisive_evidence) > 100 THEN substring(q.decisive_evidence, 1, 300)
            ELSE 'Foco nos elementos fundamentais de ' || rt.title
          END
        )
        FROM questions q
        WHERE q.topic_id = rt.topic_id
        AND q.status IN ('ACTIVE', 'ANNULLED')
        AND length(COALESCE(q.concept_explanation, q.decisive_evidence, '')) > 50
        LIMIT 5
      ),
      '[]'::jsonb
    ) as review_summary,
    -- Conteúdo base detalhado usando questões
    COALESCE(
      (
        SELECT 
          '<h2>Conceito e Fundamentos</h2>' ||
          '<p>' || COALESCE(substring(q.concept_explanation, 1, 800), 
            'Estude este assunto compreendendo seus conceitos fundamentais, definições e estruturas básicas.') || '</p>' ||
          
          CASE 
            WHEN length(COALESCE(q.decisive_evidence, '')) > 50 THEN
              '<h2>Elementos Determinantes</h2>' ||
              '<p>' || substring(q.decisive_evidence, 1, 500) || '</p>'
            ELSE ''
          END ||
          
          CASE 
            WHEN length(COALESCE(q.similar_question_strategy, '')) > 50 THEN
              '<h2>Estratégias de Resolução</h2>' ||
              '<p>' || substring(q.similar_question_strategy, 1, 500) || '</p>'
            ELSE ''
          END ||
          
          '<h2>Aplicações Práticas</h2>' ||
          '<p>Analise as questões abaixo para entender como ' || rt.title || ' é cobrado em provas.</p>'
        FROM questions q
        WHERE q.topic_id = rt.topic_id
        AND q.status IN ('ACTIVE', 'ANNULLED')
        AND length(COALESCE(q.concept_explanation, '')) > 50
        LIMIT 1
      ),
      '<h2>Conceito e Fundamentos</h2>' ||
      '<p>Estude este assunto compreendendo seus conceitos fundamentais, definições e estruturas básicas.</p>' ||
      '<h2>Elementos Determinantes</h2>' ||
      '<p>Foque nos elementos que diferenciam as alternativas nas questões de prova.</p>' ||
      '<h2>Estratégias de Resolução</h2>' ||
      '<p>Desenvolva técnicas sistemáticas para resolver questões sobre este tema.</p>' ||
      '<h2>Aplicações Práticas</h2>' ||
      '<p>Pratique com questões variadas para consolidar o aprendizado.</p>'
    ) as base_content,
    -- Key takeaways detalhados baseado em questões
    COALESCE(
      (
        SELECT jsonb_agg(DISTINCT 
          CASE 
            WHEN length(q.concept_explanation) > 80 THEN substring(q.concept_explanation, 1, 200)
            WHEN length(q.decisive_evidence) > 80 THEN substring(q.decisive_evidence, 1, 200)
            WHEN length(q.similar_question_strategy) > 80 THEN substring(q.similar_question_strategy, 1, 200)
            ELSE 'Compreenda os conceitos centrais de ' || rt.title
          END
        )
        FROM questions q
        WHERE q.topic_id = rt.topic_id
        AND q.status IN ('ACTIVE', 'ANNULLED')
        AND length(COALESCE(q.concept_explanation, q.decisive_evidence, q.similar_question_strategy, '')) > 50
        LIMIT 8
      ),
      '["Compreenda os conceitos fundamentais", "Domine as técnicas de resolução", "Identifique elementos decisivos", "Pratique com questões variadas", "Estude as aplicações práticas"]'::jsonb
    ) as key_takeaways,
    -- Content blocks detalhados com prática
    COALESCE(
      (
        SELECT jsonb_build_object(
          'id', 'pratica-guiada',
          'title', 'Prática Comentada: ' || rt.title,
          'content', '<p>Resolva as questões abaixo sem consultar as explicações. Depois compare seu raciocínio com os comentários detalhados.</p>',
          'miniQuestions', (
            SELECT jsonb_agg(
              jsonb_build_object(
                'prompt', substring(q.statement, 1, 500),
                'answer', COALESCE(
                  CASE 
                    WHEN length(q.answer_analysis) > 100 THEN substring(q.answer_analysis, 1, 800)
                    ELSE 'Analise as alternativas identificando a correta com base nos conceitos estudados.'
                  END,
                  'Analise as alternativas e identifique a correta aplicando os conceitos fundamentais.'
                )
              )
            )
            FROM questions q
            WHERE q.topic_id = rt.topic_id
            AND q.status IN ('ACTIVE', 'ANNULLED')
            LIMIT 5
          )
        )
        FROM questions q
        WHERE q.topic_id = rt.topic_id
        AND q.status IN ('ACTIVE', 'ANNULLED')
        LIMIT 1
      ),
      '[]'::jsonb
    ) as content_blocks
  FROM roadmap_topics rt
  WHERE rt.plan_id = police_plan_id
    AND rt.active = true
    AND NOT EXISTS (
      SELECT 1 FROM shared_study_subjects sss
      WHERE gabarita_subject_normalized(sss.title) = gabarita_subject_normalized(rt.title)
      AND gabarita_subject_normalized(sss.discipline) = gabarita_subject_normalized(rt.subject_name)
    );
  
  RAISE NOTICE 'Materiais de estudo criados com sucesso para o plano da Polícia Civil %', police_plan_id;
END $$;

-- Atualizar materiais existentes do concurso da Polícia Civil que estão vazios ou genéricos
DO $$
DECLARE
  police_plan_id UUID;
BEGIN
  -- Identificar o plano da Polícia Civil (mesma lógica do insert)
  SELECT id INTO police_plan_id 
  FROM study_plans 
  WHERE status = 'ACTIVE'
    AND is_primary = true
    AND (LOWER(title) LIKE '%polícia civil%' 
         OR LOWER(title) LIKE '%policia civil%'
         OR LOWER(title) LIKE '%agente%'
         OR LOWER(title) LIKE '%escrivão%'
         OR LOWER(title) LIKE '%escrivao%')
  LIMIT 1;
  
  IF police_plan_id IS NULL THEN
    SELECT id INTO police_plan_id 
    FROM study_plans 
    WHERE status = 'ACTIVE'
      AND (LOWER(title) LIKE '%polícia civil%' 
           OR LOWER(title) LIKE '%policia civil%'
           OR LOWER(title) LIKE '%agente%'
           OR LOWER(title) LIKE '%escrivão%'
           OR LOWER(title) LIKE '%escrivao%')
    ORDER BY is_primary DESC, created_at DESC
    LIMIT 1;
  END IF;
  
  IF police_plan_id IS NULL THEN
    SELECT id INTO police_plan_id 
    FROM study_plans 
    WHERE (LOWER(title) LIKE '%polícia civil%' 
           OR LOWER(title) LIKE '%policia civil%'
           OR LOWER(title) LIKE '%agente%'
           OR LOWER(title) LIKE '%escrivão%'
           OR LOWER(title) LIKE '%escrivao%')
    ORDER BY is_primary DESC, created_at DESC
    LIMIT 1;
  END IF;
  
  IF police_plan_id IS NULL THEN
    SELECT id INTO police_plan_id 
    FROM study_plans 
    WHERE status = 'ACTIVE'
      AND is_primary = true
    LIMIT 1;
  END IF;
  
  IF police_plan_id IS NULL THEN
    RAISE NOTICE 'Nenhum plano encontrado para atualização. Pulando atualização.';
    RETURN;
  END IF;
  
  -- Atualizar apenas materiais relacionados ao concurso da Polícia Civil
  UPDATE shared_study_subjects sss
  SET 
    base_content = COALESCE(
      (
        SELECT 
          '<h2>Conceito e Fundamentos</h2>' ||
          '<p>' || COALESCE(substring(q.concept_explanation, 1, 800), 
            'Estude este assunto compreendendo seus conceitos fundamentais, definições e estruturas básicas.') || '</p>' ||
          
          CASE 
            WHEN length(COALESCE(q.decisive_evidence, '')) > 50 THEN
              '<h2>Elementos Determinantes</h2>' ||
              '<p>' || substring(q.decisive_evidence, 1, 500) || '</p>'
            ELSE ''
          END ||
          
          CASE 
            WHEN length(COALESCE(q.similar_question_strategy, '')) > 50 THEN
              '<h2>Estratégias de Resolução</h2>' ||
              '<p>' || substring(q.similar_question_strategy, 1, 500) || '</p>'
            ELSE ''
          END ||
          
          '<h2>Aplicações Práticas</h2>' ||
          '<p>Analise as questões abaixo para entender como ' || sss.title || ' é cobrado em provas.</p>'
        FROM questions q
        JOIN roadmap_topics rt ON rt.topic_id = q.topic_id
        WHERE rt.plan_id = police_plan_id
          AND gabarita_subject_normalized(rt.title) = gabarita_subject_normalized(sss.title)
          AND gabarita_subject_normalized(rt.subject_name) = gabarita_subject_normalized(sss.discipline)
          AND q.status IN ('ACTIVE', 'ANNULLED')
          AND length(COALESCE(q.concept_explanation, '')) > 50
        LIMIT 1
      ),
      sss.base_content
    ),
    key_takeaways = COALESCE(
      (
        SELECT jsonb_agg(DISTINCT 
          CASE 
            WHEN length(q.concept_explanation) > 80 THEN substring(q.concept_explanation, 1, 200)
            WHEN length(q.decisive_evidence) > 80 THEN substring(q.decisive_evidence, 1, 200)
            WHEN length(q.similar_question_strategy) > 80 THEN substring(q.similar_question_strategy, 1, 200)
            ELSE 'Compreenda os conceitos centrais de ' || sss.title
          END
        )
        FROM questions q
        JOIN roadmap_topics rt ON rt.topic_id = q.topic_id
        WHERE rt.plan_id = police_plan_id
          AND gabarita_subject_normalized(rt.title) = gabarita_subject_normalized(sss.title)
          AND gabarita_subject_normalized(rt.subject_name) = gabarita_subject_normalized(sss.discipline)
          AND q.status IN ('ACTIVE', 'ANNULLED')
          AND length(COALESCE(q.concept_explanation, q.decisive_evidence, q.similar_question_strategy, '')) > 50
        LIMIT 8
      ),
      sss.key_takeaways
    ),
    content_blocks = COALESCE(
      (
        SELECT jsonb_build_object(
          'id', 'pratica-guiada',
          'title', 'Prática Comentada: ' || sss.title,
          'content', '<p>Resolva as questões abaixo sem consultar as explicações. Depois compare seu raciocínio com os comentários detalhados.</p>',
          'miniQuestions', (
            SELECT jsonb_agg(
              jsonb_build_object(
                'prompt', substring(q.statement, 1, 500),
                'answer', COALESCE(
                  CASE 
                    WHEN length(q.answer_analysis) > 100 THEN substring(q.answer_analysis, 1, 800)
                    ELSE 'Analise as alternativas identificando a correta com base nos conceitos estudados.'
                  END,
                  'Analise as alternativas e identifique a correta aplicando os conceitos fundamentais.'
                )
              )
            )
            FROM questions q
            JOIN roadmap_topics rt ON rt.topic_id = q.topic_id
            WHERE rt.plan_id = police_plan_id
              AND gabarita_subject_normalized(rt.title) = gabarita_subject_normalized(sss.title)
              AND gabarita_subject_normalized(rt.subject_name) = gabarita_subject_normalized(sss.discipline)
              AND q.status IN ('ACTIVE', 'ANNULLED')
            LIMIT 5
          )
        )
        FROM questions q
        JOIN roadmap_topics rt ON rt.topic_id = q.topic_id
        WHERE rt.plan_id = police_plan_id
          AND gabarita_subject_normalized(rt.title) = gabarita_subject_normalized(sss.title)
          AND gabarita_subject_normalized(rt.subject_name) = gabarita_subject_normalized(sss.discipline)
          AND q.status IN ('ACTIVE', 'ANNULLED')
        LIMIT 1
      ),
      sss.content_blocks
    ),
    updated_at = now()
  WHERE (
    sss.base_content = '' 
    OR sss.base_content LIKE '%integra a disciplina%'
    OR sss.base_content LIKE '%deve ser estudado como uma ferramenta%'
    OR jsonb_array_length(sss.key_takeaways) = 0
  )
  AND EXISTS (
    SELECT 1 FROM roadmap_topics rt
    WHERE rt.plan_id = police_plan_id
      AND gabarita_subject_normalized(rt.title) = gabarita_subject_normalized(sss.title)
      AND gabarita_subject_normalized(rt.subject_name) = gabarita_subject_normalized(sss.discipline)
  );
  
  RAISE NOTICE 'Materiais existentes atualizados para o plano da Polícia Civil %', police_plan_id;
END $$;

-- Adicionar comentário documentando a migração
COMMENT ON TABLE shared_study_subjects IS 'Materiais de estudo compartilhados entre usuários, gerados automaticamente para o concurso da Polícia Civil e podem ser enriquecidos manualmente';
