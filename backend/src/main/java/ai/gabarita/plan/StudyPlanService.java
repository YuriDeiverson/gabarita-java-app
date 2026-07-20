package ai.gabarita.plan;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.*;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import static ai.gabarita.plan.StudyPlanController.*;

@Service
public class StudyPlanService {
    private final JdbcClient jdbc; private final ObjectMapper json;
    public StudyPlanService(JdbcClient jdbc, ObjectMapper json) { this.jdbc = jdbc; this.json = json; }

    List<Map<String,Object>> all(UUID user, boolean archived) {
        return jdbc.sql("SELECT *, course_id AS course_id, exam_date AS exam_date, is_primary AS is_active FROM study_plans WHERE user_id=:u AND (:a OR status<>'ARCHIVED') ORDER BY is_primary DESC, updated_at DESC")
                .param("u", user).param("a", archived).query().listOfRows();
    }
    Map<String,Object> one(UUID id, UUID user) {
        return jdbc.sql("SELECT *, is_primary AS is_active FROM study_plans WHERE id=:id AND user_id=:u")
                .param("id",id).param("u",user).query().singleRow();
    }
    Map<String,Object> active(UUID user) {
        return jdbc.sql("SELECT *, is_primary AS is_active FROM study_plans WHERE user_id=:u AND is_primary AND status='ACTIVE'")
                .param("u",user).query().listOfRows().stream().findFirst().orElseThrow(() -> new NoSuchElementException("Nenhum plano principal ativo"));
    }

    @Transactional Map<String,Object> create(UUID user, PlanRequest r) {
        validate(r); UUID id=UUID.randomUUID();
        jdbc.sql("""
          INSERT INTO study_plans(id,user_id,exam_id,course_id,title,exam_date,is_template,block_minutes,break_minutes,
          final_sprint_days,weekly_goal_minutes,monthly_goal_minutes,settings)
          VALUES(:id,:u,:exam,:course,:title,:date,:template,:block,:break,:sprint,:weekly,:monthly,CAST(:settings AS jsonb))
          """).param("id",id).param("u",user).param("exam",r.examId()).param("course",r.courseId())
          .param("title",r.title()).param("date",r.examDate()).param("template",Boolean.TRUE.equals(r.template()))
          .param("block",or(r.blockMinutes(),60)).param("break",or(r.breakMinutes(),10)).param("sprint",or(r.finalSprintDays(),14))
          .param("weekly",r.weeklyGoalMinutes()).param("monthly",r.monthlyGoalMinutes()).param("settings",settings(r)).update();
        replaceChildren(id,r); audit(id,"CREATED"); return one(id,user);
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
        replaceChildren(id,r); audit(id,"UPDATED"); return one(id,user);
    }

    @Transactional Map<String,Object> duplicate(UUID source, UUID user, String title) {
        var original=one(source,user); UUID id=UUID.randomUUID();
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
        one(id,user); jdbc.sql("UPDATE study_plans SET is_primary=false WHERE user_id=:u").param("u",user).update();
        jdbc.sql("UPDATE study_plans SET is_primary=true,status='ACTIVE',updated_at=now() WHERE id=:id").param("id",id).update(); audit(id,"ACTIVATED"); return one(id,user);
    }
    @Transactional Map<String,Object> archive(UUID id, UUID user) {
        one(id,user); jdbc.sql("UPDATE study_plans SET status='ARCHIVED',is_primary=false,updated_at=now() WHERE id=:id").param("id",id).update(); audit(id,"ARCHIVED"); return one(id,user);
    }
    @Transactional Map<String,Object> restore(UUID id, UUID user) {
        one(id,user); jdbc.sql("UPDATE study_plans SET status='ACTIVE',updated_at=now() WHERE id=:id").param("id",id).update(); audit(id,"RESTORED"); return one(id,user);
    }
    @Transactional void delete(UUID id, UUID user) { one(id,user); audit(id,"DELETED"); jdbc.sql("DELETE FROM study_plans WHERE id=:id").param("id",id).update(); }
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
    private void validate(PlanRequest r) { if(!r.examDate().isAfter(java.time.LocalDate.now())) throw new IllegalArgumentException("A data da prova deve ser futura"); if(r.availability()!=null) r.availability().forEach(a->{if(!a.endTime().isAfter(a.startTime())) throw new IllegalArgumentException("O fim da disponibilidade deve ser posterior ao início");}); }
    private int or(Integer value,int fallback){return value==null?fallback:value;}
    private String settings(PlanRequest r) { try { var root=json.createObjectNode(); if(r.settings()!=null) root.set("preferences",r.settings()); if(r.studySections()!=null) root.set("studySections",r.studySections()); if(r.scheduleWeeks()!=null) root.set("legacyScheduleWeeks",r.scheduleWeeks()); if(r.hoursPerDay()!=null) root.put("hoursPerDay",r.hoursPerDay()); if(r.daysPerWeek()!=null) root.put("daysPerWeek",r.daysPerWeek()); return json.writeValueAsString(root); } catch(JsonProcessingException e){throw new IllegalArgumentException("Configuração inválida");} }
}
