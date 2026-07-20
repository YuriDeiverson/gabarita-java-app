package ai.gabarita.plan;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.*;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/study-plans")
public class StudyPlanController {
    public static final UUID DEMO_USER = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private final StudyPlanService service;
    public StudyPlanController(StudyPlanService service) { this.service = service; }

    public record AvailabilityInput(@Min(0) @Max(6) int weekday, @NotNull LocalTime startTime,
                                    @NotNull LocalTime endTime, Integer blockMinutes, Integer breakMinutes) {}
    public record UnavailableInput(@NotNull OffsetDateTime startsAt, @NotNull OffsetDateTime endsAt, String reason) {}
    public record PlanRequest(String courseId, UUID examId, @NotBlank String title, @NotNull LocalDate examDate,
                              Integer hoursPerDay, Integer daysPerWeek, Integer totalWeeks,
                              @Min(15) Integer blockMinutes, @Min(0) Integer breakMinutes,
                              Integer finalSprintDays, Integer weeklyGoalMinutes, Integer monthlyGoalMinutes,
                              Boolean template, List<UUID> topicIds, List<AvailabilityInput> availability,
                              List<UnavailableInput> unavailablePeriods, JsonNode studySections,
                              JsonNode scheduleWeeks, JsonNode settings) {}

    @GetMapping public List<Map<String,Object>> all(@RequestParam(defaultValue = "false") boolean includeArchived) {
        return service.all(DEMO_USER, includeArchived);
    }
    @GetMapping("/{id}") public Map<String,Object> one(@PathVariable UUID id) { return service.one(id, DEMO_USER); }
    @GetMapping("/active/current") public Map<String,Object> active() { return service.active(DEMO_USER); }
    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public Map<String,Object> create(@Valid @RequestBody PlanRequest request) { return service.create(DEMO_USER, request); }
    @PutMapping("/{id}") public Map<String,Object> update(@PathVariable UUID id, @Valid @RequestBody PlanRequest request) {
        return service.update(id, DEMO_USER, request);
    }
    @PostMapping("/{id}/duplicate") @ResponseStatus(HttpStatus.CREATED)
    public Map<String,Object> duplicate(@PathVariable UUID id, @RequestParam(required=false) String title) {
        return service.duplicate(id, DEMO_USER, title);
    }
    @PatchMapping("/{id}/activate") public Map<String,Object> activate(@PathVariable UUID id) { return service.activate(id, DEMO_USER); }
    @PatchMapping("/{id}/archive") public Map<String,Object> archive(@PathVariable UUID id) { return service.archive(id, DEMO_USER); }
    @PatchMapping("/{id}/restore") public Map<String,Object> restore(@PathVariable UUID id) { return service.restore(id, DEMO_USER); }
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) { service.delete(id, DEMO_USER); }
    @GetMapping("/{id}/history") public List<Map<String,Object>> history(@PathVariable UUID id) { return service.history(id, DEMO_USER); }
}
