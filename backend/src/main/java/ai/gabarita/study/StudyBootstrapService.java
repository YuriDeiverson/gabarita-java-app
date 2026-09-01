package ai.gabarita.study;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.*;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StudyBootstrapService {
    private static final Pattern CONSTRAINT_PATTERN = Pattern.compile("constraint \\\"([a-zA-Z0-9_]+)\\\"");
    private final JdbcClient jdbc;
    private final ObjectMapper json;
    private final AdaptivePlanningService planner;

    public StudyBootstrapService(JdbcClient jdbc,ObjectMapper json,AdaptivePlanningService planner) {
        this.jdbc = jdbc;this.json=json;this.planner=planner;
    }

    @Transactional
    public void synchronize(UUID planId, UUID userId, JsonNode sections, int blockMinutes, Integer hoursPerDay) {
        String stage = "preparar o perfil de estudo";
        try {
            jdbc.sql("INSERT INTO study_streaks(user_id) VALUES(:u) ON CONFLICT(user_id) DO NOTHING")
                    .param("u", userId).update();
            jdbc.sql("INSERT INTO user_notification_preferences(user_id) VALUES(:u) ON CONFLICT(user_id) DO NOTHING")
                    .param("u", userId).update();
            if (sections == null || !sections.isArray() || sections.isEmpty()) return;

            stage = "montar o roteiro de matérias";
            jdbc.sql("UPDATE roadmap_topics SET active=false WHERE plan_id=:p").param("p", planId).update();
            int modulePosition = 0;
            for (JsonNode section : sections) {
                String subject = section.path("title").asText("Disciplina");
                UUID moduleId;
                try {
                    moduleId = upsertModule(planId, modulePosition, subject,
                            section.path("paretoJustification").asText(null));
                } catch (DataIntegrityViolationException ex) {
                    throw catalogConflict("a disciplina ‘" + subject + "’", ex);
                }
                UUID prerequisite = null;
                int topicPosition = 0;
                for (JsonNode card : section.path("cards")) {
                    String source = sourceKey(
                            section.path("id").asText("section-" + modulePosition),
                            card.path("id").asText("topic-" + topicPosition));
                    String topicTitle = card.path("title").asText("Assunto");
                    try {
                        UUID topicId = upsertTopic(planId, moduleId, source, section, card, topicPosition,
                                prerequisite, plannedMinutes(section, card, blockMinutes));
                        String initialStatus = prerequisite == null ? "AVAILABLE" : "LOCKED";
                        jdbc.sql("""
                            INSERT INTO topic_progress(id,user_id,roadmap_topic_id,status)
                            VALUES(gen_random_uuid(),:u,:t,:status)
                            ON CONFLICT(user_id,roadmap_topic_id) DO NOTHING
                            """).param("u", userId).param("t", topicId).param("status", initialStatus).update();
                        prerequisite = topicId;
                    } catch (DataIntegrityViolationException ex) {
                        throw catalogConflict("o assunto ‘" + topicTitle + "’ da disciplina ‘" + subject + "’", ex);
                    }
                    topicPosition++;
                }
                modulePosition++;
            }
            jdbc.sql("""
                UPDATE topic_progress tp SET status='AVAILABLE',updated_at=now()
                FROM roadmap_topics rt WHERE tp.roadmap_topic_id=rt.id AND tp.user_id=:u AND rt.plan_id=:p
                  AND rt.active AND rt.prerequisite_id IS NULL AND tp.status='LOCKED'
                """).param("u",userId).param("p",planId).update();
            jdbc.sql("""
                UPDATE topic_progress tp SET status='LOCKED',updated_at=now()
                FROM roadmap_topics rt
                WHERE tp.roadmap_topic_id=rt.id AND tp.user_id=:u AND rt.plan_id=:p AND rt.active
                  AND rt.prerequisite_id IS NOT NULL AND tp.status='AVAILABLE'
                  AND NOT EXISTS (
                    SELECT 1 FROM topic_progress prerequisite
                    WHERE prerequisite.user_id=:u AND prerequisite.roadmap_topic_id=rt.prerequisite_id
                      AND prerequisite.status IN('COMPLETED','MASTERED'))
                """).param("u", userId).param("p", planId).update();
            stage = "gerar as atividades iniciais";
            planner.initialize(planId,userId);
            stage = "criar a notificação inicial";
            createWelcomeNotification(planId, userId);
        } catch (DataIntegrityViolationException ex) {
            throw new IllegalStateException("Não foi possível preparar o plano ao " + stage + ".", ex);
        }
    }

    @Transactional
    public List<Map<String,Object>> ensureToday(UUID planId, UUID userId, int ignoredGoalMinutes) {
        LocalDate date = userToday(userId);
        planner.ensureWindow(planId,userId);
        removeUnstartedQuestionExtras(planId,userId,date);
        boolean reconciled=reconcileFixedSchedule(planId,userId,date);
        if(!planner.isStudyDay(planId,userId,date)) return tasks(userId,planId,date).stream()
                .filter(task->Boolean.TRUE.equals(task.get("is_optional"))&&Boolean.TRUE.equals(task.get("outside_planned_hours"))).toList();
        if(reconciled)createTasksFromSchedule(planId,userId,date);
        var existing = tasks(userId, planId, date);
        if (!existing.isEmpty()) {
            jdbc.sql("UPDATE daily_tasks SET status='PENDING',updated_at=now() WHERE user_id=:u AND plan_id=:p AND task_date=:date AND status='MOVED'")
                    .param("u",userId).param("p",planId).param("date",date).update();
            var activeTask=jdbc.sql("""
                SELECT daily_task_id FROM study_sessions WHERE user_id=:u AND plan_id=:p
                  AND status IN('RUNNING','PAUSED') AND daily_task_id IS NOT NULL LIMIT 1
                """).param("u",userId).param("p",planId).query(UUID.class).list();
            if(activeTask.isEmpty()){
                jdbc.sql("""
                    UPDATE daily_tasks SET status='PENDING',updated_at=now()
                    WHERE user_id=:u AND plan_id=:p AND task_date=:date AND status IN('AVAILABLE','IN_PROGRESS')
                    """).param("u",userId).param("p",planId).param("date",date).update();
                jdbc.sql("""
                    UPDATE daily_tasks SET status='AVAILABLE',updated_at=now() WHERE id=(SELECT id FROM daily_tasks
                      WHERE user_id=:u AND plan_id=:p AND task_date=:date AND status='PENDING' ORDER BY position LIMIT 1)
                    """).param("u",userId).param("p",planId).param("date",date).update();
            }else{
                jdbc.sql("""
                    UPDATE daily_tasks SET status=CASE WHEN id=:active THEN 'IN_PROGRESS' ELSE 'PENDING' END,updated_at=now()
                    WHERE user_id=:u AND plan_id=:p AND task_date=:date AND status IN('AVAILABLE','IN_PROGRESS')
                    """).param("active",activeTask.getFirst()).param("u",userId).param("p",planId).param("date",date).update();
            }
            return tasks(userId, planId, date);
        }

        if (createTasksFromSchedule(planId,userId,date)>0) return tasks(userId,planId,date);
        return List.of();
    }

    private boolean reconcileFixedSchedule(UUID planId,UUID userId,LocalDate date){
        int marked=jdbc.sql("""
            UPDATE study_plans SET settings=jsonb_set(settings,'{fixedScheduleReconciled}','true'::jsonb,true),updated_at=now()
            WHERE id=:p AND user_id=:u AND NOT COALESCE((settings->>'fixedScheduleReconciled')::boolean,false)
            """).param("p",planId).param("u",userId).update();
        if(marked==0)return false;
        jdbc.sql("""
            DELETE FROM daily_tasks dt
            WHERE dt.user_id=:u AND dt.plan_id=:p AND dt.task_date>=:date
              AND dt.status IN('PENDING','AVAILABLE','BLOCKED','MOVED')
              AND NOT (dt.is_optional AND dt.outside_planned_hours)
              AND NOT EXISTS (SELECT 1 FROM study_sessions ss WHERE ss.daily_task_id=dt.id)
            """).param("u",userId).param("p",planId).param("date",date).update();
        return true;
    }

    private void removeUnstartedQuestionExtras(UUID planId,UUID userId,LocalDate date){
        jdbc.sql("""
            DELETE FROM daily_tasks dt
            WHERE dt.user_id=:u AND dt.plan_id=:p AND dt.task_date>=:date
              AND dt.activity_type='QUESTIONS' AND dt.is_optional
              AND dt.status IN('PENDING','AVAILABLE','BLOCKED','MOVED')
              AND NOT EXISTS (SELECT 1 FROM study_sessions ss WHERE ss.daily_task_id=dt.id)
            """).param("u",userId).param("p",planId).param("date",date).update();
    }

    public LocalDate userToday(UUID userId) {
        String zone = jdbc.sql("SELECT timezone FROM users WHERE id=:u").param("u", userId)
                .query(String.class).optional().orElse("America/Maceio");
        return LocalDate.now(ZoneId.of(zone));
    }

    public List<Map<String,Object>> tasks(UUID userId, UUID planId, LocalDate date) {
        return jdbc.sql("""
            SELECT dt.*,rt.title topic_title,rt.subject_name,rt.objective,rt.description,
                   rt.content,rt.difficulty,tp.status topic_status,tp.mastery,
                   CASE WHEN dt.activity_type IN('REVIEW','REVISION') THEN 'Revisão priorizada pelo seu histórico de estudo.'
                        WHEN dt.activity_type='QUESTIONS' THEN 'Treino opcional fora da carga planejada; você escolhe o tempo no cronômetro de questões.'
                        WHEN tp.attempts>0 AND tp.mastery<rt.minimum_accuracy THEN 'Reforço porque seu domínio está abaixo da meta deste assunto.'
                        WHEN tp.attempts=0 THEN 'Próximo assunto da sua rota, equilibrado pelo peso no edital.'
                        ELSE 'Prioridade calculada por peso, proximidade da prova e domínio atual.' END planning_reason
            FROM daily_tasks dt JOIN roadmap_topics rt ON rt.id=dt.roadmap_topic_id
            JOIN topic_progress tp ON tp.roadmap_topic_id=rt.id AND tp.user_id=dt.user_id
            WHERE dt.user_id=:u AND dt.plan_id=:p AND dt.task_date=:date
              AND NOT (dt.activity_type='QUESTIONS' AND dt.is_optional)
            ORDER BY dt.position
            """).param("u", userId).param("p", planId).param("date", date).query().listOfRows();
    }

    private UUID upsertModule(UUID planId, int position, String name, String description) {
        return jdbc.sql("""
            INSERT INTO roadmap_modules(id,plan_id,name,description,position)
            VALUES(gen_random_uuid(),:p,:name,:description,:position)
            ON CONFLICT(plan_id,position) DO UPDATE SET name=:name,description=:description
            RETURNING id
            """).param("p", planId).param("name", name).param("description", description)
                .param("position", position).query(UUID.class).single();
    }

    private UUID upsertTopic(UUID planId, UUID moduleId, String source, JsonNode section, JsonNode card,
                             int position, UUID prerequisite, int blockMinutes) {
        ObjectNode contentNode = card.deepCopy();
        contentNode.put("learningTrack", section.path("learningTrack").asText(""));
        contentNode.put("learningOrder", section.path("learningOrder").asInt(Integer.MAX_VALUE));
        String content = contentNode.toString();
        String objective=card.path("studyObjective").asText("").trim();
        if(objective.isBlank())objective="Dominar os conceitos essenciais e aplicá-los com segurança em questões de prova.";
        return jdbc.sql("""
            INSERT INTO roadmap_topics(id,plan_id,module_id,source_key,subject_name,title,description,objective,
              content,position,prerequisite_id,planned_minutes,recommended_questions,minimum_accuracy,difficulty,priority,active)
            VALUES(gen_random_uuid(),:p,:m,:source,:subject,:title,:description,:objective,CAST(:content AS jsonb),
              :position,:prerequisite,:minutes,10,70,:difficulty,:priority,true)
            ON CONFLICT(plan_id,source_key) DO UPDATE SET module_id=:m,subject_name=:subject,title=:title,
              description=:description,objective=:objective,content=CAST(:content AS jsonb),position=:position,
              prerequisite_id=:prerequisite,planned_minutes=:minutes,difficulty=:difficulty,priority=:priority,active=true
            RETURNING id
            """).param("p", planId).param("m", moduleId).param("source", source)
                .param("subject", section.path("title").asText("Disciplina"))
                .param("title", card.path("title").asText("Assunto"))
                .param("description", section.path("paretoJustification").asText(null))
                .param("objective", objective)
                .param("content", content).param("position", position).param("prerequisite", prerequisite)
                .param("minutes", blockMinutes).param("difficulty", difficulty(section.path("difficulty").asText()))
                .param("priority", weight(section.path("weight").asText())).query(UUID.class).single();
    }

    private void createWelcomeNotification(UUID planId, UUID userId) {
        boolean exists = !jdbc.sql("SELECT id FROM notifications WHERE user_id=:u AND plan_id=:p AND type='PLAN_READY' LIMIT 1")
                .param("u", userId).param("p", planId).query(UUID.class).list().isEmpty();
        if (!exists) jdbc.sql("""
            INSERT INTO notifications(id,user_id,plan_id,type,title,message,scheduled_for,destination,priority,status)
            VALUES(gen_random_uuid(),:u,:p,'PLAN_READY','Seu plano diário está pronto',
              'Comece pela primeira atividade recomendada e mantenha sua ofensiva ativa.',now(),'/','HIGH','DELIVERED')
            """).param("u", userId).param("p", planId).update();
    }

    private IllegalStateException catalogConflict(String item, DataIntegrityViolationException cause) {
        String constraint = null;
        for (Throwable current = cause; current != null && constraint == null; current = current.getCause()) {
            Matcher matcher = CONSTRAINT_PATTERN.matcher(String.valueOf(current.getMessage()));
            if (matcher.find()) constraint = matcher.group(1);
        }
        String detail = constraint == null ? "" : " (restrição: " + constraint + ").";
        return new IllegalStateException("Não foi possível incluir " + item + " no roteiro" + detail, cause);
    }

    /** source_key is an internal identifier (not a title) and is limited to 180 characters in PostgreSQL. */
    private String sourceKey(String sectionId, String cardId) {
        String raw = sectionId + ":" + cardId;
        if (raw.length() <= 180) return raw;
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(raw.getBytes(StandardCharsets.UTF_8));
            StringBuilder hash = new StringBuilder(64);
            for (byte value : digest) hash.append(String.format("%02x", value));
            return "generated-" + hash;
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("Não foi possível gerar o identificador do assunto.", ex);
        }
    }

    private int number(Map<String,Object> row, String key) { return ((Number) row.get(key)).intValue(); }
    private int difficulty(String value) { String v = value.toLowerCase(); return v.contains("dif") ? 4 : v.contains("fácil") ? 2 : 3; }
    private double weight(String value) { try { return Double.parseDouble(value.replace("%", "").trim()); } catch (Exception ignored) { return 1; } }
    private int plannedMinutes(JsonNode section, JsonNode card, int preferredMinutes) {
        return 60;
    }
    private int createTasksFromSchedule(UUID planId,UUID userId,LocalDate date){
        var plans=jdbc.sql("SELECT settings::text settings_json FROM study_plans WHERE id=:p AND user_id=:u")
                .param("p",planId).param("u",userId).query().listOfRows();
        if(plans.isEmpty())return 0;
        var topics=jdbc.sql("""
            SELECT rt.id,rt.title,rt.subject_name,rt.recommended_questions,rt.minimum_accuracy,rt.priority,
              tp.questions_answered,tp.correct_answers
            FROM roadmap_topics rt JOIN topic_progress tp ON tp.roadmap_topic_id=rt.id AND tp.user_id=:u
            WHERE rt.plan_id=:p AND rt.active
            """).param("p",planId).param("u",userId).query().listOfRows();
        var bySubjectAndTitle=new HashMap<String,Map<String,Object>>();
        topics.forEach(topic->bySubjectAndTitle.put(topicKey(String.valueOf(topic.get("subject_name")),String.valueOf(topic.get("title"))),topic));
        var seeds=new ArrayList<ScheduleTaskSeed>();
        try{
            JsonNode settings=json.readTree(String.valueOf(plans.getFirst().get("settings_json")));
            for(JsonNode week:settings.path("legacyScheduleWeeks"))for(JsonNode block:week.path("blocks")){
                if(!date.toString().equals(block.path("isoDate").asText()))continue;
                String activity=block.path("activityType").asText("THEORY");
                if("QUESTIONS".equals(activity))continue;
                String topicTitle=block.path("topicTitle").asText(block.path("title").asText());
                String subjectTitle=block.path("subjectTitle").asText();
                var topic=bySubjectAndTitle.get(topicKey(subjectTitle,topicTitle));
                if(topic==null)continue;
                boolean question="QUESTIONS".equals(activity);
                boolean optional=question;
                boolean outside=question;
                int minutes=question?Math.max(5,block.path("durationMinutes").asInt(30)):60;
                seeds.add(new ScheduleTaskSeed(topic,activity,minutes,optional,outside,seeds.size()));
            }
        }catch(Exception ignored){return 0;}
        int position=0;
        for(var seed:seeds){
                var topic=seed.topic();int minutes=seed.minutes();if(minutes<=0)continue;
                jdbc.sql("""
                    INSERT INTO daily_tasks(id,user_id,plan_id,roadmap_topic_id,task_date,position,activity_type,
                      planned_minutes,question_goal,minimum_accuracy,priority,status,is_optional,outside_planned_hours,cycle_index)
                    VALUES(gen_random_uuid(),:u,:p,:t,:date,:position,:activity,:minutes,:questions,:accuracy,:priority,:status,:optional,:outside,:cycle)
                    ON CONFLICT(user_id,plan_id,task_date,roadmap_topic_id,activity_type,cycle_index) DO NOTHING
                    """).param("u",userId).param("p",planId).param("t",topic.get("id")).param("date",date)
                        .param("position",position).param("activity",seed.activity()).param("minutes",minutes)
                        .param("questions",topic.get("recommended_questions")).param("accuracy",topic.get("minimum_accuracy"))
                        .param("priority",topic.get("priority")).param("status",position==0?"AVAILABLE":"PENDING")
                        .param("optional",seed.optional()).param("outside",seed.outside()).param("cycle",seed.cycle()).update();
                position++;
        }
        return position;
    }
    private record ScheduleTaskSeed(Map<String,Object> topic,String activity,int minutes,boolean optional,boolean outside,int cycle){}
    private String normalize(String value){return java.text.Normalizer.normalize(value,java.text.Normalizer.Form.NFD).replaceAll("\\p{M}","").toLowerCase(Locale.ROOT).trim();}
    private String topicKey(String subject,String topic){return normalize(subject)+"::"+normalize(topic);}
    private List<Map<String,Object>> learningPathCandidates(List<Map<String,Object>> raw) {
        var specific = raw.stream().filter(row -> "specific".equals(row.get("learning_track")))
                .sorted(Comparator.comparingInt((Map<String,Object> row) -> number(row, "learning_order"))
                        .thenComparingInt(row -> number(row, "module_position"))
                        .thenComparingInt(row -> number(row, "topic_position"))).toList();
        if (specific.isEmpty()) return raw;
        var basic = raw.stream().filter(row -> "basic".equals(row.get("learning_track")))
                .sorted(Comparator.comparingInt((Map<String,Object> row) -> number(row, "topic_position"))
                        .thenComparingInt(row -> number(row, "module_position"))).toList();
        var ordered = new ArrayList<Map<String,Object>>();
        int basicIndex = 0, specificIndex = 0;
        boolean specificTurn = true;
        while (basicIndex < basic.size() || specificIndex < specific.size()) {
            if (specificIndex < specific.size() && (specificTurn || basicIndex >= basic.size())) {
                ordered.add(specific.get(specificIndex++));
            } else if (basicIndex < basic.size()) {
                ordered.add(basic.get(basicIndex++));
            }
            specificTurn = !specificTurn;
        }
        raw.stream().filter(row -> !"basic".equals(row.get("learning_track")) && !"specific".equals(row.get("learning_track")))
                .forEach(ordered::add);
        return ordered;
    }
}
