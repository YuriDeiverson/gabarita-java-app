-- Plans created before the daily experience bootstrap did not receive the initial notification.
-- Backfill one notification for the current active plan of each affected user.
WITH current_active_plan AS (
  SELECT DISTINCT ON (user_id) id, user_id
  FROM study_plans
  WHERE status = 'ACTIVE'
  ORDER BY user_id, is_primary DESC, updated_at DESC
)
INSERT INTO notifications(
  id, user_id, plan_id, type, title, message, scheduled_for, destination, priority, status
)
SELECT
  gen_random_uuid(), plan.user_id, plan.id, 'PLAN_READY', 'Seu plano diário está pronto',
  'Comece pela atividade recomendada e mantenha sua rotina de estudos ativa.',
  now(), '/', 'HIGH', 'DELIVERED'
FROM current_active_plan plan
WHERE NOT EXISTS (
  SELECT 1
  FROM notifications notification
  WHERE notification.user_id = plan.user_id
    AND notification.plan_id = plan.id
    AND notification.type = 'PLAN_READY'
);
