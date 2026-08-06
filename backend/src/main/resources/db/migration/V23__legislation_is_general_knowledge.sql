UPDATE shared_study_subjects shared
SET study_group = COALESCE((
  SELECT CASE
    WHEN topic->>'category' IN ('Conhecimentos Básicos', 'Conhecimentos Gerais', 'Legislação')
      THEN 'Conhecimentos Gerais'
    ELSE 'Conhecimentos Específicos'
  END
  FROM catalog_roles role
  CROSS JOIN LATERAL jsonb_array_elements(COALESCE(role.curriculum->'topics', '[]'::jsonb)) topic
  WHERE LOWER(BTRIM(topic->>'title')) = LOWER(BTRIM(shared.discipline))
  ORDER BY CASE
    WHEN topic->>'category' IN ('Conhecimentos Básicos', 'Conhecimentos Gerais', 'Legislação') THEN 0
    ELSE 1
  END
  LIMIT 1
), CASE
  WHEN study_group IN ('Conhecimentos Básicos', 'Conhecimentos Gerais', 'Legislação')
    THEN 'Conhecimentos Gerais'
  ELSE 'Conhecimentos Específicos'
END);
