package ai.gabarita.schedule;

import ai.gabarita.auth.CurrentUser;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/schedule")
public class ScheduleController {
    private final ScheduleEngine engine; private final JdbcClient jdbc;
    private final CurrentUser currentUser;
    public ScheduleController(ScheduleEngine engine, JdbcClient jdbc,CurrentUser currentUser){this.engine=engine;this.jdbc=jdbc;this.currentUser=currentUser;}

    public record StudyDay(@NotBlank String day, @Positive double hours) {}
    public record GenerateRequest(String courseId, @NotNull LocalDate examDate, @NotEmpty List<StudyDay> studyDays,
                                  @NotNull JsonNode studySections, Integer blockMinutes) {}
    public record ProgressRequest(@NotNull UUID studyPlanId, @NotBlank String blockId, boolean isCompleted) {}

    @PostMapping("/generate") public Map<String,Object> generate(@Valid @RequestBody GenerateRequest request) {
        return Map.of("scheduleWeeks",engine.generateLegacy(request));
    }
    @PostMapping("/plans/{planId}/regenerate") public Map<String,Object> regenerate(@PathVariable UUID planId) {
        return engine.regeneratePlan(planId,currentUser.id());
    }
    @GetMapping("/progress/{planId}") public List<Map<String,Object>> progress(@PathVariable UUID planId) {
        assertPlan(planId);
        return jdbc.sql("SELECT id,study_plan_id,block_id,is_completed,completed_at FROM schedule_progress WHERE study_plan_id=:p").param("p",planId).query().listOfRows();
    }
    @PostMapping("/progress") @ResponseStatus(HttpStatus.CREATED)
    public Map<String,Object> progress(@Valid @RequestBody ProgressRequest r) {
        assertPlan(r.studyPlanId());
        return jdbc.sql("""
          INSERT INTO schedule_progress(id,study_plan_id,block_id,is_completed,completed_at)
          VALUES(gen_random_uuid(),:p,:b,:done,CASE WHEN :done THEN now() ELSE NULL END)
          ON CONFLICT(study_plan_id,block_id) DO UPDATE SET is_completed=:done,completed_at=CASE WHEN :done THEN now() ELSE NULL END
          RETURNING id,study_plan_id,block_id,is_completed,completed_at
          """)
          .param("p",r.studyPlanId()).param("b",r.blockId()).param("done",r.isCompleted()).query().singleRow();
    }
    @GetMapping("/stats/{planId}") public Map<String,Object> stats(@PathVariable UUID planId) {
        assertPlan(planId);
        return jdbc.sql("SELECT COUNT(*) total_blocks,COUNT(*) FILTER(WHERE is_completed) completed_blocks FROM schedule_progress WHERE study_plan_id=:p").param("p",planId).query().singleRow();
    }
    private void assertPlan(UUID id){if(jdbc.sql("SELECT COUNT(*) FROM study_plans WHERE id=:p AND user_id=:u").param("p",id).param("u",currentUser.id()).query(Integer.class).single()==0)throw new NoSuchElementException("Plano não encontrado");}
}
