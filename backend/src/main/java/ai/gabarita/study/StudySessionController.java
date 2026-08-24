package ai.gabarita.study;

import ai.gabarita.auth.CurrentUser;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/study/sessions")
public class StudySessionController {
    private final StudySessionService service;
    private final CurrentUser currentUser;
    public StudySessionController(StudySessionService service,CurrentUser currentUser){this.service=service;this.currentUser=currentUser;}
    public record PauseInput(String reason){}
    public record FinishInput(@Min(0) Integer questionsAnswered,@Min(0) Integer correctAnswers,String notes){}
    public record CancelInput(String notes){}
    public record QuestionStartInput(@NotNull UUID planId,String mode,@Min(5) @Max(120) Integer focusMinutes,String device,UUID dailyTaskId){}
    public record QuestionAnswerInput(@NotBlank String questionId,boolean correct){}
    @PostMapping("/questions") public Map<String,Object> startQuestions(@Valid @RequestBody QuestionStartInput input){return service.startQuestionPractice(currentUser.id(),input.planId(),input.mode(),input.focusMinutes()==null?25:input.focusMinutes(),input.device(),input.dailyTaskId());}
    @PostMapping("/{id}/questions") public Map<String,Object> recordQuestion(@PathVariable UUID id,@Valid @RequestBody QuestionAnswerInput input){return service.recordQuestion(currentUser.id(),id,input.questionId(),input.correct());}
    @PostMapping("/{id}/finish-questions") public Map<String,Object> finishQuestions(@PathVariable UUID id,@RequestBody(required=false) CancelInput input){return service.finishQuestionPractice(currentUser.id(),id,input==null?null:input.notes());}
    @GetMapping("/active") public Map<String,Object> active(){return service.activeOrEmpty(currentUser.id());}
    @PostMapping("/{id}/pause") public Map<String,Object> pause(@PathVariable UUID id,@RequestBody(required=false) PauseInput input){return service.pause(currentUser.id(),id,input==null?null:input.reason());}
    @PostMapping("/{id}/resume") public Map<String,Object> resume(@PathVariable UUID id){return service.resume(currentUser.id(),id);}
    @PostMapping("/{id}/complete-focus") public Map<String,Object> completeFocus(@PathVariable UUID id){return service.completePomodoroFocus(currentUser.id(),id);}
    @PostMapping("/{id}/finish") public Map<String,Object> finish(@PathVariable UUID id,@Valid @RequestBody(required=false) FinishInput input){
        var value=input==null?new FinishInput(0,0,null):input;
        return service.finish(currentUser.id(),id,value.questionsAnswered()==null?0:value.questionsAnswered(),value.correctAnswers()==null?0:value.correctAnswers(),value.notes());
    }
    @PostMapping("/{id}/cancel") public Map<String,Object> cancel(@PathVariable UUID id,@RequestBody(required=false) CancelInput input){return service.cancel(currentUser.id(),id,input==null?null:input.notes());}
}
