-- Reconcilia, de forma exclusivamente aditiva, o conteúdo programático dos
-- cargos com a biblioteca compartilhada. A numeração do edital (1., 1.1 etc.)
-- não faz parte da identidade do assunto.
CREATE OR REPLACE FUNCTION gabarita_subject_normalized(value TEXT)
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
PARALLEL SAFE
AS $function$
  SELECT btrim(regexp_replace(
    regexp_replace(
      translate(
        lower(COALESCE(value, '')),
        'áàâãäéèêëíìîïóòôõöúùûüçñ',
        'aaaaaeeeeiiiiooooouuuucn'
      ),
      '^\s*[0-9]+([.][0-9]+)*[.)-]?\s*',
      ''
    ),
    '[^a-z0-9]+',
    ' ',
    'g'
  ));
$function$;

CREATE OR REPLACE FUNCTION gabarita_subject_display_title(value TEXT)
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
PARALLEL SAFE
AS $function$
  SELECT btrim(regexp_replace(
    COALESCE(value, ''),
    '^\s*[0-9]+([.][0-9]+)*[.)-]?\s*',
    ''
  ));
$function$;

CREATE OR REPLACE FUNCTION gabarita_html_escape(value TEXT)
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
PARALLEL SAFE
AS $function$
  SELECT replace(replace(replace(COALESCE(value, ''), '&', '&amp;'), '<', '&lt;'), '>', '&gt;');
$function$;

DO $reconcile$
DECLARE
  role_row RECORD;
  working_curriculum JSONB;
  topic_item JSONB;
  section_item JSONB;
  card_item JSONB;
  candidate RECORD;
  shared_row shared_study_subjects%ROWTYPE;
  shared_id UUID;
  section_title TEXT;
  subject_title TEXT;
  display_title TEXT;
  normalized_title TEXT;
  normalized_discipline TEXT;
  study_group TEXT;
  new_canonical_key TEXT;
  base_key TEXT;
  area TEXT;
  approach TEXT;
  practice_method TEXT;
  caution TEXT;
  material_content TEXT;
  material_takeaways JSONB;
  material_blocks JSONB;
  material_objective TEXT;
  material_review JSONB;
  new_sections JSONB;
  new_cards JSONB;
  placeholder_material BOOLEAN;
BEGIN
  FOR role_row IN
    SELECT id, curriculum
    FROM catalog_roles
    ORDER BY created_at, id
  LOOP
    working_curriculum := role_row.curriculum;

    -- Se um edital possuir uma disciplina ainda sem seção visual, a seção é
    -- acrescentada. O alias abaixo reaproveita a seção legada de Informática.
    FOR topic_item IN
      SELECT value
      FROM jsonb_array_elements(COALESCE(working_curriculum->'topics', '[]'::jsonb))
    LOOP
      section_item := NULL;
      SELECT value INTO section_item
      FROM jsonb_array_elements(COALESCE(working_curriculum->'studySections', '[]'::jsonb))
      WHERE value->>'id' = topic_item->>'id'
         OR gabarita_subject_normalized(value->>'title') = gabarita_subject_normalized(topic_item->>'title')
         OR (topic_item->>'id' = 'ti_basica' AND value->>'id' = 'ti')
      ORDER BY CASE
        WHEN value->>'id' = topic_item->>'id' THEN 0
        WHEN gabarita_subject_normalized(value->>'title') = gabarita_subject_normalized(topic_item->>'title') THEN 1
        ELSE 2
      END
      LIMIT 1;

      IF section_item IS NULL THEN
        section_item := jsonb_build_object(
          'id', topic_item->>'id',
          'title', topic_item->>'title',
          'icon', 'BookOpen',
          'color', 'blue',
          'difficulty', 'Médio',
          'weight', '10%',
          'paretoJustification', 'Disciplina prevista no conteúdo programático do edital.',
          'cards', '[]'::jsonb
        );
        working_curriculum := jsonb_set(
          working_curriculum,
          '{studySections}',
          COALESCE(working_curriculum->'studySections', '[]'::jsonb) || jsonb_build_array(section_item),
          true
        );
      END IF;
    END LOOP;

    -- Garante uma entrada na biblioteca para cada card existente e para cada
    -- subtópico exigido no edital. A comparação inclui a disciplina para não
    -- confundir assuntos homônimos, como "Princípios" em ramos diferentes.
    FOR section_item IN
      SELECT value
      FROM jsonb_array_elements(COALESCE(working_curriculum->'studySections', '[]'::jsonb))
    LOOP
      section_title := COALESCE(section_item->>'title', '');
      topic_item := NULL;
      SELECT value INTO topic_item
      FROM jsonb_array_elements(COALESCE(working_curriculum->'topics', '[]'::jsonb))
      WHERE value->>'id' = section_item->>'id'
         OR gabarita_subject_normalized(value->>'title') = gabarita_subject_normalized(section_title)
         OR (value->>'id' = 'ti_basica' AND section_item->>'id' = 'ti')
      ORDER BY CASE
        WHEN value->>'id' = section_item->>'id' THEN 0
        WHEN gabarita_subject_normalized(value->>'title') = gabarita_subject_normalized(section_title) THEN 1
        ELSE 2
      END
      LIMIT 1;

      study_group := CASE
        WHEN COALESCE(topic_item->>'category', '') IN
          ('Conhecimentos Básicos', 'Conhecimentos Gerais', 'Legislação')
          THEN 'Conhecimentos Gerais'
        ELSE 'Conhecimentos Específicos'
      END;

      FOR candidate IN
        SELECT value AS card, value->>'title' AS title
        FROM jsonb_array_elements(COALESCE(section_item->'cards', '[]'::jsonb))
        UNION ALL
        SELECT NULL::jsonb AS card, value AS title
        FROM jsonb_array_elements_text(COALESCE(topic_item->'subtopics', '[]'::jsonb))
      LOOP
        subject_title := btrim(COALESCE(candidate.title, ''));
        normalized_title := gabarita_subject_normalized(subject_title);
        normalized_discipline := gabarita_subject_normalized(section_title);
        IF normalized_title = '' OR normalized_discipline = '' THEN
          CONTINUE;
        END IF;

        shared_id := NULL;
        SELECT id INTO shared_id
        FROM shared_study_subjects
        WHERE gabarita_subject_normalized(title) = normalized_title
          AND gabarita_subject_normalized(discipline) = normalized_discipline
        ORDER BY
          CASE WHEN lower(btrim(title)) = lower(gabarita_subject_display_title(subject_title)) THEN 0 ELSE 1 END,
          created_at,
          id
        LIMIT 1;

        IF shared_id IS NOT NULL THEN
          CONTINUE;
        END IF;

        display_title := gabarita_subject_display_title(subject_title);
        base_key := left(replace(normalized_title, ' ', '-'), 180);
        IF base_key = '' THEN
          base_key := 'assunto-' || substr(md5(section_title || '|' || subject_title), 1, 12);
        END IF;
        new_canonical_key := base_key;
        IF EXISTS (SELECT 1 FROM shared_study_subjects WHERE shared_study_subjects.canonical_key = new_canonical_key) THEN
          new_canonical_key := left(base_key, 167) || '-' || substr(md5(normalized_discipline), 1, 12);
        END IF;
        IF EXISTS (SELECT 1 FROM shared_study_subjects WHERE shared_study_subjects.canonical_key = new_canonical_key) THEN
          new_canonical_key := left(base_key, 158) || '-' || substr(md5(normalized_discipline || '|' || study_group), 1, 21);
        END IF;

        area := CASE
          WHEN lower(section_title || ' ' || display_title || ' ' || study_group) ~ '(portugu|língua|lingua|redação|redacao|texto|gramática|gramatica|ortografia)' THEN 'linguagens'
          WHEN lower(section_title || ' ' || display_title || ' ' || study_group) ~ '(jornal|comunica|imprensa|mídia|midia|publicidade)' THEN 'comunicacao'
          WHEN lower(section_title || ' ' || display_title || ' ' || study_group) ~ '(direito|legisla|lei|norma|constitui|ética|etica|administração pública|administracao publica)' THEN 'normas'
          WHEN lower(section_title || ' ' || display_title || ' ' || study_group) ~ '(tecnologia|informática|informatica|sistema|segurança|seguranca|dados|rede|software|programação|programacao)' THEN 'tecnologia'
          WHEN lower(section_title || ' ' || display_title || ' ' || study_group) ~ '(matemát|matemat|raciocínio|raciocinio|estatística|estatistica|contáb|contab|financeir|cálculo|calculo)' THEN 'quantitativo'
          WHEN lower(section_title || ' ' || display_title || ' ' || study_group) ~ '(saúde|saude|enfermagem|clínica|clinica|sus|epidemi|farmac)' THEN 'saude'
          ELSE 'geral'
        END;

        approach := CASE area
          WHEN 'linguagens' THEN 'Localize a regra ou a evidência textual que sustenta a interpretação; a impressão de leitura, sozinha, não basta.'
          WHEN 'comunicacao' THEN 'Relacione técnica, objetivo, público e meio utilizado para avaliar o efeito de comunicação esperado.'
          WHEN 'normas' THEN 'Organize a leitura em sujeito, condição de aplicação, comando da regra, exceção e consequência.'
          WHEN 'tecnologia' THEN 'Conecte o problema resolvido aos componentes, ao funcionamento, aos benefícios e às limitações da solução.'
          WHEN 'quantitativo' THEN 'Separe dados, relação entre grandezas, operação e unidade antes de efetuar o cálculo.'
          WHEN 'saude' THEN 'Relacione conceito, finalidade, sequência de execução, prioridade e medida de segurança.'
          ELSE 'Comece pelo conceito central, identifique sua finalidade e reconheça em quais situações ele altera a resposta.'
        END;
        practice_method := CASE area
          WHEN 'linguagens' THEN 'Marque conectivos, referentes, tempos verbais e escolhas lexicais que comprovem a resposta.'
          WHEN 'comunicacao' THEN 'Compare cenários e escolha a técnica compatível com o objetivo, o público e o canal apresentados.'
          WHEN 'normas' THEN 'Monte uma ficha curta com quem é alcançado, quando a regra se aplica, o comando, a exceção e o efeito.'
          WHEN 'tecnologia' THEN 'Desenhe uma cadeia de entrada, processamento, saída e controle e teste o efeito da falha de cada componente.'
          WHEN 'quantitativo' THEN 'Traduza o enunciado para uma relação entre grandezas e confira se o resultado responde à unidade pedida.'
          WHEN 'saude' THEN 'Use um caso breve para decidir a conduta prioritária e justificar cada etapa do procedimento.'
          ELSE 'Transforme o título em quatro perguntas: o que é, para que serve, como se aplica e qual detalhe muda a conclusão?'
        END;
        caution := CASE area
          WHEN 'linguagens' THEN 'Não conclua apenas pelo que parece natural; confirme a regra ou o trecho que sustenta a leitura.'
          WHEN 'comunicacao' THEN 'Não trate técnicas próximas como sinônimos: objetivo, público e suporte mudam a escolha correta.'
          WHEN 'normas' THEN 'Atenção a palavras absolutas, competências e exceções, pois uma condição omitida pode inverter o item.'
          WHEN 'tecnologia' THEN 'Não memorize siglas isoladas; compare finalidade, responsabilidade e limitação de cada recurso.'
          WHEN 'quantitativo' THEN 'Confira os dados e a unidade para não aplicar a operação correta sobre uma condição errada.'
          WHEN 'saude' THEN 'Não troque prioridade, indicação, ordem de execução ou medida de segurança.'
          ELSE 'Evite responder por associação de palavras; verifique se a alternativa atende exatamente ao comando.'
        END;

        material_content :=
          '<h3>Entenda o assunto</h3><p><strong>' || gabarita_html_escape(display_title) ||
          '</strong> integra a disciplina <strong>' || gabarita_html_escape(section_title) ||
          '</strong>. ' || approach || '</p>' ||
          '<h3>Raciocínio de prova</h3><ol><li>Identifique o que o enunciado pede.</li><li>Recupere o conceito, a regra ou o procedimento aplicável.</li><li>Elimine alternativas que trocam condição, finalidade, ordem ou consequência.</li></ol>' ||
          '<h3>Prática guiada</h3><p>' || practice_method || '</p><p><strong>Atenção:</strong> ' || caution || '</p>';
        material_takeaways := jsonb_build_array(
          'Explique o conceito central de ' || display_title || ' com suas próprias palavras.',
          practice_method,
          caution
        );
        material_objective := 'Compreender ' || display_title ||
          ', reconhecer sua aplicação em ' || section_title ||
          ' e resolver questões de prova com segurança.';
        material_review := jsonb_build_array(
          'Defina o conceito e a finalidade de ' || display_title || '.',
          'Relacione o assunto a uma situação prática de cobrança.',
          'Revise as condições, exceções e erros mais recorrentes.'
        );
        material_blocks := jsonb_build_array(
          jsonb_build_object(
            'id', 'roteiro-didatico',
            'title', 'Como estudar este assunto',
            'content', '<p>' || practice_method || '</p><p><strong>Atenção:</strong> ' || caution || '</p>',
            'keyTakeaways', jsonb_build_array(
              'Conceito, condição e consequência devem ser estudados juntos.',
              'Use o comando do enunciado para selecionar o detalhe relevante.'
            )
          ),
          jsonb_build_object(
            'id', 'pratica-guiada',
            'title', 'Pratique antes de conferir',
            'content', '<p>Responda sem consultar o material e depois compare o seu raciocínio com a correção.</p>',
            'miniQuestions', jsonb_build_array(
              jsonb_build_object('prompt', 'Qual é a ideia central de ' || display_title || '?', 'answer', approach),
              jsonb_build_object('prompt', 'Como aplicar este assunto em uma questão?', 'answer', practice_method),
              jsonb_build_object('prompt', 'Qual erro deve ser evitado?', 'answer', caution)
            )
          )
        );

        -- Quando o card já possui material autoral, ele é usado como origem.
        -- O roteiro acima só preenche conteúdo inexistente ou o texto-modelo.
        IF candidate.card IS NOT NULL
          AND btrim(COALESCE(candidate.card->>'content', '')) <> ''
          AND candidate.card->>'content' NOT LIKE '<p>Estude este item do edital%'
        THEN
          material_content := candidate.card->>'content';
        END IF;
        IF candidate.card IS NOT NULL
          AND jsonb_typeof(candidate.card->'keyTakeaways') = 'array'
          AND jsonb_array_length(candidate.card->'keyTakeaways') > 0
        THEN
          material_takeaways := candidate.card->'keyTakeaways';
        END IF;
        IF candidate.card IS NOT NULL
          AND jsonb_typeof(candidate.card->'contentBlocks') = 'array'
          AND jsonb_array_length(candidate.card->'contentBlocks') > 0
        THEN
          material_blocks := candidate.card->'contentBlocks';
        END IF;
        IF candidate.card IS NOT NULL AND btrim(COALESCE(candidate.card->>'studyObjective', '')) <> '' THEN
          material_objective := candidate.card->>'studyObjective';
        END IF;
        IF candidate.card IS NOT NULL
          AND jsonb_typeof(candidate.card->'reviewSummary') = 'array'
          AND jsonb_array_length(candidate.card->'reviewSummary') > 0
        THEN
          material_review := candidate.card->'reviewSummary';
        END IF;

        INSERT INTO shared_study_subjects(
          canonical_key, title, discipline, study_group, study_objective,
          review_summary, base_content, key_takeaways, content_blocks
        ) VALUES (
          new_canonical_key, display_title, section_title, study_group, material_objective,
          material_review, material_content, material_takeaways, material_blocks
        )
        ON CONFLICT (canonical_key) DO NOTHING
        RETURNING id INTO shared_id;
      END LOOP;
    END LOOP;

    -- Reidrata cards já existentes e acrescenta, ao fim de cada seção, somente
    -- os subtópicos do edital que ainda não têm um card equivalente.
    new_sections := '[]'::jsonb;
    FOR section_item IN
      SELECT value
      FROM jsonb_array_elements(COALESCE(working_curriculum->'studySections', '[]'::jsonb))
    LOOP
      section_title := COALESCE(section_item->>'title', '');
      topic_item := NULL;
      SELECT value INTO topic_item
      FROM jsonb_array_elements(COALESCE(working_curriculum->'topics', '[]'::jsonb))
      WHERE value->>'id' = section_item->>'id'
         OR gabarita_subject_normalized(value->>'title') = gabarita_subject_normalized(section_title)
         OR (value->>'id' = 'ti_basica' AND section_item->>'id' = 'ti')
      ORDER BY CASE
        WHEN value->>'id' = section_item->>'id' THEN 0
        WHEN gabarita_subject_normalized(value->>'title') = gabarita_subject_normalized(section_title) THEN 1
        ELSE 2
      END
      LIMIT 1;

      new_cards := '[]'::jsonb;
      FOR card_item IN
        SELECT value
        FROM jsonb_array_elements(COALESCE(section_item->'cards', '[]'::jsonb))
      LOOP
        shared_row := NULL;
        SELECT * INTO shared_row
        FROM shared_study_subjects
        WHERE (
            id::text = COALESCE(card_item->>'sharedSubjectId', '')
          ) OR (
            gabarita_subject_normalized(title) = gabarita_subject_normalized(card_item->>'title')
            AND gabarita_subject_normalized(discipline) = gabarita_subject_normalized(section_title)
          )
        ORDER BY
          CASE WHEN id::text = COALESCE(card_item->>'sharedSubjectId', '') THEN 0 ELSE 1 END,
          CASE WHEN lower(btrim(title)) = lower(gabarita_subject_display_title(card_item->>'title')) THEN 0 ELSE 1 END,
          created_at,
          id
        LIMIT 1;

        IF shared_row.id IS NOT NULL THEN
          placeholder_material := btrim(COALESCE(card_item->>'content', '')) = ''
            OR card_item->>'content' LIKE '<p>Estude este item do edital%';
          card_item := card_item || jsonb_build_object('sharedSubjectId', shared_row.id::text);
          IF placeholder_material THEN
            card_item := card_item || jsonb_build_object(
              'content', shared_row.base_content,
              'keyTakeaways', shared_row.key_takeaways
            );
          ELSIF jsonb_typeof(card_item->'keyTakeaways') <> 'array'
            OR jsonb_array_length(COALESCE(card_item->'keyTakeaways', '[]'::jsonb)) = 0
          THEN
            card_item := card_item || jsonb_build_object('keyTakeaways', shared_row.key_takeaways);
          END IF;
          IF jsonb_typeof(card_item->'contentBlocks') <> 'array'
            OR jsonb_array_length(COALESCE(card_item->'contentBlocks', '[]'::jsonb)) = 0
          THEN
            card_item := card_item || jsonb_build_object('contentBlocks', shared_row.content_blocks);
          END IF;
          IF btrim(COALESCE(card_item->>'studyObjective', '')) = '' THEN
            card_item := card_item || jsonb_build_object('studyObjective', shared_row.study_objective);
          END IF;
          IF jsonb_typeof(card_item->'reviewSummary') <> 'array'
            OR jsonb_array_length(COALESCE(card_item->'reviewSummary', '[]'::jsonb)) = 0
          THEN
            card_item := card_item || jsonb_build_object('reviewSummary', shared_row.review_summary);
          END IF;
        END IF;
        new_cards := new_cards || jsonb_build_array(card_item);
      END LOOP;

      IF topic_item IS NOT NULL THEN
        FOR subject_title IN
          SELECT value
          FROM jsonb_array_elements_text(COALESCE(topic_item->'subtopics', '[]'::jsonb))
        LOOP
          IF EXISTS (
            SELECT 1
            FROM jsonb_array_elements(new_cards) existing_card
            WHERE gabarita_subject_normalized(existing_card->>'title') = gabarita_subject_normalized(subject_title)
          ) THEN
            CONTINUE;
          END IF;

          shared_row := NULL;
          SELECT * INTO shared_row
          FROM shared_study_subjects
          WHERE gabarita_subject_normalized(title) = gabarita_subject_normalized(subject_title)
            AND gabarita_subject_normalized(discipline) = gabarita_subject_normalized(section_title)
          ORDER BY
            CASE WHEN lower(btrim(title)) = lower(gabarita_subject_display_title(subject_title)) THEN 0 ELSE 1 END,
            created_at,
            id
          LIMIT 1;

          IF shared_row.id IS NULL THEN
            CONTINUE;
          END IF;

          card_item := jsonb_build_object(
            'id', 'edital-' || substr(md5(role_row.id::text || '|' || COALESCE(section_item->>'id', '') || '|' || gabarita_subject_normalized(subject_title)), 1, 16),
            'title', subject_title,
            'paretoRatio', 'Conteúdo do edital',
            'isQuente', false,
            'sharedSubjectId', shared_row.id::text,
            'studyObjective', shared_row.study_objective,
            'reviewSummary', shared_row.review_summary,
            'content', shared_row.base_content,
            'keyTakeaways', shared_row.key_takeaways,
            'contentBlocks', shared_row.content_blocks,
            'materials', jsonb_build_array(gabarita_subject_display_title(subject_title))
          );
          new_cards := new_cards || jsonb_build_array(card_item);
        END LOOP;
      END IF;

      new_sections := new_sections || jsonb_build_array(
        section_item || jsonb_build_object('cards', new_cards)
      );
    END LOOP;

    working_curriculum := jsonb_set(working_curriculum, '{studySections}', new_sections, true);
    UPDATE catalog_roles
    SET curriculum = working_curriculum,
        updated_at = now()
    WHERE id = role_row.id
      AND catalog_roles.curriculum IS DISTINCT FROM working_curriculum;
  END LOOP;
END
$reconcile$;

-- Planos existentes mantêm as disciplinas escolhidas pelo usuário. Dentro de
-- cada disciplina já selecionada, recebem apenas os cards novos do respectivo
-- catálogo e o material compartilhado que estava ausente.
DO $sync_plans$
DECLARE
  plan_row RECORD;
  role_curriculum JSONB;
  plan_settings JSONB;
  plan_section JSONB;
  catalog_section JSONB;
  plan_card JSONB;
  catalog_card JSONB;
  merged_sections JSONB;
  merged_cards JSONB;
  existing_card JSONB;
BEGIN
  FOR plan_row IN
    SELECT id, course_id, settings
    FROM study_plans
    WHERE course_id IS NOT NULL
      AND settings ? 'studySections'
    ORDER BY created_at, id
  LOOP
    role_curriculum := NULL;
    SELECT curriculum INTO role_curriculum
    FROM catalog_roles
    WHERE course_id = plan_row.course_id
      AND active
    ORDER BY updated_at DESC, created_at, id
    LIMIT 1;
    IF role_curriculum IS NULL THEN
      CONTINUE;
    END IF;

    plan_settings := plan_row.settings;
    merged_sections := '[]'::jsonb;
    FOR plan_section IN
      SELECT value
      FROM jsonb_array_elements(COALESCE(plan_settings->'studySections', '[]'::jsonb))
    LOOP
      catalog_section := NULL;
      SELECT value INTO catalog_section
      FROM jsonb_array_elements(COALESCE(role_curriculum->'studySections', '[]'::jsonb))
      WHERE value->>'id' = plan_section->>'id'
         OR gabarita_subject_normalized(value->>'title') = gabarita_subject_normalized(plan_section->>'title')
      ORDER BY CASE WHEN value->>'id' = plan_section->>'id' THEN 0 ELSE 1 END
      LIMIT 1;

      IF catalog_section IS NULL THEN
        merged_sections := merged_sections || jsonb_build_array(plan_section);
        CONTINUE;
      END IF;

      merged_cards := '[]'::jsonb;
      FOR plan_card IN
        SELECT value
        FROM jsonb_array_elements(COALESCE(plan_section->'cards', '[]'::jsonb))
      LOOP
        catalog_card := NULL;
        SELECT value INTO catalog_card
        FROM jsonb_array_elements(COALESCE(catalog_section->'cards', '[]'::jsonb))
        WHERE gabarita_subject_normalized(value->>'title') = gabarita_subject_normalized(plan_card->>'title')
        ORDER BY CASE WHEN value->>'id' = plan_card->>'id' THEN 0 ELSE 1 END
        LIMIT 1;

        IF catalog_card IS NOT NULL THEN
          IF btrim(COALESCE(plan_card->>'sharedSubjectId', '')) = '' THEN
            plan_card := plan_card || jsonb_build_object('sharedSubjectId', catalog_card->>'sharedSubjectId');
          END IF;
          IF btrim(COALESCE(plan_card->>'content', '')) = ''
            OR plan_card->>'content' LIKE '<p>Estude este item do edital%'
          THEN
            plan_card := plan_card || jsonb_build_object(
              'content', catalog_card->'content',
              'keyTakeaways', catalog_card->'keyTakeaways'
            );
          END IF;
          IF jsonb_typeof(plan_card->'contentBlocks') <> 'array'
            OR jsonb_array_length(COALESCE(plan_card->'contentBlocks', '[]'::jsonb)) = 0
          THEN
            plan_card := plan_card || jsonb_build_object('contentBlocks', catalog_card->'contentBlocks');
          END IF;
          IF btrim(COALESCE(plan_card->>'studyObjective', '')) = '' THEN
            plan_card := plan_card || jsonb_build_object('studyObjective', catalog_card->'studyObjective');
          END IF;
          IF jsonb_typeof(plan_card->'reviewSummary') <> 'array'
            OR jsonb_array_length(COALESCE(plan_card->'reviewSummary', '[]'::jsonb)) = 0
          THEN
            plan_card := plan_card || jsonb_build_object('reviewSummary', catalog_card->'reviewSummary');
          END IF;
        END IF;
        merged_cards := merged_cards || jsonb_build_array(plan_card);
      END LOOP;

      FOR catalog_card IN
        SELECT value
        FROM jsonb_array_elements(COALESCE(catalog_section->'cards', '[]'::jsonb))
      LOOP
        IF NOT EXISTS (
          SELECT 1
          FROM jsonb_array_elements(merged_cards) current_card
          WHERE gabarita_subject_normalized(current_card->>'title') = gabarita_subject_normalized(catalog_card->>'title')
        ) THEN
          merged_cards := merged_cards || jsonb_build_array(catalog_card);
        END IF;
      END LOOP;

      merged_sections := merged_sections || jsonb_build_array(
        plan_section || jsonb_build_object('cards', merged_cards)
      );
    END LOOP;

    plan_settings := jsonb_set(plan_settings, '{studySections}', merged_sections, true);
    UPDATE study_plans
    SET settings = plan_settings,
        updated_at = now()
    WHERE id = plan_row.id
      AND study_plans.settings IS DISTINCT FROM plan_settings;
  END LOOP;
END
$sync_plans$;

-- Roteiros já gerados não ganham nem perdem tópicos nesta migração; apenas os
-- tópicos equivalentes recebem o material de apoio que faltava.
WITH matching_material AS (
  SELECT DISTINCT ON (topic.id)
    topic.id AS topic_id,
    shared.study_objective,
    shared.review_summary,
    shared.base_content,
    shared.key_takeaways,
    shared.content_blocks
  FROM roadmap_topics topic
  JOIN shared_study_subjects shared
    ON gabarita_subject_normalized(shared.title) = gabarita_subject_normalized(topic.title)
   AND gabarita_subject_normalized(shared.discipline) = gabarita_subject_normalized(topic.subject_name)
  ORDER BY topic.id, shared.created_at, shared.id
)
UPDATE roadmap_topics topic
SET objective = CASE
      WHEN btrim(COALESCE(topic.objective, '')) = ''
        OR topic.objective = 'Dominar os conceitos essenciais e aplicá-los com segurança em questões de prova.'
        THEN material.study_objective
      ELSE topic.objective
    END,
    content = topic.content
      || CASE
        WHEN btrim(COALESCE(topic.content->>'studyObjective', '')) = ''
          THEN jsonb_build_object('studyObjective', material.study_objective)
        ELSE '{}'::jsonb
      END
      || CASE
        WHEN jsonb_typeof(topic.content->'reviewSummary') <> 'array'
          OR jsonb_array_length(COALESCE(topic.content->'reviewSummary', '[]'::jsonb)) = 0
          THEN jsonb_build_object('reviewSummary', material.review_summary)
        ELSE '{}'::jsonb
      END
      || CASE
        WHEN btrim(COALESCE(topic.content->>'content', '')) = ''
          THEN jsonb_build_object('content', material.base_content)
        ELSE '{}'::jsonb
      END
      || CASE
        WHEN jsonb_typeof(topic.content->'keyTakeaways') <> 'array'
          OR jsonb_array_length(COALESCE(topic.content->'keyTakeaways', '[]'::jsonb)) = 0
          THEN jsonb_build_object('keyTakeaways', material.key_takeaways)
        ELSE '{}'::jsonb
      END
      || CASE
        WHEN jsonb_typeof(topic.content->'contentBlocks') <> 'array'
          OR jsonb_array_length(COALESCE(topic.content->'contentBlocks', '[]'::jsonb)) = 0
          THEN jsonb_build_object('contentBlocks', material.content_blocks)
        ELSE '{}'::jsonb
      END
FROM matching_material material
WHERE topic.id = material.topic_id;
