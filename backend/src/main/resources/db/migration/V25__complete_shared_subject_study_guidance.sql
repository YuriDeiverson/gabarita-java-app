-- Completa a orientação de estudo dos assuntos importados antes da Biblioteca
-- de assuntos. Conteúdos já revisados manualmente (como Língua Portuguesa)
-- são preservados.
UPDATE shared_study_subjects
SET
  study_objective = CASE
    WHEN btrim(study_objective) = '' THEN
      'Compreender os conceitos, regras e aplicações de ' || title ||
      ' para reconhecer sua cobrança e resolver questões de prova com segurança.'
    ELSE study_objective
  END,
  review_summary = CASE
    WHEN jsonb_array_length(review_summary) > 0 THEN review_summary
    WHEN jsonb_array_length(key_takeaways) > 0 THEN key_takeaways
    ELSE jsonb_build_array(
      'Identifique os conceitos essenciais de ' || title || '.',
      'Relacione as regras às situações práticas de cobrança.',
      'Resolva questões e registre os erros para a próxima revisão.'
    )
  END,
  updated_at = now()
WHERE btrim(study_objective) = '' OR jsonb_array_length(review_summary) = 0;

-- Atualiza os currículos dos cargos sem substituir objetivos ou resumos que
-- já tenham sido personalizados pelo administrador.
WITH refreshed AS (
  SELECT role.id,
    jsonb_set(
      role.curriculum,
      '{studySections}',
      COALESCE((
        SELECT jsonb_agg(
          section_item.section || jsonb_build_object(
            'cards',
            COALESCE((
              SELECT jsonb_agg(
                CASE WHEN shared.id IS NULL THEN card_item.card ELSE
                  card_item.card || jsonb_build_object(
                    'sharedSubjectId', shared.id::text,
                    'studyObjective', CASE
                      WHEN btrim(COALESCE(card_item.card->>'studyObjective', '')) = ''
                        THEN to_jsonb(shared.study_objective)
                      ELSE card_item.card->'studyObjective'
                    END,
                    'reviewSummary', CASE
                      WHEN jsonb_typeof(card_item.card->'reviewSummary') <> 'array'
                        OR jsonb_array_length(COALESCE(card_item.card->'reviewSummary', '[]'::jsonb)) = 0
                        THEN shared.review_summary
                      ELSE card_item.card->'reviewSummary'
                    END
                  )
                END
                ORDER BY card_item.position
              )
              FROM jsonb_array_elements(COALESCE(section_item.section->'cards', '[]'::jsonb))
                WITH ORDINALITY AS card_item(card, position)
              LEFT JOIN shared_study_subjects shared ON shared.title = card_item.card->>'title'
            ), '[]'::jsonb)
          )
          ORDER BY section_item.position
        )
        FROM jsonb_array_elements(COALESCE(role.curriculum->'studySections', '[]'::jsonb))
          WITH ORDINALITY AS section_item(section, position)
      ), '[]'::jsonb),
      true
    ) AS curriculum
  FROM catalog_roles role
)
UPDATE catalog_roles role
SET curriculum = refreshed.curriculum, updated_at = now()
FROM refreshed
WHERE role.id = refreshed.id AND role.curriculum IS DISTINCT FROM refreshed.curriculum;

-- Planos já criados mantêm uma cópia do currículo. Complete a cópia para que
-- o objetivo e o resumo apareçam imediatamente no cronograma do usuário.
WITH refreshed AS (
  SELECT plan.id,
    jsonb_set(
      plan.settings,
      '{studySections}',
      COALESCE((
        SELECT jsonb_agg(
          section_item.section || jsonb_build_object(
            'cards',
            COALESCE((
              SELECT jsonb_agg(
                CASE WHEN shared.id IS NULL THEN card_item.card ELSE
                  card_item.card || jsonb_build_object(
                    'sharedSubjectId', shared.id::text,
                    'studyObjective', CASE
                      WHEN btrim(COALESCE(card_item.card->>'studyObjective', '')) = ''
                        THEN to_jsonb(shared.study_objective)
                      ELSE card_item.card->'studyObjective'
                    END,
                    'reviewSummary', CASE
                      WHEN jsonb_typeof(card_item.card->'reviewSummary') <> 'array'
                        OR jsonb_array_length(COALESCE(card_item.card->'reviewSummary', '[]'::jsonb)) = 0
                        THEN shared.review_summary
                      ELSE card_item.card->'reviewSummary'
                    END
                  )
                END
                ORDER BY card_item.position
              )
              FROM jsonb_array_elements(COALESCE(section_item.section->'cards', '[]'::jsonb))
                WITH ORDINALITY AS card_item(card, position)
              LEFT JOIN shared_study_subjects shared ON shared.title = card_item.card->>'title'
            ), '[]'::jsonb)
          )
          ORDER BY section_item.position
        )
        FROM jsonb_array_elements(COALESCE(plan.settings->'studySections', '[]'::jsonb))
          WITH ORDINALITY AS section_item(section, position)
      ), '[]'::jsonb),
      true
    ) AS settings
  FROM study_plans plan
  WHERE plan.settings ? 'studySections'
)
UPDATE study_plans plan
SET settings = refreshed.settings, updated_at = now()
FROM refreshed
WHERE plan.id = refreshed.id AND plan.settings IS DISTINCT FROM refreshed.settings;

-- Os tópicos de roteiros já criados também recebem os campos, sem substituir
-- objetivos que tenham sido individualmente ajustados.
UPDATE roadmap_topics topic
SET
  objective = CASE
    WHEN btrim(COALESCE(topic.objective, '')) = ''
      OR topic.objective = 'Dominar os conceitos essenciais e aplicá-los com segurança em questões de prova.'
      THEN shared.study_objective
    ELSE topic.objective
  END,
  content = topic.content
    || CASE
      WHEN btrim(COALESCE(topic.content->>'studyObjective', '')) = ''
        THEN jsonb_build_object('studyObjective', shared.study_objective)
      ELSE '{}'::jsonb
    END
    || CASE
      WHEN jsonb_typeof(topic.content->'reviewSummary') <> 'array'
        OR jsonb_array_length(COALESCE(topic.content->'reviewSummary', '[]'::jsonb)) = 0
        THEN jsonb_build_object('reviewSummary', shared.review_summary)
      ELSE '{}'::jsonb
    END
FROM shared_study_subjects shared
WHERE shared.title = topic.title
  AND (
    btrim(COALESCE(topic.objective, '')) = ''
    OR topic.objective = 'Dominar os conceitos essenciais e aplicá-los com segurança em questões de prova.'
    OR btrim(COALESCE(topic.content->>'studyObjective', '')) = ''
    OR jsonb_typeof(topic.content->'reviewSummary') <> 'array'
    OR jsonb_array_length(COALESCE(topic.content->'reviewSummary', '[]'::jsonb)) = 0
  );
