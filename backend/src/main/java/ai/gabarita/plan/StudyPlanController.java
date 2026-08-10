package ai.gabarita.plan;

import ai.gabarita.auth.CurrentUser;
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
    private final StudyPlanService service;
    private final CurrentUser currentUser;
    public StudyPlanController(StudyPlanService service,CurrentUser currentUser) { this.service = service;this.currentUser=currentUser; }

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
        return service.all(currentUser.id(), includeArchived);
    }
    @GetMapping("/summaries") public List<Map<String,Object>> summaries() {
        return service.summaries(currentUser.id());
    }
    @GetMapping("/{id}") public Map<String,Object> one(@PathVariable UUID id) { return service.one(id, currentUser.id()); }
    @GetMapping("/active/current") public Map<String,Object> active() { return service.active(currentUser.id()); }
    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public Map<String,Object> create(@Valid @RequestBody PlanRequest request) { return service.create(currentUser.id(), request); }
    @PutMapping("/{id}") public Map<String,Object> update(@PathVariable UUID id, @Valid @RequestBody PlanRequest request) {
        return service.update(id, currentUser.id(), request);
    }
    @PostMapping("/{id}/duplicate") @ResponseStatus(HttpStatus.CREATED)
    public Map<String,Object> duplicate(@PathVariable UUID id, @RequestParam(required=false) String title) {
        return service.duplicate(id, currentUser.id(), title);
    }
    @PatchMapping("/{id}/activate") public Map<String,Object> activate(@PathVariable UUID id) { return service.activate(id, currentUser.id()); }
    @PatchMapping("/{id}/archive") public Map<String,Object> archive(@PathVariable UUID id) { return service.archive(id, currentUser.id()); }
    @PatchMapping("/{id}/restore") public Map<String,Object> restore(@PathVariable UUID id) { return service.restore(id, currentUser.id()); }
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) { service.delete(id, currentUser.id()); }
    @GetMapping("/{id}/history") public List<Map<String,Object>> history(@PathVariable UUID id) { return service.history(id, currentUser.id()); }
}
