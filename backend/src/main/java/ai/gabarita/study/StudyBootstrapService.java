package ai.gabarita.study;

import com.fasterxml.jackson.databind.JsonNode;
import java.time.*;
import java.util.*;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StudyBootstrapService {
    private final JdbcClient jdbc;

    public StudyBootstrapService(JdbcClient jdbc) { this.jdbc = jdbc; }

    @Transactional
    public void synchronize(UUID planId, UUID userId, JsonNode sections, int blockMinutes, Integer hoursPerDay) {
        jdbc.sql("INSERT INTO study_streaks(user_id) VALUES(:u) ON CONFLICT(user_id) DO NOTHING")
                .param("u", userId).update();
        jdbc.sql("INSERT INTO user_notification_preferences(user_id) VALUES(:u) ON CONFLICT(user_id) DO NOTHING")
                .param("u", userId).update();
        if (sections == null || !sections.isArray() || sections.isEmpty()) return;

        jdbc.sql("UPDATE roadmap_topics SET active=false WHERE plan_id=:p").param("p", planId).update();
        int modulePosition = 0;
        for (JsonNode section : sections) {
            UUID moduleId = upsertModule(planId, modulePosition, section.path("title").asText("Disciplina"),
                    section.path("paretoJustification").asText(null));
            UUID prerequisite = null;
            int topicPosition = 0;
            for (JsonNode card : section.path("cards")) {
                String source = section.path("id").asText("section-" + modulePosition) + ":" +
                        card.path("id").asText("topic-" + topicPosition);
                UUID topicId = upsertTopic(planId, moduleId, source, section, card, topicPosition,
                        prerequisite, Math.max(15, blockMinutes));
                String initialStatus = prerequisite == null ? "AVAILABLE" : "LOCKED";
                jdbc.sql("""
                    INSERT INTO topic_progress(id,user_id,roadmap_topic_id,status)
                    VALUES(gen_random_uuid(),:u,:t,:status)
                    ON CONFLICT(user_id,roadmap_topic_id) DO NOTHING
                    """).param("u", userId).param("t", topicId).param("status", initialStatus).update();
                prerequisite = topicId;
                topicPosition++;
            }
            modulePosition++;
        }
        ensureToday(planId, userId, hoursPerDay == null ? 120 : Math.max(30, hoursPerDay * 60));
        createWelcomeNotification(planId, userId);
    }

    @Transactional
    public List<Map<String,Object>> ensureToday(UUID planId, UUID userId, int goalMinutes) {
        LocalDate date = userToday(userId);
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
                    WITH ordered AS (
                      SELECT dt.id,ROW_NUMBER() OVER(ORDER BY
                        CASE WHEN dt.status='COMPLETED' THEN 0 ELSE 1 END,
                        CASE WHEN dt.status='COMPLETED' THEN dt.completed_at END,
                        CASE WHEN dt.activity_type='REVIEW' THEN 0 ELSE 1 END,
                        rt.position,md5(rt.id::text||CAST(:p AS text)))-1 new_position
                      FROM daily_tasks dt JOIN roadmap_topics rt ON rt.id=dt.roadmap_topic_id
                      WHERE dt.user_id=:u AND dt.plan_id=:p AND dt.task_date=:date)
                    UPDATE daily_tasks dt SET position=ordered.new_position,updated_at=now()
                    FROM ordered WHERE dt.id=ordered.id
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

        var candidates = jdbc.sql("""
            SELECT rt.id,rt.planned_minutes,rt.recommended_questions,rt.minimum_accuracy,
                   rt.priority,tp.status,rt.subject_name,rt.title,
                   CASE WHEN tp.status='NEEDS_REVIEW' THEN 40 ELSE 0 END + rt.priority AS score
            FROM roadmap_topics rt JOIN topic_progress tp ON tp.roadmap_topic_id=rt.id AND tp.user_id=:u
            WHERE rt.plan_id=:p AND rt.active AND tp.status IN('AVAILABLE','IN_PROGRESS','NEEDS_REVIEW')
            ORDER BY CASE WHEN tp.status='NEEDS_REVIEW' THEN 0 ELSE 1 END,
              rt.position,md5(rt.id::text||CAST(:p AS text)),score DESC
            """).param("u", userId).param("p", planId).query().listOfRows();

        int remaining = Math.max(30, goalMinutes), position = 0;
        for (var topic : candidates) {
            if (remaining <= 0 && position > 0) break;
            int planned = Math.min(number(topic, "planned_minutes"), Math.max(15, remaining));
            String type = "NEEDS_REVIEW".equals(topic.get("status")) ? "REVIEW" : "THEORY";
            jdbc.sql("""
                INSERT INTO daily_tasks(id,user_id,plan_id,roadmap_topic_id,task_date,position,activity_type,
                  planned_minutes,question_goal,minimum_accuracy,priority,status)
                VALUES(gen_random_uuid(),:u,:p,:t,:date,:pos,:type,:minutes,:questions,:accuracy,:priority,:status)
                ON CONFLICT(user_id,plan_id,task_date,roadmap_topic_id,activity_type) DO NOTHING
                """).param("u", userId).param("p", planId).param("t", topic.get("id"))
                    .param("date", date).param("pos", position).param("type", type).param("minutes", planned)
                    .param("questions", topic.get("recommended_questions")).param("accuracy", topic.get("minimum_accuracy"))
                    .param("priority", topic.get("score")).param("status", position == 0 ? "AVAILABLE" : "PENDING").update();
            remaining -= planned;
            position++;
        }
        return tasks(userId, planId, date);
    }

    public LocalDate userToday(UUID userId) {
        String zone = jdbc.sql("SELECT timezone FROM users WHERE id=:u").param("u", userId)
                .query(String.class).optional().orElse("America/Maceio");
        return LocalDate.now(ZoneId.of(zone));
    }

    public List<Map<String,Object>> tasks(UUID userId, UUID planId, LocalDate date) {
        return jdbc.sql("""
            SELECT dt.*,rt.title topic_title,rt.subject_name,rt.objective,rt.description,
                   rt.content,rt.difficulty,tp.status topic_status,tp.mastery
            FROM daily_tasks dt JOIN roadmap_topics rt ON rt.id=dt.roadmap_topic_id
            JOIN topic_progress tp ON tp.roadmap_topic_id=rt.id AND tp.user_id=dt.user_id
            WHERE dt.user_id=:u AND dt.plan_id=:p AND dt.task_date=:date ORDER BY dt.position
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
        String content = card.toString();
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
                .param("objective", "Dominar os conceitos essenciais e aplicá-los com segurança em questões de prova.")
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

    private int number(Map<String,Object> row, String key) { return ((Number) row.get(key)).intValue(); }
    private int difficulty(String value) { String v = value.toLowerCase(); return v.contains("dif") ? 4 : v.contains("fácil") ? 2 : 3; }
    private double weight(String value) { try { return Double.parseDouble(value.replace("%", "").trim()); } catch (Exception ignored) { return 1; } }
}
