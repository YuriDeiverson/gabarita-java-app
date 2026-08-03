package ai.gabarita.study;

import ai.gabarita.auth.CurrentUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.util.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/study")
public class DailyStudyController {
    private final DailyStudyService daily; private final StudySessionService sessions;
    private final CurrentUser currentUser;
    public DailyStudyController(DailyStudyService daily,StudySessionService sessions,CurrentUser currentUser){this.daily=daily;this.sessions=sessions;this.currentUser=currentUser;}
    public record StartInput(String mode,com.fasterxml.jackson.databind.JsonNode pomodoro,String device){}
    public record ReviewResult(@Min(1) int questionsAnswered,@Min(0) int correctAnswers){}
    public record RebalanceInput(@Min(30) @Max(720) int availableMinutes){}

    @GetMapping("/today") public Map<String,Object> today(){return daily.today();}
    @GetMapping("/next") public Map<String,Object> next(@RequestParam(required=false) UUID planId){return planId==null?daily.next():daily.next(planId);}
    @PostMapping("/today/rebalance") public Map<String,Object> rebalance(@Valid @RequestBody RebalanceInput input){return daily.rebalance(input.availableMinutes());}
    @PostMapping("/tasks/{id}/skip-questions") public Map<String,Object> skipQuestions(@PathVariable UUID id){return daily.skipOptionalQuestions(id);}
    @PostMapping("/tasks/{id}/start") public Map<String,Object> start(@PathVariable UUID id,@RequestBody(required=false) StartInput input){
        var value=input==null?new StartInput("FREE",null,null):input;
        return sessions.start(currentUser.id(),id,value.mode(),value.pomodoro(),value.device());
    }
    @PostMapping("/topics/{id}/review/start") public Map<String,Object> startReview(@PathVariable UUID id,@RequestBody(required=false) StartInput input){
        var value=input==null?new StartInput("FREE",null,null):input;
        return sessions.startReview(currentUser.id(),id,value.mode(),value.pomodoro(),value.device());
    }
    @GetMapping("/reviews/today") public List<Map<String,Object>> reviews(){return daily.reviews(LocalDate.now(),50);}
    @PostMapping("/reviews/{id}/complete") public Map<String,Object> review(@PathVariable UUID id,@Valid @RequestBody ReviewResult result){return daily.completeReview(id,result.questionsAnswered(),result.correctAnswers());}
}
