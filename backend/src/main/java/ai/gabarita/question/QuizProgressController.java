package ai.gabarita.question;

import ai.gabarita.auth.CurrentUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

@RestController
@RequestMapping("/api/quiz-progress")
public class QuizProgressController {
    private final JdbcClient jdbc;
    private final CurrentUser currentUser;
    QuizProgressController(JdbcClient jdbc,CurrentUser currentUser) { this.jdbc = jdbc;this.currentUser=currentUser; }

    public record ProgressInput(@NotNull UUID studyPlanId, @NotNull Object questionId,
                                @NotBlank String answer, boolean isCorrect,UUID roadmapTopicId,String topicTitle) {}
    public record ProgressUpdate(@NotBlank String answer, boolean isCorrect) {}

    @GetMapping("/study-plan/{planId}")
    public List<Map<String,Object>> byPlan(@PathVariable UUID planId) {
        assertPlan(planId);
        return jdbc.sql("""
                SELECT qp.id,qp.study_plan_id,qp.question_id,qp.answer,qp.is_correct,qp.answered_at
                FROM quiz_progress qp WHERE qp.study_plan_id=:p AND EXISTS(
                  SELECT 1 FROM quiz_answer_events event WHERE event.study_plan_id=qp.study_plan_id
                    AND event.question_id=qp.question_id AND event.roadmap_topic_id IS NULL)
                ORDER BY qp.answered_at
                """)
                .param("p",planId).query().listOfRows();
    }
    @GetMapping("/{id}") public Map<String,Object> one(@PathVariable UUID id) {
        return jdbc.sql("SELECT qp.* FROM quiz_progress qp JOIN study_plans sp ON sp.id=qp.study_plan_id WHERE qp.id=:id AND sp.user_id=:u")
                .param("id",id).param("u",currentUser.id()).query().listOfRows().stream()
                .findFirst().orElseThrow(() -> new NoSuchElementException("Resposta não encontrada"));
    }
    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public Map<String,Object> save(@Valid @RequestBody ProgressInput r) {
        assertPlan(r.studyPlanId());
        if(r.roadmapTopicId()!=null&&jdbc.sql("SELECT COUNT(*) FROM roadmap_topics WHERE id=:t AND plan_id=:p").param("t",r.roadmapTopicId()).param("p",r.studyPlanId()).query(Integer.class).single()==0)
            throw new NoSuchElementException("Assunto não encontrado neste plano");
        var saved=jdbc.sql("""
          INSERT INTO quiz_progress(id,study_plan_id,question_id,answer,is_correct,answered_at)
          VALUES(gen_random_uuid(),:p,:q,:answer,:correct,now())
          ON CONFLICT(study_plan_id,question_id) DO UPDATE
          SET answer=:answer,is_correct=:correct,answered_at=now()
          RETURNING id,study_plan_id,question_id,answer,is_correct,answered_at
          """).param("p",r.studyPlanId()).param("q",String.valueOf(r.questionId()))
                .param("answer",r.answer()).param("correct",r.isCorrect()).query().singleRow();
        jdbc.sql("""
          INSERT INTO quiz_answer_events(id,study_plan_id,question_id,answer,is_correct,answered_at,roadmap_topic_id,topic_title)
          VALUES(gen_random_uuid(),:p,:q,:answer,:correct,now(),:topic,:title)
          """).param("p",r.studyPlanId()).param("q",String.valueOf(r.questionId())).param("answer",r.answer())
                .param("correct",r.isCorrect()).param("topic",r.roadmapTopicId()).param("title",r.topicTitle()).update();
        return saved;
    }
    @PutMapping("/{id}") public Map<String,Object> update(@PathVariable UUID id,@Valid @RequestBody ProgressUpdate r) {
        one(id);
        jdbc.sql("UPDATE quiz_progress SET answer=:a,is_correct=:c,answered_at=now() WHERE id=:id")
                .param("a",r.answer()).param("c",r.isCorrect()).param("id",id).update(); return one(id);
    }
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) { one(id);jdbc.sql("DELETE FROM quiz_progress WHERE id=:id").param("id",id).update(); }
    @DeleteMapping("/study-plan/{planId}") @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional public void deletePlan(@PathVariable UUID planId) { assertPlan(planId);jdbc.sql("DELETE FROM quiz_progress WHERE study_plan_id=:p").param("p",planId).update(); jdbc.sql("DELETE FROM quiz_answer_events WHERE study_plan_id=:p").param("p",planId).update(); }
    @GetMapping("/stats/{planId}") public Map<String,Object> stats(@PathVariable UUID planId) {
        assertPlan(planId);
        return jdbc.sql("""
                SELECT COUNT(*) total_answered,COUNT(*) FILTER(WHERE qp.is_correct) correct_answers,
                  COUNT(*) FILTER(WHERE NOT qp.is_correct) wrong_answers FROM quiz_progress qp
                WHERE qp.study_plan_id=:p AND EXISTS(SELECT 1 FROM quiz_answer_events event
                  WHERE event.study_plan_id=qp.study_plan_id AND event.question_id=qp.question_id
                    AND event.roadmap_topic_id IS NULL)
                """)
                .param("p",planId).query().singleRow();
    }
    private void assertPlan(UUID id){if(jdbc.sql("SELECT COUNT(*) FROM study_plans WHERE id=:p AND user_id=:u").param("p",id).param("u",currentUser.id()).query(Integer.class).single()==0)throw new NoSuchElementException("Plano não encontrado");}
}
