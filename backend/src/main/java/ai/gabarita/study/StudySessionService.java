package ai.gabarita.study;

import com.fasterxml.jackson.databind.JsonNode;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.sql.Timestamp;
import java.util.*;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StudySessionService {
    private static final Duration PAUSE_AUTO_CLOSE_AFTER = Duration.ofMinutes(12);
    private final JdbcClient jdbc;
    private final EngagementService engagement;
    private final StudyBootstrapService bootstrap;

    public StudySessionService(JdbcClient jdbc, EngagementService engagement, StudyBootstrapService bootstrap) {
        this.jdbc = jdbc; this.engagement = engagement; this.bootstrap = bootstrap;
    }

    @Transactional
    public Map<String,Object> start(UUID userId, UUID taskId, String mode, JsonNode pomodoro, String device) {
        var task = ownedTask(userId, taskId);
        if ("COMPLETED".equals(task.get("status"))) throw new IllegalStateException("Esta tarefa já foi concluída.");
        var active = active(userId);
        if (active != null) {
            if (taskId.equals(active.get("daily_task_id"))) return active;
            throw new IllegalStateException("Já existe um timer ativo. Pause ou finalize a sessão atual.");
        }
        UUID sessionId = UUID.randomUUID();
        jdbc.sql("""
            INSERT INTO study_sessions(id,user_id,plan_id,daily_task_id,roadmap_topic_id,started_at,active_since,
              status,mode,pomodoro,device)
            VALUES(:id,:u,:p,:task,:topic,now(),now(),'RUNNING',:mode,CAST(:pomodoro AS jsonb),:device)
            """).param("id", sessionId).param("u", userId).param("p", task.get("plan_id"))
                .param("task", taskId).param("topic", task.get("roadmap_topic_id"))
                .param("mode", "POMODORO".equalsIgnoreCase(mode) ? "POMODORO" : "FREE")
                .param("pomodoro", pomodoro == null ? "{}" : pomodoro.toString()).param("device", device).update();
        jdbc.sql("UPDATE daily_tasks SET status='IN_PROGRESS',updated_at=now() WHERE id=:id AND status IN('PENDING','AVAILABLE')")
                .param("id", taskId).update();
        jdbc.sql("UPDATE topic_progress SET status='IN_PROGRESS',started_at=COALESCE(started_at,now()),updated_at=now() WHERE user_id=:u AND roadmap_topic_id=:t AND status='AVAILABLE'")
                .param("u", userId).param("t", task.get("roadmap_topic_id")).update();
        return one(userId, sessionId);
    }

    @Transactional
    public Map<String,Object> startReview(UUID userId, UUID topicId, String mode, JsonNode pomodoro, String device) {
        var topics = jdbc.sql("""
            SELECT rt.* FROM roadmap_topics rt JOIN study_plans sp ON sp.id=rt.plan_id
            JOIN topic_progress tp ON tp.roadmap_topic_id=rt.id AND tp.user_id=:u
            WHERE rt.id=:t AND sp.user_id=:u AND rt.active AND tp.status<>'LOCKED'
            """).param("u",userId).param("t",topicId).query().listOfRows();
        if(topics.isEmpty()) throw new NoSuchElementException("Assunto não encontrado ou ainda bloqueado");
        var topic=topics.getFirst();
        LocalDate date=bootstrap.userToday(userId);
        UUID taskId=jdbc.sql("""
            INSERT INTO daily_tasks(id,user_id,plan_id,roadmap_topic_id,task_date,position,activity_type,
              planned_minutes,question_goal,minimum_accuracy,priority,status)
            VALUES(gen_random_uuid(),:u,:p,:t,:date,
              (SELECT COALESCE(MAX(position),-1)+1 FROM daily_tasks WHERE user_id=:u AND plan_id=:p AND task_date=:date),
              'REVIEW',:minutes,:questions,:accuracy,:priority,'AVAILABLE')
            ON CONFLICT(user_id,plan_id,task_date,roadmap_topic_id,activity_type,cycle_index) DO UPDATE SET
              completed_minutes=0,questions_answered=0,correct_answers=0,achieved_accuracy=NULL,
              completed_at=NULL,status='AVAILABLE',updated_at=now()
            RETURNING id
            """).param("u",userId).param("p",topic.get("plan_id")).param("t",topicId).param("date",date)
                .param("minutes",topic.get("planned_minutes")).param("questions",topic.get("recommended_questions"))
                .param("accuracy",topic.get("minimum_accuracy")).param("priority",topic.get("priority")).query(UUID.class).single();
        return start(userId,taskId,mode,pomodoro,device);
    }

    @Transactional
    public Map<String,Object> startQuestionPractice(UUID userId, UUID planId, String requestedMode, int focusMinutes, String device,UUID dailyTaskId) {
        if(focusMinutes<5||focusMinutes>120) throw new IllegalArgumentException("O foco deve ter entre 5 e 120 minutos");
        boolean freeMode="FREE".equalsIgnoreCase(requestedMode);String mode=freeMode?"FREE":"POMODORO";
        int owned=jdbc.sql("SELECT COUNT(*) FROM study_plans WHERE id=:p AND user_id=:u AND status='ACTIVE'")
                .param("p",planId).param("u",userId).query(Integer.class).single();
        if(owned==0) throw new NoSuchElementException("Plano não encontrado");
        Map<String,Object> task=null;
        if(dailyTaskId!=null){
            task=ownedTask(userId,dailyTaskId);
            if(!planId.equals(task.get("plan_id"))||!"QUESTIONS".equals(task.get("activity_type")))
                throw new IllegalArgumentException("O bloco informado não é um treino de questões deste plano.");
            if(List.of("COMPLETED","SKIPPED").contains(String.valueOf(task.get("status"))))
                throw new IllegalStateException("Este bloco de questões já foi encerrado.");
            if(!bootstrap.userToday(userId).equals(localDate(task.get("task_date"))))
                throw new IllegalStateException("Este bloco de questões não pertence ao plano de hoje.");
        }
        var active=active(userId);
        if(active!=null){
            if("QUESTIONS".equals(active.get("session_kind"))&&(dailyTaskId==null||dailyTaskId.equals(active.get("daily_task_id")))) return active;
            if("QUESTIONS".equals(active.get("session_kind")))
                throw new IllegalStateException("Finalize o treino de questões atual antes de iniciar o bloco do cronograma.");
            throw new IllegalStateException("Finalize ou pause a sessão de estudo atual antes de iniciar questões.");
        }
        UUID id=UUID.randomUUID();
        int plannedMinutes=task==null?focusMinutes:number(task,"planned_minutes");
        int targetCycles=freeMode?1:task==null?1:Math.max(1,(int)Math.ceil(plannedMinutes/(focusMinutes+10d)));
        String config=freeMode?null:"{\"focusMinutes\":"+focusMinutes+",\"shortBreakMinutes\":10,\"longBreakMinutes\":10,\"cycles\":4,\"targetCycles\":"+targetCycles+"}";
        jdbc.sql("""
            INSERT INTO study_sessions(id,user_id,plan_id,daily_task_id,roadmap_topic_id,started_at,active_since,status,mode,pomodoro,device,session_kind,context_title)
            VALUES(:id,:u,:p,:task,:topic,now(),now(),'RUNNING',:mode,CAST(:config AS jsonb),:device,'QUESTIONS',:title)
            """).param("id",id).param("u",userId).param("p",planId)
                .param("task",dailyTaskId).param("topic",task==null?null:task.get("roadmap_topic_id"))
                .param("mode",mode).param("config",config).param("device",device)
                .param("title",task==null?"Banco completo de questões"
                        :!Boolean.TRUE.equals(task.get("outside_planned_hours"))?"Questões de fechamento"
                        :Boolean.TRUE.equals(task.get("is_optional"))?"Questões extras do dia":"Revisão semanal com questões").update();
        if(dailyTaskId!=null)jdbc.sql("UPDATE daily_tasks SET status='IN_PROGRESS',updated_at=now() WHERE id=:id AND status IN('PENDING','AVAILABLE')")
                .param("id",dailyTaskId).update();
        return one(userId,id);
    }

    @Transactional
    public Map<String,Object> recordQuestion(UUID userId,UUID sessionId,String questionId,boolean correct){
        var session=one(userId,sessionId);
        if(!"QUESTIONS".equals(session.get("session_kind"))||!"RUNNING".equals(session.get("status")))
            throw new IllegalStateException("Continue a sessão antes de contabilizar esta questão.");
        jdbc.sql("SELECT id FROM study_sessions WHERE id=:s FOR UPDATE").param("s",sessionId).query(UUID.class).single();
        jdbc.sql("""
            INSERT INTO question_session_answers(session_id,question_id,correct) VALUES(:s,:q,:correct)
            ON CONFLICT(session_id,question_id) DO UPDATE SET correct=:correct,answered_at=now()
            """).param("s",sessionId).param("q",questionId).param("correct",correct).update();
        jdbc.sql("""
            UPDATE study_sessions SET questions_answered=(SELECT COUNT(*) FROM question_session_answers WHERE session_id=:s),
              correct_answers=(SELECT COUNT(*) FROM question_session_answers WHERE session_id=:s AND correct),version=version+1
            WHERE id=:s
            """).param("s",sessionId).update();
        engagement.recordQuestionActivity(userId, (UUID) session.get("plan_id"));
        return one(userId,sessionId);
    }

    @Transactional
    public Map<String,Object> finishQuestionPractice(UUID userId,UUID id,String notes){
        var owned=jdbc.sql("SELECT id FROM study_sessions WHERE id=:id AND user_id=:u FOR UPDATE")
                .param("id",id).param("u",userId).query(UUID.class).list();
        if(owned.isEmpty())throw new NoSuchElementException("Sessão não encontrada");
        var session=one(userId,id);
        if(!"QUESTIONS".equals(session.get("session_kind"))) throw new IllegalStateException("Esta não é uma sessão de questões.");
        if("COMPLETED".equals(session.get("status"))) return completion(session,List.of("Sessão de questões já finalizada."));
        if(!List.of("RUNNING","PAUSED").contains(session.get("status"))) throw new IllegalStateException("Esta sessão não pode ser finalizada.");
        if("RUNNING".equals(session.get("status"))) jdbc.sql("UPDATE study_sessions SET effective_seconds=effective_seconds+GREATEST(0,EXTRACT(EPOCH FROM(now()-COALESCE(active_since,now())))::int) WHERE id=:id").param("id",id).update();
        else {
            jdbc.sql("UPDATE session_pauses SET ended_at=now() WHERE session_id=:s AND ended_at IS NULL").param("s",id).update();
            jdbc.sql("UPDATE study_sessions SET paused_seconds=paused_seconds+GREATEST(0,EXTRACT(EPOCH FROM(now()-COALESCE(paused_at,now())))::int) WHERE id=:id").param("id",id).update();
        }
        jdbc.sql("UPDATE study_sessions SET status='COMPLETED',ended_at=now(),duration_seconds=effective_seconds,active_since=NULL,paused_at=NULL,notes=:notes,version=version+1 WHERE id=:id")
                .param("notes",notes).param("id",id).update();
        session=one(userId,id);
        int answered=number(session,"questions_answered");
        if(session.get("daily_task_id") instanceof UUID taskId){
            var task=ownedTask(userId,taskId);
            int correct=number(session,"correct_answers");
            int minutes=Math.max(1,number(session,"effective_seconds")/60);
            Double accuracy=answered==0?null:correct*100d/answered;
            jdbc.sql("""
                UPDATE daily_tasks SET completed_minutes=:minutes,questions_answered=:answered,correct_answers=:correct,
                  achieved_accuracy=:accuracy,status='COMPLETED',completed_at=now(),updated_at=now() WHERE id=:id
                """).param("minutes",minutes).param("answered",answered).param("correct",correct)
                    .param("accuracy",accuracy).param("id",taskId).update();
            releaseNextTask(userId,(UUID)task.get("plan_id"),localDate(task.get("task_date")));
        }
        engagement.award(userId,10+Math.min(30,answered),"QUESTION_PRACTICE","STUDY_SESSION",id,"question-practice:"+id);
        engagement.refreshDay(userId,(UUID)session.get("plan_id"));
        return completion(session,List.of(answered+" questões registradas em "+Math.max(1,number(session,"effective_seconds")/60)+" minutos."));
    }

    @Transactional
    public Map<String,Object> pause(UUID userId, UUID id, String reason) {
        var session = one(userId, id);
        if ("PAUSED".equals(session.get("status"))) return session;
        requireStatus(session, "RUNNING");
        boolean focusCompleted="POMODORO_FOCUS_COMPLETE".equals(reason);
        jdbc.sql("""
            UPDATE study_sessions SET effective_seconds=effective_seconds+EXTRACT(EPOCH FROM(now()-active_since))::int,
              status='PAUSED',paused_at=now(),active_since=NULL,pomodoro_cycle=pomodoro_cycle+:cycle,version=version+1 WHERE id=:id
            """).param("cycle",focusCompleted?1:0).param("id", id).update();
        jdbc.sql("INSERT INTO session_pauses(id,session_id,started_at,reason) VALUES(gen_random_uuid(),:s,now(),:reason)")
                .param("s", id).param("reason", reason).update();
        if(focusCompleted) engagement.createNotification(userId,(UUID)session.get("plan_id"),"FOCUS_COMPLETED",
                "Ciclo de foco concluído","Hora de fazer uma pausa sem contar tempo de estudo.","NORMAL");
        return one(userId, id);
    }

    @Transactional
    public Map<String,Object> resume(UUID userId, UUID id) {
        var session = one(userId, id);
        if ("RUNNING".equals(session.get("status"))) return session;
        requireStatus(session, "PAUSED");
        if (pauseExceeded(session, PAUSE_AUTO_CLOSE_AFTER)) {
            return closeExpiredPause(userId, session);
        }
        jdbc.sql("""
            UPDATE session_pauses SET ended_at=now() WHERE id=(SELECT id FROM session_pauses WHERE session_id=:s AND ended_at IS NULL ORDER BY started_at DESC LIMIT 1)
            """).param("s", id).update();
        jdbc.sql("""
            UPDATE study_sessions SET paused_seconds=paused_seconds+EXTRACT(EPOCH FROM(now()-paused_at))::int,
              status='RUNNING',active_since=now(),paused_at=NULL,version=version+1 WHERE id=:id
            """).param("id", id).update();
        return one(userId, id);
    }

    @Transactional
    public Map<String,Object> finish(UUID userId, UUID id, int questionsAnswered, int correctAnswers, String notes) {
        var session = one(userId, id);
        if ("COMPLETED".equals(session.get("status"))) return completion(session, List.of());
        if (!List.of("RUNNING", "PAUSED").contains(session.get("status")))
            throw new IllegalStateException("Esta sessão não pode mais ser finalizada.");
        if (questionsAnswered < 0 || correctAnswers < 0 || correctAnswers > questionsAnswered)
            throw new IllegalArgumentException("O resultado das questões é inválido");

        if ("RUNNING".equals(session.get("status"))) {
            jdbc.sql("UPDATE study_sessions SET effective_seconds=effective_seconds+EXTRACT(EPOCH FROM(now()-active_since))::int WHERE id=:id")
                    .param("id", id).update();
        } else {
            jdbc.sql("UPDATE session_pauses SET ended_at=now() WHERE session_id=:s AND ended_at IS NULL").param("s", id).update();
            jdbc.sql("UPDATE study_sessions SET paused_seconds=paused_seconds+EXTRACT(EPOCH FROM(now()-paused_at))::int WHERE id=:id")
                    .param("id",id).update();
        }
        jdbc.sql("""
            UPDATE study_sessions SET status='COMPLETED',ended_at=now(),duration_seconds=effective_seconds,
              active_since=NULL,paused_at=NULL,notes=:notes,questions_answered=:questions,
              correct_answers=:correct,version=version+1 WHERE id=:id
            """).param("notes", notes).param("questions",questionsAnswered).param("correct",correctAnswers).param("id", id).update();
        session = one(userId, id);
        int effective = number(session, "effective_seconds");
        var task = ownedTask(userId, (UUID) session.get("daily_task_id"));
        int totalQuestions = number(task, "questions_answered") + questionsAnswered;
        int totalCorrect = number(task, "correct_answers") + correctAnswers;
        int totalMinutes = number(task, "completed_minutes") + Math.max(1, effective / 60);
        double accuracy = totalQuestions == 0 ? 0 : totalCorrect * 100d / totalQuestions;
        boolean criteriaMet = LearningRules.taskCompleted(totalMinutes * 60, number(task,"planned_minutes"),
                totalQuestions, number(task,"question_goal"));
        jdbc.sql("""
            UPDATE daily_tasks SET completed_minutes=:minutes,questions_answered=:questions,correct_answers=:correct,
              achieved_accuracy=:accuracy,status='COMPLETED',completed_at=now(),updated_at=now()
            WHERE id=:id
            """).param("minutes", totalMinutes).param("questions", totalQuestions).param("correct", totalCorrect)
                .param("accuracy", totalQuestions == 0 ? null : accuracy).param("id", task.get("id")).update();

        UUID topicId = (UUID) task.get("roadmap_topic_id");
        var previous = jdbc.sql("SELECT * FROM topic_progress WHERE user_id=:u AND roadmap_topic_id=:t FOR UPDATE")
                .param("u", userId).param("t", topicId).query().singleRow();
        int attempts = number(previous,"attempts") + (questionsAnswered > 0 ? 1 : 0);
        int historicalQuestions = number(previous,"questions_answered") + questionsAnswered;
        int historicalCorrect = number(previous,"correct_answers") + correctAnswers;
        double historicalAccuracy = historicalQuestions == 0 ? 0 : historicalCorrect * 100d / historicalQuestions;
        long daysSince = previous.get("last_studied_at") == null ? 0 : ChronoUnit.DAYS.between(
                instant(previous.get("last_studied_at")), Instant.now());
        double mastery = LearningRules.mastery(questionsAnswered == 0 ? historicalAccuracy : accuracy,
                historicalAccuracy, attempts, number(task,"difficulty"), daysSince);
        boolean lowPerformance = questionsAnswered > 0 && accuracy < decimal(task,"minimum_accuracy");
        String progressStatus = "COMPLETED";
        jdbc.sql("""
            UPDATE topic_progress SET status=:status,studied_seconds=studied_seconds+:seconds,
              questions_answered=:questions,correct_answers=:correct,mastery=:mastery,attempts=:attempts,
              last_studied_at=now(),completed_at=COALESCE(completed_at,now()),updated_at=now()
            WHERE user_id=:u AND roadmap_topic_id=:t
            """).param("status", progressStatus).param("seconds", effective).param("questions", historicalQuestions)
                .param("correct", historicalCorrect).param("mastery", mastery).param("attempts", attempts)
                .param("u", userId).param("t", topicId).update();

        var feedback = new ArrayList<String>();
        scheduleReviews(userId, topicId, accuracy, lowPerformance || !criteriaMet);
        boolean review="REVIEW".equals(task.get("activity_type"));
        if(!review){
            unlockNext(userId, topicId);
            releaseNextTask(userId,(UUID)task.get("plan_id"),localDate(task.get("task_date")));
        }
        engagement.award(userId, 20, "SESSION_COMPLETED", "STUDY_SESSION", id, "session:" + id);
        engagement.award(userId, 15, "TASK_COMPLETED", "DAILY_TASK", (UUID) task.get("id"), "task:" + task.get("id"));
        feedback.add(review?"Revisão concluída e desempenho atualizado.":"Etapa concluída. A próxima atividade da rota do dia já está disponível.");
        if(!criteriaMet) feedback.add("Uma revisão foi recomendada porque esta tentativa ficou abaixo da meta combinada de tempo e questões.");
        if (questionsAnswered > 0)
            engagement.award(userId, Math.min(30, questionsAnswered), "QUESTIONS_ANSWERED", "STUDY_SESSION", id, "questions:" + id);
        if (lowPerformance) {
            String reason = String.format(Locale.forLanguageTag("pt-BR"),
                    "Reforço adicionado porque seu aproveitamento foi de %.0f%% nesta tentativa.", accuracy);
            jdbc.sql("""
                INSERT INTO adaptive_recommendations(id,user_id,roadmap_topic_id,recommendation_type,mastery_before,mastery_after,reason)
                VALUES(gen_random_uuid(),:u,:t,'REINFORCEMENT',:before,:after,:reason)
                """).param("u", userId).param("t", topicId).param("before", previous.get("mastery"))
                    .param("after", mastery).param("reason", reason).update();
            feedback.add(reason);
        }
        if (questionsAnswered > 0) engagement.recordQuestionActivity(userId, (UUID) task.get("plan_id"));
        else engagement.refreshDay(userId, (UUID) task.get("plan_id"));
        return completion(one(userId,id), feedback);
    }

    @Transactional
    public Map<String,Object> cancel(UUID userId, UUID id, String notes) {
        var session = one(userId, id);
        if (List.of("COMPLETED","CANCELLED").contains(session.get("status"))) return session;
        jdbc.sql("""
            UPDATE study_sessions SET effective_seconds=effective_seconds+
              CASE WHEN status='RUNNING' THEN EXTRACT(EPOCH FROM(now()-active_since))::int ELSE 0 END,
              paused_seconds=paused_seconds+CASE WHEN status='PAUSED' THEN EXTRACT(EPOCH FROM(now()-paused_at))::int ELSE 0 END,
              status='CANCELLED',ended_at=now(),active_since=NULL,paused_at=NULL,notes=:notes WHERE id=:id
            """)
                .param("notes",notes).param("id",id).update();
        return one(userId,id);
    }

    @Transactional
    public int cancelForInactivity(UUID userId) {
        var sessions = jdbc.sql("SELECT id FROM study_sessions WHERE user_id=:u AND status IN('RUNNING','PAUSED') FOR UPDATE")
                .param("u", userId).query(UUID.class).list();
        for (UUID id : sessions) cancel(userId, id, "Sessão encerrada após 12 horas de inatividade.");
        return sessions.size();
    }

    @Transactional
    public Map<String,Object> activeOrEmpty(UUID userId) {
        var active = active(userId);
        if (active != null && "PAUSED".equals(active.get("status")) && pauseExceeded(active, PAUSE_AUTO_CLOSE_AFTER)) {
            closeExpiredPause(userId, active);
            return Map.of();
        }
        return active == null ? Map.of() : active;
    }

    private Map<String,Object> closeExpiredPause(UUID userId, Map<String,Object> session) {
        UUID id = (UUID) session.get("id");
        String notes = "Sessão encerrada automaticamente após 12 minutos em pausa.";
        if ("QUESTIONS".equals(session.get("session_kind"))) {
            finishQuestionPractice(userId, id, notes);
        } else {
            cancel(userId, id, notes);
        }
        return one(userId, id);
    }

    private boolean pauseExceeded(Map<String,Object> session, Duration limit) {
        if (session.get("paused_at") == null) return false;
        return !Duration.between(instant(session.get("paused_at")), Instant.now()).minus(limit).isNegative();
    }

    public Map<String,Object> one(UUID userId, UUID id) {
        var row = jdbc.sql("""
            SELECT ss.*,ss.pomodoro::text pomodoro_config,(SELECT reason FROM session_pauses WHERE session_id=ss.id ORDER BY started_at DESC LIMIT 1) pause_reason,
              dt.planned_minutes,dt.completed_minutes,dt.question_goal,dt.questions_answered,
              rt.title topic_title,rt.subject_name,
              ss.effective_seconds+CASE WHEN ss.status='RUNNING' THEN EXTRACT(EPOCH FROM(now()-ss.active_since))::int ELSE 0 END elapsed_seconds
            FROM study_sessions ss LEFT JOIN daily_tasks dt ON dt.id=ss.daily_task_id
            LEFT JOIN roadmap_topics rt ON rt.id=ss.roadmap_topic_id
            WHERE ss.id=:id AND ss.user_id=:u
            """).param("id", id).param("u", userId).query().listOfRows();
        if (row.isEmpty()) throw new NoSuchElementException("Sessão não encontrada");
        return row.getFirst();
    }

    private Map<String,Object> active(UUID userId) {
        var rows = jdbc.sql("""
            SELECT ss.*,ss.pomodoro::text pomodoro_config,(SELECT reason FROM session_pauses WHERE session_id=ss.id ORDER BY started_at DESC LIMIT 1) pause_reason,
              dt.planned_minutes,dt.completed_minutes,dt.question_goal,dt.questions_answered,
              rt.title topic_title,rt.subject_name,
              ss.effective_seconds+CASE WHEN ss.status='RUNNING' THEN EXTRACT(EPOCH FROM(now()-ss.active_since))::int ELSE 0 END elapsed_seconds
            FROM study_sessions ss LEFT JOIN daily_tasks dt ON dt.id=ss.daily_task_id
            LEFT JOIN roadmap_topics rt ON rt.id=ss.roadmap_topic_id
            WHERE ss.user_id=:u AND ss.status IN('RUNNING','PAUSED') LIMIT 1
            """).param("u", userId).query().listOfRows();
        return rows.isEmpty() ? null : rows.getFirst();
    }

    private Map<String,Object> ownedTask(UUID userId, UUID taskId) {
        var rows = jdbc.sql("""
            SELECT dt.*,rt.difficulty,rt.title,rt.subject_name FROM daily_tasks dt
            JOIN roadmap_topics rt ON rt.id=dt.roadmap_topic_id WHERE dt.id=:id AND dt.user_id=:u
            """).param("id", taskId).param("u", userId).query().listOfRows();
        if (rows.isEmpty()) throw new NoSuchElementException("Tarefa não encontrada");
        return rows.getFirst();
    }

    private void unlockNext(UUID userId, UUID topicId) {
        jdbc.sql("""
            UPDATE topic_progress SET status='AVAILABLE',updated_at=now()
            WHERE user_id=:u AND status='LOCKED' AND roadmap_topic_id IN
              (SELECT id FROM roadmap_topics WHERE prerequisite_id=:topic)
            """).param("u",userId).param("topic",topicId).update();
    }

    private void releaseNextTask(UUID userId, UUID planId, LocalDate date) {
        jdbc.sql("""
            UPDATE daily_tasks SET status='PENDING',updated_at=now()
            WHERE user_id=:u AND plan_id=:p AND task_date=:date AND status='AVAILABLE'
            """).param("u",userId).param("p",planId).param("date",date).update();
        jdbc.sql("""
            UPDATE daily_tasks SET status='AVAILABLE',updated_at=now() WHERE id=(
              SELECT id FROM daily_tasks WHERE user_id=:u AND plan_id=:p AND task_date=:date AND status='PENDING'
              ORDER BY position LIMIT 1)
            """).param("u",userId).param("p",planId).param("date",date).update();
    }

    private void scheduleReviews(UUID userId, UUID topicId, double accuracy, boolean lowPerformance) {
        int[] intervals = LearningRules.reviewIntervals(accuracy);
        LocalDate today = bootstrap.userToday(userId);
        for (int interval : intervals) jdbc.sql("""
            INSERT INTO reviews(id,user_id,roadmap_topic_id,scheduled_date,status,previous_accuracy,difficulty,
              question_goal,next_interval_days,reason)
            VALUES(gen_random_uuid(),:u,:t,:date,'SCHEDULED',:accuracy,:difficulty,:questions,:interval,:reason)
            ON CONFLICT(user_id,roadmap_topic_id,scheduled_date) DO NOTHING
            """).param("u",userId).param("t",topicId).param("date",today.plusDays(interval)).param("accuracy",accuracy)
                .param("difficulty",lowPerformance?4:3).param("questions",lowPerformance?10:5).param("interval",interval)
                .param("reason",lowPerformance?"Intervalo reduzido devido ao desempenho abaixo da meta":"Revisão espaçada para consolidar o domínio").update();
    }

    private Map<String,Object> completion(Map<String,Object> session, List<String> feedback) {
        var result = new LinkedHashMap<String,Object>(); result.put("session",session); result.put("feedback",feedback);
        result.put("experience",engagement.experience((UUID)session.get("user_id")));
        return result;
    }

    private void requireStatus(Map<String,Object> row, String status) {
        if (!status.equals(row.get("status"))) throw new IllegalStateException("Operação inválida para o estado atual da sessão.");
    }
    private int number(Map<String,Object> row,String key){Object v=row.get(key);return v instanceof Number n?n.intValue():0;}
    private double decimal(Map<String,Object> row,String key){Object v=row.get(key);return v instanceof Number n?n.doubleValue():0;}
    private Instant instant(Object value){
        if(value instanceof OffsetDateTime o)return o.toInstant();
        if(value instanceof ZonedDateTime z)return z.toInstant();
        if(value instanceof Instant i)return i;
        if(value instanceof Timestamp t)return t.toInstant();
        if(value instanceof LocalDateTime l)return l.atZone(ZoneId.systemDefault()).toInstant();
        throw new IllegalArgumentException("Data inválida");
    }
    private LocalDate localDate(Object value){
        if(value instanceof LocalDate d)return d;
        if(value instanceof java.sql.Date d)return d.toLocalDate();
        return LocalDate.parse(String.valueOf(value));
    }
}
