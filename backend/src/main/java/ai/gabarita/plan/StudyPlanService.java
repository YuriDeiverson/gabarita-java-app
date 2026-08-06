package ai.gabarita.plan;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.*;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ai.gabarita.study.StudyBootstrapService;
import static ai.gabarita.plan.StudyPlanController.*;

@Service
public class StudyPlanService {
    private final JdbcClient jdbc; private final ObjectMapper json; private final StudyBootstrapService bootstrap;
    public StudyPlanService(JdbcClient jdbc, ObjectMapper json, StudyBootstrapService bootstrap) {
        this.jdbc = jdbc; this.json = json; this.bootstrap = bootstrap;
    }

    List<Map<String,Object>> all(UUID user, boolean archived) {
        archiveExpired(user);
        return jdbc.sql("""
                SELECT sp.*,sp.course_id AS course_id,sp.exam_date AS exam_date,sp.is_primary AS is_active,
                  (SELECT COUNT(*) FROM roadmap_topics rt WHERE rt.plan_id=sp.id AND rt.active) total_topics,
                  (SELECT COUNT(*) FROM roadmap_topics rt JOIN topic_progress tp ON tp.roadmap_topic_id=rt.id
                    WHERE rt.plan_id=sp.id AND rt.active AND tp.user_id=:u AND tp.status='COMPLETED') completed_topics
                FROM study_plans sp
                WHERE sp.user_id=:u AND (:a OR sp.status<>'ARCHIVED')
                ORDER BY sp.is_primary DESC,sp.updated_at DESC
                """)
                .param("u", user).param("a", archived).query().listOfRows().stream()
                .map(this::serializeSettings).toList();
    }
    Map<String,Object> one(UUID id, UUID user) {
        return jdbc.sql("SELECT *, is_primary AS is_active FROM study_plans WHERE id=:id AND user_id=:u")
                .param("id",id).param("u",user).query().listOfRows().stream().findFirst()
                .map(this::serializeSettings)
                .orElseThrow(() -> new NoSuchElementException("Plano não encontrado"));
    }
    Map<String,Object> active(UUID user) {
        archiveExpired(user);
        return jdbc.sql("SELECT *, is_primary AS is_active FROM study_plans WHERE user_id=:u AND is_primary AND status='ACTIVE'")
                .param("u",user).query().listOfRows().stream().findFirst().map(this::serializeSettings)
                .orElseThrow(() -> new NoSuchElementException("Nenhum plano principal ativo"));
    }

    @Transactional Map<String,Object> create(UUID user, PlanRequest r) {
        String stage = "validar os dados";
        try {
            validate(r); UUID id=UUID.randomUUID();
            stage = "registrar a preparação";
            jdbc.sql("""
              INSERT INTO study_plans(id,user_id,exam_id,course_id,title,exam_date,is_template,block_minutes,break_minutes,
              final_sprint_days,weekly_goal_minutes,monthly_goal_minutes,settings)
              VALUES(:id,:u,:exam,:course,:title,:date,:template,:block,:break,:sprint,:weekly,:monthly,CAST(:settings AS jsonb))
              """).param("id",id).param("u",user).param("exam",r.examId()).param("course",r.courseId())
              .param("title",r.title()).param("date",r.examDate()).param("template",Boolean.TRUE.equals(r.template()))
              .param("block",or(r.blockMinutes(),60)).param("break",or(r.breakMinutes(),10)).param("sprint",or(r.finalSprintDays(),14))
              .param("weekly",r.weeklyGoalMinutes()).param("monthly",r.monthlyGoalMinutes()).param("settings",settings(r)).update();
            stage = "registrar a disponibilidade e os tópicos";
            replaceChildren(id,r);
            stage = "montar o roteiro e as atividades iniciais";
            bootstrap.synchronize(id,user,r.studySections(),or(r.blockMinutes(),60),r.hoursPerDay());
            stage = "registrar o histórico da preparação";
            audit(id,"CREATED"); return one(id,user);
        } catch (DataIntegrityViolationException ex) {
            throw new IllegalStateException("Não foi possível criar a preparação ao " + stage + ".", ex);
        }
    }

    @Transactional Map<String,Object> update(UUID id, UUID user, PlanRequest r) {
        one(id,user); validate(r);
        int changed=jdbc.sql("""
          UPDATE study_plans SET exam_id=:exam,course_id=:course,title=:title,exam_date=:date,block_minutes=:block,
          break_minutes=:break,final_sprint_days=:sprint,weekly_goal_minutes=:weekly,monthly_goal_minutes=:monthly,
          settings=CAST(:settings AS jsonb),version=version+1,updated_at=now() WHERE id=:id AND user_id=:u
          """).param("exam",r.examId()).param("course",r.courseId()).param("title",r.title()).param("date",r.examDate())
          .param("block",or(r.blockMinutes(),60)).param("break",or(r.breakMinutes(),10)).param("sprint",or(r.finalSprintDays(),14))
          .param("weekly",r.weeklyGoalMinutes()).param("monthly",r.monthlyGoalMinutes()).param("settings",settings(r))
          .param("id",id).param("u",user).update();
        if(changed==0) throw new NoSuchElementException("Plano não encontrado");
        replaceChildren(id,r); bootstrap.synchronize(id,user,r.studySections(),or(r.blockMinutes(),60),r.hoursPerDay());
        audit(id,"UPDATED"); return one(id,user);
    }

    @Transactional Map<String,Object> duplicate(UUID source, UUID user, String title) {
        var original=one(source,user); UUID id=UUID.randomUUID();
        if(localDate(original.get("exam_date")).isBefore(today()))throw new IllegalArgumentException("A prova deste plano já foi realizada");
        jdbc.sql("""
          INSERT INTO study_plans(id,user_id,exam_id,course_id,title,exam_date,status,is_template,block_minutes,break_minutes,
          final_sprint_days,weekly_goal_minutes,monthly_goal_minutes,settings)
          SELECT :new,user_id,exam_id,course_id,COALESCE(:title,title||' (cópia)'),exam_date,'ACTIVE',false,block_minutes,break_minutes,
          final_sprint_days,weekly_goal_minutes,monthly_goal_minutes,settings FROM study_plans WHERE id=:source
          """)
          .param("new",id).param("title",title).param("source",source).update();
        jdbc.sql("INSERT INTO plan_topics SELECT :new,topic_id,priority,enabled FROM plan_topics WHERE plan_id=:source").param("new",id).param("source",source).update();
        jdbc.sql("INSERT INTO availability(id,plan_id,weekday,start_time,end_time,block_minutes,break_minutes) SELECT gen_random_uuid(),:new,weekday,start_time,end_time,block_minutes,break_minutes FROM availability WHERE plan_id=:source").param("new",id).param("source",source).update();
        audit(id,"DUPLICATED"); return one(id,user);
    }
    @Transactional Map<String,Object> activate(UUID id, UUID user) {
        archiveExpired(user);var plan=one(id,user);
        if(localDate(plan.get("exam_date")).isBefore(today()))throw new IllegalArgumentException("A prova deste plano já foi realizada");
        jdbc.sql("UPDATE study_plans SET is_primary=false WHERE user_id=:u").param("u",user).update();
        jdbc.sql("UPDATE study_plans SET is_primary=true,status='ACTIVE',updated_at=now() WHERE id=:id").param("id",id).update(); audit(id,"ACTIVATED"); return one(id,user);
    }
    @Transactional Map<String,Object> archive(UUID id, UUID user) {
        one(id,user); jdbc.sql("UPDATE study_plans SET status='ARCHIVED',is_primary=false,updated_at=now() WHERE id=:id").param("id",id).update(); audit(id,"ARCHIVED"); return one(id,user);
    }
    @Transactional Map<String,Object> restore(UUID id, UUID user) {
        var plan=one(id,user);if(localDate(plan.get("exam_date")).isBefore(today()))throw new IllegalArgumentException("A prova deste plano já foi realizada");
        jdbc.sql("UPDATE study_plans SET status='ACTIVE',updated_at=now() WHERE id=:id").param("id",id).update(); audit(id,"RESTORED"); return one(id,user);
    }
    @Transactional void delete(UUID id, UUID user) {
        one(id,user);
        jdbc.sql("DELETE FROM study_sessions WHERE plan_id=:id").param("id",id).update();
        jdbc.sql("DELETE FROM simulations WHERE plan_id=:id").param("id",id).update();
        jdbc.sql("DELETE FROM plan_history WHERE plan_id=:id").param("id",id).update();
        jdbc.sql("DELETE FROM study_plans WHERE id=:id").param("id",id).update();
    }
    List<Map<String,Object>> history(UUID id, UUID user) { one(id,user); return jdbc.sql("SELECT * FROM plan_history WHERE plan_id=:id ORDER BY changed_at DESC").param("id",id).query().listOfRows(); }

    private void replaceChildren(UUID id, PlanRequest r) {
        jdbc.sql("DELETE FROM plan_topics WHERE plan_id=:id").param("id",id).update();
        if(r.topicIds()!=null) r.topicIds().forEach(t -> jdbc.sql("INSERT INTO plan_topics(plan_id,topic_id) VALUES(:p,:t)").param("p",id).param("t",t).update());
        jdbc.sql("DELETE FROM availability WHERE plan_id=:id").param("id",id).update();
        if(r.availability()!=null) r.availability().forEach(a -> jdbc.sql("INSERT INTO availability(id,plan_id,weekday,start_time,end_time,block_minutes,break_minutes) VALUES(gen_random_uuid(),:p,:w,:s,:e,:b,:r)").param("p",id).param("w",a.weekday()).param("s",a.startTime()).param("e",a.endTime()).param("b",a.blockMinutes()).param("r",a.breakMinutes()).update());
        jdbc.sql("DELETE FROM unavailable_periods WHERE plan_id=:id").param("id",id).update();
        if(r.unavailablePeriods()!=null) r.unavailablePeriods().forEach(x -> jdbc.sql("INSERT INTO unavailable_periods(id,plan_id,starts_at,ends_at,reason) VALUES(gen_random_uuid(),:p,:s,:e,:r)").param("p",id).param("s",x.startsAt()).param("e",x.endsAt()).param("r",x.reason()).update());
    }
    private void audit(UUID id,String action) { jdbc.sql("INSERT INTO plan_history(plan_id,version,action,snapshot) SELECT id,version,:a,to_jsonb(study_plans) FROM study_plans WHERE id=:id").param("a",action).param("id",id).update(); }
    private void archiveExpired(UUID user){jdbc.sql("UPDATE study_plans SET status='ARCHIVED',is_primary=false,updated_at=now() WHERE user_id=:u AND status='ACTIVE' AND exam_date<(now() AT TIME ZONE 'America/Maceio')::date").param("u",user).update();}
    static java.time.LocalDate localDate(Object value){
        if(value instanceof java.time.LocalDate date)return date;
        if(value instanceof java.sql.Date date)return date.toLocalDate();
        if(value!=null)try{return java.time.LocalDate.parse(String.valueOf(value));}catch(java.time.format.DateTimeParseException ignored){}
        throw new IllegalArgumentException("Data da prova inválida");
    }
    private java.time.LocalDate today(){return java.time.LocalDate.now(java.time.ZoneId.of("America/Maceio"));}
    private void validate(PlanRequest r) { if(!r.examDate().isAfter(today())) throw new IllegalArgumentException("A data da prova deve ser futura"); if(r.availability()!=null) r.availability().forEach(a->{if(!a.endTime().isAfter(a.startTime())) throw new IllegalArgumentException("O fim da disponibilidade deve ser posterior ao início");}); }
    private int or(Integer value,int fallback){return value==null?fallback:value;}
    private Map<String,Object> serializeSettings(Map<String,Object> plan) {
        var result = new LinkedHashMap<String,Object>(plan);
        if (result.get("settings") != null) result.put("settings", String.valueOf(result.get("settings")));
        return result;
    }
    private String settings(PlanRequest r) { try { var root=json.createObjectNode(); if(r.settings()!=null) root.set("preferences",r.settings()); if(r.studySections()!=null) root.set("studySections",r.studySections()); if(r.scheduleWeeks()!=null) root.set("legacyScheduleWeeks",r.scheduleWeeks()); if(r.hoursPerDay()!=null) root.put("hoursPerDay",r.hoursPerDay()); if(r.daysPerWeek()!=null) root.put("daysPerWeek",r.daysPerWeek()); return json.writeValueAsString(root); } catch(JsonProcessingException e){throw new IllegalArgumentException("Configuração inválida");} }
}
