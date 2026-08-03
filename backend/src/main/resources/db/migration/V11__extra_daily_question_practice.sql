ALTER TABLE daily_tasks
    ADD COLUMN IF NOT EXISTS is_optional boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS outside_planned_hours boolean NOT NULL DEFAULT false;

