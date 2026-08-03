UPDATE study_plans
SET block_minutes = 60,
    break_minutes = 10,
    updated_at = now()
WHERE block_minutes <> 60 OR break_minutes <> 10;

UPDATE availability
SET block_minutes = 60,
    break_minutes = 10
WHERE block_minutes IS DISTINCT FROM 60 OR break_minutes IS DISTINCT FROM 10;

UPDATE roadmap_topics
SET planned_minutes = 60
WHERE active AND planned_minutes <> 60;
