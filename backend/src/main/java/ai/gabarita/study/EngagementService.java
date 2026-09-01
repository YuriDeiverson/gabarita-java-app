package ai.gabarita.study;

import java.time.*;
import java.util.*;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EngagementService {
    private final JdbcClient jdbc;
    private final StudyBootstrapService bootstrap;
    private final AdaptivePlanningService planner;

    public EngagementService(JdbcClient jdbc, StudyBootstrapService bootstrap,AdaptivePlanningService planner) {
        this.jdbc = jdbc; this.bootstrap = bootstrap;this.planner=planner;
    }

    public void award(UUID userId, int amount, String reason, String relatedType, UUID relatedId, String key) {
        jdbc.sql("""
            INSERT INTO xp_transactions(id,user_id,amount,reason,related_type,related_id,idempotency_key)
            VALUES(gen_random_uuid(),:u,:amount,:reason,:type,:related,:key)
            ON CONFLICT(idempotency_key) DO NOTHING
            """).param("u", userId).param("amount", amount).param("reason", reason)
                .param("type", relatedType).param("related", relatedId).param("key", key).update();
    }

    @Transactional
    public void refreshDay(UUID userId, UUID planId) {
        LocalDate today = bootstrap.userToday(userId);
        Set<Integer> studyWeekdays=planner.studyWeekdays(planId,userId);
        var totals = jdbc.sql("""
            SELECT COALESCE((SELECT SUM(dt.completed_minutes) FROM daily_tasks dt WHERE dt.user_id=:u AND dt.plan_id=:p AND dt.task_date=:date),0)
                +COALESCE((SELECT SUM(ss.effective_seconds/60) FROM study_sessions ss JOIN users su ON su.id=ss.user_id
                  WHERE ss.user_id=:u AND ss.plan_id=:p AND ss.session_kind='QUESTIONS' AND ss.status='COMPLETED'
                  AND ss.daily_task_id IS NULL
                  AND (ss.ended_at AT TIME ZONE su.timezone)::date=:date),0) studied_minutes,
              COALESCE((SELECT COUNT(*) FROM daily_tasks dt WHERE dt.user_id=:u AND dt.plan_id=:p AND dt.task_date=:date AND dt.status='COMPLETED'),0) tasks_completed,
              COALESCE((SELECT ROUND(100.0*SUM(dt.completed_minutes)/NULLIF(SUM(dt.planned_minutes),0),2)
                FROM daily_tasks dt WHERE dt.user_id=:u AND dt.plan_id=:p AND dt.task_date=:date
                  AND NOT dt.outside_planned_hours),0) goal_percentage
            """).param("u", userId).param("p", planId).param("date", today).query().singleRow();
        var qualification = dailyQualification(userId, today);
        int minutes = number(totals, "studied_minutes"), tasks = number(totals, "tasks_completed"),
                questions = number(qualification, "questions_answered"),
                completedSessions = number(qualification, "sessions_completed");
        double goal = ((Number) totals.get("goal_percentage")).doubleValue();
        boolean scheduled=isScheduled(today,studyWeekdays);
        boolean valid = scheduled&&LearningRules.validStreakDay(questions, completedSessions), perfect = scheduled&&goal >= 100;
        var previousDay = jdbc.sql("SELECT valid,perfect FROM streak_days WHERE user_id=:u AND study_date=:date")
                .param("u", userId).param("date", today).query().listOfRows();
        boolean wasValid = !previousDay.isEmpty() && Boolean.TRUE.equals(previousDay.getFirst().get("valid"));
        boolean wasPerfect = !previousDay.isEmpty() && Boolean.TRUE.equals(previousDay.getFirst().get("perfect"));
        jdbc.sql("""
            INSERT INTO streak_days(id,user_id,study_date,studied_minutes,tasks_completed,questions_answered,goal_percentage,valid,perfect)
            VALUES(gen_random_uuid(),:u,:date,:minutes,:tasks,:questions,:goal,:valid,:perfect)
            ON CONFLICT(user_id,study_date) DO UPDATE SET studied_minutes=:minutes,tasks_completed=:tasks,
              questions_answered=:questions,goal_percentage=:goal,valid=:valid,perfect=:perfect,updated_at=now()
            """).param("u", userId).param("date", today).param("minutes", minutes).param("tasks", tasks)
                .param("questions", questions).param("goal", Math.min(100, goal)).param("valid", valid).param("perfect", perfect).update();

        jdbc.sql("INSERT INTO study_streaks(user_id) VALUES(:u) ON CONFLICT(user_id) DO NOTHING").param("u", userId).update();
        if (valid && !wasValid) {
            int current=recalculateStreak(userId,planId,today,studyWeekdays);
            jdbc.sql("UPDATE study_streaks SET last_qualified_at=now(),updated_at=now() WHERE user_id=:u")
                    .param("u",userId).update();
            award(userId, 10, "STREAK_DAY", "STREAK_DAY", null, "streak:" + userId + ":" + today);
            createNotification(userId, planId, "STREAK_INCREASED", "Ofensiva aumentada!",
                    "Sua atividade de hoje garantiu " + current + " dia" + (current == 1 ? "" : "s") + " de ofensiva.", "NORMAL");
        } else {
            recalculateStreak(userId,planId,today,studyWeekdays);
        }
        if (perfect && !wasPerfect) {
            int perfectDays = jdbc.sql("UPDATE study_streaks SET perfect_days=perfect_days+1,updated_at=now() WHERE user_id=:u RETURNING perfect_days")
                    .param("u",userId).query(Integer.class).single();
            if (perfectDays % 7 == 0) {
                jdbc.sql("""
                    INSERT INTO streak_protections(id,user_id,acquisition_reason,status)
                    VALUES(gen_random_uuid(),:u,'Semana perfeita concluída','AVAILABLE')
                    """).param("u",userId).update();
                jdbc.sql("UPDATE study_streaks SET protection_balance=protection_balance+1 WHERE user_id=:u")
                        .param("u",userId).update();
                createNotification(userId,planId,"STREAK_PROTECTION_EARNED","Você ganhou uma proteção!",
                        "Sua semana perfeita rendeu uma proteção de ofensiva.","HIGH");
            }
        }
        if (perfect) award(userId, 30, "DAILY_GOAL", "STREAK_DAY", null, "daily-goal:" + userId + ":" + today);
    }

    @Transactional
    public void recordQuestionActivity(UUID userId, UUID planId) {
        jdbc.sql("INSERT INTO study_streaks(user_id) VALUES(:u) ON CONFLICT(user_id) DO NOTHING").param("u", userId).update();
        jdbc.sql("UPDATE study_streaks SET last_question_answered_at=now(),updated_at=now() WHERE user_id=:u")
                .param("u", userId).update();
        refreshDay(userId, planId);
    }

    @Transactional
    public void protectPreviousStudyDay(UUID userId, UUID planId) {
        LocalDate today=bootstrap.userToday(userId);
        Set<Integer> studyWeekdays=planner.studyWeekdays(planId,userId);
        LocalDate yesterday = previousScheduledDate(today,studyWeekdays);
        if(yesterday==null)return;
        boolean valid = jdbc.sql("SELECT valid OR protected FROM streak_days WHERE user_id=:u AND study_date=:d")
                .param("u", userId).param("d", yesterday).query(Boolean.class).optional().orElse(false);
        if (valid) return;
        var streak = jdbc.sql("SELECT * FROM study_streaks WHERE user_id=:u FOR UPDATE")
                .param("u", userId).query().listOfRows().stream().findFirst().orElse(null);
        if (streak == null || number(streak, "protection_balance") <= 0) return;
        var protection = jdbc.sql("""
            SELECT id FROM streak_protections WHERE user_id=:u AND status='AVAILABLE'
              AND (expires_at IS NULL OR expires_at>now()) ORDER BY acquired_at LIMIT 1 FOR UPDATE
            """).param("u", userId).query(UUID.class).list();
        if (protection.isEmpty()) return;
        jdbc.sql("UPDATE streak_protections SET status='USED',used_for_date=:d,used_at=now(),use_reason='Ofensiva preservada automaticamente' WHERE id=:id")
                .param("d", yesterday).param("id", protection.getFirst()).update();
        jdbc.sql("UPDATE study_streaks SET protection_balance=GREATEST(0,protection_balance-1),updated_at=now() WHERE user_id=:u")
                .param("u", userId).update();
        jdbc.sql("""
            INSERT INTO streak_days(id,user_id,study_date,valid,protected)
            VALUES(gen_random_uuid(),:u,:d,true,true)
            ON CONFLICT(user_id,study_date) DO UPDATE SET valid=true,protected=true,updated_at=now()
            """).param("u", userId).param("d", yesterday).update();
        recalculateStreak(userId,planId,today,studyWeekdays);
        createNotification(userId, planId, "STREAK_PROTECTED", "Proteção de ofensiva utilizada",
                "Sua sequência foi preservada automaticamente.", "HIGH");
    }

    @Transactional
    public Map<String,Object> streak(UUID userId) {
        LocalDate today = bootstrap.userToday(userId);
        UUID planId=activePlanId(userId);
        Set<Integer> studyWeekdays=planId==null?Set.of():planner.studyWeekdays(planId,userId);
        if(planId!=null)recalculateStreak(userId,planId,today,studyWeekdays);
        var row = jdbc.sql("SELECT * FROM study_streaks WHERE user_id=:u").param("u", userId)
                .query().listOfRows().stream().findFirst().orElse(Map.of());
        var result = new LinkedHashMap<String,Object>(row);
        var qualification = dailyQualification(userId, today);
        int questions = number(qualification, "questions_answered");
        int sessions = number(qualification, "sessions_completed");
        boolean recorded = jdbc.sql("SELECT valid OR protected FROM streak_days WHERE user_id=:u AND study_date=:date")
                .param("u", userId).param("date", today).query(Boolean.class).optional().orElse(false);
        boolean todayIsStudyDay=isScheduled(today,studyWeekdays);
        result.put("today_questions_answered", questions);
        result.put("today_sessions_completed", sessions);
        result.put("qualified_by_questions",todayIsStudyDay&&questions > 0);
        result.put("qualified_by_session",todayIsStudyDay&&sessions > 0);
        result.put("today_qualified",todayIsStudyDay&&(recorded || LearningRules.validStreakDay(questions, sessions)));
        result.put("today_is_study_day",todayIsStudyDay);
        result.put("next_study_date",nextScheduledDate(today,studyWeekdays));
        result.put("studied_days_month", jdbc.sql("SELECT COUNT(*) FROM streak_days WHERE user_id=:u AND valid AND study_date>=:month")
                .param("u", userId).param("month", today.withDayOfMonth(1)).query(Integer.class).single());
        return result;
    }

    private int recalculateStreak(UUID userId,UUID planId,LocalDate today,Set<Integer> studyWeekdays){
        if(studyWeekdays.isEmpty())return 0;
        var validDates=new HashSet<LocalDate>();
        jdbc.sql("""
            SELECT study_date FROM streak_days
            WHERE user_id=:u AND (valid OR protected) ORDER BY study_date DESC LIMIT 3660
            """).param("u",userId).query(LocalDate.class).list().forEach(validDates::add);
        LocalDate anchor=isScheduled(today,studyWeekdays)&&validDates.contains(today)
                ?today:previousScheduledDate(today,studyWeekdays);
        int current=0;LocalDate cursor=anchor;
        while(cursor!=null&&validDates.contains(cursor)&&current<3660){
            current++;cursor=previousScheduledDate(cursor,studyWeekdays);
        }
        LocalDate last=current>0?anchor:null;
        jdbc.sql("""
            UPDATE study_streaks SET current_streak=:current,
              longest_streak=GREATEST(longest_streak,:current),last_valid_date=COALESCE(:last,last_valid_date),
              status=CASE WHEN :current>0 THEN 'ACTIVE' WHEN last_valid_date IS NULL THEN status ELSE 'BROKEN' END,
              updated_at=now() WHERE user_id=:u
            """).param("current",current).param("last",last).param("u",userId).update();
        return current;
    }

    private UUID activePlanId(UUID userId){
        return jdbc.sql("SELECT id FROM study_plans WHERE user_id=:u AND is_primary AND status='ACTIVE' LIMIT 1")
                .param("u",userId).query(UUID.class).optional().orElse(null);
    }

    static boolean isScheduled(LocalDate date,Set<Integer> weekdays){return weekdays.contains(javascriptDay(date));}
    static LocalDate previousScheduledDate(LocalDate before,Set<Integer> weekdays){
        if(weekdays.isEmpty())return null;
        LocalDate date=before.minusDays(1);
        for(int offset=0;offset<7;offset++,date=date.minusDays(1))if(isScheduled(date,weekdays))return date;
        return null;
    }
    static LocalDate nextScheduledDate(LocalDate onOrAfter,Set<Integer> weekdays){
        if(weekdays.isEmpty())return null;
        LocalDate date=onOrAfter;
        for(int offset=0;offset<7;offset++,date=date.plusDays(1))if(isScheduled(date,weekdays))return date;
        return null;
    }
    private static int javascriptDay(LocalDate date){return date.getDayOfWeek()==DayOfWeek.SUNDAY?0:date.getDayOfWeek().getValue();}

    private Map<String,Object> dailyQualification(UUID userId, LocalDate date) {
        return jdbc.sql("""
            SELECT GREATEST(
                COALESCE((SELECT SUM(dt.questions_answered) FROM daily_tasks dt
                  WHERE dt.user_id=:u AND dt.task_date=:date),0),
                COALESCE((SELECT COUNT(*) FROM quiz_answer_events event
                  JOIN study_plans sp ON sp.id=event.study_plan_id JOIN users su ON su.id=sp.user_id
                  WHERE sp.user_id=:u AND (event.answered_at AT TIME ZONE su.timezone)::date=:date),0)
                +COALESCE((SELECT COUNT(*) FROM question_session_answers answer
                  JOIN study_sessions ss ON ss.id=answer.session_id JOIN users su ON su.id=ss.user_id
                  WHERE ss.user_id=:u AND (answer.answered_at AT TIME ZONE su.timezone)::date=:date),0)
                +COALESCE((SELECT SUM(ss.questions_answered) FROM study_sessions ss
                  JOIN users su ON su.id=ss.user_id WHERE ss.user_id=:u AND ss.session_kind='STUDY'
                  AND ss.status='COMPLETED' AND (ss.ended_at AT TIME ZONE su.timezone)::date=:date),0)
                +COALESCE((SELECT COUNT(*) FROM answers answer JOIN users su ON su.id=answer.user_id
                  WHERE answer.user_id=:u AND (answer.answered_at AT TIME ZONE su.timezone)::date=:date),0)
              ) questions_answered,
              COALESCE((SELECT COUNT(*) FROM study_sessions ss JOIN users su ON su.id=ss.user_id
                WHERE ss.user_id=:u AND ss.status='COMPLETED'
                  AND (ss.ended_at AT TIME ZONE su.timezone)::date=:date),0) sessions_completed
            """).param("u", userId).param("date", date).query().singleRow();
    }

    public Map<String,Object> experience(UUID userId) {
        int total = jdbc.sql("SELECT COALESCE(SUM(amount),0) FROM xp_transactions WHERE user_id=:u")
                .param("u", userId).query(Integer.class).single();
        int level = LearningRules.levelForXp(total), previous = (level - 1) * (level - 1) * 150;
        return Map.of("total_xp", total, "level", level, "level_name", levelName(level),
                "current_level_xp", total - previous, "next_level_xp", LearningRules.xpForNextLevel(level) - previous);
    }

    public List<Map<String,Object>> protections(UUID userId) {
        return jdbc.sql("SELECT * FROM streak_protections WHERE user_id=:u ORDER BY acquired_at DESC")
                .param("u", userId).query().listOfRows();
    }

    public void createNotification(UUID userId, UUID planId, String type, String title, String message, String priority) {
        jdbc.sql("""
            INSERT INTO notifications(id,user_id,plan_id,type,title,message,scheduled_for,destination,priority,status)
            VALUES(gen_random_uuid(),:u,:p,:type,:title,:message,now(),'/notifications',:priority,'DELIVERED')
            """).param("u", userId).param("p", planId).param("type", type).param("title", title)
                .param("message", message).param("priority", priority).update();
    }

    private int number(Map<String,Object> row, String key) { Object value=row.get(key); return value instanceof Number n ? n.intValue() : 0; }
    static LocalDate localDate(Object value) {
        if (value == null) return null;
        if (value instanceof LocalDate date) return date;
        if (value instanceof java.sql.Date date) return date.toLocalDate();
        return LocalDate.parse(String.valueOf(value));
    }
    private String levelName(int level) { return switch(Math.min(level,5)) { case 1 -> "Iniciante"; case 2 -> "Aprendiz"; case 3 -> "Consistente"; case 4 -> "Estrategista"; default -> "Especialista"; }; }
}
