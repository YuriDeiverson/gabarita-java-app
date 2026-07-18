package ai.gabarita.simulation;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.*;
import static ai.gabarita.plan.StudyPlanController.DEMO_USER;

@RestController
@RequestMapping("/api/simulations")
public class SimulationController {
  private final JdbcClient jdbc;
  SimulationController(JdbcClient jdbc){this.jdbc=jdbc;}
  public record CreateInput(UUID planId,@NotBlank String title,String scoreMode,Integer timeLimitSeconds,
    List<UUID> questionIds,UUID subjectId,UUID topicId,@Min(1) @Max(500) Integer quantity){}
  public record AnswerInput(@NotNull UUID questionId,@NotNull JsonNode answer,@Min(0) Integer timeSpentSeconds){}

  @PostMapping @ResponseStatus(HttpStatus.CREATED) public Map<String,Object> create(@Valid @RequestBody CreateInput r){
    UUID id=UUID.randomUUID();jdbc.sql("INSERT INTO simulations(id,user_id,plan_id,title,score_mode,time_limit_seconds) VALUES(:id,:u,:p,:title,:mode,:limit)").param("id",id).param("u",DEMO_USER).param("p",r.planId()).param("title",r.title()).param("mode",r.scoreMode()==null?"CEBRASPE":r.scoreMode()).param("limit",r.timeLimitSeconds()).update();
    List<UUID> ids=r.questionIds();if(ids==null||ids.isEmpty())ids=jdbc.sql("SELECT id FROM questions WHERE status='ACTIVE' AND (:s IS NULL OR subject_id=:s) AND (:t IS NULL OR topic_id=:t) ORDER BY random() LIMIT :q").param("s",r.subjectId()).param("t",r.topicId()).param("q",r.quantity()==null?20:r.quantity()).query(UUID.class).list();
    int pos=0;for(UUID q:ids)jdbc.sql("INSERT INTO simulation_questions(simulation_id,question_id,position) VALUES(:s,:q,:p)").param("s",id).param("q",q).param("p",pos++).update();return one(id);
  }
  @GetMapping("/{id}") public Map<String,Object> one(@PathVariable UUID id){var sim=jdbc.sql("SELECT * FROM simulations WHERE id=:id AND user_id=:u").param("id",id).param("u",DEMO_USER).query().listOfRows().stream().findFirst().orElseThrow(()->new NoSuchElementException("Simulado não encontrado"));var questions=jdbc.sql("SELECT q.id,q.statement,q.type,q.difficulty,q.passage_id,sq.position FROM simulation_questions sq JOIN questions q ON q.id=sq.question_id WHERE sq.simulation_id=:s ORDER BY sq.position").param("s",id).query().listOfRows();var result=new LinkedHashMap<String,Object>(sim);result.put("questions",questions);return result;}
  @PatchMapping("/{id}/start") public Map<String,Object> start(@PathVariable UUID id){jdbc.sql("UPDATE simulations SET status='RUNNING',started_at=COALESCE(started_at,now()),paused_at=NULL WHERE id=:id AND user_id=:u").param("id",id).param("u",DEMO_USER).update();return one(id);}
  @PatchMapping("/{id}/pause") public Map<String,Object> pause(@PathVariable UUID id){jdbc.sql("UPDATE simulations SET status='PAUSED',paused_at=now() WHERE id=:id AND user_id=:u").param("id",id).param("u",DEMO_USER).update();return one(id);}
  @PostMapping("/{id}/answers") public Map<String,Object> answer(@PathVariable UUID id,@Valid @RequestBody AnswerInput r){
    JsonNode correct=jdbc.sql("SELECT correct_answer::text FROM questions WHERE id=:q").param("q",r.questionId()).query(String.class).optional().map(this::node).orElseThrow(()->new NoSuchElementException("Questão não encontrada"));boolean isCorrect=correct.equals(r.answer());
    return jdbc.sql("INSERT INTO answers(id,user_id,simulation_id,question_id,answer,correct,time_spent_seconds) VALUES(gen_random_uuid(),:u,:s,:q,CAST(:answer AS jsonb),:correct,:time) ON CONFLICT(simulation_id,question_id) DO UPDATE SET answer=CAST(:answer AS jsonb),correct=:correct,time_spent_seconds=:time,answered_at=now() RETURNING id,question_id,correct,time_spent_seconds,answered_at").param("u",DEMO_USER).param("s",id).param("q",r.questionId()).param("answer",r.answer().toString()).param("correct",isCorrect).param("time",r.timeSpentSeconds()==null?0:r.timeSpentSeconds()).query().singleRow();
  }
  @PatchMapping("/{id}/finish") public Map<String,Object> finish(@PathVariable UUID id){jdbc.sql("UPDATE simulations SET status='FINISHED',finished_at=now() WHERE id=:id AND user_id=:u").param("id",id).param("u",DEMO_USER).update();return jdbc.sql("SELECT COUNT(*) answered,COUNT(*) FILTER(WHERE correct) correct,COUNT(*) FILTER(WHERE NOT correct) wrong FROM answers WHERE simulation_id=:s").param("s",id).query().singleRow();}
  private JsonNode node(String value){try{return new com.fasterxml.jackson.databind.ObjectMapper().readTree(value);}catch(Exception e){throw new IllegalArgumentException("Gabarito inválido");}}
}
