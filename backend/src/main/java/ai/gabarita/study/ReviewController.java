package ai.gabarita.study;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.util.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {
    private final DailyStudyService daily;
    public ReviewController(DailyStudyService daily){this.daily=daily;}
    public record Result(@Min(1) int questionsAnswered,@Min(0) int correctAnswers){}
    @GetMapping("/today") public List<Map<String,Object>> today(){return daily.reviews(LocalDate.now(),50);}
    @PostMapping("/{id}/complete") public Map<String,Object> complete(@PathVariable UUID id,@Valid @RequestBody Result result){return daily.completeReview(id,result.questionsAnswered(),result.correctAnswers());}
}
