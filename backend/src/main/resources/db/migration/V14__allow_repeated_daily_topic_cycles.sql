ALTER TABLE daily_tasks
    ADD COLUMN cycle_index INTEGER NOT NULL DEFAULT 0 CHECK (cycle_index >= 0);

DO $$
DECLARE
    previous_constraint TEXT;
BEGIN
    SELECT constraint_name INTO previous_constraint
    FROM information_schema.table_constraints
    WHERE table_schema = current_schema()
      AND table_name = 'daily_tasks'
      AND constraint_type = 'UNIQUE'
      AND constraint_name <> 'daily_tasks_topic_activity_cycle_unique'
    ORDER BY constraint_name
    LIMIT 1;

    IF previous_constraint IS NOT NULL THEN
        EXECUTE format('ALTER TABLE daily_tasks DROP CONSTRAINT %I', previous_constraint);
    END IF;
END $$;

ALTER TABLE daily_tasks
    ADD CONSTRAINT daily_tasks_topic_activity_cycle_unique
    UNIQUE (user_id, plan_id, task_date, roadmap_topic_id, activity_type, cycle_index);
