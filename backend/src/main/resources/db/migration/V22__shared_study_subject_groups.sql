ALTER TABLE shared_study_subjects
  ADD COLUMN IF NOT EXISTS study_group VARCHAR(80) NOT NULL DEFAULT 'Conhecimentos Específicos';

UPDATE shared_study_subjects shared
SET study_group = COALESCE((
  SELECT CASE
    WHEN topic->>'category' = 'Conhecimentos Básicos' THEN 'Conhecimentos Gerais'
    WHEN BTRIM(COALESCE(topic->>'category', '')) = '' THEN 'Conhecimentos Específicos'
    ELSE topic->>'category'
  END
  FROM catalog_roles role
  CROSS JOIN LATERAL jsonb_array_elements(COALESCE(role.curriculum->'topics', '[]'::jsonb)) topic
  WHERE LOWER(BTRIM(topic->>'title')) = LOWER(BTRIM(shared.discipline))
  ORDER BY CASE
    WHEN topic->>'category' IN ('Conhecimentos Gerais', 'Conhecimentos Básicos') THEN 0
    WHEN topic->>'category' = 'Legislação' THEN 1
    ELSE 2
  END
  LIMIT 1
), study_group);

CREATE INDEX IF NOT EXISTS shared_study_subjects_group_discipline
  ON shared_study_subjects(study_group, discipline);
