package ai.gabarita.study;

import ai.gabarita.auth.CurrentUser;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.*;
import java.util.*;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DailyStudyService {
    private final JdbcClient jdbc;
    private final ObjectMapper json;
    private final StudyBootstrapService bootstrap;
    private final StudySessionService sessions;
    private final EngagementService engagement;
    private final AdaptivePlanningService planner;
    private final CurrentUser currentUser;

    public DailyStudyService(JdbcClient jdbc, ObjectMapper json, StudyBootstrapService bootstrap,
                             StudySessionService sessions, EngagementService engagement,
                             AdaptivePlanningService planner,CurrentUser currentUser) {
        this.jdbc=jdbc; this.json=json; this.bootstrap=bootstrap; this.sessions=sessions; this.engagement=engagement;
        this.planner=planner;this.currentUser=currentUser;
    }

    @Transactional
    public Map<String,Object> today() {
        var plan = activePlan();
        UUID planId = (UUID) plan.get("id");
        int goal = Math.max(60, number(plan,"daily_goal_minutes"));
        ensureRoadmap(plan, goal);
        sessions.reconcileActiveSession(currentUser.id());
        LocalDate today = bootstrap.userToday(currentUser.id());
        planner.enforceAvailability(planId,currentUser.id(),today);
        planner.archiveMissed(planId,currentUser.id(),today);
        engagement.protectPreviousStudyDay(currentUser.id(), planId);
        var tasks = bootstrap.ensureToday(planId, currentUser.id(), goal);
        refreshReviews(today);
        engagement.refreshDay(currentUser.id(), planId);
        var summary = jdbc.sql("""
            SELECT COALESCE(SUM(planned_minutes) FILTER(WHERE NOT outside_planned_hours),0) planned_minutes,
              COALESCE(SUM(completed_minutes) FILTER(WHERE NOT outside_planned_hours),0) completed_minutes,
              COUNT(*) FILTER(WHERE NOT outside_planned_hours) total_tasks,
              COUNT(*) FILTER(WHERE NOT outside_planned_hours AND status='COMPLETED') completed_tasks,
              COALESCE(SUM(planned_minutes) FILTER(WHERE outside_planned_hours AND status<>'SKIPPED'),0) extra_question_minutes,
              COALESCE(SUM(question_goal) FILTER(WHERE status<>'SKIPPED'),0) question_goal,
              COALESCE(SUM(questions_answered),0) questions_answered
            FROM daily_tasks WHERE user_id=:u AND plan_id=:p AND task_date=:date
            """).param("u",currentUser.id()).param("p",planId).param("date",today).query().singleRow();
        int planned = number(summary,"planned_minutes"), completed = number(summary,"completed_minutes");
        boolean studyDay = planner.isStudyDay(planId,currentUser.id(),today);
        int effectiveGoal = planned == 0 ? (studyDay ? goal : 0) : planned;
        var todaySummary = new LinkedHashMap<String,Object>(summary);
        todaySummary.put("date",today); todaySummary.put("goal_minutes",effectiveGoal);
        todaySummary.put("remaining_minutes",Math.max(0,effectiveGoal-completed));
        todaySummary.put("progress_percentage",planned == 0 ? 0 : Math.min(100,Math.round(completed*100f/planned)));

        var result = new LinkedHashMap<String,Object>();
        result.put("plan",plan); result.put("today",todaySummary); result.put("tasks",tasks);
        result.put("active_session",sessions.activeOrEmpty(currentUser.id()));
        result.put("streak",engagement.streak(currentUser.id())); result.put("experience",engagement.experience(currentUser.id()));
        result.put("reviews",dashboardReviews(5)); result.put("next",next(planId));
        result.put("roadmap",roadmap(planId));
        result.put("planning",planner.summary(planId,currentUser.id(),today));
        result.put("notifications", jdbc.sql("""
            SELECT * FROM notifications WHERE user_id=:u AND scheduled_for<=now() ORDER BY read_at NULLS FIRST,scheduled_for DESC LIMIT 5
            """).param("u",currentUser.id()).query().listOfRows());
        result.put("unread_notifications",jdbc.sql("SELECT COUNT(*) FROM notifications WHERE user_id=:u AND read_at IS NULL AND scheduled_for<=now()")
                .param("u",currentUser.id()).query(Integer.class).single());
        return result;
    }

    public Map<String,Object> next(UUID planId) {
        var rows = jdbc.sql("""
            WITH plan_metrics AS (
              SELECT COALESCE(AVG(tp2.mastery) FILTER(WHERE tp2.attempts>0),0) plan_mastery,
                COUNT(*) FILTER(WHERE tp2.attempts>0) studied_topics,
                COUNT(*) FILTER(WHERE tp2.status='COMPLETED') completed_topics
              FROM topic_progress tp2 JOIN roadmap_topics rt2 ON rt2.id=tp2.roadmap_topic_id
              WHERE tp2.user_id=:u AND rt2.plan_id=:p AND rt2.active
            )
            SELECT rt.id,rt.title,rt.subject_name,rt.planned_minutes,rt.recommended_questions,rt.minimum_accuracy,
              tp.mastery,tp.status,tp.attempts,tp.questions_answered,rt.priority,
              pm.plan_mastery,pm.studied_topics,pm.completed_topics,
              rt.priority*2 + rt.difficulty*4
                + CASE WHEN tp.status='NEEDS_REVIEW' THEN 30
                       WHEN tp.status='COMPLETED' AND tp.mastery<rt.minimum_accuracy THEN 20 ELSE 0 END
                + CASE WHEN sp.exam_date-CURRENT_DATE<=14 THEN 25 ELSE 5 END - tp.mastery*.35 AS score,
              CASE WHEN tp.status='NEEDS_REVIEW' THEN 'Reforço priorizado por desempenho abaixo da meta'
                   WHEN tp.status='COMPLETED' AND tp.mastery<rt.minimum_accuracy THEN 'Revisão sugerida porque o domínio deste assunto está abaixo da meta'
                   WHEN tp.attempts=0 THEN 'Próximo assunto recomendado pela sua rota de estudos'
                   WHEN tp.mastery<50 THEN 'Assunto estudado com domínio ainda baixo'
                   ELSE 'Melhor equilíbrio entre peso, urgência da prova e domínio atual' END reason
            FROM roadmap_topics rt JOIN topic_progress tp ON tp.roadmap_topic_id=rt.id AND tp.user_id=:u
            JOIN study_plans sp ON sp.id=rt.plan_id
            CROSS JOIN plan_metrics pm
            WHERE rt.plan_id=:p AND rt.active AND (
              tp.status IN('AVAILABLE','IN_PROGRESS','NEEDS_REVIEW') OR
              (tp.status='COMPLETED' AND tp.attempts>0 AND tp.mastery<rt.minimum_accuracy)
            )
            ORDER BY CASE WHEN tp.status='NEEDS_REVIEW' THEN 0
                          WHEN tp.status='COMPLETED' AND tp.mastery<rt.minimum_accuracy THEN 1 ELSE 2 END,
              score DESC,rt.position LIMIT 1
            """).param("u",currentUser.id()).param("p",planId).query().listOfRows();
        return rows.isEmpty()?Map.of():rows.getFirst();
    }
    public Map<String,Object> next() { return next((UUID)activePlan().get("id")); }

    @Transactional
    public Map<String,Object> skipOptionalQuestions(UUID taskId) {
        LocalDate date=bootstrap.userToday(currentUser.id());
        var rows=jdbc.sql("""
            SELECT dt.* FROM daily_tasks dt JOIN study_plans sp ON sp.id=dt.plan_id
            WHERE dt.id=:id AND dt.user_id=:u AND sp.user_id=:u AND dt.task_date=:date
            FOR UPDATE
            """).param("id",taskId).param("u",currentUser.id()).param("date",date).query().listOfRows();
        if(rows.isEmpty())throw new NoSuchElementException("Bloco de questões não encontrado");
        var task=rows.getFirst();
        if(!"QUESTIONS".equals(task.get("activity_type"))||!Boolean.TRUE.equals(task.get("is_optional")))
            throw new IllegalStateException("A revisão semanal obrigatória não pode ser dispensada.");
        if("COMPLETED".equals(task.get("status")))throw new IllegalStateException("Este treino já foi concluído.");
        int activeSessions=jdbc.sql("SELECT COUNT(*) FROM study_sessions WHERE daily_task_id=:id AND status IN('RUNNING','PAUSED')")
                .param("id",taskId).query(Integer.class).single();
        if(activeSessions>0)throw new IllegalStateException("Finalize o treino de questões em andamento antes de dispensá-lo.");
        jdbc.sql("""
            UPDATE daily_tasks SET status='SKIPPED',completed_minutes=0,updated_at=now()
            WHERE id=:id AND status NOT IN('COMPLETED','SKIPPED')
            """).param("id",taskId).update();
        if("AVAILABLE".equals(task.get("status")))jdbc.sql("""
                UPDATE daily_tasks SET status='AVAILABLE',updated_at=now() WHERE id=(
                  SELECT id FROM daily_tasks WHERE user_id=:u AND plan_id=:p AND task_date=:date AND status='PENDING'
                  ORDER BY position LIMIT 1)
                """).param("u",currentUser.id()).param("p",task.get("plan_id")).param("date",date).update();
        return today();
    }

    public List<Map<String,Object>> roadmap(UUID planId) {
        assertPlan(planId);
        return jdbc.sql("""
            SELECT rm.id module_id,rm.name module_name,rm.position module_position,rt.id topic_id,rt.title,
              rt.position,rt.planned_minutes,rt.recommended_questions,rt.minimum_accuracy,rt.difficulty,
              rt.prerequisite_id,tp.status,tp.mastery,tp.studied_seconds,tp.questions_answered,tp.correct_answers
            FROM roadmap_modules rm JOIN roadmap_topics rt ON rt.module_id=rm.id AND rt.active
            JOIN topic_progress tp ON tp.roadmap_topic_id=rt.id AND tp.user_id=:u
            WHERE rm.plan_id=:p ORDER BY rt.position,md5(rt.id::text||CAST(:p AS text))
            """).param("u",currentUser.id()).param("p",planId).query().listOfRows();
    }

    public List<Map<String,Object>> reviews(LocalDate date, int limit) {
        return jdbc.sql("""
            SELECT r.*,rt.title topic_title,rt.subject_name FROM reviews r JOIN roadmap_topics rt ON rt.id=r.roadmap_topic_id
            WHERE r.user_id=:u AND r.scheduled_date<=:date AND r.status IN('AVAILABLE','OVERDUE')
            ORDER BY r.scheduled_date LIMIT :limit
            """).param("u",currentUser.id()).param("date",date).param("limit",limit).query().listOfRows();
    }

    private List<Map<String,Object>> dashboardReviews(int limit) {
        return jdbc.sql("""
            SELECT r.*,rt.title topic_title,rt.subject_name FROM reviews r JOIN roadmap_topics rt ON rt.id=r.roadmap_topic_id
            WHERE r.user_id=:u AND r.status IN('SCHEDULED','AVAILABLE','OVERDUE')
            ORDER BY CASE WHEN r.status='OVERDUE' THEN 0 WHEN r.status='AVAILABLE' THEN 1 ELSE 2 END,
              r.scheduled_date,r.created_at LIMIT :limit
            """).param("u",currentUser.id()).param("limit",limit).query().listOfRows();
    }

    @Transactional
    public Map<String,Object> completeReview(UUID id, int questions, int correct) {
        if(questions<1||correct<0||correct>questions) throw new IllegalArgumentException("Resultado de revisão inválido");
        var rows=jdbc.sql("SELECT * FROM reviews WHERE id=:id AND user_id=:u FOR UPDATE").param("id",id).param("u",currentUser.id()).query().listOfRows();
        if(rows.isEmpty()) throw new NoSuchElementException("Revisão não encontrada");
        var review=rows.getFirst(); if("COMPLETED".equals(review.get("status"))) return review;
        double accuracy=correct*100d/questions; int next=LearningRules.reviewIntervals(accuracy)[1];
        jdbc.sql("UPDATE reviews SET status='COMPLETED',completed_at=now(),previous_accuracy=:a,next_interval_days=:next WHERE id=:id")
                .param("a",accuracy).param("next",next).param("id",id).update();
        jdbc.sql("""
            INSERT INTO reviews(id,user_id,roadmap_topic_id,scheduled_date,status,previous_accuracy,difficulty,question_goal,next_interval_days,reason)
            VALUES(gen_random_uuid(),:u,:t,:date,'SCHEDULED',:accuracy,:difficulty,5,:next,'Intervalo adaptado após a revisão')
            ON CONFLICT(user_id,roadmap_topic_id,scheduled_date) DO NOTHING
            """).param("u",currentUser.id()).param("t",review.get("roadmap_topic_id"))
                .param("date",bootstrap.userToday(currentUser.id()).plusDays(next)).param("accuracy",accuracy)
                .param("difficulty",accuracy<70?4:3).param("next",next).update();
        engagement.award(currentUser.id(),15,"REVIEW_COMPLETED","REVIEW",id,"review:"+id);
        return jdbc.sql("SELECT * FROM reviews WHERE id=:id").param("id",id).query().singleRow();
    }

    private Map<String,Object> activePlan() {
        var rows=jdbc.sql("""
            SELECT sp.*,COALESCE((sp.settings->>'hoursPerDay')::int,2)*60 daily_goal_minutes,
              sp.settings::text settings_json FROM study_plans sp
            WHERE user_id=:u AND is_primary AND status='ACTIVE' LIMIT 1
            """).param("u",currentUser.id()).query().listOfRows();
        if(rows.isEmpty()) throw new NoSuchElementException("Nenhum plano principal ativo"); return rows.getFirst();
    }

    private void ensureRoadmap(Map<String,Object> plan,int goal) {
        UUID planId=(UUID)plan.get("id");
        int count=jdbc.sql("SELECT COUNT(*) FROM roadmap_topics WHERE plan_id=:p AND active").param("p",planId).query(Integer.class).single();
        if(count>0)return;
        try {
            var root=json.readTree(String.valueOf(plan.get("settings_json")));
            bootstrap.synchronize(planId,currentUser.id(),root.path("studySections"),number(plan,"block_minutes"),Math.max(1,goal/60));
        } catch(Exception e){throw new IllegalStateException("Não foi possível preparar o roadmap deste plano",e);}
    }

    private void refreshReviews(LocalDate today) {
        jdbc.sql("UPDATE reviews SET status=CASE WHEN scheduled_date<:today THEN 'OVERDUE' ELSE 'AVAILABLE' END WHERE user_id=:u AND scheduled_date<=:today AND status='SCHEDULED'")
                .param("today",today).param("u",currentUser.id()).update();
    }
    private void assertPlan(UUID id){if(jdbc.sql("SELECT COUNT(*) FROM study_plans WHERE id=:p AND user_id=:u").param("p",id).param("u",currentUser.id()).query(Integer.class).single()==0)throw new NoSuchElementException("Plano não encontrado");}
    private LocalDate localDate(Object value){
        if(value instanceof LocalDate date)return date;
        if(value instanceof java.sql.Date date)return date.toLocalDate();
        return LocalDate.parse(String.valueOf(value));
    }
    private int number(Map<String,Object> row,String key){Object v=row.get(key);return v instanceof Number n?n.intValue():0;}
}
