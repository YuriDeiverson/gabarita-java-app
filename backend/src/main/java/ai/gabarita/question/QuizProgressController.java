package ai.gabarita.question;

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
    QuizProgressController(JdbcClient jdbc) { this.jdbc = jdbc; }

    public record ProgressInput(@NotNull UUID studyPlanId, @NotNull Object questionId,
                                @NotBlank String answer, boolean isCorrect) {}
    public record ProgressUpdate(@NotBlank String answer, boolean isCorrect) {}

    @GetMapping("/study-plan/{planId}")
    public List<Map<String,Object>> byPlan(@PathVariable UUID planId) {
        return jdbc.sql("SELECT id,study_plan_id,question_id,answer,is_correct,answered_at FROM quiz_progress WHERE study_plan_id=:p ORDER BY answered_at")
                .param("p",planId).query().listOfRows();
    }
    @GetMapping("/{id}") public Map<String,Object> one(@PathVariable UUID id) {
        return jdbc.sql("SELECT * FROM quiz_progress WHERE id=:id").param("id",id).query().listOfRows().stream()
                .findFirst().orElseThrow(() -> new NoSuchElementException("Resposta não encontrada"));
    }
    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public Map<String,Object> save(@Valid @RequestBody ProgressInput r) {
        var saved=jdbc.sql("""
          INSERT INTO quiz_progress(id,study_plan_id,question_id,answer,is_correct,answered_at)
          VALUES(gen_random_uuid(),:p,:q,:answer,:correct,now())
          ON CONFLICT(study_plan_id,question_id) DO UPDATE
          SET answer=:answer,is_correct=:correct,answered_at=now()
          RETURNING id,study_plan_id,question_id,answer,is_correct,answered_at
          """).param("p",r.studyPlanId()).param("q",String.valueOf(r.questionId()))
                .param("answer",r.answer()).param("correct",r.isCorrect()).query().singleRow();
        jdbc.sql("INSERT INTO quiz_answer_events(id,study_plan_id,question_id,answer,is_correct,answered_at) VALUES(gen_random_uuid(),:p,:q,:answer,:correct,now())")
                .param("p",r.studyPlanId()).param("q",String.valueOf(r.questionId())).param("answer",r.answer()).param("correct",r.isCorrect()).update();
        return saved;
    }
    @PutMapping("/{id}") public Map<String,Object> update(@PathVariable UUID id,@Valid @RequestBody ProgressUpdate r) {
        jdbc.sql("UPDATE quiz_progress SET answer=:a,is_correct=:c,answered_at=now() WHERE id=:id")
                .param("a",r.answer()).param("c",r.isCorrect()).param("id",id).update(); return one(id);
    }
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) { jdbc.sql("DELETE FROM quiz_progress WHERE id=:id").param("id",id).update(); }
    @DeleteMapping("/study-plan/{planId}") @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional public void deletePlan(@PathVariable UUID planId) { jdbc.sql("DELETE FROM quiz_progress WHERE study_plan_id=:p").param("p",planId).update(); jdbc.sql("DELETE FROM quiz_answer_events WHERE study_plan_id=:p").param("p",planId).update(); }
    @GetMapping("/stats/{planId}") public Map<String,Object> stats(@PathVariable UUID planId) {
        return jdbc.sql("SELECT COUNT(*) total_answered,COUNT(*) FILTER(WHERE is_correct) correct_answers,COUNT(*) FILTER(WHERE NOT is_correct) wrong_answers FROM quiz_progress WHERE study_plan_id=:p")
                .param("p",planId).query().singleRow();
    }
}
